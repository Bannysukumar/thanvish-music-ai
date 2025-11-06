import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * User type definition
 */
export interface User {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
}

/**
 * Authentication context type
 */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => void;
  logout: () => void;
  isLoading: boolean;
}

/**
 * Create authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convert Firebase user to our User type
 */
function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    isGuest: false,
  };
}

/**
 * AuthProvider component - manages authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        // Check for guest user in localStorage
        const storedGuest = localStorage.getItem("guestUser");
        if (storedGuest) {
          try {
            setUser(JSON.parse(storedGuest));
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
   */
  const signup = async (name: string, email: string, password: string) => {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });
      }
      
      // User state will be updated automatically via onAuthStateChanged
    } catch (error: any) {
      // Handle Firebase auth errors
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
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
   * Guest login - creates temporary guest session (stored in localStorage)
   * Note: Guest users are not authenticated with Firebase
   */
  const guestLogin = () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      email: "",
      name: "Guest",
      isGuest: true,
    };

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

