"use client";

export default function YearRangeSelect({
  years,
  start,
  end,
  onChangeStart,
  onChangeEnd,
}: {
  years: number[];
  start: number;
  end: number;
  onChangeStart: (y: number) => void;
  onChangeEnd: (y: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-[12px]">
      <label className="flex items-center gap-2">
        <span className="text-ink-faint uppercase tracking-wide font-medium">From</span>
        <select
          value={start}
          onChange={(e) => {
            const y = Number(e.target.value);
            onChangeStart(y > end ? end : y);
          }}
          className="bg-paper-raised-2 border border-grid rounded-md px-3 py-2 text-ink font-medium hover:border-tide cursor-pointer transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brass-bright/30"
        >
          {years
            .filter((y) => y <= end)
            .map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
        </select>
      </label>
      <span className="text-ink-faint">&rarr;</span>
      <label className="flex items-center gap-2">
        <span className="text-ink-faint uppercase tracking-wide font-medium">To</span>
        <select
          value={end}
          onChange={(e) => {
            const y = Number(e.target.value);
            onChangeEnd(y < start ? start : y);
          }}
          className="bg-paper-raised-2 border border-grid rounded-md px-3 py-2 text-ink font-medium hover:border-tide cursor-pointer transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brass-bright/30"
        >
          {years
            .filter((y) => y >= start)
            .map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
