import { useState } from "react";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { GuestInfoModal } from "./GuestInfoModal";
import { useLocation } from "wouter";

/**
 * Type for auth modal views
 */
type AuthView = "login" | "signup" | "forgot-password" | "guest-info";

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
  const [, setLocation] = useLocation();

  /**
   * Handle guest login button click - show guest info modal
   */
  const handleGuestLogin = () => {
    setView("guest-info");
  };

  /**
   * Handle successful login and navigate to dashboard (or onboarding if not completed)
   */
  const handleLoginSuccess = () => {
    onOpenChange(false);
    setLocation("/dashboard");
  };

  /**
   * Handle successful signup and navigate to onboarding
   */
  const handleSignupSuccess = () => {
    onOpenChange(false);
    setLocation("/onboarding");
  };

  /**
   * Handle successful guest login and navigate to dashboard
   */
  const handleGuestSuccess = () => {
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
        onSuccess={handleLoginSuccess}
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
        onSuccess={handleSignupSuccess}
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

      {/* Guest Info Modal */}
      <GuestInfoModal
        open={open && view === "guest-info"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setView("login");
            onOpenChange(false);
          }
        }}
        onSuccess={handleGuestSuccess}
      />
    </>
  );
}

