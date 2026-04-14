import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, RefreshCw, AlertCircle, MessageSquare } from "lucide-react";

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

const glassCardClass = cn(
  "backdrop-blur-md bg-white/90 dark:bg-gray-900/90",
  "border border-white/20 dark:border-gray-800/20",
  "shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl"
);

const inputClass = "w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none";

export default function ReturnLoanPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
  const [bookConditions, setBookConditions] = useState<any[]>([]);
  const [fineTypes, setFineTypes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  const [returnForm, setReturnForm] = useState({
    bookConditionID: 0,
    fineAmount: 0,
    fineTypeID: 0,
    note: "",
  });

  const loadInitialData = async () => {
    try {
      const [loansData, conditions, fines] = await Promise.all([
        apiFetch("/api/Borrow/list?status=Active"),
        apiFetch("/api/BookCondition"), // تأكد أن هذا الرابط يعيد بيانات في السيرفر المرفوع
        apiFetch("/api/FineType"),
      ]);

      // حفظ الإعارات للجدول
      setLoans(loansData || []);

      // **هذه الأسطر هي التي ستجعل القوائم المنسدلة تظهر**
      setBookConditions(conditions || []);
      setFineTypes(fines || []);

      setStats({
        total: (loansData || []).length,
        today: (loansData || []).filter((l: any) =>
          new Date(l.startDate).toDateString() === new Date().toDateString()
        ).length,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("فشل في جلب البيانات من السيرفر");
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleRenew = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/Borrow/renew/${renewModal.borrowID}`, { method: "PATCH" });
      toast.success("تم التمديد بنجاح");
      setRenewModal(null);
      loadInitialData();
    } catch (e) { toast.error("فشل التجديد"); }
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
      toast.success("تم الإرجاع بنجاح");
      setReturnModal(null);
      loadInitialData();
    } catch (e) { toast.error("خطأ في الإرجاع"); }
    finally { setSaving(false); }
  };

  const actionCellRenderer = (params: any) => (
    <div className="flex gap-2 justify-center items-center h-full">
      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8" onClick={() => {
        setReturnModal(params.data);
        setReturnForm({ bookConditionID: 0, fineAmount: 0, fineTypeID: 0, note: "" });
      }}>
        <CheckCircle className="w-3.5 h-3.5 ml-1" /> إرجاع
      </Button>
      <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 h-8 hover:bg-amber-600" onClick={() => setRenewModal(params.data)}>
        <RefreshCw className="w-3.5 h-3.5 ml-1" /> تجديد
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen p-6" dir="rtl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between mb-8 items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-primary" /> إرجاع الإعارات
            </h1>
            <p className="text-slate-500 mt-1">عرض كافة الإعارات النشطة والتحكم بها</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-80">إعارات نشطة</div>
            </div>
            <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.today}</div>
              <div className="text-xs opacity-80">إعارات اليوم</div>
            </div>
          </div>
        </div>

        {/* الجدول مباشرة بدون قسم البحث العلوي */}
        <div className={cn(glassCardClass, "bg-card p-6 h-[600px] flex flex-col")}>
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", flex: 1, filter: true },
              { field: "fullName", headerName: "اسم المشترك", flex: 1, filter: true },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1, filter: true },
              { field: "startDate", headerName: "تاريخ الإعارة", flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { field: "endDate", headerName: "تاريخ الإرجاع", flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { headerName: "الإجراءات", cellRenderer: actionCellRenderer, width: 200 }
            ]}
            rowData={loans}
            title="قائمة الإعارات"
          />
        </div>

        {/* Modals (Return & Renew) - نفس الكود السابق للمودالات */}
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
          <DialogContent className={cn(glassCardClass, "max-w-lg p-0 overflow-hidden")}>
            <div className="bg-emerald-600 p-4 text-white"><DialogHeader><DialogTitle className="flex gap-2 text-white"><CheckCircle /> إرجاع كتاب</DialogTitle></DialogHeader></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">حالة الكتاب</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, bookConditionID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحالة..." /></SelectTrigger>
                    <SelectContent>{bookConditions.map((c) => (<SelectItem key={c.bookConditionID} value={c.bookConditionID.toString()}>{c.bookConditionName}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع المخالفة</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, fineTypeID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع..." /></SelectTrigger>
                    <SelectContent>{fineTypes.map((f) => (<SelectItem key={f.fineTypeID} value={f.fineTypeID.toString()}>{f.fineTypeName}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <input type="number" placeholder="مبلغ الغرامة" className={inputClass} onChange={e => setReturnForm({ ...returnForm, fineAmount: Number(e.target.value) })} />
              <textarea placeholder="ملاحظات" className={cn(inputClass, "h-20")} onChange={e => setReturnForm({ ...returnForm, note: e.target.value })} />
            </div>
            <DialogFooter className="p-4 bg-slate-50 flex gap-2">
              <Button variant="ghost" onClick={() => setReturnModal(null)}>إلغاء</Button>
              <Button className="bg-emerald-600 grow text-white" onClick={handleReturn} disabled={saving || returnForm.bookConditionID === 0}>إتمام الإرجاع</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
