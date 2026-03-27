import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCheck, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const subscriptionSchema = z.object({
  subscriptionType: z.string().min(1, "نوع الاشتراك مطلوب"),
  memberClassificationId: z.coerce.number().min(1, "تصنيف المشترك مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  amount: z.coerce.number().min(0, "الرسوم يجب أن تكون 0 أو أكثر"),
  paymentMethodId: z.coerce.number().min(1, "طريقة الدفع مطلوبة"),
  receiptNumber: z.string().min(1, "رقم الوصل مطلوب"),
  ledgerNumber: z.string().min(1, "رقم الدفتر مطلوب"),
  note: z.string().optional().default(""),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionStepProps {
  onSubmit: (data: SubscriptionFormData) => void;
  onBack: (currentValues: SubscriptionFormData) => void; // تم التعديل لإرسال القيم الحالية
  loading: boolean;
  initialData?: SubscriptionFormData | null; // إضافة استقبال البيانات المحفوظة
}

const today = new Date().toISOString().split("T")[0];
const oneYearLater = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
})();

const feeByCategory: Record<number, number> = {
  1: 35, // شخص
  2: 25, // طالب
  4: 0,  // موظف بلدية
};

export default function SubscriptionStep({ onSubmit, onBack, loading, initialData }: SubscriptionStepProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues, // نحتاجها لجلب القيم عند الضغط على "رجوع"
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    // استخدام البيانات المحفوظة إن وجدت، وإلا استخدام القيم الافتراضية
    defaultValues: initialData || {
      subscriptionType: "مكتبة عامة",
      memberClassificationId: 1,
      startDate: today,
      endDate: oneYearLater,
      amount: 35,
      paymentMethodId: 1,
      receiptNumber: "",
      ledgerNumber: "",
      note: "",
    },
  });

  const categoryId = watch("memberClassificationId");
  const amount = watch("amount");

  // منطق تحديث الرسوم بناءً على التصنيف
  useEffect(() => {
    // نقوم بتحديث المبلغ تلقائياً فقط إذا لم تكن هناك بيانات محفوظة مسبقاً 
    // (عشان لو رجع المستخدم ولقى سعره اللي عدله ما يرجع يصفر)
    if (!initialData) {
        setValue("amount", feeByCategory[categoryId] ?? 35);
    }
  }, [categoryId, setValue, initialData]);

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary"
  );

  const errorClass = "text-destructive text-xs mt-1 font-medium";

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك</h2>
        <p className="text-muted-foreground text-sm">أدخل بيانات الاشتراك والتحصيل المالي</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* نوع الاشتراك - Select */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              نوع الاشتراك <span className="text-destructive">*</span>
            </label>
            <Controller
              name="subscriptionType"
              control={control}
              render={({ field }) => (
                <select {...field} className={inputClass}>
                  <option value="مكتبة عامة">مكتبة عامة</option>
                  <option value="مكتبة أطفال">مكتبة أطفال</option>
                </select>
              )}
            />
            {errors.subscriptionType && <p className={errorClass}>{errors.subscriptionType.message}</p>}
          </div>

          {/* تصنيف المشترك - Select */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              تصنيف المشترك <span className="text-destructive">*</span>
            </label>
            <Controller
              name="memberClassificationId"
              control={control}
              render={({ field }) => (
                <select
                  className={inputClass}
                  value={field.value}
                  onChange={field.onChange}
                >
                  <option value={1}>شخص (35 ₪)</option>
                  <option value={2}>طالب (25 ₪)</option>
                  <option value={4}>موظف بلدية (مجاني)</option>
                </select>
              )}
            />
            {errors.memberClassificationId && <p className={errorClass}>{errors.memberClassificationId.message}</p>}
          </div>

          {/* التواريخ */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              تاريخ بداية الاشتراك <span className="text-destructive">*</span>
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} className={inputClass} dir="ltr" />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              تاريخ نهاية الاشتراك <span className="text-destructive">*</span>
            </label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} className={inputClass} dir="ltr" />
              )}
            />
          </div>

          {/* الرسوم */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل)</label>
            <div className="relative">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={cn(inputClass, "font-bold text-lg pr-10 pl-3")}
                    dir="ltr"
                  />
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₪
              </span>
            </div>
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              طريقة الدفع <span className="text-destructive">*</span>
            </label>
            <Controller
              name="paymentMethodId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={inputClass}
                  onChange={field.onChange}
                >
                  <option value={1}>نقداً</option>
                </select>
              )}
            />
          </div>

          {/* رقم الوصل */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              رقم الوصل <span className="text-destructive">*</span>
            </label>
            <Controller
              name="receiptNumber"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} placeholder="أدخل رقم الوصل" className={inputClass} dir="ltr" />
              )}
            />
            {errors.receiptNumber && <p className={errorClass}>{errors.receiptNumber.message}</p>}
          </div>

          {/* رقم الدفتر */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              رقم الدفتر <span className="text-destructive">*</span>
            </label>
            <Controller
              name="ledgerNumber"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} placeholder="أدخل رقم الدفتر" className={inputClass} dir="ltr" />
              )}
            />
            {errors.ledgerNumber && <p className={errorClass}>{errors.ledgerNumber.message}</p>}
          </div>

          {/* الملاحظات */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات</label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <textarea {...field} rows={2} placeholder="أضف ملاحظاتك هنا..." className={cn(inputClass, "resize-none")} />
              )}
            />
          </div>
        </div>

        {/* ملخص الرسوم */}
        <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center">
          <span className="text-foreground font-semibold">المبلغ المستحق للدفع</span>
          <span className="text-2xl font-black text-primary">{(amount || 0).toFixed(2)} ₪</span>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => onBack(getValues())} // إرسال القيم الحالية عند الرجوع
            className="flex-1 py-3 rounded-xl border-2 border-border font-semibold hover:bg-muted transition-all"
          >
            رجوع
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-grow-[2] py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-card hover:shadow-elevated transition-all"
          >
            <Save className="w-5 h-5" />
            {loading ? "جاري الحفظ..." : "حفظ الاشتراك"}
          </button>
        </div>
      </form>
    </div>
  );
}