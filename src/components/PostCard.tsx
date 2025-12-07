import { Heart, MessageCircle, Share2, Trash2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
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
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-play video when in view, pause when out of view
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Auto-play was prevented, user needs to interact first
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // 50% of video must be visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleLike = () => {
    if (onLike) {
      onLike(postId, isLiked);
    }
  };

  const handleProfileClick = () => {
    if (currentUserId === userId) {
      navigate("/profile");
    } else {
      navigate(`/user/${userId}`);
    }
  };

  const isOwner = currentUserId && userId === currentUserId;

  return (
    <div className="bg-card border border-border overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
          <Avatar className="h-8 w-8 ring-2 ring-accent/30">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <p className="font-semibold text-sm text-foreground">{username}</p>
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
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="absolute bottom-3 right-3 bg-background/60 hover:bg-background/80 rounded-full h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-foreground" />
                )}
              </Button>
            </>
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
