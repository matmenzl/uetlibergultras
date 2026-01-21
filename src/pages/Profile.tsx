import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Loader2, Trash2, User, Mountain, CalendarIcon, Pencil, X, Check, Route } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SegmentMultiSelect, useSegmentsLookup } from "@/components/SegmentMultiSelect";

interface ManualCheckIn {
  id: string;
  activity_id: number;
  segment_id: number;
  activity_name: string | null;
  distance: number | null;
  elevation_gain: number | null;
  checked_in_at: string;
}

// Group check-ins by activity_id for display
interface GroupedRun {
  activity_id: number;
  activity_name: string | null;
  distance: number | null;
  elevation_gain: number | null;
  checked_in_at: string;
  segment_ids: number[];
  check_in_ids: string[];
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { segmentsMap, loading: segmentsLoading } = useSegmentsLookup();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
  }>({
    display_name: null,
    first_name: null,
    last_name: null,
    profile_picture: null,
  });
  
  // Manual check-ins state
  const [manualRuns, setManualRuns] = useState<ManualCheckIn[]>([]);
  const [groupedRuns, setGroupedRuns] = useState<GroupedRun[]>([]);
  const [editingRun, setEditingRun] = useState<number | null>(null); // activity_id
  const [editForm, setEditForm] = useState<{
    activity_name: string;
    distance: string;
    elevation_gain: string;
    checked_in_at: Date;
    segment_ids: number[];
  }>({ activity_name: "", distance: "", elevation_gain: "", checked_in_at: new Date(), segment_ids: [] });
  const [savingRun, setSavingRun] = useState(false);
  const [deletingRun, setDeletingRun] = useState<number | null>(null); // activity_id

  // Group runs by activity_id
  useEffect(() => {
    const grouped = new Map<number, GroupedRun>();
    
    manualRuns.forEach((run) => {
      if (grouped.has(run.activity_id)) {
        const existing = grouped.get(run.activity_id)!;
        if (run.segment_id !== 0) {
          existing.segment_ids.push(run.segment_id);
        }
        existing.check_in_ids.push(run.id);
      } else {
        grouped.set(run.activity_id, {
          activity_id: run.activity_id,
          activity_name: run.activity_name,
          distance: run.distance,
          elevation_gain: run.elevation_gain,
          checked_in_at: run.checked_in_at,
          segment_ids: run.segment_id !== 0 ? [run.segment_id] : [],
          check_in_ids: [run.id],
        });
      }
    });

    setGroupedRuns(Array.from(grouped.values()).sort(
      (a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    ));
  }, [manualRuns]);

  const fetchManualRuns = async (userId: string) => {
    const { data } = await supabase
      .from("check_ins")
      .select("id, activity_id, segment_id, activity_name, distance, elevation_gain, checked_in_at")
      .eq("user_id", userId)
      .eq("is_manual", true)
      .order("checked_in_at", { ascending: false });
    
    if (data) {
      setManualRuns(data);
    }
  };

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, profile_picture, strava_id")
        .eq("id", user.id)
        .single();
      
      // Redirect Strava users to home page
      if (profileData?.strava_id) {
        navigate("/");
        return;
      }
      
      if (profileData) {
        setProfile(profileData);
      }
      
      await fetchManualRuns(user.id);
      
      setLoading(false);
    };
    
    getProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
      })
      .eq("id", user.id);
    
    setSaving(false);
    
    if (error) {
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Gespeichert",
        description: "Dein Profil wurde aktualisiert.",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fehler",
        description: "Bitte wähle eine Bilddatei aus.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fehler",
        description: "Das Bild darf maximal 5MB gross sein.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Delete old profile picture if exists
      if (profile.profile_picture?.includes("profile-pictures")) {
        const oldPath = profile.profile_picture.split("/profile-pictures/")[1];
        if (oldPath) {
          await supabase.storage.from("profile-pictures").remove([oldPath]);
        }
      }

      // Upload new picture
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      // Update profile with new picture URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
      
      toast({
        title: "Hochgeladen",
        description: "Dein Profilbild wurde aktualisiert.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Fehler",
        description: "Bild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!user || !profile.profile_picture) return;

    setUploading(true);

    try {
      // Delete from storage if it's our bucket
      if (profile.profile_picture.includes("profile-pictures")) {
        const oldPath = profile.profile_picture.split("/profile-pictures/")[1];
        if (oldPath) {
          await supabase.storage.from("profile-pictures").remove([oldPath]);
        }
      }

      // Update profile to remove picture URL
      const { error } = await supabase
        .from("profiles")
        .update({ profile_picture: null })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, profile_picture: null }));
      
      toast({
        title: "Gelöscht",
        description: "Dein Profilbild wurde entfernt.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Fehler",
        description: "Bild konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    if (profile.first_name) {
      return profile.first_name.substring(0, 1).toUpperCase() + 
        (profile.last_name?.substring(0, 1).toUpperCase() || "");
    }
    return "U";
  };

  const startEditRun = (run: GroupedRun) => {
    setEditingRun(run.activity_id);
    setEditForm({
      activity_name: run.activity_name || "",
      distance: run.distance ? (run.distance / 1000).toString() : "",
      elevation_gain: run.elevation_gain?.toString() || "",
      checked_in_at: new Date(run.checked_in_at),
      segment_ids: run.segment_ids,
    });
  };

  const cancelEditRun = () => {
    setEditingRun(null);
    setEditForm({ activity_name: "", distance: "", elevation_gain: "", checked_in_at: new Date(), segment_ids: [] });
  };

  const handleSaveRun = async (run: GroupedRun) => {
    if (!editForm.activity_name.trim() || !user) {
      toast({ title: "Fehler", description: "Bitte gib einen Titel ein.", variant: "destructive" });
      return;
    }

    setSavingRun(true);
    
    const distanceValue = editForm.distance ? parseFloat(editForm.distance) * 1000 : null;
    const elevationValue = editForm.elevation_gain ? parseInt(editForm.elevation_gain, 10) : null;

    try {
      // Delete all existing check-ins for this activity
      const { error: deleteError } = await supabase
        .from("check_ins")
        .delete()
        .in("id", run.check_in_ids);

      if (deleteError) throw deleteError;

      // Re-create check-ins with new segment selections
      const newCheckIns = editForm.segment_ids.length > 0
        ? editForm.segment_ids.map((segmentId) => ({
            user_id: user.id,
            segment_id: segmentId,
            activity_id: run.activity_id,
            checked_in_at: editForm.checked_in_at.toISOString(),
            is_manual: true,
            activity_name: editForm.activity_name.trim(),
            distance: distanceValue,
            elevation_gain: elevationValue,
          }))
        : [{
            user_id: user.id,
            segment_id: 0,
            activity_id: run.activity_id,
            checked_in_at: editForm.checked_in_at.toISOString(),
            is_manual: true,
            activity_name: editForm.activity_name.trim(),
            distance: distanceValue,
            elevation_gain: elevationValue,
          }];

      const { error: insertError } = await supabase.from("check_ins").insert(newCheckIns);
      if (insertError) throw insertError;

      // Re-check achievements after segment changes
      await supabase.functions.invoke('check-achievements');

      toast({ title: "Gespeichert", description: "Dein Run wurde aktualisiert." });
      setEditingRun(null);
      await fetchManualRuns(user.id);
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Fehler", description: "Run konnte nicht gespeichert werden.", variant: "destructive" });
    } finally {
      setSavingRun(false);
    }
  };

  const handleDeleteRun = async (run: GroupedRun) => {
    setDeletingRun(run.activity_id);

    const { error } = await supabase
      .from("check_ins")
      .delete()
      .in("id", run.check_in_ids);

    setDeletingRun(null);

    if (error) {
      toast({ title: "Fehler", description: "Run konnte nicht gelöscht werden.", variant: "destructive" });
    } else {
      toast({ title: "Gelöscht", description: "Dein Run wurde entfernt." });
      if (user) await fetchManualRuns(user.id);
    }
  };

  const getSegmentNames = (segmentIds: number[]) => {
    if (segmentsLoading || segmentIds.length === 0) return null;
    return segmentIds
      .map((id) => segmentsMap.get(id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mein Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_picture || undefined} alt="Profilbild" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Foto ändern
                </Button>
                {profile.profile_picture && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeletePicture}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Läufername</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ""}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Dein Läufername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">Vorname</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ""}
                  onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Dein Vorname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nachname</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ""}
                  onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Dein Nachname"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Runs Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              Meine manuellen Runs ({groupedRuns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupedRuns.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Noch keine manuellen Runs erfasst.
              </p>
            ) : (
              <div className="space-y-3">
                {groupedRuns.map((run) => (
                  <div
                    key={run.activity_id}
                    className="border rounded-lg p-3 space-y-3"
                  >
                    {editingRun === run.activity_id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Titel</Label>
                          <Input
                            value={editForm.activity_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, activity_name: e.target.value }))}
                            placeholder="Titel des Runs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Distanz (km)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={editForm.distance}
                              onChange={(e) => setEditForm(prev => ({ ...prev, distance: e.target.value }))}
                              placeholder="z.B. 5.2"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Höhenmeter</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={editForm.elevation_gain}
                              onChange={(e) => setEditForm(prev => ({ ...prev, elevation_gain: e.target.value }))}
                              placeholder="z.B. 450"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Datum</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn("w-full justify-start text-left font-normal")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(editForm.checked_in_at, "dd. MMMM yyyy", { locale: de })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                              <Calendar
                                mode="single"
                                selected={editForm.checked_in_at}
                                onSelect={(date) => date && setEditForm(prev => ({ ...prev, checked_in_at: date }))}
                                disabled={(date) => date > new Date()}
                                locale={de}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Segmente</Label>
                          <SegmentMultiSelect
                            selectedSegmentIds={editForm.segment_ids}
                            onSelectionChange={(ids) => setEditForm(prev => ({ ...prev, segment_ids: ids }))}
                            disabled={savingRun}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={cancelEditRun} disabled={savingRun}>
                            <X className="h-4 w-4 mr-1" />
                            Abbrechen
                          </Button>
                          <Button size="sm" onClick={() => handleSaveRun(run)} disabled={savingRun}>
                            {savingRun ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                            Speichern
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{run.activity_name || "Unbenannter Run"}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(run.checked_in_at), "dd. MMMM yyyy", { locale: de })}
                          </p>
                          <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                            {run.distance && (
                              <span>{(run.distance / 1000).toFixed(1)} km</span>
                            )}
                            {run.elevation_gain && (
                              <span>{run.elevation_gain} hm</span>
                            )}
                          </div>
                          {run.segment_ids.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                              <Route className="h-3 w-3 shrink-0" />
                              <span className="truncate">{getSegmentNames(run.segment_ids) || `${run.segment_ids.length} Segment(e)`}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditRun(run)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRun(run)}
                            disabled={deletingRun === run.activity_id}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            {deletingRun === run.activity_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
