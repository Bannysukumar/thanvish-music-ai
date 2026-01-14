import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, TrendingUp, CheckCircle } from "lucide-react";

export default function PracticeRoom() {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceTime, setPracticeTime] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);

  const instruments = ["Piano", "Guitar", "Violin", "Flute", "Drums", "Sitar"];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Practice Room</h1>
        <p className="text-muted-foreground mt-2">
          Practice your instrument with a timer and track your daily progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Practice Timer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Practice Session</CardTitle>
            <CardDescription>
              Select an instrument and start your practice session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedInstrument ? (
              <div>
                <h3 className="font-semibold mb-4">Select Instrument</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {instruments.map((instrument) => (
                    <Button
                      key={instrument}
                      variant="outline"
                      onClick={() => setSelectedInstrument(instrument)}
                    >
                      {instrument}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold mb-4">
                    {formatTime(practiceTime)}
                  </div>
                  <Badge variant="outline" className="mb-4">
                    {selectedInstrument}
                  </Badge>
                </div>
                <div className="flex justify-center gap-2">
                  {!isPracticing ? (
                    <Button
                      size="lg"
                      onClick={() => setIsPracticing(true)}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Practice
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsPracticing(false)}
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => {
                          setIsPracticing(false);
                          setPracticeTime(0);
                        }}
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedInstrument(null)}
                  className="w-full"
                >
                  Change Instrument
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Practice Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Time</span>
              </div>
              <span className="font-semibold">{formatTime(practiceTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Streak</span>
              </div>
              <span className="font-semibold">0 days</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Goal</span>
              </div>
              <Badge variant="outline">30 min</Badge>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2 text-sm">Daily Checklist</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Warm-up exercises</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Scale practice</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Song practice</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

