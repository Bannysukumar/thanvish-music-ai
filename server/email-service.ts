import nodemailer from "nodemailer";

/**
 * Email service configuration
 * Uses environment variables for SMTP settings
 */
const createTransporter = () => {
  // For development, use Gmail or other SMTP service
  // For production, configure with your email service provider
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@thanvish.com";

  // If no SMTP credentials are provided, use a test account (for development)
  if (!smtpUser || !smtpPassword) {
    console.warn("⚠️  SMTP credentials not configured. Using test account. Emails will not be sent in production.");
    // Return a test transporter (won't actually send emails)
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "test@ethereal.email",
        pass: "test",
      },
    });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

const transporter = createTransporter();

/**
 * Send OTP email to user
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@thanvish.com",
    to: email,
    subject: "Verify Your Email - Thanvish Music",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Thanvish Music</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in <strong>5 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this verification, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Thanvish Music. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Email - Thanvish Music
      
      Thank you for signing up! Please use the following OTP to verify your email address:
      
      ${otp}
      
      This OTP will expire in 5 minutes.
      
      If you didn't request this verification, please ignore this email.
      
      © ${new Date().getFullYear()} Thanvish Music. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
}

/**
 * Verify email transporter configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}

