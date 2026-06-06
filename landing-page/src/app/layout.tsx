import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Roamer — How many streets have you discovered?",
  description:
    "Stop running the same routes. Roamer generates unique paths and tracks every new street you explore. Join the beta.",
  openGraph: {
    title: "Roamer — How many streets have you discovered?",
    description: "An exploration-focused running experience.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} scroll-smooth`}>
      <body className="bg-[#0a0a0a] text-stone-100 antialiased">{children}</body>
    </html>
  );
}
