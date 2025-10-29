import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Video, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Create() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const handleMediaSelect = (type: "image" | "video") => {
    // Simulate media selection
    if (type === "image") {
      setSelectedMedia("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80");
    } else {
      setSelectedMedia("video");
    }
  };

  const handleShare = () => {
    if (!selectedMedia) {
      toast.error("Please select an image or video");
      return;
    }
    
    toast.success("Post shared successfully!");
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)] flex items-center justify-between">
        <div className="max-w-screen-lg mx-auto w-full flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <Button
            onClick={handleShare}
            variant="secondary"
            className="font-semibold"
          >
            Share
          </Button>
        </div>
      </header>

      {/* Create Form */}
      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        {/* Media Selection */}
        {!selectedMedia ? (
          <div className="bg-card rounded-xl p-8 mb-4 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex gap-4">
                <button
                  onClick={() => handleMediaSelect("image")}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors"
                >
                  <ImagePlus className="h-12 w-12 text-accent" />
                  <span className="font-medium text-foreground">Select Image</span>
                </button>
                <button
                  onClick={() => handleMediaSelect("video")}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors"
                >
                  <Video className="h-12 w-12 text-accent" />
                  <span className="font-medium text-foreground">Select Video</span>
                </button>
              </div>
              <p className="text-muted-foreground text-center">
                Choose an image or video from your device
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl overflow-hidden mb-4 shadow-[var(--shadow-soft)] relative">
            <Button
              onClick={() => setSelectedMedia(null)}
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="aspect-square bg-muted">
              {selectedMedia === "video" ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="h-16 w-16 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={selectedMedia}
                  alt="Selected media"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* Caption */}
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
