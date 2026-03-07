import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Tab = "loans" | "subscribers";

export default function OnlineRequestsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("loans");
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: "approve" | "reject"; item: any; source: Tab } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const { data: lr } = await supabase.from("loan_requests").select("*, subscribers(*)").eq("status", "pending").order("request_date", { ascending: false });
    setLoanRequests((lr || []).map((r: any) => ({ ...r, subscriber_name: r.subscribers?.name || "—", subscriber_number: r.subscribers?.subscriber_number || "—", address: r.subscribers?.address || "—" })));
    const { data: sr } = await supabase.from("subscription_requests").select("*").eq("status", "pending").order("request_date", { ascending: false });
    setSubRequests(sr || []);
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async () => {
    if (!confirmModal) return; setSaving(true);
    const { type, item, source } = confirmModal;
    const newStatus = type === "approve" ? "approved" : "rejected";
    try {
      if (source === "loans") await supabase.from("loan_requests").update({ status: newStatus }).eq("id", item.id);
      else await supabase.from("subscription_requests").update({ status: newStatus }).eq("id", item.id);
      toast({ title: type === "approve" ? "تمت الموافقة ✅" : "تم الرفض ❌" }); setConfirmModal(null); loadData();
    } catch { toast({ title: "خطأ", variant: "destructive" }); } finally { setSaving(false); }
  };

  const loanActionRenderer = (params: any) => {
    const row = params.data;
    return (
      <div className="flex gap-1">
        <button onClick={() => setConfirmModal({ type: "approve", item: row, source: "loans" })} className="px-3 py-1 rounded-lg bg-success text-white text-xs font-bold">تفعيل</button>
        <button onClick={() => setConfirmModal({ type: "reject", item: row, source: "loans" })} className="px-3 py-1 rounded-lg bg-destructive text-white text-xs font-bold">إلغاء</button>
      </div>
    );
  };

  const subActionRenderer = (params: any) => {
    const row = params.data;
    return (
      <div className="flex gap-1">
        <button onClick={() => setConfirmModal({ type: "approve", item: row, source: "subscribers" })} className="px-3 py-1 rounded-lg bg-success text-white text-xs font-bold">تفعيل</button>
        <button onClick={() => setConfirmModal({ type: "reject", item: row, source: "subscribers" })} className="px-3 py-1 rounded-lg bg-destructive text-white text-xs font-bold">إلغاء</button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">طلبات الاشتراك والإعارة</h1>
        <p className="text-muted-foreground">معالجة طلبات الاشتراك والإعارة من المشتركين.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("loans")} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${tab === "loans" ? "gradient-primary text-white shadow-card" : "bg-card border border-border text-foreground"}`}>📚 طلبات الإعارة</button>
        <button onClick={() => setTab("subscribers")} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${tab === "subscribers" ? "gradient-primary text-white shadow-card" : "bg-card border border-border text-foreground"}`}>🚫 المشتركين غير المفعلين</button>
      </div>

      {tab === "loans" && (
        <AgGridTable
          columnDefs={[
            { field: "subscriber_number", headerName: "رقم المشترك" },
            { field: "subscriber_name", headerName: "اسم المشترك" },
            { field: "book_title", headerName: "عنوان الكتاب" },
            { field: "classification_code", headerName: "رمز التصنيف" },
            { field: "request_date", headerName: "تاريخ الطلب" },
            { field: "address", headerName: "العنوان" },
            { field: "actions", headerName: "الإجراءات", cellRenderer: loanActionRenderer, filter: false },
          ]}
          rowData={loanRequests}
          title="طلبات الإعارة"
        />
      )}

      {tab === "subscribers" && (
        <AgGridTable
          columnDefs={[
            { field: "subscriber_name", headerName: "اسم المشترك" },
            { field: "phone_number", headerName: "رقم الجوال" },
            { field: "address", headerName: "العنوان" },
            { field: "request_date", headerName: "تاريخ الطلب" },
            { field: "actions", headerName: "الإجراءات", cellRenderer: subActionRenderer, filter: false },
          ]}
          rowData={subRequests}
          title="طلبات الاشتراك"
        />
      )}

      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{confirmModal?.type === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">{confirmModal?.type === "approve" ? "هل أنت متأكد من الموافقة على هذا الطلب؟" : "هل أنت متأكد من رفض هذا الطلب؟ لا يمكن التراجع."}</p>
          <DialogFooter className="gap-2">
            <button onClick={() => setConfirmModal(null)} className="px-6 py-2 rounded-xl border-2 border-border text-foreground font-semibold">رجوع</button>
            <button onClick={handleAction} disabled={saving} className={`px-6 py-2 rounded-xl text-white font-bold ${confirmModal?.type === "approve" ? "bg-success" : "bg-destructive"}`}>{saving ? "..." : confirmModal?.type === "approve" ? "تأكيد" : "تأكيد الرفض"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
