import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { songId, taskId } = await request.json();

    // Validate required fields
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Find the song in the database
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { user: true }
    });

    // Check if the song exists and belongs to the current user
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    if (song.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this song' }, { status: 403 });
    }

    // Check if credits have already been deducted
    const hasCreditDeductionTag = song.tags && song.tags.some(tag => tag === 'credits_deducted:true');
    if (hasCreditDeductionTag) {
      return NextResponse.json({
        success: true,
        message: 'Credits already deducted for this song',
        song
      });
    }

    // Determine how many credits to deduct
    // Use the song's creditsUsed field if available, otherwise estimate based on style/complexity
    let creditsToDeduct = song.creditsUsed || 0;
    
    if (creditsToDeduct === 0) {
      // Fallback estimation if no credits were specified
      creditsToDeduct = 10; // Default value
      
      // Adjust based on style if available
      if (song.tags) {
        const styleTag = song.tags.find(tag => tag.startsWith('style:'));
        if (styleTag) {
          const style = styleTag.split(':')[1];
          // More complex styles cost more
          if (['orchestral', 'cinematic', 'classical'].includes(style)) {
            creditsToDeduct = 15;
          } else if (['rock', 'jazz', 'electronic'].includes(style)) {
            creditsToDeduct = 12;
          }
        }
      }
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Make sure not to deduct more credits than the user has
    creditsToDeduct = Math.min(creditsToDeduct, user.credits);

    // Update the song and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the song with the credits used and add a tag to indicate credits were deducted
      let updatedTags = [...(song.tags || [])];
      // Remove any existing credit deduction tags
      updatedTags = updatedTags.filter(tag => !tag.startsWith('credits_deducted:'));
      // Add the new credit deduction tag
      updatedTags.push('credits_deducted:true');
      
      const updatedSong = await tx.song.update({
        where: { id: songId },
        data: {
          creditsUsed: creditsToDeduct,
          tags: updatedTags
        }
      });

      // Deduct credits from the user
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { decrement: creditsToDeduct },
          totalCreditsUsed: { increment: creditsToDeduct }
        }
      });

      // Log the credit usage
      await tx.creditLog.create({
        data: {
          userId: user.id,
          amount: -creditsToDeduct,
          balanceAfter: updatedUser.credits,
          description: "Song generation (completed)",
          relatedEntityType: "Song",
          relatedEntityId: songId
        }
      });

      return { updatedSong, updatedUser, creditsDeducted: creditsToDeduct };
    });

    return NextResponse.json({
      success: true,
      song: result.updatedSong,
      creditsDeducted: result.creditsDeducted,
      remainingCredits: result.updatedUser.credits
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
