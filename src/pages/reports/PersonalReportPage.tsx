import { useState, useEffect, useCallback } from "react";
import { Search, Download } from "lucide-react"; // أضفنا أيقونة التحميل
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";

const API_BASE = "/api";

export default function PersonalReportPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriber, setSubscriber] = useState(null);
  const [tab, setTab] = useState("current");
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState([]);
  
  // إعدادات الترقيم
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // --- دالة التصدير الجديدة ---
  const handleExport = async () => {
    if (!subscriber?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      // بناء الرابط حسب المطلوب: /api/PersonalReportExport/export?type=...&memberId=...
      const exportUrl = `${API_BASE}/PersonalReportExport/export?type=${tab}&memberId=${subscriber.id}`;

      const res = await fetch(exportUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("فشل في تصدير الملف");

      // تحويل الاستجابة إلى ملف (Blob) وتحميله
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${tab}_${subscriber.name}.xlsx`; // اسم الملف المقترح
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "تم بدء تحميل الملف بنجاح" });
    } catch (error) {
      console.error("Export Error:", error);
      toast({ title: "خطأ أثناء التصدير", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // دالة جلب البيانات
  const fetchData = useCallback(async (memberId) => {
    if (!memberId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const endpoints = {
        current: `${API_BASE}/PersonalReport/current-borrows`,
        history: `${API_BASE}/PersonalReport/borrow-history`,
        subscriptions: `${API_BASE}/PersonalReport/subscriptions`,
        fines: `${API_BASE}/PersonalReport/fines`,
      };

      const queryParams = new URLSearchParams({
        memberId: memberId.toString(),
        pageNumber: page.toString(),
        pageSize: pageSize.toString()
      }).toString();

      const res = await fetch(`${endpoints[tab]}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("فشل في جلب البيانات");
      
      const response = await res.json();
      const items = response.items || response.data || (Array.isArray(response) ? response : []);
      const total = response.totalCount || response.total || items.length;

      setRowData(items);
      setTotalRows(total);
    } catch (error) {
      toast({ title: "خطأ في تحميل البيانات", variant: "destructive" });
      setRowData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, pageSize, toast]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const body = /^\d+$/.test(searchQuery) 
        ? { memberNumber: searchQuery, idNumber: null, status: null }
        : { memberNumber: null, idNumber: searchQuery, status: null };

      const res = await fetch(`${API_BASE}/Subscription/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setSubscriber(data);
      setPage(1); 
    } catch (error) {
      toast({ title: "المشترك غير موجود", variant: "destructive" });
      setSubscriber(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subscriber?.id) {
      fetchData(subscriber.id);
    }
  }, [tab, page, fetchData, subscriber]);

  const getColumns = () => {
    switch(tab) {
      case "current": return [
        { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1 },
        { field: "barcode", headerName: "الباركود" },
        { field: "loanDate", headerName: "تاريخ الإعارة" },
        { field: "expectedReturnDate", headerName: "موعد الإرجاع" },
      ];
      case "subscriptions": return [
        { field: "startDate", headerName: "تاريخ البدء" },
        { field: "endDate", headerName: "تاريخ الانتهاء" },
        { field: "fee", headerName: "المبلغ", valueFormatter: p => `${p.value} شيكل` },
        { field: "subscriptionType", headerName: "النوع" },
      ];
      case "history": return [
        { field: "bookTitle", headerName: "الكتاب", flex: 1 },
        { field: "loanDate", headerName: "تاريخ الإعارة" },
        { field: "actualReturnDate", headerName: "تاريخ الإرجاع" },
      ];
      case "fines": return [
        { field: "fineType", headerName: "نوع المخالفة" },
        { field: "amount", headerName: "المبلغ" },
        { field: "fineDate", headerName: "التاريخ" },
      ];
      default: return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <Search className="w-5 h-5 text-blue-500" /> البحث عن مشترك
        </h3>
        <div className="flex gap-2">
          <input 
            className={cn(
              "flex-1 border-2 p-3 rounded-xl focus:border-blue-500 outline-none transition-all",
              "placeholder:text-gray-400"
            )}
            placeholder="رقم الهوية أو رقم العضوية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "جاري البحث..." : "بحث"}
          </button>
        </div>
      </div>

      {subscriber && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-700">تقرير المشترك: {subscriber.name}</h2>
            
            {/* زر التصدير الجديد */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              تصدير {tab === 'current' ? 'الإعارات' : tab === 'history' ? 'السجل' : tab === 'subscriptions' ? 'الاشتراكات' : 'المخالفات'}
            </button>
          </div>
          
          <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-2xl">
            {[
              { id: "current", label: "الإعارات الحالية" },
              { id: "subscriptions", label: "الاشتراكات" },
              { id: "history", label: "سجل الإعارات" },
              { id: "fines", label: "المخالفات" }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => { setTab(t.id); setPage(1); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  tab === t.id ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AgGridTable columnDefs={getColumns()} rowData={rowData} />

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >السابق</button>
            <span className="font-medium text-gray-600 italic">
              صفحة {page} من {Math.ceil(totalRows / pageSize) || 1}
            </span>
            <button 
              disabled={page >= Math.ceil(totalRows / pageSize) || loading}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}