import { GroupCard } from "@/components/GroupCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { useGroupsQuery } from "@/hooks/useGroupsQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function Groups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: groups, isLoading } = useGroupsQuery();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const joinMutation = useMutation({
    mutationFn: async ({ groupId, isJoined }: { groupId: string; isJoined: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      if (isJoined) {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_members")
          .insert({ group_id: groupId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group membership updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update membership");
    },
  });

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Groups</h1>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="Search for groups..."
              className="pl-10 bg-card text-foreground border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={() => queryClient.invalidateQueries({ queryKey: ["groups"] })}
      />

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'No groups found' : 'No groups yet. Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                name={group.name}
                banner={group.banner_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"}
                memberCount={group.member_count}
                isJoined={group.is_joined}
                onToggle={() => joinMutation.mutate({ groupId: group.id, isJoined: group.is_joined })}
                onClick={() => navigate(`/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
