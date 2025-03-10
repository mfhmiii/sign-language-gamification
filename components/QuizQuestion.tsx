"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizQuestionProps {
  question: {
    id: string;
    type: string;
    level_id: string;
    questionText: string;
    videoUrl?: string;
    correctAnswer: string;
    options: string[];
    user_quiz_progress?: {
      is_completed: boolean;
      user_id: string;
    }[];
  };
  userId: string;
}

export default function QuizQuestion({ question, userId }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const supabase = createClientComponentClient();

  const isCompleted = question.user_quiz_progress?.some(
    (p) => p.user_id === userId && p.is_completed
  );

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;

    const isAnswerCorrect = selectedAnswer === question.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);

    if (isAnswerCorrect) {
      // Update user progress
      await supabase.from("user_quiz_progress").upsert({
        user_id: userId,
        question_id: question.id,
        level_id: question.level_id,
        is_completed: true,
      });

      // Update user XP and coins
      await supabase.rpc("increment_user_stats", {
        user_id: userId,
        xp_increment: 10,
        coins_increment: 5,
      });
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {question.type === "gesture-to-text" && question.videoUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video
              src={question.videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <h3 className="text-xl font-semibold">{question.questionText}</h3>

        {question.type === "gesture-to-text" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((option) => (
              <Button
                key={option}
                variant={
                  selectedAnswer === option
                    ? isAnswered
                      ? isCorrect
                        ? "default"
                        : "destructive"
                      : "secondary"
                    : "outline"
                }
                className="p-4 h-auto text-left justify-start"
                onClick={() => !isAnswered && setSelectedAnswer(option)}
                disabled={isAnswered}
              >
                {option}
                {isAnswered &&
                  selectedAnswer === option &&
                  (isCorrect ? (
                    <CheckCircle className="ml-auto h-5 w-5" />
                  ) : (
                    <XCircle className="ml-auto h-5 w-5" />
                  ))}
              </Button>
            ))}
          </div>
        )}

        {question.type === "text-to-gesture" && (
          <div className="text-center p-8 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Text-to-gesture implementation will be added later
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          {!isAnswered ? (
            <Button onClick={handleAnswerSubmit} disabled={!selectedAnswer}>
              Submit Answer
            </Button>
          ) : !isCorrect ? (
            <Button onClick={handleRetry}>Try Again</Button>
          ) : (
            <Button variant="ghost" disabled>
              Completed ✓
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
