import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Play, Clock, TrendingUp, Lock } from "lucide-react";

const INSTRUMENTS = [
  { id: "piano", name: "Piano", icon: "🎹" },
  { id: "guitar", name: "Guitar", icon: "🎸" },
  { id: "violin", name: "Violin", icon: "🎻" },
  { id: "flute", name: "Flute", icon: "🎵" },
  { id: "drums", name: "Drums", icon: "🥁" },
  { id: "sitar", name: "Sitar", icon: "🎶" },
  { id: "tabla", name: "Tabla", icon: "🥁" },
  { id: "veena", name: "Veena", icon: "🎵" },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function InstrumentalEducation() {
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Instrumental Education</h1>
        <p className="text-muted-foreground mt-2">
          Learn to play instruments with structured lessons and practice sessions
        </p>
      </div>

      {!selectedInstrument ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select an Instrument</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {INSTRUMENTS.map((instrument) => (
              <Card
                key={instrument.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedInstrument(instrument.id)}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{instrument.icon}</div>
                    <h3 className="font-semibold">{instrument.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : !selectedLevel ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedInstrument(null)}
            className="mb-4"
          >
            ← Back to Instruments
          </Button>
          <h2 className="text-xl font-semibold mb-4">Choose Your Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEVELS.map((level) => (
              <Card
                key={level}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedLevel(level)}
              >
                <CardHeader>
                  <CardTitle>{level}</CardTitle>
                  <CardDescription>
                    {level === "Beginner" && "Start your musical journey"}
                    {level === "Intermediate" && "Build on your foundation"}
                    {level === "Advanced" && "Master your instrument"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Learning</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedLevel(null)}
            >
              ← Back to Levels
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                {INSTRUMENTS.find((i) => i.id === selectedInstrument)?.name} - {selectedLevel}
              </CardTitle>
              <CardDescription>
                Your learning path for {selectedLevel.toLowerCase()} level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          <span>Lesson 1: Introduction</span>
                        </div>
                        <Badge variant="outline">Available</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          <span>Lesson 2: Basic Techniques</span>
                        </div>
                        <Badge variant="outline">Available</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Lesson 3: Advanced Concepts</span>
                        </div>
                        <Badge variant="secondary">Locked</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Practice Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Daily Practice Timer</span>
                      </div>
                      <Button variant="outline" size="sm">Start</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Progress Milestones</span>
                      </div>
                      <Badge>0% Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music2 className="h-4 w-4" />
                        <span>Practice Checklist</span>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

