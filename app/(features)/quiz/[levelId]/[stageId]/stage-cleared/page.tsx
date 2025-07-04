import { Suspense } from "react";
import StageClearedClient from "./StageClearedClient";
import { use } from "react";

interface PageProps {
  params: Promise<{ levelId: string; stageId: string }> | undefined;
}

export default function StageClearedPage({ params }: PageProps) {
  const resolvedParams = use(
    Promise.resolve(params || { levelId: "", stageId: "" })
  );
  const levelId = resolvedParams.levelId;
  const stageId = resolvedParams.stageId;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StageClearedClient levelId={levelId} stageId={stageId} />
    </Suspense>
  );
}
