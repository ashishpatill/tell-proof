"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Studio control panel retired — create runs implicitly from Home.
 * Deep links (`?brief=`) hand off to Home and start the create pipeline.
 */
function StudioHandoff() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const brief = params.get("brief")?.trim();
    if (brief && typeof window !== "undefined") {
      sessionStorage.setItem("tell-pending-create", brief);
    }
    router.replace("/");
  }, [params, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-text">
      <div>
        <p className="font-mono text-meta uppercase tracking-[0.14em] text-secondary">Creating site</p>
        <p className="mt-2 font-display text-2xl">Handing off to Home…</p>
        <p className="mt-2 text-sm text-secondary">
          Tell will match niche, run research routing, and render a preview without the old Studio form.
        </p>
      </div>
    </main>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-bg text-secondary">Starting…</main>
      }
    >
      <StudioHandoff />
    </Suspense>
  );
}
