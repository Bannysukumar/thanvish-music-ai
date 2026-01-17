import { adminDb, admin } from "./firebase-admin";

/**
 * Check if a director can create more active projects based on their plan limits
 * @param directorId - The director's user ID
 * @returns Object with canCreate (boolean), activeProjectsCount, maxActiveProjects, remaining, error message if any
 */
export async function checkDirectorProjectLimit(directorId: string): Promise<{
  canCreate: boolean;
  activeProjectsCount: number;
  maxActiveProjects: number;
  remaining: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(directorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        activeProjectsCount: 0,
        maxActiveProjects: 0,
        remaining: 0,
        error: "Director not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music director
    if (userData?.role !== "music_director") {
      return {
        canCreate: false,
        activeProjectsCount: 0,
        maxActiveProjects: 0,
        remaining: 0,
        error: "User is not a music director",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        activeProjectsCount: 0,
        maxActiveProjects: userData?.maxActiveProjects || 0,
        remaining: 0,
        error: "Director subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          activeProjectsCount: 0,
          maxActiveProjects: userData?.maxActiveProjects || 0,
          remaining: 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get plan limit
    const maxActiveProjects = userData?.maxActiveProjects || 0;

    // Count active projects (status: draft, live, in_progress, review)
    // Exclude: completed, archived
    // Note: Firestore 'in' query has a limit of 10 items, so we'll fetch all projects and filter client-side
    const projectsQuery = adminDb.collection("directorProjects")
      .where("directorId", "==", directorId);
    
    const projectsSnapshot = await projectsQuery.get();
    const activeStatuses = ["draft", "live", "in_progress", "review"];
    let activeProjectsCount = 0;
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (activeStatuses.includes(data.status)) {
        activeProjectsCount++;
      }
    });

    // Calculate remaining
    const remaining = Math.max(0, maxActiveProjects - activeProjectsCount);

    // Check if limit is reached
    if (maxActiveProjects > 0 && activeProjectsCount >= maxActiveProjects) {
      return {
        canCreate: false,
        activeProjectsCount,
        maxActiveProjects,
        remaining: 0,
        error: "You've reached your active projects limit for this plan. Archive a project or upgrade your plan.",
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      activeProjectsCount,
      maxActiveProjects,
      remaining,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking director project limit:", error);
    return {
      canCreate: false,
      activeProjectsCount: 0,
      maxActiveProjects: 0,
      remaining: 0,
      error: "Failed to check project limits: " + error.message,
    };
  }
}

/**
 * Check if a director can use artist discovery based on their plan limits
 * @param directorId - The director's user ID
 * @returns Object with canDiscover (boolean), remaining (daily/monthly), maxDiscovery, error message if any
 */
export async function checkDirectorDiscoveryLimit(directorId: string): Promise<{
  canDiscover: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  maxDailyDiscovery: number;
  maxMonthlyDiscovery: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(directorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canDiscover: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyDiscovery: 0,
        maxMonthlyDiscovery: 0,
        error: "Director not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music director
    if (userData?.role !== "music_director") {
      return {
        canDiscover: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyDiscovery: 0,
        maxMonthlyDiscovery: 0,
        error: "User is not a music director",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canDiscover: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyDiscovery: userData?.artistDiscoveryPerDay || 0,
        maxMonthlyDiscovery: userData?.artistDiscoveryPerMonth || 0,
        error: "Director subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          canDiscover: false,
          dailyRemaining: 0,
          monthlyRemaining: 0,
          maxDailyDiscovery: userData?.artistDiscoveryPerDay || 0,
          maxMonthlyDiscovery: userData?.artistDiscoveryPerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get plan limits
    const maxDailyDiscovery = userData?.artistDiscoveryPerDay || 0;
    const maxMonthlyDiscovery = userData?.artistDiscoveryPerMonth || 0;

    // Get current usage
    let artistDiscoveryUsedToday = userData?.artistDiscoveryUsedToday || 0;
    let artistDiscoveryUsedThisMonth = userData?.artistDiscoveryUsedThisMonth || 0;

    // Check last reset dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check if daily reset is needed
    const lastDailyReset = userData?.lastDiscoveryDailyReset;
    let dailyResetNeeded = false;
    if (lastDailyReset) {
      const resetDate = lastDailyReset.toDate ? lastDailyReset.toDate() : new Date(lastDailyReset);
      const resetDay = new Date(resetDate.getFullYear(), resetDate.getMonth(), resetDate.getDate());
      if (resetDay.getTime() < today.getTime()) {
        dailyResetNeeded = true;
      }
    } else {
      dailyResetNeeded = true;
    }

    // Check if monthly reset is needed
    const lastMonthlyReset = userData?.lastDiscoveryMonthlyReset;
    let monthlyResetNeeded = false;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        monthlyResetNeeded = true;
      }
    } else {
      monthlyResetNeeded = true;
    }

    // Reset counters if needed
    if (dailyResetNeeded || monthlyResetNeeded) {
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (dailyResetNeeded) {
        updateData.artistDiscoveryUsedToday = 0;
        updateData.lastDiscoveryDailyReset = admin.firestore.Timestamp.fromDate(today);
      }
      
      if (monthlyResetNeeded) {
        updateData.artistDiscoveryUsedThisMonth = 0;
        updateData.lastDiscoveryMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
      }
      
      await userRef.update(updateData);
      
      // Update local values
      if (dailyResetNeeded) {
        artistDiscoveryUsedToday = 0;
      }
      if (monthlyResetNeeded) {
        artistDiscoveryUsedThisMonth = 0;
      }
    }

    // Calculate remaining
    const dailyRemaining = Math.max(0, maxDailyDiscovery - artistDiscoveryUsedToday);
    const monthlyRemaining = Math.max(0, maxMonthlyDiscovery - artistDiscoveryUsedThisMonth);

    // Check if limits are reached
    if (maxDailyDiscovery > 0 && artistDiscoveryUsedToday >= maxDailyDiscovery) {
      return {
        canDiscover: false,
        dailyRemaining: 0,
        monthlyRemaining,
        maxDailyDiscovery,
        maxMonthlyDiscovery,
        error: "You've reached today's Artist Discovery limit. Try again tomorrow or upgrade your plan.",
        subscriptionStatus,
      };
    }

    if (maxMonthlyDiscovery > 0 && artistDiscoveryUsedThisMonth >= maxMonthlyDiscovery) {
      return {
        canDiscover: false,
        dailyRemaining,
        monthlyRemaining: 0,
        maxDailyDiscovery,
        maxMonthlyDiscovery,
        error: "You've reached this month's Artist Discovery limit. It resets next month, or upgrade now.",
        subscriptionStatus,
      };
    }

    return {
      canDiscover: true,
      dailyRemaining,
      monthlyRemaining,
      maxDailyDiscovery,
      maxMonthlyDiscovery,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking director discovery limit:", error);
    return {
      canDiscover: false,
      dailyRemaining: 0,
      monthlyRemaining: 0,
      maxDailyDiscovery: 0,
      maxMonthlyDiscovery: 0,
      error: "Failed to check discovery limits: " + error.message,
    };
  }
}

/**
 * Check if a director can create more shortlists based on their plan limits
 * @param directorId - The director's user ID
 * @returns Object with canCreate (boolean), remaining, maxShortlists, error message if any
 */
export async function checkDirectorShortlistLimit(directorId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxShortlists: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(directorId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        remaining: 0,
        maxShortlists: 0,
        error: "Director not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music director
    if (userData?.role !== "music_director") {
      return {
        canCreate: false,
        remaining: 0,
        maxShortlists: 0,
        error: "User is not a music director",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxShortlists: userData?.maxShortlistsCreatePerMonth || 0,
        error: "Director subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          maxShortlists: userData?.maxShortlistsCreatePerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get plan limit
    const maxShortlists = userData?.maxShortlistsCreatePerMonth || 0;

    // Get current usage
    let shortlistsCreatedThisMonth = userData?.shortlistsCreatedThisMonth || 0;

    // Check last monthly reset
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthlyReset = userData?.lastShortlistMonthlyReset;
    let monthlyResetNeeded = false;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        monthlyResetNeeded = true;
      }
    } else {
      monthlyResetNeeded = true;
    }

    // Reset counter if needed
    if (monthlyResetNeeded) {
      await userRef.update({
        shortlistsCreatedThisMonth: 0,
        lastShortlistMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      shortlistsCreatedThisMonth = 0;
    }

    // Calculate remaining
    const remaining = Math.max(0, maxShortlists - shortlistsCreatedThisMonth);

    // Check if limit is reached
    if (maxShortlists > 0 && shortlistsCreatedThisMonth >= maxShortlists) {
      return {
        canCreate: false,
        remaining: 0,
        maxShortlists,
        error: "You've reached your shortlist creation limit for this month. Upgrade your plan to create more.",
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining,
      maxShortlists,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking director shortlist limit:", error);
    return {
      canCreate: false,
      remaining: 0,
      maxShortlists: 0,
      error: "Failed to check shortlist limits: " + error.message,
    };
  }
}

/**
 * Increment director's artist discovery counters
 * @param directorId - The director's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementDirectorDiscoveryCount(directorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(directorId);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current values to check if reset is needed
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    let artistDiscoveryUsedToday = userData?.artistDiscoveryUsedToday || 0;
    let artistDiscoveryUsedThisMonth = userData?.artistDiscoveryUsedThisMonth || 0;

    // Check if daily reset is needed
    const lastDailyReset = userData?.lastDiscoveryDailyReset;
    if (lastDailyReset) {
      const resetDate = lastDailyReset.toDate ? lastDailyReset.toDate() : new Date(lastDailyReset);
      const resetDay = new Date(resetDate.getFullYear(), resetDate.getMonth(), resetDate.getDate());
      if (resetDay.getTime() < today.getTime()) {
        artistDiscoveryUsedToday = 0;
      }
    } else {
      artistDiscoveryUsedToday = 0;
    }

    // Check if monthly reset is needed
    const lastMonthlyReset = userData?.lastDiscoveryMonthlyReset;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        artistDiscoveryUsedThisMonth = 0;
      }
    } else {
      artistDiscoveryUsedThisMonth = 0;
    }

    // Increment counters
    await userRef.update({
      artistDiscoveryUsedToday: artistDiscoveryUsedToday + 1,
      artistDiscoveryUsedThisMonth: artistDiscoveryUsedThisMonth + 1,
      lastDiscoveryDailyReset: admin.firestore.Timestamp.fromDate(today),
      lastDiscoveryMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing director discovery count:", error);
    return {
      success: false,
      error: "Failed to increment discovery count: " + error.message,
    };
  }
}

/**
 * Increment director's shortlist creation counter
 * @param directorId - The director's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementDirectorShortlistCount(directorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(directorId);
    
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current value to check if reset is needed
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    let shortlistsCreatedThisMonth = userData?.shortlistsCreatedThisMonth || 0;

    // Check if monthly reset is needed
    const lastMonthlyReset = userData?.lastShortlistMonthlyReset;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        shortlistsCreatedThisMonth = 0;
      }
    } else {
      shortlistsCreatedThisMonth = 0;
    }

    // Increment counter
    await userRef.update({
      shortlistsCreatedThisMonth: shortlistsCreatedThisMonth + 1,
      lastShortlistMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing director shortlist count:", error);
    return {
      success: false,
      error: "Failed to increment shortlist count: " + error.message,
    };
  }
}

