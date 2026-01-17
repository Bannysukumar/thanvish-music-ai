import { adminDb, admin } from "./firebase-admin";

/**
 * Check and handle student plan expiry
 * Called periodically or on user login
 */
export async function checkAndHandleStudentExpiry(studentId: string): Promise<{
  expired: boolean;
  message?: string;
}> {
  try {
    const studentRef = adminDb.collection("users").doc(studentId);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      return { expired: false };
    }

    const studentData = studentDoc.data();
    const subscriptionEndDate = studentData?.subscriptionEndDate;
    const subscriptionStatus = studentData?.subscriptionStatus;

    if (!subscriptionEndDate) {
      return { expired: false };
    }

    const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
    const now = new Date();

    if (endDate < now && (subscriptionStatus === "active" || subscriptionStatus === "trial")) {
      // Plan has expired
      await studentRef.update({
        subscriptionStatus: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Note: Allocation stays active but content access should be locked
      // This is handled in the frontend/API when checking access

      return {
        expired: true,
        message: "Student plan validity has ended. Please renew to continue accessing premium features.",
      };
    }

    return { expired: false };
  } catch (error: any) {
    console.error("Error checking student expiry:", error);
    return { expired: false };
  }
}

/**
 * Check and handle teacher plan expiry
 * Called periodically or on user login
 */
export async function checkAndHandleTeacherExpiry(teacherId: string): Promise<{
  expired: boolean;
  message?: string;
}> {
  try {
    const teacherRef = adminDb.collection("users").doc(teacherId);
    const teacherDoc = await teacherRef.get();

    if (!teacherDoc.exists) {
      return { expired: false };
    }

    const teacherData = teacherDoc.data();
    const subscriptionEndDate = teacherData?.subscriptionEndDate || teacherData?.teacherPlanExpiryDate;
    const subscriptionStatus = teacherData?.subscriptionStatus;

    if (!subscriptionEndDate) {
      return { expired: false };
    }

    const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
    const now = new Date();

    if (endDate < now && (subscriptionStatus === "active" || subscriptionStatus === "trial")) {
      // Plan has expired
      await teacherRef.update({
        subscriptionStatus: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Note: Existing students keep allocation but teacher cannot accept new students
      // This is handled in the allocation logic

      return {
        expired: true,
        message: "Teacher plan validity has ended. Please renew to continue managing students.",
      };
    }

    return { expired: false };
  } catch (error: any) {
    console.error("Error checking teacher expiry:", error);
    return { expired: false };
  }
}

/**
 * Check subscription status on user login/activity
 * This should be called when user accesses their dashboard
 */
export async function checkSubscriptionStatus(userId: string, userRole: string): Promise<{
  status: string;
  expired: boolean;
  message?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { status: "inactive", expired: false };
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData?.subscriptionStatus;

    if (userRole === "student") {
      const result = await checkAndHandleStudentExpiry(userId);
      if (result.expired) {
        return {
          status: "expired",
          expired: true,
          message: result.message,
        };
      }
    } else if (userRole === "music_teacher") {
      const result = await checkAndHandleTeacherExpiry(userId);
      if (result.expired) {
        return {
          status: "expired",
          expired: true,
          message: result.message,
        };
      }
    }

    return {
      status: subscriptionStatus || "inactive",
      expired: false,
    };
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    return { status: "inactive", expired: false };
  }
}

