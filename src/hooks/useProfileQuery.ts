import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website: string;
}

export interface Post {
  id: string;
  media_url: string;
  is_video: boolean;
}

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const [profileData, postsData, statsData] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabase
          .from("posts")
          .select("id, media_url, is_video")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select("*", { count: "exact" })
          .eq("user_id", user.id),
      ]);

      if (profileData.error) throw profileData.error;

      return {
        profile: profileData.data as Profile,
        posts: (postsData.data || []) as Post[],
        stats: {
          posts: statsData.count || 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
