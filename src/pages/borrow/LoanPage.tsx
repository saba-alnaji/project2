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
  const [subscriberQuery, setSubscriberQuery] = useState("");
  const [subscriber, setSubscriber] = useState<any>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchSubscriber = async () => {
    if (!subscriberQuery.trim()) return;
    const { data } = await supabase.from("subscribers").select("*")
      .or(`name.ilike.%${subscriberQuery}%,subscriber_number.eq.${subscriberQuery}`).limit(1).single();
    if (data) { setSubscriber(data); loadLoans(data.id); }
    else toast({ title: "لم يتم العثور على المشترك", variant: "destructive" });
  };

  const loadLoans = async (subscriberId: string) => {
    const { data } = await supabase.from("loans").select("*, books(*)").eq("subscriber_id", subscriberId).order("loan_date", { ascending: false });
    setLoans((data || []).map((l: any) => ({
      book_barcode: l.books?.barcode || "—", title: l.books?.title || "—", loan_date: l.loan_date,
      return_date: l.expected_return_date, status: l.status === "active" ? "قيد الإعارة" : l.status === "returned" ? "تم الإرجاع" : l.status,
    })));
  };

  const searchBook = async () => {
    if (!bookQuery.trim()) return;
    const { data } = await supabase.from("books").select("*")
      .or(`barcode.eq.${bookQuery},title.ilike.%${bookQuery}%`).eq("is_available", true).limit(1).single();
    if (data) setSelectedBook(data);
    else toast({ title: "الكتاب غير متوفر أو غير موجود", variant: "destructive" });
  };

  const handleLoan = async () => {
    if (!subscriber || !selectedBook) return; setSaving(true);
    try {
      const { error } = await supabase.from("loans").insert({ subscriber_id: subscriber.id, book_id: selectedBook.id });
      if (error) throw error;
      await supabase.from("books").update({ is_available: false }).eq("id", selectedBook.id);
      toast({ title: "تمت الإعارة بنجاح ✅" }); setSelectedBook(null); setBookQuery(""); setConfirmOpen(false); loadLoans(subscriber.id);
    } catch { toast({ title: "خطأ أثناء الإعارة", variant: "destructive" }); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">إعارة كتاب</h1>
        <p className="text-muted-foreground">صفحة لإدارة إعارة الكتب للقراء المسجلين بالمكتبة.</p>
      </div>
      <div className="bg-muted/50 rounded-xl p-3 text-center text-sm text-muted-foreground mb-4">مدة الإعارة الافتراضية لكل كتاب هي 14 يوماً.</div>
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم أو اسم المشترك</label>
            <div className="flex gap-2">
              <input type="text" value={subscriberQuery} onChange={e => setSubscriberQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchSubscriber()} placeholder="ادخل رقم أو اسم المشترك" className={cn(inputClass, "flex-1")} />
              <button onClick={searchSubscriber} className="px-4 py-3 rounded-xl gradient-primary text-white font-bold"><Search className="w-4 h-4" /></button>
            </div>
          </div>
          {subscriber && (
            <div className="flex items-end">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 w-full">
                <p className="text-sm text-muted-foreground">المشترك:</p>
                <p className="font-bold text-primary">{subscriber.name}</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الباركود أو اسم الكتاب</label>
            <div className="flex gap-2">
              <input type="text" value={bookQuery} onChange={e => setBookQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchBook()} placeholder="ادخل باركود أو اسم الكتاب" className={cn(inputClass, "flex-1")} />
              <button onClick={searchBook} className="px-4 py-3 rounded-xl gradient-primary text-white font-bold"><Search className="w-4 h-4" /></button>
            </div>
          </div>
          {selectedBook && (
            <div className="flex items-end">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 w-full">
                <p className="text-sm text-muted-foreground">الكتاب:</p>
                <p className="font-bold text-foreground">{selectedBook.title}</p>
                <p className="text-xs text-muted-foreground">باركود: {selectedBook.barcode || "—"}</p>
              </div>
            </div>
          )}
        </div>
        {loans.length > 0 && (
          <div>
            <h4 className="font-bold text-foreground mb-2">الكتب المستعارة</h4>
            <AgGridTable columnDefs={[
              { field: "book_barcode", headerName: "باركود الكتاب" }, { field: "title", headerName: "العنوان" },
              { field: "loan_date", headerName: "تاريخ الإعارة" }, { field: "return_date", headerName: "تاريخ الإرجاع" }, { field: "status", headerName: "الحالة" },
            ]} rowData={loans} title="الكتب المستعارة" />
          </div>
        )}
        <button onClick={() => setConfirmOpen(true)} disabled={!subscriber || !selectedBook}
          className="w-full py-4 rounded-xl bg-success text-white font-bold text-lg shadow-card hover:shadow-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5" /> إعارة
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد الإعارة</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل أنت متأكد من إعارة هذا الكتاب؟</p>
          {selectedBook && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm">
              <p><strong>الكتاب:</strong> {selectedBook.title}</p>
              <p><strong>الباركود:</strong> {selectedBook.barcode || "—"}</p>
              {subscriber && <p><strong>المشترك:</strong> {subscriber.name}</p>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <button onClick={() => setConfirmOpen(false)} className="px-6 py-2 rounded-xl border-2 border-border text-foreground font-semibold">إلغاء</button>
            <button onClick={handleLoan} disabled={saving} className="px-6 py-2 rounded-xl bg-success text-white font-bold">{saving ? "..." : "تأكيد"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
