import { useState } from "react";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

/**
 * Type for auth modal views
 */
type AuthView = "login" | "signup" | "forgot-password";

/**
 * Props for AuthModal component
 */
interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AuthModal component - manages switching between login, signup, and forgot password modals
 */
export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [view, setView] = useState<AuthView>("login");
  const { guestLogin } = useAuth();
  const [, setLocation] = useLocation();

  /**
   * Handle guest login and navigate to dashboard
   */
  const handleGuestLogin = () => {
    guestLogin();
    onOpenChange(false);
    setLocation("/dashboard");
  };

  /**
   * Handle successful login/signup and navigate to dashboard
   */
  const handleAuthSuccess = () => {
    onOpenChange(false);
    setLocation("/dashboard");
  };

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        open={open && view === "login"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onOpenChange(false);
          }
        }}
        onSwitchToSignup={() => setView("signup")}
        onSwitchToForgotPassword={() => setView("forgot-password")}
        onGuestLogin={handleGuestLogin}
        onSuccess={handleAuthSuccess}
      />

      {/* Signup Modal */}
      <SignupModal
        open={open && view === "signup"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onOpenChange(false);
          }
        }}
        onSwitchToLogin={() => setView("login")}
        onSuccess={handleAuthSuccess}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={open && view === "forgot-password"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setView("login");
            onOpenChange(false);
          }
        }}
      />
    </>
  );
}

