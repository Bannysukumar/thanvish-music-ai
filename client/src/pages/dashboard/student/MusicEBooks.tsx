import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Lock, Bookmark, FileText } from "lucide-react";

interface EBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  isPremium: boolean;
  pages: number;
}

const mockEBooks: EBook[] = [
  {
    id: "1",
    title: "Introduction to Indian Classical Music",
    author: "Music Master",
    description: "Learn the fundamentals of Indian classical music theory and practice.",
    isPremium: false,
    pages: 120,
  },
  {
    id: "2",
    title: "Advanced Music Composition",
    author: "Composer Pro",
    description: "Master the art of composing original music pieces.",
    isPremium: true,
    pages: 250,
  },
  {
    id: "3",
    title: "Music Therapy Guide",
    author: "Wellness Expert",
    description: "Understanding how music can support wellness and relaxation.",
    isPremium: false,
    pages: 180,
  },
];

export default function MusicEBooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<EBook | null>(null);

  const filteredBooks = mockEBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedBook) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedBook(null)}
          className="mb-4"
        >
          ← Back to Library
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedBook.title}</CardTitle>
                <CardDescription className="mt-2">By {selectedBook.author}</CardDescription>
              </div>
              {selectedBook.isPremium && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{selectedBook.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{selectedBook.pages} pages</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">
                <BookOpen className="h-4 w-4 mr-2" />
                {selectedBook.isPremium ? "Unlock Premium" : "Start Reading"}
              </Button>
              <Button variant="outline">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
            {selectedBook.isPremium && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This feature is part of a premium learning pack.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Music E-Books</h1>
        <p className="text-muted-foreground mt-2">
          Browse and read music education books and guides
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No books match your search." : "No books are available at the moment."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <Card
              key={book.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBook(book)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  {book.isPremium && (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {book.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{book.pages} pages</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

