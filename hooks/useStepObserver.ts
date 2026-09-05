"use client";

import { RefObject, useEffect, useState } from "react";

export function useStepObserver(
  containerRef: RefObject<HTMLElement | null>,
  fallback = 0
) {
  const [step, setStep] = useState(fallback);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const steps = Array.from(
      container.querySelectorAll<HTMLElement>("[data-step]")
    );
    if (steps.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-step"));
            if (!Number.isNaN(idx)) setStep(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    steps.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [containerRef]);

  return step;
}