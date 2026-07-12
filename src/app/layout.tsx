import type { Metadata, Viewport } from "next";
import { VT323, JetBrains_Mono, DotGothic16 } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "@/styles/globals.css";

const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" });
const jetbrains = JetBrains_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dotgothic",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Comnyang, the pixel cat in your computer",
  description:
    "A tiny pixel cat that lives on your desktop — it watches your cursor, kneads while you type, and nudges you to stretch. Recreation built for study purposes.",
  openGraph: {
    title: "Comnyang — a pixel cat that lives on your desktop",
    description:
      "A tiny pixel cat that follows your cursor, reacts to typing, and reminds you to stretch.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${vt323.variable} ${jetbrains.variable} ${dotGothic.variable}`}>
      <body>
        <LanguageProvider>
          <SmoothScrollProvider>
            <SiteChrome>{children}</SiteChrome>
          </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
