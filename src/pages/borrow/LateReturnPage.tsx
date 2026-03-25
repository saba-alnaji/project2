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
  Clock,
  Calendar,
  User,
  BookMarked,
  AlertTriangle,
  DollarSign,
  FileText
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
  const [returnForm, setReturnForm] = useState({ 
    violationType: "late_return", 
    condition: "good", 
    fine: 0, 
    notes: "" 
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    totalLateDays: 0, 
    totalFines: 0,
    avgLateDays: 0 
  });

  const loadLateLoans = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("loans")
        .select("*, books(*), subscribers(*)")
        .eq("status", "active")
        .lt("expected_return_date", today)
        .order("expected_return_date", { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map((l: any) => {
        const expectedDate = new Date(l.expected_return_date);
        const todayDate = new Date();
        const lateDays = Math.ceil((todayDate.getTime() - expectedDate.getTime()) / (1000 * 3600 * 24));
        const fineAmount = lateDays * 0.5; // 0.5 shekel per day late

        return {
          ...l,
          subscriber_name: l.subscribers?.name || "—",
          subscriber_id_display: l.subscribers?.subscriber_number || "—",
          book_title: l.books?.title || "—",
          book_barcode: l.books?.barcode || "—",
          late_days: lateDays,
          fine_amount: fineAmount.toFixed(2),
          expected_return_date: l.expected_return_date,
          phone: l.subscribers?.phone || "—",
          email: l.subscribers?.email || "—"
        };
      });

      setLoans(formattedData);
      setFilteredLoans(formattedData);

      // Calculate advanced stats
      const totalLateDays = formattedData.reduce((acc, loan) => acc + loan.late_days, 0);
      const totalFines = formattedData.reduce((acc, loan) => acc + parseFloat(loan.fine_amount), 0);

      setStats({
        total: formattedData.length,
        totalLateDays,
        totalFines,
        avgLateDays: formattedData.length ? Math.round(totalLateDays / formattedData.length) : 0
      });

    } catch (error) {
      console.error("Error loading late loans:", error);
      toast({ 
        title: "❌ خطأ في تحميل البيانات", 
        description: "حدث خطأ أثناء تحميل قائمة الإعارات المتأخرة",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLateLoans(); }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = loans.filter(loan => 
        loan.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.subscriber_id_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.book_barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.phone?.includes(searchTerm)
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
      // Update loan status
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

      // Update book availability
      const { error: bookError } = await supabase
        .from("books")
        .update({ is_available: true })
        .eq("id", returnModal.book_id);

      if (bookError) throw bookError;

      // Add fine if applicable
      if (returnForm.fine > 0) {
        const { error: fineError } = await supabase
          .from("fines")
          .insert({ 
            loan_id: returnModal.id, 
            subscriber_id: returnModal.subscriber_id, 
            fine_type: returnForm.violationType,
            amount: returnForm.fine, 
            book_title: returnModal.book_title,
            late_days: returnModal.late_days,
            notes: returnForm.notes 
          });

        if (fineError) throw fineError;
      }

      toast({ 
        title: "✅ تم إرجاع الكتاب المتأخر", 
        description: `تم إرجاع "${returnModal.book_title}" مع غرامة ${returnForm.fine} شيكل`,
        variant: "default"
      });
      
      setReturnModal(null); 
      setReturnForm({ violationType: "late_return", condition: "good", fine: 0, notes: "" }); 
      loadLateLoans();

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
        .update({ 
          expected_return_date: newReturn.toISOString().split("T")[0],
          notes: `تم التجديد المتأخر - الأيام المتأخرة: ${renewModal.late_days}`
        })
        .eq("id", renewModal.id);

      if (error) throw error;

      toast({ 
        title: "✅ تم تجديد الإعارة المتأخرة", 
        description: `تم تمديد الإعارة حتى ${newReturn.toLocaleDateString('ar-EG')}`,
      });
      
      setRenewModal(null); 
      loadLateLoans();

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
            <title>الإعارات المتأخرة</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
              * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
              body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; min-height: 100vh; }
              .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
              h1 { color: #667eea; text-align: center; margin-bottom: 10px; font-size: 32px; display: flex; align-items: center; justify-content: center; gap: 10px; }
              .date { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
              .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; min-width: 200px; text-align: center; box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
              .stat-value { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
              .stat-label { font-size: 14px; opacity: 0.9; }
              table { width: 100%; border-collapse: separate; border-spacing: 0 8px; margin-top: 20px; }
              th { background: #f8f9fa; color: #667eea; padding: 15px; font-size: 14px; font-weight: 600; border-radius: 10px 10px 0 0; }
              td { background: white; padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center; }
              .late-badge { background: #fee; color: #e53e3e; padding: 4px 12px; border-radius: 20px; font-weight: bold; display: inline-block; }
              .fine-badge { background: #e6f7e6; color: #38a169; padding: 4px 12px; border-radius: 20px; font-weight: bold; display: inline-block; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                الإعارات المتأخرة
              </h1>
              <div class="date">📅 تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</div>
              
              <div class="stats">
                <div class="stat-card">
                  <div class="stat-value">${stats.total}</div>
                  <div class="stat-label">إعارة متأخرة</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.totalLateDays}</div>
                  <div class="stat-label">إجمالي أيام التأخير</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.totalFines.toFixed(2)}</div>
                  <div class="stat-label">إجمالي الغرامات (شيكل)</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>المشترك</th>
                    <th>الكتاب</th>
                    <th>تاريخ الإعارة</th>
                    <th>تاريخ الإرجاع</th>
                    <th>أيام التأخير</th>
                    <th>الغرامة</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLoans.map(loan => `
                    <tr>
                      <td>
                        <strong>${loan.subscriber_name}</strong><br>
                        <small style="color:#666;">${loan.subscriber_id_display}</small>
                      </td>
                      <td>
                        <strong>${loan.book_title}</strong><br>
                        <small style="color:#666;">${loan.book_barcode}</small>
                      </td>
                      <td>${new Date(loan.loan_date).toLocaleDateString('ar-EG')}</td>
                      <td>${new Date(loan.expected_return_date).toLocaleDateString('ar-EG')}</td>
                      <td><span class="late-badge">${loan.late_days} يوم</span></td>
                      <td><span class="fine-badge">${loan.fine_amount} شيكل</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المكتبة - جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
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
    <div className="flex flex-col gap-1 items-center justify-center h-full py-2 overflow-visible">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setReturnModal(row)}
        className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
      >
        <CheckCircle className="w-4 h-4" />
        إرجاع
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setRenewModal(row)}
        className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1"
      >
        <RefreshCw className="w-4 h-4" />
        تجديد
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          <p className="text-xl text-gray-600 dark:text-gray-300">جاري تحميل الإعارات المتأخرة...</p>
        </div>
      </div>
    );
  }

  return ( 
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6">
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
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              الإعارات المتأخرة
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 text-lg"
            >
              حدد الكتب المتأخرة لإرجاعها وتحديث سجلات الإعارة
            </motion.p>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 opacity-90" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm opacity-90">إعارة متأخرة</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 opacity-90" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalLateDays}</div>
                  <div className="text-sm opacity-90">إجمالي أيام التأخير</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg min-w-[160px]"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 opacity-90" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalFines.toFixed(2)}</div>
                  <div className="text-sm opacity-90">إجمالي الغرامات</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Alert Banner */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-rose-100 dark:bg-rose-900/30 border-r-4 border-rose-500 p-4 mb-6 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-300">تنبيه: هناك {stats.total} إعارة متأخرة</p>
                <p className="text-rose-600 dark:text-rose-400 text-sm">متوسط أيام التأخير: {stats.avgLateDays} يوم - إجمالي الغرامات المتوقعة: {stats.totalFines.toFixed(2)} شيكل</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Actions Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={cn(glassCardClass, "p-4 mb-6 flex flex-wrap items-center justify-between gap-4")}
        >
          <div className="flex items-center gap-3 flex-1">
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
          </div>
          
        </motion.div>

        {/* Loans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={cn(glassCardClass, "p-6")}
        >
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-rose-500" />
            قائمة الإعارات المتأخرة ({filteredLoans.length})
          </h4>
          

<AgGridTable
  columnDefs={[
    { field: "subscriber_id_display", headerName: "رقم المشترك", width: 120 },
    { field: "subscriber_name", headerName: "اسم المشترك", width: 150 },
    { field: "phone", headerName: "الهاتف", width: 120 },
    { field: "book_title", headerName: "عنوان الكتاب", width: 200 },
    { field: "book_barcode", headerName: "باركود الكتاب", width: 120 },
    { field: "loan_date", headerName: "تاريخ الإعارة", width: 120 },
    { field: "expected_return_date", headerName: "تاريخ الإرجاع", width: 120 },
    { 
      field: "late_days", 
      headerName: "أيام التأخير", 
      width: 120,
      cellRenderer: lateDaysCellRenderer
    },
    { 
      field: "fine_amount", 
      headerName: "الغرامة", 
      width: 100,
      cellStyle: { color: '#e53e3e', fontWeight: 'bold' }
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
  
  rowData={[
    {
      id: 1,
      subscriber_id_display: "1001",
      subscriber_name: "أحمد علي",
      phone: "0599123456",
      book_title: "React Basics",
      book_barcode: "B001",
      loan_date: "2026-03-01",
      expected_return_date: "2026-03-10",
      late_days: 5,
      fine_amount: "2.50"
    },
    {
      id: 2,
      subscriber_id_display: "1002",
      subscriber_name: "سارة محمد",
      phone: "0599876543",
      book_title: "JavaScript Advanced",
      book_barcode: "B002",
      loan_date: "2026-02-20",
      expected_return_date: "2026-03-05",
      late_days: 20,
      fine_amount: "10.00"
    }
  ]}

  title="قائمة الإعارات المتأخرة"
/>
        </motion.div>

        {/* Return Modal */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
<DialogContent
  className={cn(
    glassCardClass,
    "p-0 max-w-md max-h-[90vh] overflow-y-auto"
  )}
>
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  إرجاع كتاب متأخر
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2 space-y-1">
                <p className="text-white/90 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {returnModal?.subscriber_name} - {returnModal?.subscriber_id_display}
                </p>
                <p className="text-white/90 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {returnModal?.book_title}
                </p>
                <p className="text-white/90 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  تأخير: {returnModal?.late_days} يوم - غرامة: {returnModal?.fine_amount} شيكل
                </p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <AlertTriangle className="w-4 h-4 inline ml-1" />
                    نوع المخالفة
                  </label>
                  <select 
                    value={returnForm.violationType} 
                    onChange={e => setReturnForm(f => ({ ...f, violationType: e.target.value }))} 
                    className={inputClass}
                  >
                    <option value="late_return">⏰ تأخير في الإرجاع</option>
                    <option value="damaged">📚 كتاب تالف</option>
                    <option value="lost">❓ كتاب مفقود</option>
                    <option value="other">🔄 أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    حالة الكتاب
                  </label>
                  <select 
                    value={returnForm.condition} 
                    onChange={e => setReturnForm(f => ({ ...f, condition: e.target.value }))} 
                    className={inputClass}
                  >
                    <option value="good">✅ جيد</option>
                    <option value="damaged">⚠️ متضرر</option>
                    <option value="destroyed">🔥 تالف</option>
                    <option value="lost">❓ ضائع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline ml-1" />
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
                    placeholder={returnModal?.fine_amount}
                  />
                  <p className="text-xs text-gray-500 mt-1">الغرامة الافتراضية: {returnModal?.fine_amount} شيكل</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline ml-1" />
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
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
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
                  تجديد إعارة متأخرة
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <p className="text-white/90">{renewModal?.book_title}</p>
                <p className="text-white/90 text-sm">{renewModal?.subscriber_name}</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold">تنبيه: إعارة متأخرة</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  هذا الكتاب متأخر بمقدار <span className="font-bold text-amber-600">{renewModal?.late_days} يوم</span>. 
                  هل أنت متأكد من تجديد الإعارة؟
                </p>
              </div>

              <p className="text-gray-600 dark:text-gray-300">
                سيتم تمديد المدة 14 يوماً إضافياً من تاريخ الإرجاع الحالي.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                تاريخ الإرجاع الجديد: {renewModal && new Date(new Date(renewModal.expected_return_date).setDate(new Date(renewModal.expected_return_date).getDate() + 14)).toLocaleDateString('ar-EG')}
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
                  "تأكيد التجديد"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
