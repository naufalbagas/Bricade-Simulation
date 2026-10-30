function healthTone(h: number) {
  if (h >= 99.999) return { bar: 'bg-[#047857]', text: 'text-[#047857]', state: 'Undamaged' };
  if (h >= 70) return { bar: 'bg-[#047857]', text: 'text-[#047857]', state: 'Cumulative wear' };
  if (h >= 40) return { bar: 'bg-[#b45309]', text: 'text-[#b45309]', state: 'Moderate wear' };
  return { bar: 'bg-[#b91c1c]', text: 'text-[#b91c1c]', state: 'Severe wear' };
}

export function HealthBar({ health, startHealth }: { health: number; startHealth: number }) {
  const clamped = Math.min(100, Math.max(0, health));
  const tone = healthTone(clamped);
  const lostThisRun = Math.max(0, startHealth - clamped);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="whitespace-nowrap text-sm font-semibold text-slate-900">Bridge Health</span>
        <span className={`num whitespace-nowrap text-xl font-bold ${tone.text}`}>{clamped.toFixed(2)}%</span>
      </div>

      <div
        role="meter"
        aria-label={`Bridge Health: ${clamped.toFixed(2)}%, ${tone.state}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(clamped.toFixed(2))}
        className="mt-1.5 h-4 overflow-hidden rounded-md border border-edge bg-slate-50"
      >
        <div
          className={`h-full ${tone.bar} transition-[width] duration-200 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="num mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-600">
        <span>{tone.state}</span>
        <span>{lostThisRun > 0 ? `\u2212${lostThisRun.toFixed(2)} pts this run` : '0.00 pts this run'}</span>
      </div>
    </div>
  );
}
