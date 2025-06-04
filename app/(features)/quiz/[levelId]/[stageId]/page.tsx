import { Suspense } from "react";
import QuizPageClient from "./QuizPageClient";
import { use } from "react";

interface PageProps {
  params: Promise<{ levelId: string; stageId: string }> | { levelId: string; stageId: string };
}

export default function QuizPage({ params }: PageProps) {
  const resolvedParams = use(Promise.resolve(params));
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageClient
        levelId={resolvedParams.levelId}
        stageId={resolvedParams.stageId}
      />
    </Suspense>
  );
}
