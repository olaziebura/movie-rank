"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { User, Settings, Trash2, Save, Mail } from "lucide-react";
import { invalidateProfileCache } from "@/hooks/useUserProfile";
import type { UserProfile as SupabaseUserProfile } from "@/types/user";

type UserProfile = SupabaseUserProfile;

type AuthUser = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch user session
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/user/profile`);
      const data = await response.json();
      
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || user?.name || "");
        setProfileImagePreview(data.profile.profile_image_url || user?.picture || "");
      } else {
        setMessage({ type: "error", text: "Failed to load profile" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setProfileLoading(false);
    }
  }, [user?.name, user?.picture]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user?.sub) {
      fetchProfile();
    }
  }, [user?.sub, fetchProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", profileImage);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return data.imageUrl;
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image" });
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({ type: "error", text: "Failed to upload image" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    try {
      setSaving(true);
      
      // Upload image if selected
      let imageUrl = profile?.profile_image_url;
      if (profileImage) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          profileImageUrl: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Clear the file input
        setProfileImage(null);
        // Invalidate profile cache to refresh sidebar and other components
        invalidateProfileCache();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Account deleted successfully. Redirecting..." });
        // Redirect to logout after 2 seconds
        setTimeout(() => {
          window.location.href = "/api/auth/logout";
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete account" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please log in to access your settings.</p>
          <Button onClick={() => router.push("/api/auth/login")}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold">Account Settings</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-900/50 border border-green-500 text-green-200" 
              : "bg-red-900/50 border border-red-500 text-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Information Card */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {(profileImagePreview || user?.picture) ? (
                    <Image
                      src={profileImagePreview || user?.picture || ""}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-neutral-700 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="profileImage" className="text-white">Profile Image</Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="bg-neutral-700 border-neutral-600 text-white file:bg-neutral-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                  />
                  <p className="text-sm text-neutral-400 mt-1">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF
                  </p>
                  {uploading && (
                    <p className="text-sm text-yellow-400 mt-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 inline-block mr-2"></div>
                      Uploading image...
                    </p>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-white">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-neutral-700 border-neutral-600 text-neutral-400"
                />
                <p className="text-sm text-neutral-400 mt-1">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveProfile}
                disabled={saving || uploading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {saving || uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    {uploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Stats Card */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white">Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-500">
                    {profile?.wishlist?.length || 0}
                  </div>
                  <div className="text-neutral-400">Movies in Wishlist</div>
                </div>
                <div className="bg-neutral-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {profile?.admin ? "Yes" : "No"}
                  </div>
                  <div className="text-neutral-400">Admin Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="bg-red-900/20 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
                  <p className="text-neutral-300 mb-4">
                    Once you delete your account, there is no going back. This will permanently 
                    delete your profile, wishlist, and all associated data.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button 
                        variant="destructive"
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-800 border-neutral-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-300">
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>Your movie wishlist ({profile?.wishlist?.length || 0} movies)</li>
                            <li>All account preferences</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-neutral-700 text-white border-neutral-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
