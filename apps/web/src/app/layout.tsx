import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tell — Every AI-built UI has a tell",
  description: "Capture your product, name what's generic, art-direct a direction, and apply the fix in Cursor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
