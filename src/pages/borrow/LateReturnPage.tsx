import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle, RefreshCw, Search, AlertCircle,
  Clock, AlertTriangle, FileText, CircleDollarSign, MessageSquare
} from "lucide-react";

const API_BASE_URL = "https://localhost:8080";
const getToken = (): string => localStorage.getItem("token") ?? "";

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
  "hover:border-primary/50"
);

const glassCardClass = cn(
  "backdrop-blur-md bg-white/90 dark:bg-gray-900/90",
  "border border-white/20 dark:border-gray-800/20",
  "shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl"
);

export default function LateLoanPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
  const [bookConditions, setBookConditions] = useState<any[]>([]);
  const [fineTypes, setFineTypes] = useState<any[]>([]);

  const [returnForm, setReturnForm] = useState({
    bookConditionID: 0,
    fineAmount: 0,
    fineTypeID: 0,
    note: "",
  });

  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [stats, setStats] = useState({ total: 0, totalLateDays: 0 });

 const loadInitialData = async () => {
  try {
    const [loansData, conditions, fines] = await Promise.all([
      apiFetch("/api/Borrow/list?status=Late"),
      apiFetch("/api/BookCondition"),
      apiFetch("/api/FineType"),
    ]);

    const data = loansData || [];
    setLoans(data);
    setFilteredLoans([]); 
    setBookConditions(conditions || []);
    setFineTypes(fines || []);
    
    setStats({
      total: data.length,
      // حساب إجمالي أيام التأخير من البيانات الجاهزة
      totalLateDays: data.reduce((acc: number, curr: any) => acc + (curr.delayDays || 0), 0),
    });
  } catch (error) {
    toast.error("فشل في جلب البيانات من السيرفر");
  }
};

  useEffect(() => { loadInitialData(); }, []);

  // منطق البحث المحسن
 useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === "") {
      setFilteredLoans([]); // الجدول يرجع فارغاً إذا مسحنا النص
    } else {
      const res = loans.filter(l => {
        if (searchType === "name") {
          return l.fullName?.toLowerCase().includes(term);
        } else {
          return l.memberNumber?.toString().includes(term);
        }
      });
      setFilteredLoans(res);
    }
  }, [searchTerm, searchType, loans]);

  const handleRenew = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/Borrow/renew/${renewModal.borrowID}`, { method: "PATCH" });
      toast.success("تم تمديد الإعارة بنجاح");
      setRenewModal(null);
      loadInitialData();
    } catch (e) {
      toast.error("فشل في إتمام عملية التجديد");
    } finally { setSaving(false); }
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
    } catch (e) {
      toast.error("حدث خطأ أثناء عملية الإرجاع");
    } finally { setSaving(false); }
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
      <Button
        size="sm"
        className="bg-emerald-500 hover:bg-emerald-600 h-8 text-xs font-bold"
        onClick={() => {
          setReturnModal(params.data);
          setReturnForm({
            bookConditionID: 0,
           fineAmount: 0, 
            fineTypeID: 0,
            note: ""
          });
        }}
      >
        <CheckCircle className="w-3.5 h-3.5 ml-1" /> إرجاع
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white h-8 text-xs font-bold"
        onClick={() => setRenewModal(params.data)}
      >
        <RefreshCw className="w-3.5 h-3.5 ml-1" /> تجديد
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-rose-50/40 to-orange-50/40" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-4 items-start lg:items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-rose-500" /> إعارات متأخرة
            </h1>
            <p className="text-slate-500 mt-1 mr-14">قائمة الكتب التي تجاوزت موعد الإرجاع المحدد</p>
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

        {/* Search Section */}
        <div className={cn(glassCardClass, "p-4 mb-6")}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select
              className={cn(inputClass, "w-full md:w-56 h-[50px] py-0 cursor-pointer")}
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="name">اسم المشترك</option>
              <option value="id">رقم المشترك</option>
            </select>

            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchType === "name" ? "ابحث باسم المستعير..." : "ابحث برقم المشترك..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={cn(inputClass, "pr-12 h-[50px]")}
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className={cn(glassCardClass, "bg-card p-6 h-[750px] flex flex-col")}>
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", width: 120 },
              { field: "fullName", headerName: "اسم المشترك", flex: 1.2 },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1.2 },
              { field: "endDate", headerName: "موعد الإرجاع", width: 130, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { field: "delayDays", headerName: "أيام التأخير", width: 120, cellRenderer: delayCellRenderer },
              { headerName: "الإجراءات", cellRenderer: actionCellRenderer, width: 200 }
            ]}
            pageSize={15}
            rowData={filteredLoans}
            title="نتائج التصفية"
          />
        </div>

        {/* Dialogs: Renew & Return (نفس الكود اللي في الإرجاع العادي) */}
        {/* ... مودال التجديد ... */}
        <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
          <DialogContent className={glassCardClass}>
            <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2 text-amber-600"><RefreshCw className="w-6 h-6" /> تأكيد التجديد</DialogTitle></DialogHeader>
            <div className="py-6 text-center">
              <p className="text-lg">هل أنت متأكد من تجديد إعارة <b>{renewModal?.bookTitle}</b>؟</p>
              <p className="text-sm text-muted-foreground mt-2 ">سيتم إضافة 14 يوم إضافية من تاريخ اليوم.</p>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setRenewModal(null)}>إلغاء</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 shadow-md text-white" onClick={handleRenew} disabled={saving}>تأكيد التجديد</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ... مودال الإرجاع ... */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-lg border-none")}>
            <div className="bg-emerald-600 p-4 text-white">
              <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="w-7 h-7" /> إرجاع كتاب (متأخر)</DialogTitle></DialogHeader>
              <p className="text-emerald-50 text-sm mt-1">كتاب: {returnModal?.bookTitle} | مستعير: {returnModal?.fullName}</p>
            </div>
            <div className="p-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">حالة الكتاب</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, bookConditionID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحالة..." /></SelectTrigger>
                    <SelectContent>
                      {bookConditions.map(c => <SelectItem key={c.bookConditionID} value={c.bookConditionID.toString()}>{c.bookConditionName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع المخالفة</label>
                  <Select onValueChange={(v) => setReturnForm({ ...returnForm, fineTypeID: Number(v) })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع..." /></SelectTrigger>
                    <SelectContent>
                      {fineTypes.map(f => <SelectItem key={f.fineTypeID} value={f.fineTypeID.toString()}>{f.fineTypeName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">مبلغ الغرامة</label>
                <input type="number" className={cn(inputClass, "h-11")} value={returnForm.fineAmount} onChange={e => setReturnForm({ ...returnForm, fineAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات</label>
                <textarea className={cn(inputClass, "h-20 resize-none")} value={returnForm.note} onChange={e => setReturnForm({ ...returnForm, note: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 flex gap-3">
              <Button variant="ghost" onClick={() => setReturnModal(null)}>إلغاء</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 grow text-white" onClick={handleReturn} disabled={saving || returnForm.bookConditionID === 0}>إتمام الإرجاع</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}