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
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .rpc("get_posts_with_meta", { 
          p_user_id: user?.id || null, 
          p_group_id: groupId || null 
        });

      if (error) throw error;

      return (data || []).map((post: any) => ({
        id: post.id,
        content: post.caption || "",
        media_url: post.media_url,
        is_video: post.is_video || false,
        caption: post.caption || "",
        created_at: post.created_at,
        user_id: post.user_id,
        group_id: post.group_id,
        author: {
          username: post.author_username || "Unknown",
          avatar_url: post.author_avatar_url || "",
        },
        likes: Number(post.likes_count) || 0,
        comments: Number(post.comments_count) || 0,
        isLiked: post.is_liked || false,
      })) as Post[];
    },
  });
};
