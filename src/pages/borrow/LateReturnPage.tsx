import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, RefreshCw, AlertTriangle, Clock } from "lucide-react";

const getToken = (): string => localStorage.getItem("token") ?? "";

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    toast.error("انتهت الجلسة، الرجاء تسجيل الدخول مجددًا");
    setTimeout(() => { window.location.href = "/login"; }, 1500);
    return null;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? res.json() : null;
};

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
);

const glassCardClass = cn(
  "backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-800/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl"
);

export default function LateLoanPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
  const [bookConditions, setBookConditions] = useState<any[]>([]);
  const [fineTypes, setFineTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, totalLateDays: 0 });

  const [returnForm, setReturnForm] = useState({
    bookConditionID: 0,
    fineAmount: 0,
    fineTypeID: 0,
    note: "",
  });

  const loadInitialData = async () => {
    try {
      const [loansData, conditions, fines] = await Promise.all([
        apiFetch("/api/Borrow/list?status=Late"),
        apiFetch("/api/BookCondition"),
        apiFetch("/api/FineType"),
      ]);

      const data = loansData || [];
      setLoans(data);
      setBookConditions(conditions || []);
      setFineTypes(fines || []);
      setStats({
        total: data.length,
        totalLateDays: data.reduce((acc: number, curr: any) => acc + (curr.delayDays || 0), 0),
      });
    } catch (error) {
      toast.error("فشل في جلب البيانات من السيرفر");
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleRenew = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/Borrow/renew/${renewModal.borrowID}`, { method: "PATCH" });
      toast.success("تم تمديد الإعارة بنجاح");
      setRenewModal(null);
      loadInitialData();
    } catch (e) { toast.error("فشل في التجديد"); }
    finally { setSaving(false); }
  };

  const handleReturn = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/Borrow/return", {
        method: "POST",
        body: JSON.stringify({
          borrowID: returnModal.borrowID,
          bookConditionID: returnForm.bookConditionID,
          fineAmount: returnForm.fineAmount,
          fineTypeID: returnForm.fineTypeID || null,
          note: returnForm.note,
        }),
      });
      toast.success("تم إرجاع الكتاب بنجاح");
      setReturnModal(null);
      loadInitialData();
    } catch (e) { toast.error("خطأ أثناء الإرجاع"); }
    finally { setSaving(false); }
  };

  const delayCellRenderer = (params: any) => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-1 text-rose-600 font-bold">
        <Clock className="w-3.5 h-3.5" />
        <span>{params.value} يوم</span>
      </div>
    </div>
  );

  const actionCellRenderer = (params: any) => (
    <div className="flex gap-2 justify-center items-center h-full">
      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8 font-bold" onClick={() => {
        setReturnModal(params.data);
        setReturnForm({ bookConditionID: 0, fineAmount: 0, fineTypeID: 0, note: "" });
      }}>
        <CheckCircle className="w-3.5 h-3.5 ml-1" /> إرجاع
      </Button>
      <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 h-8 hover:bg-amber-600 font-bold" onClick={() => setRenewModal(params.data)}>
        <RefreshCw className="w-3.5 h-3.5 ml-1" /> تجديد
      </Button>
    </div>
  );

  return (
<div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-4 items-start lg:items-center">
          <div>
            {/* تم إضافة dark:text-slate-100 لجعل الخط أبيض في النايت مود */}
            <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-rose-500" /> إعارات متأخرة
            </h1>
            {/* تم إضافة dark:text-slate-400 هنا أيضاً */}
            <p className="text-slate-500 dark:text-slate-400 mt-1 mr-14 font-medium">إدارة الكتب التي تجاوزت فترة الإعارة المسموحة</p>
          </div>

          <div className="flex gap-3">
            <div className="bg-rose-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-80 font-medium">كتب متأخرة</div>
            </div>
            <div className="bg-orange-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.totalLateDays}</div>
              <div className="text-xs opacity-80 font-medium">إجمالي أيام التأخير</div>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        {/* تم إزالة bg-white و bg-card واستبدالها بـ dark:bg-slate-900/40 ليتناسق اللون */}
        <div className={cn(glassCardClass, "p-6 h-[550px] flex flex-col bg-white/50 dark:bg-slate-900/40 border-none shadow-2xl")}>
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", width: 120, filter: true },
              { field: "fullName", headerName: "اسم المشترك", flex: 1.2, filter: true },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1.2, filter: true },
              { field: "endDate", headerName: "موعد الإرجاع", width: 130, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { field: "delayDays", headerName: "أيام التأخير", width: 120, cellRenderer: delayCellRenderer, filter: 'agNumberColumnFilter' },
              { headerName: "الإجراءات", cellRenderer: actionCellRenderer, width: 200 }
            ]}
            pageSize={15}
            rowData={loans}
            title="قائمة المتأخرين"
          />
        </div>

        {/* Dialogs: Renew & Return */}
        <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
          <DialogContent className={glassCardClass}>
            <DialogHeader>
              <DialogTitle className="text-amber-600 flex gap-2 items-center text-xl font-bold">
                <RefreshCw className="w-5 h-5" />
                تأكيد التجديد
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-3">
              <p className="text-lg">
                تجديد إعارة <b>{renewModal?.bookTitle}</b>؟
              </p>

              {/* الجملة المطلوبة بشكل بسيط ومباشر */}
              <p className="text-sm text-amber-700 font-medium bg-amber-50 p-2 rounded-lg inline-block">
                (سيتم تمديد موعد الإرجاع لمدة 14 يوماً من التاريخ الحالي)
              </p>
            </div>

            <DialogFooter className="gap-3 sm:justify-center">
              <Button
                variant="outline"
                className="px-5 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors" // هوفر برتقالي فاتح للإلغاء
                onClick={() => setRenewModal(null)}
              >
                إلغاء
              </Button>

              <Button
                className="bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-colors" // هوفر برتقالي غامق للتأكيد
                onClick={handleRenew}
                disabled={saving}
              >
                {saving ? "جاري التجديد..." : "تأكيد التجديد"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-lg border-none")}>
            <div className="bg-emerald-600 p-4 text-white">
              <DialogHeader><DialogTitle className="flex gap-2 text-white"><CheckCircle /> إرجاع كتاب متأخر</DialogTitle></DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">حالة الكتاب</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, bookConditionID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      {bookConditions.map(c => <SelectItem key={c.bookConditionID} value={c.bookConditionID.toString()}>{c.bookConditionName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع المخالفة</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, fineTypeID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      {fineTypes.map(f => <SelectItem key={f.fineTypeID} value={f.fineTypeID.toString()}>{f.fineTypeName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">مبلغ الغرامة</label>
                <input type="number" className={inputClass} value={returnForm.fineAmount} onChange={e => setReturnForm({ ...returnForm, fineAmount: Number(e.target.value) })} />
              </div>
              <textarea placeholder="ملاحظات..." className={cn(inputClass, "h-20 resize-none")} value={returnForm.note} onChange={e => setReturnForm({ ...returnForm, note: e.target.value })} />
            </div>
            <DialogFooter className="p-4 bg-slate-50 flex gap-3">
              <Button variant="ghost" onClick={() => setReturnModal(null)}>إلغاء</Button>
              <Button className="bg-emerald-600 grow text-white" onClick={handleReturn} disabled={saving || returnForm.bookConditionID === 0}>إتمام الإرجاع</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}
