type MetricCardProps = {
  label: string;
  value: number;
  helper: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5">
      <div
        aria-label={`${label}: ${percentage}%`}
        className="mx-auto grid h-24 w-24 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#2563EB ${percentage * 3.6}deg, #EEF2FF 0deg)`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
          <span className="text-xl font-semibold text-gray-950">
            {percentage}
          </span>
        </div>
      </div>
      <h3 className="mt-4 text-center text-sm font-semibold text-gray-950">
        {label}
      </h3>
      <p className="mt-1 text-center text-xs leading-5 text-gray-500">{helper}</p>
    </div>
  );
}
