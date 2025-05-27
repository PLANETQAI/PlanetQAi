/**
 * Email templates for various notifications
 */

// Base URL for links in emails
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

/**
 * Generate password reset email template
 * @param {string} userName - User's full name
 * @param {string} resetToken - Password reset token
 * @param {string} userId - User ID for verification
 * @returns {Object} - HTML and text versions of the email
 */
export const passwordResetTemplate = (userName, resetToken, userId) => {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}&userId=${userId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
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
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .code {
          font-family: monospace;
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin: 15px 0;
          font-size: 18px;
          text-align: center;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reset Your Password</h1>
      </div>
      
      <p>Hello ${userName || 'there'},</p>
      
      <p>We received a request to reset your password for your PlanetQAi account. To reset your password, please click the button below:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
      
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      
      <p>This link will expire in 30 minutes for security reasons.</p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PlanetQAi. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Reset Your Password
    
    Hello ${userName || 'there'},
    
    We received a request to reset your password for your PlanetQAi account. To reset your password, please visit this link:
    
    ${resetLink}
    
    If you didn't request a password reset, you can safely ignore this email.
    
    This link will expire in 30 minutes for security reasons.
    
    © ${new Date().getFullYear()} PlanetQAi. All rights reserved.
    This is an automated email, please do not reply.
  `;
  
  return { html, text };
};

/**
 * Generate account verification email template
 * @param {string} userName - User's full name
 * @param {string} verificationToken - Verification token
 * @param {string} userId - User ID for verification
 * @param {string} verificationCode - The 6-digit verification code
 * @returns {Object} - HTML and text versions of the email
 */
export const accountVerificationTemplate = (userName, verificationToken, userId, verificationCode) => {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/verify-account?token=${verificationToken}&userId=${userId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
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
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .welcome {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .credits {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to PlanetQAi!</h1>
      </div>
      
      <p class="welcome">Hello ${userName || 'there'},</p>
      
      <p>Thank you for signing up with PlanetQAi! To complete your registration and start generating amazing music, please verify your account by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify My Account</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
      
      <p>Alternatively, you can enter this verification code manually:</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-family: monospace; background-color: #f5f5f5; padding: 15px; border-radius: 4px; display: inline-block; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${verificationCode || '------'}
        </div>
      </div>
      
      <div class="credits">
        <p>You've received <strong>50 free credits</strong> to start creating music right away!</p>
      </div>
      
      <p>If you didn't create an account with PlanetQAi, you can safely ignore this email.</p>
      
      <p>This link will expire in 24 hours for security reasons.</p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PlanetQAi. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Welcome to PlanetQAi!
    
    Hello ${userName || 'there'},
    
    Thank you for signing up with PlanetQAi! To complete your registration and start generating amazing music, please visit this link to verify your account:
    
    ${verificationLink}
    
    Alternatively, you can use this verification code: ${verificationCode || '------'}
    
    You've received 50 free credits to start creating music right away!
    
    If you didn't create an account with PlanetQAi, you can safely ignore this email.
    
    This link will expire in 24 hours for security reasons.
    
    © ${new Date().getFullYear()} PlanetQAi. All rights reserved.
    This is an automated email, please do not reply.
  `;
  
  return { html, text };
};

export default {
  passwordResetTemplate,
  accountVerificationTemplate
};
