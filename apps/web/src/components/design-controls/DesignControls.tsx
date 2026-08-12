"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ACCENT_OPTIONS,
  DENSITY_OPTIONS,
  FIDELITY_OPTIONS,
  GOAL_OPTIONS,
  LEAN_OPTIONS_COMPACT,
  LEAN_OPTIONS_FULL,
  MOOD_OPTIONS,
  MOTION_OPTIONS_COMPACT,
  MOTION_OPTIONS_FULL,
  ROUNDING_OPTIONS,
  SURFACE_OPTIONS_COMPACT,
  SURFACE_OPTIONS_FULL,
  TYPE_OPTIONS,
  labelForOption,
  type DesignControlOption,
  type DesignControlsValue,
} from "@/lib/design-controls-catalog";
import "./design-controls.css";

export type DesignControlsLayout = "compact" | "sidebar";

export type DesignControlsProps = {
  value: DesignControlsValue;
  onChange: (next: DesignControlsValue) => void;
  layout?: DesignControlsLayout;
  className?: string;
  /** Optional id prefix for a11y; defaults to generated id. */
  id?: string;
};

type ChipKey =
  | "surface"
  | "goal"
  | "fidelity"
  | "lean"
  | "mood"
  | "motion"
  | "density"
  | "more";

function patchValue(
  value: DesignControlsValue,
  patch: Partial<DesignControlsValue>,
): DesignControlsValue {
  return { ...value, ...patch };
}

export function DesignControls({
  value,
  onChange,
  layout = "compact",
  className = "",
  id: idProp,
}: DesignControlsProps) {
  const reactId = useId();
  const rootId = idProp ?? `dc-${reactId}`;
  const [open, setOpen] = useState<ChipKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const surfaceOptions = layout === "compact" ? SURFACE_OPTIONS_COMPACT : SURFACE_OPTIONS_FULL;
  const leanOptions = layout === "compact" ? LEAN_OPTIONS_COMPACT : LEAN_OPTIONS_FULL;
  const motionOptions = layout === "compact" ? MOTION_OPTIONS_COMPACT : MOTION_OPTIONS_FULL;

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const setField = <K extends keyof DesignControlsValue>(key: K, next: DesignControlsValue[K]) => {
    onChange(patchValue(value, { [key]: next } as Partial<DesignControlsValue>));
    if (key !== "typographyWeight" && key !== "roundingDepth" && key !== "accentToken") {
      close();
    }
  };

  const moreActive =
    value.typographyWeight !== "medium-modern" ||
    value.roundingDepth !== "soft" ||
    value.accentToken !== "terracotta";

  return (
    <div
      ref={rootRef}
      className={`tell-dc tell-dc--${layout} ${className}`.trim()}
      data-testid="design-controls"
      data-layout={layout}
      id={rootId}
    >
      <ChipDropdown
        id={`${rootId}-surface`}
        label="Surface"
        display={labelForOption(surfaceOptions, value.siteKind, value.siteKind)}
        open={open === "surface"}
        onToggle={() => setOpen((o) => (o === "surface" ? null : "surface"))}
        options={surfaceOptions}
        value={value.siteKind}
        onSelect={(v) => setField("siteKind", v)}
        wide
      />
      <ChipDropdown
        id={`${rootId}-goal`}
        label="Goal"
        display={labelForOption(GOAL_OPTIONS, value.businessGoal)}
        open={open === "goal"}
        onToggle={() => setOpen((o) => (o === "goal" ? null : "goal"))}
        options={GOAL_OPTIONS}
        value={value.businessGoal}
        onSelect={(v) => setField("businessGoal", v)}
      />
      <ChipDropdown
        id={`${rootId}-fidelity`}
        label="Fidelity"
        display={labelForOption(FIDELITY_OPTIONS, value.fidelity)}
        open={open === "fidelity"}
        onToggle={() => setOpen((o) => (o === "fidelity" ? null : "fidelity"))}
        options={FIDELITY_OPTIONS}
        value={value.fidelity}
        onSelect={(v) => setField("fidelity", v)}
      />
      <ChipDropdown
        id={`${rootId}-lean`}
        label="Lean"
        display={labelForOption(leanOptions, value.aestheticLean, labelForOption(LEAN_OPTIONS_FULL, value.aestheticLean))}
        open={open === "lean"}
        onToggle={() => setOpen((o) => (o === "lean" ? null : "lean"))}
        options={leanOptions}
        value={value.aestheticLean}
        onSelect={(v) => setField("aestheticLean", v)}
      />
      <ChipDropdown
        id={`${rootId}-mood`}
        label="Mood"
        display={labelForOption(MOOD_OPTIONS, value.colorMood)}
        open={open === "mood"}
        onToggle={() => setOpen((o) => (o === "mood" ? null : "mood"))}
        options={MOOD_OPTIONS}
        value={value.colorMood}
        onSelect={(v) => setField("colorMood", v)}
      />
      <ChipDropdown
        id={`${rootId}-motion`}
        label="Motion"
        display={labelForOption(motionOptions, value.motion, labelForOption(MOTION_OPTIONS_FULL, value.motion))}
        open={open === "motion"}
        onToggle={() => setOpen((o) => (o === "motion" ? null : "motion"))}
        options={motionOptions}
        value={value.motion}
        onSelect={(v) => setField("motion", v)}
        className={layout === "compact" ? "tell-dc__chip--desktop" : undefined}
      />
      <ChipDropdown
        id={`${rootId}-density`}
        label="Density"
        display={labelForOption(DENSITY_OPTIONS, value.density)}
        open={open === "density"}
        onToggle={() => setOpen((o) => (o === "density" ? null : "density"))}
        options={DENSITY_OPTIONS}
        value={value.density}
        onSelect={(v) => setField("density", v)}
        className={layout === "compact" ? "tell-dc__chip--desktop" : undefined}
      />

      <div className={`tell-dc__more-wrap${open === "more" ? " is-open" : ""}`}>
        <button
          type="button"
          className="tell-dc__chip tell-dc__chip--more"
          aria-expanded={open === "more"}
          aria-controls={`${rootId}-more-panel`}
          data-active={moreActive || open === "more" ? "true" : "false"}
          onClick={() => setOpen((o) => (o === "more" ? null : "more"))}
        >
          <span className="tell-dc__chip-value tell-dc__chip-value--solo">
            {layout === "compact" ? (
              <>
                <span className="tell-dc__more-full">More</span>
                <span className="tell-dc__more-short">+ More</span>
              </>
            ) : (
              "More"
            )}
          </span>
        </button>
        {open === "more" ? (
          <div
            id={`${rootId}-more-panel`}
            className="tell-dc__more-sheet"
            role="dialog"
            aria-label="Type, rounding, and accent"
          >
            {layout === "compact" ? (
              <div className="tell-dc__more-mobile-extra">
                <SegmentRow
                  label="Motion"
                  options={MOTION_OPTIONS_COMPACT}
                  value={value.motion}
                  onSelect={(v) => setField("motion", v)}
                />
                <SegmentRow
                  label="Density"
                  options={DENSITY_OPTIONS}
                  value={value.density}
                  onSelect={(v) => setField("density", v)}
                />
              </div>
            ) : null}
            <SegmentRow
              label="Type"
              options={TYPE_OPTIONS}
              value={value.typographyWeight}
              onSelect={(v) => setField("typographyWeight", v)}
            />
            <SegmentRow
              label="Rounding"
              options={ROUNDING_OPTIONS}
              value={value.roundingDepth}
              onSelect={(v) => setField("roundingDepth", v)}
            />
            <SegmentRow
              label="Accent"
              options={ACCENT_OPTIONS}
              value={value.accentToken}
              onSelect={(v) => setField("accentToken", v)}
            />
            <p className="tell-dc__more-note">
              Hidden from the default bar. Shared with Studio — Tell palette only.
            </p>
          </div>
        ) : null}
      </div>

      {layout === "sidebar" ? (
        <p className="tell-dc__footnote">Tell-owned SiteKind + taste codes — never third-party starters.</p>
      ) : null}
    </div>
  );
}

function ChipDropdown<T extends string>({
  id,
  label,
  display,
  open,
  onToggle,
  options,
  value,
  onSelect,
  wide,
  className,
}: {
  id: string;
  label: string;
  display: string;
  open: boolean;
  onToggle: () => void;
  options: readonly DesignControlOption<T>[];
  value: T;
  onSelect: (v: T) => void;
  wide?: boolean;
  className?: string;
}) {
  const listId = `${id}-list`;
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      if (!open) {
        e.preventDefault();
        onToggle();
        return;
      }
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = options[(activeIndex + 1) % options.length];
      if (next) onSelect(next.value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = options[(activeIndex - 1 + options.length) % options.length];
      if (next) onSelect(next.value);
    } else if (e.key === "Home") {
      e.preventDefault();
      const first = options[0];
      if (first) onSelect(first.value);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = options[options.length - 1];
      if (last) onSelect(last.value);
    }
  };

  return (
    <div className={`tell-dc__chip-wrap${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        id={id}
        className="tell-dc__chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        data-active={open ? "true" : "false"}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <span className="tell-dc__chip-label">{label}</span>
        <span className="tell-dc__chip-value">{display}</span>
        <span className="tell-dc__chip-caret" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          className={`tell-dc__menu${wide ? " tell-dc__menu--wide" : ""}`}
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className="tell-dc__option"
                data-selected={opt.value === value ? "true" : "false"}
                onClick={() => onSelect(opt.value)}
              >
                <span className="tell-dc__option-label">{opt.label}</span>
                {opt.hint ? <span className="tell-dc__option-hint">{opt.hint}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SegmentRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly DesignControlOption<T>[];
  value: T;
  onSelect: (v: T) => void;
}): ReactNode {
  return (
    <div className="tell-dc__segment" role="group" aria-label={label}>
      <span className="tell-dc__segment-label">{label}</span>
      <div className="tell-dc__segment-row">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="tell-dc__segment-btn"
            data-active={opt.value === value ? "true" : "false"}
            aria-pressed={opt.value === value}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
