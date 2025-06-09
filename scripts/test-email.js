// Test script to verify email configuration
const nodemailer = require("nodemailer");

// Get environment variables
require("dotenv").config();

// Log the email configuration (without sensitive data)
console.log("Email Configuration:");
console.log("- EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("- EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("- EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("- EMAIL_USER:", process.env.EMAIL_USER);
console.log("- EMAIL_SECURE:", process.env.EMAIL_SECURE);
console.log(
  "- PASSWORD LENGTH:",
  process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : "Not set"
);

// Create a transporter with the environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug output
});

// Test email content
const mailOptions = {
  from: `"PlanetQAi Test" <${process.env.EMAIL_FROM}>`,
  to: "achiandoomollo64@gmail.com", // Send to yourself for testing
  subject: "PlanetQAi Email Test",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4a5568;">PlanetQAi Email Test</h2>
      <p>This is a test email to verify that your email configuration is working correctly.</p>
      <p>If you're seeing this, your email settings are configured properly!</p>
      <p>App URL: ${process.env.NEXT_PUBLIC_APP_URL}</p>
      <p>Time sent: ${new Date().toISOString()}</p>
    </div>
  `,
  text: "This is a test email to verify that your email configuration is working correctly. If you're seeing this, your email settings are configured properly!",
};

// Verify connection configuration
console.log("Verifying connection configuration...");
transporter.verify(function (error, success) {
  if (error) {
    console.error("Connection verification failed:", error);
    console.log("\nPossible solutions:");
    console.log("1. Check if your EMAIL_PASSWORD is correct (no spaces)");
    console.log(
      "2. Make sure you've generated an App Password if using Gmail with 2FA"
    );
    console.log(
      "3. Check if your Gmail account allows less secure apps (if not using App Password)"
    );
    console.log(
      "4. Verify that your EMAIL_USER matches the email used to generate the App Password"
    );
  } else {
    console.log("Server is ready to take our messages");

    // Send mail with defined transport object
    console.log("Sending test email...");
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return;
      }
      console.log("Email sent successfully!");
      console.log("Message ID:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    });
  }
});
