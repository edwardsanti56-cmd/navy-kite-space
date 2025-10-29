import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface GroupCardProps {
  name: string;
  banner: string;
  memberCount: number;
  isJoined?: boolean;
  onToggle?: () => void;
}

export const GroupCard = ({ name, banner, memberCount, isJoined = false, onToggle }: GroupCardProps) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all hover:scale-[1.02]">
      <div className="aspect-video bg-muted relative">
        <img
          src={banner}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground mb-1 line-clamp-1">{name}</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span>{memberCount.toLocaleString()} members</span>
        </div>
        <Button
          className="w-full"
          variant={isJoined ? "outline" : "default"}
          onClick={onToggle}
        >
          {isJoined ? "Joined" : "Join Group"}
        </Button>
      </div>
    </div>
  );
};
