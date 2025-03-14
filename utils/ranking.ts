import { createClient } from "@/utils/supabase/client";

export interface RankedUser {
  id: string;
  username: string;
  points: number;
  xp: number;
  profile_photo?: string;
  rank: number;
}

let cachedRankings: RankedUser[] | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getRankedUsers(): Promise<RankedUser[]> {
  const currentTime = Date.now();

  // Return cached rankings if they're still valid
  if (cachedRankings && currentTime - lastCacheTime < CACHE_DURATION) {
    return cachedRankings;
  }

  // If cache is expired or doesn't exist, fetch new rankings
  const supabase = createClient();

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, points, xp, profile_photo")
      .order("points", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return cachedRankings || []; // Return cached data if available, empty array if not
    }

    // Add ranks to users
    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    // Update cache
    cachedRankings = rankedUsers;
    lastCacheTime = currentTime;

    return rankedUsers;
  } catch (error) {
    console.error("Error in getRankedUsers:", error);
    return cachedRankings || []; // Return cached data if available, empty array if not
  }
}

export async function getUserRank(userId: string): Promise<RankedUser | null> {
  const rankedUsers = await getRankedUsers();
  return rankedUsers.find((user) => user.id === userId) || null;
}

export function getBadgeInfo(rank: number) {
  if (rank == 1) {
    return {
      badge: "Gold",
      color: "text-yellow-500",
      icon: "🏆",
    };
  } else if (rank == 2) {
    return {
      badge: "Silver",
      color: "text-slate-500",
      icon: "🥈",
    };
  } else if (rank == 3) {
    return {
      badge: "Bronze",
      color: "text-orange-700",
      icon: "🥉",
    };
  }
  return {
    badge: "Member",
    color: "text-gray-500",
    icon: "👤",
  };
}
