import { redirect } from "next/navigation";
import Link from "next/link";
import StatsCard from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { CircularProgress } from "@/components/circular-progress";
import { getUserProfile } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/server";
import { getUserRank, getBadgeInfo } from "@/utils/ranking";
import QuoteCard from "@/components/quote-card";
import { Lock, CheckCircle } from "lucide-react";
import { updateUserLevel } from "@/app/actions";
import { updateWordWarriorMission } from "@/app/(features)/mission/actions";

interface QuizProgress {
  is_completed: boolean;
  user_id: string;
}

interface LevelData {
  id: string;
  name: string;
  order: number;
  quiz_questions: [{ count: number }];
  user_quiz_progress: QuizProgress[];
}

export default async function QuizPage() {
  try {
    const user = await getUserProfile();
    const supabase = await createClient();

    if (!user) {
      return redirect("/sign-in");
    }

    // Update user level based on XP
    await updateUserLevel(user.id);

    await updateWordWarriorMission(user.id);

    // Get user's rank information
    const userRank = await getUserRank(user.id);

    // Get total number of quotes
    const { count } = await supabase
      .from("quote")
      .select("*", { count: "exact", head: true });

    // Fetch a random quote using offset
    const randomOffset = count ? Math.floor(Math.random() * count) : 0;
    const { data: quotes } = await supabase
      .from("quote")
      .select("*")
      .range(randomOffset, randomOffset)
      .single();

    // Fetch quiz levels with progress
    const { data: levels } = await supabase
      .from("quiz_level")
      .select(
        `
        *,
        quiz_questions(count),
        user_quiz_progress!inner(
          is_completed,
          user_id
        )
      `
      )
      .eq("user_quiz_progress.user_id", user.id)
      .order("order", { ascending: true });

    // Calculate level completion percentages
    const levelProgress = levels?.map((level: LevelData) => {
      // Filter progress records for this level and this user
      const userProgress = level.user_quiz_progress.filter(
        (p: QuizProgress) => p.user_id === user.id && p.is_completed
      );

      // Get total questions for this level
      const totalQuestions = level.quiz_questions[0]?.count || 0;

      // Calculate percentage
      const percentage =
        totalQuestions > 0 ? (userProgress.length / totalQuestions) * 100 : 0;

      return {
        ...level,
        percentage: Math.round(percentage),
      };
    });

    // Find previous level for each level
    const getPreviousLevel = (currentLevel: LevelData) => {
      return levels?.find((l: LevelData) => l.order === currentLevel.order - 1);
    };

    return (
      <main className="bg-green-400 xl:mx-36 md:mx-14">
        <div className="mb-4 px-6 pt-16">
          <h1 className="text-2xl font-bold">
            Halo, {user.username || "User"}...
          </h1>
          <h2 className="text-3xl font-bold text-primary">Selamat Belajar</h2>
        </div>

        <StatsCard
          points={user.points || 0}
          ranking={userRank?.rank || 0}
          level={Math.floor((user.xp || 0) / 1000)}
          className="mx-4"
        />

        <div className="bg-white rounded-t-2xl pt-6 mt-6 min-h-screen pb-16">
          <QuoteCard
            quote={quotes?.description || ""}
            author={quotes?.author || ""}
            className="m-6 md:mx-12 mx-4"
          />
          <hr className="bg-slate-100 h-2" />
          <div className="bg-white rounded-xl m-6 md:m-12 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">
              Pilih Level Belajar !
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {levelProgress?.map((level) => {
                const previousLevel = getPreviousLevel(level);
                const isLocked =
                  level.order > 1 &&
                  !previousLevel?.user_quiz_progress?.some(
                    (p: { is_completed: boolean }) => p.is_completed
                  );
                const isCompleted = level.percentage === 100;

                return (
                  <Link
                    key={level.order}
                    href={
                      isLocked || isCompleted ? "#" : `/quiz/${level.order}`
                    }
                    className={
                      isLocked || isCompleted ? "cursor-not-allowed" : ""
                    }
                  >
                    <Card
                      className={`p-4 sm:p-6 transition-colors hover:opacity-90 ${
                        isLocked
                          ? "bg-muted"
                          : isCompleted
                            ? "bg-green-200"
                            : "bg-[#D1F2D9]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xl sm:text-2xl font-bold truncate">
                            Level {level.order}
                          </h4>
                          <div
                            className={`text-base sm:text-lg font-medium rounded-full px-3 sm:px-4 py-0.5 sm:py-1 inline-block truncate max-w-full ${
                              isLocked
                                ? "bg-muted-foreground/20"
                                : "bg-yellow-200"
                            }`}
                          >
                            {level.name}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isLocked ? (
                            <div className="text-muted-foreground">
                              <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                          ) : isCompleted ? (
                            <div className="text-green-500">
                              <CheckCircle className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px]" />
                            </div>
                          ) : (
                            <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px]">
                              <CircularProgress
                                percentage={level.percentage}
                                size="100%"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error:", error);
    redirect("/sign-in");
  }
}
