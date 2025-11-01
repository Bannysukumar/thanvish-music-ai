import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BookOpen, Music2, Zap, Users, Globe } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_image_classical_musicians_b2fe8088.png";

export default function Home() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Music Generation",
      description: "Create authentic classical compositions using advanced AI trained on traditional ragas and talas.",
    },
    {
      icon: BookOpen,
      title: "Structured Learning",
      description: "Master Hindustani and Carnatic music through interactive lessons and guided practice modules.",
    },
    {
      icon: Music2,
      title: "Traditional Instruments",
      description: "Explore the rich sounds of sitar, tabla, veena, flute, and more in your compositions.",
    },
    {
      icon: Zap,
      title: "Instant Playback",
      description: "Listen to your generated compositions immediately and download them for offline practice.",
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Learn from lessons crafted by experienced practitioners of classical Indian music.",
    },
    {
      icon: Globe,
      title: "Cultural Heritage",
      description: "Preserve and celebrate the timeless traditions of Indian classical music through technology.",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Classical Indian musicians performing"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
              Where Tradition Meets{" "}
              <span className="text-primary">Innovation</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-description">
              Experience the fusion of ancient Indian classical music and cutting-edge AI technology. 
              Generate authentic compositions, learn from expert lessons, and embark on a musical journey 
              through the rich traditions of Hindustani and Carnatic music.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/generator">
                <Button size="lg" className="px-8 py-6 text-lg" data-testid="button-start-creating">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-md bg-background/90" data-testid="button-explore-lessons">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explore Lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="features-title">
              Powerful Features for Musicians
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to learn, create, and explore the depths of Indian classical music
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover-elevate transition-all duration-300" data-testid={`feature-card-${index}`}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple three-step process to create beautiful classical music
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center" data-testid="step-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Choose Your Style</h3>
              <p className="text-muted-foreground">
                Select from traditional ragas, talas, and instruments to define your composition
              </p>
            </div>

            <div className="text-center" data-testid="step-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Generate with AI</h3>
              <p className="text-muted-foreground">
                Let our AI create an authentic composition based on classical music theory
              </p>
            </div>

            <div className="text-center" data-testid="step-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Play & Download</h3>
              <p className="text-muted-foreground">
                Listen to your creation instantly and download it for practice or sharing
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            Ready to Begin Your Musical Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join musicians and learners worldwide in exploring the beauty of Indian classical music with AI-powered tools
          </p>
          <Link href="/generator">
            <Button size="lg" className="px-8 py-6 text-lg" data-testid="button-cta-bottom">
              <Sparkles className="w-5 h-5 mr-2" />
              Create Your First Composition
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
