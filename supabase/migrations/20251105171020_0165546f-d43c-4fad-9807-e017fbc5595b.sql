-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Create optimized function to fetch groups with all details in one query
CREATE OR REPLACE FUNCTION public.get_groups_with_details(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  banner_url text,
  created_by uuid,
  created_at timestamptz,
  member_count bigint,
  is_joined boolean
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.name,
    g.description,
    g.banner_url,
    g.created_by,
    g.created_at,
    COALESCE(COUNT(gm.id), 0) as member_count,
    COALESCE(BOOL_OR(gm.user_id = p_user_id), false) as is_joined
  FROM groups g
  LEFT JOIN group_members gm ON g.id = gm.group_id
  GROUP BY g.id, g.name, g.description, g.banner_url, g.created_by, g.created_at
  ORDER BY g.created_at DESC;
$$;