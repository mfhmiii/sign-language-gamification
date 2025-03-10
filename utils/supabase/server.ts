import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db, connectDB } from "../orm";
import { users } from "./schema";
import { error } from "console";
import { eq } from "drizzle-orm";

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export const getUserProfile = async () => {
  const supabase = await createClient();

  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData?.user) {
    console.error("User not found:", error?.message || "No authenticated user");
    return null;
  }

  try {
    // Ensure database connection is established
    await connectDB();

    // Query user data from the database using the verified user ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.user.id));
    return user[0] ?? null;
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
};
