import { createHash, randomInt } from "crypto";
import { sendOTPEmail } from "./email-service.js";

/**
 * OTP storage interface
 */
interface OTPData {
  email: string;
  hashedOTP: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

/**
 * In-memory OTP storage
 * In production, use Redis or a database for distributed systems
 */
const otpStore = new Map<string, OTPData>();

/**
 * Rate limiting: Track OTP requests per email/IP
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// OTP configuration
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_OTP_ATTEMPTS = 5;
const MAX_OTP_REQUESTS_PER_HOUR = 5; // Per email address

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for secure storage
 */
function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

/**
 * Check rate limiting for OTP requests
 */
function checkRateLimit(email: string): { allowed: boolean; resetIn?: number } {
  const key = `otp_request:${email}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    // Reset or create new record
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    });
    return { allowed: true };
  }

  if (record.count >= MAX_OTP_REQUESTS_PER_HOUR) {
    const resetIn = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, resetIn };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Generate and send OTP to email
 */
export async function generateAndSendOTP(email: string): Promise<{ success: boolean; message: string; resendCooldown?: number }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  // Check rate limiting
  const rateLimit = checkRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many OTP requests. Please try again in ${rateLimit.resetIn} seconds.`,
    };
  }

  // Check if there's an existing OTP and if resend is allowed
  const existingOTP = otpStore.get(email);
  if (existingOTP) {
    const timeSinceLastOTP = Date.now() - existingOTP.createdAt;
    if (timeSinceLastOTP < OTP_RESEND_COOLDOWN_MS) {
      const cooldownRemaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOTP) / 1000);
      return {
        success: false,
        message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
        resendCooldown: cooldownRemaining,
      };
    }
  }

  // Generate new OTP
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);
  const now = Date.now();

  // Store OTP data
  otpStore.set(email, {
    email,
    hashedOTP,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    verified: false,
  });

  // Send OTP via email
  try {
    await sendOTPEmail(email, otp);
    return {
      success: true,
      message: "OTP sent successfully to your email",
      resendCooldown: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
    };
  } catch (error) {
    // Remove OTP from store if email sending failed
    otpStore.delete(email);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send OTP email",
    };
  }
}

/**
 * Verify OTP
 */
export function verifyOTP(email: string, otp: string): { success: boolean; message: string } {
  const otpData = otpStore.get(email);

  if (!otpData) {
    return { success: false, message: "No OTP found for this email. Please request a new OTP." };
  }

  // Check if already verified
  if (otpData.verified) {
    return { success: false, message: "Email already verified" };
  }

  // Check if expired
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: "OTP has expired. Please request a new OTP." };
  }

  // Check attempt limit
  if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(email);
    return { success: false, message: "Too many failed attempts. Please request a new OTP." };
  }

  // Verify OTP
  const hashedInput = hashOTP(otp);
  if (hashedInput !== otpData.hashedOTP) {
    otpData.attempts++;
    return {
      success: false,
      message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpData.attempts} attempts remaining.`,
    };
  }

  // Mark as verified
  otpData.verified = true;
  return { success: true, message: "Email verified successfully" };
}

/**
 * Check if email is verified
 */
export function isEmailVerified(email: string): boolean {
  const otpData = otpStore.get(email);
  return otpData?.verified === true && Date.now() <= otpData.expiresAt;
}

/**
 * Get resend cooldown time remaining
 */
export function getResendCooldown(email: string): number {
  const otpData = otpStore.get(email);
  if (!otpData) return 0;

  const timeSinceLastOTP = Date.now() - otpData.createdAt;
  if (timeSinceLastOTP >= OTP_RESEND_COOLDOWN_MS) return 0;

  return Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOTP) / 1000);
}

/**
 * Clean up expired OTPs (run periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = Date.now();
  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt + 60 * 1000) { // Keep for 1 minute after expiry
      otpStore.delete(email);
    }
  }

  // Clean up rate limit store
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

/**
 * Remove verified OTP after account creation (optional cleanup)
 */
export function removeVerifiedOTP(email: string): void {
  otpStore.delete(email);
}

