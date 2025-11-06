import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Zap, Shield } from "lucide-react";

/**
 * Feature list for upgrade plans
 */
const features = [
  "Unlimited music generation",
  "High-quality audio exports",
  "Advanced raga and tala options",
  "Priority support",
  "Cloud storage for compositions",
  "Commercial usage rights",
];

/**
 * DashboardUpgrade component - upgrade/subscription page
 */
export default function DashboardUpgrade() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>5 compositions per month</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Standard quality audio</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Basic raga and tala options</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary border-2 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              POPULAR
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Pro
            </CardTitle>
            <CardDescription>For serious musicians</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enterprise
            </CardTitle>
            <CardDescription>For organizations</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">Custom</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              <Zap className="mr-2 h-4 w-4" />
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </div>

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

