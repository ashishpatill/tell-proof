"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Progressive-enhancement reveal. Content paints immediately (CSS never blanks).
 * After first paint, arm the root so below-fold nodes may animate in once.
 */
export function CreaseRevealRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-crease-reveal-root]");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => n.setAttribute("data-in", "1"));
      return;
    }

    let cancelled = false;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const markVisible = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.05 && r.bottom > 0) {
        el.setAttribute("data-in", "1");
      }
    };
    const arm = () => {
      if (cancelled) return;
      nodes.forEach(markVisible);
      root.classList.add("cr-reveal-armed");
    };

    let idleHandle: number | undefined;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(arm, { timeout: 400 });
    } else {
      idleHandle = window.setTimeout(arm, 120);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).setAttribute("data-in", "1");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((n) => io.observe(n));

    return () => {
      cancelled = true;
      io.disconnect();
      if (idleHandle == null) return;
      if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
    };
  }, []);

  return <div data-crease-reveal-root>{children}</div>;
}
