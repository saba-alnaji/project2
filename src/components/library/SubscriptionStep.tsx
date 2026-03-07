import { useState } from "react";
import { CreditCard, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubscriptionFormData {
  duration: string;
  type: string;
  category: string;
  start_date: string;
  end_date: string;
  fee: number;
  payment_method: string;
  receipt_number: string;
  book_number: string;
  notes: string;
}

interface SubscriptionStepProps {
  onSubmit: (data: SubscriptionFormData) => void;
  onBack: () => void;
  loading: boolean;
}

const today = new Date().toISOString().split("T")[0];
const oneYearLater = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
})();

const feeByCategory: Record<string, number> = {
  regular: 35,
  student: 25,
  employee: 35,
  municipality_employee: 0,
};

export default function SubscriptionStep({ onSubmit, onBack, loading }: SubscriptionStepProps) {
  const [form, setForm] = useState<SubscriptionFormData>({
    duration: "annual",
    type: "public_library",
    category: "regular",
    start_date: today,
    end_date: oneYearLater,
    fee: 35,
    payment_method: "cash",
    receipt_number: "",
    book_number: "",
    notes: "",
  });

  const handleCategoryChange = (category: string) => {
    setForm(prev => ({ ...prev, category, fee: feeByCategory[category] ?? 35 }));
  };

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary"
  );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-accent flex items-center justify-center shadow-accent">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك</h2>
        <p className="text-muted-foreground text-sm">حدد نوع ومدة الاشتراك والرسوم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">مدة الاشتراك</label>
          <select
            value={form.duration}
            onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
            className={inputClass}
          >
            <option value="annual">سنوي</option>
            <option value="semi_annual">نصف سنوي</option>
            <option value="monthly">شهري</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">نوع الاشتراك</label>
          <div className="flex gap-2">
            {[
              { value: "public_library", label: "مكتبة عامة" },
              { value: "children_library", label: "مكتبة أطفال" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200",
                  form.type === opt.value
                    ? "gradient-primary text-white border-primary shadow-card"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: "regular", label: "شخص", fee: "35 ₪" },
              { value: "student", label: "طالب", fee: "25 ₪" },
              { value: "employee", label: "موظف", fee: "35 ₪" },
              { value: "municipality_employee", label: "بلدية", fee: "مجاناً" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleCategoryChange(opt.value)}
                className={cn(
                  "py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all duration-200 text-center",
                  form.category === opt.value
                    ? "gradient-primary text-white border-primary shadow-card"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                <div>{opt.label}</div>
                <div className={cn("text-xs mt-0.5", form.category === opt.value ? "text-white/80" : "text-muted-foreground")}>
                  {opt.fee}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">تاريخ بداية الاشتراك</label>
          <input
            type="date"
            value={form.start_date}
            readOnly
            className={cn(inputClass, "bg-muted/50 cursor-not-allowed")}
            dir="ltr"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">تاريخ نهاية الاشتراك</label>
          <input
            type="date"
            value={form.end_date}
            readOnly
            className={cn(inputClass, "bg-muted/50 cursor-not-allowed")}
            dir="ltr"
          />
        </div>

        {/* Fee */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل)</label>
          <div className="relative">
            <input
              type="number"
              value={form.fee}
              onChange={e => setForm(prev => ({ ...prev, fee: Number(e.target.value) }))}
              className={cn(inputClass, "font-bold text-lg")}
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₪</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">طريقة الدفع</label>
          <select
            value={form.payment_method}
            onChange={e => setForm(prev => ({ ...prev, payment_method: e.target.value }))}
            className={inputClass}
          >
            <option value="cash">نقداً</option>
            <option value="transfer">تحويل بنكي</option>
            <option value="check">شيك</option>
          </select>
        </div>

        {/* Receipt Number */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل</label>
          <input
            type="text"
            value={form.receipt_number}
            onChange={e => setForm(prev => ({ ...prev, receipt_number: e.target.value }))}
            placeholder="رقم وصل الدفع"
            className={inputClass}
            dir="ltr"
          />
        </div>

        {/* Book Number */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر</label>
          <input
            type="text"
            value={form.book_number}
            onChange={e => setForm(prev => ({ ...prev, book_number: e.target.value }))}
            placeholder="رقم الدفتر"
            className={inputClass}
            dir="ltr"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="أي ملاحظات إضافية..."
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </div>
      </div>

      {/* Fee summary */}
      <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center">
        <span className="text-foreground font-semibold">إجمالي الرسوم</span>
        <span className="text-2xl font-black text-primary">{form.fee.toFixed(2)} ₪</span>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all duration-200"
        >
          رجوع
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading}
          className="flex-grow-[2] py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all duration-200 flex items-center justify-center gap-2 text-base"
        >
          <Save className="w-5 h-5" />
          {loading ? "جاري الحفظ..." : "حفظ الاشتراك"}
        </button>
      </div>
    </div>
  );
}
