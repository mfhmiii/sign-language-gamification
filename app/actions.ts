"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (authError || !authData.user) {
    console.error("Auth Error:", authError);
    return encodedRedirect(
      "error",
      "/sign-up",
      authError?.message || "Signup failed"
    );
  }

  const userId = authData.user.id;

  // Insert user data
  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    username,
    email,
    xp: 0,
    points: 0,
    badges1: false,
    badges2: false,
    badges3: false,
  });

  if (userError) {
    console.error("User creation error:", userError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to create user profile"
    );
  }

  // Fetch all quiz questions
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, level_id");

  if (questionsError) {
    console.error("Questions fetch error:", questionsError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to setup user progress"
    );
  }

  // Create and insert progress records if there are questions
  if (questions && questions.length > 0) {
    const progressRecords = questions.map((question) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      level_id: question.level_id,
      question_id: question.id,
      is_completed: false,
    }));

    const { error: progressError } = await supabase
      .from("user_quiz_progress")
      .insert(progressRecords);

    if (progressError) {
      console.error("Progress creation error:", progressError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to setup user progress"
      );
    }
  }

  // Fetch all missions
  const { data: missions, error: missionsError } = await supabase
    .from("mission")
    .select("*");

  if (missionsError) {
    console.error("Missions fetch error:", missionsError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to setup mission progress"
    );
  }

  // Create and insert mission progress records if there are missions
  if (missions && missions.length > 0) {
    const missionProgressRecords = missions.map((mission) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      mission_id: mission.id,
      progress_point: 0,
      current_level: 1,
      current_level_requirement: mission.level_requirement,
      current_xp_reward: mission.xp_reward,
      current_points_reward: mission.points_reward,
      last_completed_at: null,
    }));

    const { error: missionProgressError } = await supabase
      .from("user_mission_progress")
      .insert(missionProgressRecords);

    if (missionProgressError) {
      console.error("Mission progress creation error:", missionProgressError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to setup mission progress"
      );
    }
  }

  // Fetch all achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from("achievement")
    .select("*");

  if (achievementsError) {
    console.error("Achievements fetch error:", achievementsError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to setup achievement progress"
    );
  }

  // Create and insert achievement progress records if there are achievements
  if (achievements && achievements.length > 0) {
    const achievementProgressRecords = achievements.map((achievement) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      achievement_id: achievement.id,
      progress_point: 0,
      last_completed_at: null,
    }));

    const { error: achievementProgressError } = await supabase
      .from("user_achievement_progress")
      .insert(achievementProgressRecords);

    if (achievementProgressError) {
      console.error(
        "Achievement progress creation error:",
        achievementProgressError
      );
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to setup achievement progress"
      );
    }
  }

  // Fetch all quiz levels
  const { data: levels, error: levelsError } = await supabase
    .from("quiz_level")
    .select("id");

  if (levelsError) {
    console.error("Levels fetch error:", levelsError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to setup level streaks"
    );
  }

  // Create and insert level streak records if there are levels
  if (levels && levels.length > 0) {
    const levelStreakRecords = levels.map((level) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      level_id: level.id,
      current_streak: 0,
      last_question_id: null,
    }));

    const { error: streakError } = await supabase
      .from("level_streaks")
      .insert(levelStreakRecords);

    if (streakError) {
      console.error("Level streak creation error:", streakError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to setup level streaks"
      );
    }
  }

  return redirect("/home");
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/home");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Email berhasil dikirim! Buka email untuk mereset password anda"
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Tolong isi password and konfirmasi password"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/reset-password", "Passwords tidak cocok");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", "/reset-password", "Password gagal diupdate");
  }

  encodedRedirect("success", "/sign-in", "Password berhasil diupdate");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

export const getDictionaryWords = async (searchQuery?: string) => {
  try {
    console.log("Starting dictionary fetch with search query:", searchQuery);
    const supabase = await createClient();
    let query = supabase
      .from("dictionary")
      .select("id, value, video_url, type")
      .order("value");

    if (searchQuery) {
      console.log("Applying search filter:", searchQuery);
      const words = searchQuery.toLowerCase().trim().split(/\s+/);

      if (words.length === 1) {
        // Single word prefix search
        query = query.ilike("value", `${words[0]}%`);
      } else if (words.length > 1) {
        // Multi-word search
        const lastWord = words[words.length - 1];
        const otherWords = words.slice(0, -1);

        // Create conditions for matching exact words and prefix for the last word
        const conditions = otherWords.map(
          (word) => `(value ilike '${word}' or type ilike '${word}')`
        );

        // Add prefix condition for the last word
        conditions.push(
          `(value ilike '${lastWord}%' or type ilike '${lastWord}%')`
        );

        // Combine all conditions
        query = query.or(conditions.join(","));
      }
    }

    console.log("Executing query...");
    const { data, error } = await query;

    if (error) {
      console.error("Database error fetching dictionary:", error);
      return [];
    }

    console.log("Raw data from database:", data);

    if (!data || data.length === 0) {
      console.log("No dictionary data found in database");
      return [];
    }

    const mappedData = data.map((word) => ({
      id: word.id,
      value: word.value,
      videoUrl: word.video_url,
    }));

    console.log("Processed dictionary data:", mappedData);
    return mappedData;
  } catch (error) {
    console.error("Unexpected error in getDictionaryWords:", error);
    return [];
  }
};
