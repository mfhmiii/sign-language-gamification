import { Suspense } from "react";
import QuizPageClient from "./QuizPageClient";
import { use } from "react";

interface PageProps {
  params: Promise<{ levelId: string }> | undefined;
}

export default function QuizPage({ params }: PageProps) {
  const resolvedParams = use(Promise.resolve(params || { levelId: "" }));
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageClient levelId={resolvedParams.levelId} />
    </Suspense>
  );
}
