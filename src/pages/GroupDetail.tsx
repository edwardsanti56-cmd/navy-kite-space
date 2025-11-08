import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ArrowLeft, Users, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePostsQuery } from "@/hooks/usePostsQuery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
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
import { ChatInputBar } from "@/components/ChatInputBar";

export default function GroupDetail() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_groups_with_details", { p_user_id: user?.id || null });
      
      if (error) throw error;
      return data?.find((g: any) => g.id === groupId);
    },
  });

  const { data: posts = [], isLoading: postsLoading } = usePostsQuery(groupId);

  // Realtime subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ["posts", groupId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => queryClient.invalidateQueries({ queryKey: ["posts", groupId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group", groupId] });
          queryClient.invalidateQueries({ queryKey: ["groups"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  const joinMutation = useMutation({
    mutationFn: async (isJoined: boolean) => {
      if (isJoined) {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_members")
          .insert({ group_id: groupId, user_id: user?.id });
        if (error) throw error;
      }
    },
    onMutate: async (isJoined) => {
      await queryClient.cancelQueries({ queryKey: ["group", groupId] });
      const previousGroup = queryClient.getQueryData(["group", groupId]);

      queryClient.setQueryData(["group", groupId], (old: any) =>
        old ? {
          ...old,
          is_joined: !isJoined,
          member_count: old.member_count + (isJoined ? -1 : 1),
        } : old
      );

      return { previousGroup };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["group", groupId], context?.previousGroup);
      toast.error("Failed to update membership");
    },
  });

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
      await queryClient.cancelQueries({ queryKey: ["posts", groupId] });
      const previousPosts = queryClient.getQueryData(["posts", groupId]);

      queryClient.setQueryData(["posts", groupId], (old: any) =>
        old?.map((post: any) =>
          post.id === postId
            ? { ...post, isLiked: !isLiked, likes: post.likes + (isLiked ? -1 : 1) }
            : post
        )
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["posts", groupId], context?.previousPosts);
      toast.error("Failed to update like");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const post = posts.find(p => p.id === postId);
      
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      if (post?.media_url) {
        const urlParts = post.media_url.split('/');
        const fileName = urlParts.slice(-3).join('/');
        supabase.storage.from('media').remove([fileName]).catch(console.error);
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts", groupId] });
      const previousPosts = queryClient.getQueryData(["posts", groupId]);

      queryClient.setQueryData(["posts", groupId], (old: any) =>
        old?.filter((post: any) => post.id !== postId)
      );

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["posts", groupId], context?.previousPosts);
      toast.error("Failed to delete post");
    },
    onSuccess: () => {
      toast.success("Post deleted");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      if (group?.banner_url && !group.banner_url.includes('placeholder')) {
        const urlParts = group.banner_url.split('/');
        const fileName = urlParts.slice(-3).join('/');
        supabase.storage.from('media').remove([fileName]).catch(console.error);
      }

      const { error } = await supabase.from("groups").delete().eq("id", groupId);
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

  const handleSendMessage = async (message: string) => {
    if (!user || !groupId) return;
    
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      caption: message,
      group_id: groupId,
      media_url: '',
      is_video: false,
    });

    if (error) {
      toast.error("Failed to send message");
      throw error;
    }
  };

  const handleSendMedia = async (file: File, caption?: string) => {
    if (!user || !groupId) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/posts/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      toast.error("Failed to upload media");
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);
    
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      media_url: publicUrl,
      caption: caption || null,
      is_video: file.type.startsWith('video/'),
      group_id: groupId,
    });

    if (error) {
      toast.error("Failed to create post");
      throw error;
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!user || !groupId) return;

    const fileName = `${user.id}/audio/${Date.now()}.webm`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, audioBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/webm'
      });

    if (uploadError) {
      toast.error("Failed to upload audio");
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);
    
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      media_url: publicUrl,
      caption: '🎤 Voice message',
      is_video: false,
      group_id: groupId,
    });

    if (error) {
      toast.error("Failed to send voice message");
      throw error;
    }

    toast.success("Voice message sent");
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const secondsAgo = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (secondsAgo < 60) return `${secondsAgo}s`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
    return `${Math.floor(secondsAgo / 86400)}d`;
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
          <div className="max-w-screen-lg mx-auto">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-screen-lg mx-auto px-4 pt-4">
          <Skeleton className="w-full h-48 rounded-xl mb-6" />
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Group not found</p>
        </div>
      </div>
    );
  }

  const isOwner = group.created_by === user?.id;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/groups")}
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">{group.name}</h1>
          </div>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:text-primary-foreground hover:bg-destructive/20"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will permanently delete this group and all its posts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteGroupMutation.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-soft)] mb-6">
          <div
            className="h-48 bg-gradient-to-br from-primary to-accent bg-cover bg-center"
            style={{ backgroundImage: group.banner_url ? `url(${group.banner_url})` : undefined }}
          />
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{group.name}</h2>
              <p className="text-muted-foreground">{group.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
              </div>
              <Button
                onClick={() => joinMutation.mutate(group.is_joined)}
                variant={group.is_joined ? "outline" : "default"}
                disabled={joinMutation.isPending}
              >
                {group.is_joined ? "Leave" : "Join"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {postsLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-soft)]">
                <div className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="w-full aspect-square" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl shadow-[var(--shadow-soft)]">
              <p className="text-muted-foreground">No posts yet in this group</p>
            </div>
          ) : (
            posts.map((post) => (
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
            ))
          )}
        </div>
      </main>

      {group.is_joined && (
        <ChatInputBar
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          onSendAudio={handleSendAudio}
        />
      )}
    </div>
  );
}
