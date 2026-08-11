"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { CREASE_NAV, type CreasePrimaryRouteId, type CreaseRouteId } from "./creaseNav";

function routeFromPath(pathname: string): CreaseRouteId {
  if (pathname.startsWith("/crease/live")) return "live";
  if (pathname.startsWith("/crease/scorecard")) return "scorecard";
  if (pathname.startsWith("/crease/series")) return "series";
  if (pathname.startsWith("/crease/rankings")) return "rankings";
  if (pathname.startsWith("/crease/notebook")) return "notebook";
  if (pathname.startsWith("/crease/fixtures")) return "fixtures";
  if (pathname.startsWith("/crease/teams")) return "teams";
  if (pathname.startsWith("/crease/players")) return "players";
  if (pathname.startsWith("/crease/stats")) return "stats";
  return "home";
}

function isPrimaryActive(active: CreaseRouteId, id: CreasePrimaryRouteId): boolean {
  return active === id;
}

/** Mobile menu + primary links — only interactive island in the shell. */
export function CreaseNavClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();
  const pathname = usePathname() || "/crease";
  const active = routeFromPath(pathname);

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
        data-crease-route={active}
      >
        {CREASE_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch
            aria-current={isPrimaryActive(active, item.id) ? "page" : undefined}
            className={isPrimaryActive(active, item.id) ? "is-active" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link className="cr-nav-cta" href="/crease/live" prefetch onClick={() => setMenuOpen(false)}>
          Live match
        </Link>
      </nav>
    </>
  );
}
