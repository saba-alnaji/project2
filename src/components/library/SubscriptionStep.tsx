import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const subscriptionSchema = z.object({
  duration: z.string().min(1, "مطلوب"),
  type: z.string().min(1, "مطلوب"),
  category: z.string().min(1, "مطلوب"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
  fee: z.number().min(0, "الرسوم يجب أن تكون 0 أو أكثر"),
  payment_method: z.string().min(1, "طريقة الدفع مطلوبة"),
  receipt_number: z.string().min(1, "رقم الوصل مطلوب"),
  book_number: z.string().min(1, "رقم الدفتر مطلوب"),
  notes: z.string().optional().default(""),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

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

const categoryToId: Record<string, number> = {
  regular: 1,
  student: 2,
  employee: 3,
  municipality_employee: 4,
};

const paymentMethodToId: Record<string, number> = {
  cash: 1,
  transfer: 2,
  check: 3,
};

export { categoryToId, paymentMethodToId };

export default function SubscriptionStep({ onSubmit, onBack, loading }: SubscriptionStepProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
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
    },
  });

  const category = watch("category");
  const fee = watch("fee");
  const type = watch("type");

  useEffect(() => {
    setValue("fee", feeByCategory[category] ?? 35);
  }, [category, setValue]);

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary"
  );

  const errorClass = "text-destructive text-xs mt-1 font-medium";

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-accent flex items-center justify-center shadow-accent">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك</h2>
        <p className="text-muted-foreground text-sm">حدد نوع ومدة الاشتراك والرسوم</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">مدة الاشتراك</label>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <select {...field} className={inputClass}>
                  <option value="annual">سنوي</option>
                  <option value="semi_annual">نصف سنوي</option>
                  <option value="monthly">شهري</option>
                </select>
              )}
            />
            {errors.duration && <p className={errorClass}>{errors.duration.message}</p>}
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
                  type="button"
                  onClick={() => setValue("type", opt.value)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200",
                    type === opt.value
                      ? "gradient-primary text-white border-primary shadow-card"
                      : "border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.type && <p className={errorClass}>{errors.type.message}</p>}
          </div>

          {/* Category */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: "regular", label: "شخص", fee: "35 ₪" },
                { value: "student", label: "طالب", fee: "25 ₪" },
                { value: "municipality_employee", label: "موظف بلدية", fee: "مجاناً" },
                
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("category", opt.value)}
                  className={cn(
                    "py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all duration-200 text-center",
                    category === opt.value
                      ? "gradient-primary text-white border-primary shadow-card"
                      : "border-border text-foreground hover:border-primary/50"
                  )}
                >
                  <div>{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", category === opt.value ? "text-white/80" : "text-muted-foreground")}>
                    {opt.fee}
                  </div>
                </button>
              ))}
            </div>
            {errors.category && <p className={errorClass}>{errors.category.message}</p>}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">تاريخ بداية الاشتراك</label>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted/50 cursor-not-allowed")} dir="ltr" />
              )}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">تاريخ نهاية الاشتراك</label>
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted/50 cursor-not-allowed")} dir="ltr" />
              )}
            />
          </div>

          {/* Fee */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل)</label>
            <div className="relative">
              <Controller
                name="fee"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                    className={cn(inputClass, "font-bold text-lg p-3")}
                    dir="ltr"
                  />
                )}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₪</span>
            </div>
            {errors.fee && <p className={errorClass}>{errors.fee.message}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">طريقة الدفع</label>
            <Controller
              name="payment_method"
              control={control}
              render={({ field }) => (
                <select {...field} className={inputClass}>
                  <option value="cash">نقداً</option>
                </select>
              )}
            />
            {errors.payment_method && <p className={errorClass}>{errors.payment_method.message}</p>}
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل <span className="text-destructive">*</span></label>
            <Controller
              name="receipt_number"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} placeholder="رقم وصل الدفع" className={cn(inputClass, errors.receipt_number && "border-destructive")} dir="ltr" />
              )}
            />
            {errors.receipt_number && <p className={errorClass}>{errors.receipt_number.message}</p>}
          </div>

          {/* Book Number */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر <span className="text-destructive">*</span></label>
            <Controller
              name="book_number"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} placeholder="رقم الدفتر" className={cn(inputClass, errors.book_number && "border-destructive")} dir="ltr" />
              )}
            />
            {errors.book_number && <p className={errorClass}>{errors.book_number.message}</p>}
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات</label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <textarea {...field} placeholder="أي ملاحظات إضافية..." rows={3} className={cn(inputClass, "resize-none")} />
              )}
            />
          </div>
        </div>

        {/* Fee summary */}
        <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center">
          <span className="text-foreground font-semibold">إجمالي الرسوم</span>
          <span className="text-2xl font-black text-primary">{fee.toFixed(2)} ₪</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all duration-200"
          >
            رجوع
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-grow-[2] py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all duration-200 flex items-center justify-center gap-2 text-base"
          >
            <Save className="w-5 h-5" />
            {loading ? "جاري الحفظ..." : "حفظ الاشتراك"}
          </button>
        </div>
      </form>
    </div>
  );
}
