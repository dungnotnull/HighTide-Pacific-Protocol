import { CITATIONS } from "@/lib/citations";

// Server component: renders verified-source chips so every panel claim
// is traceable to an entry in docs/research/REFERENCES.md.
export function Cite({ ids }: { ids: string[] }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-foam/50">
      <span>Sources:</span>
      {ids.map((id) => {
        const c = (CITATIONS as Record<string, { title: string; url: string }>)[id];
        if (!c) return null;
        return (
          <a
            key={id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            title={c.title}
            className="rounded-full border border-foam/20 px-2 py-0.5 text-foam/70 transition-colors hover:border-foam/50 hover:text-foam"
          >
            {id}
          </a>
        );
      })}
    </p>
  );
}
