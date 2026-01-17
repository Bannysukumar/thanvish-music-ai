import { adminDb, admin } from "./firebase-admin";

/**
 * Check if a student can enroll in more courses based on their plan limits
 * @param studentId - The student's user ID
 * @returns Object with canEnroll (boolean), remaining (number), maxEnrollments (number), error message if any
 */
export async function checkStudentEnrollmentLimit(studentId: string): Promise<{
  canEnroll: boolean;
  remaining: number;
  maxEnrollments: number;
  currentEnrollments: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(studentId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canEnroll: false,
        remaining: 0,
        maxEnrollments: 0,
        currentEnrollments: 0,
        error: "Student not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a student
    if (userData?.role !== "student") {
      return {
        canEnroll: false,
        remaining: 0,
        maxEnrollments: 0,
        currentEnrollments: 0,
        error: "User is not a student",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canEnroll: false,
        remaining: 0,
        maxEnrollments: 0,
        currentEnrollments: 0,
        error: "Student subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          canEnroll: false,
          remaining: 0,
          maxEnrollments: userData?.studentMaxEnrollments || 0,
          currentEnrollments: 0,
          error: "Student plan validity has ended. Renew/upgrade to enroll in courses.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get max enrollments from user document (copied from plan)
    const maxEnrollments = userData?.studentMaxEnrollments || 0;

    // Count current active enrollments
    const enrollmentsSnapshot = await adminDb.collection("enrollments")
      .where("studentId", "==", studentId)
      .where("status", "==", "active")
      .get();
    
    const currentEnrollments = enrollmentsSnapshot.size;

    // Check if limit is reached
    if (maxEnrollments === 0) {
      // 0 means unlimited (or not set), allow enrollment
      return {
        canEnroll: true,
        remaining: 999999, // Unlimited
        maxEnrollments: 0, // 0 means unlimited
        currentEnrollments,
        subscriptionStatus,
      };
    }

    if (currentEnrollments >= maxEnrollments) {
      return {
        canEnroll: false,
        remaining: 0,
        maxEnrollments,
        currentEnrollments,
        error: `Enrollment limit reached (${currentEnrollments}/${maxEnrollments}). Upgrade your plan to enroll in more courses.`,
        subscriptionStatus,
      };
    }

    return {
      canEnroll: true,
      remaining: maxEnrollments - currentEnrollments,
      maxEnrollments,
      currentEnrollments,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking student enrollment limit:", error);
    return {
      canEnroll: false,
      remaining: 0,
      maxEnrollments: 0,
      currentEnrollments: 0,
      error: "Failed to check student limits: " + error.message,
    };
  }
}

