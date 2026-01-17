import { adminDb } from "./firebase-admin";
import * as admin from "firebase-admin";

export interface SubscriptionLimitCheck {
  allowed: boolean;
  reason?: string;
  dailyRemaining?: number;
  monthlyRemaining?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyUsed?: number;
  monthlyUsed?: number;
}

/**
 * Check if user can generate music based on subscription status and limits
 */
export async function checkSubscriptionLimits(userId: string): Promise<SubscriptionLimitCheck> {
  try {
    // Get user document
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return {
        allowed: false,
        reason: "User not found",
      };
    }
    
    const userData = userDoc.data();
    const subscriptionStatus = userData?.subscriptionStatus?.toLowerCase() || "expired";
    
    // Check subscription status
    if (subscriptionStatus === "suspended") {
      return {
        allowed: false,
        reason: "Your account is temporarily suspended. Contact support.",
      };
    }
    
    if (subscriptionStatus === "expired") {
      return {
        allowed: false,
        reason: "Your plan validity has ended. Please upgrade to generate music.",
      };
    }
    
    // Check if status is allowed (ACTIVE, TRIAL, or FREE)
    if (!["active", "trial", "free"].includes(subscriptionStatus)) {
      return {
        allowed: false,
        reason: "Your subscription is not active. Please upgrade to generate music.",
      };
    }
    
    // Check validity period
    const subscriptionEndDate = userData?.subscriptionEndDate?.toDate?.() || 
                                 userData?.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null;
    
    if (subscriptionEndDate && subscriptionEndDate < new Date()) {
      // Update user status to expired
      await userRef.update({
        subscriptionStatus: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return {
        allowed: false,
        reason: "Your plan validity has ended. Please upgrade to generate music.",
      };
    }
    
    // Get plan details
    const planId = userData?.planId;
    if (!planId) {
      return {
        allowed: false,
        reason: "No subscription plan assigned. Please contact support.",
      };
    }
    
    const planRef = adminDb.collection("subscriptionPlans").doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return {
        allowed: false,
        reason: "Subscription plan not found. Please contact support.",
      };
    }
    
    const planData = planDoc.data();
    const dailyLimit = planData?.usageLimits?.dailyGenerations ?? 0;
    const monthlyLimit = planData?.usageLimits?.monthlyGenerations ?? 0;
    
    // Get or initialize usage counters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get last reset dates
    const lastDailyReset = userData?.lastDailyReset?.toDate?.() || null;
    const lastMonthlyReset = userData?.lastMonthlyReset?.toDate?.() || null;
    
    // Reset daily counter if needed
    let dailyUsed = userData?.dailyGenerationUsed || 0;
    let monthlyUsed = userData?.monthlyGenerationUsed || 0;
    
    if (!lastDailyReset || lastDailyReset < today) {
      dailyUsed = 0;
      await userRef.update({
        dailyGenerationUsed: 0,
        lastDailyReset: admin.firestore.Timestamp.fromDate(today),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Reset monthly counter if needed
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      monthlyUsed = 0;
      await userRef.update({
        monthlyGenerationUsed: 0,
        lastMonthlyReset: admin.firestore.Timestamp.fromDate(monthStart),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Check limits
    const dailyRemaining = dailyLimit - dailyUsed;
    const monthlyRemaining = monthlyLimit - monthlyUsed;
    
    if (dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: "You've reached today's generation limit. Try again tomorrow or upgrade your plan.",
        dailyRemaining: 0,
        monthlyRemaining,
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
      };
    }
    
    if (monthlyRemaining <= 0) {
      return {
        allowed: false,
        reason: "You've reached this month's generation limit. It will reset next month, or you can upgrade now.",
        dailyRemaining,
        monthlyRemaining: 0,
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
      };
    }
    
    return {
      allowed: true,
      dailyRemaining,
      monthlyRemaining,
      dailyLimit,
      monthlyLimit,
      dailyUsed,
      monthlyUsed,
    };
  } catch (error: any) {
    console.error("Error checking subscription limits:", error);
    return {
      allowed: false,
      reason: "Error checking subscription limits. Please try again.",
    };
  }
}

/**
 * Increment generation counters after successful generation
 */
export async function incrementGenerationCounters(userId: string): Promise<void> {
  try {
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return;
    }
    
    const userData = userDoc.data();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get last reset dates
    const lastDailyReset = userData?.lastDailyReset?.toDate?.() || null;
    const lastMonthlyReset = userData?.lastMonthlyReset?.toDate?.() || null;
    
    // Reset counters if needed
    let dailyUsed = userData?.dailyGenerationUsed || 0;
    let monthlyUsed = userData?.monthlyGenerationUsed || 0;
    
    if (!lastDailyReset || lastDailyReset < today) {
      dailyUsed = 0;
    }
    
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      monthlyUsed = 0;
    }
    
    // Increment counters
    const updateData: any = {
      dailyGenerationUsed: dailyUsed + 1,
      monthlyGenerationUsed: monthlyUsed + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (!lastDailyReset || lastDailyReset < today) {
      updateData.lastDailyReset = admin.firestore.Timestamp.fromDate(today);
    }
    
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      updateData.lastMonthlyReset = admin.firestore.Timestamp.fromDate(monthStart);
    }
    
    await userRef.update(updateData);
  } catch (error: any) {
    console.error("Error incrementing generation counters:", error);
    // Don't throw - generation should still succeed even if counter update fails
  }
}

