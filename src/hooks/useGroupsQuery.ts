import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Group {
  id: string;
  name: string;
  banner_url: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_joined: boolean;
}

export const useGroupsQuery = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Use optimized function that fetches all data in one query
      const { data: groups, error } = await supabase
        .rpc("get_groups_with_details", { p_user_id: user?.id || null });

      if (error) throw error;

      // Map to expected format with placeholder for missing banners
      return (groups || []).map(group => ({
        ...group,
        banner_url: group.banner_url || "/placeholder.svg",
      })) as Group[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
