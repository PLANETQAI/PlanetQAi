import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/utils/email/emailService';
import { songPurchaseTemplate } from '@/utils/email/emailTemplates';


export async function POST(req) {
  try {
    // Verify session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { songId, price, creditsUsed, isLyricsPurchased } = await req.json();
    if (!songId || price === undefined || creditsUsed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user with current credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        credits: true,
        email: true,
        fullName: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough credits
    if (user.credits < creditsUsed) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits', 
          availableCredits: user.credits,
          requiredCredits: creditsUsed
        }, 
        { status: 400 }
      );
    }

    // Check if song exists and is available
    const song = await prisma.song.findUnique({
      where: { 
        id: songId,
        isForSale: true 
      }
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found or not available for purchase' },
        { status: 404 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.songPurchase.findFirst({
      where: {
        userId: user.id,
        songId: song.id
      }
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this song' },
        { status: 400 }
      );
    }

    // Create purchase record and update user credits in a transaction
    const [purchase] = await prisma.$transaction([
      prisma.songPurchase.create({
        data: {
          userId: user.id,
          songId: song.id,
          price: price,
 
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          credits: { decrement: creditsUsed } 
        }
      })
    ]);

    // Send purchase confirmation email
    try {
      const emailHtml = songPurchaseTemplate(song, user, {
        price,
        creditsUsed,
        purchaseDate: new Date().toLocaleDateString()
      });

      await sendEmail({
        to: user.email,
        subject: `Your Purchase: ${song.title}`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Failed to send purchase email:', emailError);
      // Don't fail the request if email fails
    }
    try {
      const songOwner = await prisma.user.findUnique({
        where: { id: song.userId },
        select: { 
          email: true,
          fullName: true
        }
      });

      if (songOwner && songOwner.email) {
        const ownerEmailHtml = songSoldTemplate(
          song, 
          { email: user.email, fullName: user.fullName },
          {
            price,
            purchaseDate: new Date().toLocaleDateString()
          }
        );

        await sendEmail({
          to: songOwner.email,
          subject: `Your song was purchased: ${song.title}`,
          html: ownerEmailHtml
        });
      }
    } catch (ownerEmailError) {
      console.error('Failed to send owner notification email:', ownerEmailError);
      // Don't fail the request if email fails
    }


    return NextResponse.json({ 
      success: true, 
      purchase,
      remainingCredits: user.credits - creditsUsed
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}