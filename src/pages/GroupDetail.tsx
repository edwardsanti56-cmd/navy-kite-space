import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ArrowLeft, Plus, Users, Trash2 } from "lucide-react";
import { usePostsQuery } from "@/hooks/usePostsQuery";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;

      const [memberCountData, joinStatusData] = await Promise.all([
        supabase
          .from("group_members")
          .select("*", { count: "exact" })
          .eq("group_id", groupId),
        user
          ? supabase
              .from("group_members")
              .select("*")
              .eq("group_id", groupId)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...data,
        member_count: memberCountData.count || 0,
        is_joined: !!joinStatusData.data,
        is_owner: user?.id === data.created_by,
      };
    },
  });

  const { data: posts, isLoading: postsLoading } = usePostsQuery(groupId);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (group?.is_joined) {
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
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(group?.is_joined ? "Left group" : "Joined group");
    },
    onError: () => {
      toast.error("Failed to update group membership");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existingLike } = await supabase
        .from("likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingLike) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", groupId] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get post to delete media
      const post = posts?.find(p => p.id === postId);
      if (post?.media_url) {
        const urlParts = post.media_url.split('/');
        const fileName = urlParts.slice(-2).join('/');
        await supabase.storage.from('media').remove([fileName]);
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", groupId] });
      toast.success("Post deleted");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete group banner if exists
      if (group?.banner_url) {
        const urlParts = group.banner_url.split('/');
        const fileName = urlParts.slice(-2).join('/');
        await supabase.storage.from('media').remove([fileName]);
      }

      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId)
        .eq("created_by", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Group deleted");
      navigate("/groups");
    },
    onError: () => {
      toast.error("Failed to delete group");
    },
  });

  if (groupLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/groups")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">{group.name}</h1>
          {group.is_owner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this group? This will delete all posts and members. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteGroupMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Group Banner */}
      <div className="aspect-[3/1] bg-muted relative">
        {group.banner_url && (
          <img
            src={group.banner_url}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Group Info */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
            {group.description && (
              <p className="text-muted-foreground mb-3">{group.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.member_count} members</span>
            </div>
          </div>
          <Button
            variant={group.is_joined ? "outline" : "default"}
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            {group.is_joined ? "Joined" : "Join Group"}
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              userId={post.user_id}
              currentUserId={currentUser?.id}
              username={post.author.username}
              avatar={post.author.avatar_url}
              mediaUrl={post.media_url}
              isVideo={post.is_video}
              caption={post.caption}
              likes={post.likes}
              comments={post.comments}
              timestamp={post.created_at}
              isLiked={post.isLiked}
              onLike={() => likeMutation.mutate(post.id)}
              onDelete={() => deletePostMutation.mutate(post.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No posts in this group yet</p>
            {group.is_joined && (
              <p className="text-sm text-muted-foreground">Be the first to share something!</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      {group.is_joined && (
        <Button
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => navigate(`/create?groupId=${groupId}`)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
