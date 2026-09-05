"use client";

const subLinks = [
  { id: "change-section", label: "Change" },
  { id: "composition-section", label: "Composition" },
  { id: "distribution-section", label: "Distribution" },
];

export default function IndicatorSubNav() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {subLinks.map((l) => (
        <button
          key={l.id}
          onClick={() => scrollToSection(l.id)}
          className="px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wide transition-colors border border-grid text-ink-faint hover:text-ink hover:border-tide hover:bg-paper-raised cursor-pointer"
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
