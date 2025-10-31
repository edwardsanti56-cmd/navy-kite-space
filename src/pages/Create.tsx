import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Video, X, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleShare = async () => {
    if (!selectedFile || !user) {
      toast.error("Please select an image or video");
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/posts/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      
      // Create post in database
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          caption: caption || null,
          is_video: selectedFile.type.startsWith('video/'),
        });

      if (error) throw error;

      toast.success("Post shared successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to share post: " + error.message);
      console.error('Error creating post:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)] flex items-center justify-between">
        <div className="max-w-screen-lg mx-auto w-full flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <Button
            onClick={handleShare}
            variant="secondary"
            className="font-semibold"
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Sharing..." : "Share"}
          </Button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        {!previewUrl ? (
          <div className="bg-card rounded-xl p-8 mb-4 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col items-center justify-center gap-6">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors">
                  <Upload className="h-16 w-16 text-accent" />
                  <div className="text-center">
                    <p className="font-medium text-foreground text-lg mb-1">Choose a file</p>
                    <p className="text-sm text-muted-foreground">Images and videos supported</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl overflow-hidden mb-4 shadow-[var(--shadow-soft)] relative">
            <Button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="aspect-square bg-muted">
              {selectedFile?.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Selected media"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-soft)]">
          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[120px] border-none focus-visible:ring-0 resize-none text-base"
          />
        </div>
      </main>
    </div>
  );
}
