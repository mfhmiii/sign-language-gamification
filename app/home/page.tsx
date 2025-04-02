import { redirect } from "next/navigation";
import Link from "next/link";
import StatsCard from "@/components/stats-card";
import { Card } from "@/components/ui/card";
import { CircularProgress } from "@/components/circular-progress";
import { getUserProfile } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/server";
import { getUserRank, getBadgeInfo } from "@/utils/ranking";
import QuoteCard from "@/components/quote-card";

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

    // Find current level or next available level
    const currentOrNextLevel =
      levelProgress?.find((level) => level.percentage < 100) ||
      levelProgress?.[0];

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
          className="md:mx-12 mx-4"
        />

        <div className="bg-white rounded-t-2xl pt-6 mt-6 h-screen">
          <QuoteCard
            quote={quotes?.description || ""}
            author={quotes?.author || ""}
            className="m-6 md:mx-12 mx-4"
          />
          <hr className="bg-slate-100 h-2"/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 m-6 md:mx-12 mx-4">
            {currentOrNextLevel && (
              <Link href={`/quiz/${currentOrNextLevel.id}`}>
                <Card className="p-6 hover:bg-accent transition-colors bg-green-400">
                  <div className="flex items-center gap-4">
                  <div className="flex-1">
                      <h3 className="text-2xl font-semibold">
                        Level {currentOrNextLevel.order}
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        {currentOrNextLevel.name}
                      </p>
                    </div>
                    <CircularProgress
                      percentage={currentOrNextLevel.percentage}
                      size={120}
                      label="Complete"
                    />
                  </div>
                </Card>
              </Link>
            )}
            <Link href="/dictionary">
              <Card className="p-6 hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">Kamus</h3>
                    <p className="text-sm text-muted-foreground">
                      Mulai Belajar
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error:", error);
    redirect("/sign-in");
  }
}
