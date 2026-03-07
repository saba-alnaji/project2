import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Download, Printer, Search } from "lucide-react";

interface Column {
  field: string;
  headerName: string;
  cellRenderer?: (value: any, row: any) => React.ReactNode;
  cellClassName?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  pageSize?: number;
  title?: string;
  showExport?: boolean;
  showPrint?: boolean;
  searchable?: boolean;
}

export default function DataTable({
  columns,
  data,
  pageSize = 5,
  title,
  showExport = true,
  showPrint = true,
  searchable = true,
}: DataTableProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(pageSize);

  const filtered = search
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.field] ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  const exportCsv = () => {
    const header = columns.map(c => c.headerName).join(",");
    const rows = filtered.map(row => columns.map(c => `"${row[c.field] ?? ""}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "data"}.csv`;
    a.click();
  };

  const printTable = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html dir="rtl"><head><title>${title || "طباعة"}</title>
      <style>body{font-family:Cairo,sans-serif;direction:rtl}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f5f5f5}h2{text-align:center}</style>
      </head><body>
      ${title ? `<h2>${title}</h2>` : ""}
      <table><thead><tr>${columns.map(c => `<th>${c.headerName}</th>`).join("")}</tr></thead>
      <tbody>${filtered.map(row => `<tr>${columns.map(c => `<td>${row[c.field] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <script>window.print();window.close();</script></body></html>`;
    printWindow.document.write(html);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {searchable && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="بحث..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}
        <div className="flex gap-2">
          {showExport && (
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium gradient-primary text-white shadow-sm hover:shadow-card transition-all">
              <Download className="w-3.5 h-3.5" /> تصدير CSV
            </button>
          )}
          {showPrint && (
            <button onClick={printTable} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
              <Printer className="w-3.5 h-3.5" /> طباعة
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map(col => (
                <th key={col.field} className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.field} className={cn("px-4 py-3 whitespace-nowrap", col.cellClassName)}>
                      {col.cellRenderer ? col.cellRenderer(row[col.field], row) : (row[col.field] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>عرض</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(0); }} className="px-2 py-1 rounded-lg border border-border bg-card text-foreground text-sm">
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>من {filtered.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
