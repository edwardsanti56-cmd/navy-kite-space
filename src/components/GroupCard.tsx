import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GroupCardProps {
  name: string;
  banner: string;
  memberCount: number;
  isJoined?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export const GroupCard = ({ name, banner, memberCount, isJoined = false, onToggle, onClick }: GroupCardProps) => {
  return (
    <div 
      className="bg-card rounded-xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all cursor-pointer p-4 flex items-center gap-4"
      onClick={onClick}
    >
      <Avatar className="h-14 w-14 ring-2 ring-accent/20">
        <AvatarImage src={banner} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground line-clamp-1">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {memberCount.toLocaleString()} members
        </p>
      </div>

      <Button
        variant={isJoined ? "outline" : "default"}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
      >
        {isJoined ? "Joined" : "Join"}
      </Button>
    </div>
  );
};
