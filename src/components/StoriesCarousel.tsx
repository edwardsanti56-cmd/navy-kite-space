import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Story {
  id: string;
  username: string;
  avatar: string | null;
  hasNewStory: boolean;
}

// Mock stories data - in a real app this would come from the database
const mockStories: Story[] = [
  { id: "1", username: "john_doe", avatar: null, hasNewStory: true },
  { id: "2", username: "jane_smith", avatar: null, hasNewStory: true },
  { id: "3", username: "mike_123", avatar: null, hasNewStory: false },
  { id: "4", username: "sarah_k", avatar: null, hasNewStory: true },
  { id: "5", username: "alex_pro", avatar: null, hasNewStory: true },
  { id: "6", username: "emma_w", avatar: null, hasNewStory: false },
];

interface StoryAvatarProps {
  username: string;
  avatar: string | null;
  hasNewStory: boolean;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

const StoryAvatar = ({ username, avatar, hasNewStory, isCurrentUser, onClick }: StoryAvatarProps) => {
  return (
    <button 
      className="flex flex-col items-center gap-1 min-w-[72px]"
      onClick={onClick}
    >
      <div className={`relative p-[3px] rounded-full ${hasNewStory ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-muted'}`}>
        <div className="bg-background p-[2px] rounded-full">
          <Avatar className="h-14 w-14 border-0">
            <AvatarImage src={avatar || undefined} alt={username} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        {isCurrentUser && (
          <div className="absolute bottom-0 right-0 bg-accent rounded-full p-0.5 border-2 border-background">
            <Plus className="h-3 w-3 text-accent-foreground" />
          </div>
        )}
      </div>
      <span className="text-xs text-foreground truncate w-16 text-center">
        {isCurrentUser ? "Your story" : username}
      </span>
    </button>
  );
};

export function StoriesCarousel() {
  const { user } = useAuth();
  const { data: profile } = useProfileQuery();
  const navigate = useNavigate();

  const handleCreateStory = () => {
    navigate("/create");
  };

  return (
    <div className="bg-card border-b border-border py-4">
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4">
          {/* Current user's story */}
          <StoryAvatar
            username={profile?.profile?.username || "You"}
            avatar={profile?.profile?.avatar_url || null}
            hasNewStory={false}
            isCurrentUser
            onClick={handleCreateStory}
          />
          
          {/* Other users' stories */}
          {mockStories.map((story) => (
            <StoryAvatar
              key={story.id}
              username={story.username}
              avatar={story.avatar}
              hasNewStory={story.hasNewStory}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}

