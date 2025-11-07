import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    bio: "",
    website: "",
  });

  const { data: myGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["my-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts-manage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, media_url, caption, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setFormData({
        username: data.username || '',
        fullName: data.full_name || '',
        bio: data.bio || '',
        website: data.website || '',
      });
      setAvatarUrl(data.avatar_url || '');
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const group = myGroups.find(g => g.id === groupId);
      
      if (group?.banner_url && !group.banner_url.includes('placeholder')) {
        const urlParts = group.banner_url.split('/');
        const fileName = urlParts.slice(-3).join('/');
        supabase.storage.from('media').remove([fileName]).catch(console.error);
      }

      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: ["my-groups"] });
      const previousGroups = queryClient.getQueryData(["my-groups"]);

      queryClient.setQueryData(["my-groups"], (old: any) =>
        old?.filter((group: any) => group.id !== groupId)
      );

      return { previousGroups };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["my-groups"], context?.previousGroups);
      toast.error("Failed to delete group");
    },
    onSuccess: () => {
      toast.success("Group deleted");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const post = myPosts.find(p => p.id === postId);
      
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      if (post?.media_url) {
        const urlParts = post.media_url.split('/');
        const fileName = urlParts.slice(-3).join('/');
        supabase.storage.from('media').remove([fileName]).catch(console.error);
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-posts-manage"] });
      const previousPosts = queryClient.getQueryData(["my-posts-manage"]);

      queryClient.setQueryData(["my-posts-manage"], (old: any) =>
        old?.filter((post: any) => post.id !== postId)
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["my-posts-manage"], context?.previousPosts);
      toast.error("Failed to delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatars/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (error: any) {
      toast.error("Failed to upload avatar: " + error.message);
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.fullName,
          bio: formData.bio,
          website: formData.website,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/profile");
    } catch (error: any) {
      toast.error("Failed to update profile");
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
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
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6 space-y-6">
        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 ring-4 ring-accent/20">
              <AvatarImage 
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                alt="Profile" 
              />
              <AvatarFallback>{formData.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Change Photo
                </>
              )}
            </Button>
          </div>

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

          <div className="pt-4 border-t border-border space-y-3">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button onClick={signOut} variant="destructive" className="w-full">
              Log Out
            </Button>
          </div>
        </div>

        {/* Manage Content Section */}
        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] space-y-6">
          <h2 className="text-xl font-bold text-foreground">Manage Content</h2>

          {/* My Groups */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">My Groups</h3>
            {groupsLoading ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : myGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups created yet</p>
            ) : (
              <div className="space-y-2">
                {myGroups.map((group: any) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{group.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{group.name}" and all its posts.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGroupMutation.mutate(group.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Posts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">My Posts</h3>
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
              </div>
            ) : myPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts created yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myPosts.map((post: any) => (
                  <div key={post.id} className="relative group aspect-square rounded-lg overflow-hidden">
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this post.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePostMutation.mutate(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
