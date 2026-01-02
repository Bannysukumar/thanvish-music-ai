import { useState } from "react";
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
 * Guest info form validation schema
 */
const guestInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid mobile number"),
});

type GuestInfoFormData = z.infer<typeof guestInfoSchema>;

/**
 * Props for GuestInfoModal component
 */
interface GuestInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * GuestInfoModal component - collects name and mobile number for guest users
 */
export function GuestInfoModal({
  open,
  onOpenChange,
  onSuccess,
}: GuestInfoModalProps) {
  const { guestLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestInfoSchema),
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: GuestInfoFormData) => {
    setIsLoading(true);
    try {
      await guestLogin(data.name, data.mobileNumber);
      toast({
        title: "Welcome!",
        description: "You're now logged in as a guest",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to continue as guest",
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
          <DialogTitle>Continue as Guest</DialogTitle>
          <DialogDescription>
            Please enter your name and mobile number to continue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Mobile number field */}
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="+1 234 567 8900"
              {...register("mobileNumber")}
              disabled={isLoading}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-destructive">
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              "Continue as Guest"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

