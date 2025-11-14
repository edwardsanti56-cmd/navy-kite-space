import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

export const CommentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CommentDialogProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content);
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a comment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Write your comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
