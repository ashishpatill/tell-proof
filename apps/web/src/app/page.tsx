"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Github,
  Link2,
  Loader2,
  Mic,
  MicOff,
  Wand2,
} from "lucide-react";
import type { BrandDNA, RedesignProposal, TellReport, UserDesignProfile, Verdict } from "@tell/schema";
import { DIRECTION_PRESETS, parseDirectionPlan, type DirectionPlan } from "@tell/taste";
import { RECONCILE_DIRECTIONS, buildOverridesPatch, learnBrandDNA, reconcile, resolveDirection } from "@tell/redesign";
import { demoReport } from "@/lib/demo-report";
import dynamic from "next/dynamic";
import { ConnectAgent } from "@/components/ConnectAgent";
import { useLlmRestyle } from "@/lib/use-llm-restyle";
import { useVoice } from "@/lib/use-voice";
import { SETUP_ACTIVE_STATES, type SetupJob } from "@/lib/setup-types";
import { discoverRoutes, routeFromInput, type DiscoveredRoute } from "@/lib/discover-routes";
import { matrixTarget } from "@/lib/matrix-target";
import {
  loadUserDesignProfile,
  recordDirectionSession,
  recordToolPreference,
  suggestedDirectionId,
  topPriorities,
} from "@/lib/user-session-learn";
import { byokHeaders } from "@/lib/byok";
import {
  DEFAULT_CAPTURE_URL,
  isGitHubRepoUrl,
  normalizeCaptureUrl,
  sameOrigin,
  siteLabel,
} from "@/lib/capture-url";
import {
  loadRecentSessions,
  newSessionId,
  sessionTitleFromBrief,
  sessionTitleFromUrl,
  upsertRecentSession,
  type ComposerMode,
  type RecentSession,
} from "@/lib/recent-sessions";
import { svgSessionThumb, thumbFromScreenshotBase64 } from "@/lib/session-thumb";
import {
  AppShell,
  EntryHome,
  EntryNavRail,
  ProjectWorkspace,
  SettingsDialog,
  WorkspaceTabsBar,
  type WorkspaceTab,
} from "@/components/shell";
import {
  BrandDnaBar,
  ConfidenceMeter,
  DiffViewer,
  OperationCurtain,
  OperationPlaceholder,
  PagesStrip,
  ReconciliationTable,
  ScenarioMatrixPanel,
  Scorecard,
  SetupPanel,
  STATE_LABEL,
  ToastNotice,
  VerdictBadge,
  VerifiedProofPanel,
  WhatChangedList,
  WorkflowRail,
  type CaptureMeta,
  type CaptureState,
  type DraftState,
  type MatrixCellSummary,
  type MatrixProofSummary,
  type ProofResult,
  type ProofState,
  type SourceContext,
  type UiNotice,
} from "@/components/report";

const BeforeAfterSeam = dynamic(
  () => import("@/components/BeforeAfterSeam").then((m) => m.BeforeAfterSeam),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[280px] rounded-card border border-border bg-surface-raised/40"
        data-testid="seam-loading"
        aria-busy="true"
      />
    ),
  },
);

const PRESET_CHIPS: { key: string; label: string }[] = [
  { key: "editorial", label: "Editorial" },
  { key: "precision", label: "Precision instrument" },
  { key: "warm-minimal", label: "Warm minimal" },
  { key: "bold-contrast", label: "Bold contrast" },
  { key: "luxury", label: "Classic luxury" },
  { key: "brutalist", label: "Brutalist utility" },
  { key: "explainer", label: "Visual textbook" },
];

export default function HomePage() {
  const [report, setReport] = useState<TellReport>(demoReport);
  const [inputUrl, setInputUrl] = useState(DEFAULT_CAPTURE_URL);
  const [captureMeta, setCaptureMeta] = useState<CaptureMeta | null>(null);
  const [selectedId, setSelectedId] = useState(demoReport.findings[0]?.id ?? "");
  const [seam, setSeam] = useState(50);
  const [directionId, setDirectionId] = useState("editorial");
  const [captureState, setCaptureState] = useState<CaptureState>("done");
  const [captureNote, setCaptureNote] = useState("");
  const [proposal, setProposal] = useState<RedesignProposal | null>(null);
  const [draftState, setDraftState] = useState<DraftState>("idle");
  const [draftError, setDraftError] = useState("");
  const [sourceContext, setSourceContext] = useState<SourceContext | null>(null);
  const [proofState, setProofState] = useState<ProofState>("idle");
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [proofError, setProofError] = useState("");
  const [directionPlan, setDirectionPlan] = useState<DirectionPlan | null>(null);
  const [directionParsing, setDirectionParsing] = useState(false);
  const [directionSource, setDirectionSource] = useState<"gemini" | "local" | null>(null);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uiNotice, setUiNotice] = useState<UiNotice | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [sharingReport, setSharingReport] = useState(false);

  // ── Shell: entry home + project tabs ──
  const [shellView, setShellView] = useState<"home" | "project">("home");
  const [composerMode, setComposerMode] = useState<ComposerMode>("url");
  const [composerValue, setComposerValue] = useState("");
  const [sessionId, setSessionId] = useState(() => newSessionId());
  const [sessionTitle, setSessionTitle] = useState("Session");
  const [designBrief, setDesignBrief] = useState("");
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusCanvas, setFocusCanvas] = useState(false);
  const [mobilePane, setMobilePane] = useState<"critic" | "canvas">("canvas");
  const [openTabs, setOpenTabs] = useState<WorkspaceTab[]>([]);

  // ── GitHub repo setup ──
  const [setupJob, setSetupJob] = useState<SetupJob | null>(null);
  const [setupError, setSetupError] = useState("");
  const [setupStarting, setSetupStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCapturedRef = useRef<string | null>(null);

  // ── Multi-page scanning ──
  const [pages, setPages] = useState<DiscoveredRoute[]>([]);
  const [pageInput, setPageInput] = useState("");
  const [scanningAll, setScanningAll] = useState(false);

  // ── Live scenario matrix (route × viewport × theme × interaction × auth) ──
  const [matrixState, setMatrixState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [matrixProof, setMatrixProof] = useState<MatrixProofSummary | null>(null);
  const [matrixError, setMatrixError] = useState("");

  // ── Brand DNA memory (learned once, used as the redesign target + scoring yardstick) ──
  const [brandDna, setBrandDna] = useState<BrandDNA | null>(null);
  // ── Per-user session learning (browser-local; not developer corpus) ──
  const [userProfile, setUserProfile] = useState<UserDesignProfile | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tell:brand-dna");
      if (raw) setBrandDna(JSON.parse(raw) as BrandDNA);
    } catch {
      /* ignore malformed cache */
    }
    setRecent(loadRecentSessions());
    const profile = loadUserDesignProfile();
    setUserProfile(profile);
    const suggested = suggestedDirectionId(profile);
    if (suggested && Object.prototype.hasOwnProperty.call(RECONCILE_DIRECTIONS, suggested)) {
      setDirectionId(suggested);
    }
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("report")) {
      setShellView("project");
    }
  }, []);

  const learnFromDirection = useCallback((plan: DirectionPlan, phrase: string) => {
    setUserProfile((prev) =>
      recordDirectionSession(prev ?? loadUserDesignProfile(), {
        presetId: plan.presetId,
        phrase,
        actionCategories: plan.actionItems.map((a) => a.category),
      }),
    );
  }, []);

  const reconciliation = useMemo(
    () => reconcile(report.capture, report.fingerprint, report.findings, directionId, brandDna ?? undefined),
    [report, directionId, brandDna],
  );

  // v2: deterministic reconciliation ships instantly above; this fires the Gemini-refined
  // sheet in the background (debounced/abortable) and resets whenever direction/capture/DNA changes.
  const llmRestyle = useLlmRestyle({
    capture: report.capture,
    fingerprint: report.fingerprint,
    directionId,
    dna: brandDna ?? undefined,
    enabled: Boolean(report.capture.snapshotHtml),
  });

  const verdictOf = useCallback(
    (id: string): Verdict => report.verdicts.find((v) => v.findingId === id)?.verdict ?? "uncertain",
    [report],
  );

  const applyDirectionPlan = useCallback((plan: DirectionPlan) => {
    setDirectionPlan(plan);
    setDirectionId(resolveDirection(plan.presetId).id);
    setProposal(null);
    setDraftState("idle");
  }, []);

  const scheduleDirectionParse = useCallback(
    (text: string) => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setDirectionPlan(null);
        setDirectionSource(null);
        return;
      }

      applyDirectionPlan(parseDirectionPlan(trimmed));
      setDirectionSource("local");

      parseTimerRef.current = setTimeout(async () => {
        setDirectionParsing(true);
        try {
          const res = await fetch("/api/voice", {
            method: "POST",
            headers: byokHeaders(),
            body: JSON.stringify({ transcript: trimmed }),
          });
          if (res.ok) {
            const payload = (await res.json()) as DirectionPlan & { source?: "gemini" | "local" };
            applyDirectionPlan(payload);
            setDirectionSource(payload.source ?? "local");
            learnFromDirection(payload, trimmed);
            setUserProfile((prev) =>
              recordToolPreference(prev ?? loadUserDesignProfile(), "voice"),
            );
          } else {
            const local = parseDirectionPlan(trimmed);
            learnFromDirection(local, trimmed);
          }
        } catch {
          const local = parseDirectionPlan(trimmed);
          learnFromDirection(local, trimmed);
        } finally {
          setDirectionParsing(false);
        }
      }, 650);
    },
    [applyDirectionPlan, learnFromDirection],
  );

  const onVoiceTranscript = useCallback(
    (text: string) => {
      scheduleDirectionParse(text);
    },
    [scheduleDirectionParse],
  );

  const voice = useVoice(onVoiceTranscript);

  const showNotice = useCallback((notice: UiNotice) => {
    setUiNotice(notice);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setUiNotice(null), notice.tone === "error" ? 12_000 : 7000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sharedId = new URLSearchParams(window.location.search).get("report");
    if (!sharedId) return;
    fetch(`/api/reports/${sharedId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load shared report.");
        setReport(data.report);
        setSelectedId(data.report.findings[0]?.id ?? "");
        setCaptureState("done");
        setCaptureMeta({ live: false, requestedUrl: data.report.capture.url, capturedUrl: data.report.capture.url });
        const sid = newSessionId();
        const title = sessionTitleFromUrl(data.report.capture.url);
        setSessionId(sid);
        setSessionTitle(title);
        setOpenTabs((tabs) => (tabs.some((t) => t.id === sid) ? tabs : [...tabs, { id: sid, title }]));
        setShellView("project");
        showNotice({ tone: "info", title: "Shared report loaded", message: "This is a read-only handoff link." });
      })
      .catch((error) => {
        showNotice({
          tone: "error",
          title: "Shared report unavailable",
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }, [showNotice]);

  const shareReport = useCallback(async () => {
    setSharingReport(true);
    try {
      const res = await fetch("/api/reports/share", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({ report }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = [data.error, data.hint, data.detail].filter(Boolean).join(" — ");
        throw new Error(detail || "Could not create share link.");
      }
      setShareUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      const backendLabel =
        data.backend === "neon" ? "Neon" : data.backend === "blob" ? "Blob" : "this instance";
      showNotice({
        tone: "success",
        title: `Share link copied · ${backendLabel}`,
        message: data.expiresNote ? `${data.url}\n${data.expiresNote}` : data.url,
      });
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Share failed",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSharingReport(false);
    }
  }, [report, showNotice]);

  const learnDna = useCallback(() => {
    const dna = learnBrandDNA(report.capture, report.fingerprint, siteLabel(report.capture.url));
    setBrandDna(dna);
    try {
      localStorage.setItem("tell:brand-dna", JSON.stringify(dna));
    } catch {
      /* storage unavailable — keep it in memory for this session */
    }
    setProposal(null);
    setDraftState("idle");
    showNotice({
      tone: "success",
      title: "Brand DNA saved",
      message: `Tell now scores against ${dna.displayFont} / ${dna.bodyFont} · ${dna.accent}. Redesigns steer toward this brand.`,
    });
  }, [report, showNotice]);

  const clearDna = useCallback(() => {
    setBrandDna(null);
    try {
      localStorage.removeItem("tell:brand-dna");
    } catch {
      /* ignore */
    }
    setProposal(null);
    setDraftState("idle");
    showNotice({ tone: "info", title: "Brand DNA cleared", message: "Back to scoring against the generic baseline." });
  }, [showNotice]);

  useEffect(() => {
    return () => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const selectedFinding = report.findings.find((f) => f.id === selectedId) ?? report.findings[0];
  const verdict = report.verdicts.find((v) => v.findingId === selectedFinding?.id);
  const s = report.score;
  const scoreLine = `${s.total} findings · ${s.generic} generic · ${s.drift} drift · ${s.intentional} intentional`;

  const dirMeta = RECONCILE_DIRECTIONS[directionId] ?? RECONCILE_DIRECTIONS.editorial!;

  const runCapture = useCallback(
    async (url: string) => {
      const rawTarget = url.trim();
      const target = normalizeCaptureUrl(rawTarget);
      if (!target) return;
      if (target !== rawTarget) setInputUrl(target);
      if (proofResult) {
        showNotice({
          tone: "error",
          title: "Resolve the visual worktree first",
          message: "Copy the verified patch or revert the temporary change before capturing another baseline.",
        });
        return;
      }
      setCaptureState("capturing");
      setCaptureNote(`Launching headless browser for ${siteLabel(target)}…`);
      setDraftError("");
      setProposal(null);
      setSourceContext(null);
      setPages([]);
      try {
        const res = await fetch("/api/diagnose", {
          method: "POST",
          headers: byokHeaders(),
          body: JSON.stringify({ url: target }),
        });
        const payload = (await res.json()) as { report: TellReport; meta: CaptureMeta };
        setCaptureNote(
          payload.meta.live
            ? payload.meta.backend === "remote"
              ? "Capture complete — live diagnosis via capture backend."
              : "Capture complete."
            : "Capture failed — loaded offline demo.",
        );
        setReport(payload.report);
        setCaptureMeta(payload.meta);
        setSelectedId(payload.report.findings[0]?.id ?? "");
        setDraftState("idle");
        setSeam(50);
        setCaptureState("done");

        const sid = sessionId || newSessionId();
        setSessionId(sid);
        const title = sessionTitleFromUrl(payload.report.capture.url);
        setSessionTitle(title);
        setOpenTabs((tabs) => {
          const next = tabs.some((t) => t.id === sid) ? tabs : [...tabs, { id: sid, title }];
          return next.map((t) => (t.id === sid ? { ...t, title } : t));
        });
        setRecent(
          upsertRecentSession({
            id: sid,
            title,
            mode: isGitHubRepoUrl(target) ? "github" : "url",
            url: payload.report.capture.url,
            findingCount: payload.report.score.total,
            live: payload.meta.live,
            thumbDataUrl: svgSessionThumb({
              title,
              findingCount: payload.report.score.total,
              live: payload.meta.live,
              accent: payload.report.capture.surfaceTokens?.accent?.includes("rgb")
                ? "#D4714A"
                : payload.report.capture.surfaceTokens?.accent || "#D4714A",
              surface: "#221F1C",
            }),
            updatedAt: new Date().toISOString(),
          }),
        );
        void thumbFromScreenshotBase64(payload.report.capture.screenshotBase64 || "").then((thumb) => {
          if (!thumb) return;
          setRecent(
            upsertRecentSession({
              id: sid,
              title,
              mode: isGitHubRepoUrl(target) ? "github" : "url",
              url: payload.report.capture.url,
              findingCount: payload.report.score.total,
              live: payload.meta.live,
              thumbDataUrl: thumb,
              updatedAt: new Date().toISOString(),
            }),
          );
        });
        if (payload.meta.live) {
          setPages(discoverRoutes(payload.report.capture.snapshotHtml, payload.report.capture.url));
          setDraftError("");
          showNotice({
            tone: "success",
            title: "Capture complete",
            message: `Tell scanned ${siteLabel(payload.report.capture.url)} and found ${payload.report.score.total} findings.`,
          });
        }
        if (!payload.meta.live) {
          setDraftError(payload.meta.error ?? "Live capture failed. Fix Playwright or paste a reachable URL.");
          showNotice({
            tone: "error",
            title: "Capture failed",
            message: payload.meta.error ?? `Tell could not reach ${target}. The offline demo report is showing instead.`,
          });
        }
      } catch {
        setCaptureNote("Capture failed — showing the last committed report.");
        setCaptureState("done");
        setDraftError("Network error while contacting Tell's capture API.");
        showNotice({
          tone: "error",
          title: "Capture failed",
          message: `Network error while capturing ${target}. Check the capture backend and try again.`,
        });
      }
    },
    [proofResult, showNotice],
  );

  const pollSetup = useCallback(
    (id: string) => {
      if (pollRef.current) clearTimeout(pollRef.current);
      const tick = async () => {
        try {
          const res = await fetch(`/api/setup/status?id=${encodeURIComponent(id)}`);
          const data = await res.json();
          if (res.ok && data.job) {
            const job = data.job as SetupJob;
            setSetupJob(job);
            if (job.state === "ready" && job.url && autoCapturedRef.current !== job.url) {
              autoCapturedRef.current = job.url;
              setInputUrl(job.url);
              showNotice({
                tone: "info",
                title: "Repo is running",
                message: `${job.repoLabel} is reachable at ${job.url}. Starting capture now.`,
              });
              void runCapture(job.url);
              return;
            }
            if (SETUP_ACTIVE_STATES.includes(job.state)) {
              pollRef.current = setTimeout(tick, 1200);
            } else if (job.state === "needs-manual" || job.state === "error") {
              showNotice({
                tone: "error",
                title: "Setup needs manual help",
                message: job.error ?? job.step,
              });
            }
          } else {
            pollRef.current = setTimeout(tick, 2000);
          }
        } catch {
          pollRef.current = setTimeout(tick, 2000);
        }
      };
      void tick();
    },
    [runCapture, showNotice],
  );

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  const startSetup = useCallback(
    async (repoUrl: string) => {
      if (proofResult) {
        showNotice({
          tone: "error",
          title: "Resolve the visual worktree first",
          message: "Revert the temporary change before setting up another repository.",
        });
        return;
      }
      setSetupError("");
      setSetupStarting(true);
      setSetupJob(null);
      setSourceContext(null);
      setProofResult(null);
      setProofState("idle");
      setCaptureNote(`Creating setup job for ${repoUrl.trim()}…`);
      autoCapturedRef.current = null;
      try {
        const res = await fetch("/api/setup/start", {
          method: "POST",
          headers: byokHeaders(),
          body: JSON.stringify({ repoUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSetupError(data.error ?? "Could not start setup.");
          showNotice({
            tone: "error",
            title: "Setup failed to start",
            message: data.error ?? "Could not start setup.",
          });
          return;
        }
        setSetupJob(data.job as SetupJob);
        showNotice({
          tone: "info",
          title: "Setup started",
          message: `Cloning and booting ${(data.job as SetupJob).repoLabel}. This can take a minute on first install.`,
        });
        pollSetup((data.job as SetupJob).id);
      } catch {
        setSetupError("Network error starting setup. Is the dev server running?");
        showNotice({
          tone: "error",
          title: "Setup failed to start",
          message: "Network error starting setup. Is the dev server running?",
        });
      } finally {
        setSetupStarting(false);
      }
    },
    [pollSetup, proofResult, showNotice],
  );

  const stopApp = useCallback(async () => {
    if (proofResult) {
      showNotice({
        tone: "error",
        title: "Proof patch is still applied",
        message: "Revert the visual worktree before stopping its dev server.",
      });
      return;
    }
    try {
      await fetch("/api/setup/stop", { method: "POST" });
    } catch {
      /* ignore */
    }
    setSetupJob(null);
    setSetupStarting(false);
  }, [proofResult, showNotice]);


  const openProjectTab = useCallback((id: string, title: string) => {
    setSessionId(id);
    setSessionTitle(title);
    setOpenTabs((tabs) => (tabs.some((t) => t.id === id) ? tabs : [...tabs, { id, title }]));
    setShellView("project");
    setMobilePane("canvas");
  }, []);

  const goHome = useCallback(() => {
    setShellView("home");
    setFocusCanvas(false);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setOpenTabs((tabs) => {
        const next = tabs.filter((t) => t.id !== id);
        if (id === sessionId) {
          if (next.length) {
            setSessionId(next[0]!.id);
            setSessionTitle(next[0]!.title);
            setShellView("project");
          } else {
            setShellView("home");
          }
        }
        return next;
      });
    },
    [sessionId],
  );

  const loadOfflineFixture = useCallback(() => {
    const id = newSessionId();
    const title = "Offline fixture";
    setReport(demoReport);
    setSelectedId(demoReport.findings[0]?.id ?? "");
    setCaptureState("done");
    setCaptureMeta({
      live: false,
      requestedUrl: demoReport.capture.url,
      capturedUrl: demoReport.capture.url,
    });
    setProposal(null);
    setDraftState("idle");
    setSeam(50);
    openProjectTab(id, title);
    setRecent(
      upsertRecentSession({
        id,
        title,
        mode: "offline",
        url: demoReport.capture.url,
        findingCount: demoReport.score.total,
        live: false,
        thumbDataUrl: svgSessionThumb({
          title: siteLabel(demoReport.capture.url),
          findingCount: demoReport.score.total,
          live: false,
          accent: "#8B5CF6",
          surface: "#0F0F0F",
        }),
        updatedAt: new Date().toISOString(),
      }),
    );
    showNotice({
      tone: "info",
      title: "Offline demo loaded",
      message: "Committed fixture report — live capture still available from the composer.",
    });
  }, [openProjectTab, showNotice]);

  const startFromComposer = useCallback(() => {
    if (composerMode === "offline") {
      loadOfflineFixture();
      return;
    }
    const text = composerValue.trim();
    if (!text) return;

    if (composerMode === "design") {
      const id = newSessionId();
      const title = sessionTitleFromBrief(text);
      setDesignBrief(text);
      voice.setTranscript(text);
      scheduleDirectionParse(text);
      setReport(demoReport);
      setCaptureMeta(null);
      setCaptureState("idle");
      openProjectTab(id, title);
      setRecent(
        upsertRecentSession({
          id,
          title,
          mode: "design",
          brief: text,
          thumbDataUrl: svgSessionThumb({
            title,
            accent: "#D4714A",
            surface: "#221F1C",
          }),
          updatedAt: new Date().toISOString(),
        }),
      );
      showNotice({
        tone: "info",
        title: "Direction primed",
        message: "Paste a live URL or GitHub repo in the project bar to ground this brief — or open Studio.",
      });
      return;
    }

    setInputUrl(text);
    const id = newSessionId();
    if (composerMode === "github" || isGitHubRepoUrl(text)) {
      openProjectTab(id, sessionTitleFromBrief(text));
      void startSetup(text);
    } else {
      openProjectTab(id, sessionTitleFromUrl(normalizeCaptureUrl(text) || text));
      void runCapture(text);
    }
  }, [
    composerMode,
    composerValue,
    loadOfflineFixture,
    openProjectTab,
    scheduleDirectionParse,
    showNotice,
    startSetup,
    runCapture,
    voice,
  ]);

  const openRecent = useCallback(
    (session: RecentSession) => {
      openProjectTab(session.id, session.title);
      if (session.mode === "offline") {
        loadOfflineFixture();
        return;
      }
      if (session.mode === "design" && session.brief) {
        setDesignBrief(session.brief);
        setComposerMode("design");
        setComposerValue(session.brief);
        voice.setTranscript(session.brief);
        scheduleDirectionParse(session.brief);
        setCaptureMeta(null);
        setCaptureState("idle");
        return;
      }
      if (session.url) {
        setInputUrl(session.url);
        setComposerValue(session.url);
        if (session.mode === "github" || isGitHubRepoUrl(session.url)) {
          void startSetup(session.url);
        } else {
          void runCapture(session.url);
        }
      }
    },
    [loadOfflineFixture, openProjectTab, runCapture, scheduleDirectionParse, startSetup, voice],
  );


  const isRepo = isGitHubRepoUrl(inputUrl);
  const normalizedInputUrl = normalizeCaptureUrl(inputUrl);
  const setupActive = setupStarting || Boolean(setupJob && SETUP_ACTIVE_STATES.includes(setupJob.state));
  const operationActive = setupActive || captureState === "capturing";
  const operationTitle = setupStarting
    ? "Starting repo setup"
    : setupJob && SETUP_ACTIVE_STATES.includes(setupJob.state)
      ? `${STATE_LABEL[setupJob.state]} ${setupJob.repoLabel}`
      : captureState === "capturing"
        ? "Capturing rendered surface"
        : "";
  const operationDetail = setupStarting
    ? captureNote
    : setupJob && SETUP_ACTIVE_STATES.includes(setupJob.state)
      ? setupJob.step
      : captureState === "capturing"
        ? captureNote
        : "";

  function onPrimary() {
    if (operationActive) return;
    if (isRepo) void startSetup(inputUrl);
    else void runCapture(inputUrl);
  }

  const liveCapture = captureMeta?.live === true && Boolean(report.capture.snapshotHtml || report.capture.screenshotBase64);
  const scannedSite = captureMeta?.live ? siteLabel(report.capture.url) : null;
  const captureBelongsToSetup = Boolean(
    setupJob?.state === "ready" &&
    setupJob.url &&
    captureMeta?.live &&
    sameOrigin(report.capture.url, setupJob.url),
  );
  const needsRecapture = Boolean(
    captureMeta?.live && !isRepo && normalizedInputUrl && normalizedInputUrl !== captureMeta.requestedUrl,
  );

  function addPage() {
    const url = routeFromInput(pageInput, report.capture.url);
    if (!url) return;
    setPages((prev) => (prev.some((p) => p.url === url) ? prev : [...prev, { url, path: new URL(url).pathname }]));
    setPageInput("");
    void runCapture(url);
  }

  async function scanAllPages() {
    setScanningAll(true);
    for (const p of pages.slice(0, 8)) {
      // eslint-disable-next-line no-await-in-loop
      await runCapture(p.url);
    }
    setScanningAll(false);
  }

  async function scanScenarioMatrix() {
    const url = normalizeCaptureUrl(report.capture.url || inputUrl);
    if (!url) {
      showNotice({ tone: "error", title: "Need a URL", message: "Capture a live page before scanning the scenario matrix." });
      return;
    }
    setMatrixState("scanning");
    setMatrixError("");
    setMatrixProof(null);
    try {
      const discovered = pages.length
        ? [...new Set(pages.map((p) => p.path.split("?")[0] || "/"))].slice(0, 4)
        : ["/", "/pricing", "/account"];
      const { baseUrl, routes } = matrixTarget(url, discovered);
      const res = await fetch("/api/proof/matrix", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({ url: baseUrl, routes, compare: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `Matrix scan failed (${res.status})`);
      }
      const cells: MatrixCellSummary[] = Array.isArray(data.proof?.cells)
        ? data.proof.cells.map((c: MatrixCellSummary) => ({
            scenarioId: c.scenarioId,
            status: c.status,
            scoreDelta: c.scoreDelta,
            focusRegressed: Boolean(c.focusRegressed),
            structureRegressed: Boolean(c.structureRegressed),
          }))
        : [];
      setMatrixProof({
        status: data.proof?.status ?? "review",
        matchedCells: data.proof?.matchedCells ?? cells.length,
        skippedCells: data.proof?.skippedCells ?? 0,
        cells,
        cellCount: data.meta?.cellCount ?? cells.length,
        authStorage: Boolean(data.meta?.authStorage),
      });
      setMatrixState("done");
      showNotice({
        tone: "success",
        title: "Scenario matrix captured",
        message: `${data.meta?.cellCount ?? cells.length} live cells · overall ${data.proof?.status ?? "review"}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMatrixError(message);
      setMatrixState("error");
      showNotice({ tone: "error", title: "Matrix scan failed", message });
    }
  }

  async function draftFix() {
    setDraftState("drafting");
    setDraftError("");
    try {
      const res = await fetch("/api/redesign", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({
          report,
          direction: directionPlan?.summary || directionId,
          directionPlan: directionPlan ?? undefined,
          findingId: selectedFinding?.id,
          dna: brandDna ?? undefined,
          setupJobId: captureBelongsToSetup ? setupJob?.id : undefined,
        }),
      });
      if (!res.ok) throw new Error("redesign request failed");
      const payload = (await res.json()) as RedesignProposal & { sourceContext?: SourceContext };
      setProposal({
        ...payload,
        reconciliation: payload.reconciliation ?? reconciliation,
      });
      setSourceContext(payload.sourceContext ?? null);
      setDraftState("ready");
    } catch {
      const files = buildOverridesPatch(reconciliation, report.capture.url);
      setProposal({
        findingId: selectedFinding?.id,
        direction: {
          id: reconciliation.directionId,
          label: reconciliation.label,
          keywords: [],
          tokenOverrides: { "--tell-accent": reconciliation.accentAfter, "--tell-paper": reconciliation.surfaceAfter },
          summary: reconciliation.summary,
        },
        reconciliation,
        files,
      });
      setDraftState("ready");
      setDraftError("Cursor-backed draft was unavailable, so Tell used the deterministic patch.");
    }
  }

  async function provePatch() {
    if (!proposal || !setupJob?.id || !captureBelongsToSetup) {
      await copyPatch(true);
      return;
    }
    const patch = proposal.files.map((file) => file.unifiedDiff).join("\n\n");
    setProofError("");
    setProofResult(null);
    setProofState("applying");
    showNotice({
      tone: "info",
      title: "Visual worktree started",
      message: `Applying ${proposal.files.length} source patch${proposal.files.length === 1 ? "" : "es"} to the disposable checkout.`,
    });
    try {
      // The endpoint applies, waits for HMR, then recaptures the running product.
      setProofState("verifying");
      const res = await fetch("/api/proof/apply", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({ jobId: setupJob.id, patch, beforeReport: report }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "The visual proof run failed.");
      const result = payload as ProofResult;
      setProofResult(result);
      setProofState(result.status);
      setSeam(50);
      showNotice({
        tone: result.status === "passed" ? "success" : result.status === "failed" ? "error" : "info",
        title: result.status === "passed" ? "Verified against rendered truth" : "Human review required",
        message: result.status === "passed"
          ? `The live recapture improved by ${Math.abs(result.proof.scoreDelta)} points with no focus regression.`
          : "Tell kept the change isolated and surfaced the measured tradeoffs for review.",
      });
    } catch (error) {
      setProofState("error");
      setProofError(error instanceof Error ? error.message : String(error));
      showNotice({
        tone: "error",
        title: "Proof run stopped",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function revertProof() {
    if (!setupJob?.id) return;
    try {
      const res = await fetch("/api/proof/revert", {
        method: "POST",
        headers: byokHeaders(),
        body: JSON.stringify({ jobId: setupJob.id }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not revert the proof patch.");
      if (!payload.reverted) throw new Error("Tell could not find an applied proof patch to revert.");
      setProofResult(null);
      setProofState("idle");
      setProofError("");
      showNotice({
        tone: "success",
        title: "Worktree restored",
        message: "The temporary source patch was reverted. Your original repository was never touched.",
      });
    } catch (error) {
      setProofError(error instanceof Error ? error.message : String(error));
    }
  }

  function markIntentional() {
    if (!selectedFinding) return;
    setReport((current) => {
      const verdicts = current.verdicts.map((item) =>
        item.findingId === selectedFinding.id
          ? { ...item, verdict: "intentional" as const, confidence: 1, rationale: "Accepted as an intentional product decision in this review." }
          : item,
      );
      return {
        ...current,
        verdicts,
        score: {
          ...current.score,
          generic: verdicts.filter((item) => item.verdict === "generic").length,
          drift: verdicts.filter((item) => item.verdict === "drift").length,
          intentional: verdicts.filter((item) => item.verdict === "intentional").length,
          uncertain: verdicts.filter((item) => item.verdict === "uncertain").length,
        },
      };
    });
    showNotice({
      tone: "success",
      title: "Decision recorded",
      message: `${selectedFinding.detector} is now treated as intentional for this review.`,
    });
  }

  async function copyPatch(applyIntent = false) {
    if (!proposal) return;
    const patch = proposal.files.map((file) => file.unifiedDiff).join("\n\n");
    const cursorHandoff = [
      `Tell generated a UI fix for ${report.capture.url}.`,
      "",
      "Apply this unified diff in the matching local repository, then run the app and verify the affected route visually.",
      sourceContext?.mode === "repo"
        ? `Source context: ${sourceContext.filesLoaded}/${sourceContext.filesDiscovered} files loaded from the disposable checkout; ${sourceContext.matchedFiles} files matched rendered evidence.`
        : "Source context: generated from rendered capture only. Check paths before applying if your local repo differs.",
      "",
      "```diff",
      patch,
      "```",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(applyIntent ? cursorHandoff : patch);
      setDraftState("copied");
      setDraftError(applyIntent ? "Cursor handoff copied. Paste it into Cursor chat in the target repo and ask the Agent to apply it." : "");
      showNotice({
        tone: "success",
        title: applyIntent ? "Ready for Cursor" : "Patch copied",
        message: applyIntent
          ? "The clipboard now contains a Cursor-ready prompt plus the unified diff."
          : "The unified diff is on your clipboard.",
      });
    } catch {
      setDraftError("Clipboard access was blocked. Select and copy the patch manually.");
      setDraftState("error");
    }
  }


  const studioBriefHref = designBrief
    ? `/studio?brief=${encodeURIComponent(designBrief)}`
    : "/studio";

  const criticPane = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
            operationActive
              ? "border-accent/40 bg-accent/10 text-accent"
              : captureMeta?.live
                ? "border-ok/40 bg-ok/10 text-ok"
                : "border-drift/40 bg-drift/10 text-drift"
          }`}
        >
          {operationActive ? "Working" : captureMeta?.live ? "Live capture" : captureMeta ? "Offline fallback" : designBrief ? "Brief only" : "Ready"}
        </span>
        {captureState === "done" && report.findings.length > 0 ? (
          <button
            type="button"
            onClick={shareReport}
            disabled={sharingReport || operationActive}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-meta text-secondary transition hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <Link2 className="h-3.5 w-3.5" />
            {sharingReport ? "Sharing…" : shareUrl ? "Copy share link" : "Share"}
          </button>
        ) : null}
      </div>

      <ConnectAgent />

      <WorkflowRail
        captured={liveCapture}
        sourceMapped={sourceContext?.mode === "repo" && sourceContext.filesLoaded > 0}
        patchReady={Boolean(proposal)}
        proofState={proofState}
      />

      {designBrief && !captureMeta ? (
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Waiting on capture</p>
          <p className="mt-2 text-sm text-secondary">
            Direction is primed. Capture a rendered URL to attach named tells and evidence to this brief.
          </p>
          <a className="mt-3 inline-block font-mono text-meta text-accent underline-offset-2 hover:underline" href={studioBriefHref}>
            Open in Studio
          </a>
        </div>
      ) : (
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-secondary">Findings</p>
        <p className="mb-3 font-mono text-meta text-muted">{scoreLine}</p>
        <div className="space-y-2">
          {report.findings.map((finding) => {
            const itemVerdict = verdictOf(finding.id);
            return (
              <button
                key={finding.id}
                type="button"
                onClick={() => setSelectedId(finding.id)}
                className={`w-full rounded-md border px-3 py-2 text-left transition hover:border-accent ${
                  selectedId === finding.id ? "border-accent bg-accent/10" : "border-border bg-bg/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm">{finding.detector}</span>
                  <VerdictBadge verdict={itemVerdict} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-secondary">
                  {report.verdicts.find((v) => v.findingId === finding.id)?.rationale}
                </p>
              </button>
            );
          })}
          {!report.findings.length ? (
            <p className="font-mono text-meta text-muted">No findings yet — capture a page to populate this rail.</p>
          ) : null}
        </div>
      </div>
      )}

      {!(designBrief && !captureMeta) && selectedFinding && verdict ? (
        <section className="min-w-0 rounded-card border border-accent/40 bg-surface-raised p-4 shadow-signal">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-lg">{selectedFinding.detector}</h2>
            <VerdictBadge verdict={verdict.verdict} />
          </div>
          <ConfidenceMeter value={verdict.confidence} />
          <p className="mt-4 text-secondary">{verdict.rationale}</p>
          <div className="mt-5 overflow-hidden rounded-md border border-border bg-bg p-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Evidence</p>
            {selectedFinding.evidence.map((evidence) => (
              <p key={`${evidence.label}-${evidence.value}`} className="mt-2 break-words font-mono text-sm text-secondary">
                <span className="text-accent">⊕</span> {evidence.label}: {evidence.value}
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={draftFix}
              disabled={draftState === "drafting" || operationActive}
              className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" /> {draftState === "drafting" ? "Mapping source…" : setupJob?.state === "ready" ? "Plan source fix" : "Draft fix"}
            </button>
            <button type="button" onClick={markIntentional} className="rounded-md border border-border px-3 py-2 text-secondary transition hover:text-text">
              Mark intentional
            </button>
          </div>
          {draftError ? <p className="mt-3 font-mono text-xs text-drift">{draftError}</p> : null}
          {proposal ? (
            <DiffViewer
              proposal={proposal}
              draftState={draftState}
              sourceContext={sourceContext}
              proofState={proofState}
              proofError={proofError}
              canProve={captureBelongsToSetup}
              onCopy={() => copyPatch()}
              onApply={provePatch}
            />
          ) : null}
        </section>
      ) : null}

      <section className="rounded-card border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-accent" />
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">Voice director</p>
          </div>
          {directionPlan ? (
            <span className="font-mono text-meta text-muted">
              direction: {resolveDirection(directionPlan.presetId).label.toLowerCase()}
              {directionParsing ? " · refining…" : directionSource === "gemini" ? " · gemini" : null}
            </span>
          ) : null}
        </div>
        {designBrief ? (
          <p className="mb-3 rounded-md border border-border bg-bg/70 px-3 py-2 font-mono text-meta text-secondary">
            Brief: {designBrief}
            {" · "}
            <a className="text-accent underline-offset-2 hover:underline" href={studioBriefHref}>
              Open in Studio
            </a>
          </p>
        ) : null}
        <div className="grid gap-3">
          <div className="flex gap-3 rounded-md border border-border bg-bg px-3 py-2 text-secondary">
            {voice.supported ? (
              <button
                type="button"
                onClick={voice.listening ? voice.stop : voice.start}
                aria-label={voice.listening ? "Stop listening" : "Start voice direction"}
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center self-start rounded-full border transition ${
                  voice.listening ? "animate-pulse border-accent bg-accent/20 text-accent" : "border-border text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            ) : null}
            <textarea
              value={voice.transcript}
              onChange={(event) => {
                voice.setTranscript(event.target.value);
                scheduleDirectionParse(event.target.value);
              }}
              rows={3}
              placeholder={voice.listening ? "Listening… keep speaking to append more direction." : "Describe the direction — warmer, more editorial, less shadow…"}
              className="min-h-[4.5rem] max-h-28 w-full resize-none overflow-y-auto bg-transparent text-sm leading-relaxed text-secondary placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap content-start gap-2">
            {PRESET_CHIPS.map((chip) => {
              const active = directionId === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    const preset = DIRECTION_PRESETS[chip.key as keyof typeof DIRECTION_PRESETS];
                    const text = preset?.summary ?? chip.label;
                    voice.setTranscript(text);
                    const plan = parseDirectionPlan(text);
                    applyDirectionPlan(plan);
                    learnFromDirection(plan, text);
                  }}
                  className={`rounded-full border px-3 py-2 font-mono text-xs transition ${
                    active ? "border-accent bg-accent/10 text-accent" : "border-border text-secondary hover:border-accent hover:text-accent"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
          {userProfile && userProfile.sessionCount > 0 ? (
            <p className="font-mono text-[10px] tracking-wide text-muted">
              Your sessions remember this machine
              {userProfile.preferredDirectionId ? ` · lean ${userProfile.preferredDirectionId}` : ""}
              {topPriorities(userProfile)[0] ? ` · priority ${topPriorities(userProfile)[0]!.key}` : ""}
              {userProfile.phraseBans.length ? ` · avoid ${userProfile.phraseBans.slice(0, 3).join(", ")}` : ""}
            </p>
          ) : null}
        </div>
        {directionPlan?.actionItems.length ? (
          <div className="mt-3 space-y-2">
            <p className="font-mono text-meta uppercase tracking-[0.14em] text-muted">Action items</p>
            <ul className="flex flex-wrap gap-2">
              {directionPlan.actionItems.map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-bg/70 px-2 py-2 font-mono text-meta text-secondary">
                  <span className="mr-1.5 text-muted">{item.category}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <BrandDnaBar dna={brandDna} onLearn={learnDna} onClear={clearDna} live={liveCapture} />
      {!proofResult ? <Scorecard reconciliation={reconciliation} live={liveCapture} /> : null}
      {!proofResult ? (
        <WhatChangedList
          notes={
            llmRestyle.mode === "ai" && llmRestyle.sheet?.notes.length
              ? llmRestyle.sheet.notes
              : reconciliation?.directionNotes ?? []
          }
        />
      ) : null}
      {!proofResult ? <ReconciliationTable reconciliation={reconciliation} live={liveCapture} /> : null}
    </div>
  );

  const canvasPane = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 font-mono text-sm text-secondary">
          {isRepo ? <Github className="h-4 w-4 shrink-0 text-accent" /> : <span className="text-muted">url</span>}
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !operationActive) onPrimary();
            }}
            disabled={operationActive}
            spellCheck={false}
            data-testid="capture-url"
            aria-label="URL to capture or GitHub repo to run"
            className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted disabled:cursor-wait disabled:opacity-70"
            placeholder="https://your-app.com  ·  or  github.com/owner/repo"
          />
        </label>
        <button
          type="button"
          onClick={onPrimary}
          disabled={operationActive}
          data-testid="capture-submit"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-semibold text-white transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
        >
          {setupActive ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
            </>
          ) : captureState === "capturing" ? (
            "Capturing…"
          ) : isRepo ? (
            <>
              <Github className="h-4 w-4" /> Set up &amp; run
            </>
          ) : (
            "Capture"
          )}
        </button>
      </div>

      {designBrief && !liveCapture ? (
        <div className="rounded-card border border-accent/35 bg-accent/10 px-4 py-3 text-sm text-secondary">
          Paste a live URL or GitHub repo above to ground this direction
          {" · "}
          <a className="text-accent underline-offset-2 hover:underline" href={studioBriefHref}>
            Open in Studio
          </a>
        </div>
      ) : null}

      {isRepo && !setupJob ? (
        <p className="flex items-center gap-2 font-mono text-meta text-secondary">
          <Github className="h-3.5 w-3.5 text-accent" />
          Tell will clone this repo, read its README to find the run command, start it, and capture the localhost URL for you.
        </p>
      ) : null}

      {setupError ? (
        <div className="rounded-card border border-drift/40 bg-drift/10 px-4 py-3 text-sm text-drift">{setupError}</div>
      ) : null}

      {setupJob ? (
        <SetupPanel
          job={setupJob}
          onRetry={() => startSetup(setupJob.repoUrl)}
          onStop={stopApp}
          onCaptureManual={(u) => {
            setInputUrl(u);
            void runCapture(u);
          }}
        />
      ) : null}

      {needsRecapture ? (
        <div className="rounded-card border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-secondary">
          URL changed to <span className="font-mono text-text">{inputUrl.trim()}</span> — click <strong className="text-text">Capture</strong> to rescan.
        </div>
      ) : null}

      {liveCapture ? (
        <PagesStrip
          pages={pages}
          activeUrl={report.capture.url}
          capturing={captureState === "capturing"}
          scanningAll={scanningAll}
          pageInput={pageInput}
          setPageInput={setPageInput}
          onSelect={(u) => runCapture(u)}
          onAdd={addPage}
          onScanAll={scanAllPages}
        />
      ) : null}

      {liveCapture ? (
        <ScenarioMatrixPanel
          state={matrixState}
          proof={matrixProof}
          error={matrixError}
          disabled={operationActive || matrixState === "scanning"}
          onScan={() => {
            void scanScenarioMatrix();
          }}
        />
      ) : null}

      <section className="min-w-0 rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-secondary" aria-live="polite">
              {captureState === "capturing" ? captureNote : scannedSite ? `Proof surface · ${scannedSite}` : "Concept preview · not yet verified"}
            </p>
            {captureState !== "capturing" ? <p className="mt-1 font-mono text-meta text-muted">{scoreLine}</p> : null}
          </div>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            direction: {dirMeta.id}
          </span>
        </div>
        {operationActive ? (
          <OperationPlaceholder title={operationTitle} detail={operationDetail} />
        ) : captureState === "idle" && !captureMeta ? (
          <div className="grid min-h-[280px] place-items-center rounded-md border border-dashed border-border bg-bg/40 px-6 text-center">
            <div>
              <p className="font-display text-2xl text-text">Ground the brief</p>
              <p className="mt-2 max-w-md text-sm text-secondary">
                Capture a rendered URL to attach findings and the before/after seam to this direction.
              </p>
            </div>
          </div>
        ) : (
          <BeforeAfterSeam
            seam={seam}
            setSeam={setSeam}
            findings={report.findings}
            reconciliation={reconciliation}
            selectedId={selectedId}
            onSelectFinding={setSelectedId}
            snapshotHtml={report.capture.snapshotHtml || undefined}
            screenshotBase64={report.capture.screenshotBase64 || undefined}
            llmStatus={llmRestyle.status}
            llmSheet={llmRestyle.sheet}
            llmMode={llmRestyle.mode}
            onLlmModeChange={llmRestyle.setMode}
          />
        )}
      </section>

      {proofResult ? (
        <VerifiedProofPanel
          baseline={report}
          result={proofResult}
          seam={seam}
          setSeam={setSeam}
          onRevert={revertProof}
          onCopy={() => {
            void copyPatch();
          }}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <AppShell
        rail={
          <EntryNavRail
            active={shellView === "home" ? "home" : "project"}
            onHome={goHome}
            onSettings={() => setSettingsOpen(true)}
          />
        }
        tabs={
          <WorkspaceTabsBar
            tabs={openTabs}
            activeId={shellView === "home" ? "home" : sessionId}
            onSelect={(id) => {
              const tab = openTabs.find((t) => t.id === id);
              if (!tab) return;
              setSessionId(tab.id);
              setSessionTitle(tab.title);
              setShellView("project");
            }}
            onClose={closeTab}
            onHome={goHome}
            onSettings={() => setSettingsOpen(true)}
            focusCanvas={focusCanvas}
            onToggleFocus={shellView === "project" ? () => setFocusCanvas((v) => !v) : undefined}
          />
        }
      >
        {shellView === "home" ? (
          <EntryHome
            mode={composerMode}
            onModeChange={(m) => {
              setComposerMode(m);
              if (m === "url" && !composerValue) setComposerValue(DEFAULT_CAPTURE_URL);
              if (m === "offline") setComposerValue("");
            }}
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={startFromComposer}
            submitting={operationActive}
            recent={recent}
            onOpenRecent={openRecent}
            showAllRecent={showAllRecent}
            onToggleShowAll={() => setShowAllRecent((v) => !v)}
          />
        ) : (
          <ProjectWorkspace
            critic={criticPane}
            canvas={canvasPane}
            focusCanvas={focusCanvas}
            mobilePane={mobilePane}
            onMobilePane={setMobilePane}
          />
        )}
      </AppShell>
      {operationActive ? <OperationCurtain title={operationTitle} detail={operationDetail} /> : null}
      {uiNotice ? <ToastNotice notice={uiNotice} onClose={() => setUiNotice(null)} /> : null}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
