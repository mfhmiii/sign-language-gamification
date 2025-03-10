import { Suspense } from "react";
import QuizPageClient from "./QuizPageClient";

interface PageProps {
  params: { levelId: string };
}

export default async function QuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageClient levelId={resolvedParams.levelId} />
    </Suspense>
  );
}
