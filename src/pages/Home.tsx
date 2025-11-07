import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePostsQuery } from "@/hooks/usePostsQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = usePostsQuery();

  // Realtime subscription for precise invalidation
  useEffect(() => {
    const channel = supabase
      .channel('home-posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: 'group_id=is.null' },
        () => queryClient.invalidateQueries({ queryKey: ["posts", undefined] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => queryClient.invalidateQueries({ queryKey: ["posts", undefined] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user?.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts", undefined] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(["posts", undefined]);

      // Optimistically update
      queryClient.setQueryData(["posts", undefined], (old: any) =>
        old?.map((post: any) =>
          post.id === postId
            ? { ...post, isLiked: !isLiked, likes: post.likes + (isLiked ? -1 : 1) }
            : post
        )
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["posts", undefined], context?.previousPosts);
      toast.error("Failed to update like");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const post = posts.find(p => p.id === postId);
      
      // Delete from database first
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      // Delete media from storage (non-blocking)
      if (post?.media_url) {
        const urlParts = post.media_url.split('/');
        const fileName = urlParts.slice(-3).join('/');
        supabase.storage.from('media').remove([fileName]).catch(console.error);
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts", undefined] });
      const previousPosts = queryClient.getQueryData(["posts", undefined]);

      queryClient.setQueryData(["posts", undefined], (old: any) =>
        old?.filter((post: any) => post.id !== postId)
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["posts", undefined], context?.previousPosts);
      toast.error("Failed to delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted");
    },
  });

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const secondsAgo = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (secondsAgo < 60) return `${secondsAgo}s`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
    return `${Math.floor(secondsAgo / 86400)}d`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
          <div className="max-w-screen-lg mx-auto">
            <h1 className="text-2xl font-bold">Feed</h1>
          </div>
        </header>
        <main className="max-w-screen-lg mx-auto px-4 pt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-soft)]">
              <div className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-full aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold">Feed</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Start creating!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                userId={post.user_id}
                username={post.author.username}
                avatar={post.author.avatar_url}
                timestamp={getTimeAgo(post.created_at)}
                mediaUrl={post.media_url}
                isVideo={post.is_video}
                likes={post.likes}
                comments={post.comments}
                caption={post.caption}
                isLiked={post.isLiked}
                currentUserId={user?.id}
                onLike={() => likeMutation.mutate({ postId: post.id, isLiked: post.isLiked })}
                onDelete={() => deletePostMutation.mutate(post.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
