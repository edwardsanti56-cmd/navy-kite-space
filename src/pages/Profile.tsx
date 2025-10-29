import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import profileAvatar from "@/assets/profile-avatar.jpg";
import heroFeed from "@/assets/hero-feed.jpg";

const userPosts = [
  { id: 1, image: heroFeed },
  { id: 2, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" },
  { id: 3, image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80" },
  { id: 4, image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" },
  { id: 5, image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80" },
  { id: 6, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" },
];

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)] flex items-center justify-between">
        <div className="max-w-screen-lg mx-auto w-full flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Button
            onClick={() => navigate("/edit-profile")}
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-6 mb-6">
            <Avatar className="h-24 w-24 ring-4 ring-accent/20">
              <AvatarImage src={profileAvatar} alt="Profile" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">alex_creative</h2>
              <p className="text-muted-foreground mb-4">
                Creative designer & photographer 📸✨
                <br />
                Capturing moments that matter
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around py-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{userPosts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">1.2K</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">543</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Posts</h3>
          <div className="grid grid-cols-3 gap-1">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
              >
                <img
                  src={post.image}
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
