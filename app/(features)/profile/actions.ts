"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
