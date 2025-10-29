import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
}

interface Post {
  id: string;
  media_url: string;
  is_video: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 1234, following: 543 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
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
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, media_url, is_video')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      setStats(prev => ({ ...prev, posts: data?.length || 0 }));
    } catch (error: any) {
      console.error('Error fetching posts:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)] flex items-center justify-between">
        <div className="max-w-screen-lg mx-auto w-full flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Button
            onClick={() => navigate("/edit-profile")}
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-6 mb-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-6 mb-6">
            <Avatar className="h-24 w-24 ring-4 ring-accent/20">
              <AvatarImage 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                alt="Profile" 
              />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile?.username || 'User'}
              </h2>
              <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                {profile?.bio || 'No bio yet'}
              </p>
              {profile?.website && (
                <a 
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-around py-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.following}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Posts</h3>
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer relative"
                >
                  <img
                    src={post.media_url}
                    alt={`Post ${post.id}`}
                    className="w-full h-full object-cover"
                  />
                  {post.is_video && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
