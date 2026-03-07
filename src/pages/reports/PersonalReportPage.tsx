import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

type Tab = "current" | "subscriptions" | "history" | "fines";

export default function PersonalReportPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriber, setSubscriber] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("current");
  const [currentLoans, setCurrentLoans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loanHistory, setLoanHistory] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from("subscribers").select("*")
      .or(`name.ilike.%${searchQuery}%,subscriber_number.eq.${searchQuery}`)
      .limit(1).single();
    if (!data) { toast({ title: "لم يتم العثور على المشترك", variant: "destructive" }); return; }
    setSubscriber(data);
    loadData(data.id);
  };

  const loadData = async (id: string) => {
    const { data: active } = await supabase.from("loans").select("*, books(*)").eq("subscriber_id", id).eq("status", "active");
    setCurrentLoans((active || []).map((l: any) => ({ title: l.books?.title || "—", book_barcode: l.books?.barcode || "—", loan_date: l.loan_date, return_date: l.expected_return_date })));

    const { data: subs } = await supabase.from("subscriptions").select("*").eq("subscriber_id", id).order("start_date", { ascending: false });
    setSubscriptions((subs || []).map((s: any) => ({ start_date: s.start_date, end_date: s.end_date, duration: s.duration || "—", fee: `${s.fee || 0} شيكل`, payment_method: s.payment_method || "—" })));

    const { data: hist } = await supabase.from("loans").select("*, books(*)").eq("subscriber_id", id).order("loan_date", { ascending: false });
    setLoanHistory((hist || []).map((l: any) => ({ title: l.books?.title || "—", book_barcode: l.books?.barcode || "—", loan_date: l.loan_date, return_date: l.actual_return_date || l.expected_return_date })));

    const { data: fineData } = await supabase.from("fines").select("*").eq("subscriber_id", id).order("created_at", { ascending: false });
    setFines((fineData || []).map((f: any) => ({
      fine_type: f.fine_type === "late_return" ? "تأخير إرجاع" : f.fine_type === "damaged" ? "كتاب تالف" : f.fine_type === "lost" ? "كتاب مفقود" : f.fine_type,
      fine_date: f.created_at?.split("T")[0] || "—", amount: f.amount, book_title: f.book_title || "—",
    })));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "current", label: "الإعارات الحالية" }, { id: "subscriptions", label: "سجل الاشتراكات" },
    { id: "history", label: "سجل الإعارات" }, { id: "fines", label: "سجل المخالفات" },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">تقارير شخصية</h1>
        <p className="text-muted-foreground">عرض التقارير الشخصية لكل مشترك.</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border mb-6">
        <h3 className="font-bold text-foreground mb-3">🔎 البحث عن مشترك</h3>
        <div className="flex gap-3">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="ادخل اسم المشترك أو رقمه" className={cn(inputClass, "flex-1")} />
          <button onClick={handleSearch} className="px-6 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center gap-2">
            <Search className="w-4 h-4" /> بحث
          </button>
        </div>
      </div>

      {subscriber && (
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-bold text-primary text-xl mb-4">تقرير المشترك: {subscriber.name} ({subscriber.subscriber_number || "—"})</h3>
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "gradient-primary text-white shadow-card" : "bg-muted text-foreground hover:bg-muted/80"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "current" && <AgGridTable columnDefs={[
            { field: "title", headerName: "عنوان الكتاب" }, { field: "book_barcode", headerName: "باركود الكتاب" },
            { field: "loan_date", headerName: "تاريخ الإعارة" }, { field: "return_date", headerName: "تاريخ الإرجاع المتوقع" },
          ]} rowData={currentLoans} title={`الإعارات الحالية - ${subscriber.name}`} />}

          {tab === "subscriptions" && <AgGridTable columnDefs={[
            { field: "start_date", headerName: "تاريخ الاشتراك" }, { field: "end_date", headerName: "تاريخ الانتهاء" },
            { field: "duration", headerName: "المدة" }, { field: "fee", headerName: "المبلغ" }, { field: "payment_method", headerName: "طريقة الدفع" },
          ]} rowData={subscriptions} title={`سجل الاشتراكات - ${subscriber.name}`} />}

          {tab === "history" && <AgGridTable columnDefs={[
            { field: "title", headerName: "العنوان" }, { field: "book_barcode", headerName: "باركود الكتاب" },
            { field: "loan_date", headerName: "تاريخ الإعارة" }, { field: "return_date", headerName: "تاريخ الإرجاع" },
          ]} rowData={loanHistory} title={`سجل الإعارات - ${subscriber.name}`} />}

          {tab === "fines" && <AgGridTable columnDefs={[
            { field: "fine_type", headerName: "نوع المخالفة" }, { field: "fine_date", headerName: "التاريخ" },
            { field: "amount", headerName: "المبلغ" }, { field: "book_title", headerName: "الكتاب" },
          ]} rowData={fines} title={`سجل المخالفات - ${subscriber.name}`} />}
        </div>
      )}
    </div>
  );
}
