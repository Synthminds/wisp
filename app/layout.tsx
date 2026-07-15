import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisp",
  description: "Household monitoring AI — AI plans, AI monitors, humans execute.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
