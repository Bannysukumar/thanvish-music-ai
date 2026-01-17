import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, ArrowLeft, Lock, Loader2, Calendar, DollarSign } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

interface Project {
  id: string;
  title: string;
  projectType: string;
  description: string;
  status: "draft" | "live" | "in_progress" | "review" | "completed" | "archived";
  deadline?: string;
  budgetRange?: string;
  createdAt?: any;
}

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isNew = location === "/dashboard/director/projects/new";
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    projectType: "",
    description: "",
    deadline: "",
    budgetRange: "",
  });
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "music_director" && !isNew) {
      fetchProjects();
    }
  }, [user, isNew]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const projectsQuery = query(
        collection(db, "directorProjects"),
        where("directorId", "==", user.id)
      );
      const querySnapshot = await getDocs(projectsQuery);
      const projectsData: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        projectsData.push({
          id: doc.id,
          ...doc.data(),
        } as Project);
      });

      // Sort by creation date (newest first)
      projectsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.title || !formData.projectType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to create projects",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check project limit before creating
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const limitCheckResponse = await fetch("/api/director/check-project-limit", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!limitCheckResponse.ok) {
        const errorData = await limitCheckResponse.json();
        toast({
          title: "Limit Reached",
          description: errorData.error || "Cannot create more projects. Please upgrade your plan.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const limitData = await limitCheckResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Project Limit Reached",
          description: limitData.error || `You've reached your active project limit (${limitData.maxActiveProjects}). Please complete or archive existing projects, or upgrade your plan.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const projectData = {
        title: formData.title,
        projectType: formData.projectType,
        description: formData.description || "",
        deadline: formData.deadline || null,
        budgetRange: formData.budgetRange || null,
        directorId: user.id,
        directorName: user.name,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "directorProjects"), projectData);

      toast({
        title: "Success",
        description: "Project created successfully!",
      });

      // Reset form and redirect
      setFormData({
        title: "",
        projectType: "",
        description: "",
        deadline: "",
        budgetRange: "",
      });

      setLocation("/dashboard/director/projects");
      fetchProjects();
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/director/projects")}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Create Project</h1>
            <p className="text-muted-foreground mt-2">
              Create a new project and start collaborating
            </p>
          </div>
        </div>

        {isLocked && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Subscription Required
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    Creating projects requires an active subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Provide details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Feature Film Background Score"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type *</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                  disabled={isLocked || isLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="film">Film</SelectItem>
                    <SelectItem value="ad">Ad</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="series">Web Series</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Brief</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project and requirements..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLocked || isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    disabled={isLocked || isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetRange">Budget Range (Optional)</Label>
                  <Input
                    id="budgetRange"
                    placeholder="e.g., $5,000 - $10,000"
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    disabled={isLocked || isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/director/projects")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLocked || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    );
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your film, album, and media projects
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/director/projects/new")}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet</p>
              <p className="text-sm mt-2">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === "live"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : project.status === "in_progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : project.status === "completed"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <CardDescription className="capitalize">{project.projectType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {project.budgetRange && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {project.budgetRange}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

