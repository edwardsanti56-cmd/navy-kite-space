import { GroupCard } from "@/components/GroupCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  banner_url: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
  isJoined: boolean;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      // Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch member counts and user memberships
      const groupIds = groupsData?.map(g => g.id) || [];
      
      const { data: membersData } = await supabase
        .from('group_members')
        .select('group_id, user_id');

      // Combine data
      const groupsWithCounts = groupsData?.map(group => {
        const members = membersData?.filter(m => m.group_id === group.id) || [];
        const isJoined = user ? members.some(m => m.user_id === user.id) : false;
        
        return {
          ...group,
          member_count: members.length,
          isJoined,
        };
      }) || [];

      setGroups(groupsWithCounts);
    } catch (error: any) {
      toast.error('Failed to load groups');
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinToggle = async (groupId: string, isJoined: boolean) => {
    if (!user) return;

    try {
      if (isJoined) {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);
        toast.success('Left group');
      } else {
        await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: user.id });
        toast.success('Joined group!');
      }
      fetchGroups();
    } catch (error: any) {
      toast.error('Failed to update membership');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
          <h1 className="text-2xl font-bold mb-4">Groups</h1>
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
                isJoined={group.isJoined}
                onToggle={() => handleJoinToggle(group.id, group.isJoined)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
