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
      .eq("name", "Login Streak!")
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
        user_id: userId, // Changed from userId
        daily_mission_id: dailyMissionData.id, // Changed from dailyMissionId
        progress_point: 1, // Changed from progressPoint
        // Removed currentLevelRequirement field
        completed_at: null, // Changed from completedAt
        created_at: now.toISOString(), // Changed from createdAt
        updated_at: now.toISOString(), // Changed from updatedAt
      };

      if (!progressData) {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_daily_mission_progress")
          .insert(newProgressData);

        // Inside updateLoginStreakMission function
        if (insertError) {
          console.error(
            "Error creating daily mission progress:",
            insertError,
            JSON.stringify(newProgressData)
          );
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
      // Check if progress has already reached the requirement before updating
      if (progressData.progress_point < dailyMissionData.level_requirement) {
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
      // If progress already meets requirement, don't update it
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

    revalidatePath("/misi");
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

    revalidatePath("/misi");
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
    revalidatePath("/misi");
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
      .eq("name", "Dictionary Diver!")
      .single();

    if (dailyMissionError) {
      console.error(
        "Error fetching Dictionary Diver mission:",
        dailyMissionError
      );
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

    // If progress meets requirement and not already completed, DON'T mark as completed
    // Just check if the progress is sufficient - let the claim button handle completion
    if (
      updatedProgress.data &&
      updatedProgress.data.progress_point >=
        dailyMissionData.level_requirement &&
      !updatedProgress.data.completedAt
    ) {
      // Don't automatically set completed_at
      // This allows the claim button to appear and handle completion
      // The claimDailyMissionReward function will handle setting completed_at
    }

    revalidatePath("/misi");
    return true;
  } catch (error) {
    console.error("Error in updateDictionaryDiverMission:", error);
    return false;
  }
}

/**
 * Updates the Level Up mission progress based on user's current level
 * This function should be called when a user's level changes
 * It will update the mission progress to match the user's current level
 * @param userId The user's ID
 * @param skipRevalidation If true, skips calling revalidatePath (use when called during rendering)
 */
export async function updateLevelUpMission(
  userId: string,
  skipRevalidation: boolean = false
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // First, get the Level Up mission
    const { data: missionData, error: missionError } = await supabase
      .from("mission")
      .select("*")
      .eq("name", "Level Up!")
      .single();

    if (missionError) {
      console.error("Error fetching Level Up mission:", missionError);
      return false;
    }

    if (!missionData) {
      console.error("Level Up mission not found");
      return false;
    }

    // Get the user's current level
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user level:", userError);
      return false;
    }

    // Define fixed level requirements and rewards
    const levelData = [
      { level: 1, requirement: 5, xpReward: 100, pointsReward: 50 },
      { level: 2, requirement: 8, xpReward: 200, pointsReward: 100 },
      { level: 3, requirement: 12, xpReward: 300, pointsReward: 150 },
      { level: 4, requirement: 15, xpReward: 400, pointsReward: 200 },
    ];

    // Get the user's current mission progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionData.id)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error fetching mission progress:", progressError);
      return false;
    }

    // If no progress record exists, create one
    if (!progressData) {
      // Create new progress record with level 1 data
      const levelInfo = levelData[0]; // Level 1 data

      const newProgressData = {
        user_id: userId,
        mission_id: missionData.id,
        progress_point: userData.level, // Set to current user level
        current_level: 1,
        current_level_requirement: levelInfo.requirement,
        current_xp_reward: levelInfo.xpReward,
        current_points_reward: levelInfo.pointsReward,
        last_completed_at: null,
      };

      const { error: insertError } = await supabase
        .from("user_mission_progress")
        .insert(newProgressData);

      if (insertError) {
        console.error("Error creating mission progress:", insertError);
        return false;
      }
    } else {
      // Update progress_point to match user's current level
      const { error: updateError } = await supabase
        .from("user_mission_progress")
        .update({
          progress_point: userData.level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progressData.id);

      if (updateError) {
        console.error("Error updating mission progress:", updateError);
        return false;
      }

      // Check if the mission level should be completed based on progress
      if (
        userData.level >= progressData.current_level_requirement &&
        (!progressData.last_completed_at ||
          new Date(progressData.last_completed_at).getTime() <
            Date.now() - 86400000) // Only complete once per day
      ) {
        // Find the next level data
        const currentLevelIndex = levelData.findIndex(
          (data) => data.level === progressData.current_level
        );

        // If we found the current level and there's a next level available
        if (
          currentLevelIndex >= 0 &&
          currentLevelIndex < levelData.length - 1
        ) {
          const nextLevelInfo = levelData[currentLevelIndex + 1];

          // Update mission progress with new level and requirements
          const { error: completeError } = await supabase
            .from("user_mission_progress")
            .update({
              current_level: nextLevelInfo.level,
              current_level_requirement: nextLevelInfo.requirement,
              current_xp_reward: nextLevelInfo.xpReward,
              current_points_reward: nextLevelInfo.pointsReward,
              last_completed_at: new Date().toISOString(),
            })
            .eq("id", progressData.id);

          if (completeError) {
            console.error("Error completing mission level:", completeError);
            return false;
          }

          // Award the user with XP and points
          const { error: rewardError } = await supabase
            .from("users")
            .update({
              xp: (userData.xp || 0) + progressData.current_xp_reward,
              points:
                (userData.points || 0) + progressData.current_points_reward,
            })
            .eq("id", userId);

          if (rewardError) {
            console.error("Error awarding mission rewards:", rewardError);
            return false;
          }
        }
      }
    }

    // Only call revalidatePath if skipRevalidation is false
    if (!skipRevalidation) {
      revalidatePath("/misi");
    }
    return true;
  } catch (error) {
    console.error("Error in updateLevelUpMission:", error);
    return false;
  }
}

/**
 * Updates the Sign Master mission progress when a user earns all three badges
 * This function should be called when a user's badges are updated
 * It will check if the user has all three badges and update the mission progress accordingly
 */
export async function updateSignMasterMission(
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // First, get the Sign Master mission
    const { data: missionData, error: missionError } = await supabase
      .from("mission")
      .select("*")
      .eq("name", "Sign Master")
      .single();

    if (missionError) {
      console.error("Error fetching Sign Master mission:", missionError);
      return false;
    }

    if (!missionData) {
      console.error("Sign Master mission not found");
      return false;
    }

    // Get the user's current badges status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("badges1, badges2, badges3, badges4")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user badges:", userError);
      return false;
    }

    // Check if user has all three badges
    const hasAllBadges =
      userData.badges1 &&
      userData.badges2 &&
      userData.badges3 &&
      userData.badges4;

    // Count how many badges the user has
    const badgeCount = [
      userData.badges1,
      userData.badges2,
      userData.badges3,
      userData.badges4,
    ].filter(Boolean).length;

    console.log("Badge count for user:", userId, badgeCount);
    // Get the user's current mission progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionData.id)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error fetching mission progress:", progressError);
      return false;
    }

    // If no progress record exists, create one
    if (!progressData) {
      // Create new progress record
      const newProgressData = {
        user_id: userId,
        mission_id: missionData.id,
        progress_point: badgeCount, // Set to 1 if user has all badges, 0 otherwise
        current_level: 1,
        // current_level_requirement: missionData.level_requirement,
        // current_xp_reward: missionData.xp_reward,
        // current_points_reward: missionData.points_reward,
        last_completed_at: null,
      };

      const { error: insertError } = await supabase
        .from("user_mission_progress")
        .insert(newProgressData);

      if (insertError) {
        console.error("Error creating mission progress:", insertError);
        return false;
      }
    } else {
      // Update the progress_point based on badge status
      // Only set to 1 if user has all badges and progress is currently 0
      if (hasAllBadges && progressData.progress_point === 0) {
        const { error: updateError } = await supabase
          .from("user_mission_progress")
          .update({
            progress_point: 4,
            updated_at: new Date().toISOString(),
          })
          .eq("id", progressData.id);

        if (updateError) {
          console.error("Error updating mission progress:", updateError);
          return false;
        }
      }

      // Check if the mission should be completed
      if (
        badgeCount > 0 &&
        progressData.progress_point < progressData.current_level_requirement
        // Removed the daily check: (!progressData.last_completed_at || new Date(progressData.last_completed_at).getTime() < Date.now() - 86400000)
      ) {
        // Calculate new level requirements and rewards based on next level
        const nextLevel = progressData.current_level + 1;
        const levelMultiplier = 1 + (nextLevel - 1) * 1.5; // 50% increase per level

        // Calculate new requirement with 1.5 multiplier and round to nearest integer
        const newRequirement = Math.round(
          missionData.level_requirement * levelMultiplier
        );

        // Update mission progress with new level and requirements
        const { error: completeError } = await supabase
          .from("user_mission_progress")
          .update({
            // current_level: nextLevel,
            // current_level_requirement: newRequirement,
            // current_xp_reward: Math.floor(
            //   missionData.xp_reward * levelMultiplier
            // ),
            // current_points_reward: Math.floor(
            //   missionData.points_reward * levelMultiplier
            // ),
            last_completed_at: new Date().toISOString(), // Still record completion time for reference
            progress_point: badgeCount, // Use badge count instead of 1
          })
          .eq("id", progressData.id);

        if (completeError) {
          console.error("Error completing mission level:", completeError);
          return false;
        }

        // Award the user with XP and points
        const { data: currentUserData, error: currentUserError } =
          await supabase
            .from("users")
            .select("xp, points")
            .eq("id", userId)
            .single();

        if (currentUserError) {
          console.error("Error fetching current user data:", currentUserError);
          return false;
        }

        const { error: rewardError } = await supabase
          .from("users")
          .update({
            xp: (currentUserData.xp || 0) + progressData.current_xp_reward,
            points:
              (currentUserData.points || 0) +
              progressData.current_points_reward,
          })
          .eq("id", userId);

        if (rewardError) {
          console.error("Error awarding mission rewards:", rewardError);
          return false;
        }
      }
    }

    revalidatePath("/misi");
    return true;
  } catch (error) {
    console.error("Error in updateSignMasterMission:", error);
    return false;
  }
}

/**
 * Updates the Word Warrior mission progress based on completed dictionary entries
 * This function should be called when a user completes a dictionary entry
 * It will count the number of completed entries and update the mission progress accordingly
 * @param userId The user ID to update mission progress for
 * @param skipRevalidation Set to true when calling during page rendering to avoid revalidatePath error
 */
export async function updateWordWarriorMission(
  userId: string,
  skipRevalidation = false
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // First, get the Word Warrior mission
    const { data: missionData, error: missionError } = await supabase
      .from("mission")
      .select("*")
      .eq("name", "Word Warrior")
      .single();

    if (missionError) {
      console.error("Error fetching Word Warrior mission:", missionError);
      return false;
    }

    if (!missionData) {
      console.error("Word Warrior mission not found");
      return false;
    }

    // Count the number of completed dictionary entries for this user
    const { count: completedEntriesCount, error: countError } = await supabase
      .from("user_dictionary_progress")
      .select("*", { count: "exact", head: false })
      .eq("user_id", userId)
      .gte("progress_point", 5); // Consider entries with progress_point >= 5 as completed

    if (countError) {
      console.error("Error counting completed dictionary entries:", countError);
      return false;
    }

    const entryCount = completedEntriesCount ?? 0;

    // Get the user's current mission progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", missionData.id)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error fetching mission progress:", progressError);
      return false;
    }

    // If no progress record exists, create one
    if (!progressData) {
      // Create new progress record
      const newProgressData = {
        user_id: userId,
        mission_id: missionData.id,
        progress_point: entryCount, // Set to current count of completed entries
        current_level: 1,
        current_level_requirement: missionData.level_requirement,
        current_xp_reward: missionData.xp_reward,
        current_points_reward: missionData.points_reward,
        last_completed_at: null,
      };

      const { error: insertError } = await supabase
        .from("user_mission_progress")
        .insert(newProgressData);

      if (insertError) {
        console.error("Error creating mission progress:", insertError);
        return false;
      }
    } else {
      // Update the progress_point based on the count of completed entries
      // Only update if the count has changed
      if (progressData.progress_point !== completedEntriesCount) {
        const { error: updateError } = await supabase
          .from("user_mission_progress")
          .update({
            progress_point: completedEntriesCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", progressData.id);

        if (updateError) {
          console.error("Error updating mission progress:", updateError);
          return false;
        }
      }

      // Check if the mission should be completed based on progress
      if (entryCount >= progressData.current_level_requirement) {
        // Calculate new level requirements and rewards based on next level
        const nextLevel = progressData.current_level + 1;
        const levelMultiplier = 1 + (nextLevel - 1) * 1.5; // 50% increase per level

        // Calculate new requirement with 1.5 multiplier and round to nearest integer
        const newRequirement = Math.round(
          missionData.level_requirement * levelMultiplier
        );

        // Update mission progress with new level and requirements
        const { error: completeError } = await supabase
          .from("user_mission_progress")
          .update({
            current_level: nextLevel,
            current_level_requirement: newRequirement,
            current_xp_reward: Math.floor(
              missionData.xp_reward * levelMultiplier
            ),
            current_points_reward: Math.floor(
              missionData.points_reward * levelMultiplier
            ),
            last_completed_at: new Date().toISOString(),
            // Don't reset progress_point here
          })
          .eq("id", progressData.id);

        if (completeError) {
          console.error("Error completing mission level:", completeError);
          return false;
        }

        // Award the user with XP and points
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("xp, points")
          .eq("id", userId)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          return false;
        }

        const { error: rewardError } = await supabase
          .from("users")
          .update({
            xp: (userData.xp || 0) + progressData.current_xp_reward,
            points: (userData.points || 0) + progressData.current_points_reward,
          })
          .eq("id", userId);

        if (rewardError) {
          console.error("Error awarding mission rewards:", rewardError);
          return false;
        }
      }
    }

    // Only call revalidatePath if skipRevalidation is false
    if (!skipRevalidation) {
      revalidatePath("/misi");
    }

    return true;
  } catch (error) {
    console.error("Error in updateWordWarriorMission:", error);
    return false;
  }
}
