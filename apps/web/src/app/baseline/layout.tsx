import type { Metadata } from "next";
import { Newsreader, Sora } from "next/font/google";
import { BaselineShell } from "@/components/baseline/BaselineShell";
import "./baseline.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-baseline-display",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-baseline-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BASELINE — Tennis, set by set",
  description:
    "Sets, games, and points stacked with server and pressure flags. A tennis destination built for glance-live court boards.",
};

export default function BaselineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${newsreader.variable} ${sora.variable}`}>
      <BaselineShell>{children}</BaselineShell>
    </div>
  );
}
