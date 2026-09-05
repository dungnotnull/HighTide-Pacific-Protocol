"use client";

import { useEffect, useState } from "react";

type TideMark = { id: string; label: string };

// Section background colors used to determine the most readable contrast color automatically
const sectionBackgrounds: Record<string, string> = {
  intro: "#0a1e28",
  "part1-chart2": "#eef2ee",
  cause: "#eef2ee",
  "part2-chart1": "#eef2ee",
  indicators: "#eef2ee",
  closing: "#0a1e28",
};

function getContrastColor(background: string) {
  const hex = background.replace("#", "");
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : hex;

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "var(--ink)" : "var(--foam)";
}

function getContrastPair(background: string) {
  const color = getContrastColor(background);
  return {
    label: color,
    tick:
      color === "var(--ink)"
        ? "color-mix(in srgb, var(--ink) 30%, transparent)"
        : "color-mix(in srgb, var(--foam) 30%, transparent)",
  };
}

export function TideRail({ marks }: { marks: TideMark[] }) {
  const [progress, setProgress] = useState(0);
  const [positions, setPositions] = useState<
    { label: string; top: number; id: string }[]
  >([]);
  const [currentSection, setCurrentSection] = useState<string>("");

  useEffect(() => {
    function measure() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const y = window.scrollY;
      setProgress(total > 0 ? Math.min(1, Math.max(0, y / total)) : 0);

      const docHeight = doc.scrollHeight;
      const next = marks
        .map((m) => {
          const el = document.getElementById(m.id);
          if (!el) return null;
          const top = Math.min(
            0.92,
            Math.max(0.08, 1 - el.offsetTop / docHeight),
          );
          return { label: m.label, top, id: m.id };
        })
        .filter(Boolean) as { label: string; top: number; id: string }[];
      setPositions(next);

      // Determine current section for contrast
      const scrollMiddle = y + window.innerHeight / 2;
      const current =
        marks
          .map((m) => {
            const el = document.getElementById(m.id);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            const absoluteTop = rect.top + y;
            const absoluteBottom = absoluteTop + rect.height;
            if (scrollMiddle >= absoluteTop && scrollMiddle <= absoluteBottom) {
              return m.id;
            }
            return null;
          })
          .filter(Boolean)[0] ||
        marks[0]?.id ||
        "";

      setCurrentSection(current);
    }

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [marks]);

  const isLightBg =
    currentSection &&
    getContrastColor(sectionBackgrounds[currentSection] ?? "#0a1e28") ===
      "var(--ink)";
  const textColor = "tide-rail-label";
  const tickColor = "tide-rail-tick";

  return (
    <div
      aria-hidden
      className="fixed left-0 top-0 z-40 hidden h-screen w-9 select-none md:block"
      style={{ position: "fixed" }}
    >
      {/* the staff */}
      <div
        className={`absolute left-4 top-0 h-full w-px ${isLightBg ? "bg-ink/15" : "bg-foam/15"}`}
      />

      {/* rising water fill, bottom-anchored */}
      <div
        className="absolute left-3.25 bottom-0 w-1.5 rounded-full bg-linear-to-t from-lagoon to-coral transition-[height] duration-150 ease-out"
        style={{ height: `${progress * 100}%` }}
      />

      {/* tick + label per section */}
      {positions.map((p) => {
        const contrast = getContrastPair(sectionBackgrounds[p.id] ?? "#0a1e28");
        const markStyle = {
          top: `${p.top * 100}%`,
          ["--tide-rail-label-color" as string]: contrast.label,
          ["--tide-rail-tick-color" as string]: contrast.tick,
        };

        return (
          <div
            key={p.id}
            className="absolute left-2 flex -translate-y-1/2 items-center gap-1.5"
            style={markStyle}
          >
            <span className="tide-rail-tick h-0.75 w-2.25" />
          </div>
        );
      })}
    </div>
  );
}
