type ResultTableProps = {
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
};

export function ResultTable({ columns, rows }: ResultTableProps) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50">
        <tr>
          {columns.map((column) => (
            <th key={column} className="border-r border-zinc-200 px-4 py-2 font-mono font-bold text-zinc-700">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {rows.map((row, index) => (
          <tr key={index} className="hover:bg-zinc-50">
            {columns.map((column) => (
              <td key={column} className="border-r border-zinc-100 px-4 py-2 text-zinc-600">
                {String(row[column] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
