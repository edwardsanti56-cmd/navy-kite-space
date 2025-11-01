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

      const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groupsWithDetails = await Promise.all(
        groups.map(async (group) => {
          const [memberCountData, joinStatusData] = await Promise.all([
            supabase
              .from("group_members")
              .select("*", { count: "exact" })
              .eq("group_id", group.id),
            user
              ? supabase
                  .from("group_members")
                  .select("*")
                  .eq("group_id", group.id)
                  .eq("user_id", user.id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...group,
            banner_url: group.banner_url || "/placeholder.svg",
            member_count: memberCountData.count || 0,
            is_joined: !!joinStatusData.data,
          };
        })
      );

      return groupsWithDetails as Group[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
