import dynamic from "next/dynamic"
import { Nav } from "@/components/site/nav"
import { Hero } from "@/components/site/hero"
import { AboutVaish } from "@/components/site/about-vaish"
import { Manifesto } from "@/components/site/manifesto"
import { Realms } from "@/components/site/realms"
import { Classes } from "@/components/site/classes"
import { Codex } from "@/components/site/codex"
import { Artifacts } from "@/components/site/artifacts"
import { Ticker } from "@/components/site/ticker"
import { FinalCTA } from "@/components/site/cta"
import { Footer } from "@/components/site/footer"
import { CustomCursor } from "@/components/site/custom-cursor"
import { ScrollArc } from "@/components/site/scroll-arc"
import { RuneDivider } from "@/components/site/rune-divider"
import { SectionReveal } from "@/components/site/section-reveal"
import { IntroLoader } from "@/components/site/loader"
import { SmoothScroll } from "@/components/site/smooth-scroll"

// MiniGame ships ~2300 LOC of canvas/Framer game logic. Code-split so the
// chunk only loads when the visitor scrolls past the codex into the arcade.
const MiniGame = dynamic(() => import("@/components/site/minigame").then((m) => ({ default: m.MiniGame })), {
  loading: () => <div className="min-h-[600px]" aria-hidden />,
})

/**
 * Page composition
 *
 * Each major section is wrapped in <SectionReveal> with a different flavor so
 * scrolling feels like a series of cuts rather than a uniform fade-up. The
 * RuneDivider acts as the cinematic interlude between rooms.
 */
export default function Page() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <SmoothScroll />
      <IntroLoader />
      <CustomCursor />
      <ScrollArc />
      <Nav />

      <Hero />

      <RuneDivider index="01" labelKey="divider.about" />
      <SectionReveal flavor="aperture" caption="CUE // 01 — ABOUT">
        <AboutVaish />
      </SectionReveal>

      <RuneDivider index="02" labelKey="divider.operator" />
      <SectionReveal flavor="cinema" caption="CUE // 02 — OPERATOR">
        <Manifesto />
      </SectionReveal>

      <RuneDivider index="03" labelKey="divider.works" />
      <SectionReveal flavor="ascend" caption="CUE // 03 — WORKS">
        <Realms />
      </SectionReveal>

      <RuneDivider index="04" labelKey="divider.abilities" />
      <SectionReveal flavor="track" side="right" caption="CUE // 04 — ABILITIES">
        <Classes />
      </SectionReveal>

      <RuneDivider index="05" labelKey="divider.codex" />
      <SectionReveal flavor="aperture" caption="CUE // 05 — CHRONICLES">
        <Codex />
      </SectionReveal>

      <RuneDivider index="06" labelKey="divider.arcade" />
      <SectionReveal flavor="ascend" caption="CUE // 06 — ARCADE">
        <MiniGame />
      </SectionReveal>

      <RuneDivider index="07" labelKey="divider.artifacts" />
      <SectionReveal flavor="track" side="left" caption="CUE // 07 — ARTIFACTS">
        <Artifacts />
      </SectionReveal>

      <Ticker />
      <FinalCTA />
      <Footer />
    </main>
  )
}
