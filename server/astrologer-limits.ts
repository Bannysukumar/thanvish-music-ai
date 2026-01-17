import { adminDb, admin } from "./firebase-admin";

/**
 * Resets monthly counters if a new month has started.
 * @param userData - The user's data document
 * @param userRef - Reference to the user's document
 * @returns Updated user data after potential resets
 */
async function resetAstrologerCountersIfNeeded(userData: any, userRef: any): Promise<any> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let updateData: any = {};
  let changed = false;

  // Readings
  const lastReadingsReset = userData.lastReadingsMonthlyReset?.toDate();
  if (!lastReadingsReset || new Date(lastReadingsReset.getFullYear(), lastReadingsReset.getMonth(), 1).getTime() < firstOfMonth.getTime()) {
    updateData.readingsCreatedThisMonth = 0;
    updateData.lastReadingsMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
    changed = true;
  }

  // Templates
  const lastTemplatesReset = userData.lastTemplatesMonthlyReset?.toDate();
  if (!lastTemplatesReset || new Date(lastTemplatesReset.getFullYear(), lastTemplatesReset.getMonth(), 1).getTime() < firstOfMonth.getTime()) {
    updateData.astroTemplatesCreatedThisMonth = 0;
    updateData.lastTemplatesMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
    changed = true;
  }

  // Rasi Recommendations
  const lastRasiReset = userData.lastRasiMonthlyReset?.toDate();
  if (!lastRasiReset || new Date(lastRasiReset.getFullYear(), lastRasiReset.getMonth(), 1).getTime() < firstOfMonth.getTime()) {
    updateData.rasiRecommendationsCreatedThisMonth = 0;
    updateData.lastRasiMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
    changed = true;
  }

  // Horoscope Posts
  const lastPostsReset = userData.lastPostsMonthlyReset?.toDate();
  if (!lastPostsReset || new Date(lastPostsReset.getFullYear(), lastPostsReset.getMonth(), 1).getTime() < firstOfMonth.getTime()) {
    updateData.horoscopePostsPublishedThisMonth = 0;
    updateData.lastPostsMonthlyReset = admin.firestore.Timestamp.fromDate(firstOfMonth);
    changed = true;
  }

  if (changed) {
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await userRef.update(updateData);
    // Update userData locally to reflect resets
    return { ...userData, ...updateData };
  }
  return userData;
}

/**
 * Check if an astrologer can add more clients based on their plan limits.
 * @param astrologerId - The astrologer's user ID
 * @returns Object with canAdd (boolean), remaining, maxClients, error message if any
 */
export async function checkAstrologerClientLimit(astrologerId: string): Promise<{
  canAdd: boolean;
  remaining: number;
  maxClients: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canAdd: false, remaining: 0, maxClients: 0, error: "Astrologer not found" };
    }

    let userData = userDoc.data();

    if (userData?.role !== "astrologer") {
      return { canAdd: false, remaining: 0, maxClients: 0, error: "User is not an astrologer" };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canAdd: false,
        remaining: 0,
        maxClients: 0,
        error: "Astrologer subscription is not active. Please activate or upgrade your plan.",
        subscriptionStatus,
      };
    }

    const subscriptionEndDate = userData?.subscriptionEndDate;
    if (subscriptionEndDate) {
      const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
      const now = new Date();
      if (endDate < now) {
        return {
          canAdd: false,
          remaining: 0,
          maxClients: userData?.maxClientsActive || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Count active clients (this would query the clients collection)
    // For now, we'll use a stored counter that gets updated when clients are added/removed
    const maxClients = userData?.maxClientsActive || 0;
    const clientsActiveCount = userData?.clientsActiveCount || 0;

    if (maxClients === 0) { // 0 means unlimited
      return { canAdd: true, remaining: -1, maxClients, subscriptionStatus };
    }

    if (clientsActiveCount >= maxClients) {
      return {
        canAdd: false,
        remaining: 0,
        maxClients,
        error: "You've reached your client limit for this plan. Upgrade to add more clients.",
        subscriptionStatus,
      };
    }

    return {
      canAdd: true,
      remaining: maxClients - clientsActiveCount,
      maxClients,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking astrologer client limit:", error);
    return { canAdd: false, remaining: 0, maxClients: 0, error: "Failed to check client limits: " + error.message };
  }
}

/**
 * Check if an astrologer can create more readings based on their plan limits.
 * @param astrologerId - The astrologer's user ID
 * @returns Object with canCreate (boolean), remaining, maxReadings, error message if any
 */
export async function checkAstrologerReadingLimit(astrologerId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxReadings: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canCreate: false, remaining: 0, maxReadings: 0, error: "Astrologer not found" };
    }

    let userData = userDoc.data();

    if (userData?.role !== "astrologer") {
      return { canCreate: false, remaining: 0, maxReadings: 0, error: "User is not an astrologer" };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxReadings: 0,
        error: "Astrologer subscription is not active. Please activate or upgrade your plan.",
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
          maxReadings: userData?.maxReadingsPerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    userData = await resetAstrologerCountersIfNeeded(userData, userRef);

    const maxReadings = userData?.maxReadingsPerMonth || 0;
    const readingsCreatedThisMonth = userData?.readingsCreatedThisMonth || 0;

    if (maxReadings === 0) { // 0 means unlimited
      return { canCreate: true, remaining: -1, maxReadings, subscriptionStatus };
    }

    if (readingsCreatedThisMonth >= maxReadings) {
      return {
        canCreate: false,
        remaining: 0,
        maxReadings,
        error: "You've reached your readings limit for this month. Upgrade your plan to create more readings.",
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxReadings - readingsCreatedThisMonth,
      maxReadings,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking astrologer reading limit:", error);
    return { canCreate: false, remaining: 0, maxReadings: 0, error: "Failed to check reading limits: " + error.message };
  }
}

/**
 * Increment the astrologer's reading creation count for the current month.
 * @param astrologerId - The astrologer's user ID
 */
export async function incrementAstrologerReadingCount(astrologerId: string) {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Astrologer ${astrologerId} not found for incrementing reading count.`);
      return;
    }

    let userData = userDoc.data();
    userData = await resetAstrologerCountersIfNeeded(userData, userRef); // Ensure counters are up-to-date

    await userRef.update({
      readingsCreatedThisMonth: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error incrementing reading count for astrologer ${astrologerId}:`, error);
  }
}

/**
 * Check if an astrologer can create more templates based on their plan limits.
 * @param astrologerId - The astrologer's user ID
 * @returns Object with canCreate (boolean), remaining, maxTemplates, error message if any
 */
export async function checkAstrologerTemplateLimit(astrologerId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxTemplates: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canCreate: false, remaining: 0, maxTemplates: 0, error: "Astrologer not found" };
    }

    let userData = userDoc.data();

    if (userData?.role !== "astrologer") {
      return { canCreate: false, remaining: 0, maxTemplates: 0, error: "User is not an astrologer" };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates: 0,
        error: "Astrologer subscription is not active. Please activate or upgrade your plan.",
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
          maxTemplates: userData?.maxAstroTemplatesCreatePerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    userData = await resetAstrologerCountersIfNeeded(userData, userRef);

    const maxTemplates = userData?.maxAstroTemplatesCreatePerMonth || 0;
    const templatesCreatedThisMonth = userData?.astroTemplatesCreatedThisMonth || 0;

    if (maxTemplates === 0) { // 0 means unlimited
      return { canCreate: true, remaining: -1, maxTemplates, subscriptionStatus };
    }

    if (templatesCreatedThisMonth >= maxTemplates) {
      return {
        canCreate: false,
        remaining: 0,
        maxTemplates,
        error: "You've reached your template creation limit for this month. Upgrade your plan to create more templates.",
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxTemplates - templatesCreatedThisMonth,
      maxTemplates,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking astrologer template limit:", error);
    return { canCreate: false, remaining: 0, maxTemplates: 0, error: "Failed to check template limits: " + error.message };
  }
}

/**
 * Increment the astrologer's template creation count for the current month.
 * @param astrologerId - The astrologer's user ID
 */
export async function incrementAstrologerTemplateCount(astrologerId: string) {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Astrologer ${astrologerId} not found for incrementing template count.`);
      return;
    }

    let userData = userDoc.data();
    userData = await resetAstrologerCountersIfNeeded(userData, userRef); // Ensure counters are up-to-date

    await userRef.update({
      astroTemplatesCreatedThisMonth: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error incrementing template count for astrologer ${astrologerId}:`, error);
  }
}

/**
 * Check if an astrologer can create more rasi recommendations based on their plan limits.
 * @param astrologerId - The astrologer's user ID
 * @returns Object with canCreate (boolean), remaining, maxRasi, error message if any
 */
export async function checkAstrologerRasiLimit(astrologerId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxRasi: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canCreate: false, remaining: 0, maxRasi: 0, error: "Astrologer not found" };
    }

    let userData = userDoc.data();

    if (userData?.role !== "astrologer") {
      return { canCreate: false, remaining: 0, maxRasi: 0, error: "User is not an astrologer" };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxRasi: 0,
        error: "Astrologer subscription is not active. Please activate or upgrade your plan.",
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
          maxRasi: userData?.maxRasiRecommendationsCreatePerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    userData = await resetAstrologerCountersIfNeeded(userData, userRef);

    const maxRasi = userData?.maxRasiRecommendationsCreatePerMonth || 0;
    const rasiCreatedThisMonth = userData?.rasiRecommendationsCreatedThisMonth || 0;

    if (maxRasi === 0) { // 0 means unlimited
      return { canCreate: true, remaining: -1, maxRasi, subscriptionStatus };
    }

    if (rasiCreatedThisMonth >= maxRasi) {
      return {
        canCreate: false,
        remaining: 0,
        maxRasi,
        error: "You've reached your rasi recommendation limit for this month. Upgrade your plan to create more.",
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxRasi - rasiCreatedThisMonth,
      maxRasi,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking astrologer rasi limit:", error);
    return { canCreate: false, remaining: 0, maxRasi: 0, error: "Failed to check rasi limits: " + error.message };
  }
}

/**
 * Increment the astrologer's rasi recommendation creation count for the current month.
 * @param astrologerId - The astrologer's user ID
 */
export async function incrementAstrologerRasiCount(astrologerId: string) {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Astrologer ${astrologerId} not found for incrementing rasi count.`);
      return;
    }

    let userData = userDoc.data();
    userData = await resetAstrologerCountersIfNeeded(userData, userRef); // Ensure counters are up-to-date

    await userRef.update({
      rasiRecommendationsCreatedThisMonth: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error incrementing rasi count for astrologer ${astrologerId}:`, error);
  }
}

/**
 * Check if an astrologer can publish more horoscope posts based on their plan limits.
 * @param astrologerId - The astrologer's user ID
 * @returns Object with canPublish (boolean), remaining, maxPosts, error message if any
 */
export async function checkAstrologerPostLimit(astrologerId: string): Promise<{
  canPublish: boolean;
  remaining: number;
  maxPosts: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { canPublish: false, remaining: 0, maxPosts: 0, error: "Astrologer not found" };
    }

    let userData = userDoc.data();

    if (userData?.role !== "astrologer") {
      return { canPublish: false, remaining: 0, maxPosts: 0, error: "User is not an astrologer" };
    }

    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canPublish: false,
        remaining: 0,
        maxPosts: 0,
        error: "Astrologer subscription is not active. Please activate or upgrade your plan.",
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
          maxPosts: userData?.maxHoroscopePostsPublishPerMonth || 0,
          error: "Your plan validity has ended. Please renew or upgrade to continue.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    userData = await resetAstrologerCountersIfNeeded(userData, userRef);

    const maxPosts = userData?.maxHoroscopePostsPublishPerMonth || 0;
    const postsPublishedThisMonth = userData?.horoscopePostsPublishedThisMonth || 0;

    if (maxPosts === 0) { // 0 means unlimited
      return { canPublish: true, remaining: -1, maxPosts, subscriptionStatus };
    }

    if (postsPublishedThisMonth >= maxPosts) {
      return {
        canPublish: false,
        remaining: 0,
        maxPosts,
        error: "You've reached your horoscope post publishing limit for this month. Upgrade your plan to publish more posts.",
        subscriptionStatus,
      };
    }

    return {
      canPublish: true,
      remaining: maxPosts - postsPublishedThisMonth,
      maxPosts,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking astrologer post limit:", error);
    return { canPublish: false, remaining: 0, maxPosts: 0, error: "Failed to check post limits: " + error.message };
  }
}

/**
 * Increment the astrologer's post publishing count for the current month.
 * @param astrologerId - The astrologer's user ID
 */
export async function incrementAstrologerPostCount(astrologerId: string) {
  try {
    const userRef = adminDb.collection("users").doc(astrologerId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Astrologer ${astrologerId} not found for incrementing post count.`);
      return;
    }

    let userData = userDoc.data();
    userData = await resetAstrologerCountersIfNeeded(userData, userRef); // Ensure counters are up-to-date

    await userRef.update({
      horoscopePostsPublishedThisMonth: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error incrementing post count for astrologer ${astrologerId}:`, error);
  }
}

/**
 * Validate horoscope post content for safety compliance.
 * Blocks content with guaranteed predictions, fear-based threats, or harmful superstition pressure.
 * @param content - The post content to validate
 * @returns Object with isValid (boolean) and error message if invalid
 */
export function validateHoroscopePostContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  const lowerContent = content.toLowerCase();

  // Check for guaranteed predictions
  const guaranteedPatterns = [
    /\b100%\s*(will|must|guaranteed|definitely|certainly)\b/i,
    /\bguaranteed\s+(to|that|it)\b/i,
    /\bdefinitely\s+(will|going to|happening)\b/i,
    /\bwill\s+definitely\b/i,
    /\bwill\s+100%\b/i,
    /\b100%\s+chance\b/i,
  ];

  for (const pattern of guaranteedPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        isValid: false,
        error: "This post violates content guidelines (no guaranteed predictions or fear-based content). Please edit and try again.",
      };
    }
  }

  // Check for fear-based threats
  const fearPatterns = [
    /\b(bad luck|terrible|disaster|curse|doom|death|die|dying|fatal|deadly)\b/i,
    /\b(you will die|you will suffer|terrible things will happen)\b/i,
    /\b(beware|warning|danger|threat|harm)\b/i,
  ];

  for (const pattern of fearPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        isValid: false,
        error: "This post violates content guidelines (no guaranteed predictions or fear-based content). Please edit and try again.",
      };
    }
  }

  // Check for harmful superstition pressure (pay money or curse continues)
  const pressurePatterns = [
    /\b(pay\s+(money|now|immediately)|donate\s+(now|immediately)|send\s+money)\b/i,
    /\b(curse\s+(will|must|continue|stay)|curse\s+unless)\b/i,
    /\b(unless\s+you\s+pay|if\s+you\s+don't\s+pay)\b/i,
  ];

  for (const pattern of pressurePatterns) {
    if (pattern.test(lowerContent)) {
      return {
        isValid: false,
        error: "This post violates content guidelines (no guaranteed predictions or fear-based content). Please edit and try again.",
      };
    }
  }

  return { isValid: true };
}

