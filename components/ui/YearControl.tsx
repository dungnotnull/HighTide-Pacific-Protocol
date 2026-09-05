"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface YearControlProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
}

export function YearControl({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
}: YearControlProps) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const isStartingRef = useRef(false);
  const isSteppingRef = useRef(false);

  // Sync display year when currentYear prop changes
  useEffect(() => {
    setDisplayYear(currentYear);
  }, [currentYear]);

  // Notify parent when display year changes
  useEffect(() => {
    // Always notify parent except during initial render
    if (isAutoPlaying || isStartingRef.current || isSteppingRef.current) {
      onYearChange(displayYear);
      isStartingRef.current = false;
      isSteppingRef.current = false;
    }
  }, [displayYear, isAutoPlaying, onYearChange]);

  // Auto play: start from minYear (1850) and increment to maxYear (2025)
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDisplayYear((prev) => {
        const nextYear = prev + 1;
        if (nextYear > maxYear) {
          setIsAutoPlaying(false);
          return maxYear;
        }
        return nextYear;
      });
    }, 1500); // 1.5 seconds per year

    return () => clearInterval(interval);
  }, [isAutoPlaying, maxYear]);

  const handleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      const willStart = !prev;
      if (willStart) {
        // Starting auto play - reset to minYear
        isStartingRef.current = true;
        setDisplayYear(minYear);
      }
      return willStart;
    });
  }, [minYear]);

  const handleStepPlay = useCallback(() => {
    const nextYear = displayYear + 1;
    if (nextYear <= maxYear) {
      isSteppingRef.current = true;
      setIsAutoPlaying(false);
      setDisplayYear(nextYear);
    }
  }, [displayYear, maxYear]);

  const handleReset = useCallback(() => {
    setIsAutoPlaying(false);
    setDisplayYear(maxYear);
  }, [maxYear]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const year = Number(e.target.value);
    setIsAutoPlaying(false);
    setDisplayYear(year);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-white/40 px-4 py-2">
      {/* Auto Play Button */}
      <button
        onClick={handleAutoPlay}
        className="rounded-full bg-coral px-3 py-1.5 text-sm font-medium text-foam transition hover:bg-coral/90 disabled:opacity-50 cursor-pointer"
        disabled={isAutoPlaying && displayYear >= maxYear}
      >
        {isAutoPlaying ? "⏸ Stop Auto" : "▶ Auto Play"}
      </button>

      {/* Step Play Button */}
      <button
        onClick={handleStepPlay}
        className="rounded-full bg-lagoon px-3 py-1.5 text-sm font-medium text-foam transition hover:bg-lagoon/90 disabled:opacity-50 cursor-pointer"
        disabled={displayYear >= maxYear}
      >
        ▶ By year
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="text-sm text-ink/60 hover:text-ink/80 hover:underline cursor-pointer"
        >
          Reset to {maxYear}
        </button>

        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-medium text-ink">
            {displayYear}
          </span>
        </div>

        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={displayYear}
          onChange={handleSliderChange}
          className="w-24 accent-coral"
          disabled={isAutoPlaying}
        />
      </div>

      <div className="text-xs text-ink/50">
        {minYear}–{maxYear}
      </div>
    </div>
  );
}
