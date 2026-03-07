import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AgGridTable from "@/components/library/AgGridTable";

type Tab = "loans" | "subscribers" | "late";

export default function GeneralReportsPage() {
  const [tab, setTab] = useState<Tab>("loans");
  const [loanData, setLoanData] = useState<any[]>([]);
  const [subData, setSubData] = useState<any[]>([]);
  const [lateData, setLateData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: loans } = await supabase
      .from("loans").select("*, books(*), subscribers(*)")
      .order("loan_date", { ascending: false });
    setLoanData((loans || []).map((l: any) => ({
      title: l.books?.title || "—",
      author: l.books?.author || "—",
      serial_number: l.books?.serial_number || "—",
      loan_date: l.loan_date,
      subscriber: l.subscribers?.name || "—",
    })));

    const { data: subs } = await supabase
      .from("subscribers").select("*, subscriptions(*)")
      .order("created_at", { ascending: false });
    setSubData((subs || []).map((s: any) => {
      const lastSub = Array.isArray(s.subscriptions) ? s.subscriptions[s.subscriptions.length - 1] : s.subscriptions;
      return {
        subscriber_number: s.subscriber_number || "—",
        name: s.name,
        subscription_date: lastSub?.start_date || "—",
        subscription_duration: lastSub?.duration || "—",
      };
    }));

    const today = new Date().toISOString().split("T")[0];
    const { data: late } = await supabase
      .from("loans").select("*, books(*), subscribers(*)")
      .eq("status", "active").lt("expected_return_date", today);
    setLateData((late || []).map((l: any) => {
      const expected = new Date(l.expected_return_date);
      const now = new Date();
      const lateDays = Math.max(0, Math.floor((now.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        subscriber_name: l.subscribers?.name || "—",
        book_title: l.books?.title || "—",
        serial_number: l.books?.serial_number || "—",
        author: l.books?.author || "—",
        loan_date: l.loan_date,
        return_date: l.expected_return_date,
        late_days: lateDays,
      };
    }));
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "loans", label: "تقارير الإعارة", emoji: "📚" },
    { id: "subscribers", label: "تقارير المشتركين", emoji: "👥" },
    { id: "late", label: "المتأخرين", emoji: "⏰" },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">تقارير عامة</h1>
        <p className="text-muted-foreground">تقارير شاملة عن الإعارات والمشتركين والكتب المتأخرة.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === t.id ? "gradient-primary text-white shadow-card" : "bg-card border border-border text-foreground hover:bg-muted"
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === "loans" && (
        <AgGridTable
          columnDefs={[
            { field: "title", headerName: "عنوان الكتاب" },
            { field: "author", headerName: "المؤلف" },
            { field: "serial_number", headerName: "رقم التسلسل" },
            { field: "loan_date", headerName: "تاريخ الإعارة" },
            { field: "subscriber", headerName: "المشترك" },
          ]}
          rowData={loanData}
          title="تقارير الإعارة"
        />
      )}

      {tab === "subscribers" && (
        <AgGridTable
          columnDefs={[
            { field: "subscriber_number", headerName: "رقم المشترك" },
            { field: "name", headerName: "اسم المشترك" },
            { field: "subscription_date", headerName: "تاريخ الاشتراك" },
            { field: "subscription_duration", headerName: "مدة الاشتراك" },
          ]}
          rowData={subData}
          title="تقارير المشتركين"
        />
      )}

      {tab === "late" && (
        <AgGridTable
          columnDefs={[
            { field: "subscriber_name", headerName: "اسم المشترك" },
            { field: "book_title", headerName: "عنوان الكتاب" },
            { field: "serial_number", headerName: "رقم التسلسل" },
            { field: "author", headerName: "المؤلف" },
            { field: "loan_date", headerName: "تاريخ الإعارة" },
            { field: "return_date", headerName: "تاريخ الإرجاع" },
            { field: "late_days", headerName: "أيام التأخير", cellStyle: { color: "hsl(0, 80%, 55%)", fontWeight: "bold" } },
          ]}
          rowData={lateData}
          title="المتأخرين"
        />
      )}
    </div>
  );
}
