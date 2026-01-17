import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, X, Search, User as UserIcon, User, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionPlan {
  id: string;
  role: string;
  name: string;
  planType?: "free" | "paid" | "free_trial";
  billingCycle?: "monthly" | "yearly";
  price: number;
  duration: number; // days
  validUntil?: string;
  trialDurationDays?: number;
  features: string[];
  displayOnUpgradePage?: boolean;
  usageLimits?: {
    dailyGenerations?: number;
    monthlyGenerations?: number;
  };
  teacherMaxStudents?: number;
  validityDays?: number;
  trialTeacherMaxStudents?: number;
  teacherMaxCourses?: number;
  teacherMaxLessons?: number;
  // Student plan fields
  studentMaxEnrollments?: number;
  autoAllocateTeacher?: boolean;
  allocationStrategy?: "LeastStudentsFirst" | "RoundRobin" | "NewestTeacherFirst";
  preferredTeacherCategory?: string;
  // Artist plan fields
  maxTrackUploadsPerDay?: number;
  maxTrackUploadsPerMonth?: number;
  maxAlbumsPublishedPerMonth?: number;
  // Director plan fields
  maxActiveProjects?: number;
  artistDiscoveryPerDay?: number;
  artistDiscoveryPerMonth?: number;
  maxShortlistsCreatePerMonth?: number;
  // Doctor plan fields
  maxProgramsCreatePerMonth?: number;
  maxTemplatesCreatePerMonth?: number;
  maxArticlesPublishPerMonth?: number;
  // Astrologer plan fields
  maxClientsActive?: number;
  maxReadingsPerMonth?: number;
  maxAstroTemplatesCreatePerMonth?: number;
  maxRasiRecommendationsCreatePerMonth?: number;
  maxHoroscopePostsPublishPerMonth?: number;
}

interface UserSubscription {
  id: string;
  email: string;
  name: string;
  role?: string;
  planId?: string;
  planName?: string;
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired" | "suspended" | "free";
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionExpiresAt?: string;
  // Student allocation fields
  allocatedTeacherId?: string;
  allocatedTeacherName?: string;
  allocationStatus?: string;
  billingCycle?: string;
  planType?: string;
  dailyGenerationUsed?: number;
  monthlyGenerationUsed?: number;
}

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // User subscriptions state
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [studentToReassign, setStudentToReassign] = useState<UserSubscription | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Array<{id: string, name: string, capacity: number}>>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [isRetryingAllocation, setIsRetryingAllocation] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    role: "",
    name: "",
    planType: "" as "free" | "paid" | "free_trial" | "",
    billingCycle: "" as "monthly" | "yearly" | "",
    price: "",
    duration: "",
    validUntil: "",
    trialDurationDays: "",
    features: [] as string[],
    newFeature: "",
    displayOnUpgradePage: false,
    usageLimits: {
      dailyGenerations: "",
      monthlyGenerations: "",
    },
    teacherMaxStudents: "",
    validityDays: "",
    trialTeacherMaxStudents: "",
    teacherMaxCourses: "",
    teacherMaxLessons: "",
    // Student plan fields
    studentMaxEnrollments: "",
    autoAllocateTeacher: true,
    allocationStrategy: "LeastStudentsFirst" as "LeastStudentsFirst" | "RoundRobin" | "NewestTeacherFirst",
    preferredTeacherCategory: "",
    // Artist plan fields
    maxTrackUploadsPerDay: "",
    maxTrackUploadsPerMonth: "",
    maxAlbumsPublishedPerMonth: "",
    // Director plan fields
    maxActiveProjects: "",
    artistDiscoveryPerDay: "",
    artistDiscoveryPerMonth: "",
    maxShortlistsCreatePerMonth: "",
    // Doctor plan fields
    maxProgramsCreatePerMonth: "",
    maxTemplatesCreatePerMonth: "",
    maxArticlesPublishPerMonth: "",
    // Astrologer plan fields
    maxClientsActive: "",
    maxReadingsPerMonth: "",
    maxAstroTemplatesCreatePerMonth: "",
    maxRasiRecommendationsCreatePerMonth: "",
    maxHoroscopePostsPublishPerMonth: "",
  });

  const fetchPlans = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/admin/subscription-plans", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminSession");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/admin/login";
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch plans" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch plans");
      }

      const data = await response.json();
      const plansData = data.plans || [];
      console.log("Fetched plans:", plansData);
      // Log first plan to see what fields are present
      if (plansData.length > 0) {
        console.log("Sample plan data:", plansData[0]);
      }
      setPlans(plansData);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        setIsLoadingUsers(false);
        return;
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminSession");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/admin/login";
        setIsLoadingUsers(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const usersList = data.users || [];
      
      // Get all plans once
      const plansResponse = await fetch("/api/admin/subscription-plans", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });
      
      if (plansResponse.status === 401) {
        localStorage.removeItem("adminSession");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/admin/login";
        setIsLoadingUsers(false);
        return;
      }
      
      const plansData = plansResponse.ok ? await plansResponse.json() : { plans: [] };
      const allPlans = plansData.plans || [];
      
      // Map users with plan details
      const usersWithPlans = usersList.map((user: any) => {
        if (user.planId) {
          const userPlan = allPlans.find((p: SubscriptionPlan) => p.id === user.planId);
          if (userPlan) {
            return {
              ...user,
              planName: userPlan.name,
              planType: userPlan.planType,
              billingCycle: userPlan.billingCycle,
            };
          }
        }
        return user;
      });
      
      console.log("Fetched users:", usersWithPlans.length, "users");
      setUsers(usersWithPlans);
      setFilteredUsers(usersWithPlans);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPlans();
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query) ||
            user.planName?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const roles = [
    { value: "user", label: "User" },
    { value: "student", label: "Student" },
    { value: "music_teacher", label: "Music Teacher" },
    { value: "artist", label: "Artist" },
    { value: "music_director", label: "Music Director" },
    { value: "doctor", label: "Doctor" },
    { value: "astrologer", label: "Astrologer" },
  ];

  const handleOpenPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      // Handle validUntil - could be a string, Date, or Firestore Timestamp
      let validUntilDate = "";
      if (plan.validUntil) {
        try {
          // If it's a Firestore Timestamp object (has toDate method)
          if (plan.validUntil && typeof plan.validUntil === 'object' && 'toDate' in plan.validUntil) {
            validUntilDate = plan.validUntil.toDate().toISOString().split('T')[0];
          } 
          // If it's already a Date object
          else if (plan.validUntil instanceof Date) {
            validUntilDate = plan.validUntil.toISOString().split('T')[0];
          }
          // If it's a string or timestamp number
          else {
            const date = new Date(plan.validUntil);
            if (!isNaN(date.getTime())) {
              validUntilDate = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.error("Error parsing validUntil date:", error);
          validUntilDate = "";
        }
      }
      
      // Ensure all fields have proper defaults
      const formData = {
        role: plan.role || "",
        name: plan.name || "",
        planType: plan.planType || "paid",
        billingCycle: plan.billingCycle || "monthly",
        price: plan.price !== undefined && plan.price !== null ? plan.price.toString() : "0",
        duration: plan.duration !== undefined && plan.duration !== null ? plan.duration.toString() : "",
        validUntil: validUntilDate,
        trialDurationDays: plan.trialDurationDays !== undefined && plan.trialDurationDays !== null ? plan.trialDurationDays.toString() : "",
        features: Array.isArray(plan.features) ? plan.features : [],
        newFeature: "",
        displayOnUpgradePage: plan.displayOnUpgradePage === true,
        usageLimits: {
          dailyGenerations: plan.usageLimits?.dailyGenerations !== undefined && plan.usageLimits?.dailyGenerations !== null ? plan.usageLimits.dailyGenerations.toString() : "",
          monthlyGenerations: plan.usageLimits?.monthlyGenerations !== undefined && plan.usageLimits?.monthlyGenerations !== null ? plan.usageLimits.monthlyGenerations.toString() : "",
        },
        teacherMaxStudents: plan.teacherMaxStudents !== undefined && plan.teacherMaxStudents !== null ? plan.teacherMaxStudents.toString() : "",
        validityDays: plan.validityDays !== undefined && plan.validityDays !== null ? plan.validityDays.toString() : (plan.duration !== undefined && plan.duration !== null ? plan.duration.toString() : ""),
        trialTeacherMaxStudents: plan.trialTeacherMaxStudents !== undefined && plan.trialTeacherMaxStudents !== null ? plan.trialTeacherMaxStudents.toString() : "",
        teacherMaxCourses: plan.teacherMaxCourses !== undefined && plan.teacherMaxCourses !== null ? plan.teacherMaxCourses.toString() : "",
        teacherMaxLessons: plan.teacherMaxLessons !== undefined && plan.teacherMaxLessons !== null ? plan.teacherMaxLessons.toString() : "",
        // Student plan fields
        studentMaxEnrollments: plan.studentMaxEnrollments !== undefined && plan.studentMaxEnrollments !== null ? plan.studentMaxEnrollments.toString() : "",
        autoAllocateTeacher: plan.autoAllocateTeacher !== undefined ? plan.autoAllocateTeacher : true,
        allocationStrategy: plan.allocationStrategy || "LeastStudentsFirst",
        preferredTeacherCategory: plan.preferredTeacherCategory || "",
        // Artist plan fields
        maxTrackUploadsPerDay: plan.maxTrackUploadsPerDay !== undefined && plan.maxTrackUploadsPerDay !== null ? plan.maxTrackUploadsPerDay.toString() : "",
        maxTrackUploadsPerMonth: plan.maxTrackUploadsPerMonth !== undefined && plan.maxTrackUploadsPerMonth !== null ? plan.maxTrackUploadsPerMonth.toString() : "",
        maxAlbumsPublishedPerMonth: plan.maxAlbumsPublishedPerMonth !== undefined && plan.maxAlbumsPublishedPerMonth !== null ? plan.maxAlbumsPublishedPerMonth.toString() : "",
        // Director plan fields
        maxActiveProjects: plan.maxActiveProjects !== undefined && plan.maxActiveProjects !== null ? plan.maxActiveProjects.toString() : "",
        artistDiscoveryPerDay: plan.artistDiscoveryPerDay !== undefined && plan.artistDiscoveryPerDay !== null ? plan.artistDiscoveryPerDay.toString() : "",
        artistDiscoveryPerMonth: plan.artistDiscoveryPerMonth !== undefined && plan.artistDiscoveryPerMonth !== null ? plan.artistDiscoveryPerMonth.toString() : "",
        maxShortlistsCreatePerMonth: plan.maxShortlistsCreatePerMonth !== undefined && plan.maxShortlistsCreatePerMonth !== null ? plan.maxShortlistsCreatePerMonth.toString() : "",
        // Doctor plan fields
        maxProgramsCreatePerMonth: plan.maxProgramsCreatePerMonth !== undefined && plan.maxProgramsCreatePerMonth !== null ? plan.maxProgramsCreatePerMonth.toString() : "",
        maxTemplatesCreatePerMonth: plan.maxTemplatesCreatePerMonth !== undefined && plan.maxTemplatesCreatePerMonth !== null ? plan.maxTemplatesCreatePerMonth.toString() : "",
        maxArticlesPublishPerMonth: plan.maxArticlesPublishPerMonth !== undefined && plan.maxArticlesPublishPerMonth !== null ? plan.maxArticlesPublishPerMonth.toString() : "",
        // Astrologer plan fields
        maxClientsActive: plan.maxClientsActive !== undefined && plan.maxClientsActive !== null ? plan.maxClientsActive.toString() : "",
        maxReadingsPerMonth: plan.maxReadingsPerMonth !== undefined && plan.maxReadingsPerMonth !== null ? plan.maxReadingsPerMonth.toString() : "",
        maxAstroTemplatesCreatePerMonth: plan.maxAstroTemplatesCreatePerMonth !== undefined && plan.maxAstroTemplatesCreatePerMonth !== null ? plan.maxAstroTemplatesCreatePerMonth.toString() : "",
        maxRasiRecommendationsCreatePerMonth: plan.maxRasiRecommendationsCreatePerMonth !== undefined && plan.maxRasiRecommendationsCreatePerMonth !== null ? plan.maxRasiRecommendationsCreatePerMonth.toString() : "",
        maxHoroscopePostsPublishPerMonth: plan.maxHoroscopePostsPublishPerMonth !== undefined && plan.maxHoroscopePostsPublishPerMonth !== null ? plan.maxHoroscopePostsPublishPerMonth.toString() : "",
      };
      
      setPlanFormData(formData);
    } else {
      setEditingPlan(null);
      setPlanFormData({
        role: "",
        name: "",
        planType: "",
        billingCycle: "",
        price: "",
        duration: "",
        validUntil: "",
        trialDurationDays: "",
        features: [],
        newFeature: "",
        displayOnUpgradePage: false,
        usageLimits: {
          dailyGenerations: "",
          monthlyGenerations: "",
        },
        teacherMaxStudents: "",
        validityDays: "",
        trialTeacherMaxStudents: "",
        teacherMaxCourses: "",
        teacherMaxLessons: "",
        // Student plan fields
        studentMaxEnrollments: "",
        autoAllocateTeacher: true,
        allocationStrategy: "LeastStudentsFirst",
        preferredTeacherCategory: "",
        // Artist plan fields
        maxTrackUploadsPerDay: "",
        maxTrackUploadsPerMonth: "",
        maxAlbumsPublishedPerMonth: "",
        // Director plan fields
        maxActiveProjects: "",
        artistDiscoveryPerDay: "",
        artistDiscoveryPerMonth: "",
        maxShortlistsCreatePerMonth: "",
        // Doctor plan fields
        maxProgramsCreatePerMonth: "",
        maxTemplatesCreatePerMonth: "",
        maxArticlesPublishPerMonth: "",
        // Astrologer plan fields
        maxClientsActive: "",
        maxReadingsPerMonth: "",
        maxAstroTemplatesCreatePerMonth: "",
        maxRasiRecommendationsCreatePerMonth: "",
        maxHoroscopePostsPublishPerMonth: "",
      });
    }
    setShowPlanModal(true);
  };

  const handleAddFeature = () => {
    if (planFormData.newFeature.trim()) {
      setPlanFormData({
        ...planFormData,
        features: [...planFormData.features, planFormData.newFeature.trim()],
        newFeature: "",
      });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index),
    });
  };

  const handleSavePlan = async () => {
    try {
      // Validate required fields
      if (!planFormData.role || !planFormData.name || !planFormData.planType || !planFormData.billingCycle) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Role, Name, Plan Type, Billing Cycle)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate price for paid plans
      if (planFormData.planType === "paid") {
        if (!planFormData.price || parseFloat(planFormData.price) < 0) {
          toast({
            title: "Error",
            description: "Price is required and must be >= 0 for paid plans",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Validate trial duration for free_trial plans
      if (planFormData.planType === "free_trial") {
        if (!planFormData.trialDurationDays || parseInt(planFormData.trialDurationDays) <= 0) {
          toast({
            title: "Error",
            description: "Trial duration (days) is required and must be > 0 for free trial plans",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Validate validity (either duration or validUntil)
      if (!planFormData.duration && !planFormData.validUntil) {
        toast({
          title: "Error",
          description: "Either Duration (days) or Valid Until (date) is required",
          variant: "destructive",
        });
        return;
      }
      
      // Validate usage limits - different for teacher vs other roles
      if (planFormData.role === "music_teacher") {
        // Validate teacher feature limits
        if (!planFormData.teacherMaxCourses || !planFormData.teacherMaxLessons) {
          toast({
            title: "Error",
            description: "Both Max Courses and Max Lessons are required for music_teacher plans",
            variant: "destructive",
          });
          return;
        }
        
        const maxCourses = parseInt(planFormData.teacherMaxCourses);
        const maxLessons = parseInt(planFormData.teacherMaxLessons);
        
        if (isNaN(maxCourses) || maxCourses < 0) {
          toast({
            title: "Error",
            description: "Max Courses must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
        
        if (isNaN(maxLessons) || maxLessons < 0) {
          toast({
            title: "Error",
            description: "Max Lessons must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      } else if (planFormData.role === "student") {
        // Student plans don't require generation limits - they use teacher allocation instead
        // Validation for student plans is handled in the student-specific validation section
      } else if (planFormData.role === "artist") {
        // Artist plans don't require generation limits - they use track/album limits instead
        // Validation for artist plans is handled in the artist-specific validation section
      } else if (planFormData.role === "music_director") {
        // Music director plans don't require generation limits - they use project/discovery/shortlist limits instead
        // Validation for director plans is handled in the director-specific validation section
      } else if (planFormData.role === "doctor") {
        // Doctor plans don't require generation limits - they use program/template/article limits instead
        // Validation for doctor plans is handled in the doctor-specific validation section
      } else if (planFormData.role === "astrologer") {
        // Astrologer plans don't require generation limits - they use client/reading/template/rasi/post limits instead
        // Validation for astrologer plans is handled in the astrologer-specific validation section
      } else {
        // Validate usage limits only for roles that require generation limits
        // Only: user requires generation limits
        if (!planFormData.usageLimits.dailyGenerations || !planFormData.usageLimits.monthlyGenerations) {
          toast({
            title: "Error",
            description: "Both Daily and Monthly generation limits are required",
            variant: "destructive",
          });
          return;
        }
        
        const dailyLimit = parseInt(planFormData.usageLimits.dailyGenerations);
        const monthlyLimit = parseInt(planFormData.usageLimits.monthlyGenerations);
        
        if (isNaN(dailyLimit) || dailyLimit < 0) {
          toast({
            title: "Error",
            description: "Daily generations limit must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
        
        if (isNaN(monthlyLimit) || monthlyLimit < 0) {
          toast({
            title: "Error",
            description: "Monthly generations limit must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      }

      // Teacher-specific validation
      if (planFormData.role === "music_teacher") {
        if (!planFormData.teacherMaxStudents || parseInt(planFormData.teacherMaxStudents) < 0) {
          toast({
            title: "Error",
            description: "Max Students Allocated is required and must be >= 0 for music_teacher plans",
            variant: "destructive",
          });
          return;
        }

        // ValidityDays is required for teacher plans (or use duration/validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for music_teacher plans",
            variant: "destructive",
          });
          return;
        }
      }

      // Student-specific validation
      if (planFormData.role === "student") {
        // ValidityDays is required for student plans (or use duration/validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for student plans",
            variant: "destructive",
          });
          return;
        }
        
        // Validate studentMaxEnrollments if provided (must be non-negative integer)
        if (planFormData.studentMaxEnrollments && planFormData.studentMaxEnrollments.trim() !== "") {
          const maxEnrollments = parseInt(planFormData.studentMaxEnrollments);
          if (isNaN(maxEnrollments) || maxEnrollments < 0) {
            toast({
              title: "Error",
              description: "Max Course Enrollments must be a non-negative integer (0 = unlimited)",
              variant: "destructive",
            });
            return;
          }
        }

        // If trial plan, validate trial teacher max students (optional, can be same as normal)
        if (planFormData.planType === "free_trial" && planFormData.trialTeacherMaxStudents) {
          const trialMax = parseInt(planFormData.trialTeacherMaxStudents);
          if (isNaN(trialMax) || trialMax < 0) {
            toast({
              title: "Error",
              description: "Trial Max Students must be a non-negative integer",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Artist-specific validation
      if (planFormData.role === "artist") {
        // ValidityDays is required for artist plans (or use duration/validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for artist plans",
            variant: "destructive",
          });
          return;
        }

        // Track upload limits are required
        if (!planFormData.maxTrackUploadsPerDay || planFormData.maxTrackUploadsPerDay === "") {
          toast({
            title: "Error",
            description: "Max Track Uploads Per Day is required for artist plans",
            variant: "destructive",
          });
          return;
        }
        if (!planFormData.maxTrackUploadsPerMonth || planFormData.maxTrackUploadsPerMonth === "") {
          toast({
            title: "Error",
            description: "Max Track Uploads Per Month is required for artist plans",
            variant: "destructive",
          });
          return;
        }

        const dailyLimit = parseInt(planFormData.maxTrackUploadsPerDay);
        const monthlyLimit = parseInt(planFormData.maxTrackUploadsPerMonth);
        if (isNaN(dailyLimit) || dailyLimit < 0) {
          toast({
            title: "Error",
            description: "Max Track Uploads Per Day must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
        if (isNaN(monthlyLimit) || monthlyLimit < 0) {
          toast({
            title: "Error",
            description: "Max Track Uploads Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Album publish limit is required
        if (!planFormData.maxAlbumsPublishedPerMonth || planFormData.maxAlbumsPublishedPerMonth === "") {
          toast({
            title: "Error",
            description: "Max Albums Published Per Month is required for artist plans",
            variant: "destructive",
          });
          return;
        }

        const albumLimit = parseInt(planFormData.maxAlbumsPublishedPerMonth);
        if (isNaN(albumLimit) || albumLimit < 0) {
          toast({
            title: "Error",
            description: "Max Albums Published Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      }

      // Director-specific validation
      if (planFormData.role === "music_director") {
        // ValidityDays is required for director plans (or use duration/validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for music_director plans",
            variant: "destructive",
          });
          return;
        }

        // Max Active Projects is required
        if (!planFormData.maxActiveProjects || planFormData.maxActiveProjects === "") {
          toast({
            title: "Error",
            description: "Max Active Projects is required for music_director plans",
            variant: "destructive",
          });
          return;
        }
        const projectLimit = parseInt(planFormData.maxActiveProjects);
        if (isNaN(projectLimit) || projectLimit < 0) {
          toast({
            title: "Error",
            description: "Max Active Projects must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Artist Discovery limits are required
        if (!planFormData.artistDiscoveryPerDay || planFormData.artistDiscoveryPerDay === "") {
          toast({
            title: "Error",
            description: "Artist Discovery Per Day is required for music_director plans",
            variant: "destructive",
          });
          return;
        }
        if (!planFormData.artistDiscoveryPerMonth || planFormData.artistDiscoveryPerMonth === "") {
          toast({
            title: "Error",
            description: "Artist Discovery Per Month is required for music_director plans",
            variant: "destructive",
          });
          return;
        }
        const discoveryDailyLimit = parseInt(planFormData.artistDiscoveryPerDay);
        const discoveryMonthlyLimit = parseInt(planFormData.artistDiscoveryPerMonth);
        if (isNaN(discoveryDailyLimit) || discoveryDailyLimit < 0) {
          toast({
            title: "Error",
            description: "Artist Discovery Per Day must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
        if (isNaN(discoveryMonthlyLimit) || discoveryMonthlyLimit < 0) {
          toast({
            title: "Error",
            description: "Artist Discovery Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Shortlists Create Per Month is required
        if (!planFormData.maxShortlistsCreatePerMonth || planFormData.maxShortlistsCreatePerMonth === "") {
          toast({
            title: "Error",
            description: "Max Shortlists Create Per Month is required for music_director plans",
            variant: "destructive",
          });
          return;
        }
        const shortlistLimit = parseInt(planFormData.maxShortlistsCreatePerMonth);
        if (isNaN(shortlistLimit) || shortlistLimit < 0) {
          toast({
            title: "Error",
            description: "Max Shortlists Create Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      }

      // Doctor-specific validation
      if (planFormData.role === "doctor") {
        // ValidityDays is required for doctor plans (or use duration/validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for doctor plans",
            variant: "destructive",
          });
          return;
        }

        // Max Programs Create Per Month is required
        if (!planFormData.maxProgramsCreatePerMonth || planFormData.maxProgramsCreatePerMonth === "") {
          toast({
            title: "Error",
            description: "Max Programs Create Per Month is required for doctor plans",
            variant: "destructive",
          });
          return;
        }
        const programsLimit = parseInt(planFormData.maxProgramsCreatePerMonth);
        if (isNaN(programsLimit) || programsLimit < 0) {
          toast({
            title: "Error",
            description: "Max Programs Create Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Templates Create Per Month is required
        if (!planFormData.maxTemplatesCreatePerMonth || planFormData.maxTemplatesCreatePerMonth === "") {
          toast({
            title: "Error",
            description: "Max Templates Create Per Month is required for doctor plans",
            variant: "destructive",
          });
          return;
        }
        const templatesLimit = parseInt(planFormData.maxTemplatesCreatePerMonth);
        if (isNaN(templatesLimit) || templatesLimit < 0) {
          toast({
            title: "Error",
            description: "Max Templates Create Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Articles Publish Per Month is required
        if (!planFormData.maxArticlesPublishPerMonth || planFormData.maxArticlesPublishPerMonth === "") {
          toast({
            title: "Error",
            description: "Max Articles Publish Per Month is required for doctor plans",
            variant: "destructive",
          });
          return;
        }
        const articlesLimit = parseInt(planFormData.maxArticlesPublishPerMonth);
        if (isNaN(articlesLimit) || articlesLimit < 0) {
          toast({
            title: "Error",
            description: "Max Articles Publish Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      }

      // Astrologer-specific validations
      if (planFormData.role === "astrologer") {
        // Validity Days is required (can be provided via validityDays, duration, or validUntil)
        if (!planFormData.validityDays && !planFormData.duration && !planFormData.validUntil) {
          toast({
            title: "Error",
            description: "Validity Days (or Duration/Valid Until) is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }

        // Max Clients Active is required
        if (!planFormData.maxClientsActive || planFormData.maxClientsActive === "") {
          toast({
            title: "Error",
            description: "Max Clients Active is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }
        const clientsLimit = parseInt(planFormData.maxClientsActive);
        if (isNaN(clientsLimit) || clientsLimit < 0) {
          toast({
            title: "Error",
            description: "Max Clients Active must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Readings Per Month is required
        if (!planFormData.maxReadingsPerMonth || planFormData.maxReadingsPerMonth === "") {
          toast({
            title: "Error",
            description: "Max Readings Per Month is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }
        const readingsLimit = parseInt(planFormData.maxReadingsPerMonth);
        if (isNaN(readingsLimit) || readingsLimit < 0) {
          toast({
            title: "Error",
            description: "Max Readings Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Astro Templates Create Per Month is required
        if (!planFormData.maxAstroTemplatesCreatePerMonth || planFormData.maxAstroTemplatesCreatePerMonth === "") {
          toast({
            title: "Error",
            description: "Max Astro Templates Create Per Month is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }
        const templatesLimit = parseInt(planFormData.maxAstroTemplatesCreatePerMonth);
        if (isNaN(templatesLimit) || templatesLimit < 0) {
          toast({
            title: "Error",
            description: "Max Astro Templates Create Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Rasi Recommendations Create Per Month is required
        if (!planFormData.maxRasiRecommendationsCreatePerMonth || planFormData.maxRasiRecommendationsCreatePerMonth === "") {
          toast({
            title: "Error",
            description: "Max Rasi Recommendations Create Per Month is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }
        const rasiLimit = parseInt(planFormData.maxRasiRecommendationsCreatePerMonth);
        if (isNaN(rasiLimit) || rasiLimit < 0) {
          toast({
            title: "Error",
            description: "Max Rasi Recommendations Create Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }

        // Max Horoscope Posts Publish Per Month is required
        if (!planFormData.maxHoroscopePostsPublishPerMonth || planFormData.maxHoroscopePostsPublishPerMonth === "") {
          toast({
            title: "Error",
            description: "Max Horoscope Posts Publish Per Month is required for astrologer plans",
            variant: "destructive",
          });
          return;
        }
        const postsLimit = parseInt(planFormData.maxHoroscopePostsPublishPerMonth);
        if (isNaN(postsLimit) || postsLimit < 0) {
          toast({
            title: "Error",
            description: "Max Horoscope Posts Publish Per Month must be a non-negative integer",
            variant: "destructive",
          });
          return;
        }
      }

      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);

      const planData: any = {
        role: planFormData.role,
        name: planFormData.name,
        planType: planFormData.planType,
        billingCycle: planFormData.billingCycle,
        price: planFormData.planType === "paid" ? parseFloat(planFormData.price) : 0,
        features: planFormData.features,
        displayOnUpgradePage: planFormData.displayOnUpgradePage,
      };
      
      // Only send duration OR validUntil, not both (prefer validUntil if both are provided)
      if (planFormData.validUntil && planFormData.validUntil.trim() !== "") {
        planData.validUntil = planFormData.validUntil;
        // Don't send duration if validUntil is provided
      } else if (planFormData.duration && planFormData.duration.trim() !== "") {
        planData.duration = parseInt(planFormData.duration);
      }

      // Set usage limits based on role
      if (planFormData.role === "music_teacher") {
        // For teachers, use teacher feature limits instead of generation limits
        planData.usageLimits = {
          dailyGenerations: 0, // Teachers don't use generation limits
          monthlyGenerations: 0,
        };
        // Always send teacherMaxCourses and teacherMaxLessons, even if 0
        // Handle empty strings, null, undefined, or valid numbers
        const maxCoursesStr = planFormData.teacherMaxCourses?.trim() || "0";
        const maxLessonsStr = planFormData.teacherMaxLessons?.trim() || "0";
        const maxCourses = parseInt(maxCoursesStr);
        const maxLessons = parseInt(maxLessonsStr);
        planData.teacherMaxCourses = isNaN(maxCourses) ? 0 : maxCourses;
        planData.teacherMaxLessons = isNaN(maxLessons) ? 0 : maxLessons;
      } else if (planFormData.role === "student") {
        // For students, set generation limits to 0 (students don't use generation limits)
        planData.usageLimits = {
          dailyGenerations: 0,
          monthlyGenerations: 0,
        };
      } else if (planFormData.role === "artist") {
        // For artists, set generation limits to 0 (artists use track/album limits instead)
        planData.usageLimits = {
          dailyGenerations: 0,
          monthlyGenerations: 0,
        };
      } else if (planFormData.role === "music_director") {
        // For directors, set generation limits to 0 (directors use project/discovery/shortlist limits instead)
        planData.usageLimits = {
          dailyGenerations: 0,
          monthlyGenerations: 0,
        };
      } else if (planFormData.role === "doctor") {
        // For doctors, set generation limits to 0 (doctors use program/template/article limits instead)
        planData.usageLimits = {
          dailyGenerations: 0,
          monthlyGenerations: 0,
        };
      } else {
        // For other roles (user, doctor, astrologer), use generation limits
        planData.usageLimits = {
          dailyGenerations: parseInt(planFormData.usageLimits.dailyGenerations) || 0,
          monthlyGenerations: parseInt(planFormData.usageLimits.monthlyGenerations) || 0,
        };
      }
      
      // Teacher-specific fields
      if (planFormData.role === "music_teacher") {
        planData.teacherMaxStudents = parseInt(planFormData.teacherMaxStudents);
        // Prefer validityDays if provided, otherwise use duration
        if (planFormData.validityDays) {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration) {
          planData.validityDays = parseInt(planFormData.duration);
        }
      }

      // Student-specific fields
      if (planFormData.role === "student") {
        // ValidityDays is required for student plans
        if (planFormData.validityDays) {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration) {
          planData.validityDays = parseInt(planFormData.duration);
        }
        // Enrollment limit (0 means unlimited)
        planData.studentMaxEnrollments = parseInt(planFormData.studentMaxEnrollments) || 0;
        // Auto-allocation settings
        planData.autoAllocateTeacher = planFormData.autoAllocateTeacher !== false; // Default to true
        planData.allocationStrategy = planFormData.allocationStrategy || "LeastStudentsFirst";
        if (planFormData.preferredTeacherCategory) {
          planData.preferredTeacherCategory = planFormData.preferredTeacherCategory;
        }
      }

      // Artist-specific fields
      if (planFormData.role === "artist") {
        // ValidityDays is required for artist plans
        if (planFormData.validityDays) {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration) {
          planData.validityDays = parseInt(planFormData.duration);
        }
        // Track upload limits
        planData.maxTrackUploadsPerDay = parseInt(planFormData.maxTrackUploadsPerDay) || 0;
        planData.maxTrackUploadsPerMonth = parseInt(planFormData.maxTrackUploadsPerMonth) || 0;
        // Album publish limit
        planData.maxAlbumsPublishedPerMonth = parseInt(planFormData.maxAlbumsPublishedPerMonth) || 0;
      }

      // Director-specific fields
      if (planFormData.role === "music_director") {
        // ValidityDays is required for director plans
        if (planFormData.validityDays && planFormData.validityDays.trim() !== "") {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration && planFormData.duration.trim() !== "") {
          planData.validityDays = parseInt(planFormData.duration);
        } else if (planFormData.validUntil && planFormData.validUntil.trim() !== "") {
          // Calculate validityDays from validUntil
          const validUntilDate = new Date(planFormData.validUntil);
          const now = new Date();
          const daysDiff = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) {
            planData.validityDays = daysDiff;
          }
        }
        // Project limit - always include, even if 0
        const maxProjectsStr = planFormData.maxActiveProjects?.trim() || "0";
        const maxProjects = parseInt(maxProjectsStr);
        planData.maxActiveProjects = isNaN(maxProjects) ? 0 : maxProjects;
        // Artist discovery limits - always include, even if 0
        const discoveryDayStr = planFormData.artistDiscoveryPerDay?.trim() || "0";
        const discoveryMonthStr = planFormData.artistDiscoveryPerMonth?.trim() || "0";
        const discoveryDay = parseInt(discoveryDayStr);
        const discoveryMonth = parseInt(discoveryMonthStr);
        planData.artistDiscoveryPerDay = isNaN(discoveryDay) ? 0 : discoveryDay;
        planData.artistDiscoveryPerMonth = isNaN(discoveryMonth) ? 0 : discoveryMonth;
        // Shortlist creation limit - always include, even if 0
        const maxShortlistsStr = planFormData.maxShortlistsCreatePerMonth?.trim() || "0";
        const maxShortlists = parseInt(maxShortlistsStr);
        planData.maxShortlistsCreatePerMonth = isNaN(maxShortlists) ? 0 : maxShortlists;
      }

      // Doctor-specific fields
      if (planFormData.role === "doctor") {
        // ValidityDays is required for doctor plans
        if (planFormData.validityDays && planFormData.validityDays.trim() !== "") {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration && planFormData.duration.trim() !== "") {
          planData.validityDays = parseInt(planFormData.duration);
        } else if (planFormData.validUntil && planFormData.validUntil.trim() !== "") {
          // Calculate validityDays from validUntil
          const validUntilDate = new Date(planFormData.validUntil);
          const now = new Date();
          const daysDiff = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) {
            planData.validityDays = daysDiff;
          }
        }
        // Program limit - always include, even if 0
        const maxProgramsStr = planFormData.maxProgramsCreatePerMonth?.trim() || "0";
        const maxPrograms = parseInt(maxProgramsStr);
        planData.maxProgramsCreatePerMonth = isNaN(maxPrograms) ? 0 : maxPrograms;
        // Template limit - always include, even if 0
        const maxTemplatesStr = planFormData.maxTemplatesCreatePerMonth?.trim() || "0";
        const maxTemplates = parseInt(maxTemplatesStr);
        planData.maxTemplatesCreatePerMonth = isNaN(maxTemplates) ? 0 : maxTemplates;
        // Article limit - always include, even if 0
        const maxArticlesStr = planFormData.maxArticlesPublishPerMonth?.trim() || "0";
        const maxArticles = parseInt(maxArticlesStr);
        planData.maxArticlesPublishPerMonth = isNaN(maxArticles) ? 0 : maxArticles;
      }

      // Astrologer-specific plan data
      if (planFormData.role === "astrologer") {
        // Validity Days - prefer validityDays if provided, otherwise use duration or validUntil
        if (planFormData.validityDays && planFormData.validityDays.trim() !== "") {
          planData.validityDays = parseInt(planFormData.validityDays);
        } else if (planFormData.duration && planFormData.duration.trim() !== "") {
          planData.validityDays = parseInt(planFormData.duration);
        } else if (planFormData.validUntil && planFormData.validUntil.trim() !== "") {
          // Calculate validityDays from validUntil
          const validUntilDate = new Date(planFormData.validUntil);
          const now = new Date();
          const daysDiff = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) {
            planData.validityDays = daysDiff;
          }
        }
        // Client limit - always include, even if 0
        const maxClientsStr = planFormData.maxClientsActive?.trim() || "0";
        const maxClients = parseInt(maxClientsStr);
        planData.maxClientsActive = isNaN(maxClients) ? 0 : maxClients;
        // Reading limit - always include, even if 0
        const maxReadingsStr = planFormData.maxReadingsPerMonth?.trim() || "0";
        const maxReadings = parseInt(maxReadingsStr);
        planData.maxReadingsPerMonth = isNaN(maxReadings) ? 0 : maxReadings;
        // Template limit - always include, even if 0
        const maxTemplatesStr = planFormData.maxAstroTemplatesCreatePerMonth?.trim() || "0";
        const maxTemplates = parseInt(maxTemplatesStr);
        planData.maxAstroTemplatesCreatePerMonth = isNaN(maxTemplates) ? 0 : maxTemplates;
        // Rasi limit - always include, even if 0
        const maxRasiStr = planFormData.maxRasiRecommendationsCreatePerMonth?.trim() || "0";
        const maxRasi = parseInt(maxRasiStr);
        planData.maxRasiRecommendationsCreatePerMonth = isNaN(maxRasi) ? 0 : maxRasi;
        // Post limit - always include, even if 0
        const maxPostsStr = planFormData.maxHoroscopePostsPublishPerMonth?.trim() || "0";
        const maxPosts = parseInt(maxPostsStr);
        planData.maxHoroscopePostsPublishPerMonth = isNaN(maxPosts) ? 0 : maxPosts;
      }
      
      if (planFormData.planType === "free_trial" && planFormData.trialDurationDays) {
        planData.trialDurationDays = parseInt(planFormData.trialDurationDays);
        // Trial teacher max students (optional)
        if (planFormData.role === "music_teacher" && planFormData.trialTeacherMaxStudents) {
          planData.trialTeacherMaxStudents = parseInt(planFormData.trialTeacherMaxStudents);
        }
      }

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans";
      
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error saving plan:", error);
        console.error("Request payload:", JSON.stringify(planData, null, 2));
        throw new Error(error.error || "Failed to save plan");
      }

      toast({
        title: "Success",
        description: editingPlan ? "Plan updated successfully" : "Plan created successfully",
      });

      setShowPlanModal(false);
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/subscription-plans/${planToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete plan");
      }

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      setShowDeleteDialog(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAssignPlanModal = (user: UserSubscription) => {
    setSelectedUser(user);
    setSelectedPlanId(user.planId || "");
    setPlanStartDate(new Date().toISOString().split('T')[0]);
    setShowAssignPlanModal(true);
  };

  const handleReassignTeacher = async (student: UserSubscription) => {
    if (!student.id || student.role !== "student") return;
    
    try {
      // Fetch available teachers
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/admin/teachers/available", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTeachers(data.teachers || []);
        setStudentToReassign(student);
        setSelectedTeacherId("");
        setShowReassignModal(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch available teachers",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch teachers",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReassign = async () => {
    if (!studentToReassign || !selectedTeacherId) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive",
      });
      return;
    }

    setIsReassigning(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/students/${studentToReassign.id}/reassign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student reassigned successfully",
        });
        setShowReassignModal(false);
        setStudentToReassign(null);
        setSelectedTeacherId("");
        fetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to reassign student",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error reassigning student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reassign student",
        variant: "destructive",
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleRetryAllocation = async (student: UserSubscription) => {
    if (!student.id || !student.planId) return;

    setIsRetryingAllocation(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/students/${student.id}/retry-allocation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          planId: student.planId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Success",
            description: `Student allocated to ${result.teacherName}`,
          });
        } else {
          toast({
            title: "Allocation Failed",
            description: result.error || "No teachers available",
            variant: "destructive",
          });
        }
        fetchUsers(); // Refresh user list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to retry allocation",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error retrying allocation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to retry allocation",
        variant: "destructive",
      });
    } finally {
      setIsRetryingAllocation(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlanId) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      setIsAssigningPlan(true);

      const response = await fetch(`/api/admin/users/${selectedUser.id}/assign-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          startDate: planStartDate || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign plan");
      }

      toast({
        title: "Success",
        description: "Plan assigned successfully",
      });

      setShowAssignPlanModal(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign plan",
        variant: "destructive",
      });
    } finally {
      setIsAssigningPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions & Payment Control</h1>
        <p className="text-muted-foreground mt-2">
          Manage subscription plans, pricing, and user subscriptions
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="users">User Subscriptions</TabsTrigger>
          <TabsTrigger value="trials">Free Trials</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subscription Plans by Role</h2>
            <Button onClick={() => handleOpenPlanModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>

          {roles.map((role) => (
            <Card key={role.value}>
              <CardHeader>
                <CardTitle>{role.label} Plans</CardTitle>
                <CardDescription>
                  Manage subscription plans for {role.label.toLowerCase()}s
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plans.filter((p) => p.role === role.value).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No plans configured for {role.label}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleOpenPlanModal()}
                    >
                      Create First Plan
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans
                        .filter((p) => p.role === role.value)
                        .map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>${plan.price}</TableCell>
                            <TableCell>{plan.duration} days</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {plan.features.map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {plan.displayOnUpgradePage && (
                                  <Badge variant="secondary" className="text-xs">
                                    On Upgrade Page
                                  </Badge>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenPlanModal(plan);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeletePlan(plan);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Subscriptions</CardTitle>
                  <CardDescription>
                    View and manage individual user subscriptions. Search users and assign/activate plans.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or plan name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredUsers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                )}
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? "No users found matching your search" : "No users found"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Allocation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const startDate = user.subscriptionStartDate 
                          ? new Date(user.subscriptionStartDate).toLocaleDateString()
                          : "N/A";
                        const endDate = user.subscriptionEndDate || user.subscriptionExpiresAt
                          ? new Date(user.subscriptionEndDate || user.subscriptionExpiresAt || "").toLocaleDateString()
                          : "N/A";
                        
                        // Calculate days remaining
                        let daysRemaining = null;
                        if (user.subscriptionEndDate || user.subscriptionExpiresAt) {
                          const end = new Date(user.subscriptionEndDate || user.subscriptionExpiresAt || "");
                          const now = new Date();
                          const diffTime = end.getTime() - now.getTime();
                          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role || "user"}</Badge>
                            </TableCell>
                            <TableCell>
                              {user.planName ? (
                                <div>
                                  <div className="font-medium">{user.planName}</div>
                                  {user.billingCycle && (
                                    <div className="text-xs text-muted-foreground">
                                      {user.billingCycle === "monthly" ? "Monthly" : "Yearly"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No Plan</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.subscriptionStatus === "active" ? "default" :
                                  user.subscriptionStatus === "trial" ? "secondary" :
                                  user.subscriptionStatus === "expired" ? "destructive" :
                                  "outline"
                                }
                              >
                                {user.subscriptionStatus?.toUpperCase() || "INACTIVE"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{startDate}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{endDate}</span>
                                {daysRemaining !== null && (
                                  <span className={`text-xs ml-1 ${daysRemaining <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                                    ({daysRemaining > 0 ? `${daysRemaining}d left` : "Expired"})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.role === "student" ? (
                                <div className="text-sm">
                                  {user.allocatedTeacherName ? (
                                    <div>
                                      <div className="font-medium">Teacher: {user.allocatedTeacherName}</div>
                                      <Badge 
                                        variant={user.allocationStatus === "ALLOCATED" ? "default" : "secondary"}
                                        className="text-xs mt-1"
                                      >
                                        {user.allocationStatus || "PENDING"}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      {user.allocationStatus === "PENDING" ? "Pending" : "Not Allocated"}
                                    </Badge>
                                  )}
                                </div>
                              ) : user.dailyGenerationUsed !== undefined && user.monthlyGenerationUsed !== undefined ? (
                                <div className="text-sm">
                                  <div>Daily: {user.dailyGenerationUsed}</div>
                                  <div>Monthly: {user.monthlyGenerationUsed}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </TableCell>
                            {filteredUsers.some(u => u.role === "student") && (
                              <TableCell>
                                {user.role === "student" ? (
                                  <div className="flex gap-2">
                                    {user.allocatedTeacherId && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleReassignTeacher(user)}
                                      >
                                        <User className="h-4 w-4 mr-1" />
                                        Reassign
                                      </Button>
                                    )}
                                    {user.allocationStatus === "PENDING" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRetryAllocation(user)}
                                      >
                                        <Loader2 className="h-4 w-4 mr-1" />
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignPlanModal(user)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Assign Plan
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Free Trials & Manual Extensions</CardTitle>
              <CardDescription>
                Manage free trials and grant manual subscription extensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Trial management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Creation/Edit Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details, pricing, and features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={planFormData.role}
                onChange={(e) => setPlanFormData({ ...planFormData, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!!editingPlan}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                placeholder="e.g., Basic, Pro, Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planType">Plan Type *</Label>
                <select
                  id="planType"
                  value={planFormData.planType}
                  onChange={(e) => {
                    const newType = e.target.value as "free" | "paid" | "free_trial" | "";
                    setPlanFormData({ 
                      ...planFormData, 
                      planType: newType,
                      price: newType === "free" || newType === "free_trial" ? "0" : planFormData.price
                    });
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select plan type</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="free_trial">Free Trial</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <select
                  id="billingCycle"
                  value={planFormData.billingCycle}
                  onChange={(e) => setPlanFormData({ ...planFormData, billingCycle: e.target.value as "monthly" | "yearly" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select billing cycle</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {planFormData.planType === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}

            {planFormData.planType === "free_trial" && (
              <div className="space-y-2">
                <Label htmlFor="trialDurationDays">Trial Duration (days) *</Label>
                <Input
                  id="trialDurationDays"
                  type="number"
                  min="1"
                  value={planFormData.trialDurationDays}
                  onChange={(e) => setPlanFormData({ ...planFormData, trialDurationDays: e.target.value })}
                  placeholder="7"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={planFormData.duration}
                  onChange={(e) => {
                    const days = e.target.value;
                    let calculatedValidUntil = "";
                    
                    // Auto-calculate validUntil when duration is entered
                    if (days && !isNaN(parseInt(days)) && parseInt(days) > 0) {
                      const today = new Date();
                      const validUntilDate = new Date(today);
                      validUntilDate.setDate(today.getDate() + parseInt(days));
                      calculatedValidUntil = validUntilDate.toISOString().split('T')[0];
                    }
                    
                    setPlanFormData({ 
                      ...planFormData, 
                      duration: days,
                      validUntil: calculatedValidUntil
                    });
                  }}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">OR use Valid Until date below</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until (date)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={planFormData.validUntil}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    let calculatedDuration = "";
                    
                    // Auto-calculate duration when validUntil is manually changed
                    if (selectedDate) {
                      const today = new Date();
                      const validUntilDate = new Date(selectedDate);
                      const diffTime = validUntilDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays > 0) {
                        calculatedDuration = diffDays.toString();
                      }
                    }
                    
                    setPlanFormData({ 
                      ...planFormData, 
                      validUntil: selectedDate,
                      duration: calculatedDuration || planFormData.duration // Keep existing duration if calculation fails
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">OR use Duration (days) above</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={planFormData.newFeature}
                  onChange={(e) => setPlanFormData({ ...planFormData, newFeature: e.target.value })}
                  placeholder="Add feature"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature} variant="outline">
                  Add
                </Button>
              </div>
              {planFormData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {planFormData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayOnUpgradePage"
                checked={planFormData.displayOnUpgradePage}
                onCheckedChange={(checked) =>
                  setPlanFormData({
                    ...planFormData,
                    displayOnUpgradePage: checked === true,
                  })
                }
              />
              <Label htmlFor="displayOnUpgradePage" className="cursor-pointer">
                Display on Upgrade Page
              </Label>
            </div>

            {/* Usage Limits - Different for Music Teacher vs Other Roles */}
            {planFormData.role === "student" ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Student Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for student plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentMaxEnrollments">Max Course Enrollments *</Label>
                    <Input
                      id="studentMaxEnrollments"
                      type="number"
                      min="0"
                      value={planFormData.studentMaxEnrollments}
                      onChange={(e) => setPlanFormData({ ...planFormData, studentMaxEnrollments: e.target.value })}
                      placeholder="0 (unlimited)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of courses the student can enroll in. Set to 0 for unlimited enrollments.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoAllocateTeacher"
                      checked={planFormData.autoAllocateTeacher}
                      onChange={(e) => setPlanFormData({ ...planFormData, autoAllocateTeacher: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="autoAllocateTeacher" className="font-normal cursor-pointer">
                      Auto-allocate Teacher
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically assign student to a teacher when plan is activated
                    </p>
                  </div>

                  {planFormData.autoAllocateTeacher && (
                    <div className="space-y-2">
                      <Label htmlFor="allocationStrategy">Allocation Strategy *</Label>
                      <Select
                        value={planFormData.allocationStrategy}
                        onValueChange={(value: "LeastStudentsFirst" | "RoundRobin" | "NewestTeacherFirst") =>
                          setPlanFormData({ ...planFormData, allocationStrategy: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LeastStudentsFirst">Least Students First (Recommended)</SelectItem>
                          <SelectItem value="RoundRobin">Round Robin</SelectItem>
                          <SelectItem value="NewestTeacherFirst">Newest Teacher First</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        How to select which teacher to assign
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="preferredTeacherCategory">Preferred Teacher Category (Optional)</Label>
                    <Input
                      id="preferredTeacherCategory"
                      value={planFormData.preferredTeacherCategory}
                      onChange={(e) => setPlanFormData({ ...planFormData, preferredTeacherCategory: e.target.value })}
                      placeholder="e.g., Piano, Guitar, Vocals"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Prefer teachers in this category
                    </p>
                  </div>
                </div>
              </div>
            ) : planFormData.role === "music_teacher" ? (
              <div className="space-y-2">
                <Label>Music Teacher Feature Limits *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Set limits for teacher features. Set to 0 to disable that feature.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherMaxCourses">Max Courses *</Label>
                    <Input
                      id="teacherMaxCourses"
                      type="number"
                      min="0"
                      value={planFormData.teacherMaxCourses}
                      onChange={(e) => setPlanFormData({ ...planFormData, teacherMaxCourses: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of courses the teacher can create
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacherMaxLessons">Max Lessons *</Label>
                    <Input
                      id="teacherMaxLessons"
                      type="number"
                      min="0"
                      value={planFormData.teacherMaxLessons}
                      onChange={(e) => setPlanFormData({ ...planFormData, teacherMaxLessons: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of lessons the teacher can create
                    </p>
                  </div>
                </div>
              </div>
            ) : planFormData.role === "artist" ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Artist Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for artist plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Track Upload Limits *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxTrackUploadsPerDay">Max Track Uploads Per Day *</Label>
                        <Input
                          id="maxTrackUploadsPerDay"
                          type="number"
                          min="0"
                          value={planFormData.maxTrackUploadsPerDay}
                          onChange={(e) => setPlanFormData({ ...planFormData, maxTrackUploadsPerDay: e.target.value })}
                          placeholder="0"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum tracks the artist can upload per day. Set to 0 to disable.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxTrackUploadsPerMonth">Max Track Uploads Per Month *</Label>
                        <Input
                          id="maxTrackUploadsPerMonth"
                          type="number"
                          min="0"
                          value={planFormData.maxTrackUploadsPerMonth}
                          onChange={(e) => setPlanFormData({ ...planFormData, maxTrackUploadsPerMonth: e.target.value })}
                          placeholder="0"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum tracks the artist can upload per month. Set to 0 to disable.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAlbumsPublishedPerMonth">Max Albums Published Per Month *</Label>
                    <Input
                      id="maxAlbumsPublishedPerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxAlbumsPublishedPerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxAlbumsPublishedPerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum albums the artist can publish per month. Set to 0 to disable.
                    </p>
                  </div>
                </div>
              </div>
            ) : planFormData.role === "music_director" ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Music Director Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for music_director plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxActiveProjects">Max Active Projects *</Label>
                    <Input
                      id="maxActiveProjects"
                      type="number"
                      min="0"
                      value={planFormData.maxActiveProjects}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxActiveProjects: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum active projects (draft, live, in_progress, review). Set to 0 to disable. Completed/archived projects don't count.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Artist Discovery Limits *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="artistDiscoveryPerDay">Artist Discovery Per Day *</Label>
                        <Input
                          id="artistDiscoveryPerDay"
                          type="number"
                          min="0"
                          value={planFormData.artistDiscoveryPerDay}
                          onChange={(e) => setPlanFormData({ ...planFormData, artistDiscoveryPerDay: e.target.value })}
                          placeholder="0"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum discovery searches/browses per day. Set to 0 to disable.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="artistDiscoveryPerMonth">Artist Discovery Per Month *</Label>
                        <Input
                          id="artistDiscoveryPerMonth"
                          type="number"
                          min="0"
                          value={planFormData.artistDiscoveryPerMonth}
                          onChange={(e) => setPlanFormData({ ...planFormData, artistDiscoveryPerMonth: e.target.value })}
                          placeholder="0"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum discovery searches/browses per month. Set to 0 to disable.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxShortlistsCreatePerMonth">Max Shortlists Create Per Month *</Label>
                    <Input
                      id="maxShortlistsCreatePerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxShortlistsCreatePerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxShortlistsCreatePerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum shortlists the director can create per month. Set to 0 to disable.
                    </p>
                  </div>
                </div>
              </div>
            ) : planFormData.role === "doctor" ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Doctor Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for doctor plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxProgramsCreatePerMonth">Max Programs Create Per Month *</Label>
                    <Input
                      id="maxProgramsCreatePerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxProgramsCreatePerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxProgramsCreatePerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum therapy programs the doctor can create per month. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTemplatesCreatePerMonth">Max Templates Create Per Month *</Label>
                    <Input
                      id="maxTemplatesCreatePerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxTemplatesCreatePerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxTemplatesCreatePerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum session templates the doctor can create per month. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxArticlesPublishPerMonth">Max Articles Publish Per Month *</Label>
                    <Input
                      id="maxArticlesPublishPerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxArticlesPublishPerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxArticlesPublishPerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum guidance articles the doctor can publish per month. Set to 0 to disable.
                    </p>
                  </div>
                </div>
              </div>
            ) : planFormData.role === "astrologer" ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Astrologer Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for astrologer plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxClientsActive">Max Clients Active *</Label>
                    <Input
                      id="maxClientsActive"
                      type="number"
                      min="0"
                      value={planFormData.maxClientsActive}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxClientsActive: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum client profiles the astrologer can have active at a time. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxReadingsPerMonth">Max Readings Per Month *</Label>
                    <Input
                      id="maxReadingsPerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxReadingsPerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxReadingsPerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum readings the astrologer can create per month. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAstroTemplatesCreatePerMonth">Max Astro Templates Create Per Month *</Label>
                    <Input
                      id="maxAstroTemplatesCreatePerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxAstroTemplatesCreatePerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxAstroTemplatesCreatePerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum astro music templates the astrologer can create per month. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRasiRecommendationsCreatePerMonth">Max Rasi Recommendations Create Per Month *</Label>
                    <Input
                      id="maxRasiRecommendationsCreatePerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxRasiRecommendationsCreatePerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxRasiRecommendationsCreatePerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum rasi recommendation sets the astrologer can create per month. Set to 0 to disable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxHoroscopePostsPublishPerMonth">Max Horoscope Posts Publish Per Month *</Label>
                    <Input
                      id="maxHoroscopePostsPublishPerMonth"
                      type="number"
                      min="0"
                      value={planFormData.maxHoroscopePostsPublishPerMonth}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxHoroscopePostsPublishPerMonth: e.target.value })}
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum horoscope content posts the astrologer can publish per month. Set to 0 to disable. Draft posts don't count.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Usage Limits *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Both daily and monthly limits are required. Set to 0 to disable generation for that period.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyGenerations">Daily Generations *</Label>
                    <Input
                      id="dailyGenerations"
                      type="number"
                      min="0"
                      value={planFormData.usageLimits.dailyGenerations}
                      onChange={(e) =>
                        setPlanFormData({
                          ...planFormData,
                          usageLimits: {
                            ...planFormData.usageLimits,
                            dailyGenerations: e.target.value,
                          },
                        })
                      }
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyGenerations">Monthly Generations *</Label>
                    <Input
                      id="monthlyGenerations"
                      type="number"
                      min="0"
                      value={planFormData.usageLimits.monthlyGenerations}
                      onChange={(e) =>
                        setPlanFormData({
                          ...planFormData,
                          usageLimits: {
                            ...planFormData.usageLimits,
                            monthlyGenerations: e.target.value,
                          },
                        })
                      }
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Teacher-specific fields */}
            {planFormData.role === "music_teacher" && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Teacher Plan Settings *</Label>
                  <p className="text-xs text-muted-foreground">
                    These fields are required for music_teacher plans
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherMaxStudents">Max Students Allocated *</Label>
                  <Input
                    id="teacherMaxStudents"
                    type="number"
                    min="0"
                    value={planFormData.teacherMaxStudents}
                    onChange={(e) => setPlanFormData({ ...planFormData, teacherMaxStudents: e.target.value })}
                    placeholder="50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of students that can be assigned to this teacher. Set to 0 to disable student allocation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validityDays">Validity Days *</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    value={planFormData.validityDays}
                    onChange={(e) => setPlanFormData({ ...planFormData, validityDays: e.target.value })}
                    placeholder="30"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days the teacher plan is valid. Can also use Duration (days) above.
                  </p>
                </div>

                {planFormData.planType === "free_trial" && (
                  <div className="space-y-2">
                    <Label htmlFor="trialTeacherMaxStudents">Trial Max Students (Optional)</Label>
                    <Input
                      id="trialTeacherMaxStudents"
                      type="number"
                      min="0"
                      value={planFormData.trialTeacherMaxStudents}
                      onChange={(e) => setPlanFormData({ ...planFormData, trialTeacherMaxStudents: e.target.value })}
                      placeholder="Same as Max Students"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Separate student limit for trial period. Leave empty to use same as Max Students.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Modal */}
      <Dialog open={showAssignPlanModal} onOpenChange={setShowAssignPlanModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Plan to User</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to {selectedUser?.name || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userPlan">Select Plan *</Label>
              <select
                id="userPlan"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.role}) - ${plan.price} - {plan.duration} days
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planStartDate">Start Date *</Label>
              <Input
                id="planStartDate"
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The subscription will start from this date. Validity will be calculated automatically.
              </p>
            </div>

            {selectedPlanId && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Plan Details:</p>
                {(() => {
                  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
                  if (!selectedPlan) return null;
                  
                  const startDate = planStartDate ? new Date(planStartDate) : new Date();
                  const endDate = new Date(startDate);
                  endDate.setDate(endDate.getDate() + selectedPlan.duration);
                  
                  return (
                    <div className="text-sm space-y-1">
                      <div>Plan: {selectedPlan.name}</div>
                      <div>Duration: {selectedPlan.duration} days</div>
                      <div>Start: {startDate.toLocaleDateString()}</div>
                      <div>End: {endDate.toLocaleDateString()}</div>
                      <div>Daily Limit: {selectedPlan.usageLimits?.dailyGenerations || 0}</div>
                      <div>Monthly Limit: {selectedPlan.usageLimits?.monthlyGenerations || 0}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignPlanModal(false)} disabled={isAssigningPlan}>
              Cancel
            </Button>
            <Button onClick={handleAssignPlan} disabled={isAssigningPlan || !selectedPlanId}>
              {isAssigningPlan ? "Assigning..." : "Assign Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Teacher Modal */}
      <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reassign Teacher</DialogTitle>
            <DialogDescription>
              Reassign {studentToReassign?.name || "student"} to a different teacher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacherSelect">Select Teacher *</Label>
              <select
                id="teacherSelect"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a teacher</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.capacity} slots available)
                  </option>
                ))}
              </select>
              {availableTeachers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No available teachers found. All teachers may have reached their capacity.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReassignModal(false);
                setStudentToReassign(null);
                setSelectedTeacherId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReassign}
              disabled={!selectedTeacherId || isReassigning}
            >
              {isReassigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reassigning...
                </>
              ) : (
                "Reassign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the plan{" "}
              <strong>{planToDelete?.name}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setPlanToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

