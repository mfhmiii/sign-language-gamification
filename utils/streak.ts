import { createClient } from "@/utils/supabase/client";

interface StreakData {
  currentStreak: number;
  longestQuizStreak: number;
  lastQuestionId: string | null;
}

export async function updateQuizStreak(
  userId: string,
  levelId: string,
  questionId: string,
  isCorrect: boolean
): Promise<StreakData | null> {
  const supabase = createClient();

  try {
    // Get current level streak data
    const { data: streakData, error: streakError } = await supabase
      .from("level_streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("level_id", levelId)
      .single();

    // Get user's longest streak
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("longest_quiz_streak")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    let currentStreak = 0;
    let longestQuizStreak = userData?.longest_quiz_streak || 0;

    if (isCorrect) {
      if (!streakData) {
        // First correct answer in this level
        currentStreak = 1;
      } else {
        // Increment streak for correct answers
        currentStreak = streakData.current_streak + 1;
      }

      // Update longest streak if current streak is higher
      longestQuizStreak = Math.max(currentStreak, longestQuizStreak);

      // Upsert level streak with generated UUID if it doesn't exist
      const { error: upsertError } = await supabase
        .from("level_streaks")
        .upsert({
          id: streakData?.id || crypto.randomUUID(),
          user_id: userId,
          level_id: levelId,
          current_streak: currentStreak,
          last_question_id: questionId,
        });

      if (upsertError) throw upsertError;

      // Update user's longest streak if needed
      if (currentStreak > userData.longest_quiz_streak) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ longest_quiz_streak: longestQuizStreak })
          .eq("id", userId);

        if (updateError) throw updateError;
      }
    } else {
      // Reset streak for wrong answers
      const { error: resetError } = await supabase
        .from("level_streaks")
        .upsert({
          id: streakData?.id || crypto.randomUUID(),
          user_id: userId,
          level_id: levelId,
          current_streak: 0,
          last_question_id: questionId,
        });

      if (resetError) throw resetError;
    }

    return {
      currentStreak: isCorrect ? currentStreak : 0,
      longestQuizStreak,
      lastQuestionId: questionId,
    };
  } catch (error) {
    console.error("Error updating quiz streak:", error);
    return null;
  }
}

export async function checkLevelStreak(
  userId: string,
  levelId: string
): Promise<StreakData | null> {
  const supabase = createClient();

  try {
    // Get level streak data
    const { data: streakData, error: streakError } = await supabase
      .from("level_streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("level_id", levelId)
      .single();

    if (streakError && streakError.code !== "PGRST116") throw streakError; // Ignore not found error

    // Get user's longest streak
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("longest_quiz_streak")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    return {
      currentStreak: streakData?.current_streak || 0,
      longestQuizStreak: userData.longest_quiz_streak,
      lastQuestionId: streakData?.last_question_id || null,
    };
  } catch (error) {
    console.error("Error checking streak:", error);
    return null;
  }
}
