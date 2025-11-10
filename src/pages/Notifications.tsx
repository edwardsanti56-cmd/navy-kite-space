import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: "like" | "comment";
  user: {
    username: string;
    avatar_url: string;
  };
  post_id: string;
  content?: string;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      // Get user's posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user?.id);

      if (!userPosts || userPosts.length === 0) return [];

      const postIds = userPosts.map((p) => p.id);

      // Get likes on user's posts
      const { data: likes } = await supabase
        .from("likes")
        .select(`
          id,
          created_at,
          post_id,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .in("post_id", postIds)
        .neq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Get comments on user's posts
      const { data: comments } = await supabase
        .from("comments")
        .select(`
          id,
          created_at,
          post_id,
          content,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .in("post_id", postIds)
        .neq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Combine and sort
      const allNotifications: Notification[] = [
        ...(likes || []).map((like: any) => ({
          id: like.id,
          type: "like" as const,
          user: {
            username: like.profiles?.username || "Unknown",
            avatar_url: like.profiles?.avatar_url || "",
          },
          post_id: like.post_id,
          created_at: like.created_at,
        })),
        ...(comments || []).map((comment: any) => ({
          id: comment.id,
          type: "comment" as const,
          user: {
            username: comment.profiles?.username || "Unknown",
            avatar_url: comment.profiles?.avatar_url || "",
          },
          post_id: comment.post_id,
          content: comment.content,
          created_at: comment.created_at,
        })),
      ];

      return allNotifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const secondsAgo = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000
    );

    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto flex items-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-4 flex items-center gap-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl shadow-[var(--shadow-soft)]">
            <p className="text-muted-foreground">
              No notifications yet. When someone likes or comments on your
              posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-card rounded-xl p-4 flex items-start gap-3 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow"
              >
                <Avatar className="h-10 w-10 ring-2 ring-accent/20">
                  <AvatarImage
                    src={notification.user.avatar_url}
                    alt={notification.user.username}
                  />
                  <AvatarFallback>
                    {notification.user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {notification.type === "like" ? (
                      <Heart className="h-5 w-5 text-destructive fill-current" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-primary" />
                    )}
                    <p className="text-foreground">
                      <span className="font-semibold">
                        {notification.user.username}
                      </span>
                      {notification.type === "like"
                        ? " liked your post"
                        : " commented on your post"}
                    </p>
                  </div>
                  {notification.content && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {notification.content}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
