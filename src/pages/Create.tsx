import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UploadProgressToast } from "@/components/UploadProgressToast";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const toastIdRef = useRef<string | number | null>(null);
  
  const { progress, isUploading, uploadFile, cancelUpload, resetUpload } = useUploadWithProgress();

  useEffect(() => {
    if (groupId) {
      supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single()
        .then(({ data }) => {
          if (data) setGroupName(data.name);
        });
    }
  }, [groupId]);

  // Update toast with progress
  useEffect(() => {
    if (isUploading && selectedFile) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.custom(
          () => (
            <UploadProgressToast 
              progress={progress} 
              fileName={selectedFile.name}
              onCancel={handleCancelUpload}
            />
          ),
          { 
            duration: Infinity,
            className: "bg-card border border-border"
          }
        );
      } else {
        toast.custom(
          () => (
            <UploadProgressToast 
              progress={progress} 
              fileName={selectedFile.name}
              onCancel={handleCancelUpload}
            />
          ),
          { 
            id: toastIdRef.current,
            duration: Infinity,
            className: "bg-card border border-border"
          }
        );
      }
    }
  }, [progress, isUploading, selectedFile]);

  const handleCancelUpload = () => {
    cancelUpload();
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    toast.error("Upload cancelled");
  };

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

    try {
      // Upload file with progress tracking
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/posts/${Date.now()}.${fileExt}`;
      
      const result = await uploadFile('media', fileName, selectedFile);
      
      if (!result) {
        throw new Error("Upload failed");
      }

      // Dismiss progress toast
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      
      // Create post in database
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          media_url: result.publicUrl,
          caption: caption || null,
          is_video: selectedFile.type.startsWith('video/'),
          group_id: groupId || null,
        });

      if (error) throw error;

      toast.success("Post shared successfully!");
      navigate(groupId ? `/groups/${groupId}` : "/");
    } catch (error: any) {
      if (error.message !== "Upload cancelled") {
        toast.error("Failed to share post: " + error.message);
      }
      console.error('Error creating post:', error);
      
      // Dismiss progress toast on error
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      resetUpload();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Create New Post</h1>
            <Button
              onClick={handleShare}
              variant="secondary"
              className="font-semibold"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Share"}
            </Button>
          </div>
          {groupName && (
            <p className="text-sm text-primary-foreground/80">
              Posting to: <span className="font-semibold">{groupName}</span>
            </p>
          )}
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
