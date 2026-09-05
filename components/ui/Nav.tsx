"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Start", code: "—" },
  { href: "/part1/chart1", label: "Sea Level by Year", code: "P1 · C1" },
  { href: "/part1/chart2", label: "Sea Level Race", code: "P1 · C2" },
  { href: "/part2/chart1", label: "Water Rankings", code: "P2 · C1" },
  { href: "/part2/chart2", label: "Water: Urban / Rural", code: "P2 · C2" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="instrument-panel sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-display text-xl tracking-tight text-brass-bright">
              Tide&nbsp;&amp;&nbsp;Table
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Pacific Dataviz Challenge
            </span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.slice(1).map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`group relative px-3 py-2 rounded-md font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors ${
                    active
                      ? "text-paper bg-brass-bright"
                      : "text-ink-dim hover:text-ink hover:bg-paper-raised-2"
                  }`}
                  title={l.label}
                >
                  {l.code}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
