import { adminDb, admin } from "./firebase-admin";

/**
 * Check if a doctor can create more programs based on their plan limits
 * @param doctorId - The doctor's user ID
 * @returns Object with canCreate (boolean), remaining (number), maxPrograms (number), error message if any
 */
export async function checkDoctorProgramLimit(doctorId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxPrograms: number;
  currentCount: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        remaining: 0,
        maxPrograms: 0,
        currentCount: 0,
        error: "Doctor not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a doctor
    if (userData?.role !== "doctor") {
      return {
        canCreate: false,
        remaining: 0,
        maxPrograms: 0,
        currentCount: 0,
        error: "User is not a doctor",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxPrograms: 0,
        currentCount: 0,
        error: "Doctor subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
        subscriptionStatus,
      };
    }

    // Check if plan is expired
    const subscriptionEndDate = userData?.subscriptionEndDate;
    if (subscriptionEndDate) {
      const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
      const now = new Date();
      if (endDate < now) {
        return {
          canCreate: false,
          remaining: 0,
          maxPrograms: userData?.maxProgramsCreatePerMonth || 0,
          currentCount: 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get max programs from user document (copied from plan)
    const maxPrograms = userData?.maxProgramsCreatePerMonth || 0;

    // Get current count and check if monthly reset is needed
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get last monthly reset date
    const lastMonthlyReset = userData?.lastProgramMonthlyReset?.toDate?.() || null;
    
    let currentCount = userData?.programsCreatedThisMonth || 0;
    
    // Reset monthly counter if needed
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      currentCount = 0;
      await userRef.update({
        programsCreatedThisMonth: 0,
        lastProgramMonthlyReset: admin.firestore.Timestamp.fromDate(monthStart),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Check if limit is reached
    if (maxPrograms === 0) {
      // 0 means unlimited (or not set), allow creation
      return {
        canCreate: true,
        remaining: 999999, // Unlimited
        maxPrograms: 0, // 0 means unlimited
        currentCount,
        subscriptionStatus,
      };
    }

    if (currentCount >= maxPrograms) {
      return {
        canCreate: false,
        remaining: 0,
        maxPrograms,
        currentCount,
        error: `You've reached your program creation limit for this month. Upgrade your plan to create more programs.`,
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxPrograms - currentCount,
      maxPrograms,
      currentCount,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking doctor program limit:", error);
    return {
      canCreate: false,
      remaining: 0,
      maxPrograms: 0,
      currentCount: 0,
      error: "Failed to check doctor limits: " + error.message,
    };
  }
}

/**
 * Check if a doctor can create more templates based on their plan limits
 * @param doctorId - The doctor's user ID
 * @returns Object with canCreate (boolean), remaining (number), maxTemplates (number), error message if any
 */
export async function checkDoctorTemplateLimit(doctorId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxTemplates: number;
  currentCount: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates: 0,
        currentCount: 0,
        error: "Doctor not found",
      };
    }

    const userData = userDoc.data();
    
    if (userData?.role !== "doctor") {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates: 0,
        currentCount: 0,
        error: "User is not a doctor",
      };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates: 0,
        currentCount: 0,
        error: "Doctor subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
        subscriptionStatus,
      };
    }

    const subscriptionEndDate = userData?.subscriptionEndDate;
    if (subscriptionEndDate) {
      const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
      const now = new Date();
      if (endDate < now) {
        return {
          canCreate: false,
          remaining: 0,
          maxTemplates: userData?.maxTemplatesCreatePerMonth || 0,
          currentCount: 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    const maxTemplates = userData?.maxTemplatesCreatePerMonth || 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthlyReset = userData?.lastTemplateMonthlyReset?.toDate?.() || null;
    
    let currentCount = userData?.templatesCreatedThisMonth || 0;
    
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      currentCount = 0;
      await userRef.update({
        templatesCreatedThisMonth: 0,
        lastTemplateMonthlyReset: admin.firestore.Timestamp.fromDate(monthStart),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (maxTemplates === 0) {
      return {
        canCreate: true,
        remaining: 999999,
        maxTemplates: 0,
        currentCount,
        subscriptionStatus,
      };
    }

    if (currentCount >= maxTemplates) {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates,
        currentCount,
        error: `You've reached your template creation limit for this month. Upgrade your plan to create more templates.`,
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxTemplates - currentCount,
      maxTemplates,
      currentCount,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking doctor template limit:", error);
    return {
      canCreate: false,
      remaining: 0,
      maxTemplates: 0,
      currentCount: 0,
      error: "Failed to check doctor limits: " + error.message,
    };
  }
}

/**
 * Check if a doctor can publish more articles based on their plan limits
 * @param doctorId - The doctor's user ID
 * @returns Object with canPublish (boolean), remaining (number), maxArticles (number), error message if any
 */
export async function checkDoctorArticleLimit(doctorId: string): Promise<{
  canPublish: boolean;
  remaining: number;
  maxArticles: number;
  currentCount: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canPublish: false,
        remaining: 0,
        maxArticles: 0,
        currentCount: 0,
        error: "Doctor not found",
      };
    }

    const userData = userDoc.data();
    
    if (userData?.role !== "doctor") {
      return {
        canPublish: false,
        remaining: 0,
        maxArticles: 0,
        currentCount: 0,
        error: "User is not a doctor",
      };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canPublish: false,
        remaining: 0,
        maxArticles: 0,
        currentCount: 0,
        error: "Doctor subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
        subscriptionStatus,
      };
    }

    const subscriptionEndDate = userData?.subscriptionEndDate;
    if (subscriptionEndDate) {
      const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
      const now = new Date();
      if (endDate < now) {
        return {
          canPublish: false,
          remaining: 0,
          maxArticles: userData?.maxArticlesPublishPerMonth || 0,
          currentCount: 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    const maxArticles = userData?.maxArticlesPublishPerMonth || 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthlyReset = userData?.lastArticleMonthlyReset?.toDate?.() || null;
    
    let currentCount = userData?.articlesPublishedThisMonth || 0;
    
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      currentCount = 0;
      await userRef.update({
        articlesPublishedThisMonth: 0,
        lastArticleMonthlyReset: admin.firestore.Timestamp.fromDate(monthStart),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (maxArticles === 0) {
      return {
        canPublish: true,
        remaining: 999999,
        maxArticles: 0,
        currentCount,
        subscriptionStatus,
      };
    }

    if (currentCount >= maxArticles) {
      return {
        canPublish: false,
        remaining: 0,
        maxArticles,
        currentCount,
        error: `You've reached your article publishing limit for this month. Upgrade your plan to publish more articles.`,
        subscriptionStatus,
      };
    }

    return {
      canPublish: true,
      remaining: maxArticles - currentCount,
      maxArticles,
      currentCount,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking doctor article limit:", error);
    return {
      canPublish: false,
      remaining: 0,
      maxArticles: 0,
      currentCount: 0,
      error: "Failed to check doctor limits: " + error.message,
    };
  }
}

/**
 * Increment doctor's program creation counter
 * @param doctorId - The doctor's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementDoctorProgramCount(doctorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: "Doctor not found" };
    }

    const userData = userDoc.data();
    if (userData?.role !== "doctor") {
      return { success: false, error: "User is not a doctor" };
    }

    // Check if monthly reset is needed
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthlyReset = userData?.lastProgramMonthlyReset?.toDate?.() || null;
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Reset if needed
    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      updateData.programsCreatedThisMonth = 1;
      updateData.lastProgramMonthlyReset = admin.firestore.Timestamp.fromDate(monthStart);
    } else {
      // Increment existing count
      updateData.programsCreatedThisMonth = admin.firestore.FieldValue.increment(1);
    }

    await userRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing doctor program count:", error);
    return { success: false, error: "Failed to increment program count: " + error.message };
  }
}

/**
 * Increment doctor's template creation counter
 * @param doctorId - The doctor's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementDoctorTemplateCount(doctorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: "Doctor not found" };
    }

    const userData = userDoc.data();
    if (userData?.role !== "doctor") {
      return { success: false, error: "User is not a doctor" };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthlyReset = userData?.lastTemplateMonthlyReset?.toDate?.() || null;
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      updateData.templatesCreatedThisMonth = 1;
      updateData.lastTemplateMonthlyReset = admin.firestore.Timestamp.fromDate(monthStart);
    } else {
      updateData.templatesCreatedThisMonth = admin.firestore.FieldValue.increment(1);
    }

    await userRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing doctor template count:", error);
    return { success: false, error: "Failed to increment template count: " + error.message };
  }
}

/**
 * Increment doctor's article publish counter (only when status changes to "published")
 * @param doctorId - The doctor's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementDoctorArticleCount(doctorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = adminDb.collection("users").doc(doctorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: "Doctor not found" };
    }

    const userData = userDoc.data();
    if (userData?.role !== "doctor") {
      return { success: false, error: "User is not a doctor" };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthlyReset = userData?.lastArticleMonthlyReset?.toDate?.() || null;
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!lastMonthlyReset || lastMonthlyReset < monthStart) {
      updateData.articlesPublishedThisMonth = 1;
      updateData.lastArticleMonthlyReset = admin.firestore.Timestamp.fromDate(monthStart);
    } else {
      updateData.articlesPublishedThisMonth = admin.firestore.FieldValue.increment(1);
    }

    await userRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing doctor article count:", error);
    return { success: false, error: "Failed to increment article count: " + error.message };
  }
}

