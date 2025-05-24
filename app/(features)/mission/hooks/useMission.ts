import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

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

type DailyMission = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  level_requirement: number;
  xp_reward: number;
  points_reward: number;
  reset_time?: string;
};

type MissionProgress = {
  id: string;
  userId: string;
  mission_id: string;
  progress_point: number;
  current_level: number;
  current_level_requirement: number;
  last_completed_at: string | null;
  is_completed: boolean;
};

type DailyMissionProgress = {
  id: string;
  userId: string;
  daily_mission_id: string;
  mission_id: string;
  progress_point: number;
  current_level: number;
  current_level_requirement: number;
  last_completed_at: string | null;
  is_completed: boolean;
};

export const useMission = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [userProgress, setUserProgress] = useState<(MissionProgress | DailyMissionProgress)[]>([]);
  const [userStreak, setUserStreak] = useState(0);
  const supabase = createClient();

  const fetchMissions = async () => {
    // Fetch regular missions from mission table
    const { data: missionsData, error } = await supabase
      .from("mission")
      .select("*");

    if (error) {
      console.error("Error fetching missions:", error);
      return;
    }

    setMissions(missionsData);

    // Fetch daily missions from daily_mission table
    const { data: dailyMissionsData, error: dailyError } = await supabase
      .from("daily_mission")
      .select("*");

    if (dailyError) {
      console.error("Error fetching daily missions:", dailyError);
      return;
    }

    setDailyMissions(dailyMissionsData);
  };

  const fetchUserProgress = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch regular mission progress
    const { data: progressData, error } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user progress:", error);
      return;
    }

    // Fetch daily mission progress
    const { data: dailyProgressData, error: dailyError } = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", user.id);

    if (dailyError) {
      console.error("Error fetching daily mission progress:", dailyError);
      return;
    }

    // Combine regular and daily mission progress
    const combinedProgress = [
      ...(progressData || []),
      ...(dailyProgressData || []),
    ];
    setUserProgress(combinedProgress);

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
          .update({ progressPoint: userData.longest_quiz_streak })
          .eq("id", streakMissionProgress.id);
      }
    }
  };

  const handleClaim = async (mission: Mission | DailyMission) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check if it's a daily mission by checking for reset_time property
    const isDailyMission = 'reset_time' in mission;
    const progress = isDailyMission 
      ? userProgress.find((p) => 'daily_mission_id' in p && p.daily_mission_id === mission.id)
      : userProgress.find((p) => !('daily_mission_id' in p) && p.mission_id === mission.id);

    if (!progress) return null;

    // For daily missions, we only need to check if it's completed
    if (isDailyMission) {
      const dailyProgress = progress as DailyMissionProgress;
      if (dailyProgress.is_completed) return null;

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
          points: (currentStats?.points || 0) + mission.points_reward,
          xp: (currentStats?.xp || 0) + mission.xp_reward,
        })
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("Error updating user stats:", userUpdateError);
        return;
      }

      // Mark daily mission as completed
      const { error: progressUpdateError } = await supabase
        .from("user_daily_mission_progress")
        .update({
          is_completed: true,
          last_completed_at: new Date().toISOString(),
        })
        .eq("id", dailyProgress.id);

      if (progressUpdateError) {
        console.error("Error updating daily mission progress:", progressUpdateError);
        return;
      }

      await fetchUserProgress();
      return { 
        mission, 
        scaledPoints: mission.points_reward, 
        scaledXP: mission.xp_reward 
      };
    }

    // Handle regular missions
    const regularProgress = progress as MissionProgress;
    if (regularProgress.progress_point >= mission.level_requirement) {
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
            Math.floor(mission.level_requirement * levelMultiplier),
          last_completed_at: new Date().toISOString(),
        })
        .eq("id", progress.id);

      if (progressUpdateError) {
        console.error("Error updating mission progress:", progressUpdateError);
        return;
      }

      await fetchUserProgress(); // Refresh progress
      return { mission, scaledPoints, scaledXP };
    }
    return null;
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

    return () => {
      supabase.channel("streak-changes").unsubscribe();
    };
  };

  useEffect(() => {
    fetchMissions();
    fetchUserProgress();
    setupStreakSubscription();
  }, []);

  return {
    missions,
    dailyMissions,
    userProgress,
    userStreak,
    handleClaim,
    fetchUserProgress,
  };
};
