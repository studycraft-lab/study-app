import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "StudyCraft — Family-first learning",
  description:
    "Grounded, focused chapter practice for every learner in the family.",
  applicationName: "StudyCraft",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
