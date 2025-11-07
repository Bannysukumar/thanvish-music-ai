import { Card, CardContent } from "@/components/ui/card";
import { Users, Music, Code, GraduationCap, Linkedin, Mail, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
  expertise: string[];
  email?: string;
  linkedin?: string;
  github?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Priya Sharma",
    role: "Music Director & Lead Ethnomusicologist",
    bio: "A renowned Hindustani classical vocalist with over 20 years of experience. PhD in Ethnomusicology from Delhi University. Expert in raga theory and traditional composition.",
    expertise: ["Hindustani Classical", "Raga Theory", "Music Education"],
    email: "priya.sharma@thanvish.ai",
    linkedin: "priya-sharma-music",
  },
  {
    name: "Rajesh Kumar",
    role: "AI Research Lead",
    bio: "Machine Learning engineer specializing in music generation. Former researcher at IIT Delhi. Passionate about preserving cultural heritage through technology.",
    expertise: ["Machine Learning", "Music AI", "Deep Learning"],
    email: "rajesh.kumar@thanvish.ai",
    linkedin: "rajesh-kumar-ai",
    github: "rajesh-kumar",
  },
  {
    name: "Lakshmi Venkatesh",
    role: "Carnatic Music Specialist",
    bio: "Distinguished Carnatic vocalist and composer. Trained under legendary gurus in the traditional gurukula system. Expert in kriti composition and gamaka techniques.",
    expertise: ["Carnatic Music", "Composition", "Gamaka"],
    email: "lakshmi.venkatesh@thanvish.ai",
  },
  {
    name: "Amit Patel",
    role: "Full Stack Developer",
    bio: "Software engineer with expertise in building scalable web applications. Passionate about creating intuitive user experiences for music learners worldwide.",
    expertise: ["Web Development", "UI/UX", "System Architecture"],
    email: "amit.patel@thanvish.ai",
    linkedin: "amit-patel-dev",
    github: "amit-patel",
  },
  {
    name: "Sneha Desai",
    role: "Product Designer",
    bio: "User experience designer focused on making classical music education accessible and engaging. Combines design thinking with deep understanding of music pedagogy.",
    expertise: ["Product Design", "User Research", "Music Pedagogy"],
    email: "sneha.desai@thanvish.ai",
    linkedin: "sneha-desai-design",
  },
  {
    name: "Vikram Singh",
    role: "Data Scientist",
    bio: "Data scientist specializing in audio processing and music information retrieval. Works on improving AI model accuracy and understanding musical patterns.",
    expertise: ["Audio Processing", "Music Information Retrieval", "Data Analysis"],
    email: "vikram.singh@thanvish.ai",
    linkedin: "vikram-singh-data",
    github: "vikram-singh",
  },
];

export default function TeamMembers() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6" data-testid="team-title">
              Meet Our Team
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="team-description">
              A diverse group of musicians, technologists, and educators united by a shared passion 
              for preserving and advancing Indian classical music through innovative technology.
            </p>
          </div>
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card 
                key={index} 
                className="hover-elevate transition-all duration-300"
                data-testid={`team-member-${index}`}
              >
                <CardContent className="p-6">
                  {/* Avatar Placeholder */}
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  
                  {/* Name and Role */}
                  <div className="text-center mb-4">
                    <h3 className="font-serif text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed text-center">
                    {member.bio}
                  </p>

                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {member.expertise.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center gap-3 pt-4 border-t">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${member.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={`https://github.com/${member.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`${member.name} GitHub`}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We believe that the beauty of Indian classical music should be accessible to everyone, 
              regardless of geographical boundaries or financial constraints. Our team works tirelessly 
              to bridge the gap between traditional learning and modern technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">Musical Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  Our music experts ensure authenticity and respect for traditional forms
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">Technical Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Cutting-edge AI and technology to enhance learning experiences
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">Educational Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Making quality music education accessible to learners worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Join Our Mission
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            We're always looking for passionate individuals who share our vision. 
            Whether you're a musician, developer, designer, or educator, we'd love to hear from you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}

