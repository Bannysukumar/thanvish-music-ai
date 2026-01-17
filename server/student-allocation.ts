import { adminDb, admin } from "./firebase-admin";

export interface AllocationResult {
  success: boolean;
  teacherId?: string;
  teacherName?: string;
  error?: string;
  reason?: string;
}

/**
 * Auto-allocate a student to a teacher based on plan settings
 * @param studentId - The student's user ID
 * @param planId - The student's plan ID
 * @returns Allocation result with teacher info or error
 */
export async function autoAllocateStudentToTeacher(
  studentId: string,
  planId: string
): Promise<AllocationResult> {
  try {
    // Get student data
    const studentRef = adminDb.collection("users").doc(studentId);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    const studentData = studentDoc.data();
    
    // Check if student is already allocated
    if (studentData?.allocatedTeacherId) {
      // Verify the allocation is still valid
      const teacherRef = adminDb.collection("users").doc(studentData.allocatedTeacherId);
      const teacherDoc = await teacherRef.get();
      
      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        // Check if teacher is still eligible
        if (teacherData?.role === "music_teacher" && 
            (teacherData?.subscriptionStatus === "active" || teacherData?.subscriptionStatus === "trial")) {
          return {
            success: true,
            teacherId: studentData.allocatedTeacherId,
            teacherName: teacherData?.name || "Unknown",
            reason: "Already allocated",
          };
        }
      }
    }

    // Check student subscription status
    const subscriptionStatus = studentData?.subscriptionStatus;
    if (!subscriptionStatus || (subscriptionStatus !== "active" && subscriptionStatus !== "trial")) {
      return {
        success: false,
        error: "Student subscription is not active. Subscription status: " + (subscriptionStatus || "inactive"),
      };
    }

    // Check if student plan is expired
    const subscriptionEndDate = studentData?.subscriptionEndDate;
    if (subscriptionEndDate) {
      const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
      const now = new Date();
      if (endDate < now) {
        return {
          success: false,
          error: "Student plan validity has ended",
        };
      }
    }

    // Get plan details
    const planRef = adminDb.collection("subscriptionPlans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return {
        success: false,
        error: "Student plan not found",
      };
    }

    const planData = planDoc.data();
    
    // Check if auto-allocation is enabled
    if (planData?.autoAllocateTeacher === false) {
      return {
        success: false,
        error: "Auto-allocation is disabled for this plan",
      };
    }

    const allocationStrategy = planData?.allocationStrategy || "LeastStudentsFirst";
    const preferredCategory = planData?.preferredTeacherCategory;

    // Find eligible teachers
    const teachersSnapshot = await adminDb.collection("users")
      .where("role", "==", "music_teacher")
      .get();

    const eligibleTeachers: Array<{
      id: string;
      data: any;
      remaining: number;
      currentCount: number;
    }> = [];

    const now = new Date();

    for (const teacherDoc of teachersSnapshot.docs) {
      const teacherData = teacherDoc.data();
      const teacherId = teacherDoc.id;

      // Check subscription status
      const teacherStatus = teacherData?.subscriptionStatus;
      if (!teacherStatus || (teacherStatus !== "active" && teacherStatus !== "trial")) {
        continue;
      }

      // Check if teacher plan is expired
      const teacherEndDate = teacherData?.subscriptionEndDate;
      if (teacherEndDate) {
        const endDate = teacherEndDate.toDate ? teacherEndDate.toDate() : new Date(teacherEndDate);
        if (endDate < now) {
          continue;
        }
      }

      // Check if teacher is suspended
      if (teacherStatus === "suspended") {
        continue;
      }

      // Get current student count
      const currentCount = teacherData?.studentsAllocatedCount || 0;
      const maxStudents = teacherData?.teacherMaxStudents || 0;

      // Check if teacher has capacity
      if (maxStudents === 0 || currentCount >= maxStudents) {
        continue;
      }

      // Optional: Check preferred category if specified
      if (preferredCategory && teacherData?.category && teacherData.category !== preferredCategory) {
        // Still eligible but lower priority
      }

      eligibleTeachers.push({
        id: teacherId,
        data: teacherData,
        remaining: maxStudents - currentCount,
        currentCount,
      });
    }

    if (eligibleTeachers.length === 0) {
      return {
        success: false,
        error: "No eligible teachers available for allocation",
        reason: "NO_TEACHERS_AVAILABLE",
      };
    }

    // Apply allocation strategy
    let selectedTeacher: typeof eligibleTeachers[0] | null = null;

    if (allocationStrategy === "LeastStudentsFirst") {
      // Sort by remaining capacity (descending), then by current count (ascending)
      eligibleTeachers.sort((a, b) => {
        if (b.remaining !== a.remaining) {
          return b.remaining - a.remaining; // More remaining = better
        }
        return a.currentCount - b.currentCount; // Fewer current = better
      });
      selectedTeacher = eligibleTeachers[0];
    } else if (allocationStrategy === "RoundRobin") {
      // Simple round-robin: pick teacher with most remaining capacity
      eligibleTeachers.sort((a, b) => b.remaining - a.remaining);
      selectedTeacher = eligibleTeachers[0];
    } else if (allocationStrategy === "NewestTeacherFirst") {
      // Sort by creation date (newest first)
      eligibleTeachers.sort((a, b) => {
        const aDate = a.data.createdAt?.toDate?.() || new Date(0);
        const bDate = b.data.createdAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
      selectedTeacher = eligibleTeachers[0];
    }

    if (!selectedTeacher) {
      return {
        success: false,
        error: "Failed to select teacher using allocation strategy",
      };
    }

    // Allocate student to teacher
    const teacherId = selectedTeacher.id;
    const teacherName = selectedTeacher.data.name || "Unknown Teacher";

    // Update student record
    await studentRef.update({
      allocatedTeacherId: teacherId,
      allocatedTeacherName: teacherName,
      allocationStatus: "ALLOCATED",
      allocationDate: admin.firestore.FieldValue.serverTimestamp(),
      allocationPlanId: planId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update teacher record
    const teacherRef = adminDb.collection("users").doc(teacherId);
    await teacherRef.update({
      studentsAllocatedCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create allocation record
    await adminDb.collection("studentAllocations").add({
      studentId,
      teacherId,
      planId,
      status: "active",
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: subscriptionEndDate || null,
      createdBy: "system",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      teacherId,
      teacherName,
      reason: `Allocated using ${allocationStrategy} strategy`,
    };
  } catch (error: any) {
    console.error("Error auto-allocating student to teacher:", error);
    return {
      success: false,
      error: "Failed to allocate student: " + error.message,
    };
  }
}

/**
 * Manually reassign a student to a different teacher
 * @param studentId - The student's user ID
 * @param newTeacherId - The new teacher's user ID
 * @param adminId - The admin performing the reassignment
 * @returns Success boolean and error message if any
 */
export async function reassignStudentToTeacher(
  studentId: string,
  newTeacherId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const studentRef = adminDb.collection("users").doc(studentId);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      return { success: false, error: "Student not found" };
    }

    const studentData = studentDoc.data();
    const oldTeacherId = studentData?.allocatedTeacherId;

    // Check if new teacher is eligible
    const newTeacherRef = adminDb.collection("users").doc(newTeacherId);
    const newTeacherDoc = await newTeacherRef.get();

    if (!newTeacherDoc.exists) {
      return { success: false, error: "New teacher not found" };
    }

    const newTeacherData = newTeacherDoc.data();
    
    if (newTeacherData?.role !== "music_teacher") {
      return { success: false, error: "User is not a music teacher" };
    }

    const teacherStatus = newTeacherData?.subscriptionStatus;
    if (!teacherStatus || (teacherStatus !== "active" && teacherStatus !== "trial")) {
      return { success: false, error: "Teacher subscription is not active" };
    }

    const currentCount = newTeacherData?.studentsAllocatedCount || 0;
    const maxStudents = newTeacherData?.teacherMaxStudents || 0;

    if (maxStudents > 0 && currentCount >= maxStudents) {
      return { success: false, error: "Teacher has reached student capacity" };
    }

    // Decrement old teacher's count if exists
    if (oldTeacherId && oldTeacherId !== newTeacherId) {
      const oldTeacherRef = adminDb.collection("users").doc(oldTeacherId);
      const oldTeacherDoc = await oldTeacherRef.get();
      if (oldTeacherDoc.exists) {
        const oldCount = oldTeacherDoc.data()?.studentsAllocatedCount || 0;
        if (oldCount > 0) {
          await oldTeacherRef.update({
            studentsAllocatedCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Deactivate old allocation record
      const oldAllocations = await adminDb.collection("studentAllocations")
        .where("studentId", "==", studentId)
        .where("teacherId", "==", oldTeacherId)
        .where("status", "==", "active")
        .get();

      for (const allocDoc of oldAllocations.docs) {
        await allocDoc.ref.update({
          status: "inactive",
          endDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Update student record
    await studentRef.update({
      allocatedTeacherId: newTeacherId,
      allocatedTeacherName: newTeacherData.name || "Unknown Teacher",
      allocationStatus: "ALLOCATED",
      allocationDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment new teacher's count
    await newTeacherRef.update({
      studentsAllocatedCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create new allocation record
    const subscriptionEndDate = studentData?.subscriptionEndDate;
    await adminDb.collection("studentAllocations").add({
      studentId,
      teacherId: newTeacherId,
      planId: studentData?.planId || null,
      status: "active",
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: subscriptionEndDate || null,
      createdBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error reassigning student to teacher:", error);
    return {
      success: false,
      error: "Failed to reassign student: " + error.message,
    };
  }
}

