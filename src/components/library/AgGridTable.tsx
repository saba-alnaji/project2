import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { Download, Printer } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const myTheme = themeQuartz.withParams({
  fontFamily: "Cairo, sans-serif",
  headerFontSize: 14,
  fontSize: 13,
});

interface AgGridTableProps {
  columnDefs: any[];
  rowData: any[];
  title?: string;
  showExport?: boolean;
  showPrint?: boolean;
  pageSize?: number;
}

export default function AgGridTable({
  columnDefs,
  rowData,
  title,
  showExport = true,
  showPrint = true,
  pageSize = 5,
}: AgGridTableProps) {
  const gridRef = useRef<AgGridReact>(null);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    filter: true,
    editable: false,
    resizable: false,
    suppressMovable: true,
    autoHeight: true,
    wrapText: true,
    cellStyle: { 'white-space': 'normal' as const },
  }), []);

  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `${title || "data"}.csv` });
  }, [title]);

  const printTable = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const filteredData: any[] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) filteredData.push(node.data);
    });

    const cols = columnDefs.filter(c => c.field !== "actions");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html dir="rtl"><head><title>${title || "طباعة"}</title>
      <style>body{font-family:Cairo,sans-serif;direction:rtl}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f5f5f5}h2{text-align:center}</style>
      </head><body>
      ${title ? `<h2>${title}</h2>` : ""}
      <table><thead><tr>${cols.map((c: any) => `<th>${c.headerName}</th>`).join("")}</tr></thead>
      <tbody>${filteredData.map(row => `<tr>${cols.map((c: any) => `<td>${row[c.field] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <script>window.print();window.close();<\/script></body></html>`;
    printWindow.document.write(html);
  }, [columnDefs, title]);

  return (
    <div>
      {(showExport || showPrint) && (
        <div className="flex gap-2 mb-3">
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
      )}
      <div className="rounded-xl overflow-hidden border border-border" style={{ width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={myTheme}
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[5, 10, 20, 50, 100]}
          enableRtl={true}
          enableBrowserTooltips={true}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}
