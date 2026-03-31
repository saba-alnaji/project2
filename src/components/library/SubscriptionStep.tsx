import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCheck, Save, ArrowRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// ================= Schema =================
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
  onBack: (currentValues: SubscriptionFormData) => void;
  loading: boolean;
  initialData?: SubscriptionFormData | null;
}

// Helper لزيادة سنة
const calculateEndDate = (startDateStr: string) => {
  if (!startDateStr) return "";
  const date = new Date(startDateStr);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
};

const today = new Date().toISOString().split("T")[0];

export default function SubscriptionStep({ onSubmit, onBack, loading, initialData }: SubscriptionStepProps) {
  const [classifications, setClassifications] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: initialData || {
      subscriptionType: "مكتبة عامة",
      memberClassificationId: 1,
      startDate: today,
      endDate: calculateEndDate(today),
      amount: 35,
      paymentMethodId: 1,
      receiptNumber: "",
      ledgerNumber: "",
      note: "",
    },
  });

  const categoryId = watch("memberClassificationId");
  const amount = watch("amount");
  const watchedStartDate = watch("startDate");

  // جلب البيانات الأساسية من السيرفر
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [classRes, paymentRes] = await Promise.all([
          axios.get("https://localhost:8080/api/MemberClassification", { headers }),
          axios.get("https://localhost:8080/api/PaymentMethod", { headers })
        ]);
        setClassifications(classRes.data);
        setPaymentMethods(paymentRes.data);
      } catch (error) {
        console.error("Error fetching subscription meta:", error);
      }
    };
    fetchMetaData();
  }, []);

  // تحديث السعر تلقائياً بناءً على التصنيف
  useEffect(() => {
    if (classifications.length > 0) {
      const selectedClass = classifications.find(
        (c) => Number(c.memberClassificationID) === Number(categoryId)
      );
      if (selectedClass) {
        const name = selectedClass.memberClassificationName;
        // منطق الأسعار الخاص بك
        if (name === "طالب") setValue("amount", 25);
        else if (name === "شخص") setValue("amount", 35);
        else if (name === "موظف بلدية") setValue("amount", 0);
      }
    }
  }, [categoryId, classifications, setValue]);

  // تحديث تاريخ النهاية عند تغيير البداية
  useEffect(() => {
    if (watchedStartDate) {
      const nextYear = calculateEndDate(watchedStartDate);
      setValue("endDate", nextYear, { shouldValidate: true });
    }
  }, [watchedStartDate, setValue]);

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary"
  );

  const labelClass = "block text-sm font-semibold text-foreground mb-2";
  const errorClass = "text-destructive text-xs mt-1 font-medium";

return (
  <div className="animate-fade-in w-full max-w-full mx-auto">
    {/* الرأس - Header */}
    <div className="text-center mb-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك المالي</h2>
      <p className="text-muted-foreground text-sm">أدخل بيانات التحصيل وتاريخ الصلاحية</p>
    </div>

    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* نوع الاشتراك */}
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
        </div>

        {/* تصنيف المشترك */}
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
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                {classifications.length > 0 ? (
                  classifications.map((c) => (
                    <option key={c.memberClassificationID} value={c.memberClassificationID}>
                      {c.memberClassificationName}
                    </option>
                  ))
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₪</span>
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
                className={inputClass}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((m) => (
                    <option key={m.paymentMethodID} value={m.paymentMethodID}>
                      {m.paymentMethodName}
                    </option>
                  ))
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
            )}
          />
        </div>

        {/* تاريخ البداية */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            تاريخ بداية الاشتراك <span className="text-destructive">*</span>
          </label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <input type="date" {...field} className={inputClass} dir="ltr" min={today} />
            )}
          />
        </div>

        {/* تاريخ النهاية */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            تاريخ نهاية الاشتراك (تلقائي) <span className="text-destructive">*</span>
          </label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                readOnly
                className={cn(inputClass, "bg-muted cursor-not-allowed opacity-80")}
                dir="ltr"
              />
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
          <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات إضافية</label>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <textarea {...field} rows={2} placeholder="أضف ملاحظاتك هنا..." className={cn(inputClass, "resize-none")} />
            )}
          />
        </div>
      </div>

      {/* ملخص المبلغ - Total Summary */}
      <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center shadow-sm">
        <span className="text-foreground font-semibold">المبلغ المستحق للدفع</span>
        <span className="text-2xl font-black text-primary">{(amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} ₪</span>
      </div>

      {/* أزرار التحكم - Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => onBack(getValues())}
              className="px-12 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all"
        >
          السابق
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-card hover:shadow-elevated transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> حفظ وإنهاء الاشتراك
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);
}

// أيقونة لودر بسيطة في حال لم تكن موجودة
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);