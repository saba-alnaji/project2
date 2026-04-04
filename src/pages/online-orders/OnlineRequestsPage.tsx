import { useState, useEffect } from "react";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Book, User, Trash2, RefreshCcw, Info } from "lucide-react";

const API_BASE_URL = "https://localhost:8080"; 
const getToken = () => localStorage.getItem("token") ?? "";

type Tab = "loans" | "subscribers";

export default function OnlineRequestsPage() {
  const [tab, setTab] = useState<Tab>("loans");
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject"; item: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // دالة جلب البيانات من السيرفر
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Borrow/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("فشل في جلب الطلبات");
      const data = await res.json();
      setLoanRequests(data || []);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // دالة تنظيف الطلبات المنتهية (أكثر من يومين)
  const handleAutoReject = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Borrow/auto-reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "تم تنظيف الطلبات المنتهية بنجاح");
        loadData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في عملية التنظيف");
    } finally {
      setActionLoading(false);
    }
  };

  // دالة قبول أو رفض الطلب
  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    const { type, item } = confirmModal;
    
    // ملاحظة: نستخدم id أو borrowID حسب ما يرجعه الـ API في قائمة requests
    const requestId = item.id || item.borrowID;

    try {
      let url = "";
      let options: RequestInit = {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
      };

      if (type === "approve") {
        url = `${API_BASE_URL}/api/Borrow/accept-online/${requestId}`;
      } else {
        url = `${API_BASE_URL}/api/Borrow/reject-online`;
        options.body = JSON.stringify({ borrowID: requestId });
      }

      const res = await fetch(url, options);
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "تم تنفيذ الإجراء بنجاح");
        setConfirmModal(null);
        loadData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "تعذر تنفيذ العملية");
    } finally {
      setActionLoading(false);
    }
  };

  // رندر أزرار التحكم داخل الجدول
  const loanActionRenderer = (params: any) => (
    <div className="flex gap-2 justify-center items-center h-full">
      <Button 
        size="sm" 
        className="bg-emerald-500 hover:bg-emerald-600 h-8 text-xs font-bold shadow-sm"
        onClick={() => setConfirmModal({ type: "approve", item: params.data })}
      >
        <CheckCircle className="ml-1 w-3.5 h-3.5" /> قبول
      </Button>
      <Button 
        size="sm" 
        variant="destructive"
        className="h-8 text-xs font-bold shadow-sm"
        onClick={() => setConfirmModal({ type: "reject", item: params.data })}
      >
        <XCircle className="ml-1 w-3.5 h-3.5" /> رفض
      </Button>
    </div>
  );

  return (
    <div className="mx-auto p-6 max-w-7xl space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">إدارة طلبات الأونلاين</h1>
          <p className="mt-1 text-slate-500">طلبات حجز الكتب (صلاحية الحجز: 48 ساعة فقط)</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={loadData}
            variant="outline"
            disabled={loading}
            className="rounded-xl font-bold"
          >
            <RefreshCcw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </Button>

          <Button 
            onClick={handleAutoReject}
            disabled={actionLoading}
            variant="outline"
            className="border-amber-500 bg-amber-50/30 hover:bg-amber-50 font-bold text-amber-700 rounded-xl"
          >
            <Trash2 className="ml-2 w-4 h-4" />
            تنظيف المنتهي
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-md">
        <button 
          onClick={() => setTab("loans")} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${tab === "loans" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
        >
          <Book className="w-4 h-4" /> طلبات الإعارة
        </button>
        <button 
          onClick={() => setTab("subscribers")} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${tab === "subscribers" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
        >
          <User className="w-4 h-4" /> طلبات الاشتراك
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white p-4 border rounded-2xl h-[600px] shadow-sm">
        {tab === "loans" ? (
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", width: 120 },
              { field: "fullName", headerName: "اسم المشترك", flex: 1 },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1.2 },
              { 
                field: "requestDate", 
                headerName: "تاريخ الطلب", 
                width: 130,
                valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-" 
              },
              {
                headerName: "مهلة الاستلام",
                width: 140,
                cellRenderer: () => (
                  <div className="flex items-center gap-1  text-amber-600">
                    <Clock className="w-3.5 h-3.5" /> باقي 48 ساعة
                  </div>
                )
              },
              { 
                headerName: "الإجراءات", 
                cellRenderer: loanActionRenderer, 
                width: 180, 
                filter: false 
              },
            ]}
            rowData={loanRequests}
            title="طلبات حجز الكتب الحالية"
          />
        ) : (
          <div className="flex justify-center items-center h-full font-medium text-slate-400">
            قائمة طلبات الاشتراك (سيتم ربطها بـ API المشتركين)
          </div>
        )}
      </div>

      {/* Modal التفعيل / الرفض */}
      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${confirmModal?.type === "approve" ? "text-emerald-600" : "text-rose-600"}`}>
              {confirmModal?.type === "approve" ? <CheckCircle /> : <XCircle />}
              {confirmModal?.type === "approve" ? "تفعيل عملية الإعارة" : "رفض وإلغاء الطلب"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700">{confirmModal?.item?.bookTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{confirmModal?.item?.fullName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Info className="mt-0.5 w-4 h-4 text-blue-500" />
              <p className="text-xs text-blue-700 leading-relaxed">
                {confirmModal?.type === "approve" 
                  ? "سيتم احتساب مدة الـ 14 يوم للإعارة ابتداءً من تاريخ الحجز الأصلي (أونلاين). يرجى التأكد من تسليم الكتاب للمشترك يدوياً."
                  : "سيؤدي هذا الإجراء إلى حذف الطلب نهائياً وإتاحة الكتاب للإعارة لمشترك آخر."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="font-bold rounded-xl">إلغاء</Button>
            <Button 
              disabled={actionLoading}
              onClick={handleAction}
              className={`rounded-xl font-bold px-8 ${confirmModal?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              {actionLoading ? "جاري المعالجة..." : "تأكيد الإجراء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}