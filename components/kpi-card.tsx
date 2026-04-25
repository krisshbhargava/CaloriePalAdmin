type Props = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
};

export function KpiCard({ label, value, sub, accent = '#6366F1' }: Props) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl p-5 min-w-[140px] flex-1"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <span className="text-4xl font-bold leading-none" style={{ color: accent }}>{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: 'var(--fg)' }}>{label}</span>
      {sub && <span className="text-xs opacity-40" style={{ color: 'var(--fg)' }}>{sub}</span>}
    </div>
  );
}
