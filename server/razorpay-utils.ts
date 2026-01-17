import Razorpay from "razorpay";
import crypto from "crypto";
import { adminDb, admin } from "./firebase-admin";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  enabled: boolean;
}

/**
 * Get Razorpay configuration from Firebase (admin-managed) or fallback to .env
 */
export async function getRazorpayConfig(): Promise<RazorpayConfig | null> {
  try {
    // First, try to get from Firebase (admin-managed)
    const settingsDoc = await adminDb.collection("adminSettings").doc("razorpay").get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data?.enabled && data?.keyId && data?.keySecret) {
        return {
          keyId: data.keyId,
          keySecret: data.keySecret,
          enabled: data.enabled === true,
        };
      }
    }
    
    // Fallback to .env
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (envKeyId && envKeySecret) {
      return {
        keyId: envKeyId,
        keySecret: envKeySecret,
        enabled: true, // Default to enabled if in .env
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting Razorpay config:", error);
    return null;
  }
}

/**
 * Get Razorpay instance (server-side only, uses keySecret)
 */
export async function getRazorpayInstance(): Promise<Razorpay | null> {
  const config = await getRazorpayConfig();
  
  if (!config || !config.enabled || !config.keySecret) {
    return null;
  }
  
  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
}

/**
 * Get Razorpay Key ID only (safe for client-side)
 */
export async function getRazorpayKeyId(): Promise<string | null> {
  const config = await getRazorpayConfig();
  return config?.enabled ? config.keyId : null;
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  try {
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");
    
    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  amount: number, // in paise (smallest currency unit)
  currency: string = "INR",
  receipt?: string,
  notes?: Record<string, string>
): Promise<{ orderId: string; amount: number; currency: string } | null> {
  try {
    const razorpay = await getRazorpayInstance();
    
    if (!razorpay) {
      throw new Error("Razorpay is not configured or disabled");
    }
    
    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };
    
    const order = await razorpay.orders.create(options);
    
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    throw new Error(`Failed to create payment order: ${error.message}`);
  }
}

/**
 * Verify and capture payment
 */
export async function verifyAndCapturePayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const config = await getRazorpayConfig();
    
    if (!config || !config.keySecret) {
      throw new Error("Razorpay is not configured");
    }
    
    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature, config.keySecret);
    
    if (!isValid) {
      console.error("Invalid payment signature");
      return false;
    }
    
    // Get Razorpay instance and verify payment
    const razorpay = await getRazorpayInstance();
    if (!razorpay) {
      throw new Error("Razorpay is not configured");
    }
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    // Check if payment is successful
    if (payment.status === "captured" || payment.status === "authorized") {
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

