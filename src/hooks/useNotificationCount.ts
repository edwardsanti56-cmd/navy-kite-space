import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const useNotificationCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscriptions for likes and comments
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'likes' },
        () => queryClient.invalidateQueries({ queryKey: ["notification-count", user.id] })
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => queryClient.invalidateQueries({ queryKey: ["notification-count", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["notification-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get user's posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user.id);

      if (!userPosts || userPosts.length === 0) return 0;

      const postIds = userPosts.map((p) => p.id);

      // Count likes
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds)
        .neq("user_id", user.id);

      // Count comments
      const { count: commentsCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds)
        .neq("user_id", user.id);

      return (likesCount || 0) + (commentsCount || 0);
    },
    enabled: !!user,
  });
};
