"use client";

import Image from "next/image";
import { Crown, Coins } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getRankedUsers } from "@/utils/ranking";
import type { RankedUser } from "@/utils/ranking";

export default function LeaderboardPage() {
  const router = useRouter();
  const [topPlayers, setTopPlayers] = useState<RankedUser[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<RankedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RankedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSticky, setShowSticky] = useState(false);
  const currentUserRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get ranked users (this will use cache if available)
        const rankedUsers = await getRankedUsers();

        // Find current user in the ranked list
        const userRank = rankedUsers.find((u) => u.id === user.id);
        if (userRank) {
          setCurrentUser(userRank);
        }

        // Split into top 3 and others
        const top3 = rankedUsers.slice(0, 3);
        const others = rankedUsers.slice(3); // Get all remaining users

        setTopPlayers(top3);
        setOtherPlayers(others);
      } catch (error) {
        console.error("Error in fetchLeaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();

    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [supabase]);

  useEffect(() => {
    const handleScroll = () => {
      if (currentUserRef.current) {
        const rect = currentUserRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        setShowSticky(!isVisible);
      } else {
        setShowSticky(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isCurrentUser = (playerId: string) => {
    return currentUser?.id === playerId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Top 3 Players */}
      <div className="flex justify-center items-end px-4 mb-6 pt-8">
        {topPlayers.map((player) => {
          const marginTop =
            player.rank === 1 ? "mt-0" : player.rank === 2 ? "mt-10" : "mt-16";
          const cardHeight =
            player.rank === 1 ? "h-32" : player.rank === 2 ? "h-28" : "h-24";

          return (
            <div
              key={player.id}
              className={`relative flex flex-col items-center ${
                player.rank === 1
                  ? "order-2 mx-2 z-10"
                  : player.rank === 2
                    ? "order-1 -mr-2"
                    : "order-3 -ml-2"
              } ${marginTop}`}
            >
              <div
                className={`relative ${player.rank === 1 ? "mb-2" : "mb-0"}`}
              >
                {player.rank === 1 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                <div
                  className={`relative rounded-full overflow-hidden border-4 ${
                    player.rank === 1
                      ? "border-yellow-400 bg-yellow-400"
                      : player.rank === 2
                        ? "border-slate-600 bg-slate-600"
                        : "border-orange-900 bg-orange-900"
                  } w-20 h-20`}
                >
                  <Image
                    src={
                      player.profile_photo ||
                      "/placeholder.svg?height=80&width=80"
                    }
                    alt={player.username}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {player.rank}
                  </div>
                </div>
              </div>
              <div
                className={`mt-2 bg-white rounded-lg p-3 shadow-md w-24 text-center ${cardHeight} flex flex-col justify-center gap-1 ${
                  player.rank === 1 ? "border-2 border-yellow-400" : ""
                }`}
              >
                <p className="font-bold text-sm">
                  {player.username}
                  {isCurrentUser(player.id) && (
                    <span className="text-blue-500 text-xs flex flex-wrap justify-center">
                      (You)
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <p className="text-gray-700 font-medium">{player.points}</p>
                </div>
                <p className="text-gray-500 text-xs">
                  Level {Math.floor(player.xp / 1000)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-t-3xl flex-1 p-4 md:p-10 ">
        {/* Table Header */}
        <div className="flex justify-between mb-2 px-4">
          <div className="w-16 font-medium text-gray-600">Rank</div>
          <div className="flex-1 font-medium text-gray-600">Username</div>
          <div className="w-24 text-right font-medium text-gray-600">Coins</div>
          <div className="w-20 text-right font-medium text-gray-600">Level</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2 pb-4">
          {otherPlayers.map((player) => (
            <div
              key={player.id}
              ref={isCurrentUser(player.id) ? currentUserRef : null}
              className={`flex justify-between items-center rounded-lg p-4 ${
                isCurrentUser(player.id) ? "bg-blue-100" : "bg-green-200"
              }`}
            >
              <div className="w-16 font-medium flex items-center gap-2">
                {player.rank}
              </div>
              <div
                className="flex-1 font-medium flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(`/profile/get`)}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={
                      player.profile_photo ||
                      "/placeholder.svg?height=32&width=32"
                    }
                    alt={player.username}
                    fill
                    className="object-cover"
                  />
                </div>
                {player.username}
                {isCurrentUser(player.id) && (
                  <span className="text-blue-500 text-sm">(You)</span>
                )}
              </div>
              <div className="w-24 text-right font-medium flex items-center justify-end gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{player.points}</span>
              </div>
              <div className="w-20 text-right text-gray-600">
                {Math.floor(player.xp / 1000)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
