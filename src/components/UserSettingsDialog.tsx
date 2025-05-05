import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, update, get, getDatabase } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, Check, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const UserSettingsDialog = ({ open, onOpenChange }: UserSettingsDialogProps) => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [bio, setBio] = useState("");
  const [email] = useState(currentUser?.email || "");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(
    theme === "system" ? "light" : theme as "light" | "dark"
  );
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentUser?.photoURL || null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = getDatabase();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          setBio(userData.bio || "");
          setDisplayName(userData.displayName || currentUser.displayName || "");
          setImagePreview(userData.photoURL || currentUser.photoURL || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      }
    };

    fetchUserData();
  }, [currentUser, db]);

  // Sync theme selection
  useEffect(() => {
    setSelectedTheme(theme === "system" ? "light" : theme as "light" | "dark");
  }, [theme]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!IMGBB_API_KEY) {
      toast.error("Image upload is unavailable due to missing configuration");
      throw new Error("Missing ImgBB API key");
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", IMGBB_API_KEY);

    try {
      setUploading(true);
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentUser || !auth.currentUser) {
      toast.error("No authenticated user found");
      return;
    }

    try {
      setLoading(true);

      let photoURL = currentUser.photoURL;
      if (uploadedImage) {
        photoURL = await uploadImage(uploadedImage);
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });

      // Update Realtime Database
      const userRef = ref(db, `users/${currentUser.uid}`);
      await update(userRef, {
        displayName,
        bio,
        photoURL,
        updatedAt: Date.now(),
      });

      // Update theme if necessaryV
      if (selectedTheme !== theme && (theme !== "system" || selectedTheme !== "light")) {
        setTheme(selectedTheme);
      }

      toast.success("Profile and preferences updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }, [currentUser, displayName, bio, uploadedImage, selectedTheme, theme, setTheme, onOpenChange, uploadImage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImagePreview = useCallback(() => {
    setImagePreview(currentUser?.photoURL || null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentUser]);

  // Input validation
  const isSaveDisabled = useMemo(() => {
    return loading || uploading || !displayName.trim() || displayName.length > 50 || bio.length > 200;
  }, [loading, uploading, displayName, bio]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm /

System: :text-xl">Profile Settings</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Update your profile information, photo, and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shadow-md">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback className="bg-indigo-600 text-white text-base sm:text-lg">
                  {displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white shadow-md hover:bg-gray-100"
                  onClick={triggerFileInput}
                  aria-label="Upload new profile picture"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                {uploadedImage && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full"
                    onClick={clearImagePreview}
                    aria-label="Remove new profile picture"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <p className="text-xs text-gray-500">Upload a new profile picture</p>
          </div>

          {/* Form Fields */}
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="text-sm"
                aria-describedby="name-error"
              />
              {displayName.length > 50 && (
                <p id="name-error" className="text-xs text-red-500">
                  Name must be 50 characters or less
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio" className="text-sm">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="min-h-[80px] text-sm"
                maxLength={200}
                aria-describedby="bio-error"
              />
              {bio.length > 200 && (
                <p id="bio-error" className="text-xs text-red-500">
                  Bio must be 200 characters or less
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="theme" className="text-sm">Theme Preference</Label>
              <Select
                value={selectedTheme}
                onValueChange={(value: "light" | "dark") => setSelectedTheme(value)}
              >
                <SelectTrigger id="theme" className="text-sm" aria-label="Select theme preference">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Dark
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-sm"
            aria-label="Cancel profile changes"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            aria-label="Save profile changes"
          >
            {(loading || uploading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsDialog;