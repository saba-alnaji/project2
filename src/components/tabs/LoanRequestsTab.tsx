import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

// --- Interceptor للتعامل مع انتهاء الجلسة ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject("Unauthorized");
    }
    return Promise.reject(error);
  }
);

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function LoanRequestsTab() {
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject"; item: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/Borrow/requests`, getAuthHeader());
      setLoanRequests(res.data || []);
    } catch (error: any) {
      if (error !== "Unauthorized") {
        toast.error("حدث خطأ أثناء تحميل بيانات الإعارة");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAutoReject = async () => {
    setIsCleaning(true);
    try {
      const res = await axios.post(`/api/Borrow/auto-reject`, {}, getAuthHeader());
      toast.success(res.data.message || "تم تنظيف الطلبات المنتهية");
      loadData();
    } catch (error: any) {
      if (error !== "Unauthorized") {
        toast.error("فشل في عملية تنظيف الطلبات");
      }
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    const { type, item } = confirmModal;
    const requestId = item.requestID;

    try {
      if (type === "approve") {
        await axios.post(`/api/Borrow/accept-online/${requestId}`, {}, getAuthHeader());
        toast.success("تم قبول الإعارة وتجهيز الكتاب");
      } else {
        await axios.post(`/api/Borrow/reject-online`, { 
          RequestID: requestId,
          RejectionReason: "تم الرفض يدوياً من قبل الموظف" 
        }, getAuthHeader());
        toast.success("تم رفض الطلب ");
      }
      setConfirmModal(null);
      loadData();
    } catch (error: any) {
      if (error !== "Unauthorized") {
        toast.error(error.response?.data?.message || "تعذر تنفيذ العملية");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const loanActionRenderer = (params: any) => (
    <div className="flex gap-2 justify-center items-center h-full">
      <Button 
        size="sm" 
        className="bg-emerald-500 hover:bg-emerald-600 h-8 text-[10px] font-bold px-3"
        onClick={() => setConfirmModal({ type: "approve", item: params.data })}
      >
        <CheckCircle className="ml-1 w-3 h-3" /> قبول
      </Button>
      <Button 
        size="sm" 
        variant="destructive"
        className="h-8 text-[10px] font-bold px-3"
        onClick={() => setConfirmModal({ type: "reject", item: params.data })}
      >
        <XCircle className="ml-1 w-3 h-3" /> رفض
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header المحسن مع ملاحظة الـ 48 ساعة */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">طلبات الإعارة </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">مراجعة طلبات الإعارة المعلقة وتفعيلها</p>
            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
            <div className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100 font-bold">
              <Clock className="w-3 h-3" />
              صلاحية الطلب 48 ساعة
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAutoReject}
          disabled={isCleaning || loading}
          variant="outline" 
          size="sm" 
          className="rounded-xl h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 font-bold px-4 transition-all"
        >
          <Trash2 className={`w-4 h-4 ml-2 ${isCleaning ? 'animate-bounce' : ''}`} /> 
          {isCleaning ? "جاري التنظيف..." : "تنظيف المنتهي"}
        </Button>
      </div>

      {/* 2. الجدول (الجزء الذي كان مفقوداً) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden p-6 h-[500px] flex flex-col">
        <AgGridTable
          columnDefs={[
            { field: "fullName", headerName: "اسم المستعير", flex: 1.2, cellClass: "font-bold text-slate-800" },
            { field: "bookTitle", headerName: "الكتاب المطلوب", flex: 1.5, cellClass: "font-medium text-primary" },
            { field: "calassCode", headerName: "رمز التصنيف", width: 130 },
            { field: "address", headerName: "العنوان", flex: 1 },
            { 
              headerName: "الإجراءات", 
              cellRenderer: loanActionRenderer, 
              width: 180, 
              filter: false,
              sortable: false 
            },
          ]}
          rowData={loanRequests}
        />
      </div>

      {/* 3. Confirmation Modal */}
      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="rounded-[24px] sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-black flex items-center gap-2 ${confirmModal?.type === "approve" ? "text-emerald-600" : "text-rose-600"}`}>
              {confirmModal?.type === "approve" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {confirmModal?.type === "approve" ? "تأكيد الإعارة" : "رفض الطلب"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="font-black text-slate-800 text-lg leading-tight">{confirmModal?.item?.bookTitle}</p>
              <p className="text-sm text-slate-500 mt-2">{confirmModal?.item?.fullName}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 p-4 pt-0">
            <Button variant="ghost" className="rounded-xl" onClick={() => setConfirmModal(null)}>إغلاق</Button>
            <Button 
              disabled={actionLoading} 
              onClick={handleAction} 
              className={`rounded-xl font-bold px-10 h-12 ${confirmModal?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              {actionLoading ? "جاري..." : "تأكيد نهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}