import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * User type definition
 */
export interface User {
  id: string;
  email: string;
  name: string;
  mobileNumber?: string;
  isGuest: boolean;
  role?: string; // "user" | "music_teacher" | "artist" | "music_director" | "doctor" | "astrologer" | "student" | "admin" | "moderator"
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired";
  subscriptionExpiresAt?: string;
}

/**
 * Authentication context type
 */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, mobileNumber: string) => Promise<void>;
  guestLogin: (name: string, mobileNumber: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

/**
 * Create authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convert Firebase user to our User type
 * Fetches user profile from Firestore to get mobile number
 */
async function mapFirebaseUser(firebaseUser: FirebaseUser | null): Promise<User | null> {
  if (!firebaseUser) return null;

  try {
    // Fetch user profile from Firestore
    const userProfileRef = doc(db, "users", firebaseUser.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    
    let mobileNumber: string | undefined;
    let name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
    let role: string | undefined = "user"; // Default role
    let subscriptionStatus: "active" | "inactive" | "trial" | "expired" | undefined;
    let subscriptionExpiresAt: string | undefined;
    
    if (userProfileSnap.exists()) {
      const profileData = userProfileSnap.data();
      mobileNumber = profileData.mobileNumber;
      // Use name from Firestore if available, otherwise use displayName
      if (profileData.name) {
        name = profileData.name;
      }
      // Get role from Firestore (default to "user")
      role = profileData.role || "user";
      // Get subscription status
      subscriptionStatus = profileData.subscriptionStatus;
      subscriptionExpiresAt = profileData.subscriptionExpiresAt;
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      name,
      mobileNumber,
      isGuest: false,
      role,
      subscriptionStatus,
      subscriptionExpiresAt,
    };
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    // Return user without additional data if Firestore fetch fails
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      isGuest: false,
      role: "user",
    };
  }
}

/**
 * AuthProvider component - manages authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        const mappedUser = await mapFirebaseUser(firebaseUser);
        setUser(mappedUser);
      } else {
        // Check for guest user in localStorage
        const storedGuest = localStorage.getItem("guestUser");
        if (storedGuest) {
          try {
            const guestUser = JSON.parse(storedGuest);
            // If guest user has an ID, try to fetch from Firestore
            if (guestUser.id && guestUser.id.startsWith("guest_")) {
              try {
                const guestProfileRef = doc(db, "guestUsers", guestUser.id);
                const guestProfileSnap = await getDoc(guestProfileRef);
                if (guestProfileSnap.exists()) {
                  const profileData = guestProfileSnap.data();
                  guestUser.mobileNumber = profileData.mobileNumber;
                  guestUser.name = profileData.name || guestUser.name;
                }
              } catch (error) {
                console.error("Error fetching guest profile from Firestore:", error);
              }
            }
            setUser(guestUser);
          } catch (error) {
            console.error("Error parsing stored guest user:", error);
            localStorage.removeItem("guestUser");
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Login function - authenticates user with Firebase
   */
  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    try {
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated automatically via onAuthStateChanged
    } catch (error: any) {
      // Handle Firebase auth errors
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      throw new Error(errorMessage);
    }
  };

  /**
   * Signup function - creates new user account with Firebase
   * Requires email to be verified via OTP first
   */
  const signup = async (name: string, email: string, password: string, mobileNumber: string) => {
    if (!name || !email || !password || !mobileNumber) {
      throw new Error("All fields are required");
    }

    try {
      // Verify email is verified via OTP before creating account
      const verificationResponse = await fetch(`/api/auth/check-email-verification?email=${encodeURIComponent(email)}`);
      const verificationData = await verificationResponse.json();
      
      if (!verificationData.verified) {
        throw new Error("Email must be verified via OTP before creating an account. Please verify your email first.");
      }

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });
        
        // Store user profile with mobile number in Firestore
        // IMPORTANT: New signups always get role = "user" (default)
        const userProfileRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userProfileRef, {
          name: name.trim(),
          email: email.trim(),
          mobileNumber: mobileNumber.trim(),
          role: "user", // Default role - only admin can change this
          emailVerified: true, // Mark as verified since OTP was verified
          onboardingCompleted: false, // New users need to complete onboarding
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Clean up OTP after successful account creation
        try {
          await fetch("/api/auth/remove-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } catch (error) {
          // Ignore cleanup errors
          console.warn("Failed to cleanup OTP:", error);
        }
      }
      
      // User state will be updated automatically via onAuthStateChanged
    } catch (error: any) {
      // Handle Firebase auth errors
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.message?.includes("Email must be verified")) {
        errorMessage = error.message;
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      throw new Error(errorMessage);
    }
  };

  /**
   * Guest login - creates temporary guest session (stored in localStorage and Firestore)
   * Note: Guest users are not authenticated with Firebase
   * @param name - User's name (required)
   * @param mobileNumber - User's mobile number (required)
   */
  const guestLogin = async (name: string, mobileNumber: string) => {
    if (!name || !mobileNumber) {
      throw new Error("Name and mobile number are required for guest users");
    }

    // Check if guest mode is enabled
    try {
      const response = await fetch("/api/settings/guest-mode");
      if (response.ok) {
        const data = await response.json();
        if (data.enabled === false) {
          throw new Error("Guest mode is currently disabled. Please create an account to continue.");
        }
      }
    } catch (error) {
      // If it's already an error about guest mode being disabled, rethrow it
      if (error instanceof Error && error.message.includes("Guest mode is currently disabled")) {
        throw error;
      }
      // Otherwise, continue (default to enabled if check fails)
      console.warn("Could not verify guest mode status, proceeding with guest login");
    }

    const guestId = `guest_${Date.now()}`;
    const guestUser: User = {
      id: guestId,
      email: "",
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      isGuest: true,
    };

    // Store guest user profile in Firestore
    try {
      const guestProfileRef = doc(db, "guestUsers", guestId);
      await setDoc(guestProfileRef, {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error storing guest user in Firestore:", error);
      // Continue even if Firestore storage fails
    }

    // Also store in localStorage for quick access
    setUser(guestUser);
    localStorage.setItem("guestUser", JSON.stringify(guestUser));
  };

  /**
   * Logout function - signs out from Firebase and clears guest session
   */
  const logout = async () => {
    try {
      // Sign out from Firebase (if authenticated)
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      
      // Clear guest user from localStorage
      localStorage.removeItem("guestUser");
      
      // User state will be updated automatically via onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
      // Still clear local state even if Firebase signout fails
      setUser(null);
      localStorage.removeItem("guestUser");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        guestLogin,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

