import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { sendEmail } from '@/utils/email/emailService';

export async function POST(req) {
  try {
    // Get the session and check if the user is an admin
    const session = await auth();
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { subject, content, userGroup, isTest, testEmail } = body;
    
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }
    
    // For test emails
    if (isTest) {
      if (!testEmail) {
        return NextResponse.json(
          { error: 'Test email address is required' },
          { status: 400 }
        );
      }
      
      // Send test email
      await sendEmail(
        testEmail,
        subject,
        generateNewsletterHtml(content, testEmail),
        generateNewsletterText(content, testEmail)
      );
      
      return NextResponse.json({
        message: 'Test email sent successfully',
      });
    }
    
    // For actual newsletter sending
    // Build query based on user group
    let where = {};
    
    switch (userGroup) {
      case 'premium':
        where = { role: { in: ['Premium', 'Pro'] } };
        break;
      case 'basic':
        where = { role: 'Basic' };
        break;
      case 'unverified':
        where = { isVerified: false };
        break;
      case 'inactive':
        // Users who haven't created a song in the last 30 days
        where = {
          songs: {
            none: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        };
        break;
      case 'all':
      default:
        // All users, no filter
        break;
    }
    
    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the selected criteria' },
        { status: 404 }
      );
    }
    
    // Send emails in batches to avoid overloading the email service
    const batchSize = 50;
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      // Process each user in the batch
      const emailPromises = batch.map(async (user) => {
        try {
          await sendEmail(
            user.email,
            subject,
            generateNewsletterHtml(content, user.email, user.fullName),
            generateNewsletterText(content, user.email, user.fullName)
          );
          
          successCount++;
          return { success: true, userId: user.id };
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          failureCount++;
          return { success: false, userId: user.id, error: error.message };
        }
      });
      
      await Promise.all(emailPromises);
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Log the newsletter
    await prisma.newsletterLog.create({
      data: {
        subject,
        content,
        userGroup,
        sentBy: session.user.id,
        recipientCount: successCount,
        failureCount,
      },
    }).catch(error => {
      console.error('Failed to log newsletter:', error);
      // Continue execution even if logging fails
    });
    
    return NextResponse.json({
      message: 'Newsletter sent successfully',
      stats: {
        totalUsers: users.length,
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML content for newsletter
function generateNewsletterHtml(content, email, name = '') {
  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PlanetQAi Newsletter</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PlanetQAi</h1>
      </div>
      
      ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
      
      <div class="content">
        ${content}
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PlanetQAi. All rights reserved.</p>
        <p>
          You're receiving this email because you signed up for PlanetQAi.
          <br>
          <a href="${unsubscribeLink}">Unsubscribe</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate plain text content for newsletter
function generateNewsletterText(content, email, name = '') {
  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
  
  // Convert HTML to plain text (very basic conversion)
  const plainContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\n\s*\n/g, '\n\n'); // Remove extra line breaks
  
  return `
PlanetQAi Newsletter

${name ? `Hello ${name},` : 'Hello,'}

${plainContent}

© ${new Date().getFullYear()} PlanetQAi. All rights reserved.

You're receiving this email because you signed up for PlanetQAi.
To unsubscribe, visit: ${unsubscribeLink}
  `.trim();
}
