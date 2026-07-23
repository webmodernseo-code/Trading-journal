export function HeatmapGrid({
  title,
  columns,
  data,
}: {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, Record<string, number>>;
}) {
  const instrumentNames = Object.keys(data);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <h3 className="mb-3 font-bold text-text-primary">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-text-primary">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-1 text-left text-text-muted"></th>
              {columns.map((c) => (
                <th key={c.key} className="p-1 text-text-muted">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instrumentNames.map((name) => (
              <tr key={name}>
                <td className="sticky left-0 z-10 bg-surface p-1 text-text-muted">{name}</td>
                {columns.map((c) => {
                  const value = data[name][c.key];
                  return (
                    <td
                      key={c.key}
                      className={`p-1 text-center ${value === undefined ? '' : value >= 0 ? 'bg-gain-dim text-gain' : 'bg-loss-dim text-loss'}`}
                    >
                      {value !== undefined ? value.toFixed(1) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
