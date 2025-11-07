import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowLeft, Loader2 } from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function BlogPostDetail() {
  const [, params] = useRoute<{ id: string }>("/blog/:id");
  
  // Extract post ID from route params
  const postId = params?.id;
  
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog-posts/${postId}`],
    enabled: !!postId,
  });

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

  if (error || !post) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="font-serif text-2xl font-semibold mb-4">Post Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/blog">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
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
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Post Header */}
        <div className="mb-8">
          {post.featured && (
            <Badge className="w-fit mb-4">Featured</Badge>
          )}
          <Badge variant="secondary" className="w-fit mb-4">
            {post.category}
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Post Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

