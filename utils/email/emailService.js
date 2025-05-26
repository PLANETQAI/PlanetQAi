import nodemailer from 'nodemailer';

// Create a transporter with environment variables
const createTransporter = () => {
  // For development, we can use a test account or console log
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    console.log('Using development email mode - emails will be logged to console');
    return {
      sendMail: async (mailOptions) => {
        console.log('========== EMAIL SENT ==========');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Content:', mailOptions.html || 'No HTML content');
        console.log('Text Content:', mailOptions.text || 'No text content');
        console.log('================================');
        return { messageId: 'dev-mode-' + Date.now() };
      }
    };
  }

  // For production, use actual SMTP settings
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (fallback)
 * @returns {Promise} - Resolves with send info
 */
export const sendEmail = async (to, subject, html, text) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"PlanetQAi" <${process.env.EMAIL_FROM || 'planetq@gmail.com'}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;
