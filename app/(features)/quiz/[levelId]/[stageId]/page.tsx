import { Suspense } from "react";
import QuizPageClient from "./QuizPageClient";

interface PageProps {
  params: { levelId: string; stageId: string };
}

export default async function QuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageClient
        levelId={resolvedParams.levelId}
        stageId={resolvedParams.stageId}
      />
    </Suspense>
  );
}
