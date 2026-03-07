import { useState } from "react";
import { Search, Save, Edit, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const governorates = [
  "أريحا والأغوار", "بيت لحم", "الخليل", "القدس", "دير البلح",
  "رفح", "سلفيت", "شمال غزة", "طوباس", "طولكرم",
  "غزة", "قلقيلية", "خان يونس", "نابلس", "جنين", "رام الله والبيرة"
];

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:border-primary"
);

export default function EditSubscriptionPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [guarantor, setGuarantor] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*, guarantors(*), subscriptions(*)")
        .or(`name.ilike.%${searchQuery}%,subscriber_number.eq.${searchQuery},national_id.eq.${searchQuery}`)
        .limit(1)
        .single();

      if (error || !data) {
        toast({ title: "لم يتم العثور على المشترك", variant: "destructive" });
        setSubscriber(null);
        return;
      }

      setSubscriber(data);
      setGuarantor(data.guarantors || null);
      const subs = data.subscriptions;
      setSubscription(Array.isArray(subs) ? subs[subs.length - 1] : subs);
    } catch {
      toast({ title: "خطأ في البحث", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!subscriber) return;
    setSaving(true);
    try {
      const { error: subErr } = await supabase.from("subscribers").update({
        name: subscriber.name,
        birth_date: subscriber.birth_date,
        gender: subscriber.gender,
        national_id: subscriber.national_id,
        governorate: subscriber.governorate,
        job: subscriber.job,
        mobile_numbers: subscriber.mobile_numbers,
        address: subscriber.address,
      }).eq("id", subscriber.id);
      if (subErr) throw subErr;

      if (guarantor?.id) {
        const { error: gErr } = await supabase.from("guarantors").update({
          name: guarantor.name,
          job: guarantor.job,
          address: guarantor.address,
          mobile_numbers: guarantor.mobile_numbers,
        }).eq("id", guarantor.id);
        if (gErr) throw gErr;
      }

      if (subscription?.id) {
        const { error: sErr } = await supabase.from("subscriptions").update({
          type: subscription.type,
          category: subscription.category,
          fee: subscription.fee,
          receipt_number: subscription.receipt_number,
          book_number: subscription.book_number,
          notes: subscription.notes,
        }).eq("id", subscription.id);
        if (sErr) throw sErr;
      }

      toast({ title: "تم حفظ التعديلات بنجاح ✅" });
    } catch {
      toast({ title: "خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addMobile = () => setSubscriber((s: any) => ({ ...s, mobile_numbers: [...(s.mobile_numbers || []), ""] }));
  const removeMobile = (i: number) => setSubscriber((s: any) => ({ ...s, mobile_numbers: s.mobile_numbers.filter((_: any, idx: number) => idx !== i) }));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1">تعديل بيانات الاشتراك</h1>
        <p className="text-muted-foreground">حدث معلومات أي اشتراك موجود بالمكتبة.</p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border mb-6">
        <h3 className="font-bold text-foreground mb-3">البحث عن مشترك</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="ادخل اسم المشترك أو رقمه أو رقم هويته"
            className={cn(inputClass, "flex-1")}
          />
          <button onClick={handleSearch} disabled={searching} className="px-6 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center gap-2">
            <Search className="w-4 h-4" />
            {searching ? "جاري البحث..." : "بحث"}
          </button>
        </div>
      </div>

      {subscriber && (
        <div className="space-y-6">
          {/* Subscriber Data */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Edit className="w-5 h-5 text-primary" /> بيانات المشترك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">رقم المشترك</label>
                <input type="text" value={subscriber.subscriber_number || ""} onChange={e => setSubscriber((s: any) => ({ ...s, subscriber_number: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">اسم المشترك</label>
                <input type="text" value={subscriber.name || ""} onChange={e => setSubscriber((s: any) => ({ ...s, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">تاريخ الميلاد</label>
                <input type="date" value={subscriber.birth_date || ""} onChange={e => setSubscriber((s: any) => ({ ...s, birth_date: e.target.value }))} className={inputClass} dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">الجنس</label>
                <select value={subscriber.gender || ""} onChange={e => setSubscriber((s: any) => ({ ...s, gender: e.target.value }))} className={inputClass}>
                  <option value="">اختر</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">رقم الهوية</label>
                <input type="text" value={subscriber.national_id || ""} onChange={e => setSubscriber((s: any) => ({ ...s, national_id: e.target.value }))} className={inputClass} dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">المحافظة</label>
                <select value={subscriber.governorate || ""} onChange={e => setSubscriber((s: any) => ({ ...s, governorate: e.target.value }))} className={inputClass}>
                  <option value="">اختر</option>
                  {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">الوظيفة</label>
                <input type="text" value={subscriber.job || ""} onChange={e => setSubscriber((s: any) => ({ ...s, job: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">العنوان</label>
                <input type="text" value={subscriber.address || ""} onChange={e => setSubscriber((s: any) => ({ ...s, address: e.target.value }))} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">أرقام الموبايل</label>
                <div className="space-y-2">
                  {(subscriber.mobile_numbers || [""]).map((m: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input type="tel" value={m} onChange={e => {
                        const nums = [...(subscriber.mobile_numbers || [])];
                        nums[i] = e.target.value;
                        setSubscriber((s: any) => ({ ...s, mobile_numbers: nums }));
                      }} className={cn(inputClass, "flex-1")} dir="ltr" />
                      {i > 0 && <button onClick={() => removeMobile(i)} className="p-2.5 rounded-xl text-destructive border-2 border-destructive/20 hover:bg-destructive/10"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={addMobile} className="flex items-center gap-2 text-primary text-sm font-medium"><Plus className="w-4 h-4" /> إضافة رقم آخر</button>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantor */}
          {guarantor && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-bold text-foreground mb-4">بيانات الكفيل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">اسم الكفيل</label>
                  <input type="text" value={guarantor.name || ""} onChange={e => setGuarantor((g: any) => ({ ...g, name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">الوظيفة</label>
                  <input type="text" value={guarantor.job || ""} onChange={e => setGuarantor((g: any) => ({ ...g, job: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">العنوان</label>
                  <input type="text" value={guarantor.address || ""} onChange={e => setGuarantor((g: any) => ({ ...g, address: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Subscription */}
          {subscription && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-bold text-foreground mb-4">تفاصيل الاشتراك</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">نوع الاشتراك</label>
                  <select value={subscription.type || ""} onChange={e => setSubscription((s: any) => ({ ...s, type: e.target.value }))} className={inputClass}>
                    <option value="public_library">مكتبة عامة</option>
                    <option value="children_library">مكتبة أطفال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك</label>
                  <select value={subscription.category || ""} onChange={e => setSubscription((s: any) => ({ ...s, category: e.target.value }))} className={inputClass}>
                    <option value="regular">شخص</option>
                    <option value="student">طالب</option>
                    <option value="municipality_employee">موظف بلدية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">الرسوم</label>
                  <input type="number" value={subscription.fee || 0} onChange={e => setSubscription((s: any) => ({ ...s, fee: Number(e.target.value) }))} className={inputClass} dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل</label>
                  <input type="text" value={subscription.receipt_number || ""} onChange={e => setSubscription((s: any) => ({ ...s, receipt_number: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر</label>
                  <input type="text" value={subscription.book_number || ""} onChange={e => setSubscription((s: any) => ({ ...s, book_number: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات</label>
                  <textarea value={subscription.notes || ""} onChange={e => setSubscription((s: any) => ({ ...s, notes: e.target.value }))} rows={2} className={cn(inputClass, "resize-none")} />
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-xl gradient-primary text-white font-bold text-lg shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      )}
    </div>
  );
}
