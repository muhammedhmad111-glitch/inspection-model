import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const display = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CPIIS – نظام فحص مصنع الأسمنت",
  description: "Cement Plant Inspection Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-left" richColors />
      </body>
    </html>
  );
}
