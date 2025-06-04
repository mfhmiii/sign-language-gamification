import { Suspense } from "react";
import LevelClearedClient from "./LevelClearedClient";
import { use } from "react";

interface PageProps {
  params: Promise<{ levelId: string }> | undefined;
}

export default function LevelClearedPage({ params }: PageProps) {
  const resolvedParams = use(Promise.resolve(params || { levelId: "" }));
  const levelId = resolvedParams.levelId;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LevelClearedClient levelId={levelId} />
    </Suspense>
  );
}
