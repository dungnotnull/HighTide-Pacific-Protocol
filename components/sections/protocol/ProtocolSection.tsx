import { ProtocolIntro } from "./ProtocolIntro";
import { TriggerExplainer } from "./TriggerExplainer";
import { RiskAllocation } from "./RiskAllocation";
import { BacktestTimeline } from "./BacktestTimeline";
import { LiveProtocol } from "./LiveProtocol";

export function ProtocolSection() {
  return (
    <section
      id="protocol"
      className="relative bg-ocean-deep px-6 py-14 text-foam md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-foam/60">Act 3</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl text-foam sm:text-4xl">
          The Protocol: the carbon debt, repaid automatically
        </h2>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foam/70 sm:text-base">
          The first two acts showed the debt: seas rising fastest exactly where
          emissions contributed least. This act is the repayment mechanism — a
          parametric pool that watches the same verified sea-level data and
          pays out automatically when the trigger fires.
        </p>

        <div className="mt-10 space-y-14">
          <ProtocolIntro />
          <TriggerExplainer />
          <RiskAllocation />
          <BacktestTimeline />
          <LiveProtocol />
        </div>
      </div>
    </section>
  );
}
