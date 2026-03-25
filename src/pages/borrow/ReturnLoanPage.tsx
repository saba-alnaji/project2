import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Printer,
  Search,
  AlertCircle,
  ArrowLeft
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

export default function ReturnLoanPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
 const [returnForm, setReturnForm] = useState({ condition: "good", fine: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, overdue: 0, today: 0 });

  const loadLoans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("loans")
        .select("*, books(*), subscribers(*)")
        .eq("status", "active")
        .order("loan_date", { ascending: false });
      
      const formattedData = (data || []).map((l: any) => {
        const expectedDate = new Date(l.expected_return_date);
        const today = new Date();
        const isOverdue = expectedDate < today;
        
        return {
          ...l,
          subscriber_name: l.subscribers?.name || "—",
          subscriber_id_display: l.subscribers?.subscriber_number || "—",
          book_title: l.books?.title || "—",
          book_barcode: l.books?.barcode || "—",
          isOverdue,
          daysRemaining: Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
        };
      });
      
      setLoans(formattedData);
      setFilteredLoans(formattedData);
      
      // Calculate stats
      setStats({
        total: formattedData.length,
        overdue: formattedData.filter((l: any) => l.isOverdue).length,
        today: formattedData.filter((l: any) => {
          const returnDate = new Date(l.expected_return_date);
          const today = new Date();
          return returnDate.toDateString() === today.toDateString();
        }).length
      });
    } catch (error) {
      console.error("Error loading loans:", error);
      toast({ 
        title: "خطأ في تحميل البيانات", 
        description: "حدث خطأ أثناء تحميل قائمة الإعارات",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const fakeData = [
    {
      id: 1,
      subscriber_id_display: "123",
      subscriber_name: "احمد علي ",
      book_title: "React Basics",
      book_barcode: "B001",
      loan_date: "2026-03-20",
      expected_return_date: "2026-03-30",
      isOverdue: false,
    },
    {
      id: 2,
      subscriber_id_display: "456",
      subscriber_name: "سارة علي",
      book_title: "JavaScript Advanced",
      book_barcode: "B002",
      loan_date: "2026-03-10",
      expected_return_date: "2026-03-18",
      isOverdue: true, // متأخر
    },
    {
      id: 3,
      subscriber_id_display: "789",
      subscriber_name: "محمد خالد",
      book_title: "Database Systems",
      book_barcode: "B003",
      loan_date: "2026-03-22",
      expected_return_date: "2026-03-25",
      isOverdue: false,
    }
  ];

  setLoans(fakeData);
  setFilteredLoans(fakeData);
}, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = loans.filter(loan => 
        loan.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_id_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      // Start a transaction
      const { error: loanError } = await supabase
        .from("loans")
        .update({ 
          status: "returned", 
          actual_return_date: new Date().toISOString().split("T")[0], 
          book_condition: returnForm.condition, 
          notes: returnForm.notes || null 
        })
        .eq("id", returnModal.id);

      if (loanError) throw loanError;

      const { error: bookError } = await supabase
        .from("books")
        .update({ is_available: true })
        .eq("id", returnModal.book_id);

      if (bookError) throw bookError;

      if (returnForm.fine > 0) {
        const { error: fineError } = await supabase
          .from("fines")
          .insert({ 
            loan_id: returnModal.id, 
            subscriber_id: returnModal.subscriber_id, 
            fine_type: returnForm.condition === "good" ? "late_return" : returnForm.condition, 
            amount: returnForm.fine, 
            book_title: returnModal.book_title, 
            notes: returnForm.notes 
          });

        if (fineError) throw fineError;
      }

      toast({ 
        title: "✅ تم الإرجاع بنجاح", 
        description: `تم إرجاع "${returnModal.book_title}" بنجاح`,
      });
      
      setReturnModal(null); 
      setReturnForm({ condition: "good", fine: 0, notes: "" }); 
      loadLoans();
    } catch (error) {
      console.error("Return error:", error);
      toast({ 
        title: "❌ خطأ أثناء الإرجاع", 
        description: "حدث خطأ أثناء إرجاع الكتاب. يرجى المحاولة مرة أخرى.",
        variant: "destructive" 
      });
    } finally { 
      setSaving(false); 
    }
  };

  const handleRenew = async () => {
    if (!renewModal) return;
    setSaving(true);
    try {
      const newReturn = new Date(renewModal.expected_return_date);
      newReturn.setDate(newReturn.getDate() + 14);
      
      const { error } = await supabase
        .from("loans")
        .update({ expected_return_date: newReturn.toISOString().split("T")[0] })
        .eq("id", renewModal.id);

      if (error) throw error;

      toast({ 
        title: "✅ تم تجديد الإعارة", 
        description: `تم تمديد الإعارة حتى ${newReturn.toLocaleDateString('ar-EG')}`,
      });
      
      setRenewModal(null); 
      loadLoans();
    } catch (error) {
      console.error("Renew error:", error);
      toast({ 
        title: "❌ خطأ أثناء التجديد", 
        description: "حدث خطأ أثناء تجديد الإعارة. يرجى المحاولة مرة أخرى.",
        variant: "destructive" 
      });
    } finally { 
      setSaving(false); 
    }
  };

  const exportToCsv = () => {
    try {
      const csv = filteredLoans.map(loan => ({
        'رقم المشترك': loan.subscriber_id_display,
        'اسم المشترك': loan.subscriber_name,
        'عنوان الكتاب': loan.book_title,
        'باركود الكتاب': loan.book_barcode,
        'تاريخ الإعارة': loan.loan_date,
        'تاريخ الإرجاع المتوقع': loan.expected_return_date
      }));

      const headers = Object.keys(csv[0]).join(',');
      const rows = csv.map(row => Object.values(row).join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `الاعارات_${new Date().toLocaleDateString('ar-EG')}.csv`;
      link.click();
      
      toast({ title: "📥 تم تصدير البيانات بنجاح" });
    } catch (error) {
      toast({ 
        title: "❌ خطأ في التصدير", 
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive" 
      });
    }
  };

  const printData = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>قائمة الإعارات</title>
            <style>
              body { font-family: 'Cairo', sans-serif; padding: 20px; background: #f8f9fa; }
              .container { max-width: 1200px; margin: 0 auto; }
              h1 { color: #0d6efd; text-align: center; margin-bottom: 10px; }
              .date { text-align: center; color: #6c757d; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              th { background: #0d6efd; color: white; padding: 12px; font-size: 14px; }
              td { padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center; }
              .overdue { color: #dc3545; font-weight: bold; }
              .status-badge { padding: 4px 8px; border-radius: 20px; font-size: 12px; }
              .status-active { background: #d1e7dd; color: #0f5132; }
              .status-overdue { background: #f8d7da; color: #842029; }
              .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📚 قائمة الإعارات الحالية</h1>
              <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
              <table>
                <thead>
                  <tr>
                    <th>رقم المشترك</th>
                    <th>اسم المشترك</th>
                    <th>عنوان الكتاب</th>
                    <th>تاريخ الإعارة</th>
                    <th>تاريخ الإرجاع</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLoans.map(loan => `
                    <tr>
                      <td>${loan.subscriber_id_display}</td>
                      <td>${loan.subscriber_name}</td>
                      <td>${loan.book_title}</td>
                      <td>${loan.loan_date}</td>
                      <td class="${loan.isOverdue ? 'overdue' : ''}">${loan.expected_return_date}</td>
                      <td>
                        <span class="status-badge ${loan.isOverdue ? 'status-overdue' : 'status-active'}">
                          ${loan.isOverdue ? 'متأخر' : 'نشط'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                <p>إجمالي الإعارات: ${filteredLoans.length} | المتأخرة: ${stats.overdue} | المستحقة اليوم: ${stats.today}</p>
              </div>
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
<div className="flex flex-col gap-2 items-center justify-center">
      <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setReturnModal(row)}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1"
        >
          <CheckCircle className="w-4 h-4" />
          إرجاع
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRenewModal(row)}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          تجديد
        </motion.button>
      </div>
    );
  };

  const statusCellRenderer = (params: any) => {
    const isOverdue = params.data.isOverdue;
    return (
      <div className={`flex items-center gap-1 justify-center ${isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
        {isOverdue ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {isOverdue ? 'متأخر' : 'نشط'}
        </span>
      </div>
    );
  };

  if (loading && loans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3"
            >
              <BookOpen className="w-10 h-10 text-primary" />
              إرجاع كتاب
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 text-lg"
            >
              اختر الكتاب الذي تريد إرجاعه من قائمة الإعارات النشطة
            </motion.p>
          </div>
          
          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'إعارات نشطة', value: stats.total, color: 'bg-blue-500', icon: BookOpen },
              { label: 'مستحقة اليوم', value: stats.today, color: 'bg-amber-500', icon: AlertCircle },
              { label: 'متأخرة', value: stats.overdue, color: 'bg-rose-500', icon: XCircle }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`${stat.color} rounded-2xl p-4 text-white shadow-lg min-w-[140px]`}
              >
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

        {/* Search and Actions Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(glassCardClass, "p-4 mb-6 flex flex-wrap items-center justify-between gap-4")}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث عن كتاب أو مشترك..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(inputClass, "pr-10")}
              />
            </div>
          </div>
          

        </motion.div>

        {/* Loans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(glassCardClass, "p-6")}
        >
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            قائمة الإعارات الحالية ({filteredLoans.length})
          </h4>
          
          <AgGridTable
            columnDefs={[
              { field: "subscriber_id_display", headerName: " رقم المشترك", width: 120 },
              { field: "subscriber_name", headerName: "اسم المشترك", width: 150 },
              { field: "book_title", headerName: "عنوان الكتاب", width: 200 },
              { field: "book_barcode", headerName: "باركود الكتاب", width: 120 },
              { field: "loan_date", headerName: "تاريخ الإعارة", width: 120 },
              { field: "expected_return_date", headerName: "تاريخ الإرجاع المتوقع", width: 150 },
              { 
                field: "status", 
                headerName: "الحالة", 
                width: 100,
                cellRenderer: statusCellRenderer,
                filter: false
              },
              { 
                field: "actions", 
                headerName: "الإجراءات", 
                width: 180,
                cellRenderer: actionCellRenderer, 
                filter: false,
                sortable: false
              },
            ]}
            rowData={filteredLoans}
            title="قائمة الإعارات الحالية"
          />
        </motion.div>

        {/* Return Modal */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-md")}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  إرجاع كتاب
                </DialogTitle>
              </DialogHeader>
              <p className="text-emerald-50 mt-1">
                {returnModal?.book_title} - {returnModal?.subscriber_name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    حالة الكتاب
                  </label>
                  <select 
                    value={returnForm.condition} 
                    onChange={e => setReturnForm(f => ({ ...f, condition: e.target.value }))} 
                    className={inputClass}
                  >
                    <option value="good">📚 جيد</option>
                    <option value="damaged">⚠️ متضرر</option>
                    <option value="destroyed">🔥 تالف</option>
                    <option value="lost">❓ ضائع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ الغرامة (شيكل)
                  </label>
                  <input 
                    type="number" 
                    value={returnForm.fine} 
                    onChange={e => setReturnForm(f => ({ ...f, fine: Number(e.target.value) }))} 
                    className={inputClass} 
                    dir="ltr" 
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ملاحظات
                  </label>
                  <textarea 
                    value={returnForm.notes} 
                    onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))} 
                    rows={3} 
                    className={cn(inputClass, "resize-none")}
                    placeholder="أضف أي ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setReturnModal(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleReturn}
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "حفظ الإرجاع"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Renew Modal */}
        <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-md")}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <RefreshCw className="w-6 h-6" />
                  تجديد إعارة
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                هل أنت متأكد من تجديد الإعارة لكتاب <span className="font-bold text-amber-600">{renewModal?.book_title}</span>؟
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                سيتم تمديد المدة 14 يوماً إضافياً من تاريخ الإرجاع الحالي.
              </p>
            </div>

            <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setRenewModal(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleRenew}
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "تجديد الإعارة"
                )}
              </Button>
            </DialogFooter>
</DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
