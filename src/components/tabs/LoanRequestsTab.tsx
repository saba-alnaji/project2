import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Trash2, MapPin, Hash, Maximize } from "lucide-react";

export default function LoanRequestsTab() {
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject"; item: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/Borrow/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoanRequests(res.data || []);
    } catch (error: any) {
      toast.error("حدث خطأ أثناء تحميل بيانات الإعارة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAutoReject = async () => {
    setIsCleaning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`/api/Borrow/auto-reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "تم تنظيف الطلبات المنتهية");
      loadData();
    } catch (error: any) {
      toast.error("فشل في عملية تنظيف الطلبات");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    const { type, item } = confirmModal;
    
    const requestId = item.requestID; 
    const token = localStorage.getItem("token");

    try {
      if (type === "approve") {
        await axios.post(`/api/Borrow/accept-online/${requestId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("تم قبول الإعارة وتجهيز الكتاب");
      } else {
        await axios.post(`/api/Borrow/reject-online`, { 
          RequestID: requestId,
          RejectionReason: "تم الرفض يدوياً من قبل الموظف" 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم رفض الطلب وإعادة الكتاب للمكتبة");
      }
      setConfirmModal(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "تعذر تنفيذ العملية");
    } finally {
      setActionLoading(false);
    }
  };

  const loanActionRenderer = (params: any) => (
    <div className="flex gap-2 justify-center items-center h-full">
      <Button 
        size="sm" 
        className="bg-emerald-500 hover:bg-emerald-600 h-8 text-[10px] font-bold"
        onClick={() => setConfirmModal({ type: "approve", item: params.data })}
      >
        <CheckCircle className="ml-1 w-3 h-3" /> قبول
      </Button>
      <Button 
        size="sm" 
        variant="destructive"
        className="h-8 text-[10px] font-bold"
        onClick={() => setConfirmModal({ type: "reject", item: params.data })}
      >
        <XCircle className="ml-1 w-3 h-3" /> رفض
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      <div className=" border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-4 border-slate-100 flex justify-end items-center ">
          <div className="flex gap-2">
            <Button 
              onClick={handleAutoReject}
              disabled={isCleaning}
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 font-bold px-4"
            >
              <Trash2 className={`w-4 h-4 ml-2 ${isCleaning ? 'animate-bounce' : ''}`} /> 
              {isCleaning ? "جاري التنظيف..." : "تنظيف المنتهي"}
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 h-[700px] flex flex-col">
          <AgGridTable
            columnDefs={[
              { field: "fullName", headerName: "اسم المستعير", flex: 1, cellClass: "font-bold text-slate-800" },
              { field: "bookTitle", headerName: "الكتاب المطلوب", flex: 1.3, cellClass: "text-primary font-medium" },
              { 
                field: "calassCode", 
                headerName: "رمز التصنيف", 
                width: 130,
                cellRenderer: (p:any) => <div className="flex items-center ">{p.value}</div>
              },
              { 
                field: "dimensions", 
                headerName: "الأبعاد", 
                width: 120,
                cellRenderer: (p:any) => <div className="flex items-center ">{p.value}</div>
              },
              { 
                field: "address", 
                headerName: "العنوان", 
                flex: 1,
                cellRenderer: (p:any) => <div className="flex items-center ">{p.value}</div>
              },
              { 
                headerName: "الحالة الزمنية", 
                width: 160, 
                cellRenderer: () => (
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                    <Clock className="w-3 h-3" />  أقل من 48 ساعة
                  </div>
                ) 
              },
              { headerName: "الإجراءات", cellRenderer: loanActionRenderer, width: 170, filter: false },
            ]}
            rowData={loanRequests}
          />
        </div>
      </div>

      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="rounded-[24px] sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-black flex items-center gap-2 ${confirmModal?.type === "approve" ? "text-emerald-600" : "text-rose-600"}`}>
              {confirmModal?.type === "approve" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {confirmModal?.type === "approve" ? "تأكيد الإعارة الأونلاين" : "رفض طلب الإعارة"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-xs text-slate-400 mb-4">تفاصيل الكتاب والمستعير:</p>
               <p className="font-black text-slate-800 text-lg leading-tight">{confirmModal?.item?.bookTitle}</p>
               <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                 <p className="text-sm text-slate-500 flex items-center gap-1 "> {confirmModal?.item?.fullName}</p>
               </div>
            </div>
            {confirmModal?.type === "approve" && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[11px] leading-relaxed">
                ملاحظة: عند القبول، سيتم حجز الكتاب رسمياً للمشترك وتغيير حالته إلى "مستعار".
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 p-4 pt-0">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="rounded-xl font-bold">إغلاق</Button>
            <Button disabled={actionLoading} onClick={handleAction} className={`rounded-xl font-bold px-10 h-12 shadow-lg transition-all ${confirmModal?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"}`}>
              {actionLoading ? "جاري المعالجة..." : "تأكيد نهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}