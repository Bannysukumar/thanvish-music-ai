import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Protected route for Student role
 * Redirects to regular dashboard if user is not a student
 */
export function StudentRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is not a student, redirect to regular dashboard
      if (user.role !== "student") {
        setLocation("/dashboard");
      }
    } else if (!isLoading && !user) {
      // If not logged in, redirect to home
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not a student, don't render children (redirect will happen)
  if (!user || user.role !== "student") {
    return null;
  }

  return <>{children}</>;
}

