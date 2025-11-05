import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleBannerSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      // Compress image if it's large
      let processedFile = file;
      if (file.size > 1 * 1024 * 1024) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });

          // Resize to max 1920px width while maintaining aspect ratio
          const maxWidth = 1920;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
          });
          
          processedFile = new File([blob], file.name, { type: 'image/jpeg' });
          toast.success("Image optimized for upload");
        } catch (error) {
          console.error('Image compression failed:', error);
          toast.info("Using original image");
        }
      }

      setBannerFile(processedFile);
      const url = URL.createObjectURL(processedFile);
      setBannerPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a group");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setLoading(true);

    try {
      let bannerUrl = null;

      // Upload banner if selected
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${user.id}/groups/${Date.now()}.${fileExt}`;
        
        let uploadAttempts = 0;
        const maxAttempts = 3;
        let uploadError = null;

        while (uploadAttempts < maxAttempts) {
          try {
            const { error, data } = await supabase.storage
              .from('media')
              .upload(fileName, bannerFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              uploadError = error;
              uploadAttempts++;
              if (uploadAttempts < maxAttempts) {
                toast.info(`Upload failed, retrying... (${uploadAttempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
                continue;
              }
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

              bannerUrl = publicUrl;
              break;
            }
          } catch (error: any) {
            uploadError = error;
            uploadAttempts++;
            if (uploadAttempts < maxAttempts) {
              toast.info(`Upload failed, retrying... (${uploadAttempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
            }
          }
        }

        if (uploadError && uploadAttempts >= maxAttempts) {
          console.error('Storage upload error:', uploadError);
          toast.error(`Failed to upload banner after ${maxAttempts} attempts. Creating group without banner.`);
          // Continue with group creation without banner
          bannerUrl = null;
        }
      }

      // Create group
      const { error } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description || null,
          banner_url: bannerUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Group created successfully!");
      
      // Reset form
      setFormData({ name: "", description: "" });
      setBannerFile(null);
      setBannerPreview(null);
      
      onGroupCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to create group: " + error.message);
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a community group to connect with others who share your interests.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banner">Group Banner (Optional)</Label>
              <div className="flex flex-col gap-2">
                {bannerPreview ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Select Banner Image
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this group about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
