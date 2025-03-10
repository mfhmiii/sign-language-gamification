import { Suspense } from "react";
import RetryConfirmationClient from "./RetryConfirmationClient";
import { use } from "react";

interface PageProps {
  params: Promise<{ levelId: string }> | { levelId: string };
}

export default function RetryConfirmationPage({ params }: PageProps) {
  const resolvedParams = use(Promise.resolve(params));
  const levelId = resolvedParams.levelId;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RetryConfirmationClient levelId={levelId} />
    </Suspense>
  );
}
