"use client";

import { useRef } from "react";

import { ShorelineStrip } from "@/components/charts/ShorelineStrip";
import { SourceNote } from "@/components/ui/SourceNote";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useStepObserver } from "@/hooks/useStepObserver";

const STEPS = [
  {
    kicker: "2016 → 2023",
    text: "Across the Pacific, sea levels have climbed almost every single year for three decades.",
  },
  {
    kicker: "Tuvalu",
    text: "For low-lying atoll nations like Tuvalu, that rise isn't abstract - it's measured against land that barely clears the water to begin with.",
  },
  {
    kicker: "What's left",
    text: "Multiply this by thirty years, and a shoreline doesn't just move. It disappears.",
  },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const step = useStepObserver(containerRef, 0);

  return (
    <section
      id="intro"
      className="relative bg-ocean-deep text-foam"
    >
      {/* ---- opening banner ---- */}
      <div className="relative flex min-h-[75vh] xl:min-h-[92vh] flex-col items-start justify-center px-6 md:px-16 pt-10">
        <AmbientWaves />
        <div className="relative z-10 grid w-full gap-8 md:grid-cols-[1fr_0.8fr] items-center">
          <div>
            <ScrollReveal animation="fade-down" delay={200}>
              <p className="eyebrow text-coral-soft">
                A Pacific climate crisis
              </p>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={400}>
              <h1 className="mt-5 max-w-2xl font-display text-[clamp(2rem,6vw,4.25rem)] font-medium leading-[1.05] tracking-tight text-gold">
                HIGHTIDE: REPAYING THE CARBON DEBT
              </h1>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={600}>
              <div className="mt-7 text-lg text-foam/70 space-y-4 max-w-[820px]">
                <p>
                  Pacific Island Countries pollute the least yet pay the most. Carbon emissions from major industrial nations drive sea-level rise, which directly destroys critical water, sanitation, and hygiene (WASH) infrastructure across the Pacific.
                </p>
                <p>
                  HighTide is an AI-forecasted, blockchain-triggered Loss & Damage protocol that measures this devastation and pays out automatically when sea levels cross scientific thresholds—repaying the historical carbon debt.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={800}>
              <div className="mt-14 flex items-center gap-3 text-foam/50">
                <span className="eyebrow"> By Dung Truong</span>
                <span className="h-8 w-px animate-pulse bg-foam/30" />
              </div>
            </ScrollReveal>
          </div>

          {/* Hero Visual */}
          <ScrollReveal animation="fade-left" delay={600}>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-foam/10">
              <ShorelineStrip retreat={1} />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ---- scrollytelling: sea level + shoreline ---- */}
      {/*
      <div ref={containerRef} className="relative mx-auto max-w-6xl px-6 md:px-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start">
          <div className="relative">
            {STEPS.map((s, i) => (
              <div
                key={i}
                data-step={i}
                className="flex min-h-[80vh] flex-col justify-center py-12"
              >
                <p className="eyebrow text-coral-soft">{s.kicker}</p>
                <p className="prose-col mt-4 font-display text-2xl font-medium leading-snug md:text-[1.85rem]">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="relative h-full">
            <div className="sticky top-0 flex h-screen flex-col justify-center gap-6 py-8">
              <div className="h-[54vh] w-full overflow-hidden">
                <SeaLevelScrolly step={step} />
              </div>
              
            </div>
          </div>
        </div>
      </div>
      */}

      {/* ---- Shoreline strip simulate ---- */}
      {/*
      <div className="relative mx-auto max-w-6xl px-6 pb-20 md:px-16">
      <ShorelineStrip retreat={step >= 1 ? 1 : 0} />
              <SourceNote className="text-white text-xs">
                <span>Source: Pacific Data Hub, CLIMATE_CHANGE_SEA_INDICATORS, 2016–2023.</span>
                <span>Line shows unweighted average across 21 PICTs; Tuvalu shown individually.</span>
              </SourceNote>
      </div>
      */}

      {/* ---- closing quote ---- */}
      <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center md:px-16">
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="mb-6 text-coral animate-on-scroll animate-zoom-in is-visible">
          <path d="M0 20V11.5C0 5.15 4.5 0.9 11 0L11.8 3.1C7.8 4 5.6 6.7 5.3 10.2H10V20H0ZM16.2 20V11.5C16.2 5.15 20.7 0.9 27.2 0L28 3.1C24 4 21.8 6.7 21.5 10.2H26.2V20H16.2Z" fill="currentColor"/>
        </svg>
        <p className="font-display text-2xl italic leading-relaxed text-foam md:text-3xl animate-on-scroll animate-fade-up is-visible">
          The sea kept us alive, but carbon fills the skies,<br/>
now the warming waters rise,<br/>
and clean water declines,<br/>
W.A.S.H can barely supply.<br/>
We fight,<br/>
we try,<br/>
… while their carbon debt multiplies.<br/>
        </p>
        <ScrollReveal animation="fade-up" delay={600}>
          <p className="eyebrow mt-6 text-foam/45">So why?</p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function AmbientWaves() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <path
        d="M0 620 Q150 580 300 620 T600 620 T900 620 T1200 620 V800 H0 Z"
        fill="var(--lagoon)"
      >
        <animate
          attributeName="d"
          dur="14s"
          repeatCount="indefinite"
          values="M0 620 Q150 580 300 620 T600 620 T900 620 T1200 620 V800 H0 Z;
                  M0 640 Q150 600 300 640 T600 640 T900 640 T1200 640 V800 H0 Z;
                  M0 620 Q150 580 300 620 T600 620 T900 620 T1200 620 V800 H0 Z"
        />
      </path>
      <path
        d="M0 680 Q200 650 400 680 T800 680 T1200 680 V800 H0 Z"
        fill="var(--coral)"
        opacity="0.5"
      >
        <animate
          attributeName="d"
          dur="18s"
          repeatCount="indefinite"
          values="M0 680 Q200 650 400 680 T800 680 T1200 680 V800 H0 Z;
                  M0 660 Q200 690 400 660 T800 660 T1200 660 V800 H0 Z;
                  M0 680 Q200 650 400 680 T800 680 T1200 680 V800 H0 Z"
        />
      </path>
    </svg>
  );
}