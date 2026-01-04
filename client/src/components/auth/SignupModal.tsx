import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Mail, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Signup form validation schema
 */
const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    mobileNumber: z
      .string()
      .min(10, "Mobile number must be at least 10 digits")
      .regex(/^[0-9+\-\s()]+$/, "Please enter a valid mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Props for SignupModal component
 */
interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

/**
 * Helper function to check password strength
 */
function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  let strength: "weak" | "medium" | "strong" = "weak";
  if (passedChecks === 4) strength = "strong";
  else if (passedChecks >= 2) strength = "medium";

  return { strength, checks };
}

/**
 * SignupModal component - handles user registration with email OTP verification
 */
export function SignupModal({
  open,
  onOpenChange,
  onSwitchToLogin,
  onSuccess,
}: SignupModalProps) {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  
  // OTP verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Watch password for strength indicator
  const watchedPassword = watch("password", "");
  const watchedEmail = watch("email", "");

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setPassword("");
      setEmailVerified(false);
      setOtpSent(false);
      setOtp("");
      setResendCooldown(0);
      setEmailError(null);
    }
  }, [open, reset]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * Send OTP to email
   */
  const handleSendOTP = async () => {
    const email = getValues("email");
    
    if (!email) {
      setEmailError("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSendingOTP(true);
    setEmailError(null);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setResendCooldown(data.resendCooldown || 30);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      setEmailError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  /**
   * Verify OTP
   */
  const handleVerifyOTP = async () => {
    const email = getValues("email");

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      setEmailVerified(true);
      setOtp("");
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await handleSendOTP();
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: SignupFormData) => {
    // Check if email is verified
    if (!emailVerified) {
      toast({
        title: "Email Not Verified",
        description: "Please verify your email address before creating an account",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signup(data.name, data.email, data.password, data.mobileNumber);
      toast({
        title: "Account created",
        description: "Welcome! Your account has been created successfully.",
      });
      reset();
      setPassword("");
      setEmailVerified(false);
      setOtpSent(false);
      setOtp("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : null;
  const isEmailValid = watchedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const canSendOTP = isEmailValid && !emailVerified && !isSendingOTP;
  const canCreateAccount = emailVerified && 
    getValues("name") && 
    getValues("email") && 
    getValues("mobileNumber") && 
    getValues("password") && 
    getValues("confirmPassword") &&
    !errors.password &&
    !errors.confirmPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Enter your information to create a new account. Email verification is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
              disabled={isLoading || emailVerified}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email field with OTP verification */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={isLoading || emailVerified}
                  className={emailVerified ? "pr-10" : ""}
                />
                {emailVerified && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                )}
              </div>
              {!emailVerified && (
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={!canSendOTP || isSendingOTP}
                  variant="outline"
                >
                  {isSendingOTP ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              )}
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
            {emailVerified && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email verified successfully
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* OTP Input Section (shown after OTP is sent) */}
          {otpSent && !emailVerified && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label>Enter Verification Code</Label>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={isVerifyingOTP}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || isVerifyingOTP}
                    className="flex-1"
                  >
                    {isVerifyingOTP ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || isSendingOTP}
                    variant="outline"
                  >
                    {resendCooldown > 0 ? (
                      `${resendCooldown}s`
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  OTP expires in 5 minutes. {resendCooldown > 0 && `Resend available in ${resendCooldown}s`}
                </p>
              </div>
            </div>
          )}

          {/* Mobile number field */}
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="+1 234 567 8900"
              {...register("mobileNumber")}
              disabled={isLoading || !emailVerified}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-destructive">
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...register("password")}
              disabled={isLoading || !emailVerified}
              onChange={(e) => {
                setPassword(e.target.value);
                register("password").onChange(e);
              }}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}

            {/* Password strength indicator */}
            {watchedPassword && passwordStrength && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Password strength:</span>
                  <span
                    className={`font-semibold ${
                      passwordStrength.strength === "strong"
                        ? "text-green-600"
                        : passwordStrength.strength === "medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.length ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordStrength.checks.length ? "" : "text-muted-foreground"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.uppercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordStrength.checks.uppercase ? "" : "text-muted-foreground"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.lowercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordStrength.checks.lowercase ? "" : "text-muted-foreground"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.number ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordStrength.checks.number ? "" : "text-muted-foreground"}>
                      One number
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              disabled={isLoading || !emailVerified}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !canCreateAccount}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {!emailVerified && (
            <Alert>
              <AlertDescription className="text-sm text-muted-foreground">
                Please verify your email address before creating an account.
              </AlertDescription>
            </Alert>
          )}

          {/* Login link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToLogin}
              className="p-0 h-auto font-semibold"
            >
              Login
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
