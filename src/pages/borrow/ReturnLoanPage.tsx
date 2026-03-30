import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, XCircle, RefreshCw, Search, AlertCircle } from "lucide-react";

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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return res.json();
  return null;
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

export default function ReturnLoanPage() {
  const { toast } = useToast();


  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);

  const [bookConditions, setBookConditions] = useState<{ label: string; value: number }[]>([]);
  const [fineTypes, setFineTypes] = useState<{ label: string; value: number }[]>([]);

  const [returnForm, setReturnForm] = useState({
    bookConditionID: 0,
    fineAmount: 0,
    fineTypeID: 0,
    note: "",
  });

  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, overdue: 0, today: 0 });

  const today = new Date();

  const loadLoans = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/Borrow/list");

      const formattedData = (data || []).map((l: any) => {
        const borrowDate = new Date(l.borrowDate ?? l.loan_date ?? today);
        const expectedDate = new Date(l.expectedReturnDate ?? l.expected_return_date ?? borrowDate);
        const isOverdue = expectedDate < today;

        return {
          ...l,
          id: l.borrowID ?? l.id,
          subscriber_name: l.memberName ?? l.subscriber_name ?? "—",
          subscriber_id_display: l.memberNumber ?? l.subscriber_id_display ?? "—",
          book_title: l.bookTitle ?? l.book_title ?? "—",
          book_barcode: l.barcode ?? l.book_barcode ?? "—",
          loan_date: borrowDate,
          expected_return_date: expectedDate,
          subscriber_id: l.memberID ?? l.subscriber_id,
          book_id: l.bookID ?? l.book_id,
          isOverdue,
          daysRemaining: Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 3600 * 24)),
        };
      });

      setLoans(formattedData);
      setFilteredLoans(formattedData);
      setStats({
        total: formattedData.length,
        overdue: formattedData.filter(l => l.isOverdue).length,
        today: formattedData.filter(l => l.loan_date.toDateString() === today.toDateString()).length,
      });
    } catch (error: any) {
      console.error("Error loading loans:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error?.message ?? "حدث خطأ أثناء تحميل قائمة الإعارات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [conditions, fines] = await Promise.all([
        apiFetch("/api/BookCondition"),
        apiFetch("/api/FineType"),
      ]);

      setBookConditions(
        (conditions || []).map((c: any) => ({
          label: c.name ?? c.conditionName ?? String(c.id),
          value: c.id,
        }))
      );

      setFineTypes(
        (fines || []).map((f: any) => ({
          label: f.name ?? f.typeName ?? String(f.id),
          value: f.id,
        }))
      );

      setReturnForm(f => ({
        ...f,
        bookConditionID: conditions?.[0]?.id ?? 0,
        fineTypeID: fines?.[0]?.id ?? 0,
      }));
    } catch (error: any) {
      console.error("Error loading lookups:", error);
      toast({
        title: "خطأ في تحميل القوائم",
        description: error?.message ?? "تعذّر تحميل قوائم الحالة والغرامات",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadLookups();
    loadLoans();
  }, []);

  // البحث الديناميكي
  useEffect(() => {
    if (searchTerm) {
      setFilteredLoans(
        loans.filter(l =>
          l.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.subscriber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.subscriber_id_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.book_barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.loan_date.toDateString().includes(searchTerm)
        )
      );
    } else {
      setFilteredLoans(loans);
    }
  }, [searchTerm, loans]);

  // إرجاع كتاب
  const handleReturn = async () => {
    if (!returnModal) return;
    setSaving(true);
    try {
      await apiFetch("/api/Borrow/return", {
        method: "POST",
        body: JSON.stringify({
          borrowID: returnModal.id,
          bookConditionID: returnForm.bookConditionID,
          fineAmount: returnForm.fineAmount > 0 ? returnForm.fineAmount : null,
          fineTypeID: returnForm.fineAmount > 0 ? returnForm.fineTypeID : null,
          note: returnForm.note || null,
        }),
      });

      toast({
        title: "✅ تم الإرجاع بنجاح",
        description: `تم إرجاع "${returnModal.book_title}" بنجاح`,
      });

      setReturnModal(null);
      setReturnForm({ bookConditionID: bookConditions[0]?.value ?? 0, fineAmount: 0, fineTypeID: fineTypes[0]?.value ?? 0, note: "" });
      loadLoans();
    } catch (error: any) {
      console.error("Return error:", error);
      toast({
        title: "❌ خطأ أثناء الإرجاع",
        description: error?.message ?? "حدث خطأ أثناء إرجاع الكتاب",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    if (!renewModal) return;
    setSaving(true);
    try {
      const currentDate = new Date();
      const newReturnDate = new Date(currentDate);
      newReturnDate.setDate(currentDate.getDate() + 14);

      await apiFetch(`/api/Borrow/renew/${renewModal.id}`, {
        method: "POST",
        body: JSON.stringify({ expectedReturnDate: newReturnDate.toISOString() }),
      });

      toast({
        title: "✅ تم تجديد الإعارة",
        description: `تم تمديد إعارة "${renewModal.book_title}" لمدة 14 يومًا`,
      });
      setRenewModal(null);
      loadLoans();
    } catch (error: any) {
      console.error("Renew error:", error);
      toast({
        title: "❌ خطأ أثناء التجديد",
        description: error?.message ?? "حدث خطأ أثناء تجديد الإعارة",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusCellRenderer = (params: any) => {
    const isOverdue = params.data.isOverdue;
    return (
      <div className={`flex items-center gap-1 justify-center ${isOverdue ? "text-rose-600" : "text-emerald-600"}`}>
        {isOverdue ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <span className="text-sm font-medium">{isOverdue ? "متأخر" : "نشط"}</span>
      </div>
    );
  };

  const actionCellRenderer = (params: any) => {
    const row = params.data;
    return (
      <div className="flex flex-col gap-2 items-center justify-center">
        <motion.button onClick={() => setReturnModal(row)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white flex items-center gap-1 text-xs font-bold">
          <CheckCircle className="w-4 h-4" /> إرجاع
        </motion.button>
        <motion.button onClick={() => setRenewModal(row)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white flex items-center gap-1 text-xs font-bold">
          <RefreshCw className="w-4 h-4" /> تجديد
        </motion.button>
      </div>
    );
  };

  if (loading && loans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-4 items-start lg:items-center">
          <div>
            <motion.h1 className="text-4xl font-black text-gray-800 dark:text-white flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-primary" /> إرجاع كتاب
            </motion.h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">اختر الكتاب الذي تريد إرجاعه من قائمة الإعارات النشطة</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {[{ label: "إعارات نشطة", value: stats.total, color: "bg-blue-500", icon: BookOpen },
              { label: "مستحقة اليوم", value: stats.today, color: "bg-amber-500", icon: AlertCircle },
              { label: "متأخرة", value: stats.overdue, color: "bg-rose-500", icon: XCircle }].map((stat, idx) => (
              <motion.div key={idx} className={`${stat.color} rounded-2xl p-4 text-white shadow-lg min-w-[140px]`}>
                <div className="flex items-center gap-3">
                  <stat.icon className="w-8 h-8 opacity-90" />
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-90">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* البحث */}
        <div className={cn(glassCardClass, "p-4 mb-6 flex flex-wrap items-center justify-between gap-4")}>
          <div className="flex items-center gap-3 flex-1 max-w-md relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="بحث عن كتاب أو مشترك..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClass, "pr-10")} />
          </div>
        </div>

        {/* الجدول */}
        <div className={cn(glassCardClass, "p-6")}>
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            قائمة الإعارات الحالية ({filteredLoans.length})
          </h4>

          <AgGridTable
            columnDefs={[
              { field: "subscriber_id_display", headerName: "رقم المشترك", width: 120 },
              { field: "subscriber_name", headerName: "اسم المشترك", width: 150 },
              { field: "book_title", headerName: "عنوان الكتاب", width: 200 },
              { field: "book_barcode", headerName: "باركود الكتاب", width: 120 },
              { field: "loan_date", headerName: "تاريخ الإعارة", width: 120 },
              { field: "expected_return_date", headerName: "تاريخ الإرجاع المتوقع", width: 150 },
              { field: "status", headerName: "الحالة", width: 100, cellRenderer: statusCellRenderer, filter: false },
              { field: "actions", headerName: "الإجراءات", width: 180, cellRenderer: actionCellRenderer, filter: false, sortable: false },
            ]}
            rowData={filteredLoans}
            title="قائمة الإعارات الحالية"
          />
        </div>

        {/* مودال الإرجاع */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-md")}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" /> إرجاع كتاب
                </DialogTitle>
              </DialogHeader>
              <p className="text-emerald-50 mt-1">{returnModal?.book_title} - {returnModal?.subscriber_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">حالة الكتاب</label>
                <select value={returnForm.bookConditionID} onChange={e => setReturnForm(f => ({ ...f, bookConditionID: Number(e.target.value) }))} className={inputClass}>
                  {bookConditions.map((c, i) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">مبلغ الغرامة (شيكل)</label>
                <input type="number" value={returnForm.fineAmount} onChange={e => setReturnForm(f => ({ ...f, fineAmount: Number(e.target.value) }))} className={inputClass} dir="ltr" min="0" step="0.5" />
              </div>

              {returnForm.fineAmount > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نوع الغرامة</label>
                  <select value={returnForm.fineTypeID} onChange={e => setReturnForm(f => ({ ...f, fineTypeID: Number(e.target.value) }))} className={inputClass}>
                    {fineTypes.map((t, i) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ملاحظات</label>
                <textarea value={returnForm.note} onChange={e => setReturnForm(f => ({ ...f, note: e.target.value }))} rows={3} className={cn(inputClass, "resize-none")} placeholder="أضف أي ملاحظات إضافية..." />
              </div>

            </div>
            <DialogFooter className="p-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setReturnModal(null)}>إلغاء</Button>
              <Button onClick={handleReturn} disabled={saving}>تأكيد الإرجاع</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}