import { PostCard } from "@/components/PostCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  is_video: boolean;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  likes: { id: string; user_id: string }[];
  comments: { id: string }[];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();

    // Set up realtime subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles
      const userIds = postsData?.map(post => post.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      // Fetch likes
      const postIds = postsData?.map(post => post.id) || [];
      const { data: likesData } = await supabase
        .from('likes')
        .select('id, user_id, post_id')
        .in('post_id', postIds);

      // Fetch comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, post_id')
        .in('post_id', postIds);

      // Combine data
      const combinedPosts = postsData?.map(post => {
        const profile = profilesData?.find(p => p.id === post.user_id);
        const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
        const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];

        return {
          ...post,
          profiles: profile || null,
          likes: postLikes,
          comments: postComments,
        };
      }) || [];

      setPosts(combinedPosts);
    } catch (error: any) {
      toast.error('Failed to load posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      fetchPosts();
    } catch (error: any) {
      toast.error('Failed to update like');
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

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
          <h1 className="text-2xl font-bold">Kite Feed</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              username={post.profiles?.username || 'Unknown'}
              avatar={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
              timestamp={getTimeAgo(post.created_at)}
              mediaUrl={post.media_url}
              caption={post.caption || ''}
              likes={post.likes.length}
              comments={post.comments.length}
              isVideo={post.is_video}
              isLiked={post.likes.some(like => like.user_id === user?.id)}
              onLike={handleLike}
            />
          ))
        )}
      </main>
    </div>
  );
}
