/** Двухтоновая моно-колонцифра: тусклый ведущий ноль и более яркая значащая цифра. */
export function Folio({ value, size }: { value: number; size: 'lg' | 'sm' }) {
  const text = String(value).padStart(2, '0');
  return (
    <span
      aria-hidden
      className={`font-mono font-light leading-none tracking-tight tabular-nums ${
        size === 'lg' ? 'text-[22px] sm:text-[26px]' : 'text-[11px]'
      }`}
    >
      <span className="text-white/[0.16] transition-colors group-hover:text-theme-accent/40">{text.slice(0, -1)}</span>
      <span className="text-white/40 transition-colors group-hover:text-theme-accent">{text.slice(-1)}</span>
    </span>
  );
}
