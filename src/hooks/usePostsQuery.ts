import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  content: string;
  media_url: string;
  is_video: boolean;
  caption: string;
  created_at: string;
  user_id: string;
  group_id: string | null;
  author: {
    username: string;
    avatar_url: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
}

export const usePostsQuery = (groupId?: string) => {
  return useQuery({
    queryKey: ["posts", groupId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      // Filter by group_id if provided, otherwise get general posts (group_id is null)
      if (groupId) {
        query = query.eq("group_id", groupId);
      } else {
        query = query.is("group_id", null);
      }

      const { data: posts, error } = await query;

      if (error) throw error;

      // Fetch likes and comments for each post
      const postsWithEngagement = await Promise.all(
        posts.map(async (post) => {
          const [likesData, commentsData, userLike] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact" }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact" }).eq("post_id", post.id),
            supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").maybeSingle(),
          ]);

          const profile = post.profiles as any;
          return {
            id: post.id,
            content: post.caption || "",
            media_url: post.media_url,
            is_video: post.is_video || false,
            caption: post.caption || "",
            created_at: post.created_at,
            user_id: post.user_id,
            group_id: post.group_id,
            author: {
              username: profile?.username || "Unknown",
              avatar_url: profile?.avatar_url || "",
            },
            likes: likesData.count || 0,
            comments: commentsData.count || 0,
            isLiked: !!userLike.data,
          };
        })
      );

      return postsWithEngagement as Post[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
};
