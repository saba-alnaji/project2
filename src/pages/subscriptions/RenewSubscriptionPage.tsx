import { useState } from "react";
import { Search, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

const feeByCategory: Record<string, number> = { regular: 35, student: 25, municipality_employee: 0 };

export default function RenewSubscriptionPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [form, setForm] = useState({ fee: 35, receipt_number: "", book_number: "", type: "public_library", category: "regular", notes: "" });
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; setSearching(true); setSuccess(false);
    try {
      const { data, error } = await supabase.from("subscribers").select("*, subscriptions(*)")
        .or(`name.ilike.%${searchQuery}%,subscriber_number.eq.${searchQuery},national_id.eq.${searchQuery}`).limit(1).single();
      if (error || !data) { toast({ title: "لم يتم العثور على المشترك", variant: "destructive" }); setSubscriber(null); return; }
      setSubscriber(data);
      setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : data.subscriptions ? [data.subscriptions] : []);
    } catch { toast({ title: "خطأ في البحث", variant: "destructive" }); } finally { setSearching(false); }
  };

  const handleCategoryChange = (cat: string) => setForm(f => ({ ...f, category: cat, fee: feeByCategory[cat] ?? 35 }));

  const handleRenew = async () => {
    if (!subscriber) return; setRenewing(true);
    try {
      const today = new Date(); const endDate = new Date(); endDate.setFullYear(endDate.getFullYear() + 1);
      const { error } = await supabase.from("subscriptions").insert({
        subscriber_id: subscriber.id, duration: "annual", type: form.type, category: form.category,
        start_date: today.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0],
        fee: form.fee, payment_method: "cash", receipt_number: form.receipt_number || null, book_number: form.book_number || null, notes: form.notes || null,
      });
      if (error) throw error;
      setSuccess(true); toast({ title: "تم تجديد الاشتراك بنجاح ✅" });
    } catch { toast({ title: "خطأ أثناء التجديد", variant: "destructive" }); } finally { setRenewing(false); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">تجديد اشتراك</h1>
        <p className="text-muted-foreground">قم بتجديد اشتراك أي عضو موجود بالمكتبة.</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border mb-6">
        <h3 className="font-bold text-foreground mb-3">البحث عن مشترك</h3>
        <div className="flex gap-3">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="ادخل اسم المشترك أو رقمه" className={cn(inputClass, "flex-1")} />
          <button onClick={handleSearch} disabled={searching} className="px-6 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center gap-2">
            <Search className="w-4 h-4" /> {searching ? "..." : "بحث"}
          </button>
        </div>
      </div>

      {success ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success-bg flex items-center justify-center"><CheckCircle className="w-10 h-10 text-success" /></div>
          <h2 className="text-2xl font-black text-foreground mb-2">تم التجديد بنجاح!</h2>
          <button onClick={() => { setSuccess(false); setSubscriber(null); setSearchQuery(""); }} className="mt-4 px-6 py-3 rounded-xl gradient-primary text-white font-bold">تجديد آخر</button>
        </div>
      ) : subscriber && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold text-foreground mb-4">المشترك: <span className="text-primary">{subscriber.name}</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-foreground mb-2">نوع الاشتراك</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                  <option value="public_library">مكتبة عامة</option><option value="children_library">مكتبة أطفال</option>
                </select></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك</label>
                <select value={form.category} onChange={e => handleCategoryChange(e.target.value)} className={inputClass}>
                  <option value="regular">شخص</option><option value="student">طالب</option><option value="municipality_employee">موظف بلدية</option>
                </select></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل)</label>
                <input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: Number(e.target.value) }))} className={inputClass} dir="ltr" /></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل</label>
                <input type="text" value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value }))} className={inputClass} /></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر</label>
                <input type="text" value={form.book_number} onChange={e => setForm(f => ({ ...f, book_number: e.target.value }))} className={inputClass} /></div>
              <div><label className="block text-sm font-semibold text-foreground mb-2">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={cn(inputClass, "resize-none")} /></div>
            </div>
            <div className="mt-4 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center">
              <span className="text-foreground font-semibold">إجمالي الرسوم</span>
              <span className="text-2xl font-black text-primary">{form.fee.toFixed(2)} ₪</span>
            </div>
            <button onClick={handleRenew} disabled={renewing} className="w-full mt-4 py-4 rounded-xl gradient-accent text-white font-bold text-lg shadow-accent hover:shadow-elevated transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" /> {renewing ? "جاري التجديد..." : "تجديد الاشتراك"}
            </button>
          </div>

          {subscriptions.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-bold text-foreground mb-4">سجل الاشتراكات السابقة</h3>
              <AgGridTable columnDefs={[
                { field: "start_date", headerName: "تاريخ البداية" }, { field: "end_date", headerName: "تاريخ النهاية" },
                { field: "fee", headerName: "الرسوم" }, { field: "status", headerName: "الحالة" },
              ]} rowData={subscriptions} showExport={false} showPrint={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
