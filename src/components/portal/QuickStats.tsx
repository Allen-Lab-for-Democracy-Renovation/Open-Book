interface QuickStat {
  label: string;
  value: string;
  detail?: string;
}

export default function QuickStats({
  title,
  stats,
}: {
  title?: string;
  stats: QuickStat[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-full">
      {title && (
        <h3 className="text-sm font-display font-medium text-gray-700 mb-4">
          {title}
        </h3>
      )}
      <dl className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-gray-500">{stat.label}</dt>
            <dd className="mt-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {stat.value}
              </span>
              {stat.detail && (
                <span className="block text-xs text-gray-500 mt-0.5">
                  {stat.detail}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
