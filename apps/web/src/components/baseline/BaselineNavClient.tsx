"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { BASELINE_NAV, baselineRouteFromPath } from "./baselineNav";

/** Mobile menu + primary links — only interactive island in the shell. */
export function BaselineNavClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();
  const pathname = usePathname() || "/baseline";
  const active = baselineRouteFromPath(pathname);

  return (
    <>
      <button
        type="button"
        className="bl-menu-btn"
        aria-expanded={menuOpen}
        aria-controls={navId}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? "Close" : "Menu"}
      </button>
      <nav
        id={navId}
        className={`bl-nav-links${menuOpen ? " is-open" : ""}`}
        aria-label="Primary"
        data-baseline-route={active}
      >
        {BASELINE_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch
            aria-current={active === item.id ? "page" : undefined}
            className={active === item.id ? "is-active" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="bl-nav-cta"
          href="/baseline/live"
          prefetch
          onClick={() => setMenuOpen(false)}
        >
          Court board
        </Link>
      </nav>
    </>
  );
}
