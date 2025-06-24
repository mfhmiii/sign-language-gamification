"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";
// Import confetti
import confetti from "canvas-confetti";

interface StageClearedClientProps {
  levelId: string;
  stageId: string;
}

interface Stage {
  id: string;
  stage: number;
  level_id: string;
}

export default function StageClearedClient({
  levelId,
  stageId,
}: StageClearedClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [allStagesCompleted, setAllStagesCompleted] = useState(false);
  const [nextStage, setNextStage] = useState<number | null>(null);
  const [rewards, setRewards] = useState({ coins: 10, xp: 20 }); // Small rewards for stage completion

  // Function to trigger confetti
  const triggerConfetti = useCallback(() => {
    const count = 200,
      defaults = {
        origin: { y: 0.7 },
      };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio),
        })
      );
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

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
          .select("id")
          .eq('"order"', parseInt(levelId))
          .single();

        if (!levelData) {
          console.error("Level not found");
          router.push("/home");
          return;
        }

        // Check if all questions in this stage are completed
        const { data: stageQuestions } = await supabase
          .from("quiz_questions")
          .select("id")
          .eq("level_id", levelData.id)
          .eq("stage", parseInt(stageId));

        if (!stageQuestions || stageQuestions.length === 0) {
          console.error("No questions found for this stage");
          router.push("/home");
          return;
        }

        const questionIds = stageQuestions.map((q) => q.id);

        // Get user progress for these questions
        const { data: userProgress } = await supabase
          .from("user_quiz_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("level_id", levelData.id)
          .in("question_id", questionIds);

        // Check if all questions in this stage are completed
        const allCompleted =
          userProgress &&
          userProgress.length === questionIds.length &&
          userProgress.every((p) => p.is_completed);

        if (!allCompleted) {
          // If not all questions are completed, redirect back to the quiz
          router.push(`/quiz/${levelId}/${stageId}`);
          return;
        }

        // Check if there's a next stage
        const { data: stages } = await supabase
          .from("quiz_questions")
          .select("stage")
          .eq("level_id", levelData.id)
          .order("stage", { ascending: true });

        if (stages) {
          // Get unique stage numbers
          const uniqueStages = [...new Set(stages.map((s) => s.stage))];
          const currentStageIndex = uniqueStages.indexOf(parseInt(stageId));

          if (currentStageIndex < uniqueStages.length - 1) {
            // There's a next stage
            setNextStage(uniqueStages[currentStageIndex + 1]);
          } else {
            // This was the last stage
            setAllStagesCompleted(true);
          }
        }

        // Update user stats with small rewards for completing a stage
        const { data: userData } = await supabase
          .from("users")
          .select("points, xp")
          .eq("id", user.id)
          .single();

        if (userData) {
          await supabase
            .from("users")
            .update({
              points: userData.points + rewards.coins,
              xp: userData.xp + rewards.xp,
            })
            .eq("id", user.id);
        }
        
        // Trigger confetti after data is loaded and stage is confirmed completed
        triggerConfetti();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [levelId, stageId, router, supabase, rewards.coins, rewards.xp, triggerConfetti]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        Loading...
      </div>
    );
  }

  const handleContinue = () => {
    if (allStagesCompleted) {
      // If all stages are completed, go to level-cleared
      router.push(`/quiz/${levelId}/level-cleared`);
    } else {
      // Fallback to quiz level page
      router.push(`/quiz/${levelId}`);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-4 md:py-10">
      <div className="space-y-8">
        {/* Content */}
        <div className="text-center space-y-6">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center bg-green-100 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">
              Stage Selesai!
            </h2>
            <p className="text-center text-gray-600">
              Kamu telah menyelesaikan semua soal pada tahap ini.
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
              className="w-full mt-6 bg-green-500 hover:bg-green-600"
              onClick={handleContinue}
            >
              {allStagesCompleted ? "Selesaikan Level" : "Lanjutkan"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
