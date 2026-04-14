import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BookOpen, UserPlus, CheckCircle, Search, Loader2, Hash, Barcode as BarcodeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
);

const numberInputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-lg font-bold text-slate-700 bg-slate-50",
  "focus:outline-none focus:border-primary transition-all text-center tracking-widest"
);

export default function LoanPage() {
  const [searchMember, setSearchMember] = useState("");
  const [searchBook, setSearchBook] = useState("");
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [bookBarcode, setBookBarcode] = useState("");
  const [selectedMemberID, setSelectedMemberID] = useState("0");
  const [selectedBookID, setSelectedBookID] = useState("0");

  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [isSearchingBook, setIsSearchingBook] = useState(false);
  
  const [loans, setLoans] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const memberInputRef = useRef<HTMLInputElement>(null);
  const bookBarcodeRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    memberInputRef.current?.focus();
  }, []);

  // بحث المشتركين - يبدأ من أول حرف وبسرعة عالية
  useEffect(() => {
    const timer = setTimeout(async () => {
      // تعديل: يبدأ البحث إذا كان النص أكبر من 0 (يعني من أول حرف)
      if (searchMember.length === 0) { setMemberResults([]); return; }
      
      setIsSearchingMember(true);
      try {
        const res = await axios.post("/api/Subscriber/search", 
          { name: searchMember, pageNumber: 1, pageSize: 10 }, // زدنا عدد النتائج لـ 10 لضمان الظهور
          { headers: getAuthHeaders() }
        );
        setMemberResults(res.data?.data || []);
      } catch { 
        setMemberResults([]); 
      } finally { 
        setIsSearchingMember(false); 
      }
    }, 200); // تقليل الوقت لـ 200ms ليصبح البحث فوري تقريباً
    return () => clearTimeout(timer);
  }, [searchMember]);

  // بحث الكتب - يبدأ من أول حرف
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchBook.length === 0) { setBookResults([]); return; }
      
      setIsSearchingBook(true);
      try {
        const res = await axios.post("/api/Book/search", 
          { title: searchBook, pageNumber: 1, pageSize: 10 }, 
          { headers: getAuthHeaders() }
        );
        setBookResults(res.data?.data || []);
      } catch { 
        setBookResults([]); 
      } finally { 
        setIsSearchingBook(false); 
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchBook]);

  const loadLoans = async (num: string) => {
    try {
      const res = await axios.post("/api/Borrow/Borrow-history", { memberNumber: num, pageNumber: 1, pageSize: 20 }, { headers: getAuthHeaders() });
      setLoans(res.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleFinalLoan = async () => {
    if (!subscriberNumber || !bookBarcode) {
        toast.error("يرجى التأكد من إدخال رقم المشترك والباركود");
        return;
    }
    setSaving(true);
    try {
      const payload = { 
        barcode: String(bookBarcode), 
        bookID: String(selectedBookID), 
        memberID: String(selectedMemberID), 
        memberNumber: String(subscriberNumber) 
      };
      
      await axios.post("/api/Borrow/borrow", payload, { headers: getAuthHeaders() });
      toast.success("تمت الإعارة بنجاح!");
      setConfirmOpen(false);
      await loadLoans(subscriberNumber);
      setShowTable(true);
      
      setSearchBook(""); 
      setBookBarcode("");
      setSelectedBookID("0");
      bookBarcodeRef.current?.focus(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشلت العملية");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8" dir="rtl">
      <div className="text-center">
        <h1 className="text-4xl font-black text-slate-800"> إعارة كتاب</h1>
        <p className="text-slate-500 mt-2 text-lg"> </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* كرت المستعير */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 text-primary font-bold text-xl pb-2 border-b">
            <UserPlus className="w-6 h-6" /> بيانات المستعير
          </div>
          
          <div className="space-y-5">
            <div className="relative">
              <label className="text-sm font-bold text-slate-600 mb-1 block mr-1">البحث بالاسم</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابدأ بكتابة اسم المشترك..." 
                  className={cn(inputClass, "pl-10")} 
                  value={searchMember} 
                  onChange={(e) => setSearchMember(e.target.value)} 
                />
                {isSearchingMember && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-primary" />}
              </div>
              {memberResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl mt-1 rounded-xl max-h-60 overflow-y-auto">
                  {memberResults.map(m => (
                    <div 
                      key={m.subscriberId} 
                      onClick={() => { 
                        setSubscriberNumber(m.subscriberNumber); 
                        setSelectedMemberID(m.subscriberId); 
                        setSearchMember(m.name); 
                        setMemberResults([]); 
                        bookBarcodeRef.current?.focus(); 
                      }} 
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                    >
                      <span className="font-bold text-slate-700">{m.name}</span>
                      <span className="text-slate-400 text-xs font-mono">#{m.subscriberNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block mr-1 flex items-center gap-1">
                <Hash className="w-4 h-4"/> رقم المشترك
              </label>
              <input 
                ref={memberInputRef}
                type="text" 
                value={subscriberNumber} 
                onChange={(e) => setSubscriberNumber(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && bookBarcodeRef.current?.focus()}
                placeholder="0000" 
                className={numberInputClass} 
              />
            </div>
          </div>
        </div>

        {/* كرت الكتاب */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 text-orange-600 font-bold text-xl pb-2 border-b">
            <BookOpen className="w-6 h-6" /> بيانات الكتاب
          </div>

          <div className="space-y-5">
            <div className="relative">
              <label className="text-sm font-bold text-slate-600 mb-1 block mr-1">البحث بالعنوان</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابدأ بكتابة عنوان الكتاب..." 
                  className={cn(inputClass, "pl-10")} 
                  value={searchBook} 
                  onChange={(e) => setSearchBook(e.target.value)} 
                />
                {isSearchingBook && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-orange-500" />}
              </div>
              {bookResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl mt-1 rounded-xl max-h-60 overflow-y-auto">
                  {bookResults.map(b => (
                    <div 
                      key={b.bookId} 
                      onClick={() => { 
                        setBookBarcode(b.serialNumber); 
                        setSelectedBookID(b.bookId); 
                        setSearchBook(b.title); 
                        setBookResults([]); 
                      }} 
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                    >
                      <div className="font-bold text-slate-700">{b.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block mr-1 flex items-center gap-1">
                <BarcodeIcon className="w-4 h-4"/> باركود الكتاب
              </label>
              <input 
                ref={bookBarcodeRef}
                type="text" 
                value={bookBarcode} 
                onChange={(e) => setBookBarcode(e.target.value)} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && bookBarcode) setConfirmOpen(true);
                }}
                placeholder="000000" 
                className={cn(numberInputClass, "border-orange-200")} 
              />
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => {
            if (!subscriberNumber || !bookBarcode) {
                toast.warning("يرجى إكمال بيانات المشترك والكتاب");
            } else {
                setConfirmOpen(true);
            }
        }}
        className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-2xl shadow-xl hover:bg-primary transition-all active:scale-[0.98] flex items-center justify-center gap-4"
      >
        تأكيد عملية الإعارة
        <CheckCircle className="w-8 h-8" />
      </button>

      {showTable && (
        <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-md animate-in fade-in slide-in-from-bottom-5">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2 text-right" dir="rtl">
             تمت العملية بنجاح. سجل إعارات المشترك:
          </h3>
          <div className="h-[400px] border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <AgGridTable rowData={loans} columnDefs={[
              { field: "serial", headerName: "الباركود", flex: 1 },
              { field: "bookName", headerName: "اسم الكتاب", flex: 2 },
              { field: "borrowDate", headerName: "تاريخ الإعارة", flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('ar-EG') },
              { headerName: "الحالة", flex: 1, cellRenderer: (p: any) => p.data.returnDate ? "✅ تم الإرجاع" : "⏳ قيد الإعارة" }
            ]} pageSize={10} enableRtl={true} />
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6" dir="rtl">
          <DialogHeader><DialogTitle className="text-right text-2xl font-black border-b pb-2">تأكيد الإعارة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-500 font-bold mb-1">المستعير</p>
                <p className="font-bold text-lg text-slate-800">{searchMember}</p>
                <p className="text-primary font-mono font-bold">رقم: {subscriberNumber}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-xs text-orange-500 font-bold mb-1">الكتاب</p>
                <p className="font-bold text-lg text-slate-800">{searchBook}</p>
                <p className="text-orange-600 font-mono font-bold">باركود: {bookBarcode}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-3 mt-4">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3 rounded-xl border-2 font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
            <button onClick={handleFinalLoan} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">
              {saving ? "جاري الحفظ..." : "تأكيد"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
