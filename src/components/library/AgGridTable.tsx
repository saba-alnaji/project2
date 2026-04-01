import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { Download, Printer } from "lucide-react";
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
  }), []);

const exportCsv = useCallback(() => {
  if (!gridRef.current?.api) return;

  const params = {
    fileName: `${title || "data"}.csv`,
    prependContent: "\uFEFF", // ضروري جداً للعربي
    processCellCallback: (params: any) => {
      const value = params.value;

      // 1. إذا كانت القيمة عبارة عن نص يحتوي على HTML (بسبب الـ Renderers)
      // سنقوم بتنظيفها للتأكد من تصدير النص فقط
      if (typeof value === 'string' && value.includes('<')) {
        return value.replace(/<[^>]*>?/gm, ''); 
      }

      // 2. استخدام الـ Formatter الذي مررته من الصفحة الأب
      if (printValueFormatter) {
        return printValueFormatter(params.column.getColId(), value);
      }

      return value;
    }
  };

  gridRef.current.api.exportDataAsCsv(params);
}, [title, printValueFormatter]);

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
        } else {
          if (c.field?.toLowerCase().includes('date') && val && val !== "-") {
            const d = new Date(val);
            val = isNaN(d.getTime()) ? val : d.toLocaleDateString('ar-EG');
          }
        }
        return `<td>${val ?? "-"}</td>`;
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

        <div class="footer-section">
          <div style="text-align: center;">ختم المؤسسة<br><br>...........................</div>
          <div style="text-align: center;">توقيع الموظف المسؤول<br><br>...........................</div>
        </div>

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
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all">
              <Download className="w-3.5 h-3.5" /> تصدير CSV
            </button>
          )}
          {showPrint && (
            <button onClick={printTable} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all">
              <Printer className="w-3.5 h-3.5" /> طباعة التقرير
            </button>
          )}
        </div>
      )}
      
      <div className="rounded-xl overflow-hidden border border-border flex-1 min-h-[500px] bg-white">
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
        />
      </div>
    </div>
  );
}