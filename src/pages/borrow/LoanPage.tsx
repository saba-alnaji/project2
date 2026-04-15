import React, { useState } from "react";
import axios from "axios";
import AsyncSelect from "react-select/async";
import { BookOpen, UserPlus, CheckCircle, RefreshCw, ScanLine, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// --- Axios Interceptor ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "0.75rem",
    padding: "0.3rem",
    borderWidth: "2px",
    borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
    boxShadow: "none",
    "&:hover": { borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))" },
    backgroundColor: "hsl(var(--card))",
  }),
  placeholder: (base: any) => ({ ...base, color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }),
};

export default function LoanPage() {
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getAuthHeaders = () => ({ Authorization: Bearer ${localStorage.getItem("token")} });

  const loadMemberOptions = (inputValue: string) => {
    if (inputValue.length < 1) return Promise.resolve([]);
    return axios.get(/api/Subscription/member-names?MemberName=${inputValue}, { headers: getAuthHeaders() })
      .then(res => res.data.map((m: any) => ({ label: m.memberName || m.fullName, value: m.memberId })))
      .catch(() => []);
  };

  const loadBookOptions = (inputValue: string) => {
    if (inputValue.length < 1) return Promise.resolve([]);
    return axios.get(/api/Book/books/titles?BookTitle=${inputValue}, { headers: getAuthHeaders() })
      .then(res => res.data.map((b: any) => ({ label: b.bookTitle || b.title, value: b.bookID })))
      .catch(() => []);
  };

  const handleFinalLoan = async () => {
    setSaving(true);
    try {
      const payload = {
        memberID: selectedMember ? parseInt(selectedMember.value) : null,
        bookID: selectedBook ? parseInt(selectedBook.value) : null,
        memberNumber: !selectedMember ? subscriberNumber : null,
        barcode: !selectedBook ? bookBarcode : null
      };
      await axios.post("/api/Borrow/borrow", payload, { headers: getAuthHeaders() });
      toast.success("تمت عملية الإعارة بنجاح!");
      setConfirmOpen(false);
      setBookBarcode(""); setSubscriberNumber(""); setSelectedMember(null); setSelectedBook(null);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("فشلت العملية", { description: error.response?.data?.message || "تأكد من البيانات" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b pb-4">
       <div className="flex items-center gap-4  pb-5 mb-8">
  <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center border-2 border-primary/20 shadow-inner">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="36" 
      height="36" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-book-up"
    >
      <path d="M4 19.5V15a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4.5"/><path d="M12 9V3"/><path d="m9 6 3-3 3 3"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    </svg>
  </div>

  {/* نص الترويسة */}
  <div>
    <h1 className="text-4xl font-black text-foreground tracking-tight">إعارة كتاب</h1>
    <p className="text-muted-foreground mt-1 text-lg">
      قم بتسجيل عملية إعارة جديدة للمشتركين في المكتبة
    </p>
  </div>
</div>
        <button onClick={() => window.location.reload()} className="p-3 hover:bg-secondary rounded-xl transition-all border shadow-sm">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Member Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-primary/10 rounded-lg"><UserPlus className="w-5 h-5 text-primary" /></div>
            <h2 className="text-xl font-bold">بيانات المستعير</h2>
          </div>
          <div className={cn("p-6 rounded-3xl border-2 transition-all bg-card shadow-sm space-y-4", selectedMember || subscriberNumber ? "border-primary/30 shadow-md" : "border-border")}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground mr-2">بحث في السجلات</label>
              <AsyncSelect
                cacheOptions
                styles={customSelectStyles}
                loadOptions={loadMemberOptions}
                value={selectedMember}
                onChange={(opt) => { setSelectedMember(opt); setSubscriberNumber(""); }}
                placeholder="ابحث عن اسم المشترك..."
              />
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-dashed"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground font-bold">أو أدخل الرقم يدوياً</span>
              <div className="flex-grow border-t border-dashed"></div>
            </div>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
              <input 
                type="text" className="w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background focus:border-primary focus:outline-none transition-all"
                value={subscriberNumber}
                onChange={(e) => { setSubscriberNumber(e.target.value); setSelectedMember(null); }}
                placeholder="رقم المشترك "
              />
            </div>
          </div>
        </section>

        {/* Book Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-orange-500/10 rounded-lg"><BookOpen className="w-5 h-5 text-orange-500" /></div>
            <h2 className="text-xl font-bold">بيانات الكتاب</h2>
          </div>
          <div className={cn("p-6 rounded-3xl border-2 transition-all bg-card shadow-sm space-y-4", selectedBook || bookBarcode ? "border-orange-500/30 shadow-md" : "border-border")}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground mr-2">بحث بالعنوان</label>
              <AsyncSelect
                cacheOptions
                styles={customSelectStyles}
                loadOptions={loadBookOptions}
                value={selectedBook}
                onChange={(opt) => { setSelectedBook(opt); setBookBarcode(""); }}
                placeholder="ابحث عن عنوان الكتاب..."
              />
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-dashed"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground font-bold">أو استخدم الماسح</span>
              <div className="flex-grow border-t border-dashed"></div>
            </div>
            <div className="relative">
              <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
              <input 
                type="text" className="w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background focus:border-orange-500 focus:outline-none transition-all"
                value={bookBarcode}
                onChange={(e) => { setBookBarcode(e.target.value); setSelectedBook(null); }}
                placeholder="باركود الكتاب..."
              />
            </div>
          </div>
        </section>
      </div>

      {/* Submit Button */}
      <button 
        onClick={() => setConfirmOpen(true)} 
        disabled={(!selectedMember && !subscriberNumber) || (!selectedBook && !bookBarcode)}
        className="group relative w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-center gap-3 text-xl">
          <CheckCircle className="w-7 h-7" />
          تأكيد وإتمام عملية الإعارة
        </div>
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[2rem] max-w-md border-none shadow-2xl overflow-hidden p-0" dir="rtl">
          <div className="bg-primary p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
              <CheckCircle className="w-10 h-10" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-white">مراجعة الإعارة</DialogTitle>
          </div>
          <div className="p-8 space-y-4 bg-background">
            <div className="grid grid-cols-3 items-center gap-4 p-4 rounded-2xl bg-secondary/50 border">
               <span className="text-muted-foreground text-sm font-bold">المستعير</span>
               <b className="col-span-2 text-left truncate">{selectedMember?.label || subscriberNumber}</b>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 p-4 rounded-2xl bg-secondary/50 border">
               <span className="text-muted-foreground text-sm font-bold">الكتاب</span>
               <b className="col-span-2 text-left truncate">{selectedBook?.label || bookBarcode}</b>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-4 rounded-xl font-bold hover:bg-secondary transition-colors border-2">تراجع</button>
              <button onClick={handleFinalLoan} disabled={saving} className="flex-1 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30">
                {saving ? "جاري الإرسال..." : "إتمام الآن"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
