import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/utils/email/emailService';
import { shareEmailTemplate } from '@/utils/email/emailTemplates';

export async function POST(request) {
  try {
    const { shareableLink, emails } = await request.json();

    if (!shareableLink || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Shareable link and recipient emails are required.' }, { status: 400 });
    }

    const share = await prisma.share.findUnique({
      where: {
        shareableLink: shareableLink,
      },
      include: {
        songs: { include: { song: true } },
        sharedBy: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found.' }, { status: 404 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${share.shareableLink}`;
    const subject = `${share.sharedBy.fullName} has shared songs with you`;

    for (const email of emails) {
      try {
        const { html, text } = shareEmailTemplate({
          sharerName: share.sharedBy.fullName,
          shareUrl,
          songs: share.songs.map(s => s.song),
        });
        await sendEmail(email, subject, html, text);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        // Continue to try sending to other emails even if one fails
      }
    }

    return NextResponse.json({ message: 'Emails sent successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error sending share email:', error);
    return NextResponse.json({ error: 'An error occurred while sending the share email.' }, { status: 500 });
  }
}
