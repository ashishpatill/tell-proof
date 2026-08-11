"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CREASE_NAV, type CreasePrimaryRouteId, type CreaseRouteId } from "./creaseNav";

function isPrimaryActive(active: CreaseRouteId, id: CreasePrimaryRouteId): boolean {
  return active === id;
}

/** Mobile menu + primary links — only interactive island in the shell. */
export function CreaseNavClient({ active }: { active: CreaseRouteId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();

  return (
    <>
      <button
        type="button"
        className="cr-menu-btn"
        aria-expanded={menuOpen}
        aria-controls={navId}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? "Close" : "Menu"}
      </button>
      <nav
        id={navId}
        className={`cr-nav-links${menuOpen ? " is-open" : ""}`}
        aria-label="Primary"
      >
        {CREASE_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isPrimaryActive(active, item.id) ? "page" : undefined}
            className={isPrimaryActive(active, item.id) ? "is-active" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link className="cr-nav-cta" href="/crease/live" onClick={() => setMenuOpen(false)}>
          Live match
        </Link>
      </nav>
    </>
  );
}
