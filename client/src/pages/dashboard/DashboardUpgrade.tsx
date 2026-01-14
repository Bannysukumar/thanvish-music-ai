import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Zap, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradePlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  role: string;
}

/**
 * DashboardUpgrade component - upgrade/subscription page
 */
export default function DashboardUpgrade() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<UpgradePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpgradePlans();
  }, []);

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
    return `$${price.toFixed(2)}`;
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
    };
    return roleMap[role] || role;
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
          {plans.map((plan, index) => (
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
                <Button
                  className={index === 1 ? "w-full" : "w-full"}
                  variant={index === 1 ? "default" : "outline"}
                  onClick={() => {
                    // Navigate to upgrade page or handle purchase
                    if (plan.price > 0) {
                      window.location.href = "/dashboard/upgrade";
                    }
                  }}
                >
                  {plan.price === 0 ? (
                    "Current Plan"
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {index === plans.length - 1 ? "Buy Now" : `Upgrade to ${plan.name}`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
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

