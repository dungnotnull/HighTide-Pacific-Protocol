export function SourceNote({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`eyebrow flex flex-wrap gap-x-2 gap-y-1 text-[0.68rem] leading-relaxed text-ink/55 ${className}`}
    >
      {children}
    </p>
  );
}