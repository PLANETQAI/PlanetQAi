
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/utils/email/emailService';
import { shareEmailTemplate } from '@/utils/email/emailTemplates';

export async function POST(request) {
  try {
    const { songIds, name, isPublic, sharedById, emails } = await request.json();

    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return NextResponse.json({ error: 'Song IDs are required.' }, { status: 400 });
    }

    if (!sharedById) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const share = await prisma.share.create({
      data: {
        name,
        isPublic,
        sharedById,
        songs: {
          create: songIds.map(songId => ({ songId }))
        }
      },
      include: {
        songs: { include: { song: true } },
        sharedBy: true
      }
    });

    if (emails && emails.length > 0) {
      console.log('Attempting to send emails...');
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${share.shareableLink}`;
      const subject = `${share.sharedBy.fullName} has shared songs with you`;

      for (const email of emails) {
        try {
          console.log(`Preparing email for: ${email}`);
          const { html, text } = shareEmailTemplate({ 
            sharerName: share.sharedBy.fullName, 
            shareUrl, 
            songs: share.songs.map(s => s.song)
          });
          console.log('Email template generated.');
          await sendEmail(email, subject, html, text);
          console.log(`Email sent successfully to: ${email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      }
    }

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ error: 'An error occurred while creating the share.' }, { status: 500 });
  }
}
