import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HeartPulse, MoonStar, Brain, Sunrise, Activity, Sparkles, Music4, Wind } from "lucide-react";

interface TherapyModule {
  id: string;
  title: string;
  focus: string;
  focusKey: string;
  duration: string;
  intensity: "Gentle" | "Moderate" | "Deep";
  schedule: string;
  description: string;
  ragas: string[];
  instruments: string[];
  techniques: string[];
  benefits: string[];
}

const therapyModules: TherapyModule[] = [
  {
    id: "stress-relief-soundbath",
    title: "Stress Relief Sound Bath",
    focus: "Stress Relief",
    focusKey: "stress",
    duration: "20 minutes",
    intensity: "Gentle",
    schedule: "Morning / Evening",
    description:
      "A calming sound bath that guides the nervous system from alpha to theta states using long-form alaap and sustained drone textures.",
    ragas: ["Yaman", "Ahir Bhairav"],
    instruments: ["Bansuri", "Santoor", "Tanpura"],
    techniques: ["Guided breathing", "Slow pulse entrainment", "Mantra humming"],
    benefits: ["Lowers cortisol", "Supports deep relaxation"],
  },
  {
    id: "sleep-restorative-ritual",
    title: "Restorative Sleep Ritual",
    focus: "Sleep Therapy",
    focusKey: "sleep",
    duration: "30 minutes",
    intensity: "Gentle",
    schedule: "Night / Pre-sleep",
    description:
      "A bedtime journey that gently shifts the mind into delta rhythms with lullaby-inspired Carnatic phrases and oceanic drones.",
    ragas: ["Nilambari", "Kapi"],
    instruments: ["Veena", "Tanpura", "Synth pads"],
    techniques: ["4-7-8 breathing", "Body scan", "Layered drone"],
    benefits: ["Improves sleep onset", "Balances circadian rhythm"],
  },
  {
    id: "mindfulness-rhythm-reset",
    title: "Mindfulness Rhythm Reset",
    focus: "Mindfulness",
    focusKey: "mindfulness",
    duration: "25 minutes",
    intensity: "Moderate",
    schedule: "Anytime reset",
    description:
      "Cycles of rhythmic bols and mindful vocalisations designed to anchor awareness in the present moment and steady attention.",
    ragas: ["Bhairavi", "Charukeshi"],
    instruments: ["Mridangam", "Handpan", "Voice"],
    techniques: ["Tala counting", "Box breathing", "Guided affirmations"],
    benefits: ["Enhances focus", "Reduces rumination"],
  },
  {
    id: "focus-productivity-flow",
    title: "Focus & Productivity Flow",
    focus: "Focus Boost",
    focusKey: "focus",
    duration: "40 minutes",
    intensity: "Moderate",
    schedule: "Midday / Work blocks",
    description:
      "A structured progression that nudges the mind into beta-gamma coherence using energetic Hindustani bandishes and rhythmic layering.",
    ragas: ["Hamsadhwani", "Desh"],
    instruments: ["Sitar", "Violin", "Electronic tabla"],
    techniques: ["Pomodoro intervals", "Rhythmic clapping", "Sonic cues"],
    benefits: ["Sharpens concentration", "Supports creative output"],
  },
  {
    id: "emotional-balance-journey",
    title: "Emotional Balance Journey",
    focus: "Emotional Healing",
    focusKey: "healing",
    duration: "35 minutes",
    intensity: "Deep",
    schedule: "Late evening / Reflection",
    description:
      "A gently cathartic experience weaving expressive ragas with journaling prompts to release emotional blockages and cultivate resilience.",
    ragas: ["Malkauns", "Bageshri"],
    instruments: ["Sarangi", "Piano", "Ambient textures"],
    techniques: ["Heart coherence breathing", "Guided journaling", "Nadi shodhana"],
    benefits: ["Eases emotional fatigue", "Builds self-compassion"],
  },
  {
    id: "pranayama-soundflow",
    title: "Pranayama Sound Flow",
    focus: "Breathwork & Vitality",
    focusKey: "pranayama",
    duration: "30 minutes",
    intensity: "Deep",
    schedule: "Sunrise / Pre-yoga",
    description:
      "Synchronised breath cycles with carnatic korvais and wind textures designed to expand lung capacity and vital energy.",
    ragas: ["Mayamalavagowla", "Shubhapantuvarali"],
    instruments: ["Venu", "Mridangam", "Wind FX"],
    techniques: ["Kapalabhati", "Alternate nostril breathing", "Vocal toning"],
    benefits: ["Boosts prana", "Improves breath control"],
  },
];

const focusFilters = [
  { key: "all", label: "All Programs", icon: HeartPulse },
  { key: "stress", label: "Stress Relief", icon: HeartPulse },
  { key: "sleep", label: "Sleep Therapy", icon: MoonStar },
  { key: "mindfulness", label: "Mindfulness", icon: Brain },
  { key: "focus", label: "Focus Boost", icon: Activity },
  { key: "healing", label: "Emotional Healing", icon: Sparkles },
  { key: "pranayama", label: "Breathwork", icon: Wind },
];

const focusIconMap: Record<string, JSX.Element> = {
  stress: <HeartPulse className="w-4 h-4" />,
  sleep: <MoonStar className="w-4 h-4" />,
  mindfulness: <Brain className="w-4 h-4" />,
  focus: <Activity className="w-4 h-4" />,
  healing: <Sparkles className="w-4 h-4" />,
  pranayama: <Wind className="w-4 h-4" />,
};

export default function MusicTherapy() {
  const [selectedFocus, setSelectedFocus] = useState<string>("all");

  const filteredModules = therapyModules.filter((module) =>
    selectedFocus === "all" ? true : module.focusKey === selectedFocus
  );

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <HeartPulse className="w-4 h-4" />
            Music Therapy Studio
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold" data-testid="therapy-title">
            Healing Through Sound & Raga Science
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Curated therapeutic journeys blending Hindustani and Carnatic traditions with evidence-based sound therapy. Choose a focus area and immerse yourself in restorative sonic rituals crafted by our music therapists.
          </p>
        </div>

        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-primary" />
              Choose Your Therapeutic Focus
            </CardTitle>
            <CardDescription>
              Tailor your session to meet emotional, mental, or physiological goals. Each program combines specific ragas, instruments, and breathing cues.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {focusFilters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedFocus === key ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedFocus(key)}
                className="gap-2"
                data-testid={`therapy-filter-${key}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card key={module.id} className="h-full hover-elevate transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  {focusIconMap[module.focusKey]}
                  <span>{module.focus}</span>
                </div>
                <CardTitle className="text-2xl" data-testid={`therapy-title-${module.id}`}>
                  {module.title}
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground block">Duration</span>
                    {module.duration}
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">Suggested Time</span>
                    {module.schedule}
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">Intensity</span>
                    {module.intensity}
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">Ragas</span>
                    {module.ragas.join(", ")}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="font-medium text-sm text-foreground">Therapeutic Techniques</span>
                  <div className="flex flex-wrap gap-2">
                    {module.techniques.map((technique) => (
                      <Badge key={technique} variant="outline" className="text-xs">
                        {technique}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-medium text-sm text-foreground">Instrumentation</span>
                  <div className="flex flex-wrap gap-2">
                    {module.instruments.map((instrument) => (
                      <Badge key={instrument} className="text-xs" variant="secondary">
                        <Music4 className="w-3 h-3 mr-1" />
                        {instrument}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-medium text-sm text-foreground">Benefits</span>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {module.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>How to Use These Modules</CardTitle>
            <CardDescription>
              For best results, create a calm listening space, use high-quality headphones, and follow the breathing prompts. Repeat sessions consistently for cumulative therapeutic benefits.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" />
                Prepare
              </h4>
              <p>Hydrate, dim the lights, and set an intention. Use the recommended time of day for enhanced circadian alignment.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Engage
              </h4>
              <p>Follow the guidance, match your breath with the cues, and allow your awareness to rest on the tonal center of each raga.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Integrate
              </h4>
              <p>Journal reflections, observe emotional shifts, and repeat sessions 3-4 times a week to build neuro-musical resilience.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
