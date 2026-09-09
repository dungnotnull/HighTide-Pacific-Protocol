import { ProtocolIntro } from "./ProtocolIntro";
import { ScientificGrounding } from "./ScientificGrounding";
import { TriggerExplainer } from "./TriggerExplainer";
import { RiskAllocation } from "./RiskAllocation";
import { BacktestTimeline } from "./BacktestTimeline";
import { AIForecast2030 } from "./AIForecast2030";
import { LiveProtocol } from "./LiveProtocol";

export function ProtocolSection() {
  return (
    <section
      id="protocol"
      className="relative bg-ocean-deep px-6 py-14 text-foam md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-foam/60">Action</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl text-foam sm:text-4xl">
          The Protocol: the carbon debt, repaid automatically
        </h2>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foam/70 sm:text-base">
          The first two acts showed the debt and its consequences: carbon emissions from major polluters drive sea-level rise, which directly destroys critical WASH infrastructure in the Pacific (salinizing freshwater and flooding sanitation). This act is the repayment mechanism — a parametric pool that monitors verified sea-level data to automatically trigger payouts for this Loss & Damage, funded by the historical carbon debt of the emitters.
        </p>

        <div className="mt-10 space-y-14">
          <ProtocolIntro />
          <ScientificGrounding />
          <TriggerExplainer />
          <RiskAllocation />
          <BacktestTimeline />
          <AIForecast2030 />
          <LiveProtocol />
        </div>
      </div>
    </section>
  );
}
