import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geniuslab Video Assessment",
  description: "Automated video assessment intake and review platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
