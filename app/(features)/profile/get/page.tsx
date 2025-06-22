"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PencilIcon, Flame, Coins, BookOpen, Lock, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { getUserRank, getBadgeInfo } from "@/utils/ranking";
import { useRouter } from "next/navigation";
// import router from "next/router";
import { updateUserLevel } from "@/app/actions";

interface UserData {
  email: string;
  username: string;
  profile_photo: string | null;
  points: number;
  xp: number;
  badges1: boolean;
  badges2: boolean;
  badges3: boolean;
  badges4: boolean; // Added fourth badge
  current_streak?: number;
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

export default function UserProfile() {
  // Remove achievement-related code
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Update user level based on XP
        await updateUserLevel(user.id);

        // Get user data
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            "email, username, profile_photo, points, xp, badges1, badges2, badges3, badges4"
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (userData) {
          setUserData(userData);
        }

        // Fetch current streak from login_streak table
        const { data: streakData, error: streakError } = await supabase
          .from("login_streaks")
          .select("current_streak")
          .eq("user_id", user.id)
          .single();

        if (streakError) throw streakError;
        if (streakData) {
          setUserData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              current_streak: streakData.current_streak,
            };
          });
        }

        // Get missions and mission progress
        const [{ data: missionsData }, { data: missionProgressData }] =
          await Promise.all([
            supabase.from("mission").select("id, name, badge_reward"),
            supabase
              .from("user_mission_progress")
              .select("mission_id, current_level")
              .eq("user_id", user.id),
          ]);

        if (missionsData) setMissions(missionsData);
        if (missionProgressData) setMissionProgress(missionProgressData);

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
    <div className="bg-white px-4 pb-20 pt-4 sm:pb-16 rounded-lg shadow-sm xl:mx-36 md:mx-14">
      {/* Profile Header */}
      <div className="flex flex-row items-center gap-4 justify-between mb-6">
        <div className="flex flex-row items-center text-left">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-red-400">
            <Image
              src={userData.profile_photo || "/images/default-avatar.svg"}
              alt="User avatar"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div className="mt-4 ml-4">
            <h2 className="text-xl font-semibold">{userData.username}</h2>
            <div className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs">
              {userData.email}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => router.push("/profile/edit")}
        >
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
            <div className="text-2xl font-bold">{userData.current_streak}</div>
            <div className="text-gray-600 text-sm">Login Streak</div>
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
        <h3 className="text-center text-green-400 text-xl mb-2 font-bold">
          Lencana
        </h3>
        <div className="border-b-2 border-green-200 mb-4"></div>

        <h4 className="text-center text-gray-700 text-lg mb-4 font-bold">
          Level Materi
        </h4>
        <div className="flex overflow-x-auto pb-4 space-x-2 sm:justify-around md:justify-around lg:justify-around xl:justify-around scrollbar-hide">
          <div className="flex flex-col items-center flex-shrink-0">
            {/* <div className="lg:w-32 lg:h-32 md:w-24 md:h-24 sm:w-20 sm:h-20 w-16 h-16 relative"> */}
            <div className="lg:size-40 size-28 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges1 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/Kata Dasar.png"
                    alt="Beginner Badge"
                    width={50}
                    height={50}
                    className="text-red-500 md:w-16 lg:w-20"
                  />
                </div>
              ) : (
                <Lock
                  className="text-gray-400 items-center md:w-20"
                  size={40}
                />
              )}
            </div>
            {/* </div> */}
            <span className="mt-3 text-sm font-medium text-gray-600">
              Kata Dasar
            </span>
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            {/* <div className="lg:w-32 lg:h-32 md:w-24 md:h-24 sm:w-20 sm:h-20 w-16 h-16 relative"> */}
            <div className="lg:size-40 size-28 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges2 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/Aktivitas.png"
                    alt="Intermediate Badge"
                    width={50}
                    height={50}
                    className="text-red-500 md:w-16 lg:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={50} />
              )}
            </div>
            {/* </div> */}
            <span className="mt-3 text-sm font-medium text-gray-600">
              Aktivitas
            </span>
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            {/* <div className="lg:w-32 lg:h-32 md:w-24 md:h-24 sm:w-20 sm:h-20 w-16 h-16 relative"> */}
            <div className="lg:size-40 size-28 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges3 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/Keluarga.png"
                    alt="Expert Badge"
                    width={50}
                    height={50}
                    className="text-red-500 md:w-16 lg:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={50} />
              )}
            </div>
            {/* </div> */}
            <span className="mt-3 text-sm font-medium text-gray-600">
              Keluarga
            </span>
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            <div className="lg:size-40 size-28 relative clip-hexagon bg-slate-200 flex justify-center items-center">
              {userData.badges4 ? (
                <div className="bg-yellow-300 m-1 flex justify-center items-center absolute inset-0 clip-hexagon">
                  <Image
                    src="/images/Sayur dan Buah.png"
                    alt="Master Badge"
                    width={40}
                    height={40}
                    className="text-red-500 md:w-16 lg:w-20"
                  />
                </div>
              ) : (
                <Lock className="text-gray-400 items-center" size={50} />
              )}
            </div>
            <span className="mt-3 text-sm font-medium text-gray-600">
              Buah dan Sayur
            </span>
          </div>
        </div>
      </div>

      {/* Misi Section */}
      <div className="pb-10">
        <h4 className="text-center text-gray-700 text-lg mb-4 font-bold">
          Misi
        </h4>
        <div className="flex sm:gap-1 justify-around">
          {missions.map((mission) => {
            const progress = missionProgress.find(
              (p) => p.mission_id === mission.id
            );
            const currentLevel = progress?.current_level || 0;
            return (
              <div key={mission.id} className="flex flex-col items-center">
                <div className="lg:size-40 md:size-28 sm:size-24 size-28 relative clip-hexagon bg-slate-200 flex justify-center items-center">
                  {progress && currentLevel > 0 ? (
                    <div className="bg-yellow-300 m-1 items-center flex justify-center absolute inset-0 clip-hexagon">
                      {mission.badge_reward ? (
                        <Image
                          src={mission.badge_reward}
                          alt={mission.name}
                          width={50}
                          height={50}
                          className="text-red-500 md:w-16 lg:w-20"
                        />
                      ) : (
                        <BookOpen className="text-red-500" size={24} />
                      )}
                    </div>
                  ) : (
                    <Lock className="text-gray-400" size={40} />
                  )}
                </div>
                <div className="mt-2 text-center max-w-[80px] md:max-w-max mx-auto">
                  <span className="text-sm text-gray-600">{mission.name}</span>
                  <span className="block text-xs text-gray-500">
                    Level {currentLevel > 0 ? currentLevel : "Locked"}
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
