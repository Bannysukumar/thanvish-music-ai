import { adminDb, admin } from "./firebase-admin";

/**
 * Check if an artist can upload more tracks based on their plan limits
 * @param artistId - The artist's user ID
 * @returns Object with canUpload (boolean), remaining (daily/monthly), maxUploads, error message if any
 */
export async function checkArtistTrackUploadLimit(artistId: string): Promise<{
  canUpload: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  maxDailyUploads: number;
  maxMonthlyUploads: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(artistId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canUpload: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyUploads: 0,
        maxMonthlyUploads: 0,
        error: "Artist not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is an artist
    if (userData?.role !== "artist") {
      return {
        canUpload: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyUploads: 0,
        maxMonthlyUploads: 0,
        error: "User is not an artist",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canUpload: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        maxDailyUploads: 0,
        maxMonthlyUploads: 0,
        error: "Artist subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          canUpload: false,
          dailyRemaining: 0,
          monthlyRemaining: 0,
          maxDailyUploads: userData?.maxTrackUploadsPerDay || 0,
          maxMonthlyUploads: userData?.maxTrackUploadsPerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to upload tracks.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get plan limits from user data (set during plan assignment)
    const maxDailyUploads = userData?.maxTrackUploadsPerDay || 0;
    const maxMonthlyUploads = userData?.maxTrackUploadsPerMonth || 0;

    // Get current usage
    const trackUploadsUsedToday = userData?.trackUploadsUsedToday || 0;
    const trackUploadsUsedThisMonth = userData?.trackUploadsUsedThisMonth || 0;

    // Check last reset dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check if daily reset is needed
    const lastDailyReset = userData?.lastTrackUploadDailyReset;
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
    const lastMonthlyReset = userData?.lastTrackUploadMonthlyReset;
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
        updateData.trackUploadsUsedToday = 0;
        updateData.lastTrackUploadDailyReset = admin.firestore.Timestamp.fromDate(today);
      }
      
      if (monthlyResetNeeded) {
        updateData.trackUploadsUsedThisMonth = 0;
        updateData.lastTrackUploadMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
      }
      
      await userRef.update(updateData);
      
      // Update local values
      if (dailyResetNeeded) {
        trackUploadsUsedToday = 0;
      }
      if (monthlyResetNeeded) {
        trackUploadsUsedThisMonth = 0;
      }
    }

    // Calculate remaining
    const dailyRemaining = Math.max(0, maxDailyUploads - trackUploadsUsedToday);
    const monthlyRemaining = Math.max(0, maxMonthlyUploads - trackUploadsUsedThisMonth);

    // Check if limits are reached
    if (maxDailyUploads > 0 && trackUploadsUsedToday >= maxDailyUploads) {
      return {
        canUpload: false,
        dailyRemaining: 0,
        monthlyRemaining,
        maxDailyUploads,
        maxMonthlyUploads,
        error: "You've reached today's track upload limit. Try again tomorrow or upgrade your plan.",
        subscriptionStatus,
      };
    }

    if (maxMonthlyUploads > 0 && trackUploadsUsedThisMonth >= maxMonthlyUploads) {
      return {
        canUpload: false,
        dailyRemaining,
        monthlyRemaining: 0,
        maxDailyUploads,
        maxMonthlyUploads,
        error: "You've reached this month's track upload limit. It will reset next month, or upgrade now.",
        subscriptionStatus,
      };
    }

    return {
      canUpload: true,
      dailyRemaining,
      monthlyRemaining,
      maxDailyUploads,
      maxMonthlyUploads,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking artist track upload limit:", error);
    return {
      canUpload: false,
      dailyRemaining: 0,
      monthlyRemaining: 0,
      maxDailyUploads: 0,
      maxMonthlyUploads: 0,
      error: "Failed to check track upload limits: " + error.message,
    };
  }
}

/**
 * Check if an artist can publish more albums based on their plan limits
 * @param artistId - The artist's user ID
 * @returns Object with canPublish (boolean), remaining, maxAlbums, error message if any
 */
export async function checkArtistAlbumPublishLimit(artistId: string): Promise<{
  canPublish: boolean;
  remaining: number;
  maxAlbums: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(artistId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canPublish: false,
        remaining: 0,
        maxAlbums: 0,
        error: "Artist not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is an artist
    if (userData?.role !== "artist") {
      return {
        canPublish: false,
        remaining: 0,
        maxAlbums: 0,
        error: "User is not an artist",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canPublish: false,
        remaining: 0,
        maxAlbums: 0,
        error: "Artist subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          canPublish: false,
          remaining: 0,
          maxAlbums: userData?.maxAlbumsPublishedPerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to publish albums.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get plan limit (monthly publish limit)
    const maxAlbums = userData?.maxAlbumsPublishedPerMonth || 0;

    // Get current usage
    let albumsPublishedThisMonth = userData?.albumsPublishedThisMonth || 0;

    // Check last monthly reset
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthlyReset = userData?.lastAlbumPublishMonthlyReset;
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
        albumsPublishedThisMonth: 0,
        lastAlbumPublishMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      albumsPublishedThisMonth = 0;
    }

    // Calculate remaining
    const remaining = Math.max(0, maxAlbums - albumsPublishedThisMonth);

    // Check if limit is reached
    if (maxAlbums > 0 && albumsPublishedThisMonth >= maxAlbums) {
      return {
        canPublish: false,
        remaining: 0,
        maxAlbums,
        error: "You've reached your album publish limit for this plan. Upgrade to publish more albums.",
        subscriptionStatus,
      };
    }

    return {
      canPublish: true,
      remaining,
      maxAlbums,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking artist album publish limit:", error);
    return {
      canPublish: false,
      remaining: 0,
      maxAlbums: 0,
      error: "Failed to check album publish limits: " + error.message,
    };
  }
}

/**
 * Increment artist's track upload counters
 * @param artistId - The artist's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementArtistTrackUploadCount(artistId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(artistId);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current values to check if reset is needed
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    let trackUploadsUsedToday = userData?.trackUploadsUsedToday || 0;
    let trackUploadsUsedThisMonth = userData?.trackUploadsUsedThisMonth || 0;

    // Check if daily reset is needed
    const lastDailyReset = userData?.lastTrackUploadDailyReset;
    if (lastDailyReset) {
      const resetDate = lastDailyReset.toDate ? lastDailyReset.toDate() : new Date(lastDailyReset);
      const resetDay = new Date(resetDate.getFullYear(), resetDate.getMonth(), resetDate.getDate());
      if (resetDay.getTime() < today.getTime()) {
        trackUploadsUsedToday = 0;
      }
    } else {
      trackUploadsUsedToday = 0;
    }

    // Check if monthly reset is needed
    const lastMonthlyReset = userData?.lastTrackUploadMonthlyReset;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        trackUploadsUsedThisMonth = 0;
      }
    } else {
      trackUploadsUsedThisMonth = 0;
    }

    // Increment counters
    await userRef.update({
      trackUploadsUsedToday: trackUploadsUsedToday + 1,
      trackUploadsUsedThisMonth: trackUploadsUsedThisMonth + 1,
      lastTrackUploadDailyReset: admin.firestore.Timestamp.fromDate(today),
      lastTrackUploadMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing artist track upload count:", error);
    return {
      success: false,
      error: "Failed to increment track upload count: " + error.message,
    };
  }
}

/**
 * Increment artist's album publish counter
 * @param artistId - The artist's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementArtistAlbumPublishCount(artistId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(artistId);
    
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current value to check if reset is needed
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    let albumsPublishedThisMonth = userData?.albumsPublishedThisMonth || 0;

    // Check if monthly reset is needed
    const lastMonthlyReset = userData?.lastAlbumPublishMonthlyReset;
    if (lastMonthlyReset) {
      const resetDate = lastMonthlyReset.toDate ? lastMonthlyReset.toDate() : new Date(lastMonthlyReset);
      const resetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
      if (resetMonth.getTime() < firstOfMonth.getTime()) {
        albumsPublishedThisMonth = 0;
      }
    } else {
      albumsPublishedThisMonth = 0;
    }

    // Increment counter
    await userRef.update({
      albumsPublishedThisMonth: albumsPublishedThisMonth + 1,
      lastAlbumPublishMonthlyReset: admin.firestore.Timestamp.fromDate(firstOfMonth),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing artist album publish count:", error);
    return {
      success: false,
      error: "Failed to increment album publish count: " + error.message,
    };
  }
}

