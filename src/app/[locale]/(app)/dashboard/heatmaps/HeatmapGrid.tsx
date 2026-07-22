export function HeatmapGrid({
  title,
  columns,
  data,
}: {
  title: string;
  columns: string[];
  data: Record<string, Record<string, number>>;
}) {
  const instrumentNames = Object.keys(data);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <h3 className="mb-3 font-bold text-text-primary">{title}</h3>
      <table className="w-full text-sm text-text-primary">
        <thead>
          <tr>
            <th className="p-1 text-left text-text-muted"></th>
            {columns.map((c) => (
              <th key={c} className="p-1 text-text-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {instrumentNames.map((name) => (
            <tr key={name}>
              <td className="p-1 text-text-muted">{name}</td>
              {columns.map((_, colIndex) => {
                const value = data[name][String(colIndex)] ?? data[name][columns[colIndex]];
                return (
                  <td
                    key={colIndex}
                    className={`p-1 text-center ${value === undefined ? '' : value >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}
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
  );
}
