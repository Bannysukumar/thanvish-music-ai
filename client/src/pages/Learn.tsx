import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, Clock, Award, Loader2 } from "lucide-react";
import { useState } from "react";
import type { LearningModule } from "@shared/schema";
import veenaImage from "@assets/generated_images/Veena_instrument_detail_shot_60c156f9.png";
import tablaImage from "@assets/generated_images/Tabla_drums_cultural_photo_82faa56d.png";

export default function Learn() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const { data: modules, isLoading } = useQuery<LearningModule[]>({
    queryKey: ["/api/learning-modules"],
  });

  const categories = ["all", "raga", "tala", "composition", "technique"];
  const levels = ["all", "beginner", "intermediate", "advanced"];

  const filteredModules = modules?.filter((module) => {
    const categoryMatch = selectedCategory === "all" || module.category === selectedCategory;
    const levelMatch = selectedLevel === "all" || module.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

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

  const getModuleThumbnail = (index: number) => {
    return index % 2 === 0 ? veenaImage : tablaImage;
  };

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="learn-title">
            Learning Modules
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master classical music through structured lessons on ragas, talas, compositions, and techniques
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`filter-category-${category}`}
                >
                  {getCategoryLabel(category)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Level</Label>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  data-testid={`filter-level-${level}`}
                >
                  {getCategoryLabel(level)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        ) : filteredModules && filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module, index) => (
              <Card
                key={module.id}
                className="hover-elevate transition-all duration-300 flex flex-col"
                data-testid={`module-card-${module.id}`}
              >
                <div className="aspect-video w-full overflow-hidden rounded-t-md">
                  <img
                    src={module.thumbnailUrl || getModuleThumbnail(index)}
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={getLevelColor(module.level)}
                      data-testid={`badge-level-${module.id}`}
                    >
                      {module.level}
                    </Badge>
                    <Badge variant="secondary" data-testid={`badge-category-${module.id}`}>
                      {module.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2" data-testid={`module-title-${module.id}`}>
                    {module.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2" data-testid={`module-description-${module.id}`}>
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span data-testid={`lesson-count-${module.id}`}>{module.lessonCount} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`duration-${module.id}`}>{module.duration} min</span>
                    </div>
                  </div>
                  <Link href={`/learn/${module.id}`}>
                    <Button className="w-full" data-testid={`button-start-${module.id}`}>
                      <Award className="w-4 h-4 mr-2" />
                      Start Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-serif text-2xl font-semibold mb-2" data-testid="empty-state-title">
              No modules found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more learning modules
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
