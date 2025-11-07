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
    name: "S. Rajyalakshmi",
    role: "Founder & CEO",
    bio: "Serial entrepreneur and classical music patron with 10+ years of experience incubating arts-tech ventures. Leads Thanvish AI's vision, partnerships, and artist network while championing inclusive music education.",
    image: "/Founder S Rajyalakshmi.jpg",
    expertise: ["Leadership", "Strategic Partnerships", "Arts Management"],
    email: "rajyalakshmi@thanvish.ai",
  },
  {
    name: "K. Mounika",
    role: "Office Administration Head",
    bio: "Seasoned office administrator with 2 years of hands-on experience streamlining operations, vendor management, and artist logistics for multi-city productions.",
    image: "/Mounika.jpg",
    expertise: ["Operations", "Vendor Coordination", "Event Logistics"],
  },
  {
    name: "K. Vijith Kumar Reddy",
    role: "Finance & Compliance Lead",
    bio: "Finance professional skilled in budgeting, grants management, and compliance for creative enterprises. Crafts sustainable models that keep our therapy and education programs viable.",
    image: "/K Vijith Kumar Reddy.jpg",
    expertise: ["Financial Planning", "Compliance", "Grant Management"],
  },
  {
    name: "N. Venkateshwari",
    role: "Marketing Strategist",
    bio: "Brand architect who develops go-to-market campaigns blending storytelling with data-driven insights. Experienced in building digital communities for wellness and music startups.",
    image: "/Swetha.jpg",
    expertise: ["Brand Strategy", "Campaign Management", "Community Growth"],
  },
  {
    name: "B. Jeevan",
    role: "Backend Developer",
    bio: "Backend engineer with 1+ year building resilient APIs and authentication flows. Passionate about bringing classical music to modern platforms through reliable infrastructure.",
    image: "/jeevan.jpg",
    expertise: ["Node.js", "API Design", "Cloud Services"],
    email: "jeevanpaul766@gmail.com",
    linkedin: "bandandhamjeevan",
  },
  {
    name: "G. Hari Krishna",
    role: "Digital Marketing Specialist",
    bio: "Performance marketer experienced in SEO, paid media, and content funnels tailored for music and wellness brands. Designs outreach journeys that convert curiosity into lifelong learners.",
    image: "/G.Hari Krishna .jpg",
    expertise: ["SEO", "Performance Marketing", "Content Strategy"],
  },
  {
    name: "S. Muni Kumar",
    role: "R&D – Research & Development",
    bio: "Research engineer exploring new modalities in sound therapy, AI personalization, and learner analytics. Works closely with therapists to translate insights into product features.",
    image: "/muni kumar.jpg",
    expertise: ["R&D", "Sound Therapy", "Product Innovation"],
  },
  {
    name: "M. Shusmanth Reddy",
    role: "Backend Developer",
    bio: "Developer with experience across Oracle, SQL optimization, and microservices. Builds secure data pipelines that power our recommendation engine and therapy scheduling tools.",
    image: "/shushmanth.jpg",
    expertise: ["Oracle", "SQL", "Microservices"],
  },
  {
    name: "A. Sukumar",
    role: "Blockchain & Full Stack Developer",
    bio: "Professional blockchain developer and full-stack engineer with 2 years of freelance experience tokenizing digital assets and delivering end-to-end web platforms.",
    image: "/sukumar.jpg",
    expertise: ["Blockchain", "Full Stack Development", "Smart Contracts"],
    email: "bannysukumar@gmail.com",
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
                {/* Avatar */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mb-4 mx-auto border border-border"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                )}
                  
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

