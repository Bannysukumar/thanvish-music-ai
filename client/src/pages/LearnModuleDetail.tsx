import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowLeft, Loader2, Award } from "lucide-react";
import type { LearningModule } from "@shared/schema";

export default function LearnModuleDetail() {
  const [, params] = useRoute<{ id: string }>("/learn/:id");
  
  // Extract module ID from route params
  const moduleId = params?.id;
  
  const { data: module, isLoading, error } = useQuery<LearningModule>({
    queryKey: [`/api/learning-modules/${moduleId}`],
    enabled: !!moduleId,
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "intermediate":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "advanced":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="font-serif text-2xl font-semibold mb-4">Module Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The learning module you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/learn">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Learning Modules
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <Link href="/learn">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Modules
          </Button>
        </Link>

        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="outline"
              className={getLevelColor(module.level)}
            >
              {module.level}
            </Badge>
            <Badge variant="secondary">
              {module.category}
            </Badge>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {module.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {module.description}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{module.lessonCount} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{module.duration} minutes</span>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-pre:bg-muted prose-pre:text-foreground"
              dangerouslySetInnerHTML={{ __html: module.content }}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href="/learn">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Explore More Modules
            </Button>
          </Link>
          <Button>
            <Award className="w-4 h-4 mr-2" />
            Mark as Completed
          </Button>
        </div>
      </div>
    </div>
  );
}

