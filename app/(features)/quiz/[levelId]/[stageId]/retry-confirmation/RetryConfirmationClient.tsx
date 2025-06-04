"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCcw } from "lucide-react";

interface Level {
  id: string;
  name: string;
}

export default function RetryConfirmationClient({
  levelId,
  stageId,
}: {
  levelId: string;
  stageId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [level, setLevel] = useState<Level | null>(null);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          .select("id, name")
          .eq('"order"', parseInt(levelId))
          .single();

        if (!levelData) {
          console.error("Level not found");
          router.push("/home");
          return;
        }

        setLevel(levelData);

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

        // Count incorrect questions
        const uncompletedQuestions = userProgress ? 
          userProgress.filter(p => !p.is_completed) : [];
        
        setIncorrectCount(uncompletedQuestions.length);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [levelId, stageId, router, supabase]);

  const handleRetry = () => {
    router.push(`/quiz/${levelId}/${stageId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        Loading...
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 md:py-10 py-4">
      <div className="space-y-8">
        {/* Content */}
        <div className="text-center space-y-6">
          <div className="p-6 bg-yellow-50 rounded-lg">
            <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Mau Mencoba Lagi?</h2>
            <p className="text-muted-foreground">
              Kamu memiliki {incorrectCount} soal yang belum terjawab dengan
              benar. Ingin mencoba menjawab kembali?
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600"
              onClick={handleRetry}
            >
              Ya, Coba Lagi
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/home")}
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
