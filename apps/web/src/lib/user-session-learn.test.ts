import { describe, expect, it, beforeEach } from "vitest";
import {
  emptyUserProfile,
  loadUserDesignProfile,
  recordDirectionSession,
  recordToolPreference,
  suggestedDirectionId,
  USER_PROFILE_STORAGE_KEY,
} from "./user-session-learn";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

describe("user-session-learn", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("starts empty and records direction + bans + tools", () => {
    let profile = loadUserDesignProfile(storage);
    expect(profile.sessionCount).toBe(0);
    profile = recordDirectionSession(profile, {
      presetId: "editorial",
      phrase: "warmer, less shadow, no purple",
      actionCategories: ["color", "depth"],
    }, storage);
    expect(profile.preferredDirectionId).toBe("editorial");
    expect(profile.phraseBans).toContain("purple");
    expect(profile.phraseBans).toContain("shadow");
    expect(profile.priorities.contrast ?? 0).toBeGreaterThan(0.4);
    profile = recordToolPreference(profile, "voice", storage);
    expect(profile.toolPrefs.preferVoice).toBe(true);
    expect(storage.getItem(USER_PROFILE_STORAGE_KEY)).toBeTruthy();
  });

  it("suggests the preferred direction from history", () => {
    let profile = emptyUserProfile();
    profile = recordDirectionSession(profile, {
      presetId: "instrument",
      phrase: "precise mono labels",
      actionCategories: ["typography"],
    });
    profile = recordDirectionSession(profile, {
      presetId: "instrument",
      phrase: "tighter type",
      actionCategories: ["typography"],
    });
    expect(suggestedDirectionId(profile)).toBe("instrument");
  });
});
