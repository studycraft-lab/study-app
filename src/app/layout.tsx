import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "StudyCraft — Family-first learning",
  description:
    "Grounded, focused chapter practice for every learner in the family.",
  applicationName: "StudyCraft",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
