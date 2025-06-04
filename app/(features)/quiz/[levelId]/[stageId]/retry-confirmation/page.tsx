"use client";

import { Suspense, useEffect, useState } from "react";
import RetryConfirmationClient from "./RetryConfirmationClient";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface PageProps {
  params: Promise<{ levelId: string; stageId: string }> | undefined;
}

export default function RetryConfirmationPage({ params }: PageProps) {
  const resolvedParams = use(Promise.resolve(params || { levelId: "", stageId: "" }));
  const levelId = resolvedParams.levelId;
  const stageId = resolvedParams.stageId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkIncorrectQuestions() {
      const supabase = createClient();
      
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
          .select("id")
          .eq('"order"', parseInt(levelId))
          .single();

        if (!levelData) {
          console.error("Level not found");
          router.push("/home");
          return;
        }

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
        
        // If there are no incorrect questions, redirect to stage-cleared
        if (uncompletedQuestions.length < 1) {
          router.push(`/quiz/${levelId}/${stageId}/stage-cleared`);
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking incorrect questions:", error);
        setLoading(false);
      }
    }

    checkIncorrectQuestions();
  }, [levelId, stageId, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[200px]">Loading...</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RetryConfirmationClient levelId={levelId} stageId={stageId} />
    </Suspense>
  );
}
