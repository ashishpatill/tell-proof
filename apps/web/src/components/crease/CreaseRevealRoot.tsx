"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Progressive-enhancement reveal. Content paints immediately (CSS never blanks).
 * useLayoutEffect re-arms on soft nav before paint so a persisted armed class
 * cannot hide the new route’s [data-reveal] nodes for a frame.
 */
export function CreaseRevealRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.remove("cr-reveal-armed");
    root.querySelectorAll<HTMLElement>("[data-reveal][data-in='1']").forEach((n) => {
      n.removeAttribute("data-in");
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (reduce) {
      nodes.forEach((n) => n.setAttribute("data-in", "1"));
      return;
    }

    const markVisible = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.05 && r.bottom > 0) {
        el.setAttribute("data-in", "1");
      }
    };

    nodes.forEach(markVisible);
    root.classList.add("cr-reveal-armed");

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
    nodes.forEach((n) => {
      if (n.getAttribute("data-in") === "1") return;
      io.observe(n);
    });

    return () => io.disconnect();
  }, [pathname]);

  return (
    <div ref={rootRef} data-crease-reveal-root>
      {children}
    </div>
  );
}
