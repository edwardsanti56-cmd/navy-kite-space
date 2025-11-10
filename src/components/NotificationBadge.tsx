import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useNavigate } from "react-router-dom";

export const NotificationBadge = () => {
  const navigate = useNavigate();
  const { data: count = 0 } = useNotificationCount();

  return (
    <div className="relative">
      <Button
        onClick={() => navigate("/notifications")}
        variant="ghost"
        size="icon"
        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
      >
        <Heart className="h-6 w-6" />
      </Button>
      {count > 0 && (
        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </div>
      )}
    </div>
  );
};
