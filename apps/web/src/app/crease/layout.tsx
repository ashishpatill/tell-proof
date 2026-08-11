import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./crease.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-crease-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-crease-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CREASE — Cricket, ball by ball",
  description:
    "Scores you can scan and stories worth the wait between overs. A cricket destination built for the love of the game.",
};

export default function CreaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" as="image" href="/crease/hero-match.webp" type="image/webp" />
      <div className={`${fraunces.variable} ${outfit.variable}`}>{children}</div>
    </>
  );
}
