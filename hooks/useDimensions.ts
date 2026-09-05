"use client";

import { RefObject, useEffect, useState } from "react";

export function useDimensions(ref: RefObject<HTMLElement | null>) {
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return dims;
}