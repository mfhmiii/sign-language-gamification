"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PencilIcon, Flame, Coins, BookOpen, Lock, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { getUserRank, getBadgeInfo } from "@/utils/ranking";

interface UserData {
  email: string;
  username: string;
  profile_photo: string | null;
  points: number;
  xp: number;
  badges1: boolean;
  badges2: boolean;
  badges3: boolean;
  longest_quiz_streak: number;
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get user data
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            "email, username, profile_photo, points, xp, badges1, badges2, badges3, longest_quiz_streak"
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (userData) setUserData(userData);

        // Get user rank
        const rankData = await getUserRank(user.id);
        if (rankData) setUserRank(rankData.rank);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchUserData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        User not found
      </div>
    );
  }

  const level = Math.floor(userData.xp / 1000);
  const currentLevelXp = userData.xp % 1000;
  const xpProgress = (currentLevelXp / 1000) * 100;

  const badgeInfo = userRank ? getBadgeInfo(userRank) : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-red-400">
            <Image
              src={
                userData.profile_photo || "/placeholder.svg?height=64&width=64"
              }
              alt="User avatar"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">{userData.username}</h2>
            <div className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs">
              {userData.email}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <PencilIcon size={16} />
          <span>Edit</span>
        </Button>
      </div>

      {/* Level Progress */}
      <div className="bg-green-300 p-4 rounded-lg mb-4">
        <div className="flex justify-between mb-1">
          <span className="font-medium">Level {level}</span>
          <span className="text-gray-600">XP {currentLevelXp} / 1000</span>
        </div>
        <div className="w-full bg-white rounded-full h-4">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-4 rounded-full"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-300 p-4 rounded-lg flex items-center">
          <div className="p-2 rounded-full bg-red-100 mr-3">
            <Flame className="text-red-500" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {userData.longest_quiz_streak}
            </div>
            <div className="text-gray-600 text-sm">Answer Streak</div>
          </div>
        </div>
        <div className="bg-green-300 p-4 rounded-lg flex items-center">
          <div className="p-2 rounded-full bg-yellow-100 mr-3">
            <Coins className="text-yellow-500" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{userData.points}</div>
            <div className="text-gray-600 text-sm">Poin</div>
          </div>
        </div>
      </div>

      {/* Lencana Section */}
      <div className="mb-6">
        <h3 className="text-center text-green-400 text-xl mb-2">Lencana</h3>
        <div className="border-b-2 border-green-200 mb-4"></div>

        <h4 className="text-center text-gray-700 text-lg mb-4">Level Materi</h4>
        <div className="flex gap-20 justify-center">
          {/* Beginner Badge */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <div
                className={`absolute inset-0 ${userData.badges1 ? "bg-teal-100" : "bg-gray-100"} rounded-hexagon flex items-center justify-center`}
              >
                {userData.badges1 ? (
                  <div className="bg-yellow-300 p-1 rounded-full">
                    <BookOpen className="text-red-500" size={24} />
                  </div>
                ) : (
                  <Lock className="text-gray-400" size={24} />
                )}
              </div>
            </div>
            <span className="mt-2 text-sm text-gray-600">Beginner</span>
          </div>

          {/* Intermediate Badge */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <div
                className={`absolute inset-0 ${userData.badges2 ? "bg-teal-100" : "bg-gray-100"} rounded-hexagon flex items-center justify-center`}
              >
                {userData.badges2 ? (
                  <div className="bg-yellow-300 p-1 rounded-full">
                    <BookOpen className="text-red-500" size={24} />
                  </div>
                ) : (
                  <Lock className="text-gray-400" size={24} />
                )}
              </div>
            </div>
            <span className="mt-2 text-sm text-gray-600">Intermediet</span>
          </div>

          {/* Expert Badge */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <div
                className={`absolute inset-0 ${userData.badges3 ? "bg-teal-100" : "bg-gray-100"} rounded-hexagon flex items-center justify-center`}
              >
                {userData.badges3 ? (
                  <div className="bg-yellow-300 p-1 rounded-full">
                    <BookOpen className="text-red-500" size={24} />
                  </div>
                ) : (
                  <Lock className="text-gray-400" size={24} />
                )}
              </div>
            </div>
            <span className="mt-2 text-sm text-gray-600">Expert</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div>
        <h4 className="text-center text-gray-700 text-lg mb-4">Leaderboard</h4>
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <div
                className={`absolute inset-0 ${badgeInfo ? `bg-${badgeInfo.color.split("-")[1]}-200` : "bg-gray-200"} rounded-hexagon flex items-center justify-center`}
              >
                <Trophy
                  className={badgeInfo ? badgeInfo.color : "text-gray-500"}
                  size={24}
                />
                {userRank && (
                  <div
                    className={`absolute text-xs font-bold ${badgeInfo ? `bg-${badgeInfo.color.split("-")[1]}-400` : "bg-gray-400"} text-white px-1 rounded`}
                  >
                    #{userRank}
                  </div>
                )}
              </div>
            </div>
            <span className="mt-2 text-sm text-gray-600">
              {badgeInfo
                ? `${badgeInfo.badge} Rank #${userRank}`
                : "Not Ranked"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
