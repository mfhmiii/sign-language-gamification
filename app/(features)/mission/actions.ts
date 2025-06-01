"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates the login streak daily mission progress
 * This function should be called when a user logs in
 * It will check if the user has already completed the mission today
 * If not, it will increment the progress_point and mark as completed if threshold reached
 */
export async function updateLoginStreakMission(
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for comparison

  try {
    // First, get the login streak daily mission
    const { data: dailyMissionData, error: dailyMissionError } = await supabase
      .from("daily_mission")
      .select("*")
      .eq("name", "Login Streak")
      .single();

    if (dailyMissionError) {
      console.error("Error fetching login streak mission:", dailyMissionError);
      return false;
    }

    if (!dailyMissionData) {
      console.error("Login streak mission not found");
      return false;
    }

    // Get the user's current daily mission progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("daily_mission_id", dailyMissionData.id)
      .single();

    // Check if we need to create a new progress record or reset an existing one
    const needsReset = progressData?.completedAt
      ? new Date(progressData.completedAt).getDate() !== now.getDate()
      : false;

    // If no progress record exists or it needs to be reset for a new day
    if (!progressData || needsReset) {
      // Create or reset the progress record
      const newProgressData = {
        userId,
        dailyMissionId: dailyMissionData.id,
        progressPoint: 1, // Start with 1 for today's login
        // Removed currentLevelRequirement field
        completedAt: null, // Not completed yet
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      if (!progressData) {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_daily_mission_progress")
          .insert(newProgressData);

        if (insertError) {
          console.error("Error creating daily mission progress:", insertError);
          return false;
        }
      } else {
        // Reset existing record
        const { error: updateError } = await supabase
          .from("user_daily_mission_progress")
          .update({
            progressPoint: 1, // Reset to 1 for today's login
            completedAt: null,
            updatedAt: now.toISOString(),
          })
          .eq("id", progressData.id);

        if (updateError) {
          console.error("Error resetting daily mission progress:", updateError);
          return false;
        }
      }
    } else {
      // Update existing progress by incrementing progress_point
      const { error: updateError } = await supabase
        .from("user_daily_mission_progress")
        .update({
          progressPoint: (progressData.progressPoint || 0) + 1, // Increment by 1
          updatedAt: now.toISOString(),
        })
        .eq("id", progressData.id);

      if (updateError) {
        console.error("Error updating daily mission progress:", updateError);
        return false;
      }
    }

    // Check if mission is completed based on progress
    const updatedProgress = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("daily_mission_id", dailyMissionData.id)
      .single();

    if (updatedProgress.error) {
      console.error("Error fetching updated progress:", updatedProgress.error);
      return false;
    }

    // If progress meets requirement and not already completed, mark as completed
    if (
      updatedProgress.data &&
      updatedProgress.data.progressPoint >= dailyMissionData.levelRequirement && // Use levelRequirement from dailyMissionData
      !updatedProgress.data.completedAt
    ) {
      const { error: completeError } = await supabase
        .from("user_daily_mission_progress")
        .update({
          completedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .eq("id", updatedProgress.data.id);

      if (completeError) {
        console.error("Error marking mission as completed:", completeError);
        return false;
      }
    }

    revalidatePath("/mission");
    return true;
  } catch (error) {
    console.error("Error in updateLoginStreakMission:", error);
    return false;
  }
}

/**
 * Claims the reward for a completed daily mission
 * This should be called when a user clicks the claim button
 */
export async function claimDailyMissionReward(
  userId: string,
  missionId: string
): Promise<{
  success: boolean;
  scaledPoints?: number;
  scaledXP?: number;
}> {
  const supabase = await createClient();

  try {
    // Get the mission data
    const { data: dailyMissionData, error: dailyMissionError } = await supabase
      .from("daily_mission")
      .select("*")
      .eq("id", missionId)
      .single();

    if (dailyMissionError) {
      console.error("Error fetching mission:", dailyMissionError);
      return { success: false };
    }

    // Get the user's progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("daily_mission_id", missionId)
      .single();

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return { success: false };
    }

    // Check if mission is completed but not claimed
    if (!progressData.completedAt) {
      return { success: false };
    }

    // Get current user stats
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points, xp")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user stats:", userError);
      return { success: false };
    }

    // Update user stats with rewards
    const { error: updateError } = await supabase
      .from("users")
      .update({
        points: (userData.points || 0) + dailyMissionData.pointsReward,
        xp: (userData.xp || 0) + dailyMissionData.xpReward,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user stats:", updateError);
      return { success: false };
    }

    revalidatePath("/mission");
    return {
      success: true,
      scaledPoints: dailyMissionData.pointsReward,
      scaledXP: dailyMissionData.xpReward,
    };
  } catch (error) {
    console.error("Error in claimDailyMissionReward:", error);
    return { success: false };
  }
}

/**
 * Resets all daily mission progress at midnight
 * This function should be called by a scheduled job at midnight
 * It will reset the progress_point to 0 for all daily missions
 */
export async function resetDailyMissionProgress(): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day

  try {
    // Get all daily missions
    const { data: dailyMissions, error: missionsError } = await supabase
      .from("daily_mission")
      .select("id");

    if (missionsError) {
      console.error("Error fetching daily missions:", missionsError);
      return false;
    }

    if (!dailyMissions || dailyMissions.length === 0) {
      console.log("No daily missions found");
      return true; // No missions to reset
    }

    // Reset progress for all daily missions
    const { error: resetError } = await supabase
      .from("user_daily_mission_progress")
      .update({
        progress_point: 0,
        completed_at: null,
        updated_at: now.toISOString(),
      })
      .in(
        "daily_mission_id",
        dailyMissions.map((mission) => mission.id)
      );

    if (resetError) {
      console.error("Error resetting daily mission progress:", resetError);
      return false;
    }

    console.log("Successfully reset all daily mission progress");
    revalidatePath("/mission");
    return true;
  } catch (error) {
    console.error("Error in resetDailyMissionProgress:", error);
    return false;
  }
}

/**
 * Updates the Dictionary Diver daily mission progress
 * This function should be called when a user performs a sign language gesture in the dictionary
 * It will check if the user has already completed the mission today
 * If not, it will increment the progress_point and mark as completed if threshold reached
 */
export async function updateDictionaryDiverMission(
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for comparison

  try {
    // First, get the Dictionary Diver daily mission
    const { data: dailyMissionData, error: dailyMissionError } = await supabase
      .from("daily_mission")
      .select("*")
      .eq("name", "Dictionary Diver")
      .single();

    if (dailyMissionError) {
      console.error("Error fetching Dictionary Diver mission:", dailyMissionError);
      return false;
    }

    if (!dailyMissionData) {
      console.error("Dictionary Diver mission not found");
      return false;
    }

    // Get the user's current daily mission progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("daily_mission_id", dailyMissionData.id)
      .single();

    // Check if we need to create a new progress record or reset an existing one
    const needsReset = progressData?.completed_at
      ? new Date(progressData.completed_at).getDate() !== now.getDate()
      : false;

    // If no progress record exists or it needs to be reset for a new day
    if (!progressData || needsReset) {
      // Create or reset the progress record
      const newProgressData = {
        user_id: userId,
        daily_mission_id: dailyMissionData.id,
        progress_point: 1, // Start with 1 for today's dictionary activity
        // Removed current_level_requirement field
        completed_at: null, // Not completed yet
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      if (!progressData) {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_daily_mission_progress")
          .insert(newProgressData);

        if (insertError) {
          console.error("Error creating daily mission progress:", insertError);
          return false;
        }
      } else {
        // Reset existing record
        const { error: updateError } = await supabase
          .from("user_daily_mission_progress")
          .update({
            progress_point: 1, // Reset to 1 for today's dictionary activity
            completed_at: null,
            updated_at: now.toISOString(),
          })
          .eq("id", progressData.id);

        if (updateError) {
          console.error("Error resetting daily mission progress:", updateError);
          return false;
        }
      }
    } else {
      // Update existing progress by incrementing progress_point
      const { error: updateError } = await supabase
        .from("user_daily_mission_progress")
        .update({
          progress_point: (progressData.progress_point || 0) + 1, // Increment by 1
          updated_at: now.toISOString(),
        })
        .eq("id", progressData.id);

      if (updateError) {
        console.error("Error updating daily mission progress:", updateError);
        return false;
      }
    }

    // Check if mission is completed based on progress
    const updatedProgress = await supabase
      .from("user_daily_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("daily_mission_id", dailyMissionData.id)
      .single();

    if (updatedProgress.error) {
      console.error("Error fetching updated progress:", updatedProgress.error);
      return false;
    }

    // If progress meets requirement and not already completed, mark as completed
    if (
      updatedProgress.data &&
      updatedProgress.data.progress_point >= dailyMissionData.level_requirement && // Use level_requirement from dailyMissionData
      !updatedProgress.data.completed_at
    ) {
      const { error: completeError } = await supabase
        .from("user_daily_mission_progress")
        .update({
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", updatedProgress.data.id);

      if (completeError) {
        console.error("Error marking mission as completed:", completeError);
        return false;
      }
    }

    revalidatePath("/mission");
    return true;
  } catch (error) {
    console.error("Error in updateDictionaryDiverMission:", error);
    return false;
  }
}
