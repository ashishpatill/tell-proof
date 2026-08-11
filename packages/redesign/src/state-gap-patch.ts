// Targeted StateGap patch — hover / focus-visible / disabled on controls.
// Used when Draft fix is scoped to drift-state-gap so we never answer a state-matrix
// finding with a full-page palette restyle (the "insignificant / bad basic change" bug).

export type StateGapCoverage = {
  hover: number;
  focus: number;
  disabled: number;
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "your page";
  }
}

/** CSS that fills the interactive state matrix without touching brand color/type. */
export function stateGapCss(): string {
  return `/* Tell · StateGap — interactive state matrix (not a recolor) */
button:hover,
[role="button"]:hover,
input[type="submit"]:hover,
input[type="button"]:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}
a:hover {
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
button:disabled,
[aria-disabled="true"],
input:disabled,
select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.2);
}
@media (prefers-reduced-motion: reduce) {
  button:hover,
  [role="button"]:hover,
  input[type="submit"]:hover,
  input[type="button"]:hover {
    transform: none;
  }
}
`;
}

export function buildStateGapPatch(
  url: string,
  coverage: StateGapCoverage,
  facts?: { missingHover?: number; probeCount?: number },
): { file: string; unifiedDiff: string; summary: string }[] {
  const file = "tell-state-matrix.css";
  const body = stateGapCss();
  const lines = body.trimEnd().split("\n");
  const hunk = lines.map((l) => `+${l}`).join("\n");
  const unifiedDiff = `diff --git a/${file} b/${file}
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/${file}
@@ -0,0 +1,${lines.length} @@
${hunk}`;
  const missing = facts?.missingHover;
  const total = facts?.probeCount;
  const countBit =
    typeof missing === "number" && typeof total === "number"
      ? `${missing}/${total} controls missing hover`
      : `${Math.round((1 - coverage.hover) * 100)}% of probes lack hover`;
  return [
    {
      file,
      summary: `StateGap for ${hostOf(url)} — ${countBit}. Adds :hover, :focus-visible, and :disabled on controls. Import after your global stylesheet; do not treat this as a brand restyle.`,
      unifiedDiff,
    },
  ];
}
