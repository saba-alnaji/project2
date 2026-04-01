import { useState, useEffect } from "react";
import axios from "axios";
import { BookOpen, UserPlus, CheckCircle, RefreshCw, Bookmark, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
);

export default function LoanPage() {
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const [bookTitle, setBookTitle] = useState("");

  const [loans, setLoans] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formatBarcode = (val: string | number) => {
    if (!val) return "";
    return `0000${val}00001`;
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loadLoans = async (mNumber: string) => {
    if (!mNumber || mNumber.length < 3) return;
    try {
      const response = await axios.post(
        "https://localhost:8080/api/Borrow/Borrow-history",
        { memberNumber: mNumber, pageNumber: 1, pageSize: 50 },
        { headers: getAuthHeaders() }
      );
      const fetchedLoans = response.data.data || response.data.loans || response.data || [];
      setLoans(Array.isArray(fetchedLoans) ? fetchedLoans : []);
    } catch (e) {
      console.error("خطأ في جلب السجل:", e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (subscriberNumber) loadLoans(subscriberNumber);
    }, 500);
    return () => clearTimeout(timer);
  }, [subscriberNumber]);

  const handleOpenConfirm = () => {
    if (!subscriberNumber.trim() || !bookBarcode.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال رقم المشترك وباركود الكتاب أولاً",
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleFinalLoan = async () => {
    setSaving(true);
    try {
      const payload = {
        memberID: null,
        bookID: null,
        memberNumber: subscriberNumber,
        barcode: formatBarcode(bookBarcode),
      };

      await axios.post("https://localhost:8080/api/Borrow/borrow", payload, {
        headers: getAuthHeaders(),
      });

      toast({ title: "تمت عملية الإعارة بنجاح! 📚", variant: "default" });
      setConfirmOpen(false);
      setBookBarcode("");
      setBookTitle("");
      await loadLoans(subscriberNumber);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "فشلت العملية";
      toast({ title: "خطأ في العملية", description: errorMsg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700" dir="rtl">
      
      {/* Header Section */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">نظام الإعارة الذكي</h1>
          <p className="text-muted-foreground mt-1 text-lg">إدارة عمليات الاستعارة والكتب المسجلة</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="group p-3 hover:bg-primary/10 rounded-2xl transition-all duration-300 border border-transparent hover:border-primary/20"
        >
          <RefreshCw className="w-6 h-6 text-primary group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Borrower Section */}
        <div className="lg:col-span-1 bg-gradient-to-br from-card to-muted/30 p-6 rounded-3xl border shadow-md space-y-6">
          <div className="flex items-center gap-3 text-primary font-black text-xl border-b border-primary/10 pb-4">
            <div className="p-2 bg-primary/10 rounded-lg"><UserPlus className="w-6 h-6" /></div>
            بيانات المستعير
          </div>
          <div className="space-y-4">
            <div className="relative">
                <label className="text-xs font-bold text-muted-foreground mb-1 block mr-1">رقم الهوية / المشترك</label>
                <input type="text" placeholder="مثال: 4050..." value={subscriberNumber} onChange={(e) => setSubscriberNumber(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block mr-1">الاسم الأول</label>
                  <input type="text" placeholder="الاسم" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
               </div>
               <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block mr-1">العائلة</label>
                  <input type="text" placeholder="العائلة" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
               </div>
            </div>
          </div>
        </div>

        {/* Book Section */}
        <div className="lg:col-span-2 bg-gradient-to-br from-card to-orange-50/30 p-6 rounded-3xl border border-orange-100 shadow-md space-y-6">
          <div className="flex items-center gap-3 text-orange-600 font-black text-xl border-b border-orange-100 pb-4">
            <div className="p-2 bg-orange-100 rounded-lg"><BookOpen className="w-6 h-6" /></div>
            بيانات الكتاب المراد إعارته
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="relative">
                    <label className="text-xs font-bold text-orange-600 mb-1 block mr-1 uppercase">Scan Barcode</label>
                    <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input type="text" placeholder="أدخل رقم الباركود الأساسي" value={bookBarcode} onChange={(e) => setBookBarcode(e.target.value)} className={cn(inputClass, "pl-10 border-orange-200 focus:border-orange-500")} />
                    </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 italic text-sm text-orange-800">
                    الباركود النهائي: <span className="font-mono font-bold">{formatBarcode(bookBarcode) || "---"}</span>
                </div>
            </div>
            <div className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground mb-1 block mr-1">عنوان الكتاب</label>
                <input type="text" placeholder="ابحث عن عنوان الكتاب..." value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className={inputClass} />
                
                <button onClick={handleOpenConfirm} className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                    <CheckCircle className="w-6 h-6" />
                    تأكيد الإعارة الآن
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Table Section */}
      <div className={cn("transition-all duration-500", loans.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
        {loans.length > 0 && (
            <div className="bg-card rounded-3xl border shadow-xl overflow-hidden">
                <div className="p-6 bg-muted/20 border-b flex justify-between items-center">
                    <h3 className="font-black text-xl flex items-center gap-2 text-primary">
                        <Bookmark className="w-6 h-6" />
                        السجل الحالي للمشترك 
                        <span className="text-muted-foreground font-normal text-base mr-2">(لديه {loans.length} كتب)</span>
                    </h3>
                </div>
                <div className="h-[400px] w-full p-2">
                    <AgGridTable
                        rowData={loans} // تم وضعه هنا داخل المكون بشكل صحيح
                        columnDefs={[
                            {
                                field: "serial",
                                headerName: "الباركود الكامل",
                                flex: 1.5,
                                minWidth: 160,
                                sortable: true,
                                cellRenderer: (p: any) => <span className="font-mono font-bold text-blue-700">{formatBarcode(p.value)}</span>,
                                cellStyle: { textAlign: 'center' }
                            },
                            {
                                field: "bookName",
                                headerName: "العنوان",
                                flex: 2.5,
                                minWidth: 250,
                                sortable: true,
                                cellStyle: { textAlign: 'right', fontWeight: 'bold' }
                            },
                            {
                                field: "borrowDate",
                                headerName: "تاريخ الإعارة",
                                flex: 1,
                                minWidth: 140,
                                sortable: true,
                                cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-",
                                cellStyle: { textAlign: 'center' }
                            },
                            {
                                field: "returnDate",
                                headerName: "الحالة",
                                flex: 1,
                                minWidth: 140,
                                sortable: true,
                                cellRenderer: (p: any) => p.value 
                                    ? <span className="text-green-600 font-bold">✅ تم الإرجاع</span> 
                                    : <span className="text-orange-600 font-bold animate-pulse">📖 قيد الإعارة</span>,
                                cellStyle: { textAlign: 'center' }
                            }
                        ]}
                        enableRtl={true} 
                    />
                </div>
            </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[2rem] max-w-md p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <div className="bg-primary p-6 text-white text-center">
             <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" />
             </div>
             <DialogTitle className="text-2xl font-black italic">مراجعة الإعارة</DialogTitle>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">المستعير</p>
                <h4 className="text-xl font-bold text-foreground">{firstName} {lastName}</h4>
              </div>
              
              <div className="py-4 px-2 bg-muted/50 rounded-2xl border-2 border-dashed border-primary/10">
                <p className="text-xs text-muted-foreground font-bold mb-2 uppercase tracking-widest">الكتاب المختارف</p>
                <h4 className="text-2xl font-black text-primary leading-tight">{bookTitle || "عنوان غير محدد"}</h4>
                <p className="mt-3 font-mono text-sm bg-white inline-block px-3 py-1 rounded-lg border shadow-sm">
                    {formatBarcode(bookBarcode)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-4 rounded-2xl border-2 border-muted font-bold hover:bg-muted transition-all active:scale-95">إلغاء</button>
              <button onClick={handleFinalLoan} disabled={saving} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 transition-all active:scale-95">
                {saving ? "جاري الحفظ..." : "تأكيد الإعارة"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
