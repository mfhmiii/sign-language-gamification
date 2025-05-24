"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Function to update login streak when user completes a question
export async function updateLoginStreak(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for comparison

  try {
    // Get the user's current login streak
    const { data: streakData, error: streakError } = await supabase
      .from("login_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (streakError && streakError.code !== "PGRST116") {
      console.error("Error fetching login streak:", streakError);
      return false;
    }

    const lastLoginDate = streakData?.lastLoginDate
      ? new Date(streakData.lastLoginDate)
      : null;
    lastLoginDate?.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Calculate if streak should be maintained/incremented or reset
    let newStreak = 1; // Default to 1 for first login
    if (lastLoginDate) {
      const daysSinceLastLogin = Math.floor(
        (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastLogin === 0) {
        // Already logged in today, maintain current streak
        newStreak = streakData.currentStreak;
      } else if (daysSinceLastLogin === 1) {
        // Consecutive day, increment streak
        newStreak = streakData.currentStreak + 1;
      }
      // If more than 1 day has passed, reset to 1 (default)
    }

    // Update or create the login streak record
    if (streakData) {
      const { error: updateError } = await supabase
        .from("login_streaks")
        .update({
          currentStreak: newStreak,
          lastLoginDate: now.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", streakData.id);

      if (updateError) {
        console.error("Error updating login streak:", updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase
        .from("login_streaks")
        .insert({
          userId,
          currentStreak: newStreak,
          lastLoginDate: now.toISOString(),
        });

      if (insertError) {
        console.error("Error creating login streak:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error in updateLoginStreak:", error);
    return false;
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const username = formData.get("name")?.toString();
  const newPassword = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const profilePhoto = formData.get("profile_photo")?.toString();

  try {
    // Update username and profile photo in the database
    if (username || profilePhoto) {
      const updates: { username?: string; profile_photo?: string } = {};
      if (username) updates.username = username;
      if (profilePhoto) updates.profile_photo = profilePhoto;

      const { error: profileError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (profileError) {
        return { error: "Failed to update profile" };
      }
    }

    // Update password in Supabase Auth if provided
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return { error: "Passwords do not match" };
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        return { error: "Failed to update password" };
      }
    }

    revalidatePath("/profile/get");
    return { success: true };
  } catch (error) {
    return { error: "An unexpected error occurred" };
  }
}
