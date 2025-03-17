"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Mission = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  level_requirement: number;
  xp_reward: number;
  points_reward: number;
  badge_reward: string | null;
  created_at: string;
  updated_at: string;
};

type MissionProgress = {
  id: string;
  userId: string;
  mission_id: string;
  progress_point: number;
  current_level: number;
  current_level_requirement: number;
  last_completed_at: string | null;
};

type Achievement = {
  id: string;
  name: string;
  description: string | null;
  limit: number;
  xp_reward: number;
  points_reward: number;
  badge_reward: string | null;
  created_at: string;
  updated_at: string;
};

type AchievementProgress = {
  id: string;
  userId: string;
  achievement_id: string;
  progress_point: number;
  last_completed_at: string | null;
};

export default function MissionPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userProgress, setUserProgress] = useState<MissionProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<
    AchievementProgress[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null);
  const [userStreak, setUserStreak] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchMissions();
    fetchUserProgress();
    fetchAchievements();
    fetchAchievementProgress();
    setupStreakSubscription();

    return () => {
      supabase.channel("streak-changes").unsubscribe();
    };
  }, []);

  const fetchAchievements = async () => {
    const { data: achievementsData, error } = await supabase
      .from("achievement")
      .select("*");

    if (error) {
      console.error("Error fetching achievements:", error);
      return;
    }

    setAchievements(achievementsData);
  };

  const fetchAchievementProgress = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progressData, error } = await supabase
      .from("user_achievement_progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching achievement progress:", error);
      return;
    }

    setAchievementProgress(progressData || []);
  };

  const handleAchievementClaim = async (achievement: Achievement) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const progress = achievementProgress.find(
      (p) => p.achievement_id === achievement.id
    );

    if (
      progress &&
      progress.progress_point >= achievement.limit &&
      !progress.last_completed_at
    ) {
      // Get current user stats
      const { data: currentStats, error: statsError } = await supabase
        .from("users")
        .select("points, xp")
        .eq("id", user.id)
        .single();

      if (statsError) {
        console.error("Error fetching user stats:", statsError);
        return;
      }

      // Update user stats with rewards
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          points: (currentStats?.points || 0) + achievement.points_reward,
          xp: (currentStats?.xp || 0) + achievement.xp_reward,
        })
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("Error updating user stats:", userUpdateError);
        return;
      }

      // Update achievement progress
      const { error: progressUpdateError } = await supabase
        .from("user_achievement_progress")
        .update({
          last_completed_at: new Date().toISOString(),
        })
        .eq("id", progress.id);

      if (progressUpdateError) {
        console.error(
          "Error updating achievement progress:",
          progressUpdateError
        );
        return;
      }

      setCurrentAchievement(achievement);
      setShowModal(true);
      await fetchAchievementProgress(); // Refresh progress
    }
  };
  const fetchMissions = async () => {
    const { data: missionsData, error } = await supabase
      .from("mission")
      .select("*");

    if (error) {
      console.error("Error fetching missions:", error);
      return;
    }

    setMissions(missionsData);
  };

  const fetchUserProgress = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progressData, error } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user progress:", error);
      return;
    }

    setUserProgress(progressData || []);

    // Fetch initial streak value
    const { data: userData } = await supabase
      .from("users")
      .select("longest_quiz_streak")
      .eq("id", user.id)
      .single();

    if (userData) {
      setUserStreak(userData.longest_quiz_streak);
      // Update streak mission progress if it exists
      const streakMissionProgress = progressData?.find(
        (p) => p.mission_id === "550e8400-e29b-41d4-a716-446655440001"
      );
      if (streakMissionProgress) {
        await supabase
          .from("user_mission_progress")
          .update({ progress_point: userData.longest_quiz_streak })
          .eq("id", streakMissionProgress.id);
      }
    }
  };

  const setupStreakSubscription = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    supabase
      .channel("streak-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        async (payload: any) => {
          const newStreak = payload.new.longest_quiz_streak;
          setUserStreak(newStreak);

          // Update streak mission progress
          const streakMissionProgress = userProgress.find(
            (p) => p.mission_id === "550e8400-e29b-41d4-a716-446655440001"
          );

          if (streakMissionProgress) {
            await supabase
              .from("user_mission_progress")
              .update({ progress_point: newStreak })
              .eq("id", streakMissionProgress.id);

            // Update local state
            setUserProgress((prev) =>
              prev.map((p) =>
                p.id === streakMissionProgress.id
                  ? { ...p, progress_point: newStreak }
                  : p
              )
            );
          }
        }
      )
      .subscribe();
  };

  const handleClaim = async (mission: Mission) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const progress = userProgress.find((p) => p.mission_id === mission.id);

    if (progress && progress.progress_point >= mission.level_requirement) {
      // Get current user stats
      const { data: currentStats, error: statsError } = await supabase
        .from("users")
        .select("points, xp")
        .eq("id", user.id)
        .single();

      if (statsError) {
        console.error("Error fetching user stats:", statsError);
        return;
      }

      // Calculate scaled rewards based on current level
      const currentLevelMultiplier = 1 + progress.current_level * 0.5; // 50% increase per level
      const scaledPoints = Math.floor(
        mission.points_reward * currentLevelMultiplier
      );
      const scaledXP = Math.floor(mission.xp_reward * currentLevelMultiplier);

      // Update user stats with scaled rewards
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          points: (currentStats?.points || 0) + scaledPoints,
          xp: (currentStats?.xp || 0) + scaledXP,
        })
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("Error updating user stats:", userUpdateError);
        return;
      }

      // Calculate new requirements and rewards based on next level
      const nextLevel = progress.current_level + 1;
      const levelMultiplier = 1 + (nextLevel - 1) * 1.5; // 50% increase per level

      // Update mission progress with scaled requirements
      const { error: progressUpdateError } = await supabase
        .from("user_mission_progress")
        .update({
          current_level: nextLevel,
          progress_point:
            progress.progress_point -
            // mission.level_requirement,
            Math.floor(mission.level_requirement * levelMultiplier),
          last_completed_at: new Date().toISOString(),
        })
        .eq("id", progress.id);

      if (progressUpdateError) {
        console.error("Error updating mission progress:", progressUpdateError);
        return;
      }

      setCurrentMission(mission);
      setShowModal(true);
      await fetchUserProgress(); // Refresh progress
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {/* <img src="/mascot.png" alt="Mascot" className="w-12 h-12" /> */}
          <div>
            <h2 className="text-xl font-semibold">
              Ingin dapat Poin tambahan?
            </h2>
            <p className="text-sm text-gray-500">mulai selesaikan misi!</p>
          </div>
        </div>

        <Tabs defaultValue="misi" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pencapaian" className="w-full">
              Pencapaian
            </TabsTrigger>
            <TabsTrigger value="misi" className="w-full">
              Misi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pencapaian">
            <div className="grid gap-4">
              {achievements.map((achievement) => {
                const progress = achievementProgress.find(
                  (p) => p.achievement_id === achievement.id
                );
                const progressPoint = progress?.progress_point || 0;
                const isCompleted = progress?.last_completed_at !== null;
                const canClaim =
                  progressPoint >= achievement.limit && !isCompleted;

                return (
                  <Card key={achievement.id} className="p-4">
                    <div>
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <img
                            src={achievement.badge_reward || "/target.png"}
                            alt={achievement.name}
                            className="w-8 h-8"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {achievement.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        {isCompleted ? (
                          <div className="text-green-500 font-medium text-center">
                            Selesai ✨
                          </div>
                        ) : canClaim ? (
                          <div className="flex items-center gap-4 mt-2">
                            <Button
                              onClick={() =>
                                handleAchievementClaim(achievement)
                              }
                              className="bg-yellow-500 hover:bg-yellow-600 w-full"
                            >
                              Klaim Hadiah
                            </Button>
                            <div className="text-sm w-10">
                              {progressPoint} / {achievement.limit}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{
                                  width: `${(progressPoint / achievement.limit) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="text-sm mt-1">
                              {progressPoint} / {achievement.limit}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="misi">
            <div className="grid gap-4">
              {missions.map((mission) => {
                const progress = userProgress.find(
                  (p) => p.mission_id === mission.id
                );
                const progressPoint = progress?.progress_point || 0;
                const progressLevel = progress?.current_level || 0;
                const progressLimit = progress?.current_level_requirement || 0;
                const canClaim = progressPoint >= mission.level_requirement;

                return (
                  <Card key={mission.id} className="p-4">
                    <div>
                      <h3 className="text-lg font-semibold">{mission.name}</h3>
                      <p className="text-sm text-gray-500">
                        {mission.description}
                      </p>
                      <div className="mt-2">
                        <div className="text-sm">
                          Level {progressLevel || 1}
                        </div>
                        {!canClaim ? (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{
                                  width: `${(progressPoint / progressLimit) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="text-sm mt-1">
                              {progressPoint} / {progressLimit}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-4 mt-2">
                            <Button
                              onClick={() => handleClaim(mission)}
                              className="bg-yellow-500 hover:bg-yellow-600 w-full"
                            >
                              Klaim Hadiah
                            </Button>
                            <div className="text-sm w-10">
                              {progressPoint} / {progressLimit}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showModal && (currentMission || currentAchievement) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">KONSISTENSI ADALAH KUNCI</h2>
            <div className="text-center mb-4">
              {(currentMission?.badge_reward ||
                currentAchievement?.badge_reward) && (
                <div className="w-24 h-24 mx-auto mb-4">
                  <img
                    // src={
                    //   currentMission?.badge_reward ||
                    //   currentAchievement?.badge_reward
                    // }
                    alt="Badge"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <p className="mb-2">Alhamdulillah kamu mendapatkan</p>
              <div className="flex justify-center gap-4">
                <p>
                  +
                  {currentMission?.points_reward ||
                    currentAchievement?.points_reward}{" "}
                  🪙
                </p>
                <p>
                  EXP +
                  {currentMission?.xp_reward || currentAchievement?.xp_reward}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowModal(false);
                setCurrentMission(null);
                setCurrentAchievement(null);
              }}
              className="w-full"
            >
              Bagikan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
