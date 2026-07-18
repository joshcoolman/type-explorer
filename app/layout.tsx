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
        {/*
          A site-wide agent pointer on every route, present in the markup and
          text-extractable but silent to screen readers and invisible on screen
          (aria-hidden + clip-rect, the pattern used on `/compose`). Whatever URL
          a user pastes, the agent learns the contract exists and where the full,
          self-contained one-fetch quickstart lives. The home route (`/`) carries
          that quickstart inline; see `app/page.tsx`.
        */}
        <p
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            margin: -1,
            padding: 0,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            borderWidth: 0,
          }}
        >
          Agents: this site has a machine-readable contract. The home page (
          <a href="https://googlefontfinder.com/">googlefontfinder.com</a>)
          carries a self-contained quickstart for composing a shareable type
          direction in one fetch; the full contract is at{" "}
          <a href="https://googlefontfinder.com/agent.md">/agent.md</a>, indexed
          at <a href="https://googlefontfinder.com/llms.txt">/llms.txt</a>.
        </p>
        <CardThemeProvider>
          <VoiceProvider>
            <SiteChrome>{children}</SiteChrome>
          </VoiceProvider>
        </CardThemeProvider>
      </body>
    </html>
  );
}
