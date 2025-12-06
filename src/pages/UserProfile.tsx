import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Grid3x3, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");

      const [profileData, postsData] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single(),
        supabase
          .from("posts")
          .select("id, media_url, is_video")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (profileData.error) throw profileData.error;

      return {
        profile: profileData.data,
        posts: postsData.data || [],
        postCount: postsData.data?.length || 0,
      };
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
          <div className="max-w-screen-lg mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="max-w-screen-lg mx-auto px-4 pt-6">
          <div className="flex items-center gap-6 mb-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { profile, posts, postCount } = data || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="max-w-screen-lg mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{profile?.username}</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="h-20 w-20 ring-2 ring-border">
            <AvatarImage
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
              alt={profile?.username}
            />
            <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">{postCount}</div>
                <div className="text-sm text-muted-foreground">posts</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-foreground">{profile?.full_name || profile?.username}</h2>
          {profile?.bio && (
            <p className="text-foreground mt-1">{profile.bio}</p>
          )}
          {profile?.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent font-medium mt-1 inline-flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              {profile.website}
            </a>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-center gap-2 mb-4 text-foreground">
            <Grid3x3 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Posts</span>
          </div>
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-muted relative">
                  {post.is_video ? (
                    <video
                      src={post.media_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={post.media_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}