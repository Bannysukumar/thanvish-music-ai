import { Card, CardContent } from "@/components/ui/card";
import { Music, Heart, Lightbulb, Users } from "lucide-react";
import learningImage from "@assets/generated_images/Music_learning_scene_photo_75c1fc35.png";

export default function About() {
  const values = [
    {
      icon: Music,
      title: "Cultural Preservation",
      description: "Safeguarding the rich heritage of Hindustani and Carnatic music traditions for future generations through digital innovation.",
    },
    {
      icon: Heart,
      title: "Passion for Music",
      description: "Driven by deep respect and love for classical Indian music, we strive to make these art forms accessible to all.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Leveraging AI and modern technology to enhance music education while honoring traditional teaching methods.",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a global community of learners, teachers, and enthusiasts united by their love for classical music.",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6" data-testid="about-title">
              Our Vision: Harmony Between Tradition and Technology
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="about-description">
              Thanvish AI Music was born from a simple yet powerful idea: to make the profound beauty 
              of Indian classical music accessible to learners worldwide while preserving its authenticity 
              and cultural significance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <img
                src={learningImage}
                alt="Music learning environment"
                className="rounded-md w-full shadow-lg"
                data-testid="about-image"
              />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">The Journey</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Classical Indian music represents centuries of refined artistic expression, with intricate 
                systems of ragas and talas that have been passed down through generations of dedicated musicians. 
                However, access to quality instruction has often been limited by geography and resources.
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Our platform bridges this gap by combining the wisdom of traditional teaching methods with 
                the power of artificial intelligence. We've worked with experienced practitioners to ensure 
                our AI understands not just the technical aspects, but the soul and emotion that make 
                classical music truly transcendent.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're a beginner taking your first steps or an advanced student deepening your 
                understanding, Thanvish AI provides the tools and guidance to help you grow as a musician.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Understanding Indian Classical Music
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Two rich traditions, each with its own beauty and complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card data-testid="tradition-hindustani">
              <CardContent className="p-8">
                <h3 className="font-serif text-2xl font-bold mb-4 text-primary">Hindustani Music</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Originating from North India, Hindustani classical music is characterized by its emphasis 
                  on improvisation and the exploration of ragas' emotional depth. The tradition features 
                  instruments like the sitar, tabla, sarod, and bansuri.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Ragas:</strong> Melodic frameworks that define mood and time
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Talas:</strong> Complex rhythmic cycles that structure compositions
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Gharanas:</strong> Schools of musical thought with distinct styles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="tradition-carnatic">
              <CardContent className="p-8">
                <h3 className="font-serif text-2xl font-bold mb-4 text-primary">Carnatic Music</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Rooted in South India, Carnatic music is known for its structured compositions and intricate 
                  rhythmic patterns. Key instruments include the veena, mridangam, violin, and flute, each 
                  contributing to the tradition's distinctive sound.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Kritis:</strong> Composed devotional pieces with structured forms
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Gamaka:</strong> Ornamental note variations that add expressiveness
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Trinity:</strong> Compositions by legendary composers Tyagaraja, Muthuswami Dikshitar, and Syama Sastri
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide our mission
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="hover-elevate transition-all duration-300" data-testid={`value-card-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold mb-2">{value.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-center">
            How AI Enhances Music Learning
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Personalized Learning Paths</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your progress and adapts lessons to match your skill level, ensuring 
                  you're always challenged but never overwhelmed.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Authentic Composition Generation</h3>
                <p className="text-muted-foreground">
                  By training on thousands of classical compositions, our AI understands the nuances of 
                  ragas and talas, creating music that honors traditional rules and aesthetics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Instant Feedback</h3>
                <p className="text-muted-foreground">
                  Practice anytime, anywhere, with immediate guidance on technique, rhythm, and expression, 
                  complementing traditional guru-shishya instruction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
