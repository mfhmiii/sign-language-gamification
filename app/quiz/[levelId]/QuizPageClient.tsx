"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import QuizQuestion from "@/components/QuizQuestion";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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

interface QuizQuestion {
  id: string;
  type: string;
  level_id: string;
  question_text: string;
  video_url: string;
  correct_answer: string;
  options: { options: string[] } | string; // JSON structure or string
  user_quiz_progress: QuizProgress[];
}

interface Level {
  id: string;
  name: string;
}

export default function QuizPageClient({ levelId }: { levelId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [level, setLevel] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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
        .eq("id", levelId)
        .single();

      if (levelError || !levelData) {
        console.error("Level error:", levelError);
        router.push("/home");
        return;
      }

      setLevel(levelData);

      // Get total questions in level
      const { data: allQuestions } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("level_id", levelId)
        .order("id");

      setTotalQuestionsInLevel(allQuestions?.length || 0);

      // First, check if user has any progress in this level
      const { data: progressData } = await supabase
        .from("user_quiz_progress")
        .select("question_id, is_completed")
        .eq("user_id", currentUser.id)
        .eq("level_id", levelId);

      // If user has progress, only show uncompleted questions
      if (progressData && progressData.length > 0) {
        // Get all questions for this level
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("level_id", levelId)
          .order("id");

        if (questionsError) {
          console.error("Questions error:", questionsError);
          return;
        }

        if (questionsData) {
          // Get user progress for these questions
          const { data: userProgress } = await supabase
            .from("user_quiz_progress")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("level_id", levelId);

          // Combine questions with their progress
          const questionsWithProgress = questionsData.map((question) => ({
            ...question,
            user_quiz_progress:
              userProgress?.filter(
                (p: UserProgress) => p.question_id === question.id
              ) || [],
          }));

          // Filter to show only questions that are not completed
          const uncompletedQuestions = questionsWithProgress.filter(
            (q) =>
              !q.user_quiz_progress.some((p: UserProgress) => p.is_completed)
          );

          // Find the index of the first uncompleted question in the full list
          const firstUncompletedId = uncompletedQuestions[0]?.id;
          const questionNumber =
            questionsData.findIndex((q) => q.id === firstUncompletedId) + 1;
          setCurrentQuestionNumber(questionNumber);

          setQuestions(uncompletedQuestions);
          setCurrentQuestionIndex(0);
        }
      } else {
        // If no progress, show all questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("level_id", levelId)
          .order("id");

        if (questionsError) {
          console.error("Questions error:", questionsError);
          return;
        }

        if (questionsData) {
          // Add empty progress array to each question
          const questionsWithProgress = questionsData.map((question) => ({
            ...question,
            user_quiz_progress: [],
          }));

          setQuestions(questionsWithProgress);
          setCurrentQuestionIndex(0);
          setCurrentQuestionNumber(1); // Start with first question
        }
      }
    } catch (error) {
      console.error("Error loading quiz data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [levelId]);

  if (loading) {
    return (
      <div className="container mx-2 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          Loading...
        </div>
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
      const { data: allQuestions } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("level_id", levelId);

      const { data: userProgress } = await supabase
        .from("user_quiz_progress")
        .select("*")
        .eq("user_id", user?.id)
        .eq("level_id", levelId);

      const hasUncompletedQuestions = allQuestions?.some(
        (q) =>
          !userProgress?.some(
            (p: UserProgress) => p.question_id === q.id && p.is_completed
          )
      );

      if (hasUncompletedQuestions) {
        // If there are uncompleted questions, go to retry confirmation
        router.push(`/quiz/${levelId}/retry-confirmation`);
      } else {
        // If all questions are completed, go to level-cleared
        router.push(`/quiz/${levelId}/level-cleared`);
      }
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold">Quis</h1>
          <div className="w-8 h-8" /> {/* Spacer for alignment */}
        </div>

        {/* Progress */}
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
          <QuizQuestionCard
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

function QuizQuestionCard({
  question,
  userId,
  onComplete,
}: {
  question: QuizQuestion;
  userId: string;
  onComplete: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const supabase = createClient();

  const questionOptions = useMemo(() => {
    try {
      const parsedOptions =
        typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;
      return parsedOptions.options || [];
    } catch (error) {
      console.error("Error parsing options:", error);
      return [];
    }
  }, [question.options]);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    const isCorrectAnswer = selectedAnswer === question.correct_answer;
    setIsCorrect(isCorrectAnswer);
    setIsSubmitted(true);

    try {
      // First, find the existing progress record
      const { data: existingProgress } = await supabase
        .from("user_quiz_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("question_id", question.id)
        .single();

      if (existingProgress) {
        // Update the existing record
        const { error: updateError } = await supabase
          .from("user_quiz_progress")
          .update({ is_completed: isCorrectAnswer })
          .eq("id", existingProgress.id);

        if (updateError) {
          console.error("Error updating progress:", updateError);
          return;
        }
      } else {
        // Create a new progress record
        const { error: insertError } = await supabase
          .from("user_quiz_progress")
          .insert({
            user_id: userId,
            question_id: question.id,
            level_id: question.level_id,
            is_completed: isCorrectAnswer,
          });

        if (insertError) {
          console.error("Error creating progress:", insertError);
          return;
        }
      }

      console.log("Progress updated successfully");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video */}
      {question.video_url && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={question.video_url}
            controls
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Question */}
      <h2 className="text-lg font-medium text-center">
        {question.question_text}
      </h2>

      {/* Options */}
      <div className="grid gap-3">
        {questionOptions.map((option: string) => (
          <Button
            key={option}
            variant={
              isSubmitted
                ? option === question.correct_answer
                  ? "default"
                  : option === selectedAnswer
                    ? "destructive"
                    : "outline"
                : option === selectedAnswer
                  ? "secondary"
                  : "outline"
            }
            className={`w-full p-4 h-auto text-center justify-center ${
              isSubmitted && option === selectedAnswer
                ? option === question.correct_answer
                  ? "bg-green-100 hover:bg-green-100"
                  : "bg-red-100 hover:bg-red-100"
                : ""
            }`}
            onClick={() => !isSubmitted && setSelectedAnswer(option)}
            disabled={isSubmitted}
          >
            {option}
          </Button>
        ))}
      </div>

      {/* Result and Next Button */}
      {isSubmitted ? (
        <div className="space-y-4">
          {isCorrect ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>Benar!</span>
            </div>
          ) : (
            <p className="text-center text-red-600">
              Maaf, Jawaban kamu salah. Coba lagi ya!
            </p>
          )}
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={onComplete}
          >
            Lanjutkan
          </Button>
        </div>
      ) : (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!selectedAnswer}
        >
          Periksa Jawaban
        </Button>
      )}
    </div>
  );
}
