"use client";

import { useState, useCallback, useEffect, useRef } from "react";


interface TimelineControlProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
  trackClassName?: string;
}

export function TimelineControl({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  trackClassName
}: TimelineControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  // Auto-play logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const nextYear = currentYear >= maxYear ? minYear : currentYear + 1;
        onYearChange(nextYear);
        if (nextYear === maxYear) {
            // Optional: stop at the end or loop
            setIsPlaying(false);
        }
      }, 1500); // 1.5 seconds per year
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentYear, maxYear, minYear, onYearChange]);

  // Scroll to active year
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.querySelector<HTMLElement>('[data-active="true"]');
      
      if (activeElement) {
        // Only scroll if there is actual overflow
        if (container.scrollWidth > container.clientWidth) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = activeElement.getBoundingClientRect();
          
          // Calculate the difference between element center and container center
          const elementCenter = elementRect.left + (elementRect.width / 2);
          const containerCenter = containerRect.left + (containerRect.width / 2);
          
          const scrollDiff = elementCenter - containerCenter;
          
          // Smoothly scroll by the exact difference
          container.scrollBy({ left: scrollDiff, behavior: 'smooth' });
        }
      }
    }
  }, [currentYear]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  const handleYearClick = (year: number) => {
    setIsPlaying(false);
    onYearChange(year);
  };

  return (
    <div className="flex items-center gap-0 w-full py-2 overflow-hidden select-none">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="shrink-0 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-lagoon/30 text-lagoon hover:bg-lagoon/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-lagoon mt-1 mr-1"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 fill-current ml-1" viewBox="0 0 24 24">
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        )}
      </button>

      {/* Left Chevron */}
      <button 
        onClick={scrollLeft}
        className="shrink-0 text-lagoon/40 hover:text-lagoon transition-colors outline-none cursor-pointer p-1"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Timeline Track */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto no-scrollbar scroll-smooth relative h-16"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center w-max min-w-full px-4 md:px-6 h-full">
            <div className={`relative w-full h-8 flex items-center ${trackClassName || "min-w-[800px] md:min-w-[1000px]"}`}>
                {/* Background Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-lagoon/20 rounded-full z-0"></div>
                
                {/* Filled Line */}
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-lagoon z-10 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(years.indexOf(currentYear) / (years.length - 1)) * 100}%` }}
                ></div>

                {/* Year Dots */}
                {years.map((year, index) => {
                    const isActive = year === currentYear;
                    const isPast = year <= currentYear;
                    const leftPos = `${(index / (years.length - 1)) * 100}%`;
                    
                    return (
                        <div 
                            key={year} 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group z-20"
                            style={{ left: leftPos }}
                            onClick={() => handleYearClick(year)}
                            data-active={isActive}
                        >
                            {/* Dot Wrapper */}
                            <div className="h-6 w-6 flex items-center justify-center relative">
                                <div className="absolute w-3 h-3 bg-foam rounded-full z-0"></div>
                                <div 
                                    className={`w-3 h-3 rounded-full z-10 transition-all duration-300 ease-out
                                        ${isActive 
                                            ? 'bg-lagoon ring-[4px] ring-white shadow-sm scale-125' 
                                            : isPast 
                                                ? 'bg-lagoon group-hover:scale-125' 
                                                : 'bg-lagoon/30 group-hover:bg-lagoon/50 group-hover:scale-125'}
                                    `}
                                ></div>
                            </div>
                            {/* Year Label */}
                            <div className="mt-1 absolute top-5 left-1/2 -translate-x-1/2 text-center w-max">
                                <span 
                                    className={`text-[11px] md:text-xs transition-all duration-300 block
                                        ${isActive ? 'text-lagoon scale-110' : 'text-slate-400 font-medium group-hover:text-lagoon/70'}
                                    `}
                                    style={{
                                        WebkitTextStroke: isActive ? '0.2px currentColor' : '0px',
                                    }}
                                >
                                    {year}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Right Chevron */}
      <button 
        onClick={scrollRight}
        className="shrink-0 text-lagoon/40 hover:text-lagoon transition-colors outline-none cursor-pointer p-1"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
