import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

export default function LoanPage() {
  const { toast } = useToast();
  
  // حقول المشترك
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [lastName, setLastName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [subscriberNumber, setSubscriberNumber] = useState("");
  
  // حقول الكتاب
  const [bookBarcode, setBookBarcode] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  
  // بيانات البحث
  const [subscriber, setSubscriber] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  
  // حالات الواجهة
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  // دالة لتجميع الاسم الكامل بالعربية
  const getFullArabicName = () => {
    const parts = [firstName, fatherName, grandfatherName, lastName].filter(Boolean);
    return parts.join(" ");
  };

  // البحث عن المشترك والكتاب معاً
  const handleSearch = async () => {
    if (!englishName.trim()) {
      toast({ 
        title: "الرجاء إدخال الاسم بالإنجليزية", 
        variant: "destructive" 
      });
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(englishName)) {
      toast({ 
        title: "الاسم الإنجليزي يجب أن يحتوي على حروف فقط", 
        variant: "destructive" 
      });
      return;
    }

    // ✅ Validation رقم المشترك (إذا انكتب)
    if (subscriberNumber && !/^[0-9]+$/.test(subscriberNumber)) {
      toast({ 
        title: "رقم المشترك يجب أن يكون أرقام فقط", 
        variant: "destructive" 
      });
      return;
    }

    // ✅ لازم تدخل كتاب (اسم أو باركود)
    if (!bookTitle.trim() && !bookBarcode.trim()) {
      toast({ 
        title: "الرجاء إدخال اسم الكتاب أو الباركود", 
        variant: "destructive" 
      });
      return;
    }

    setSearching(true);

    try { 
const { data: subscriberData, error: subscriberError } = await supabase
  .from("subscribers")
  .select("*")
  .ilike("english_name", `%${englishName.trim()}%`)
  .limit(1)
  .maybeSingle();

if (subscriberError) {
  throw subscriberError;
}

if (!subscriberData) {
  toast({ 
    title: "لم يتم العثور على مشترك بهذا الاسم", 
    variant: "destructive" 
  });
  setSearching(false); 
  return;                
}

setSubscriber(subscriberData);
setSubscriberNumber(subscriberData.subscriber_number || "");

// تقسيم الاسم
const arabicNameParts = (subscriberData.name || "").split(" ");
setFirstName(arabicNameParts[0] || "");
setFatherName(arabicNameParts[1] || "");
setGrandfatherName(arabicNameParts[2] || "");
setLastName(arabicNameParts.slice(3).join(" ") || "");

// ✅ تعيين الاسم بالإنجليزية
setEnglishName(subscriberData.english_name || "");

// تحميل الكتب المستعارة
await loadLoans(subscriberData.id);

toast({ title: "تم العثور على المشترك ✅" });
      // البحث عن الكتاب بالعنوان العربي أو الباركود إذا تم إدخالهما
      if (bookTitle.trim() || bookBarcode.trim()) {
        let bookQuery = supabase
          .from("books")
          .select("*")
          .eq("is_available", true);
        
        if (bookBarcode.trim()) {
          bookQuery = bookQuery.eq("barcode", bookBarcode.trim());
        } else if (bookTitle.trim()) {
          bookQuery = bookQuery.ilike("title", `%${bookTitle.trim()}%`);
        }
        
        const { data: bookData, error: bookError } = await bookQuery.limit(1).maybeSingle();
        
        if (bookError) {
          throw bookError;
        }
        
        if (bookData) {
          setSelectedBook(bookData);
          setBookBarcode(bookData.barcode || "");
          setBookTitle(bookData.title || "");
          toast({ title: "تم العثور على الكتاب ✅" });
        } else {
          toast({ title: "الكتاب غير متوفر أو غير موجود", variant: "destructive" });
        }
      }

    } catch (error) {
      console.error("Search error:", error);
      toast({ 
        title: "حدث خطأ أثناء البحث", 
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى",
        variant: "destructive" 
      });
    } finally {
      setSearching(false);
    }
  };

  const loadLoans = async (subscriberId: string) => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          loan_date,
          expected_return_date,
          status,
          employee_name,
          books (barcode, title)
        `)
        .eq("subscriber_id", subscriberId)
        .order("loan_date", { ascending: false });

      if (error) {
        throw error;
      }

      setLoans(
        (data || []).map((l: any) => ({
          book_barcode: l.books?.barcode || "—",
          title: l.books?.title || "—",
          loan_date: l.loan_date,
          return_date: l.expected_return_date,
          status:
            l.status === "active"
              ? "قيد الإعارة"
              : l.status === "returned"
              ? "تم الإرجاع"
              : l.status,
          employee: l.employee_name || "—",
        }))
      );
    } catch (error) {
      console.error("Error loading loans:", error);
      toast({ 
        title: "خطأ في تحميل الكتب المستعارة", 
        variant: "destructive" 
      });
    }
  };

  const handleLoan = async () => {
    // حماية إضافية
    if (!subscriber) {
      toast({ title: "يجب اختيار مشترك أولاً", variant: "destructive" });
      return;
    }

    if (!selectedBook) {
      toast({ title: "يجب اختيار كتاب أولاً", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {    
      // إضافة الإعارة
      const { error: loanError } = await supabase.from("loans").insert({ 
        subscriber_id: subscriber.id, 
        book_id: selectedBook.id 
      });
      
      if (loanError) throw loanError;
      
      // تحديث حالة الكتاب
      const { error: bookError } = await supabase
        .from("books")
        .update({ is_available: false })
        .eq("id", selectedBook.id);
      
      if (bookError) throw bookError;
      
      toast({ title: "تمت الإعارة بنجاح ✅" });
      
      // إعادة تعيين حقول الكتاب فقط
      setSelectedBook(null);
      setBookBarcode("");
      setBookTitle("");
      setConfirmOpen(false);
      
      // تحديث قائمة الكتب المستعارة
      await loadLoans(subscriber.id);
      
    } catch (error) {
      console.error("Loan error:", error);
      toast({ 
        title: "خطأ أثناء الإعارة", 
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setSubscriber(null);
    setSelectedBook(null);
    setFirstName("");
    setFatherName("");
    setGrandfatherName("");
    setLastName("");
    setEnglishName("");
    setSubscriberNumber("");
    setBookBarcode("");
    setBookTitle("");
    setLoans([]);
  };

  const handleExportCsv = () => {
    const header = [
      "باركود الكتاب",
      "العنوان",
      "تاريخ الإعارة",
      "تاريخ الإرجاع",
      "حالة الكتاب",
      "الموظف"
    ];

    const rows = loans.map((l: any) => [
      l.book_barcode,
      l.title,
      l.loan_date,
      l.return_date,
      l.status,
      l.employee
    ]);

    const csvContent =
      "\uFEFF" +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "loans.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const rows = loans.map((l: any) => `
      <tr>
        <td>${l.book_barcode}</td>
        <td>${l.title}</td>
        <td>${l.loan_date}</td>
        <td>${l.return_date}</td>
        <td>${l.status}</td>
        <td>${l.employee}</td>
      </tr>
    `).join("");

    win.document.write(`
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>الكتب المستعارة</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; text-align: center; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>الكتب المستعارة</h2>
        <table>
          <thead>
            <tr>
              <th>باركود الكتاب</th>
              <th>العنوان</th>
              <th>تاريخ الإعارة</th>
              <th>تاريخ الإرجاع</th>
              <th>الحالة</th>
              <th>الموظف</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">إعارة كتاب</h1>
        <p className="text-muted-foreground">صفحة لإدارة إعارة الكتب للقراء المسجلين بالمكتبة.</p>
      </div>
      
      <div className="bg-muted/50 rounded-xl p-3 text-center text-sm text-muted-foreground mb-4">
        مدة الإعارة الافتراضية لكل كتاب هي 14 يوماً
      </div>
      
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-6">
        
        {/* نموذج إدخال البيانات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* بيانات المشترك */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">بيانات المشترك</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">الاسم الأول</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="الاسم الأول" 
                  className={inputClass}
                  disabled={subscriber !== null}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">اسم الأب</label>
                <input 
                  type="text" 
                  value={fatherName} 
                  onChange={e => setFatherName(e.target.value)} 
                  placeholder="اسم الأب" 
                  className={inputClass}
                  disabled={subscriber !== null}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">اسم الجد</label>
                <input 
                  type="text" 
                  value={grandfatherName} 
                  onChange={e => setGrandfatherName(e.target.value)} 
                  placeholder="اسم الجد" 
                  className={inputClass}
                  disabled={subscriber !== null}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">العائلة</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="العائلة" 
                  className={inputClass}
                  disabled={subscriber !== null}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                الاسم بالإنجليزية <span className="text-destructive">*</span>
              </label>
              <input 
                type="text" 
                value={englishName} 
                onChange={e => setEnglishName(e.target.value)} 
                placeholder="أدخل الاسم بالإنجليزية للبحث عن المشترك" 
                className={inputClass}
                disabled={subscriber !== null}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">رقم المشترك</label>
              <input 
                type="text" 
                value={subscriberNumber} 
                onChange={e => setSubscriberNumber(e.target.value)} 
                placeholder="رقم المشترك" 
                className={inputClass}
                disabled={subscriber !== null}
              />
            </div>

            {subscriber && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">✅ المشترك المختار:</p>
                <p className="font-bold text-primary">{getFullArabicName()}</p>
                <p className="text-sm text-muted-foreground">{englishName}</p>
                <p className="text-sm text-muted-foreground">رقم المشترك: {subscriber.subscriber_number}</p>
              </div>
            )}
          </div>

          {/* بيانات الكتاب */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">بيانات الكتاب</h3>
            
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">الباركود</label>
              <input 
                type="text" 
                value={bookBarcode} 
                onChange={e => setBookBarcode(e.target.value)} 
                placeholder="باركود الكتاب" 
                className={inputClass}
                disabled={selectedBook !== null}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">اسم الكتاب </label>
              <input 
                type="text" 
                value={bookTitle} 
                onChange={e => setBookTitle(e.target.value)} 
                placeholder=" اسم الكتاب" 
                className={inputClass}
                disabled={selectedBook !== null}
              />
            </div>

            {selectedBook && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-muted-foreground mb-2">✅ الكتاب المختار:</p>
                <p className="font-bold text-foreground">{selectedBook.title}</p>
                <p className="text-sm text-muted-foreground">باركود: {selectedBook.barcode || "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <button 
            onClick={handleSearch} 
            disabled={searching || !englishName.trim()}
            className="px-8 py-4 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 disabled:opacity-50 text-lg"
          >
            <Search className="w-5 h-5" /> 
            {searching ? "جاري البحث..." : "بحث وإعارة"}
          </button>
          
          {(subscriber || selectedBook) && (
            <button 
              onClick={resetAll}
              className="px-8 py-4 rounded-xl border-2 border-border text-foreground font-bold text-lg hover:bg-muted transition-colors"
            >
              بدء بحث جديد
            </button>
          )}
        </div>

        {/* قائمة الكتب المستعارة للمشترك */}
        {loans.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-bold text-foreground mb-3 text-lg">
              الكتب المستعارة حالياً للمشترك
            </h4>
            <div className="flex gap-2 mb-3">
              <button 
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                تصدير CSV
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors"
              >
                طباعة
              </button>
            </div>
            <AgGridTable 
              columnDefs={[
                { field: "book_barcode", headerName: "باركود الكتاب" },
                { field: "title", headerName: "العنوان" },
                { field: "loan_date", headerName: "تاريخ الإعارة" },
                { field: "return_date", headerName: "تاريخ الإرجاع" },
                { field: "status", headerName: "حالة الكتاب" },
                { field: "employee", headerName: "الموظف" },
              ]}
              rowData={loans} 
              title="الكتب المستعارة" 
            />
          </div>
        )}

        {/* زر الإعارة النهائي */}
        {subscriber && selectedBook && (
          <button 
            onClick={() => setConfirmOpen(true)} 
            disabled={saving}
            className="w-full py-4 rounded-xl bg-success text-white font-bold text-lg shadow-card hover:shadow-elevated transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" /> 
            تأكيد إعارة الكتاب
          </button>
        )}
      </div>

      {/* نافذة تأكيد الإعارة */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الإعارة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              هل أنت متأكد من إعارة هذا الكتاب؟
            </p>
            
            {subscriber && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="font-semibold text-primary mb-2">بيانات المشترك:</p>
                <p><span className="text-muted-foreground">الاسم الكامل:</span> {getFullArabicName()}</p>
                <p><span className="text-muted-foreground">الاسم بالإنجليزية:</span> {englishName}</p>
                <p><span className="text-muted-foreground">رقم المشترك:</span> {subscriber.subscriber_number}</p>
              </div>
            )}
            
            {selectedBook && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <p className="font-semibold text-foreground mb-2">بيانات الكتاب:</p>
                <p><span className="text-muted-foreground">العنوان:</span> {selectedBook.title}</p>
                <p><span className="text-muted-foreground">الباركود:</span> {selectedBook.barcode || "—"}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button 
              onClick={() => setConfirmOpen(false)} 
              className="px-6 py-2 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-colors"
              disabled={saving}
            >
              إلغاء
            </button>
            <button 
              onClick={handleLoan} 
              disabled={saving} 
              className="px-6 py-2 rounded-xl bg-success text-white font-bold hover:bg-success/90 transition-colors disabled:opacity-50 min-w-[80px]"
            >
              {saving ? "..." : "تأكيد الإعارة"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
         
