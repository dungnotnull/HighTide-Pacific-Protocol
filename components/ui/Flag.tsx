export default function Flag({
  iso2,
  className = "",
}: {
  iso2: string;
  className?: string;
}) {
  return (
    <span
      className={`fi fi-${iso2.toLowerCase()} inline-block rounded-[2px] shadow-[0_0_0_1px_rgba(234,243,241,0.15)] ${className}`}
      aria-hidden="true"
    />
  );
}
