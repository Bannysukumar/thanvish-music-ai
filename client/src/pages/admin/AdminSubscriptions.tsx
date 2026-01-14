import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  role: string;
  name: string;
  price: number;
  duration: number; // days
  features: string[];
  usageLimits?: {
    dailyGenerations?: number;
    monthlyGenerations?: number;
  };
}

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    role: "",
    name: "",
    price: "",
    duration: "",
    features: [] as string[],
    newFeature: "",
    usageLimits: {
      dailyGenerations: "",
      monthlyGenerations: "",
    },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/subscription-plans", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch plans");

      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: "music_teacher", label: "Music Teacher" },
    { value: "artist", label: "Artist" },
    { value: "music_director", label: "Music Director" },
    { value: "doctor", label: "Doctor" },
    { value: "astrologer", label: "Astrologer" },
  ];

  const handleOpenPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        role: plan.role,
        name: plan.name,
        price: plan.price.toString(),
        duration: plan.duration.toString(),
        features: plan.features || [],
        newFeature: "",
        usageLimits: {
          dailyGenerations: plan.usageLimits?.dailyGenerations?.toString() || "",
          monthlyGenerations: plan.usageLimits?.monthlyGenerations?.toString() || "",
        },
      });
    } else {
      setEditingPlan(null);
      setPlanFormData({
        role: "",
        name: "",
        price: "",
        duration: "",
        features: [],
        newFeature: "",
        usageLimits: {
          dailyGenerations: "",
          monthlyGenerations: "",
        },
      });
    }
    setShowPlanModal(true);
  };

  const handleAddFeature = () => {
    if (planFormData.newFeature.trim()) {
      setPlanFormData({
        ...planFormData,
        features: [...planFormData.features, planFormData.newFeature.trim()],
        newFeature: "",
      });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index),
    });
  };

  const handleSavePlan = async () => {
    try {
      if (!planFormData.role || !planFormData.name || !planFormData.price || !planFormData.duration) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);

      const planData = {
        role: planFormData.role,
        name: planFormData.name,
        price: parseFloat(planFormData.price),
        duration: parseInt(planFormData.duration),
        features: planFormData.features,
        usageLimits: {
          dailyGenerations: planFormData.usageLimits.dailyGenerations ? parseInt(planFormData.usageLimits.dailyGenerations) : undefined,
          monthlyGenerations: planFormData.usageLimits.monthlyGenerations ? parseInt(planFormData.usageLimits.monthlyGenerations) : undefined,
        },
      };

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans";
      
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save plan");
      }

      toast({
        title: "Success",
        description: editingPlan ? "Plan updated successfully" : "Plan created successfully",
      });

      setShowPlanModal(false);
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete plan");

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions & Payment Control</h1>
        <p className="text-muted-foreground mt-2">
          Manage subscription plans, pricing, and user subscriptions
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="users">User Subscriptions</TabsTrigger>
          <TabsTrigger value="trials">Free Trials</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subscription Plans by Role</h2>
            <Button onClick={() => handleOpenPlanModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>

          {roles.map((role) => (
            <Card key={role.value}>
              <CardHeader>
                <CardTitle>{role.label} Plans</CardTitle>
                <CardDescription>
                  Manage subscription plans for {role.label.toLowerCase()}s
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plans.filter((p) => p.role === role.value).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No plans configured for {role.label}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleOpenPlanModal()}
                    >
                      Create First Plan
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans
                        .filter((p) => p.role === role.value)
                        .map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>${plan.price}</TableCell>
                            <TableCell>{plan.duration} days</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {plan.features.map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenPlanModal(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
              <CardDescription>
                View and manage individual user subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User subscription management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Free Trials & Manual Extensions</CardTitle>
              <CardDescription>
                Manage free trials and grant manual subscription extensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Trial management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Creation/Edit Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details, pricing, and features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={planFormData.role}
                onChange={(e) => setPlanFormData({ ...planFormData, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!!editingPlan}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                placeholder="e.g., Basic, Pro, Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={planFormData.duration}
                  onChange={(e) => setPlanFormData({ ...planFormData, duration: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={planFormData.newFeature}
                  onChange={(e) => setPlanFormData({ ...planFormData, newFeature: e.target.value })}
                  placeholder="Add feature"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature} variant="outline">
                  Add
                </Button>
              </div>
              {planFormData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {planFormData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Usage Limits (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyGenerations">Daily Generations</Label>
                  <Input
                    id="dailyGenerations"
                    type="number"
                    min="0"
                    value={planFormData.usageLimits.dailyGenerations}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        usageLimits: {
                          ...planFormData.usageLimits,
                          dailyGenerations: e.target.value,
                        },
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyGenerations">Monthly Generations</Label>
                  <Input
                    id="monthlyGenerations"
                    type="number"
                    min="0"
                    value={planFormData.usageLimits.monthlyGenerations}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        usageLimits: {
                          ...planFormData.usageLimits,
                          monthlyGenerations: e.target.value,
                        },
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

