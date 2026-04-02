import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BookOpen, CheckCircle, RefreshCw, Search, AlertCircle, Clock,
  User, BookMarked, AlertTriangle, DollarSign, FileText,
  Download, Printer
} from "lucide-react";

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
  const { toast } = useToast();
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [bookConditions, setBookConditions] = useState<any[]>([]);
  const [returnForm, setReturnForm] = useState({ 
    fineTypeId: "", 
    bookConditionId: "", 
    fineAmount: "", 
    note: "" 
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, totalLateDays: 0, totalFines: 0, avgLateDays: 0 
  });

  const TOKEN = localStorage.getItem("authToken") || "YOUR_TOKEN_HERE";

  const fetchBookConditions = async () => {
    try {
      const res = await fetch("https://localhost:8080/api/BookCondition", {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookConditions(data);
      if (data.length) {
        setReturnForm(prev => ({ ...prev, bookConditionId: data[0].bookConditionId.toString() }));
      }
    } catch (err) {
      console.error("فشل جلب حالات الكتاب", err);
      toast({ title: "❌ فشل تحميل حالات الكتاب", variant: "destructive" });
    }
  };

  const fetchFineTypes = async () => {
    try {
      const res = await fetch("https://localhost:8080/api/FineType", {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViolationTypes(data);
      if (data.length) {
        setReturnForm(prev => ({ ...prev, fineTypeId: data[0].fineTypeId.toString() }));
      }
    } catch (err) {
      console.error("فشل جلب أنواع المخالفات", err);
      toast({ title: "❌ فشل تحميل أنواع المخالفات", variant: "destructive" });
    }
  };

  const loadLateLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://localhost:8080/api/Borrow/late", {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (!res.ok) throw new Error("فشل جلب الإعارات المتأخرة");
      const data = await res.json();

      const formatted = data.map((item: any) => ({
        id: item.borrowId,
        subscriber_name: item.subscriberName,
        subscriber_id_display: item.subscriberNumber,
        book_title: item.bookTitle,
        book_barcode: item.bookBarcode,
        loan_date: item.borrowDate,
        expected_return_date: item.expectedReturnDate,
        late_days: item.lateDays,
        fine_amount: (item.lateDays * 0.5).toFixed(2),
        phone: item.phone,
        email: item.email
      }));

      setLoans(formatted);
      setFilteredLoans(formatted);

      const totalLateDays = formatted.reduce((acc, l) => acc + l.late_days, 0);
      const totalFines = formatted.reduce((acc, l) => acc + parseFloat(l.fine_amount), 0);
      setStats({
        total: formatted.length,
        totalLateDays,
        totalFines,
        avgLateDays: formatted.length ? Math.round(totalLateDays / formatted.length) : 0
      });
    } catch (error) {
      console.error(error);
      toast({ title: "❌ خطأ في تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLateLoans();
    fetchBookConditions();
    fetchFineTypes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = loans.filter(loan => 
        loan.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_id_display?.includes(searchTerm) ||
        loan.book_barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLoans(filtered);
    } else {
      setFilteredLoans(loans);
    }
  }, [searchTerm, loans]);

  const handleReturn = async () => {
    if (!returnModal) return;
    setSaving(true);
    try {
      const fineAmountValue = returnForm.fineAmount === "" ? 0 : parseFloat(returnForm.fineAmount);
      const payload = {
        borrowID: returnModal.id,
        fineAmount: fineAmountValue,
        fineTypeID: parseInt(returnForm.fineTypeId),
        bookConditionID: parseInt(returnForm.bookConditionId),
        note: returnForm.note
      };

      const res = await fetch("https://localhost:8080/api/Borrow/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());

      toast({ title: "✅ تم إرجاع الكتاب بنجاح" });
      setReturnModal(null);
      setReturnForm({ fineTypeId: "", bookConditionId: "", fineAmount: "", note: "" });
      loadLateLoans();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل الإرجاع", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    if (!renewModal) return;
    setSaving(true);
    try {
      const res = await fetch(`https://localhost:8080/api/Borrow/${renewModal.id}/renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (!res.ok) throw new Error();
      toast({ title: "✅ تم تجديد الإعارة" });
      setRenewModal(null);
      loadLateLoans();
    } catch (error) {
      toast({ title: "❌ فشل التجديد", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exportToCsv = () => {
    try {
      const csv = filteredLoans.map(loan => ({
        'رقم المشترك': loan.subscriber_id_display,
        'اسم المشترك': loan.subscriber_name,
        'رقم الهاتف': loan.phone,
        'عنوان الكتاب': loan.book_title,
        'باركود الكتاب': loan.book_barcode,
        'تاريخ الإعارة': loan.loan_date,
        'تاريخ الإرجاع المتوقع': loan.expected_return_date,
        'أيام التأخير': loan.late_days,
        'الغرامة المتوقعة': loan.fine_amount
      }));
      const headers = Object.keys(csv[0]).join(',');
      const rows = csv.map(row => Object.values(row).join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `الاعارات_المتاخرة_${new Date().toLocaleDateString('ar-EG')}.csv`;
      link.click();
      toast({ title: "📥 تم تصدير البيانات بنجاح" });
    } catch (error) {
      toast({ title: "❌ خطأ في التصدير", variant: "destructive" });
    }
  };

  const printData = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head><title>الإعارات المتأخرة</title>
          <style>
            body { font-family: 'Cairo', sans-serif; background: #f0f2f5; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; padding: 20px; }
            h1 { color: #667eea; text-align: center; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 15px; min-width: 150px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background: #f4f4f4; }
          </style>
          </head>
          <body>
            <div class="container">
              <h1>الإعارات المتأخرة</h1>
              <div class="stats">
                <div class="stat-card"><div>${stats.total}</div><div>إعارة متأخرة</div></div>
                <div class="stat-card"><div>${stats.totalLateDays}</div><div>أيام التأخير</div></div>
                <div class="stat-card"><div>${stats.totalFines.toFixed(2)}</div><div>الغرامات</div></div>
              </div>
              <table border="1">
                <thead><tr><th>المشترك</th><th>الكتاب</th><th>تاريخ الإعارة</th><th>تاريخ الإرجاع</th><th>أيام التأخير</th><th>الغرامة</th></tr></thead>
                <tbody>
                  ${filteredLoans.map(loan => `
                    <tr>
                      <td>${loan.subscriber_name}<br/><small>${loan.subscriber_id_display}</small></td>
                      <td>${loan.book_title}<br/><small>${loan.book_barcode}</small></td>
                      <td>${new Date(loan.loan_date).toLocaleDateString('ar-EG')}</td>
                      <td>${new Date(loan.expected_return_date).toLocaleDateString('ar-EG')}</td>
                      <td>${loan.late_days} يوم</td>
                      <td>${loan.fine_amount} شيكل</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const actionCellRenderer = (params: any) => {
    const row = params.data;
    return (
      <div className="flex flex-col gap-1 items-center justify-center h-full py-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setReturnModal(row)}
          className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
        >
          <CheckCircle className="w-4 h-4" /> إرجاع
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRenewModal(row)}
          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" /> تجديد
        </motion.button>
      </div>
    );
  };

  const lateDaysCellRenderer = (params: any) => {
    const days = params.value;
    let color = "text-green-600 bg-green-100";
    if (days > 30) color = "text-red-600 bg-red-100";
    else if (days > 14) color = "text-orange-600 bg-orange-100";
    else if (days > 7) color = "text-yellow-600 bg-yellow-100";
    return (
      <div className={`flex items-center gap-1 justify-center px-2 py-1 rounded-full ${color}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-bold">{days}</span>
        <span className="text-xs">يوم</span>
      </div>
    );
  };

  if (loading && loans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <RefreshCw className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          <p className="text-xl text-gray-600 dark:text-gray-300">جاري تحميل الإعارات المتأخرة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* الهيدر والإحصائيات */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div>
            <motion.h1 className="text-4xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              الإعارات المتأخرة
            </motion.h1>
            <motion.p className="text-gray-600 dark:text-gray-300 text-lg">
              حدد الكتب المتأخرة لإرجاعها وتحديث سجلات الإعارة
            </motion.p>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm">إعارة متأخرة</div></div>
              </div>
            </motion.div>
            <motion.div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8" />
                <div><div className="text-2xl font-bold">{stats.totalLateDays}</div><div className="text-sm">إجمالي أيام التأخير</div></div>
              </div>
            </motion.div>
            <motion.div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8" />
                <div><div className="text-2xl font-bold">{stats.totalFines.toFixed(2)}</div><div className="text-sm">إجمالي الغرامات</div></div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* شريط البحث وأزرار التصدير والطباعة */}
        <motion.div className={cn(glassCardClass, "p-4 mb-6 flex flex-wrap items-center justify-between gap-4")}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث عن كتاب أو مشترك أو هاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(inputClass, "pr-10")}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCsv} className="gap-2">
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
            <Button variant="outline" onClick={printData} className="gap-2">
              <Printer className="w-4 h-4" /> طباعة
            </Button>
          </div>
        </motion.div>

        {/* الجدول */}
        <motion.div className={cn(glassCardClass, "p-6")}>
          <AgGridTable
            columnDefs={[
              { field: "subscriber_id_display", headerName: "رقم المشترك", width: 120 },
              { field: "subscriber_name", headerName: "اسم المشترك", width: 150 },
              { field: "book_title", headerName: "عنوان الكتاب", width: 200 },
              { field: "book_barcode", headerName: "باركود", width: 120 },
              { field: "loan_date", headerName: "تاريخ الإعارة", width: 120 },
              { field: "expected_return_date", headerName: "تاريخ الإرجاع", width: 120 },
              { field: "late_days", headerName: "أيام التأخير", width: 120, cellRenderer: lateDaysCellRenderer },
              { field: "fine_amount", headerName: "الغرامة", width: 100, cellStyle: { color: '#e53e3e', fontWeight: 'bold' } },
              { field: "actions", headerName: "الإجراءات", width: 180, cellRenderer: actionCellRenderer, filter: false, sortable: false }
            ]}
            rowData={filteredLoans}
            title={`قائمة الإعارات المتأخرة (${filteredLoans.length})`}
          />
        </motion.div>

        {/* مودال الإرجاع */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 max-w-md")}>
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" /> إرجاع كتاب متأخر
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2 space-y-1">
                <p className="flex items-center gap-2"><User className="w-4 h-4" /> {returnModal?.subscriber_name}</p>
                <p className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {returnModal?.book_title}</p>
                <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> تأخير: {returnModal?.late_days} يوم - غرامة: {returnModal?.fine_amount} شيكل</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">نوع المخالفة</label>
                <select
                  value={returnForm.fineTypeId}
                  onChange={e => setReturnForm(f => ({ ...f, fineTypeId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">اختر نوع المخالفة</option>
                  {violationTypes.map((v: any) => (
                    <option key={v.fineTypeId} value={v.fineTypeId}>{v.fineTypeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">حالة الكتاب</label>
                <select
                  value={returnForm.bookConditionId}
                  onChange={e => setReturnForm(f => ({ ...f, bookConditionId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">اختر حالة الكتاب</option>
                  {bookConditions.map((c: any) => (
                    <option key={c.bookConditionId} value={c.bookConditionId}>{c.bookConditionName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">مبلغ الغرامة (شيكل)</label>
                <input
                  type="number"
                  value={returnForm.fineAmount}
                  onChange={e => setReturnForm(f => ({ ...f, fineAmount: e.target.value }))}
                  className={inputClass}
                  step="0.5"
                  min="0"
                  placeholder="أدخل المبلغ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">ملاحظات</label>
                <textarea
                  value={returnForm.note}
                  onChange={e => setReturnForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-6 gap-2">
              <Button variant="outline" onClick={() => setReturnModal(null)}>إلغاء</Button>
              <Button onClick={handleReturn} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "حفظ الإرجاع"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* مودال التجديد */}
        <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 max-w-md")}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <RefreshCw className="w-6 h-6" /> تجديد إعارة متأخرة
                </DialogTitle>
              </DialogHeader>
              <p className="mt-2">{renewModal?.book_title} - {renewModal?.subscriber_name}</p>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
                <p>هذا الكتاب متأخر بمقدار <span className="font-bold text-amber-600">{renewModal?.late_days} يوم</span>. هل أنت متأكد من التجديد؟</p>
              </div>
              <p>سيتم تمديد الإعارة 14 يوماً إضافياً.</p>
            </div>
            <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-6">
              <Button variant="outline" onClick={() => setRenewModal(null)}>إلغاء</Button>
              <Button onClick={handleRenew} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "تأكيد التجديد"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
