import type { Metadata, Viewport } from "next"
import { Inter, Instrument_Serif, JetBrains_Mono, Bodoni_Moda } from "next/font/google"
import "./globals.css"
import { ArcadeProvider } from "@/components/site/arcade/arcade-context"
import { I18nProvider } from "@/components/site/i18n-context"
import { CloudflareAnalytics } from "@/components/site/cf-analytics"

const SITE_URL = "https://portfolio-v2.paidtoolsdrive.workers.dev"

/* All fonts use display:swap + adjustFontFallback so the metric-matched
   system fallback paints first and the swap to the real font is
   imperceptible. Without this, Bodoni Moda (~80KB woff2) causes a brief
   reflow on first paint that shows up as cumulative layout shift. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
})
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
})
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-hud",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
})
// Bodoni Moda: razor-sharp high-contrast display serif with dramatic strokes.
// Edgy, editorial, and aligned with the dark-realm theme.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-wordmark",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Didot", "Cormorant Garamond", "Georgia", "serif"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VAISH / Realm of the Untold",
    template: "%s — VAISH",
  },
  description:
    "VAISH is an interactive world by Aryaman V. Gupta. A cinematic living experience of forgotten realms, wandering souls, and signal memory.",
  applicationName: "VAISH",
  authors: [{ name: "Aryaman V. Gupta" }],
  creator: "Aryaman V. Gupta",
  keywords: [
    "VAISH",
    "Aryaman Gupta",
    "portfolio",
    "interactive design",
    "creative developer",
    "motion design",
    "web experience",
  ],
  openGraph: {
    title: "VAISH / Realm of the Untold",
    description: "A living world by Aryaman V. Gupta.",
    type: "website",
    url: SITE_URL,
    siteName: "VAISH",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "VAISH / Realm of the Untold",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VAISH / Realm of the Untold",
    description: "A living world by Aryaman V. Gupta.",
    creator: "@paidtoolsdrive",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#1a120a",
  width: "device-width",
  initialScale: 1,
}

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Aryaman V. Gupta",
  alternateName: "VAISH",
  url: SITE_URL,
  jobTitle: "Designer / Engineer / World-Builder",
  description:
    "Designer and engineer building interactive worlds for the web. Sites that feel like a place you stepped into, not a page you opened.",
  knowsAbout: [
    "Interactive Design",
    "Motion Design",
    "Creative Development",
    "Frontend Engineering",
    "Brand & Identity",
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrument.variable} ${jetbrains.variable} ${bodoni.variable} bg-background`}
    >
      <body className="font-sans antialiased grain overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <I18nProvider>
          <ArcadeProvider>{children}</ArcadeProvider>
        </I18nProvider>
        <CloudflareAnalytics />
      </body>
    </html>
  )
}
