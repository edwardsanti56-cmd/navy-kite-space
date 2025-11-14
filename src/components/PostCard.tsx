import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  postId: string;
  userId: string;
  currentUserId?: string;
  username: string;
  avatar: string;
  timestamp: string;
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: number;
  isVideo?: boolean;
  isLiked?: boolean;
  onLike?: (postId: string, isLiked: boolean) => void;
  onDelete?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard = ({
  postId,
  userId,
  currentUserId,
  username,
  avatar,
  timestamp,
  mediaUrl,
  caption,
  likes,
  comments,
  isVideo = false,
  isLiked = false,
  onLike,
  onDelete,
  onComment,
  onShare,
}: PostCardProps) => {
  const handleLike = () => {
    if (onLike) {
      onLike(postId, isLiked);
    }
  };

  const isOwner = currentUserId && userId === currentUserId;

  return (
    <div className="bg-card rounded-xl overflow-hidden mb-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-accent/20">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{username}</p>
            <p className="text-sm text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        {isOwner && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(postId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="relative bg-muted aspect-square">
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Post content"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={cn(
              "hover:scale-110 transition-transform",
              isLiked && "text-destructive"
            )}
          >
            <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onComment?.(postId)}
            className="hover:scale-110 transition-transform"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onShare?.(postId)}
            className="hover:scale-110 transition-transform"
          >
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Stats & Caption */}
        <p className="font-semibold text-foreground mb-2">
          {likes.toLocaleString()} likes
        </p>
        <p className="text-foreground">
          <span className="font-semibold mr-2">{username}</span>
          {caption}
        </p>
        {comments > 0 && (
          <button className="text-muted-foreground text-sm mt-2 hover:text-foreground">
            View all {comments} comments
          </button>
        )}
      </div>
    </div>
  );
};
