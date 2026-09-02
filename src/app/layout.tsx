import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./login.css";
import "./study.css";
import "./parent.css";

export const metadata: Metadata = {
  title: "StudyCraft — Family-first learning",
  description:
    "Grounded, focused chapter practice for every learner in the family.",
  applicationName: "StudyCraft",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
