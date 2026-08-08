"use client";

import { useEffect, useRef, useState } from "react";
import { createFrameAnimator } from "@/lib/frame-animator";
import {
  EXPLODE_FRAME_COUNT,
  EXPLODE_FRAMES,
  PIP_FRAME_COUNT,
  PIP_FRAMES,
  REED_FRAME_COUNT,
  REED_FRAMES,
} from "./character-frames";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function SpriteHost({
  className,
  frames,
  frame,
  label,
}: {
  className: string;
  frames: string[];
  frame: number;
  label: string;
}) {
  const safe = frames[Math.min(Math.max(0, frame), frames.length - 1)] ?? frames[0] ?? "";
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export function KineticExperience() {
  const stageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const makesHookRef = useRef<HTMLSpanElement>(null);
  const reedAnchorRef = useRef<HTMLDivElement>(null);
  const pipAnchorRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLElement>(null);
  const [reedFrame, setReedFrame] = useState(0);
  const [pipFrame, setPipFrame] = useState(0);
  const [explodeFrame, setExplodeFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pointerHint, setPointerHint] = useState(true);
  const reduced = useRef(false);

  /** Pin Reed's hand to the right edge of “makes” — composition lock, not free float. */
  useEffect(() => {
    const pinReedToMakes = () => {
      const hero = heroRef.current;
      const hook = makesHookRef.current;
      const reed = reedAnchorRef.current;
      if (!hero || !hook || !reed) return;
      if (window.matchMedia("(max-width: 900px)").matches) {
        reed.style.removeProperty("left");
        reed.style.removeProperty("top");
        return;
      }
      const hr = hero.getBoundingClientRect();
      const hk = hook.getBoundingClientRect();
      const reedW = Math.max(reed.offsetWidth, 1);
      const reedH = Math.max(reed.offsetHeight, 1);
      // viewBox hand (~ -20) maps near the left of the SVG box
      const handFracX = 0.03;
      const handFracY = 0.4;
      const left = hk.left - hr.left - reedW * handFracX;
      const top = hk.top + hk.height * 0.5 - hr.top - reedH * handFracY;
      reed.style.setProperty("left", `${Math.round(left)}px`);
      reed.style.setProperty("top", `${Math.round(top)}px`);
    };

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => requestAnimationFrame(pinReedToMakes));
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    if (heroRef.current) ro.observe(heroRef.current);
    if (reedAnchorRef.current) ro.observe(reedAnchorRef.current);
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    const t1 = window.setTimeout(schedule, 50);
    const t2 = window.setTimeout(schedule, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
    const reed = createFrameAnimator({
      frameCount: REED_FRAME_COUNT,
      circular: true,
      smoothTime: 0.12,
      maxSpeed: REED_FRAME_COUNT * 2.2,
      reducedMotion: reduced.current,
      initialFrame: 2,
      render: setReedFrame,
    });
    const pip = createFrameAnimator({
      frameCount: PIP_FRAME_COUNT,
      circular: true,
      smoothTime: 0.16,
      maxSpeed: PIP_FRAME_COUNT * 1.8,
      reducedMotion: reduced.current,
      initialFrame: 1,
      render: setPipFrame,
    });
    const explode = createFrameAnimator({
      frameCount: EXPLODE_FRAME_COUNT,
      circular: false,
      smoothTime: 0.14,
      maxSpeed: EXPLODE_FRAME_COUNT * 2,
      reducedMotion: reduced.current,
      render: setExplodeFrame,
    });

    let lastX = 0;
    let lastY = 0;
    let hasPointer = false;

    const aimFromPoint = (clientX: number, clientY: number) => {
      lastX = clientX;
      lastY = clientY;
      hasPointer = true;
      setPointerHint(false);

      const reedBox = reedAnchorRef.current?.getBoundingClientRect();
      const pipBox = pipAnchorRef.current?.getBoundingClientRect();
      if (reedBox) {
        const ax = reedBox.left + reedBox.width * 0.45;
        const ay = reedBox.top + reedBox.height * 0.28;
        reed.setDirection(clientX - ax, clientY - ay, -Math.PI * 0.5);
      }
      if (pipBox) {
        const ax = pipBox.left + pipBox.width * 0.45;
        const ay = pipBox.top + pipBox.height * 0.35;
        pip.setDirection(clientX - ax, clientY - ay, -Math.PI * 0.35);
      }
    };

    const onPointer = (e: PointerEvent) => aimFromPoint(e.clientX, e.clientY);

    const onScrollOrResize = () => {
      if (hasPointer) aimFromPoint(lastX, lastY);

      const el = scrubRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const view = window.innerHeight || 1;
      // Progress while the scrub section travels through the viewport.
      const start = view * 0.85;
      const end = -rect.height * 0.2;
      const raw = (start - rect.top) / (start - end);
      const p = Math.min(1, Math.max(0, raw));
      setProgress(p);
      explode.setProgress(p);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    onScrollOrResize();

    // Idle breathe: slow look-around when no pointer yet.
    let idle = 0;
    const idleTimer = window.setInterval(() => {
      if (hasPointer || reduced.current) return;
      idle += 1;
      reed.setTarget((idle * 0.35) % REED_FRAME_COUNT);
      pip.setTarget((idle * 0.28 + 3) % PIP_FRAME_COUNT);
    }, 900);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.clearInterval(idleTimer);
      reed.destroy();
      pip.destroy();
      explode.destroy();
    };
  }, []);

  return (
    <div className="kn-root" data-testid="kinetic-template">
      <div className="kn-atmosphere" aria-hidden="true">
        <span className="kn-blob kn-blob-a" />
        <span className="kn-blob kn-blob-b" />
        <span className="kn-blob kn-blob-c" />
      </div>

      <header className="kn-top">
        <a className="kn-brand-mark" href="/kinetic">
          Mote
        </a>
        <nav className="kn-nav" aria-label="Primary">
          <a href="#stage">Stage</a>
          <a href="#scrub">Scrub</a>
          <a href="#method">Method</a>
          <a className="kn-nav-cta" href="/showcase">
            Tell Specimens
          </a>
        </nav>
      </header>

      <section className="kn-plate" id="stage" ref={stageRef} aria-labelledby="kn-hero-title">
        <div className="kn-grid" aria-hidden="true" />
        <div className="kn-hero" ref={heroRef}>
          <div className="kn-copy">
            <h1 id="kn-hero-title" className="kn-display">
              <span className="kn-display-brand">
                Mote<sup>®</sup>
              </span>
              <span className="kn-display-makes">
                makes
                <span className="kn-makes-hook" ref={makesHookRef} aria-hidden="true" />
              </span>
              <span className="kn-display-motion">motion.</span>
            </h1>
            <p className="kn-meta">
              <span className="kn-meta-name">MO · TE</span>
              ENGINEER / DESIGNER / INTERACTIVE MOTION
            </p>
          </div>

          <div className="kn-cast" aria-live="polite">
            <div className="kn-reed-wrap" ref={reedAnchorRef}>
              <SpriteHost
                className="kn-reed"
                frames={REED_FRAMES}
                frame={reedFrame}
                label="Reed, a line-art character whose gaze follows the pointer"
              />
              <span className="kn-lean-note" aria-hidden="true">
                leans on the type
              </span>
            </div>
            <div className="kn-pip-wrap" ref={pipAnchorRef}>
              <SpriteHost
                className="kn-pip"
                frames={PIP_FRAMES}
                frame={pipFrame}
                label="Pip, a fox companion that tracks the pointer"
              />
            </div>
            {pointerHint ? (
              <p className="kn-hint">
                Move the pointer — they turn to follow
              </p>
            ) : null}
          </div>
        </div>
        <p className="kn-scroll-cue">
          <span aria-hidden="true">↓</span> scroll the explode
        </p>
      </section>

      <section
        className="kn-scrub"
        id="scrub"
        ref={scrubRef}
        aria-labelledby="kn-scrub-title"
      >
        <div className="kn-scrub-sticky">
          <div className="kn-scrub-copy">
            <p className="kn-kicker">Scroll → frame</p>
            <h2 id="kn-scrub-title">Intact → spin → explode</h2>
            <p className="kn-lede">
              Key states lock the start, middle, and end. Continuous frames fill the path between
              them. Scroll progress maps to frame index — reverse scroll plays the same strip
              backward.
            </p>
            <div className="kn-readout" aria-hidden="true">
              <strong>{String(explodeFrame + 1).padStart(2, "0")}</strong>
              <span>/ {String(EXPLODE_FRAME_COUNT).padStart(2, "0")}</span>
              <span className="kn-bar">
                <i style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </div>
            <p className="kn-scrub-hint">Scroll to scrub · reverse to rewind</p>
          </div>
          <div className="kn-scrub-stage">
            <div className="kn-film">
              <SpriteHost
                className="kn-explode"
                frames={EXPLODE_FRAMES}
                frame={explodeFrame}
                label="Product explode sequence driven by scroll progress"
              />
              <div className="kn-film-perf" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="kn-method" id="method" aria-labelledby="kn-method-title">
        <p className="kn-kicker">Workflow</p>
        <h2 id="kn-method-title">From keyframes to controllable progress</h2>
        <ol className="kn-steps">
          <li>
            <strong>Lock key states</strong>
            <span>Confirm start, middle, and end appearances before generating motion.</span>
          </li>
          <li>
            <strong>Fill continuous action</strong>
            <span>Generate the in-between path as a motion master, not the final asset.</span>
          </li>
          <li>
            <strong>Clean the strip</strong>
            <span>Drop pauses, repeats, and broken frames; size for real CSS display.</span>
          </li>
          <li>
            <strong>Map input → progress</strong>
            <span>Pointer angle, scroll, drag, or orientation drives the same frame animator.</span>
          </li>
        </ol>
        <div className="kn-drivers">
          <article>
            <h3>Pointer</h3>
            <p>Circular parameter. Angle from character anchor → frame on a closed loop.</p>
          </article>
          <article>
            <h3>Scroll</h3>
            <p>Linear parameter. Section progress → `currentFrame` with smoothDamp tracking.</p>
          </article>
          <article>
            <h3>Reduced motion</h3>
            <p>Settles on the target frame immediately; idle look-around is disabled.</p>
          </article>
        </div>
      </section>

      <footer className="kn-foot">
        <p>
          Mote template · pointer + scroll frame mapping · built for Tell specimens
        </p>
        <a href="/showcase">Back to gallery</a>
      </footer>
    </div>
  );
}
