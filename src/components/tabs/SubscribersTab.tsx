import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, UserPlus, Info, RefreshCcw, Trash2, Mail, Phone, RotateCcw } from "lucide-react";

export default function SubscribersTab() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject" | "restore"; item: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = "https://localhost:8080/api/Subscription";

  const loadSubs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubs(res.data || []);
    } catch (error) {
      toast.error("فشل في تحميل طلبات الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubs(); }, []);

  // تنفيذ الإجراءات (قبول، رفض، أو إعادة تعيين)
  const handleAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    const { type, item } = confirmModal;
    const token = localStorage.getItem("token");

    try {
      if (type === "approve") {
        await axios.post(`${API_URL}/online/accept`, { userId: item.userId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم تفعيل اشتراك المستخدم بنجاح");
      } 
      else if (type === "reject") {
        await axios.post(`${API_URL}/online/reject/${item.userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم رفض طلب الاشتراك");
      }
      else if (type === "restore") {
        // استخدام رابط الـ PATCH الذي سألتِ عنه
        await axios.patch(`${API_URL}/status-pending/${item.userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم إعادة تعيين الطلب لحالة الانتظار");
      }
      
      setConfirmModal(null);
      loadSubs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء");
    } finally {
      setActionLoading(false);
    }
  };

  const actionRenderer = (params: any) => (
    <div className="flex gap-1.5 justify-center items-center h-full">
      <Button 
        size="sm" 
        className="bg-emerald-500 hover:bg-emerald-600 h-7 text-[10px] font-bold shadow-sm px-2"
        onClick={() => setConfirmModal({ type: "approve", item: params.data })}
      >
        <CheckCircle className="ml-1 w-3 h-3" /> قبول
      </Button>

      <Button 
        size="sm" 
        variant="destructive"
        className="h-7 text-[10px] font-bold shadow-sm px-2"
        onClick={() => setConfirmModal({ type: "reject", item: params.data })}
      >
        <XCircle className="ml-1 w-3 h-3" /> رفض
      </Button>

      {/* زر إعادة التعيين الجديد */}
      <Button 
        size="sm" 
        variant="outline"
        className="h-7 w-7 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
        title="إعادة تعيين للانتظار"
        onClick={() => setConfirmModal({ type: "restore", item: params.data })}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      <div className="border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 flex justify-end items-center ">
          <div className="flex gap-2">
            <Button onClick={loadSubs} variant="outline" size="sm" className="rounded-xl h-10 border-slate-200 font-bold px-4">
              <RefreshCcw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 h-[600px] flex flex-col">
          <AgGridTable
            columnDefs={[
              { field: "fullName", headerName: "الاسم الكامل", flex: 1.5, cellClass: "font-bold text-slate-700" },
              { field: "email", headerName: "البريد الإلكتروني", flex: 1.2, cellRenderer: (p:any) => <div className="flex items-center gap-1 text-blue-600"><Mail className="w-3 h-3"/> {p.value}</div> },
              { field: "phoneNumber", headerName: "رقم الهاتف", flex: 1, cellRenderer: (p:any) => <div className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3"/> {p.value}</div> },
              { headerName: "الإجراءات", cellRenderer: actionRenderer, width: 220, filter: false, pinned: 'left' },
            ]}
            rowData={subs}
          />
        </div>
      </div>

      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="rounded-[24px] sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-black flex items-center gap-2 
              ${confirmModal?.type === "approve" ? "text-emerald-600" : 
                confirmModal?.type === "restore" ? "text-blue-600" : "text-rose-600"}`}>
              {confirmModal?.type === "approve" && <UserPlus className="w-6 h-6" />}
              {confirmModal?.type === "restore" && <RotateCcw className="w-6 h-6" />}
              {confirmModal?.type === "reject" && <XCircle className="w-6 h-6" />}
              
              {confirmModal?.type === "approve" ? "قبول عضو جديد" : 
               confirmModal?.type === "restore" ? "إعادة الطلب للمراجعة" : "رفض الاشتراك"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
               <p className="text-[10px] text-slate-400 mb-1 text-right italic">صاحب الطلب:</p>
               <p className="font-black text-slate-800 text-lg text-right">{confirmModal?.item?.fullName}</p>
            </div>
            
            <div className={`p-3 border rounded-xl flex gap-2 
              ${confirmModal?.type === "restore" ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"}`}>
              <Info className={`w-4 h-4 mt-0.5 shrink-0 ${confirmModal?.type === "restore" ? "text-blue-600" : "text-amber-600"}`} />
              <p className={`text-[11px] leading-relaxed text-right font-medium 
                ${confirmModal?.type === "restore" ? "text-blue-800" : "text-amber-800"}`}>
                {confirmModal?.type === "approve" && "بمجرد التأكيد، سيتم تفعيل حساب العضو فوراً."}
                {confirmModal?.type === "reject" && "سيتم رفض الطلب ولن يتمكن المستخدم من الدخول."}
                {confirmModal?.type === "restore" && "سيتم إعادة حالة الطلب إلى 'منتظر' ليتمكن الموظفون من مراجعته مرة أخرى."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 p-4 pt-0">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="rounded-xl font-bold">إلغاء</Button>
            <Button 
              disabled={actionLoading} 
              onClick={handleAction} 
              className={`rounded-xl font-bold px-10 h-12 shadow-lg transition-all
                ${confirmModal?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : 
                  confirmModal?.type === "restore" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : 
                  "bg-rose-600 hover:bg-rose-700 shadow-rose-100"}`}
            >
              {actionLoading ? "جاري..." : "تأكيد الإجراء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}