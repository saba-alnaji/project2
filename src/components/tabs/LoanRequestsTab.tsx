import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Info, RefreshCcw, Trash2, FileSpreadsheet, Printer } from "lucide-react";

export default function LoanRequestsTab() {
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject"; item: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`https://localhost:8080/api/Borrow/requests`, {
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

  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    const { type, item } = confirmModal;
    const requestId = item.id || item.borrowID || item.requestID;
    const token = localStorage.getItem("token");

    try {
      if (type === "approve") {
        await axios.post(`https://localhost:8080/api/Borrow/accept-online/${requestId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`https://localhost:8080/api/Borrow/reject-online`, { borrowID: requestId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success("تم تنفيذ الإجراء بنجاح");
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
      
      {/* Container الرئيسي للجدول مع التصميم الجديد */}
      <div className=" border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        
        {/* Header الداخلي للجدول (مثل الصورة) */}
        <div className="p-4  border-slate-100 flex justify-end items-center ">
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm" className="rounded-xl h-10 border-slate-200 font-bold px-4">
              <RefreshCcw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold px-4">
              <Trash2 className="w-4 h-4 ml-2" /> تنظيف المنتهي
            </Button>
          </div>


        </div>

        {/* جسم الجدول */}
        <div className="bg-card p-6 h-[800px] flex flex-col">
            
          <AgGridTable
          
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", width: 140, cellClass: "font-mono" },
              { field: "fullName", headerName: "اسم المشترك", flex: 1.2 },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1.5, cellClass: "font-bold text-slate-700" },
              { field: "requestDate", headerName: "تاريخ الطلب", width: 140 },
              { 
                headerName: "مهلة الاستلام", 
                width: 160, 
                cellRenderer: () => (
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                    <Clock className="w-3 h-3" /> باقي 48 ساعة
                  </div>
                ) 
              },
              { headerName: "الإجراءات", cellRenderer: loanActionRenderer, width: 180, filter: false },
            ]}
            rowData={loanRequests}
            // شلنا الـ title من هون عشان صار عندنا Header مخصص فوق
          />
        </div>
      </div>

      {/* مودال التأكيد (بدون تغيير في المنطق) */}
      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="rounded-[24px] sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-black flex items-center gap-2 ${confirmModal?.type === "approve" ? "text-emerald-600" : "text-rose-600"}`}>
              {confirmModal?.type === "approve" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {confirmModal?.type === "approve" ? "تأكيد عملية الإعارة" : "رفض الطلب"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-xs text-slate-400 mb-1">تفاصيل الطلب:</p>
               <p className="font-black text-slate-800 text-lg leading-tight">{confirmModal?.item?.bookTitle}</p>
               <p className="text-sm text-slate-500 mt-2 flex items-center gap-1 underline decoration-slate-200 uppercase"> {confirmModal?.item?.fullName}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 p-4 pt-0">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="rounded-xl font-bold">إلغاء</Button>
            <Button disabled={actionLoading} onClick={handleAction} className={`rounded-xl font-bold px-10 h-12 shadow-lg transition-all ${confirmModal?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"}`}>
              {actionLoading ? "جاري..." : "تأكيد نهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}