"use client";

import { useState, useEffect } from "react";
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
import { User, Settings, Trash2, Save, Mail, Camera, Shield, Download, History, Key, Bell } from "lucide-react";
import { invalidateProfileCache } from "@/hooks/useUserProfile";
import { UserActivitySection } from "@/components/UserActivitySection";
import type { UserProfile as SupabaseUserProfile } from "@/types/user";

type UserProfile = SupabaseUserProfile;

type AuthUser = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  provider?: string;
  isSocialLogin?: boolean;
  isEmailPasswordLogin?: boolean;
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
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch user session and profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Fetch user session
        const userResponse = await fetch('/api/auth/me');
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Fetch profile after getting user
          setProfileLoading(true);
          const profileResponse = await fetch(`/api/user/profile`);
          const profileData = await profileResponse.json();
          
          if (profileResponse.ok && profileData.profile) {
            setProfile(profileData.profile);
            setName(profileData.profile.name || userData.name || "");
            setEmail(profileData.profile.email || userData.email || "");
            setProfileImagePreview(profileData.profile.profile_image_url || userData.picture || "");
          } else {
            setMessage({ type: "error", text: "Failed to load profile" });
          }
          setProfileLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user or profile:', error);
        setMessage({ type: "error", text: "Failed to load data" });
        setProfileLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []); // Only run once on mount

  // Separate function for refetching profile (used after save)
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/user/profile`);
      const data = await response.json();
      
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || user?.name || "");
        setEmail(data.profile.email || user?.email || "");
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
  };

  // Check if there are unsaved changes
  useEffect(() => {
    if (profile) {
      const nameChanged = name !== (profile.name || user?.name || "");
      const imageChanged = profileImage !== null;
      setHasChanges(nameChanged || imageChanged);
    }
  }, [name, profileImage, profile, user?.name]);

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
          email: profile?.email || email, // Keep existing email, don't change it here
          profileImageUrl: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Clear the file input
        setProfileImage(null);
        setHasChanges(false);
        // Invalidate profile cache to refresh sidebar and other components
        invalidateProfileCache();
        // Refresh profile data
        await fetchProfile();
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

  const handlePasswordChange = async () => {
    try {
      setPasswordChangeLoading(true);
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "Password reset email sent! Please check your inbox and follow the instructions." 
        });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send password reset email" });
      }
    } catch (error) {
      console.error("Error requesting password change:", error);
      setMessage({ type: "error", text: "Failed to request password change" });
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    if (newEmail.toLowerCase() === email.toLowerCase()) {
      setMessage({ type: "error", text: "New email is the same as current email" });
      return;
    }

    try {
      setEmailChangeLoading(true);
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newEmail: newEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: data.message || "Email updated successfully! Please verify your new email address." 
        });
        setEmail(newEmail.trim());
        setNewEmail("");
        setShowEmailDialog(false);
        
        // Refresh profile data
        await fetchProfile();
        
        // Suggest re-login after short delay
        setTimeout(() => {
          setMessage({
            type: "success",
            text: "Email updated! You may need to log in again with your new email address."
          });
        }, 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change email" });
      }
    } catch (error) {
      console.error("Error changing email:", error);
      setMessage({ type: "error", text: "Failed to change email" });
    } finally {
      setEmailChangeLoading(false);
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative group">
                  {(profileImagePreview || user?.picture) ? (
                    <div className="relative">
                      <Image
                        src={profileImagePreview || user?.picture || ""}
                        alt="Profile"
                        width={100}
                        height={100}
                        className="rounded-full object-cover border-4 border-neutral-700"
                      />
                      {profileImage && (
                        <div className="absolute inset-0 bg-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-xs text-green-400 font-semibold">New</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-[100px] h-[100px] bg-neutral-700 rounded-full flex items-center justify-center border-4 border-neutral-700">
                      <User className="w-10 h-10 text-neutral-400" />
                    </div>
                  )}
                  <label 
                    htmlFor="profileImage" 
                    className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-600 rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-black" />
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
                  <p className="text-sm text-neutral-400">
                    Click the camera icon to upload a new image. Max size: 5MB. 
                    Supported: JPG, PNG, GIF
                  </p>
                  {profileImage && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-neutral-300">New image selected: {profileImage.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProfileImage(null);
                          setProfileImagePreview(profile?.profile_image_url || user?.picture || "");
                        }}
                        className="text-red-400 hover:text-red-300 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {uploading && (
                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      Uploading image...
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6 space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-white">Display Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-neutral-700 border-neutral-600 text-white mt-1"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    This name will be displayed on your reviews and profile
                  </p>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <div className="flex gap-2 items-start">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      placeholder="your.email@example.com"
                      className="mt-1 bg-neutral-800 border-neutral-600 text-neutral-400 cursor-not-allowed flex-1"
                    />
                    {!user?.isSocialLogin && (
                      <Button
                        onClick={() => {
                          setNewEmail(email);
                          setShowEmailDialog(true);
                        }}
                        variant="outline"
                        className="mt-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black whitespace-nowrap"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Change Email
                      </Button>
                    )}
                  </div>
                  {user?.isSocialLogin ? (
                    <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/50 rounded text-xs text-blue-300">
                      <p className="font-semibold mb-1">ℹ️ Social Login Account</p>
                      <p>You&apos;re logged in with {user.provider?.replace('-oauth2', '').replace('google', 'Google')}. 
                         Your email is managed by your {user.provider?.replace('-oauth2', '').replace('google', 'Google')} account 
                         and cannot be changed here.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 mt-1">
                      Your email address for notifications and account recovery. Click &quot;Change Email&quot; to update it.
                    </p>
                  )}
                </div>
              </div>

              {/* Changes indicator */}
              {hasChanges && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-300">You have unsaved changes</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving || uploading || !hasChanges}
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
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(profile?.name || user?.name || "");
                      setEmail(profile?.email || user?.email || "");
                      setProfileImage(null);
                      setProfileImagePreview(profile?.profile_image_url || user?.picture || "");
                      setMessage(null);
                    }}
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security & Privacy Card */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password
                </h3>
                
                {user?.isSocialLogin ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
                      <p className="text-sm text-blue-300 mb-2">
                        <span className="font-semibold">ℹ️ Social Login Account</span>
                      </p>
                      <p className="text-sm text-blue-200">
                        You&apos;re logged in with {user.provider?.replace('-oauth2', '').replace('google', 'Google')}. 
                        Your password is managed by your {user.provider?.replace('-oauth2', '').replace('google', 'Google')} account.
                      </p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      To change your password, please visit your {user.provider?.replace('-oauth2', '').replace('google', 'Google')} account settings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-neutral-300 text-sm">
                      Request a password reset email to change your password securely.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button 
                            variant="outline" 
                            disabled={passwordChangeLoading}
                            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                          >
                            {passwordChangeLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Send Reset Email
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-neutral-800 border-neutral-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Change Your Password
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-300">
                              We&apos;ll send a password reset link to your email address: 
                              <span className="font-semibold text-white block mt-2">{email || user?.email}</span>
                              <p className="mt-3">
                                Click the link in the email to set a new password. The link will expire in 24 hours.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-neutral-700 text-white border-neutral-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handlePasswordChange}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            >
                              Send Reset Email
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <span className="text-neutral-500 self-center">or</span>
                      
                      <a
                        href={`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-feg5ufmmopccij32.us.auth0.com'}/u/reset-password/request`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button 
                          variant="ghost"
                          className="text-neutral-400 hover:text-white hover:bg-neutral-700"
                        >
                          Reset via Auth0
                        </Button>
                      </a>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">
                      💡 If you don&apos;t receive an email, try the &quot;Reset via Auth0&quot; option above.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
                <p className="text-neutral-300 text-sm mb-3">
                  Manage your notification preferences (Coming soon)
                </p>
                <Button variant="outline" disabled className="border-neutral-600 text-neutral-500">
                  Configure Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Data Card */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Download className="w-5 h-5" />
                Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Download Your Data</h3>
                <p className="text-neutral-300 text-sm mb-3">
                  Export all your data including profile information, wishlist, and reviews.
                </p>
                <Button 
                  variant="outline" 
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  onClick={() => {
                    const dataToExport = {
                      profile: {
                        name: profile?.name,
                        email: profile?.email,
                        admin: profile?.admin,
                      },
                      wishlist: profile?.wishlist || [],
                      exportedAt: new Date().toISOString(),
                    };
                    const dataStr = JSON.stringify(dataToExport, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `movierank-data-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    setMessage({ type: "success", text: "Your data has been exported!" });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data (JSON)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats Card */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-500">
                    {profile?.wishlist?.length || 0}
                  </div>
                  <div className="text-neutral-400 text-sm mt-1">Movies in Wishlist</div>
                </div>
                <div className="bg-neutral-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-500">
                    {profile?.admin ? "Admin" : "User"}
                  </div>
                  <div className="text-neutral-400 text-sm mt-1">Account Type</div>
                </div>
                <div className="bg-neutral-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-500">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "N/A"
                    }
                  </div>
                  <div className="text-neutral-400 text-sm mt-1">Member Since</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Activity Section */}
          <UserActivitySection />

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

      {/* Email Change Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80"
            onClick={() => setShowEmailDialog(false)}
          />
          
          {/* Dialog */}
          <div className="relative bg-neutral-800 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4 z-50">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Change Email Address</h2>
              </div>
              
              <div className="space-y-3 text-neutral-300">
                <p>
                  Enter your new email address. You will need to verify the new email address
                  and may need to log in again.
                </p>
                
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 text-sm">
                  <p className="font-semibold text-yellow-300 mb-1">⚠️ Important</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-200">
                    <li>You will receive a verification email at your new address</li>
                    <li>Your current email will remain active until verified</li>
                    <li>You may need to log in again after changing your email</li>
                  </ul>
                </div>
                
                <div>
                  <Label htmlFor="newEmail" className="text-white mb-2 block">
                    New Email Address
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="newemail@example.com"
                    className="bg-neutral-700 border-neutral-600 text-white"
                    disabled={emailChangeLoading}
                    autoFocus
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Current: {email}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailDialog(false);
                    setNewEmail("");
                  }}
                  disabled={emailChangeLoading}
                  className="bg-neutral-700 text-white border-neutral-600 hover:bg-neutral-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEmailChange}
                  disabled={emailChangeLoading || !newEmail.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {emailChangeLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Change Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
