import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Loader2, Trash2, User } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        .select("display_name, first_name, last_name, profile_picture")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
      
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
      </div>
    </div>
  );
};

export default Profile;
