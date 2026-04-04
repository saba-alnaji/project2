import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle,  DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, RefreshCw, Search,  AlertCircle, FileText, CircleDollarSign, MessageSquare,} from "lucide-react";

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
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
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

export default function ReturnLoanPage() {
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
  const [stats, setStats] = useState({ total: 0, today: 0 });

 const loadInitialData = async () => {
  try {
    const [loansData, conditions, fines] = await Promise.all([
      apiFetch("/api/Borrow/list?status=Active"),
      apiFetch("/api/BookCondition"),
      apiFetch("/api/FineType"),
    ]);

    // نستخدم loansData مباشرة لأن السيرفر فلترها لنا
    const data = loansData || [];
    setLoans(data);
    setFilteredLoans([]); 
    setBookConditions(conditions || []);
    setFineTypes(fines || []);

    setStats({
      total: data.length,
      today: data.filter((l: any) => 
        new Date(l.startDate).toDateString() === new Date().toDateString()
      ).length,
    });

  } catch (error) {
    toast.error("فشل في جلب البيانات من السيرفر");
  }
};

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLoans([]); 
    } else {
      const res = loans.filter(l => {
        if (searchType === "name") {
          return l.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return l.memberNumber?.toString().includes(searchTerm);
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
    <div className="min-h-screen p-6 " dir="rtl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-4 items-start lg:items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-primary" /> إرجاع الإعارات
            </h1>
            <p className="text-slate-500 mt-1">إدارة الكتب المستعارة (البحث مطلوب لإظهار البيانات)</p>
          </div>

          <div className="flex gap-3">
            <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs opacity-80 font-medium">إعارات نشطة</div>
            </div>
            <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
              <div className="text-2xl font-bold">{stats.today}</div>
              <div className="text-xs opacity-80 font-medium">إعارات اليوم</div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className={cn(glassCardClass, "p-4 mb-6")}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select 
              className={cn(inputClass, "w-full md:w-48 h-[50px] py-0")}
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

        {/* Main Table Container */}
        <div className={cn(glassCardClass, "bg-card p-6 h-[750px] flex flex-col")}>
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", flex: 1 },
              { field: "fullName", headerName: "اسم المشترك", flex: 1 },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1 },
              { field: "startDate", headerName: "تاريخ الإعارة", flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { field: "endDate", headerName: "تاريخ الإرجاع", flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { headerName: "الإجراءات", cellRenderer: actionCellRenderer, width: 200, }
            ]}
            pageSize={20}
            rowData={filteredLoans}
            title={searchTerm.trim() === "" ? "اكتب في حقل البحث لعرض البيانات" : "نتائج البحث"}
          />
        </div>

        {/* 1. مودال التجديد */}
        <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
          <DialogContent className={glassCardClass}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-amber-600">
                <RefreshCw className="w-6 h-6" /> تأكيد التجديد
              </DialogTitle>
            </DialogHeader>
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

        {/* 2. مودال الإرجاع */}
        <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
          <DialogContent className={cn(glassCardClass, "p-0 overflow-hidden max-w-lg border-none")}>
            <div className="bg-emerald-600 p-4 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-7 h-7" /> إرجاع كتاب
                </DialogTitle>
              </DialogHeader>
              <p className="text-emerald-50 text-sm mt-1">كتاب: {returnModal?.bookTitle} | مستعير: {returnModal?.fullName}</p>
            </div>

            <div className="p-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* حقل حالة الكتاب */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" /> حالة الكتاب
                  </label>
                  <Select 
                    value={returnForm.bookConditionID !== 0 ? returnForm.bookConditionID.toString() : undefined} 
                    onValueChange={(v) => setReturnForm({ ...returnForm, bookConditionID: Number(v) })}
                  >
                    <SelectTrigger className="bg-background border-border hover:border-primary/40 transition-colors h-11">
                      <SelectValue placeholder="اختر حالة الكتاب..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bookConditions.map((c) => (
                        <SelectItem key={c.bookConditionID} value={c.bookConditionID.toString()}>
                          {c.bookConditionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* حقل نوع المخالفة */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="w-4 h-4 text-muted-foreground" /> نوع المخالفة
                  </label>
                  <Select 
                    value={returnForm.fineTypeID !== 0 ? returnForm.fineTypeID.toString() : undefined} 
                    onValueChange={(v) => setReturnForm({ ...returnForm, fineTypeID: Number(v) })}
                  >
                    <SelectTrigger className="bg-background border-border hover:border-primary/40 transition-colors h-11">
                      <SelectValue placeholder="اختر نوع المخالفة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fineTypes.map((f) => (
                        <SelectItem key={f.fineTypeID} value={f.fineTypeID.toString()}>
                          {f.fineTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* مبلغ الغرامة - استبدلت DollarSign بـ CircleDollarSign */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                   مبلغ الغرامة (إن وجد)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    className={cn(inputClass, "h-11")}
                    value={returnForm.fineAmount || ""}
                    onChange={e => setReturnForm({ ...returnForm, fineAmount: Number(e.target.value) })}
                  />
                </div>
              </motion.div>

              {/* الملاحظات */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" /> ملاحظات إضافية
                </label>
                <textarea
                  className={cn(inputClass, "h-20 resize-none")}
                  placeholder="اكتب أي ملاحظة عن حالة الكتاب..."
                  value={returnForm.note}
                  onChange={e => setReturnForm({ ...returnForm, note: e.target.value })}
                />
              </motion.div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <Button variant="ghost" className="rounded-xl px-6" onClick={() => setReturnModal(null)}>
                إلغاء
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl grow font-bold shadow-lg text-white" 
                onClick={handleReturn} 
                disabled={saving || returnForm.bookConditionID === 0}
              >
                {saving ? "جاري الحفظ..." : "إتمام عملية الإرجاع"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}