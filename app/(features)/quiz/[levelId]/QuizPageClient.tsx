"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageIndicator } from "@/components/stage-indicator";
import { CustomStageCircle } from "@/components/stage-indicator";
import { ProgressBar } from "@/components/progress-bar";

// Remove the StageCircle import
// import { StageCircle } from "@/components/stage-circle";

interface QuizPageClientProps {
  levelId: string;
}

interface Stage {
  id: string;
  stage: number;
  is_completed: boolean;
  percentage?: number;
}

export default function QuizPageClient({ levelId }: QuizPageClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [stages, setStages] = useState<Stage[]>([]);
  const [levelName, setLevelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserAndStages() {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUserId(user.id);

        // Get level info
        const { data: levelData, error: levelError } = await supabase
          .from("quiz_level")
          .select("name, id")
          .eq('"order"', parseInt(levelId))
          .single();

        if (levelError) {
          throw new Error(`Error fetching level: ${levelError.message}`);
        }

        if (levelData) {
          setLevelName(levelData.name);
        }

        // Get all questions for this level with their stages
        const { data: questions, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("id, stage")
          .eq("level_id", levelData.id) 
          .order("stage", { ascending: true });

        if (questionsError) {
          throw new Error(
            `Error fetching questions: ${questionsError.message}`
          );
        }

        // Get user progress for this level
        const { data: progress, error: progressError } = await supabase
          .from("user_quiz_progress")
          .select("question_id, is_completed")
          .eq("user_id", user.id)
          .eq("level_id", levelData.id);

        if (progressError) {
          throw new Error(`Error fetching progress: ${progressError.message}`);
        }

        // Group questions by stage
        const stageMap = new Map();
        questions?.forEach((question) => {
          if (!stageMap.has(question.stage)) {
            stageMap.set(question.stage, []);
          }
          stageMap.get(question.stage).push(question.id);
        });

        // Calculate completion for each stage
        const stagesData: Stage[] = [];
        stageMap.forEach((questionIds, stageNumber) => {
          const stageProgress =
            progress?.filter(
              (p) => questionIds.includes(p.question_id) && p.is_completed
            ) || [];
          const completionPercentage =
            questionIds.length > 0
              ? (stageProgress.length / questionIds.length) * 100
              : 0;

          stagesData.push({
            id: `${levelId}-${stageNumber}`,
            stage: stageNumber,
            is_completed: completionPercentage === 100,
            percentage: Math.round(completionPercentage),
          });
        });

        // Sort stages by stage number
        stagesData.sort((a, b) => a.stage - b.stage);
        setStages(stagesData);
      } catch (err) {
        console.error("Error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndStages();
  }, [levelId, router, supabase]);

  // Function to determine if a stage is locked
  const isStageLocked = (stageIndex: number) => {
    if (stageIndex === 0) return false; // First stage is always unlocked
    const previousStage = stages[stageIndex - 1];
    return !previousStage?.is_completed;
  };

  const handleStageClick = (stage: Stage, index: number) => {
    if (isStageLocked(index)) return; // Don't navigate if stage is locked
    if (stage.is_completed) {
      // Maybe show a dialog asking if they want to retry
      // For now, just navigate to the stage
    }
    router.push(`/quiz/${levelId}/${stage.stage}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">
          Error Loading Level
        </h2>
        <p className="text-center mb-6">{error}</p>
        <Button onClick={() => router.push("/home")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16 mt-10">
      <div className="flex flex-col items-center justify-center px-4 py-12 max-w-7xl mx-auto">
        {/* Level Title */}
        <h1 className="text-2xl font-bold mb-8 text-center">{levelName}</h1>
        
        {/* Journey Path - Horizontal for larger screens, vertical for mobile */}
        <div className="w-full flex justify-center">
          {/* Horizontal layout for medium and larger screens */}
          <div className="hidden md:block w-full overflow-x-auto">
            <StageIndicator
              stages={stages}
              onStageClick={handleStageClick}
              isStageLocked={isStageLocked}
              className="mx-auto"
            />
          </div>
          
          {/* Vertical layout for mobile */}
          <div className="md:hidden flex flex-col items-center space-y-4 w-full max-w-xs mx-auto">
            {stages.map((stage, index) => {
              const isLocked = isStageLocked(index);
              const isCompleted = stage.is_completed;
              const isFirstUnlocked = !isLocked && !isCompleted && 
                index === stages.findIndex((s, i) => !isStageLocked(i) && !s.is_completed);
              
              const progressPercentage = isCompleted ? 100 : 
                                        (!isLocked && stage.percentage) ? stage.percentage : 
                                        isLocked ? 0 : 0;
              
              // Determine stage type
              let stageType: "locked" | "active" | "completed" | "finish" = "locked";
              if (!isLocked) {
                stageType = isCompleted ? "completed" : "active";
              }
              
              return (
                <div key={stage.id} className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-center">
                    <CustomStageCircle 
                      type={stageType}
                      percentage={progressPercentage}
                      isFirstUnlocked={isFirstUnlocked}
                      stageNumber={stage.stage}
                      onClick={() => !isLocked && handleStageClick(stage, index)}
                    />
                  </div>
                  
                  {/* Vertical connector line */}
                  {index < stages.length - 1 && (
                    <ProgressBar percentage={progressPercentage} vertical={true} />
                  )}
                </div>
              );
            })}
            
            {/* Add progress bar for the last stage before finish */}
            {stages.length > 0 && (
              <ProgressBar 
                percentage={
                  stages[stages.length - 1].is_completed 
                    ? 100 
                    : stages[stages.length - 1].percentage || 0
                } 
                vertical={true} 
              />
            )}
            
            {/* Finish indicator */}
            <div className="flex flex-col items-center">
              <CustomStageCircle type="finish" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
