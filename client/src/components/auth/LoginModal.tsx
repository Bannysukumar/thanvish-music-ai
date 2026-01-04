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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Props for LoginModal component
 */
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onGuestLogin: () => void;
  onSuccess?: () => void;
}

/**
 * LoginModal component - handles user login
 */
export function LoginModal({
  open,
  onOpenChange,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onGuestLogin,
  onSuccess,
}: LoginModalProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [guestModeEnabled, setGuestModeEnabled] = useState(true); // Default to enabled

  // Check guest mode status
  useEffect(() => {
    const checkGuestMode = async () => {
      try {
        const response = await fetch("/api/settings/guest-mode");
        if (response.ok) {
          const data = await response.json();
          setGuestModeEnabled(data.enabled !== false); // Default to true if not set
        }
      } catch (error) {
        console.error("Error checking guest mode:", error);
        // Default to enabled on error
        setGuestModeEnabled(true);
      }
    };

    if (open) {
      checkGuestMode();
    }
  }, [open]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your email and password to access your account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot password link */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToForgotPassword}
              className="text-sm"
            >
              Forgot Password?
            </Button>
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          {/* Guest login section - only show if guest mode is enabled */}
          {guestModeEnabled && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Guest login button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onGuestLogin}
                disabled={isLoading}
              >
                Continue as Guest
              </Button>
            </>
          )}

          {/* Sign up link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToSignup}
              className="p-0 h-auto font-semibold"
            >
              Sign Up
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

