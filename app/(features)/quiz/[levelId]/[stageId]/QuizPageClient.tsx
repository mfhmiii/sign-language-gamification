"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import QuizQuestionRenderer from "@/components/QuizQuestionRenderer";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchQuizQuestions, getQuizProgress } from "@/utils/quizAlgorithm";
import { updateQuizStreak } from "@/utils/streak";

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

      // Fetch level details first
      const { data: levelData, error: levelError } = await supabase
        .from("quiz_level")
        .select("*")
        .eq('"order"', levelId)
        .single();

      if (levelError || !levelData) {
        console.error("Level error:", levelError);
        router.push("/home");
        return;
      }

      setLevel(levelData);

      // Get quiz progress to know total questions and completed count
      const progress = await getQuizProgress(levelId, currentUser.id);

      // Fetch questions using our new algorithm
      const quizQuestions = await fetchQuizQuestions(
        levelId,
        currentUser.id,
        false
      );

      // Parse stageId and handle invalid values
      const stageIdNum = parseInt(stageId);
      if (isNaN(stageIdNum)) {
        console.error("Invalid stage ID:", stageId);
        router.push("/home");
        return;
      }

      // Filter questions by stage
      const stageQuestions = await filterQuestionsByStage(
        quizQuestions,
        stageIdNum
      );

      if (stageQuestions.length > 0) {
        setQuestions(stageQuestions);
        setCurrentQuestionIndex(0);

        // Set total questions for this stage
        setTotalQuestionsInLevel(stageQuestions.length);

        // Calculate current question number based on completed questions in this stage
        const completedCount = stageQuestions.filter((q) =>
          q.user_quiz_progress?.some(
            (p: { is_completed: boolean }) => p.is_completed
          )
        ).length;
        setCurrentQuestionNumber(completedCount + 1);
      } else if (
        progress.completed > 0 &&
        progress.completed < progress.total
      ) {
        // If we have completed questions but not all, redirect to retry confirmation
        router.push(`/quiz/${levelId}/retry-confirmation`);
        return;
      } else if (progress.completed === progress.total) {
        // If all questions are completed, go to level-cleared
        router.push(`/quiz/${levelId}/level-cleared`);
        return;
      }
    } catch (error) {
      console.error("Error loading quiz data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Function to filter questions by stage
  // Function to filter questions by stage
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
        return [];
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
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentQuestionNumber((prev) => prev + 1);
    } else {
      // Check if all questions in the level are completed
      const progress = await getQuizProgress(levelId, user?.id);

      if (progress.completed < progress.total) {
        // If there are uncompleted questions, go to retry confirmation
        router.push(`/quiz/${levelId}/retry-confirmation`);
      } else {
        // If all questions are completed, go to level-cleared
        router.push(`/quiz/${levelId}/level-cleared`);
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
