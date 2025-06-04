"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import QuizQuestionRenderer from "@/components/QuizQuestionRenderer";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchQuizQuestions, getQuizProgress } from "@/utils/quizAlgorithm";

interface UserProgress {
  question_id: string;
  user_id: string;
  level_id: string;
  is_completed: boolean;
}

interface QuizProgress {
  is_completed: boolean;
  user_id: string;
}

interface Level {
  id: string;
  name: string;
}

export default function QuizPageClient({
  levelId,
  stageId,
}: {
  levelId: string;
  stageId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [level, setLevel] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestionsInLevel, setTotalQuestionsInLevel] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);

  async function loadData() {
    try {
      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/sign-in");
        return;
      }
      setUser(currentUser);

      try {
        // Fetch level details first
        const { data: levelData, error: levelError } = await supabase
          .from("quiz_level")
          .select("*")
          .eq('"order"', levelId)
          .single();

        if (levelError) {
          console.error("Level error:", levelError);
          // If we get a 400 Bad Request, redirect to stage-cleared
          if (levelError.code === "PGRST116" || levelError.code === "400") {
            console.log(
              "No level found or API error, redirecting to stage-cleared"
            );
            router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
            return;
          }
          router.push("/home");
          return;
        }

        if (!levelData) {
          console.error("No level data found");
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        setLevel(levelData);

        // Get quiz progress to know total questions and completed count
        let progress;
        try {
          progress = await getQuizProgress(levelId, currentUser.id);
        } catch (progressError) {
          console.error("Error getting quiz progress:", progressError);
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        // Fetch questions using our new algorithm
        let quizQuestions;
        try {
          quizQuestions = await fetchQuizQuestions(
            levelId,
            currentUser.id,
            true // Always include all questions
          );
        } catch (questionsError) {
          console.error("Error fetching quiz questions:", questionsError);
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        if (!quizQuestions || quizQuestions.length === 0) {
          console.log("No questions found, redirecting to stage-cleared");
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        // Parse stageId and handle invalid values
        const stageIdNum = parseInt(stageId);
        if (isNaN(stageIdNum)) {
          console.error("Invalid stage ID:", stageId);
          router.push("/home");
          return;
        }

        // Filter questions by stage
        let stageQuestions;
        try {
          stageQuestions = await filterQuestionsByStage(
            quizQuestions,
            stageIdNum
          );
        } catch (stageError) {
          console.error("Error filtering questions by stage:", stageError);
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        if (!stageQuestions || stageQuestions.length === 0) {
          console.log(
            "No questions found for this stage, redirecting to stage-cleared"
          );
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        // Set all questions for this stage
        setQuestions(stageQuestions);

        // Set total questions for this stage
        setTotalQuestionsInLevel(stageQuestions.length);

        // Find the first uncompleted question to start with
        const firstUncompletedIndex = stageQuestions.findIndex(
          (q) =>
            !q.user_quiz_progress?.some(
              (p: { is_completed: boolean }) => p.is_completed
            )
        );

        // If all questions are completed, redirect to stage-cleared
        if (firstUncompletedIndex === -1) {
          console.log("All questions completed, redirecting to stage-cleared");
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }

        // Set the current question index to the first uncompleted question
        setCurrentQuestionIndex(firstUncompletedIndex);

        // Calculate current question number based on completed questions in this stage
        const completedCount = stageQuestions.filter((q) =>
          q.user_quiz_progress?.some(
            (p: { is_completed: boolean }) => p.is_completed
          )
        ).length;
        setCurrentQuestionNumber(completedCount + 1);
      } catch (innerError) {
        console.error("Unexpected error in data loading:", innerError);
        router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
        return;
      }
    } catch (error) {
      console.error("Error loading quiz data:", error);
      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  async function filterQuestionsByStage(questions: any[], stage: number) {
    // Check if stage is a valid number
    if (isNaN(stage)) {
      console.error("Invalid stage ID:", stage);
      return [];
    }

    // If we already have the questions with stage info, just filter them
    if (questions.length > 0 && "stage" in questions[0]) {
      return questions.filter((q) => q.stage === stage);
    }

    // Otherwise, we need to fetch the stage info from the database
    const supabase = createClient();
    const questionIds = questions.map((q) => q.id);

    try {
      // Get stage info for these questions
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, stage")
        .in("id", questionIds)
        .eq("stage", stage);

      if (error) {
        console.error("Error fetching question stages:", error);
        // If we get a 400 Bad Request, return empty array
        if (error.code === "PGRST116" || error.code === "400") {
          return [];
        }
        throw error;
      }

      // Check if data is undefined or null
      if (!data || data.length === 0) {
        console.error("No questions found for stage:", stage);
        return [];
      }

      // Create a map of question IDs to stages
      const stageMap = new Map(data.map((item) => [item.id, item.stage]));

      // Filter questions by stage
      return questions.filter((q) => stageMap.get(q.id) === stage);
    } catch (error) {
      console.error("Error in filterQuestionsByStage:", error);
      return [];
    }
  }

  useEffect(() => {
    loadData();
  }, [levelId, stageId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">Loading...</div>
      </div>
    );
  }

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = async () => {
    // First, refresh the current question's progress status from the database
    if (currentQuestion && user) {
      const supabase = createClient();
      const { data: updatedProgress } = await supabase
        .from("user_quiz_progress")
        .select("is_completed")
        .eq("user_id", user.id)
        .eq("question_id", currentQuestion.id)
        .single();

      // Update the current question's progress in the local state
      if (updatedProgress) {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          user_quiz_progress: [
            {
              is_completed: updatedProgress.is_completed,
              user_id: user.id,
            },
          ],
        };
        setQuestions(updatedQuestions);

        // If this is the last question and it's now completed, redirect to stage-cleared
        // if (
        //   updatedProgress.is_completed &&
        //   currentQuestionIndex === questions.length - 1
        // ) 
        // {
        //   console.log(
        //     `DEBUG - Last question completed, navigating to stage-cleared`
        //   );
        //   router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
        //   return;
        // }
      }
    }

    // Find the next uncompleted question
    let nextUncompletedIndex = -1;
    for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
      if (
        !questions[i].user_quiz_progress?.some(
          (p: { is_completed: boolean }) => p.is_completed
        )
      ) {
        nextUncompletedIndex = i;
        break;
      }
    }

    if (nextUncompletedIndex !== -1) {
      // Move to next uncompleted question
      setCurrentQuestionIndex(nextUncompletedIndex);
      setCurrentQuestionNumber((prev) => prev + 1);
    } else {
      // Debug: Log questions and their progress
      console.log("DEBUG - All questions:", JSON.stringify(questions, null, 2));

      // Check if all questions in the current stage are completed
      const allQuestionsCompleted = questions.every((q) => {
        const hasProgress =
          q.user_quiz_progress && q.user_quiz_progress.length > 0;
        const hasCompletedProgress =
          hasProgress &&
          q.user_quiz_progress.some(
            (p: { is_completed: boolean }) => p.is_completed
          );

        // Debug: Log each question's completion status
        console.log(
          `DEBUG - Question ${q.id} - Has progress: ${hasProgress}, Is completed: ${hasCompletedProgress}`
        );
        console.log(`DEBUG - Question progress:`, q.user_quiz_progress);

        // Check if the question has any progress entries and if at least one is completed
        return hasProgress && hasCompletedProgress;
      });

      // Debug: Log overall completion status
      console.log(`DEBUG - All questions completed: ${allQuestionsCompleted}`);

      // If the current question was just completed and it was the last one,
      // we should redirect to stage-cleared regardless of the allQuestionsCompleted check
      if (
        currentQuestion?.user_quiz_progress?.some(
          (p: { is_completed: boolean }) => p.is_completed
        ) 
        &&
        nextUncompletedIndex === -1
      ) {
        console.log(
          `DEBUG - Last question completed, navigating to stage-cleared`
        );
        router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
        return;
      }

      if (allQuestionsCompleted) {
        // Debug: Log navigation to stage-cleared
        console.log(`DEBUG - Navigating to stage-cleared, levelId: ${levelId}`);
        // If all questions in the stage are completed, go to stage-cleared
        router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
      } else {
        // Check if all questions in the level are completed
        const progress = await getQuizProgress(levelId, user?.id);

        // Debug: Log progress information
        console.log(
          `DEBUG - Level progress - Total: ${progress.total}, Completed: ${progress.completed}`
        );

        if (progress.completed >= progress.total || allQuestionsCompleted) {
          // Debug: Log navigation to stage-cleared from progress check
          console.log(
            `DEBUG - Navigating to stage-cleared from progress check`
          );
          // If all questions are completed or all questions in stage are completed, go to stage-cleared
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
        } else {
          // Debug: Log navigation to retry-confirmation
          console.log(`DEBUG - Navigating to retry-confirmation`);
          // If there are uncompleted questions, go to retry confirmation
          router.push(`/quiz/${levelId}/${stageId}/retry-confirmation`);
        }
      }
    }
  };

  return (
    <main className="bg-white xl:mx-36 md:mx-14 sm:mx-auto px-4 pb-20 sm:pb-4 pt-6 min-h-screen">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Soal {currentQuestionNumber}/{totalQuestionsInLevel}
          </p>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-all duration-300"
              style={{
                width: `${currentQuestionNumber * (100 / totalQuestionsInLevel)}%`,
              }}
            />
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <QuizQuestionRenderer
            key={currentQuestion.id}
            question={currentQuestion}
            userId={user?.id}
            onComplete={handleNextQuestion}
          />
        )}
      </div>
    </main>
  );
}

// QuizQuestionCard has been replaced by the QuizQuestionRenderer component
