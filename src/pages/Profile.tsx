import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid3x3, Link as LinkIcon, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileQuery } from "@/hooks/useProfileQuery";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useProfileQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
          <div className="max-w-screen-lg mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
        </header>
        <main className="max-w-screen-lg mx-auto px-4 pt-6">
          <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { profile, posts, stats } = data || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/notifications")}
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Heart className="h-6 w-6" />
            </Button>
            <Button
              onClick={() => navigate("/edit-profile")}
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-accent/20">
              <AvatarImage
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                alt={profile?.username}
              />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile?.username}</h2>
              <p className="text-muted-foreground">{profile?.full_name}</p>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-foreground">{profile.bio}</p>
          )}

          {profile?.website && (
            <div className="flex items-center gap-2 text-accent">
              <LinkIcon className="h-4 w-4" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {profile.website}
              </a>
            </div>
          )}

          <div className="flex gap-8 py-4 border-y border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats?.posts || 0}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Posts</h2>
          </div>
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-muted relative group overflow-hidden rounded-md">
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
            <div className="text-center py-12 bg-card rounded-xl shadow-[var(--shadow-soft)]">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
