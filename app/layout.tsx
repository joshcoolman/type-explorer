import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
import { VoiceProvider } from "./components/VoiceProvider";
import { CardThemeProvider } from "./components/CardThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Type Explorer",
  description:
    "Browse Google Fonts as full-size specimens and discover curated and algorithmic display + text pairings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <CardThemeProvider>
          <VoiceProvider>
            <SiteChrome>{children}</SiteChrome>
          </VoiceProvider>
        </CardThemeProvider>
      </body>
    </html>
  );
}
