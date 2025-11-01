import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const categories = posts
    ? ["all", ...Array.from(new Set(posts.map((p) => p.category)))]
    : ["all"];

  const filteredPosts = posts?.filter((post) => {
    return selectedCategory === "all" || post.category === selectedCategory;
  });

  const featuredPost = filteredPosts?.find((p) => p.featured);
  const regularPosts = filteredPosts?.filter((p) => !p.featured);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="blog-title">
            Blog & Resources
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore articles on classical music theory, tutorials, and cultural insights
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`filter-${category}`}
              >
                {category === "all" ? "All Posts" : category}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <div className="space-y-8">
            {featuredPost && (
              <Card className="overflow-hidden hover-elevate transition-all duration-300" data-testid="featured-post">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="aspect-video md:aspect-auto">
                    {featuredPost.featuredImage ? (
                      <img
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-6xl">🎵</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4" data-testid="featured-badge">Featured</Badge>
                    <h2 className="font-serif text-3xl font-bold mb-4" data-testid="featured-title">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed" data-testid="featured-excerpt">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span data-testid="featured-author">{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span data-testid="featured-readtime">{featuredPost.readTime} min read</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span data-testid="featured-date">
                          {new Date(featuredPost.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button data-testid="button-read-featured">
                      Read Article
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {regularPosts && regularPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="hover-elevate transition-all duration-300 flex flex-col"
                    data-testid={`post-card-${post.id}`}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-t-md">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-4xl">🎵</span>
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-1">
                      <Badge variant="secondary" className="w-fit mb-2" data-testid={`post-category-${post.id}`}>
                        {post.category}
                      </Badge>
                      <CardTitle className="text-xl line-clamp-2" data-testid={`post-title-${post.id}`}>
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3" data-testid={`post-excerpt-${post.id}`}>
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span className="text-xs" data-testid={`post-author-${post.id}`}>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs" data-testid={`post-readtime-${post.id}`}>{post.readTime} min</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" data-testid={`button-read-${post.id}`}>
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="font-serif text-2xl font-semibold mb-2" data-testid="empty-state-title">
              No posts found
            </h3>
            <p className="text-muted-foreground">
              Try selecting a different category or check back later for new content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
