import { TideRail } from "@/components/ui/TideRail";
import { Hero } from "@/components/sections/Hero";
import { Cause } from "@/components/sections/Cause";
import Part1Chart2 from "@/components/sections/part1/Chart2";
import Part2Chart1 from "@/components/sections/part2/Chart1";
import { BackToTop } from "@/components/ui/BackToTop";
import Part2Chart2V2 from "@/components/sections/part2/Chart2v2";
import IndicatorsHub from "@/components/indicators/page";

const MARKS = [
  { id: "closing", label: "closing" },
  { id: "part1-chart1", label: "rural vs urban" },
  { id: "indicators", label: "indicators" },
  { id: "cause", label: "the reasons why" },
  { id: "part1-chart2", label: "sea status" },
  { id: "intro", label: "intro" },
];

export default function Home() {
  return (
    <main className="relative">
      <TideRail marks={MARKS} />
      <BackToTop />

      {/* <div className="fixed right-6 top-6 z-40 hidden md:block">
        <p className="eyebrow rounded-full border border-ink/10 bg-foam/80 px-3 py-1.5 text-ink/60 backdrop-blur">
          Tides of Debt
        </p>
      </div> */}

      <Hero />
      <Part1Chart2 />
      <Cause />
      {/* <Part2Chart1 /> */}
      <IndicatorsHub />
      <Part2Chart2V2 />

      <footer
        id="closing"
        className="border-t border-foam/10 bg-ocean-deep px-6 py-16 text-foam md:px-16"
      >
        <div className="mx-auto max-w-6xl">
          <p className="prose-col max-w-xl font-display text-xl italic leading-snug text-foam/85">
            “We are the people of this world, and we need to be together” - A
            Tuvaluan woman.
          </p>

          <div className="mt-10 max-w-3xl space-y-5 text-sm leading-relaxed text-foam/70 sm:text-base">
            <p>
              As the global climate continues to change, seawater is expected
              to increasingly encroach inland in many parts of the world.
              Behind every number and every chart lies a hidden story - a
              warning bell that calls on us to pay greater attention to the
              growing threat to freshwater security and the communities that
              depend on it - a challenge that is global, not PICs alone.
            </p>
            <p>
              In conclusion, collective action is needed to mitigate climate
              change, reduce greenhouse gas emissions, and protect vulnerable
              communities worldwide. Pacific nations will keep raising their
              voices on the international stage, pushing for meaningful action
              to fight climate change and preserve critical freshwater
              resources.
            </p>
            <p>
              Ensuring access to adequate WASH services goes beyond just
              survival - it speaks to dignity, equity, and a sustainable
              future for all.
            </p>
          </div>

          <div className="mt-12 grid gap-8 border-t border-foam/10 pt-8 text-sm text-foam/50 md:grid-cols-2">
            <div>
              <p className="eyebrow text-foam/70">Data</p>
              <p className="mt-2 leading-relaxed">
                Pacific Data Hub (Clean Water and Sanitation, GHG per capita,
                Temperature anomalies), Climate Data Store (Sea level
                anomalies).
              </p>
            </div>
            <div>
              <p className="eyebrow text-foam/70">Entry for</p>
              <p className="mt-2 leading-relaxed">
                Pacific Dataviz Challenge, interactive category.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
