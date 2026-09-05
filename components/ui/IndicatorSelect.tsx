"use client";

import { indicatorIds, cleanWaterFull, getIndicatorLabel } from "@/lib/data";

const POLARITY_NOTE: Record<string, string> = {
  good: "higher is better",
  bad: "higher is worse",
};

export default function IndicatorSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5 p-1.5 bg-ink/5 rounded-2xl items-center border border-ink/10 w-fit">
      {indicatorIds.map((id) => {
        const ind = cleanWaterFull[id];
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`cursor-pointer px-4 py-2 text-left rounded-xl transition-all duration-200 focus:outline-none ${
              active
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                : "text-ink-dim hover:text-ink hover:bg-black/5"
            }`}
          >
            <div className="text-sm font-medium leading-tight">{getIndicatorLabel(ind.label)}</div>
            <div
              className={`text-[9px] uppercase tracking-wide mt-0.5 ${
                active ? "text-primary/70" : "text-ink-faint"
              }`}
            >
              {POLARITY_NOTE[ind.polarity]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
