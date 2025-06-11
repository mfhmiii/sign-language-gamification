import { resetDailyMissionProgress } from "@/app/(features)/misi/actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Check for a secret key to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Verify the secret matches your environment variable
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await resetDailyMissionProgress();
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
