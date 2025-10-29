import { GroupCard } from "@/components/GroupCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import groupsBanner from "@/assets/groups-banner.jpg";

const mockGroups = [
  {
    id: 1,
    name: "Photography Enthusiasts",
    banner: groupsBanner,
    memberCount: 12453,
    isJoined: true,
  },
  {
    id: 2,
    name: "Digital Art Collective",
    banner: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
    memberCount: 8921,
    isJoined: false,
  },
  {
    id: 3,
    name: "Travel Stories",
    banner: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    memberCount: 15678,
    isJoined: false,
  },
  {
    id: 4,
    name: "Food & Culture",
    banner: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    memberCount: 9432,
    isJoined: true,
  },
  {
    id: 5,
    name: "Fitness Journey",
    banner: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    memberCount: 11234,
    isJoined: false,
  },
  {
    id: 6,
    name: "Tech & Innovation",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    memberCount: 18765,
    isJoined: false,
  },
];

export default function Groups() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-40 shadow-[var(--shadow-medium)]">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4">Groups</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="Search for groups..."
              className="pl-10 bg-card text-foreground border-none"
            />
          </div>
        </div>
      </header>

      {/* Groups Grid */}
      <main className="max-w-screen-lg mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockGroups.map((group) => (
            <GroupCard key={group.id} {...group} />
          ))}
        </div>
      </main>
    </div>
  );
}
