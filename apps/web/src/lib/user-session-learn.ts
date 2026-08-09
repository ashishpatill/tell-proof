/**
 * End-user session learning — stays on the user's machine (localStorage).
 *
 * This is NOT the developer design-data corpus loop. Corpus improvement runs
 * only on maintainer machines via research/design-data.local.json.
 *
 * Priya's directions, tool choices, and priorities accumulate here so the next
 * session opens closer to how she works.
 */
import {
  UserDesignProfile,
  type UserDesignProfile as UserDesignProfileT,
  type UserDirectionMemory,
} from "@tell/schema";

export const USER_PROFILE_STORAGE_KEY = "tell:user-design-profile";

export function emptyUserProfile(): UserDesignProfileT {
  return UserDesignProfile.parse({
    version: 1,
    updatedAt: new Date().toISOString(),
    sessionCount: 0,
    recentDirections: [],
    priorities: {},
    toolPrefs: {},
    aestheticLeanVotes: {},
    phraseBans: [],
  });
}

export function loadUserDesignProfile(
  storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined" ? localStorage : null,
): UserDesignProfileT {
  if (!storage) return emptyUserProfile();
  try {
    const raw = storage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return emptyUserProfile();
    return UserDesignProfile.parse(JSON.parse(raw));
  } catch {
    return emptyUserProfile();
  }
}

export function saveUserDesignProfile(
  profile: UserDesignProfileT,
  storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined" ? localStorage : null,
): UserDesignProfileT {
  const next = UserDesignProfile.parse({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  if (storage) {
    try {
      storage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  }
  return next;
}

function bumpPriority(
  priorities: UserDesignProfileT["priorities"],
  category: string,
): UserDesignProfileT["priorities"] {
  const key =
    category === "typography"
      ? "typography"
      : category === "spacing"
        ? "spacing"
        : category === "color" || category === "depth"
          ? "contrast"
          : category === "tone"
            ? "typography"
            : null;
  if (!key) return priorities;
  const cur = priorities[key] ?? 0.4;
  return { ...priorities, [key]: Math.min(1, cur + 0.08) };
}

/** Record a voice/text art-direction the user accepted. */
export function recordDirectionSession(
  profile: UserDesignProfileT,
  opts: {
    presetId: string;
    phrase: string;
    actionCategories?: string[];
    aestheticLean?: string;
  },
  storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined" ? localStorage : null,
): UserDesignProfileT {
  const phrase = opts.phrase.trim().slice(0, 240);
  const entry: UserDirectionMemory = {
    presetId: opts.presetId,
    phrase,
    at: new Date().toISOString(),
  };
  const recent = [entry, ...profile.recentDirections.filter((d) => d.phrase !== phrase)].slice(
    0,
    24,
  );
  let priorities = { ...profile.priorities };
  for (const cat of opts.actionCategories ?? []) {
    priorities = bumpPriority(priorities, cat);
  }
  const votes = { ...profile.aestheticLeanVotes };
  if (opts.aestheticLean) {
    votes[opts.aestheticLean] = (votes[opts.aestheticLean] ?? 0) + 1;
  }
  const phraseBans = [...profile.phraseBans];
  for (const banHit of phrase.matchAll(
    /\b(?:no|never|stop|less|without)\s+(purple|violet|emoji|inter|shadow|gradient|glass|award)\b/gi,
  )) {
    const token = banHit[1]?.toLowerCase();
    if (token && !phraseBans.includes(token)) phraseBans.push(token);
  }
  return saveUserDesignProfile(
    {
      ...profile,
      preferredDirectionId: opts.presetId,
      recentDirections: recent,
      priorities,
      aestheticLeanVotes: votes,
      phraseBans: phraseBans.slice(0, 40),
      sessionCount: profile.sessionCount + 1,
    },
    storage,
  );
}

export function recordToolPreference(
  profile: UserDesignProfileT,
  tool: "voice" | "mcp" | "live-capture" | "offline-fixture",
  storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined" ? localStorage : null,
): UserDesignProfileT {
  const toolPrefs = { ...profile.toolPrefs };
  if (tool === "voice") toolPrefs.preferVoice = true;
  if (tool === "mcp") toolPrefs.preferMcp = true;
  if (tool === "live-capture") toolPrefs.preferLiveCapture = true;
  if (tool === "offline-fixture") toolPrefs.preferOfflineFixture = true;
  return saveUserDesignProfile({ ...profile, toolPrefs }, storage);
}

/** Best direction preset to open with, from the user's own history. */
export function suggestedDirectionId(profile: UserDesignProfileT, fallback = "editorial"): string {
  if (profile.preferredDirectionId) return profile.preferredDirectionId;
  const counts = new Map<string, number>();
  for (const d of profile.recentDirections) {
    counts.set(d.presetId, (counts.get(d.presetId) ?? 0) + 1);
  }
  let best = fallback;
  let n = 0;
  for (const [id, c] of counts) {
    if (c > n) {
      best = id;
      n = c;
    }
  }
  return best;
}

export function topPriorities(profile: UserDesignProfileT): Array<{ key: string; weight: number }> {
  return Object.entries(profile.priorities)
    .filter(([, v]) => typeof v === "number")
    .map(([key, weight]) => ({ key, weight: weight as number }))
    .sort((a, b) => b.weight - a.weight);
}
