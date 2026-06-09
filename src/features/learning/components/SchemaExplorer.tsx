import { Database } from "lucide-react";
import type { SchemaTable } from "../../../shared/types/sql-arena";

type SchemaExplorerProps = {
  tables: SchemaTable[];
};

export function SchemaExplorer({ tables }: SchemaExplorerProps) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900">
        <Database className="h-4 w-4 text-indigo-500" />
        Tabelas disponiveis
      </h2>

      <div className="space-y-4">
        {tables.map((table) => (
          <div key={table.name} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 font-mono text-sm font-bold text-zinc-800">
              {table.name}
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-zinc-100">
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <td className="w-1/3 px-4 py-2 font-mono text-indigo-600">{column.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                      {column.type}
                      {column.isPrimary ? " (PK)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
