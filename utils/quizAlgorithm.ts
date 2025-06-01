import { createClient } from "@/utils/supabase/client";
import { QuizType } from "@/utils/supabase/schema";

export interface QuizQuestion {
  id: string;
  level_id: string;
  type: string;
  question_text: string;
  video_url?: string;
  dictionary_id?: string;
  order: number;
  // Fields for multiple choice questions
  correct_answer?: string;
  options?: string[] | { options: string[] };
  // Fields for gesture to text questions
  gesture_video_url?: string;
  // Fields for memory match questions
  correct_answer_pairs?: Array<{ text: string; videoUrl: string }>;
  memory_options?: Array<{ text: string; videoUrl: string }>;
  grid_size?: number;
  // User progress
  user_quiz_progress?: {
    is_completed: boolean;
    user_id: string;
  }[];
}

/**
 * Fetches quiz questions for a specific level
 * @param levelOrder - The ID of the level to fetch questions for
 * @param userId - The ID of the current user
 * @param includeCompleted - Whether to include completed questions (default: false)
 * @returns Array of quiz questions ordered by the 'order' field
 */
export async function fetchQuizQuestions(
  levelOrder: string,
  userId: string,
  includeCompleted: boolean = false
): Promise<QuizQuestion[]> {
  const supabase = createClient();

  try {
    // First, get the level ID from the order
    const { data: levelData, error: levelError } = await supabase
      .from("quiz_level")
      .select("id")
      .eq('"order"', levelOrder)
      .single();

    if (levelError || !levelData) {
      console.error("Error fetching level:", levelError);
      return [];
    }

    const levelId = levelData.id;

    // Then get all questions for this level
    const { data: questionsData, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("level_id", levelId)
      .order('"order"');

    if (questionsError) {
      console.error("Error fetching quiz questions:", questionsError);
      return [];
    }

    if (!questionsData || questionsData.length === 0) {
      return [];
    }

    // Get user progress for these questions
    const { data: userProgress, error: progressError } = await supabase
      .from("user_quiz_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("level_id", levelId);

    if (progressError) {
      console.error("Error fetching user progress:", progressError);
    }

    // Process each question based on its type
    const processedQuestions = await Promise.all(
      questionsData.map(async (question) => {
        const baseQuestion: QuizQuestion = {
          id: question.id,
          level_id: question.level_id,
          type: question.type,
          question_text: question.question_text,
          video_url: question.video_url,
          dictionary_id: question.dictionary_id,
          order: question.order,
          user_quiz_progress: userProgress
            ?.filter((p) => p.question_id === question.id)
            .map((p) => ({
              is_completed: p.is_completed,
              user_id: p.user_id,
            })),
        };

        // Add type-specific data
        switch (question.type) {
          case QuizType.MULTIPLE_CHOICE:
            const { data: mcData, error: mcError } = await supabase
              .from("multiple_choice_questions")
              .select("*")
              .eq("question_id", question.id)
              .single();

            if (mcError) {
              console.error("Error fetching multiple choice data:", mcError);
              return baseQuestion;
            }

            return {
              ...baseQuestion,
              correct_answer: mcData?.correct_answer,
              options: mcData?.options || [],
            };

          case QuizType.GESTURE_TO_TEXT:
            const { data: gtData, error: gtError } = await supabase
              .from("gesture_to_text_questions")
              .select("*")
              .eq("question_id", question.id)
              .single();

            if (gtError) {
              console.error("Error fetching gesture to text data:", gtError);
              return baseQuestion;
            }

            return {
              ...baseQuestion,
              correct_answer: gtData?.correct_answer,
              gesture_video_url: gtData?.gesture_video_url,
              options: {
                options: gtData?.correct_answer
                  ? [gtData.correct_answer, "Option 2", "Option 3", "Option 4"]
                  : [],
              },
            };

          case QuizType.MEMORY_MATCH:
            const { data: mmData, error: mmError } = await supabase
              .from("memory_match_questions")
              .select("*")
              .eq("question_id", question.id)
              .single();

            if (mmError) {
              console.error("Error fetching memory match data:", mmError);
              return baseQuestion;
            }

            return {
              ...baseQuestion,
              correct_answer_pairs: mmData?.correct_answer || [],
              memory_options: mmData?.options || [],
              grid_size: mmData?.grid_size || 4,
            };
        }

        return baseQuestion;
      })
    );

    // Always return all questions, sorted by order
    // We'll handle filtering in the UI
    return processedQuestions.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error in fetchQuizQuestions:", error);
    return [];
  }
}

/**
 * Updates user progress for a quiz question
 * @param userId - The ID of the user
 * @param questionId - The ID of the question
 * @param levelId - The ID of the level
 * @param isCorrect - Whether the user answered correctly
 * @returns Boolean indicating success
 */
export async function updateQuizProgress(
  userId: string,
  questionId: string,
  levelId: string,
  isCorrect: boolean
): Promise<boolean> {
  const supabase = createClient();

  try {
    // If the answer is correct, update the login streak
    if (isCorrect) {
      const { data: existingProgress } = await supabase
        .from("user_quiz_progress")
        .select("is_completed")
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .single();

      // Only update login streak if this is the first completion of the question
      if (!existingProgress?.is_completed) {
        const { data: loginStreakData, error: streakError } = await supabase
          .from("login_streaks")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (streakError && streakError.code !== "PGRST116") {
          console.error("Error fetching login streak:", streakError);
          return false;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const lastLoginDate = loginStreakData?.last_login_date
          ? new Date(loginStreakData.last_login_date)
          : null;
        lastLoginDate?.setHours(0, 0, 0, 0);

        // Update streak logic
        if (lastLoginDate) {
          const daysSinceLastLogin = Math.floor(
            (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Only update if it's a different day (not the same day)
          if (daysSinceLastLogin >= 1) {
            let newStreak = 1; // Default to 1 for resets

            // If exactly 1 day has passed, increment the streak
            if (daysSinceLastLogin === 1) {
              newStreak = (loginStreakData?.current_streak || 0) + 1;
            }
            // If more than 1 day has passed, reset streak to 1
            // (newStreak is already set to 1)

            // Update or create login streak
            if (loginStreakData) {
              console.log("Updating login streak");
              const { error: updateError } = await supabase
                .from("login_streaks")
                .update({
                  current_streak: newStreak,
                  last_login_date: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", loginStreakData.user_id)
                .eq("id", loginStreakData.id);

              if (updateError) {
                console.error("Error updating login streak:", updateError);
                return false;
              } else {
                console.log(
                  "Login streak updated successfully for user:",
                  userId
                );
              }
            } else {
              console.log("Inserting new login streak");
              const { error: insertError } = await supabase
                .from("login_streaks")
                .insert({
                  id: crypto.randomUUID(),
                  user_id: userId,
                  current_streak: newStreak,
                  last_login_date: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (insertError) {
                console.error("Error inserting login streak:", insertError);
                return false;
              }
            }
          }
        } else {
          // No previous login, create new streak record
          console.log("Inserting new login streak");
          const { error: insertError } = await supabase
            .from("login_streaks")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              current_streak: 1,
              last_login_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error("Error inserting login streak:", insertError);
            return false;
          }
        }
      }
    }

    // First, find the existing progress record
    const { data: existingProgress } = await supabase
      .from("user_quiz_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (existingProgress) {
      // Update the existing record
      const { error: updateError } = await supabase
        .from("user_quiz_progress")
        .update({ is_completed: isCorrect })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating progress:", updateError);
        return false;
      }
    } else {
      // Create a new progress record
      const { error: insertError } = await supabase
        .from("user_quiz_progress")
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          question_id: questionId,
          level_id: levelId,
          is_completed: isCorrect,
        });

      if (insertError) {
        console.error("Error creating progress:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error in updateQuizProgress:", error);
    return false;
  }
}

/**
 * Gets the total number of questions and completed questions for a level
 * @param levelId - The ID of the level
 * @param userId - The ID of the user
 * @returns Object with total and completed counts
 */
export async function getQuizProgress(
  levelOrder: string,
  userId: string
): Promise<{ total: number; completed: number }> {
  const supabase = createClient();

  try {
    const { data: levelData, error: levelError } = await supabase
      .from("quiz_level")
      .select("id")
      .eq('"order"', levelOrder)
      .single();

    if (levelError || !levelData) {
      console.error("Error fetching level:", levelError);
      return { total: 0, completed: 0 };
    }

    const levelId = levelData.id;

    // Get total questions in level
    const { data: allQuestions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("level_id", levelId);

    if (questionsError) {
      console.error("Error fetching questions progres:", questionsError);
      return { total: 0, completed: 0 };
    }

    // Get completed questions
    const { data: completedQuestions, error: progressError } = await supabase
      .from("user_quiz_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("level_id", levelId)
      .eq("is_completed", true);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return { total: 0, completed: 0 };
    }

    return {
      total: allQuestions?.length || 0,
      completed: completedQuestions?.length || 0,
    };
  } catch (error) {
    console.error("Error in getQuizProgress:", error);
    return { total: 0, completed: 0 };
  }
}

// Add logic to update badges based on level completion
export async function updateBadgesOnLevelCompletion(
  userId: string,
  levelId: string
): Promise<void> {
  const supabase = createClient();

  try {
    // Fetch all questions for the level
    const { data: questionsData, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("level_id", levelId);

    if (questionsError || !questionsData) {
      console.error("Error fetching questions badge:", questionsError);
      return;
    }

    // Fetch user progress for these questions
    const { data: userProgress, error: progressError } = await supabase
      .from("user_quiz_progress")
      .select("is_completed")
      .eq("user_id", userId)
      .eq("level_id", levelId);

    if (progressError || !userProgress) {
      console.error("Error fetching user progress:", progressError);
      return;
    }

    // Check if all questions are completed
    const allCompleted = userProgress.every(
      (progress) => progress.is_completed
    );

    if (allCompleted) {
      // Determine which badge to update based on level
      let badgeField = "";
      const { data: levelData, error: levelError } = await supabase
        .from("quiz_level")
        .select("name")
        .eq("id", levelId)
        .single();

      if (levelError || !levelData) {
        console.error("Error fetching level name:", levelError);
        return;
      }

      const levelName = levelData.name;

      switch (levelName) {
        case "Huruf":
          badgeField = "badges1";
          break;
        case "Kata":
          badgeField = "badges2";
          break;
        case "Kalimat":
          badgeField = "badges3";
          break;
        default:
          console.error("Unknown levelName:", levelName);
          return;
      }

      // Update the badge
      const { error: updateError } = await supabase
        .from("users")
        .update({ [badgeField]: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating badge:", updateError);
      }
    }
  } catch (error) {
    console.error("Error in updateBadgesOnLevelCompletion:", error);
  }
}
