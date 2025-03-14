"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/orm";
import {
  users,
  quiz_questions,
  user_quiz_progress,
} from "@/utils/supabase/schema";
import { eq } from "drizzle-orm";

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
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
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
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
