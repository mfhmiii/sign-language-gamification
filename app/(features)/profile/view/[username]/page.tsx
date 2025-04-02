"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Flame, Coins, BookOpen, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { getUserRank, getBadgeInfo } from "@/utils/ranking";
import { useParams } from "next/navigation";

interface UserData {
  id: string;
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

interface Mission {
  id: string;
  name: string;
  badge_reward: string | null;
}

interface MissionProgress {
  mission_id: string;
  current_level: number;
}

export default function ViewUserProfile() {
  const { username } = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get user data by username
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            "id, email, username, profile_photo, points, xp, badges1, badges2, badges3, longest_quiz_streak"
          )
          .eq("username", username)
          .single();

        if (error) throw error;
        if (userData) {
          setUserData(userData);
          // Get user rank
          const rankData = await getUserRank(userData.id);
          if (rankData) setUserRank(rankData.rank);

          // Get missions and mission progress
          const [{ data: missionsData }, { data: missionProgressData }] =
            await Promise.all([
              supabase.from("mission").select("id, name, badge_reward"),
              supabase
                .from("user_mission_progress")
                .select("mission_id, current_level")
                .eq("user_id", userData.id),
            ]);

          if (missionsData) setMissions(missionsData);
          if (missionProgressData) setMissionProgress(missionProgressData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchUserData();
    }
  }, [username, supabase]);

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
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between mb-6">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
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
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <h2 className="text-xl font-semibold">{userData.username}</h2>
          </div>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
        <div className="flex sm:gap-1 justify-around">
          {/* Beginner Badge */}
          <div className="flex flex-col items-center">
            <div className="lg:size-40 md:size-28 sm:size-24 size-20 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges1 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/beginner.svg"
                    alt="Beginner Badge"
                    width={60}
                    height={60}
                    className="text-red-500 md:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={40} />
              )}
            </div>
            <span className="mt-2 text-sm text-gray-600">Beginner</span>
          </div>

          {/* Intermediate Badge */}
          <div className="flex flex-col items-center ">
            <div className="lg:size-40 md:size-28 sm:size-24 size-20 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges2 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/intermediate.svg"
                    alt="Intermediate Badge"
                    width={50}
                    height={50}
                    className="text-red-500 md:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={40} />
              )}
            </div>
            <span className="mt-2 text-sm text-gray-600">Intermediet</span>
          </div>

          {/* Expert Badge */}
          <div className="flex flex-col items-center">
            <div className="lg:size-40 md:size-28 sm:size-24 size-20 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges3 ? (
                <div className="bg-yellow-300 m-1 items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/expert.svg"
                    alt="Expert Badge"
                    width={50}
                    height={50}
                    className="text-red-500 md:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={40} />
              )}
            </div>
            <span className="mt-2 text-sm text-gray-600">Expert</span>
          </div>
        </div>
      </div>

      {/* Misi Section */}
      <div className="pb-10">
        <h4 className="text-center text-gray-700 text-lg mb-4">Misi</h4>
        <div className="flex sm:gap-1 justify-around">
          {missions.map((mission) => {
            const progress = missionProgress.find(
              (p) => p.mission_id === mission.id
            );
            const currentLevel = progress?.current_level || 1;
            return (
              <div key={mission.id} className="flex flex-col items-center">
                <div className="lg:size-40 md:size-28 sm:size-24 size-20 relative clip-hexagon bg-slate-200">
                  {progress ? (
                    <div className="bg-yellow-300 m-1 items-center flex justify-center absolute inset-0 clip-hexagon">
                      {mission.badge_reward ? (
                        <Image
                          src={mission.badge_reward}
                          alt={mission.name}
                          width={40}
                          height={40}
                          className="text-red-500 md:w-20"
                        />
                      ) : (
                        <BookOpen className="text-red-500" size={24} />
                      )}
                    </div>
                  ) : (
                    <Lock className="text-gray-400" size={24} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <span className="text-sm text-gray-600">{mission.name}</span>
                  <span className="block text-xs text-gray-500">
                    Level {currentLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
