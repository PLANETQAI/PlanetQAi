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

/**
 * Generate purchase receipt email template
 * @param {string} userName - User's full name
 * @param {number} creditsAmount - Amount of credits purchased
 * @param {number} paymentAmount - Amount paid in dollars
 * @param {string} transactionId - Stripe transaction ID
 * @param {string} packageName - Name of the credit package purchased
 * @returns {Object} - HTML and text versions of the email
 */
export const purchaseReceiptTemplate = (userName, creditsAmount, paymentAmount, transactionId, packageName) => {
  const baseUrl = getBaseUrl();
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Your Purchase</title>
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
        .receipt {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background-color: #f9f9f9;
        }
        .receipt-header {
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
          font-weight: bold;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .receipt-total {
          border-top: 1px solid #eee;
          margin-top: 15px;
          padding-top: 10px;
          font-weight: bold;
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You for Your Purchase!</h1>
      </div>
      
      <p>Hello ${userName || 'there'},</p>
      
      <p>Thank you for purchasing credits on PlanetQAi. Your account has been successfully credited, and you can start using them right away to generate amazing music!</p>
      
      <div class="receipt">
        <div class="receipt-header">RECEIPT</div>
        
        <div class="receipt-row">
          <span>Date:</span>
          <span>${date}</span>
        </div>
        
        <div class="receipt-row">
          <span>Transaction ID:</span>
          <span>${transactionId.substring(0, 8)}...${transactionId.substring(transactionId.length - 4)}</span>
        </div>
        
        <div class="receipt-row">
          <span>Package:</span>
          <span>${packageName || 'Credit Package'}</span>
        </div>
        
        <div class="receipt-row">
          <span>Credits Added:</span>
          <span>${creditsAmount}</span>
        </div>
        
        <div class="receipt-total">
          <div class="receipt-row">
            <span>Total:</span>
            <span>$${(paymentAmount / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${baseUrl}/dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <p>If you have any questions about your purchase, please contact our support team.</p>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PlanetQAi. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Thank You for Your Purchase!
    
    Hello ${userName || 'there'},
    
    Thank you for purchasing credits on PlanetQAi. Your account has been successfully credited, and you can start using them right away to generate amazing music!
    
    RECEIPT
    Date: ${date}
    Transaction ID: ${transactionId}
    Package: ${packageName || 'Credit Package'}
    Credits Added: ${creditsAmount}
    Total: $${(paymentAmount / 100).toFixed(2)}
    
    If you have any questions about your purchase, please contact our support team.
    
    © ${new Date().getFullYear()} PlanetQAi. All rights reserved.
    This is an automated email, please do not reply.
  `;
  
  return { html, text };
};

export default {
  passwordResetTemplate,
  accountVerificationTemplate,
  purchaseReceiptTemplate
};
