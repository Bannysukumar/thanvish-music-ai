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
    console.log("[checkSubscriptionLimits] Checking limits for userId:", userId);
    
    // Get user document
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error("[checkSubscriptionLimits] User document not found for userId:", userId);
      return {
        allowed: false,
        reason: "User not found",
      };
    }
    
    const userData = userDoc.data();
    console.log("[checkSubscriptionLimits] User data:", {
      subscriptionStatus: userData?.subscriptionStatus,
      planId: userData?.planId,
      role: userData?.role,
    });
    
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
      console.warn("[checkSubscriptionLimits] No planId found, using default limits");
      // Default limits if no plan assigned (allow generation but with default limits)
      const dailyLimit = 10; // Default daily limit
      const monthlyLimit = 100; // Default monthly limit
      
      // Get or initialize usage counters with default limits
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const lastDailyReset = userData?.lastDailyReset?.toDate?.() || null;
      const lastMonthlyReset = userData?.lastMonthlyReset?.toDate?.() || null;
      
      let dailyUsed = userData?.dailyGenerationUsed || 0;
      let monthlyUsed = userData?.monthlyGenerationUsed || 0;
      
      if (!lastDailyReset || lastDailyReset < today) {
        dailyUsed = 0;
      }
      
      if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
        monthlyUsed = 0;
      }
      
      const dailyRemaining = dailyLimit - dailyUsed;
      const monthlyRemaining = monthlyLimit - monthlyUsed;
      
      if (dailyRemaining <= 0 || monthlyRemaining <= 0) {
        return {
          allowed: false,
          reason: "You've reached your generation limit. Please upgrade your plan.",
          dailyRemaining: Math.max(0, dailyRemaining),
          monthlyRemaining: Math.max(0, monthlyRemaining),
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
    }
    
    console.log("[checkSubscriptionLimits] Fetching plan:", planId);
    const planRef = adminDb.collection("subscriptionPlans").doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      console.error("[checkSubscriptionLimits] Plan document not found:", planId);
      // Fallback to default limits if plan not found
      const dailyLimit = 10;
      const monthlyLimit = 100;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const lastDailyReset = userData?.lastDailyReset?.toDate?.() || null;
      const lastMonthlyReset = userData?.lastMonthlyReset?.toDate?.() || null;
      
      let dailyUsed = userData?.dailyGenerationUsed || 0;
      let monthlyUsed = userData?.monthlyGenerationUsed || 0;
      
      if (!lastDailyReset || lastDailyReset < today) {
        dailyUsed = 0;
      }
      
      if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
        monthlyUsed = 0;
      }
      
      const dailyRemaining = dailyLimit - dailyUsed;
      const monthlyRemaining = monthlyLimit - monthlyUsed;
      
      return {
        allowed: dailyRemaining > 0 && monthlyRemaining > 0,
        reason: dailyRemaining <= 0 || monthlyRemaining <= 0 
          ? "You've reached your generation limit. Please upgrade your plan."
          : undefined,
        dailyRemaining: Math.max(0, dailyRemaining),
        monthlyRemaining: Math.max(0, monthlyRemaining),
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
      };
    }
    
    const planData = planDoc.data();
    console.log("[checkSubscriptionLimits] Plan data:", {
      dailyGenerations: planData?.usageLimits?.dailyGenerations,
      monthlyGenerations: planData?.usageLimits?.monthlyGenerations,
    });
    
    const dailyLimit = planData?.usageLimits?.dailyGenerations ?? 10;
    const monthlyLimit = planData?.usageLimits?.monthlyGenerations ?? 100;
    
    // Get or initialize usage counters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get last reset dates (handle both Timestamp and Date formats)
    let lastDailyReset: Date | null = null;
    let lastMonthlyReset: Date | null = null;
    
    try {
      if (userData?.lastDailyReset) {
        lastDailyReset = userData.lastDailyReset.toDate ? userData.lastDailyReset.toDate() : 
                        (userData.lastDailyReset instanceof Date ? userData.lastDailyReset : 
                         new Date(userData.lastDailyReset));
      }
    } catch (e) {
      console.warn("[checkSubscriptionLimits] Error parsing lastDailyReset:", e);
    }
    
    try {
      if (userData?.lastMonthlyReset) {
        lastMonthlyReset = userData.lastMonthlyReset.toDate ? userData.lastMonthlyReset.toDate() : 
                          (userData.lastMonthlyReset instanceof Date ? userData.lastMonthlyReset : 
                           new Date(userData.lastMonthlyReset));
      }
    } catch (e) {
      console.warn("[checkSubscriptionLimits] Error parsing lastMonthlyReset:", e);
    }
    
    // Reset daily counter if needed
    let dailyUsed = userData?.dailyGenerationUsed || 0;
    let monthlyUsed = userData?.monthlyGenerationUsed || 0;
    
    if (!lastDailyReset || lastDailyReset < today) {
      console.log("[checkSubscriptionLimits] Resetting daily counter");
      dailyUsed = 0;
      try {
        await userRef.update({
          dailyGenerationUsed: 0,
          lastDailyReset: admin.firestore.Timestamp.fromDate(today),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError: any) {
        console.error("[checkSubscriptionLimits] Error updating daily reset:", updateError);
        // Continue even if update fails
      }
    }
    
    // Reset monthly counter if needed
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      console.log("[checkSubscriptionLimits] Resetting monthly counter");
      monthlyUsed = 0;
      try {
        await userRef.update({
          monthlyGenerationUsed: 0,
          lastMonthlyReset: admin.firestore.Timestamp.fromDate(monthStart),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError: any) {
        console.error("[checkSubscriptionLimits] Error updating monthly reset:", updateError);
        // Continue even if update fails
      }
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
    console.error("[checkSubscriptionLimits] Error checking subscription limits:", error);
    console.error("[checkSubscriptionLimits] Error stack:", error.stack);
    console.error("[checkSubscriptionLimits] Error details:", {
      message: error.message,
      code: error.code,
      userId,
    });
    
    // In case of error, allow generation but log the issue
    // This prevents blocking users due to system errors
    console.warn("[checkSubscriptionLimits] Allowing generation due to error (fail-open)");
    return {
      allowed: true,
      reason: undefined,
      dailyRemaining: 999,
      monthlyRemaining: 999,
      dailyLimit: 999,
      monthlyLimit: 999,
      dailyUsed: 0,
      monthlyUsed: 0,
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

