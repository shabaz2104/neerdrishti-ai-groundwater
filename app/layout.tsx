import type { Metadata } from "next";
import { DM_Serif_Display, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./public-experience.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const display = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "NeerDrishti",
  description: "Explore Maharashtra's 2024 groundwater assessments through maps, data and analytics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
