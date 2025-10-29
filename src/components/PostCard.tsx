import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PostCardProps {
  postId: string;
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
}

export const PostCard = ({
  postId,
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
}: PostCardProps) => {
  const handleLike = () => {
    if (onLike) {
      onLike(postId, isLiked);
    }
  };

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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Media */}
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
          <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
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
