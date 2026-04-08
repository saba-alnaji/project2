import { useState, useEffect } from "react";
import axios from "axios";
import { BookOpen, UserPlus, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-sm"
);

export default function LoanPage() {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const [bookTitle, setBookTitle] = useState("");

  const [loans, setLoans] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

 
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const loanColumns = [
    {
      field: "serial",
      headerName: "الباركود",
      flex: 1.5,
      minWidth: 150,
      sortable: true,
      cellRenderer: (p: any) => p.value ? `0000${p.value}00001` : "-",
      cellStyle: { textAlign: 'center' }
    },
    {
      field: "bookName",
      headerName: "عنوان الكتاب",
      flex: 2,
      minWidth: 200,
      sortable: true,
      cellStyle: { textAlign: 'right' }
    },
    {
      field: "borrowDate",
      headerName: "تاريخ الإعارة",
      flex: 1,
      minWidth: 120,
      sortable: true,
      cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-",
      cellStyle: { textAlign: 'center' }
    },
    {
      field: "returnDate",
      headerName: "تاريخ الإرجاع",
      flex: 1,
      minWidth: 120,
      sortable: true,
      cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "لم يرجع بعد",
      cellStyle: { textAlign: 'center' }
    },
    {
      field: "returnDate",
      headerName: "الحالة",
      flex: 1,
      minWidth: 130,
      sortable: true,
      cellRenderer: (p: any) => {
        return p.value ?
          <span className="text-green-600 font-bold"> تم الإرجاع</span> :
          <span className="text-blue-600 font-bold"> قيد الإعارة</span>;
      },
      cellStyle: { textAlign: 'center' }
    },
    {
      field: "createdBy",
      headerName: "الموظف المسؤول",
      flex: 1.2,
      minWidth: 140,
      cellStyle: { textAlign: 'center' }
    },
  ];
  const loadLoans = async (mNumber: string) => {
    if (!mNumber || mNumber.length < 3) return;
    try {
      const response = await axios.post(
        "/api/Borrow/Borrow-history",
        { memberNumber: mNumber, pageNumber: 1, pageSize: 50 },
        { headers: getAuthHeaders() }
      );
      const fetchedLoans = response.data.data || response.data.loans || response.data || [];
      setLoans(Array.isArray(fetchedLoans) ? fetchedLoans : []);
    } catch (e: any) {
      if (e.response && e.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
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
      toast.error("بيانات ناقصة", {
        description: "يرجى إدخال رقم المشترك وباركود الكتاب أولاً",
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
        barcode: bookBarcode,
      };

      await axios.post("/api/Borrow/borrow", payload, {
        headers: getAuthHeaders(),
      });

      toast.success("تمت عملية الإعارة بنجاح! ");

      setConfirmOpen(false);
      setSubscriberNumber("");
      setFirstName("");
      setLastName("");
      setBookBarcode("");
      setBookTitle("");
      setLoans([]);

    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("انتهت الجلسة", {
          description: "يرجى تسجيل الدخول مجدداً.",
        });
        window.location.href = "/login";
        return;
      }
      const errorMsg = error.response?.data?.message || "فشلت العملية";
      toast.error("خطأ في العملية", {
        description: errorMsg,
      });

    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <div>
        <h1 className="text-3xl font-black text-primary">نظام إعارة الكتب</h1>
        <p className="text-muted-foreground font-medium"> صفحة لإدارة إعارة الكتب للقراء المسجلين بالمكتبة</p>

        </div>
        <button onClick={() => window.location.reload()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold border-b pb-2">
            <UserPlus className="w-5 h-5" /> بيانات المستعير
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="رقم المشترك" value={subscriberNumber} onChange={(e) => setSubscriberNumber(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="الاسم" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              <input type="text" placeholder="العائلة" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-500 font-bold border-b pb-2">
            <BookOpen className="w-5 h-5" /> بيانات الكتاب
          </div>
          <div className="space-y-3">
            <input
              type="text"
              autoFocus
              placeholder="امسح باركود الكتاب بالماسح..."
              value={bookBarcode}
              onChange={(e) => setBookBarcode(e.target.value)}
              className={inputClass}
            />

            <input
              type="text"
              placeholder="عنوان الكتاب"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button onClick={handleOpenConfirm} className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-xl text-xl">
        <CheckCircle className="w-7 h-7" />
        تأكيد بيانات الإعارة
      </button>

      {loans.length > 0 && (
       <div className="bg-card rounded-2xl p-6 border border-border h-[800px] shadow-sm flex flex-col transition-all">
          
          <h3 className="font-bold mb-4 flex items-center gap-2 text-primary shrink-0">
            <BookOpen className="w-5 h-5" /> سجل الإعارات والكتب</h3>
          <p className="text-muted-foreground font-medium"> صفحة لإدارة إعارة الكتب للقراء المسجلين بالمكتبة.</p>

          
          <div className="flex-1 overflow-hidden">
            <AgGridTable
              rowData={loans}
              columnDefs={loanColumns}
              pageSize={10}
              title={`سجل إعارات: ${firstName} ${lastName}`}
              // دالة التنسيق عند الطباعة لضمان ظهور الباركود والتواريخ صح
              printValueFormatter={(field, value) => {
                if (field === 'serial') return value ? `0000${value}00001` : "-";
                if (field === 'returnDate') return value ? new Date(value).toLocaleDateString('ar-EG') : "لم يرجع بعد";
                if (field.toLowerCase().includes('date') && value) return new Date(value).toLocaleDateString('ar-EG');
                return value;
              }}
              enableRtl={true}
            />
          </div>
        </div>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-primary">تأكيد عملية الإعارة</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">

              {/* بيانات المستعير */}
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-sm">المستعير:</span>
                <span className="font-bold">{firstName} {lastName}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-sm">رقم المشترك:</span>
                <span className="font-mono font-bold">{subscriberNumber}</span>
              </div>

              {/* بيانات الكتاب */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground text-sm">الكتاب:</span>
                <span className="font-bold text-primary">{bookTitle || "لم يتم تحديد عنوان"}</span>
              </div>

            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-3 rounded-xl border font-medium hover:bg-slate-100 transition-all"
            >
              تراجع
            </button>
            <button
              onClick={handleFinalLoan}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? "جاري الحفظ..." : "تأكيد الإعارة ✅"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}