import { Card, CardContent } from "@/components/ui/card";
import { Target, Globe, Zap, Heart, Lightbulb, ArrowRight, Music, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Vision() {
  const visionPillars = [
    {
      icon: Globe,
      title: "Global Accessibility",
      description: "Making Indian classical music accessible to learners worldwide, breaking down geographical and financial barriers that have traditionally limited access to quality instruction.",
    },
    {
      icon: Zap,
      title: "Technological Innovation",
      description: "Harnessing the power of AI and modern technology to enhance learning experiences while maintaining the authenticity and integrity of traditional music.",
    },
    {
      icon: Heart,
      title: "Cultural Preservation",
      description: "Safeguarding centuries-old musical traditions for future generations, ensuring that the rich heritage of Hindustani and Carnatic music continues to thrive.",
    },
    {
      icon: Lightbulb,
      title: "Educational Excellence",
      description: "Providing world-class music education that combines the wisdom of traditional teaching methods with innovative learning tools and personalized guidance.",
    },
  ];

  const futureGoals = [
    {
      title: "AI-Powered Composition",
      description: "Advanced AI systems that understand the nuances of ragas and talas, creating authentic compositions that honor traditional rules while enabling creative expression.",
      icon: Music,
    },
    {
      title: "Global Community",
      description: "Building a worldwide network of learners, teachers, and enthusiasts who share knowledge, collaborate, and celebrate the beauty of Indian classical music together.",
      icon: Users,
    },
    {
      title: "Interactive Learning",
      description: "Immersive learning experiences with real-time feedback, personalized lesson plans, and adaptive curricula that grow with each student's journey.",
      icon: Zap,
    },
    {
      title: "Cultural Bridge",
      description: "Connecting diverse cultures through music, fostering understanding and appreciation of Indian classical traditions across borders and generations.",
      icon: Globe,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6" data-testid="vision-title">
              Our Vision
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8" data-testid="vision-subtitle">
              Empowering the world to experience, learn, and preserve the timeless beauty of Indian classical music
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              At Thanvish AI, we envision a future where the profound artistry of Hindustani and Carnatic music 
              is accessible to everyone, everywhere. Through the seamless integration of traditional wisdom and 
              cutting-edge technology, we're creating a platform that honors the past while embracing the future.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Pillars */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Our Core Pillars
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The foundational principles that guide our mission and shape our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visionPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <Card 
                  key={index} 
                  className="hover-elevate transition-all duration-300"
                  data-testid={`pillar-${index}`}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold mb-3">{pillar.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Long-term Vision */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Looking Ahead
              </h2>
              <p className="text-lg text-muted-foreground">
                Our vision extends beyond today, shaping the future of music education
              </p>
            </div>

            <div className="space-y-8 mb-12">
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl font-bold mb-4">A World Connected Through Music</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We envision a global community where music transcends boundaries. Students from Mumbai can 
                    learn from masters in Chennai, while enthusiasts in New York can explore the intricacies 
                    of ragas alongside peers in London. Our platform serves as a bridge, connecting hearts and 
                    minds through the universal language of music.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Technology becomes an enabler, not a replacement. AI assists but never replaces the human 
                    touch, the emotional connection, and the spiritual depth that makes classical music truly 
                    transformative. We're building tools that amplify human creativity and understanding.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl font-bold mb-4">Preserving Heritage for Generations</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    As custodians of a rich cultural heritage, we're committed to preserving the authenticity 
                    of Indian classical music. Our AI systems are trained not just on compositions, but on the 
                    philosophy, the emotions, and the traditions that give this music its soul.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Every generation has a responsibility to pass on knowledge to the next. Through digital 
                    preservation and innovative teaching methods, we ensure that the wisdom of the past remains 
                    alive and accessible, ready to inspire future musicians and music lovers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl font-bold mb-4">Empowering Every Learner</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Our vision includes making quality music education accessible regardless of background, 
                    location, or financial means. We believe that passion and dedication should be the only 
                    prerequisites for learning classical music.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Personalized learning paths, adaptive curricula, and supportive communities ensure that 
                    every student can progress at their own pace, following their unique musical journey while 
                    staying true to traditional principles and techniques.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Future Goals */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Our Future Goals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ambitious yet achievable milestones that drive us forward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {futureGoals.map((goal, index) => {
              const Icon = goal.icon;
              return (
                <Card 
                  key={index} 
                  className="hover-elevate transition-all duration-300"
                  data-testid={`goal-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold mb-2">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{goal.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Join Us on This Journey
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're a student, teacher, musician, or simply someone who loves music, 
            you're part of our vision. Together, we can preserve tradition, embrace innovation, 
            and create a future where classical music thrives.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8">
                Contact Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

