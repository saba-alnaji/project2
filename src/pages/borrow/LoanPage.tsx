import React, { useState, useEffect } from "react";
import axios from "axios";
import { BookOpen, UserPlus, CheckCircle, RefreshCw, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-sm"
);

export default function LoanPage() {
  const [searchMember, setSearchMember] = useState("");
  const [searchBook, setSearchBook] = useState("");
  
  // البيانات الأساسية للعملية
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");

  const [loans, setLoans] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // 1. جلب سجل الإعارات (Borrow History)
  const loadLoans = async (mNumber: string) => {
    if (!mNumber) return;
    try {
      const response = await axios.post(
        "/api/Borrow/Borrow-history",
        { memberNumber: mNumber, pageNumber: 1, pageSize: 50 },
        { headers: getAuthHeaders() }
      );
      const fetchedLoans = response.data?.data || response.data || [];
      setLoans(Array.isArray(fetchedLoans) ? fetchedLoans : []);
      setShowTable(true);
    } catch (e: any) {
      console.error("Error fetching history:", e);
    }
  };

  // 2. تنفيذ عملية إعارة جديدة (POST)
  const handleFinalLoan = async () => {
    if (!subscriberNumber || !bookBarcode) {
      toast.error("بيانات ناقصة", { description: "يرجى إدخال رقم المشترك وباركود الكتاب" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        memberNumber: subscriberNumber,
        barcode: bookBarcode,
      };

      await axios.post("/api/Borrow/borrow", payload, {
        headers: getAuthHeaders(),
      });

      toast.success("تمت عملية الإعارة بنجاح!");
      setConfirmOpen(false);
      
      // تحديث الجدول فوراً بعد الإعارة
      loadLoans(subscriberNumber);
      
      // تصفير حقول الكتاب فقط للاستعداد للإعارة التالية لنفس الشخص
      setBookBarcode("");
      setSearchBook("");

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "فشلت العملية";
      toast.error("خطأ", { description: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async (borrowID: number) => {
    try {
      await axios.patch(`/api/Borrow/renew/${borrowID}`,
        {}, 
        { headers: getAuthHeaders() }
      );
      
      toast.success("تم تجديد الإعارة بنجاح");
      loadLoans(subscriberNumber); // تحديث التواريخ في الجدول
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "فشل التجديد";
      toast.error("خطأ", { description: errorMsg });
    }
  };

  // تعريف أعمدة الجدول
  const loanColumns = [
    {
      field: "serial",
      headerName: "الباركود",
      flex: 1.2,
      cellRenderer: (p: any) => p.value ? `0000${p.value}00001` : "-",
    },
    { field: "bookName", headerName: "عنوان الكتاب", flex: 2 },
    {
      field: "borrowDate",
      headerName: "تاريخ الإعارة",
      flex: 1,
      cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-",
    },
    {
      field: "returnDate",
      headerName: "تاريخ الإرجاع",
      flex: 1,
      cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "لم يرجع بعد",
    },
    {
      headerName: "الإجراءات / الحالة",
      flex: 1.5,
      cellRenderer: (p: any) => {
        const isReturned = !!p.data.returnDate;
        
        if (isReturned) {
          return <span className="text-green-600 font-bold">✓ تم الإرجاع</span>;
        }

        return (
          <button
            onClick={() => handleRenew(p.data.id || p.data.borrowID)}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-xs transition-all shadow-md"
          >
            <RefreshCw className="w-3 h-3" /> تجديد الإعارة
          </button>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6" dir="rtl">
      {/* العناوين */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-primary">   إعارة كتاب</h1>
          <p className="text-muted-foreground">ابحث عن المشتركين والكتب لإدارة عمليات الإعارة</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 hover:bg-slate-100 rounded-full">
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم المستعير */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 border-t-4 border-t-primary">
          <div className="flex items-center gap-2 text-primary font-bold">
            <UserPlus className="w-5 h-5" /> بيانات المستعير
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="ابحث عن اسم مشترك..." 
              className={cn(inputClass, "pl-10")}
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
            />
          </div>
          <input 
            type="text" 
            placeholder="رقم المشترك (المعرف)" 
            value={subscriberNumber} 
            onChange={(e) => setSubscriberNumber(e.target.value)} 
            className={cn(inputClass, "bg-slate-50 border-dashed")} 
          />
        </div>

        {/* قسم الكتاب */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 border-t-4 border-t-orange-500">
          <div className="flex items-center gap-2 text-orange-500 font-bold">
            <BookOpen className="w-5 h-5" /> بيانات الكتاب
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="ابحث عن عنوان كتاب..." 
              className={cn(inputClass, "pl-10")}
              value={searchBook}
              onChange={(e) => setSearchBook(e.target.value)}
            />
          </div>
          <input 
            type="text" 
            placeholder="باركود الكتاب" 
            value={bookBarcode} 
            onChange={(e) => setBookBarcode(e.target.value)} 
            className={cn(inputClass, "bg-slate-50 border-dashed")} 
          />
        </div>
      </div>

      {/* زر تنفيذ الإعارة */}
      <button 
        onClick={() => setConfirmOpen(true)} 
        className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl font-black hover:opacity-95 transition-all shadow-xl text-xl"
      >
        <CheckCircle className="w-7 h-7" />
        تأكيد الإعارة  
      </button>

      {/* جدول السجل */}
      {showTable && (
        <div className="bg-card rounded-2xl p-6 border shadow-sm h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" /> سجل إعارات المشترك: {subscriberNumber}
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <AgGridTable
              rowData={loans}
              columnDefs={loanColumns}
              pageSize={10}
              enableRtl={true}
            />
          </div>
        </div>
      )}

      {/* مودال التأكيد */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold">تأكيد الإعارة</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-right">
            <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
              <p className="flex justify-between"><span>اسم المشترك:</span> <strong>{subscriberNumber}</strong></p>
              <p className="flex justify-between border-t pt-2"><span>عنوان الكتاب:</span> <strong className="text-orange-600">{bookBarcode}</strong></p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3 rounded-xl border font-medium">إلغاء</button>
            <button 
              onClick={handleFinalLoan} 
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              {saving ? "جاري المعالجة..." : "تأكيد الإعارة ✅"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
