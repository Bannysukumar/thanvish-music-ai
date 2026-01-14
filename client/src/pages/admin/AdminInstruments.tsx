import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Music, Plus, Edit, Trash2, Play, Pause, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Instrument {
  id: string;
  name: string;
  category: "hindustani" | "carnatic" | "both" | "fusion";
  previewAudioUrl?: string;
  previewDuration?: number; // seconds (5-10)
  isEnabled: boolean;
  autoPreviewEnabled: boolean;
}

export default function AdminInstruments() {
  const { toast } = useToast();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [formData, setFormData] = useState<Partial<Instrument>>({
    name: "",
    category: "both",
    previewAudioUrl: "",
    previewDuration: 5,
    isEnabled: true,
    autoPreviewEnabled: false,
  });

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/instruments", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch instruments");

      const data = await response.json();
      setInstruments(data.instruments || []);
    } catch (error) {
      console.error("Error fetching instruments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch instruments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const url = editingInstrument
        ? `/api/admin/instruments/${editingInstrument.id}`
        : "/api/admin/instruments";
      
      const method = editingInstrument ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save instrument");
      }

      toast({
        title: "Success",
        description: editingInstrument ? "Instrument updated" : "Instrument created",
      });
      setShowInstrumentModal(false);
      setEditingInstrument(null);
      setFormData({
        name: "",
        category: "both",
        previewAudioUrl: "",
        previewDuration: 5,
        isEnabled: true,
        autoPreviewEnabled: false,
      });
      fetchInstruments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save instrument",
        variant: "destructive",
      });
    }
  };

  const handleToggleEnabled = async (instrumentId: string, enabled: boolean) => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch(`/api/admin/instruments/${instrumentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ isEnabled: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update instrument");

      setInstruments((prev) =>
        prev.map((inst) => (inst.id === instrumentId ? { ...inst, isEnabled: enabled } : inst))
      );
      toast({
        title: "Success",
        description: `Instrument ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update instrument",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instrument Management</h1>
        <p className="text-muted-foreground mt-2">
          CRITICAL: Fully control instrument names, categories, preview audio, and global enable/disable
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Admin Rules Enforced
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 list-disc list-inside">
                <li>Only one preview plays at a time</li>
                <li>Auto-preview toggle default state controlled</li>
                <li>Broken preview links can be removed</li>
                <li>Non-YouTube preview audio sources supported</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Instruments</h2>
        <Dialog open={showInstrumentModal} onOpenChange={setShowInstrumentModal}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInstrument(null);
              setFormData({
                name: "",
                category: "both",
                previewAudioUrl: "",
                previewDuration: 5,
                isEnabled: true,
                autoPreviewEnabled: false,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Instrument
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstrument ? "Edit Instrument" : "Create New Instrument"}
              </DialogTitle>
              <DialogDescription>
                Configure instrument details, category, and preview settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Instrument Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sitar, Flute, Tabla"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="hindustani">Hindustani</option>
                  <option value="carnatic">Carnatic</option>
                  <option value="both">Both</option>
                  <option value="fusion">Fusion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previewAudioUrl">Preview Audio URL (Non-YouTube)</Label>
                <Input
                  id="previewAudioUrl"
                  value={formData.previewAudioUrl || ""}
                  onChange={(e) => setFormData({ ...formData, previewAudioUrl: e.target.value })}
                  placeholder="https://example.com/audio/preview.mp3"
                />
                <p className="text-xs text-muted-foreground">
                  Direct audio file URL (MP3, WAV, etc.) - not YouTube
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previewDuration">Preview Duration (seconds) *</Label>
                <Input
                  id="previewDuration"
                  type="number"
                  min="5"
                  max="10"
                  value={formData.previewDuration}
                  onChange={(e) => setFormData({ ...formData, previewDuration: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-muted-foreground">
                  Must be between 5-10 seconds
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isEnabled">Instrument Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this instrument globally
                  </p>
                </div>
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPreviewEnabled">Auto-Preview Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Default state for auto-preview toggle
                  </p>
                </div>
                <Switch
                  id="autoPreviewEnabled"
                  checked={formData.autoPreviewEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoPreviewEnabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInstrumentModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingInstrument ? "Update" : "Create"} Instrument
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading instruments...</p>
            </div>
          </CardContent>
        </Card>
      ) : instruments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Instruments Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first instrument to get started
              </p>
              <Button onClick={() => setShowInstrumentModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Instrument
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Instruments List</CardTitle>
            <CardDescription>
              Manage all available instruments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preview Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto-Preview</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instruments.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell className="font-medium">{instrument.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{instrument.category}</Badge>
                    </TableCell>
                    <TableCell>{instrument.previewDuration || 5}s</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={instrument.isEnabled}
                          onCheckedChange={(checked) => handleToggleEnabled(instrument.id, checked)}
                        />
                        <Badge variant={instrument.isEnabled ? "default" : "secondary"}>
                          {instrument.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={instrument.autoPreviewEnabled ? "default" : "outline"}>
                        {instrument.autoPreviewEnabled ? "On" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingInstrument(instrument);
                            setFormData(instrument);
                            setShowInstrumentModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

