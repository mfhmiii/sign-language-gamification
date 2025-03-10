import Link from "next/link";
import { Button } from "./ui/button";
import { Lock } from "lucide-react";

interface LevelProgressProps {
  levels: {
    id: string;
    name: string;
    user_quiz_progress: {
      is_completed: boolean;
      user_id: string;
    }[];
  }[];
}

export default function LevelProgress({ levels }: LevelProgressProps) {
  const isLevelLocked = (index: number) => {
    if (index === 0) return false;
    // Check if previous level is completed
    const previousLevel = levels[index - 1];
    return !previousLevel?.user_quiz_progress.some((progress) => progress.is_completed);
  };

  const getLevelProgress = (level: LevelProgressProps["levels"][0]) => {
    const completedQuestions = level.user_quiz_progress.filter(
      (progress) => progress.is_completed
    ).length;
    const totalQuestions = level.user_quiz_progress.length;
    return {
      completed: completedQuestions,
      total: totalQuestions,
      percentage: (completedQuestions / totalQuestions) * 100,
    };
  };

  return (
    <div className="grid gap-4">
      {levels.map((level, index) => {
        const progress = getLevelProgress(level);
        const locked = isLevelLocked(index);

        return (
          <div
            key={level.id}
            className="border rounded-lg p-6 bg-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{level.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {progress.completed} / {progress.total} completed
                </p>
              </div>
              {locked ? (
                <Button disabled variant="secondary">
                  <Lock className="mr-2 h-4 w-4" />
                  Locked
                </Button>
              ) : (
                <Link href={`/quiz/${level.id}`}>
                  <Button>
                    {progress.completed === progress.total
                      ? "Review"
                      : "Continue"}
                  </Button>
                </Link>
              )}
            </div>
            <div className="w-full bg-secondary h-2 rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
} 