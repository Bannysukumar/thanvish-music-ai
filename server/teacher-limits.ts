import { adminDb, admin } from "./firebase-admin";

/**
 * Check if a teacher can accept more students based on their plan limits
 * @param teacherId - The teacher's user ID
 * @returns Object with canAssign (boolean), remaining (number), maxStudents (number), error message if any
 */
export async function checkTeacherStudentLimit(teacherId: string): Promise<{
  canAssign: boolean;
  remaining: number;
  maxStudents: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(teacherId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canAssign: false,
        remaining: 0,
        maxStudents: 0,
        error: "Teacher not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music teacher
    if (userData?.role !== "music_teacher") {
      return {
        canAssign: false,
        remaining: 0,
        maxStudents: 0,
        error: "User is not a music teacher",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canAssign: false,
        remaining: 0,
        maxStudents: 0,
        error: "Teacher subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          canAssign: false,
          remaining: 0,
          maxStudents: userData?.teacherMaxStudents || 0,
          error: "Teacher plan validity has ended. Renew/upgrade to manage students.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get current allocation count
    const currentCount = userData?.studentsAllocatedCount || 0;
    const maxStudents = userData?.teacherMaxStudents || 0;

    // Check if limit is reached
    if (maxStudents === 0) {
      return {
        canAssign: false,
        remaining: 0,
        maxStudents: 0,
        error: "Student allocation is disabled for this plan (maxStudents = 0)",
        subscriptionStatus,
      };
    }

    if (currentCount >= maxStudents) {
      return {
        canAssign: false,
        remaining: 0,
        maxStudents,
        error: "Student limit reached for your plan. Upgrade your plan to add more students.",
        subscriptionStatus,
      };
    }

    return {
      canAssign: true,
      remaining: maxStudents - currentCount,
      maxStudents,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking teacher student limit:", error);
    return {
      canAssign: false,
      remaining: 0,
      maxStudents: 0,
      error: "Failed to check teacher limits: " + error.message,
    };
  }
}

/**
 * Increment teacher's student allocation count
 * @param teacherId - The teacher's user ID
 * @returns Success boolean and error message if any
 */
export async function incrementTeacherStudentCount(teacherId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(teacherId);
    
    await userRef.update({
      studentsAllocatedCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing teacher student count:", error);
    return {
      success: false,
      error: "Failed to increment student count: " + error.message,
    };
  }
}

/**
 * Decrement teacher's student allocation count
 * @param teacherId - The teacher's user ID
 * @returns Success boolean and error message if any
 */
export async function decrementTeacherStudentCount(teacherId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userRef = adminDb.collection("users").doc(teacherId);
    
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const currentCount = userDoc.data()?.studentsAllocatedCount || 0;
      if (currentCount > 0) {
        await userRef.update({
          studentsAllocatedCount: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error decrementing teacher student count:", error);
    return {
      success: false,
      error: "Failed to decrement student count: " + error.message,
    };
  }
}

/**
 * Check if a teacher can create more courses based on their plan limits
 * @param teacherId - The teacher's user ID
 * @returns Object with canCreate (boolean), remaining (number), maxCourses (number), error message if any
 */
export async function checkTeacherCourseLimit(teacherId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxCourses: number;
  currentCount: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(teacherId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        remaining: 0,
        maxCourses: 0,
        currentCount: 0,
        error: "Teacher not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music teacher
    if (userData?.role !== "music_teacher") {
      return {
        canCreate: false,
        remaining: 0,
        maxCourses: 0,
        currentCount: 0,
        error: "User is not a music teacher",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxCourses: 0,
        currentCount: 0,
        error: "Teacher subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          maxCourses: userData?.teacherMaxCourses || 0,
          currentCount: 0,
          error: "Teacher plan validity has ended. Renew/upgrade to create courses.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get current course count
    const coursesSnapshot = await adminDb.collection("courses")
      .where("teacherId", "==", teacherId)
      .get();
    const currentCount = coursesSnapshot.size;
    
    // Get max courses from user's plan
    const maxCourses = userData?.teacherMaxCourses || 0;

    // Check if limit is reached
    if (maxCourses === 0) {
      return {
        canCreate: false,
        remaining: 0,
        maxCourses: 0,
        currentCount,
        error: "Course creation is disabled for this plan (maxCourses = 0)",
        subscriptionStatus,
      };
    }

    if (currentCount >= maxCourses) {
      return {
        canCreate: false,
        remaining: 0,
        maxCourses,
        currentCount,
        error: `Course limit reached (${currentCount}/${maxCourses}). Upgrade your plan to create more courses.`,
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxCourses - currentCount,
      maxCourses,
      currentCount,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking teacher course limit:", error);
    return {
      canCreate: false,
      remaining: 0,
      maxCourses: 0,
      currentCount: 0,
      error: "Failed to check course limits: " + error.message,
    };
  }
}

/**
 * Check if a teacher can create more lessons based on their plan limits
 * @param teacherId - The teacher's user ID
 * @returns Object with canCreate (boolean), remaining (number), maxLessons (number), error message if any
 */
export async function checkTeacherLessonLimit(teacherId: string): Promise<{
  canCreate: boolean;
  remaining: number;
  maxLessons: number;
  currentCount: number;
  error?: string;
  subscriptionStatus?: string;
  isExpired?: boolean;
}> {
  try {
    const userRef = adminDb.collection("users").doc(teacherId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        canCreate: false,
        remaining: 0,
        maxLessons: 0,
        currentCount: 0,
        error: "Teacher not found",
      };
    }

    const userData = userDoc.data();
    
    // Check if user is a music teacher
    if (userData?.role !== "music_teacher") {
      return {
        canCreate: false,
        remaining: 0,
        maxLessons: 0,
        currentCount: 0,
        error: "User is not a music teacher",
      };
    }

    // Check subscription status
    const subscriptionStatus = userData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        canCreate: false,
        remaining: 0,
        maxLessons: 0,
        currentCount: 0,
        error: "Teacher subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
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
          maxLessons: userData?.teacherMaxLessons || 0,
          currentCount: 0,
          error: "Teacher plan validity has ended. Renew/upgrade to create lessons.",
          subscriptionStatus,
          isExpired: true,
        };
      }
    }

    // Get current lesson count across all courses
    const coursesSnapshot = await adminDb.collection("courses")
      .where("teacherId", "==", teacherId)
      .get();
    
    let currentCount = 0;
    coursesSnapshot.docs.forEach((courseDoc) => {
      const courseData = courseDoc.data();
      if (courseData.modules && Array.isArray(courseData.modules)) {
        courseData.modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            currentCount += module.lessons.length;
          }
        });
      }
    });
    
    // Get max lessons from user's plan
    const maxLessons = userData?.teacherMaxLessons || 0;

    // Check if limit is reached
    if (maxLessons === 0) {
      return {
        canCreate: false,
        remaining: 0,
        maxLessons: 0,
        currentCount,
        error: "Lesson creation is disabled for this plan (maxLessons = 0)",
        subscriptionStatus,
      };
    }

    if (currentCount >= maxLessons) {
      return {
        canCreate: false,
        remaining: 0,
        maxLessons,
        currentCount,
        error: `Lesson limit reached (${currentCount}/${maxLessons}). Upgrade your plan to create more lessons.`,
        subscriptionStatus,
      };
    }

    return {
      canCreate: true,
      remaining: maxLessons - currentCount,
      maxLessons,
      currentCount,
      subscriptionStatus,
    };
  } catch (error: any) {
    console.error("Error checking teacher lesson limit:", error);
    return {
      canCreate: false,
      remaining: 0,
      maxLessons: 0,
      currentCount: 0,
      error: "Failed to check lesson limits: " + error.message,
    };
  }
}
