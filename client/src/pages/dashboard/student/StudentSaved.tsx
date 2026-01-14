import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Music, Heart, Sparkles, FileText, Trash2 } from "lucide-react";

interface SavedItem {
  id: string;
  type: "lesson" | "music" | "therapy" | "horoscope" | "ebook";
  title: string;
  description?: string;
  savedAt: string;
}

const mockSavedItems: SavedItem[] = [
  {
    id: "1",
    type: "lesson",
    title: "Introduction to Piano",
    description: "Learn the basics of piano playing",
    savedAt: "2024-01-10",
  },
  {
    id: "2",
    type: "music",
    title: "My Generated Track",
    description: "Relaxing ambient music",
    savedAt: "2024-01-09",
  },
  {
    id: "3",
    type: "horoscope",
    title: "Mesha Rasi Music",
    description: "Personalized horoscope music",
    savedAt: "2024-01-08",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "lesson":
      return <BookOpen className="h-4 w-4" />;
    case "music":
      return <Music className="h-4 w-4" />;
    case "therapy":
      return <Heart className="h-4 w-4" />;
    case "horoscope":
      return <Sparkles className="h-4 w-4" />;
    case "ebook":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "lesson":
      return "Lesson";
    case "music":
      return "Music";
    case "therapy":
      return "Therapy";
    case "horoscope":
      return "Horoscope";
    case "ebook":
      return "E-Book";
    default:
      return "Item";
  }
};

export default function StudentSaved() {
  const [selectedTab, setSelectedTab] = useState<string>("all");

  const filteredItems =
    selectedTab === "all"
      ? mockSavedItems
      : mockSavedItems.filter((item) => item.type === selectedTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Saved / Favorites</h1>
        <p className="text-muted-foreground mt-2">
          Access your saved lessons, music, therapy sessions, and more
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="lesson">Lessons</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="therapy">Therapy</TabsTrigger>
          <TabsTrigger value="horoscope">Horoscope</TabsTrigger>
          <TabsTrigger value="ebook">E-Books</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Items</h3>
                  <p className="text-muted-foreground">
                    {selectedTab === "all"
                      ? "You haven't saved any items yet. Start exploring to save your favorites!"
                      : `You haven't saved any ${getTypeLabel(selectedTab).toLowerCase()}s yet.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Saved on {new Date(item.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Open
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

