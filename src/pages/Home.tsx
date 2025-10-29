import { PostCard } from "@/components/PostCard";
import heroFeed from "@/assets/hero-feed.jpg";
import profileAvatar from "@/assets/profile-avatar.jpg";

const mockPosts = [
  {
    id: 1,
    username: "alex_creative",
    avatar: profileAvatar,
    timestamp: "2 hours ago",
    mediaUrl: heroFeed,
    caption: "Loving the new design trends for 2025! What do you think? 🎨✨",
    likes: 1247,
    comments: 89,
  },
  {
    id: 2,
    username: "design_studio",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Studio",
    timestamp: "5 hours ago",
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    caption: "Sunset vibes 🌅 Perfect end to a productive week!",
    likes: 892,
    comments: 45,
  },
  {
    id: 3,
    username: "photo_world",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Photo",
    timestamp: "1 day ago",
    mediaUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    caption: "Weekend road trip adventures! 🚗💨",
    likes: 2103,
    comments: 124,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold">Kite Feed</h1>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-screen-lg mx-auto px-4 pt-4">
        {mockPosts.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </main>
    </div>
  );
}
