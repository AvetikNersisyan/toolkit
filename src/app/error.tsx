"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { ProblemPage } from "@/components/SiteChrome";

// Shown when a page throws (for example the database is briefly unreachable).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // reset() alone only re-renders on the client; refresh() refetches the page from the server.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <ProblemPage
      title="Ինչ-որ բան այն չէ"
      text="Էջը չհաջողվեց բացել։ Փորձեք կրկին մի քանի վայրկյանից կամ զանգահարեք մեզ՝ պատվերը կընդունենք հեռախոսով։"
    >
      <button
        type="button"
        onClick={retry}
        className="flex min-h-12 items-center rounded-lg border border-line px-6 font-bold"
      >
        Փորձել կրկին
      </button>
    </ProblemPage>
  );
}
