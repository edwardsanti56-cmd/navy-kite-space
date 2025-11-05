-- Allow users to delete their own groups
CREATE POLICY "Users can delete their own groups"
ON public.groups
FOR DELETE
USING (auth.uid() = created_by);