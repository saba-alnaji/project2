import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import libraryLogo from "../../assets/library-logo.png";

ModuleRegistry.registerModules([AllCommunityModule]);

const myTheme = themeQuartz.withParams({
  fontFamily: "Cairo, sans-serif",
  headerFontSize: 14,
  fontSize: 13,
  borderRadius: 0,
});

interface AgGridTableProps {
  columnDefs: any[];
  rowData: any[];
  title?: string;
  showExport?: boolean;
  showPrint?: boolean;
  pageSize?: number;
  enableRtl?: boolean;
  printValueFormatter?: (field: string, value: any) => string; // مهم جداً
}

export default function AgGridTable({
  columnDefs,
  rowData,
  title,
  showExport = true,
  showPrint = true,
  pageSize = 10,
  printValueFormatter,
}: AgGridTableProps) {
  const gridRef = useRef<AgGridReact>(null);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    filter: true,
    editable: false,
    resizable: true,
    suppressMovable: true,
    wrapText: true,
    cellStyle: { whiteSpace: 'normal' as const },
    // التعديل: إضافة قراءة القيمة للتلميح (Tooltip)
    tooltipValueGetter: (p: any) => p.value,
  }), []);

  const exportExcel = useCallback(() => {
    if (!gridRef.current?.api) return;

    const data: any[] = [];

    gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
      if (!node.data) return;

      const row: any = {};

      columnDefs.forEach((col: any) => {
        if (col.field === "actions") return;

        let value = node.data[col.field];

        if (printValueFormatter) {
          value = printValueFormatter(col.field, value);
        }

        if (typeof value === "string") {
          value = value.replace(/<[^>]*>?/gm, "");
        }

        row[col.headerName] = value ?? "-";
      });

      data.push(row);
    });

    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A3" } as any);

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [[title || "تقرير"]],
      { origin: "A1" }
    );
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) => (row[key] ? row[key].toString().length : 0))
      ) + 2
    }));

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `${title || "data"}.xlsx`);
  }, [columnDefs, title, printValueFormatter]);

  const printTable = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const filteredData: any[] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) filteredData.push(node.data);
    });

    const cols = columnDefs.filter(c => c.field !== "actions");

    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });

    const tableRows = filteredData.map(row => {
      const cells = cols.map(c => {
        let val = row[c.field];

        if (printValueFormatter) {
          val = printValueFormatter(c.field, val);
        }

        if (
          (!val || val === row[c.field]) &&
          c.field?.toLowerCase().includes("date") &&
          val
        ) {
          const d = new Date(val);
          val = isNaN(d.getTime()) ? val : d.toLocaleDateString("ar-EG");
        }


        if (typeof val === "string") {
          val = val.replace(/<[^>]*>?/gm, "");
        }
        return `<td>${String(val ?? "-")}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
      <head>
        <title>${title || "تقرير"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; color: #333; }
          .header-table { width: 100%; border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; border-collapse: collapse; }
          .header-table td { border: none !important; vertical-align: middle; }
          .info-side { width: 30%; font-size: 12px; line-height: 1.6; text-align: right; }
          .logo-center { width: 40%; text-align: center; }
          .left-side { width: 30%; text-align: left; font-size: 11px; color: #555; }
          .report-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; text-decoration: underline; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
          table.data-table th { background: #f0f0f0; }
          .footer-section { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 40px; }
       @media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  table.data-table {
    direction: rtl;
  }

  table {
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .footer-section {
    page-break-inside: avoid;
  }
}
          </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="info-side">
              <div>اليوم: ${dayName}</div>
              <div>التاريخ: ${dateStr}</div>
              <div>الوقت: ${timeStr}</div>
            </td>
            <td class="logo-center">
              <img src="${libraryLogo}" style="width: 85px; height: auto; mix-blend-mode: multiply;"/>
              <div style="font-weight:bold; font-size: 18px;">بلدية طولكرم</div>
              <div style="font-size: 13px;">المكتبة العامة</div>
            </td>
            <td class="left-side">
              <div>تقارير عامة</div>
              <div>نظام الإعارات والمدفوعات</div>
            </td>
          </tr>
        </table>

        <div class="report-title">${title || "تقرير سجل البيانات"}</div>

        <table class="data-table">
          <thead>
            <tr>${cols.map(c => `<th>${c.headerName}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        
        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 700);
          };
        <\/script>
      </body>
      </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }, [columnDefs, title, printValueFormatter, libraryLogo]);

  return (
    <div className="flex flex-col h-full">
      {(showExport || showPrint) && (
        <div className="flex gap-2 mb-3 shrink-0">
          {showExport && (
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all">
              <Download className="w-4 h-4" /> تصدير Excel
            </button>
          )}
          {showPrint && (
            <button onClick={printTable} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all">
              <Printer className="w-3.5 h-3.5" /> طباعة التقرير
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border flex-1 bg-white">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={myTheme}
          pagination={true}
          paginationPageSize={pageSize}
          enableRtl={true}
          animateRows={true}
          // التعديل: تفعيل خاصية تلميحات المتصفح
          enableBrowserTooltips={true}
        />
      </div>
    </div>
  );
}