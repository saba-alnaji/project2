import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

export default function LateReturnPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<any[]>([]);
  const [returnModal, setReturnModal] = useState<any>(null);
  const [renewModal, setRenewModal] = useState<any>(null);
  const [returnForm, setReturnForm] = useState({ condition: "good", fine: 0, notes: "", violation: "late_return" });
  const [saving, setSaving] = useState(false);

  const loadLateLoans = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("loans").select("*, books(*), subscribers(*)")
      .eq("status", "active").lt("expected_return_date", today).order("expected_return_date", { ascending: true });
    setLoans((data || []).map((l: any) => {
      const expected = new Date(l.expected_return_date);
      const now = new Date();
      const lateDays = Math.max(0, Math.floor((now.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
      return { ...l, subscriber_name: l.subscribers?.name || "—", subscriber_id_display: l.subscribers?.subscriber_number || "—", book_title: l.books?.title || "—", book_barcode: l.books?.barcode || "—", late_days: lateDays };
    }));
  };

  useEffect(() => { loadLateLoans(); }, []);

  const handleReturn = async () => {
    if (!returnModal) return; setSaving(true);
    try {
      await supabase.from("loans").update({ status: "returned", actual_return_date: new Date().toISOString().split("T")[0], book_condition: returnForm.condition, notes: returnForm.notes || null }).eq("id", returnModal.id);
      await supabase.from("books").update({ is_available: true }).eq("id", returnModal.book_id);
      if (returnForm.fine > 0) { await supabase.from("fines").insert({ loan_id: returnModal.id, subscriber_id: returnModal.subscriber_id, fine_type: returnForm.violation, amount: returnForm.fine, book_title: returnModal.book_title, notes: returnForm.notes }); }
      toast({ title: "تم الإرجاع بنجاح ✅" }); setReturnModal(null); loadLateLoans();
    } catch { toast({ title: "خطأ", variant: "destructive" }); } finally { setSaving(false); }
  };

  const handleRenew = async () => {
    if (!renewModal) return; setSaving(true);
    try {
      const newReturn = new Date(renewModal.expected_return_date);
      newReturn.setDate(newReturn.getDate() + 14);
      await supabase.from("loans").update({ expected_return_date: newReturn.toISOString().split("T")[0] }).eq("id", renewModal.id);
      toast({ title: "تم تجديد الإعارة ✅" }); setRenewModal(null); loadLateLoans();
    } catch { toast({ title: "خطأ", variant: "destructive" }); } finally { setSaving(false); }
  };

  const actionCellRenderer = (params: any) => {
    const row = params.data;
    return (
      <div className="flex gap-1">
        <button onClick={() => setReturnModal(row)} className="px-3 py-1 rounded-lg bg-success text-white text-xs font-bold">إرجاع</button>
        <button onClick={() => setRenewModal(row)} className="px-3 py-1 rounded-lg bg-accent text-white text-xs font-bold">تجديد</button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">إرجاع متأخر</h1>
        <p className="text-muted-foreground">حدد الكتب المتأخرة لإرجاعها وتحديث سجلات الإعارة.</p>
      </div>
      <h4 className="font-bold text-foreground mb-3">قائمة الإعارات المتأخرة</h4>
      <AgGridTable
        columnDefs={[
          { field: "subscriber_id_display", headerName: "رقم المشترك" },
          { field: "subscriber_name", headerName: "اسم المشترك" },
          { field: "book_title", headerName: "عنوان الكتاب" },
          { field: "book_barcode", headerName: "باركود الكتاب" },
          { field: "loan_date", headerName: "تاريخ الإعارة" },
          { field: "expected_return_date", headerName: "تاريخ الإرجاع المتوقع" },
          { field: "late_days", headerName: "أيام التأخير", cellStyle: { color: "hsl(0, 80%, 55%)", fontWeight: "bold" } },
          { field: "actions", headerName: "الإجراءات", cellRenderer: actionCellRenderer, filter: false },
        ]}
        rowData={loans}
        title="الإعارات المتأخرة"
      />

      <Dialog open={!!returnModal} onOpenChange={() => setReturnModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>إرجاع كتاب متأخر</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-semibold mb-2">نوع المخالفة</label>
              <select value={returnForm.violation} onChange={e => setReturnForm(f => ({ ...f, violation: e.target.value }))} className={inputClass}>
                <option value="late_return">تأخير في الإرجاع</option><option value="damaged">كتاب تالف</option><option value="lost">كتاب مفقود</option><option value="other">أخرى</option>
              </select></div>
            <div><label className="block text-sm font-semibold mb-2">حالة الكتاب</label>
              <select value={returnForm.condition} onChange={e => setReturnForm(f => ({ ...f, condition: e.target.value }))} className={inputClass}>
                <option value="good">جيد</option><option value="damaged">متضرر</option><option value="destroyed">تالف</option><option value="lost">ضائع</option>
              </select></div>
            <div><label className="block text-sm font-semibold mb-2">مبلغ الغرامة (شيكل)</label>
              <input type="number" value={returnForm.fine} onChange={e => setReturnForm(f => ({ ...f, fine: Number(e.target.value) }))} className={inputClass} dir="ltr" /></div>
            <div><label className="block text-sm font-semibold mb-2">ملاحظات</label>
              <textarea value={returnForm.notes} onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))} rows={3} className={cn(inputClass, "resize-none")} /></div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setReturnModal(null)} className="px-6 py-2 rounded-xl border-2 border-border text-foreground font-semibold">إلغاء</button>
            <button onClick={handleReturn} disabled={saving} className="px-6 py-2 rounded-xl bg-success text-white font-bold">{saving ? "..." : "حفظ الإرجاع"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renewModal} onOpenChange={() => setRenewModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تجديد إعارة</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل أنت متأكد من تجديد الإعارة؟</p>
          <DialogFooter className="gap-2">
            <button onClick={() => setRenewModal(null)} className="px-6 py-2 rounded-xl border-2 border-border text-foreground font-semibold">إلغاء</button>
            <button onClick={handleRenew} disabled={saving} className="px-6 py-2 rounded-xl gradient-primary text-white font-bold">{saving ? "..." : "تجديد"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
