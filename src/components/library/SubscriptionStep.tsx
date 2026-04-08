import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Wallet, Loader2 } from "lucide-react"; // تم التأكد من استيراد Loader2
import { cn } from "@/lib/utils";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

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
  onSubmit: (data: SubscriptionFormData) => Promise<any>;
  onBack: (currentValues: SubscriptionFormData) => void;
  loading: boolean;
  initialData?: SubscriptionFormData | null;
  resetForm: () => void;
  isReadOnly?: boolean;
}

const calculateEndDate = (startDateStr: string) => {
  if (!startDateStr) return "";
  const date = new Date(startDateStr);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
};

const today = new Date().toISOString().split("T")[0];

export default function SubscriptionStep({
  onSubmit,
  onBack,
  loading,
  initialData,
  resetForm,
  isReadOnly = false
}: SubscriptionStepProps) {
  const [classifications, setClassifications] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<SubscriptionFormData>({
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

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [classRes, paymentRes] = await Promise.all([
          axios.get("/api/MemberClassification", { headers }),
          axios.get("/api/PaymentMethod", { headers })
        ]);
        setClassifications(classRes.data);
        setPaymentMethods(paymentRes.data);
      } catch (error: any) {
        console.error("Error fetching subscription meta:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    };
    fetchMetaData();
  }, []);

  // تعديل: السعر يتحدث تلقائياً فقط إذا لم نكن في وضع المعاينة
  useEffect(() => {
    if (classifications.length > 0 && !isReadOnly) {
      const selectedClass = classifications.find(
        (c) => Number(c.memberClassificationID) === Number(categoryId)
      );
      if (selectedClass) {
        const name = selectedClass.memberClassificationName;
        if (name === "طالب") setValue("amount", 25);
        else if (name === "شخص") setValue("amount", 35);
        else if (name === "موظف بلدية") setValue("amount", 0);
      }
    }
  }, [categoryId, classifications, setValue, isReadOnly]);

  useEffect(() => {
    if (watchedStartDate && !isReadOnly) {
      const nextYear = calculateEndDate(watchedStartDate);
      setValue("endDate", nextYear, { shouldValidate: true });
    }
  }, [watchedStartDate, setValue, isReadOnly]);

  const showUserCredentials = (userName: string, password: string) => {
    MySwal.fire({
      title: <span className="text-primary font-bold">تم حفظ الاشتراك بنجاح</span>,
      html: (
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-primary/20 text-right" dir="rtl">
          <p className="text-sm text-muted-foreground mb-3">بيانات دخول المستخدم الجديد:</p>
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-white rounded-lg shadow-sm">
              <span className="font-bold">اسم المستخدم:</span>
              <span className="font-mono text-primary select-all">{userName}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-lg shadow-sm">
              <span className="font-bold">كلمة المرور:</span>
              <span className="font-mono text-primary select-all">{password}</span>
            </div>
          </div>
        </div>
      ),
      icon: "success",
      confirmButtonText: " موافق",
      confirmButtonColor: "#3b82f6",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: { popup: 'rounded-[2rem]', confirmButton: 'px-8 py-2 rounded-xl' }
    }).then((result) => {
      if (result.isConfirmed) resetForm();
    });
  };

  const handleFormSubmit = async (data: SubscriptionFormData) => {
    try {
      const result: any = await onSubmit(data);
      if (result && result.userName) {
        showUserCredentials(result.userName, result.password);
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary",
    isReadOnly && "bg-slate-50 border-slate-200 cursor-not-allowed opacity-90"
  );

  const errorClass = "text-destructive text-xs mt-1 font-medium";

  return (
    <div className="animate-fade-in w-full max-w-full mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك المالي</h2>
        <p className="text-muted-foreground text-sm">{isReadOnly ? "معاينة بيانات الاشتراك" : "أدخل بيانات التحصيل وتاريخ الصلاحية"}</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* نوع الاشتراك */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">نوع الاشتراك <span className="text-destructive">*</span></label>
            <Controller
              name="subscriptionType"
              control={control}
              render={({ field }) => (
                <select {...field} disabled={isReadOnly} className={inputClass}>
                  <option value="مكتبة عامة">مكتبة عامة</option>
                  <option value="مكتبة أطفال">مكتبة أطفال</option>
                </select>
              )}
            />
          </div>

          {/* تصنيف المشترك */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك <span className="text-destructive">*</span></label>
            <Controller
              name="memberClassificationId"
              control={control}
              render={({ field }) => (
                <select
                  disabled={isReadOnly}
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
            <label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل)<span className="text-destructive">*</span></label>
            <div className="relative">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    disabled={isReadOnly}
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
            <label className="block text-sm font-semibold text-foreground mb-2">طريقة الدفع <span className="text-destructive">*</span></label>
            <Controller
              name="paymentMethodId"
              control={control}
              render={({ field }) => (
                <select
                  disabled={isReadOnly}
                  className={inputClass}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {paymentMethods.map((m) => (
                    <option key={m.paymentMethodID} value={m.paymentMethodID}>
                      {m.paymentMethodName}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* تاريخ البداية */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">تاريخ بداية الاشتراك (تلقائي)</label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed opacity-80")} dir="ltr" />
              )}
            />
          </div>

          {/* تاريخ النهاية */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">تاريخ نهاية الاشتراك (تلقائي)</label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed opacity-80")} dir="ltr" />
              )}
            />
          </div>

          {/* رقم الوصل */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل <span className="text-destructive">*</span></label>
            <Controller
              name="receiptNumber"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} disabled={isReadOnly} placeholder="أدخل رقم الوصل" className={inputClass} dir="ltr" />
              )}
            />
            {errors.receiptNumber && <p className={errorClass}>{errors.receiptNumber.message}</p>}
          </div>

          {/* رقم الدفتر */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر <span className="text-destructive">*</span></label>
            <Controller
              name="ledgerNumber"
              control={control}
              render={({ field }) => (
                <input type="text" {...field} disabled={isReadOnly} placeholder="أدخل رقم الدفتر" className={inputClass} dir="ltr" />
              )}
            />
            {errors.ledgerNumber && <p className={errorClass}>{errors.ledgerNumber.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات إضافية</label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <textarea {...field} disabled={isReadOnly} rows={2} placeholder="أضف ملاحظاتك هنا..." className={cn(inputClass, "resize-none")} />
              )}
            />
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center shadow-sm">
          <span className="text-foreground font-semibold">المبلغ المستحق للدفع</span>
          <span className="text-2xl font-black text-primary">{(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ₪</span>
        </div>

        <div className="mt-6">
  {!isReadOnly && (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onBack(getValues())}
        className="px-12 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all border border-slate-200"
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
  )}
</div>
      </form>
    </div>
  );
}