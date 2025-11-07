-- Add CASCADE foreign keys for atomic deletions
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_group_id_fkey,
ADD CONSTRAINT posts_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE group_members 
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey,
ADD CONSTRAINT group_members_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE likes 
DROP CONSTRAINT IF EXISTS likes_post_id_fkey,
ADD CONSTRAINT likes_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey,
ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_likes_post_user ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Create optimized function to fetch posts with all metadata in one query
CREATE OR REPLACE FUNCTION public.get_posts_with_meta(
  p_user_id uuid DEFAULT NULL,
  p_group_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  media_url text,
  caption text,
  is_video boolean,
  created_at timestamp with time zone,
  group_id uuid,
  author_username text,
  author_avatar_url text,
  likes_count bigint,
  comments_count bigint,
  is_liked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.media_url,
    p.caption,
    p.is_video,
    p.created_at,
    p.group_id,
    prof.username as author_username,
    prof.avatar_url as author_avatar_url,
    COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comments_count,
    COALESCE((SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = p_user_id)), false) as is_liked
  FROM posts p
  LEFT JOIN profiles prof ON p.user_id = prof.id
  WHERE (p_group_id IS NULL AND p.group_id IS NULL) 
     OR (p_group_id IS NOT NULL AND p.group_id = p_group_id)
  ORDER BY p.created_at DESC;
$$;