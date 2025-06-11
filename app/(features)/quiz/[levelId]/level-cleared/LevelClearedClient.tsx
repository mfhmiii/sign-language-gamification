"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";
import { updateBadgesOnLevelCompletion } from "@/utils/quizAlgorithm";
import Image from "next/image";
// Add this import at the top with other imports
import {
  updateLevelUpMission,
  updateSignMasterMission,
} from "@/app/(features)/misi/actions";

interface Level {
  id: string;
  name: string;
  order: number;
}

interface UserStats {
  id: string;
  user_id: string;
  coins: number;
  xp: number;
}

export default function LevelClearedClient({ levelId }: { levelId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardsGiven, setRewardsGiven] = useState(false);
  const [rewards, setRewards] = useState({ coins: 0, xp: 0 });
  const [badgeImage, setBadgeImage] = useState<string | null>(null);

  // Calculate rewards based on level order
  const calculateRewards = useCallback((levelOrder: number) => {
    const baseCoins = 50;
    const baseXP = 100;
    const multiplier = levelOrder;
    return {
      coins: baseCoins * multiplier,
      xp: baseXP * multiplier,
    };
  }, []);

  // Function to update user stats
  const updateUserStats = useCallback(
    async (userId: string, levelOrder: number) => {
      try {
        // Calculate rewards
        const { coins, xp } = calculateRewards(levelOrder);

        // Get current user stats
        const { data: currentStats, error: statsError } = await supabase
          .from("users")
          .select("points, xp, badges1, badges2, badges3, badges4")
          .eq("id", userId)
          .single();

        if (statsError) throw statsError;

        // Update user stats with new values
        const { error: updateError } = await supabase
          .from("users")
          .update({
            points: (currentStats?.points || 0) + coins,
            xp: (currentStats?.xp || 0) + xp,
          })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Call updateLevelUpMission to update the Level Up mission progress
        try {
          await updateLevelUpMission(userId);
        } catch (missionError) {
          console.error("Error updating Level Up mission:", missionError);
          // Continue execution even if mission update fails
        }

        // Call updateSignMasterMission to check if the user has earned all badges
        try {
          const missionUpdated = await updateSignMasterMission(userId);
          if (!missionUpdated) {
            console.error("Failed to update Sign Master mission");
          } else {
            console.log("Sign Master mission updated successfully");
          }
        } catch (missionError) {
          console.error("Error updating Sign Master mission:", missionError);
          // Continue execution even if mission update fails
        }

        setRewards({ coins, xp });
        setRewardsGiven(true);

        // Determine badge image based on user's badge status
        if (currentStats?.badges1) {
          setBadgeImage("/images/badges1.svg");
        } else if (currentStats?.badges2) {
          setBadgeImage("/images/badges2.svg");
        } else if (currentStats?.badges3) {
          setBadgeImage("/images/badges3.svg");
        } else if (currentStats?.badges4) {
          setBadgeImage("/images/badges4.svg");
        }
      } catch (error) {
        console.error("Error updating user stats:", error);
      }
    },
    [supabase, calculateRewards]
  );

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch level details
        const { data: levelData } = await supabase
          .from("quiz_level")
          .select("*")
          .eq('"order"', parseInt(levelId))
          .single();

        if (levelData) {
          setLevel(levelData);

          // Check if all questions in this level are completed
          const { data: levelQuestions } = await supabase
            .from("quiz_questions")
            .select("id")
            .eq("level_id", levelData.id);

          if (!levelQuestions || levelQuestions.length === 0) {
            console.error("No questions found for this level");
            router.push("/home");
            return;
          }

          const questionIds = levelQuestions.map((q) => q.id);

          // Get user progress for these questions
          const { data: userProgress } = await supabase
            .from("user_quiz_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("level_id", levelData.id)
            .in("question_id", questionIds);

          // Check if all questions in this level are completed
          const allCompleted =
            userProgress &&
            userProgress.length === questionIds.length &&
            userProgress.every((p) => p.is_completed);

          if (!allCompleted) {
            // If not all questions are completed, redirect back to the quiz level page
            router.push(`/quiz/${levelId}`);
            return;
          }

          // Only give rewards if they haven't been given yet
          if (!rewardsGiven) {
            await updateUserStats(user.id, levelData.order);
            // Update badges when level is completed - use levelData.id, not levelId
            await updateBadgesOnLevelCompletion(user.id, levelData.id);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [levelId, supabase, router, updateUserStats, rewardsGiven]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        Loading...
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-4 md:py-10">
      <div className="space-y-8">
        {/* Content */}
        <div className="text-center space-y-6">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            {badgeImage ? (
              <Image
                src={badgeImage}
                alt="Badge Image"
                width={48}
                height={48}
                className="mx-auto mb-4 w-40 h-40"
              />
            ) : (
              <p>No badge earned yet.</p>
            )}
            <h2 className="text-xl font-semibold mb-2 text-center">
              Selamat! Level Selesai!
            </h2>
            <p className="text-center text-gray-600">
              Kamu telah menyelesaikan semua soal dengan benar.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {rewards.coins}
                </p>
                <p className="text-sm text-gray-600">Coins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{rewards.xp}</p>
                <p className="text-sm text-gray-600">EXP</p>
              </div>
            </div>
            <Button
              className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600"
              onClick={() => router.push("/home")}
            >
              Bagikan
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
