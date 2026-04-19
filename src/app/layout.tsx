import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeScript from "@/components/layout/ThemeScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Gallery",
  description: "A curated prompt gallery with switchable visual themes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="cyber-obsidian"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="theme-body min-h-full flex flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
