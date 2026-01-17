import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Zap, Shield, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { useLocation } from "wouter";

interface UpgradePlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  role: string;
  planType?: "free" | "paid" | "free_trial";
  billingCycle?: "monthly" | "yearly";
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * DashboardUpgrade component - upgrade/subscription page with Razorpay payments
 */
export default function DashboardUpgrade() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<UpgradePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchUpgradePlans();
    checkPaymentsEnabled();
  }, []);

  const checkPaymentsEnabled = async () => {
    try {
      const response = await fetch("/api/payments/razorpay-key");
      if (response.ok) {
        const data = await response.json();
        setPaymentsEnabled(data.enabled === true);
      }
    } catch (error) {
      console.error("Error checking payments status:", error);
    }
  };

  const fetchUpgradePlans = async () => {
    try {
      const response = await fetch("/api/upgrade-plans");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch plans" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch plans");
      }
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error: any) {
      console.error("Error fetching upgrade plans:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load upgrade plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `₹${price.toFixed(2)}`;
  };

  const formatDuration = (days: number) => {
    if (days === 30) return "month";
    if (days === 365) return "year";
    if (days % 30 === 0) return `${days / 30} months`;
    return `${days} days`;
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      music_teacher: "Music Teacher",
      artist: "Artist",
      music_director: "Music Director",
      doctor: "Doctor",
      astrologer: "Astrologer",
      student: "Student",
    };
    return roleMap[role] || role;
  };

  const handlePurchase = async (planId: string, billingCycle: "monthly" | "yearly") => {
    if (!user || user.isGuest) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a plan",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (!paymentsEnabled) {
      toast({
        title: "Payments Disabled",
        description: "Payments are currently disabled. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(`${planId}_${billingCycle}`);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await currentUser.getIdToken();

      // Create payment order
      const orderResponse = await fetch("/api/payments/create-subscription-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Get Razorpay key
      const keyResponse = await fetch("/api/payments/razorpay-key");
      if (!keyResponse.ok) {
        throw new Error("Failed to get Razorpay key");
      }
      const keyData = await keyResponse.json();
      if (!keyData.keyId) {
        throw new Error("Razorpay is not configured");
      }

      // Initialize Razorpay checkout
      const options = {
        key: keyData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Thanvish Music AI",
        description: `Subscription Plan - ${billingCycle}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/payments/verify-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                paymentId: orderData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Payment verification failed");
            }

            const verifyData = await verifyResponse.json();

            toast({
              title: "Success",
              description: verifyData.message || "Payment successful! Your plan is now active.",
            });

            // Redirect based on role assignment or default dashboard
            setTimeout(() => {
              if (verifyData.roleAssigned && verifyData.roleName) {
                // Redirect to role-specific dashboard
                const roleDashboardMap: Record<string, string> = {
                  student: "/dashboard/student",
                  music_teacher: "/dashboard/teacher",
                  artist: "/dashboard/artist",
                  music_director: "/dashboard/director",
                  doctor: "/dashboard/doctor",
                  astrologer: "/dashboard/astrologer",
                };
                const dashboardPath = roleDashboardMap[verifyData.roleName] || "/dashboard";
                window.location.href = dashboardPath;
              } else {
                // Default dashboard redirect
                window.location.href = "/dashboard";
              }
            }, 2000);
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Failed to verify payment. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(null);
            toast({
              title: "Payment Cancelled",
              description: "Payment not completed. No changes were made.",
              variant: "default",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Payment failed or cancelled. No changes were made.",
        variant: "destructive",
      });
      setProcessingPayment(null);
    }
  };

  const handleActivateFree = async (planId: string) => {
    if (!user || user.isGuest) {
      toast({
        title: "Authentication Required",
        description: "Please log in to activate a plan",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    // For free plans, you might want to call an API to activate directly
    // For now, show a message
    toast({
      title: "Free Plan",
      description: "Please contact support to activate free plans, or upgrade to a paid plan.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Upgrade</h1>
        <p className="text-muted-foreground mt-2">
          Unlock premium features and enhance your music creation experience
        </p>
      </div>

      {!paymentsEnabled && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Payments are currently disabled. Please contact support.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pricing plans */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No upgrade plans available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isFree = plan.price === 0 || plan.planType === "free";
            const isProcessing = processingPayment?.startsWith(plan.id);

            return (
              <Card
                key={plan.id}
                className={index === 1 ? "border-primary border-2 relative" : ""}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {index === 1 && <Crown className="h-5 w-5 text-primary" />}
                    {index === plans.length - 1 && <Shield className="h-5 w-5" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    {getRoleLabel(plan.role)} Plan
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/{formatDuration(plan.duration)}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.length > 0 ? (
                      plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">No features listed</li>
                    )}
                  </ul>
                  
                  {isFree ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleActivateFree(plan.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        variant={index === 1 ? "default" : "outline"}
                        onClick={() => handlePurchase(plan.id, "monthly")}
                        disabled={!paymentsEnabled || isProcessing}
                      >
                        {isProcessing && processingPayment === `${plan.id}_monthly` ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Buy Monthly
                          </>
                        )}
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handlePurchase(plan.id, "yearly")}
                        disabled={!paymentsEnabled || isProcessing}
                      >
                        {isProcessing && processingPayment === `${plan.id}_yearly` ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Buy Yearly
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Why Upgrade?</CardTitle>
          <CardDescription>
            Discover the benefits of our premium plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Unlimited Creation</h3>
              <p className="text-sm text-muted-foreground">
                Generate as many compositions as you want without limits
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Export high-quality audio files for professional use
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Priority Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help when you need it with dedicated support channels
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
