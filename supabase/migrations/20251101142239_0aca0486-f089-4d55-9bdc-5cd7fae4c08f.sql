-- Add group_id column to posts table for group-specific posts
ALTER TABLE public.posts ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Create index for efficient querying of group posts
CREATE INDEX idx_posts_group_id ON public.posts(group_id);

-- Update RLS policy to allow users to create posts in groups they're members of
CREATE POLICY "Users can create posts in groups they are members of"
ON public.posts
FOR INSERT
WITH CHECK (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = posts.group_id 
    AND user_id = auth.uid()
  )
);