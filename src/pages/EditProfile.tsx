import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import profileAvatar from "@/assets/profile-avatar.jpg";

export default function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "alex_creative",
    fullName: "Alex Johnson",
    bio: "Creative designer & photographer 📸✨\nCapturing moments that matter",
    website: "alexcreative.com",
  });

  const handleSave = () => {
    toast.success("Profile updated successfully!");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/profile")}
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
          <Button
            onClick={handleSave}
            variant="secondary"
            className="font-semibold"
          >
            Save
          </Button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 ring-4 ring-accent/20">
              <AvatarImage src={profileAvatar} alt="Profile" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border space-y-3">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="destructive" className="w-full">
              Log Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
