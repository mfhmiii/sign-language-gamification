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
}: {
  levelId: string;
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
          .select("*")
          .eq("order", levelId)
          .single();

        if (levelData) {
          setLevel(levelData);
        }

        // Count incorrect questions
        const { data: uncompletedQuestions } = await supabase
          .from("quiz_questions")
          .select(
            `
            id,
            user_quiz_progress!inner(
              is_completed,
              user_id
            )
          `
          )
          .eq("level_id", levelId)
          .eq("user_quiz_progress.user_id", user.id)
          .eq("user_quiz_progress.is_completed", false);

        setIncorrectCount(uncompletedQuestions?.length || 0);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [levelId, supabase, router]);

  const handleRetry = () => {
    router.push(`/quiz/${levelId}`);
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
