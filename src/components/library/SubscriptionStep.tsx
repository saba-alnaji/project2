import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCheck, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";



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
  onSubmit: (data: SubscriptionFormData) => void
  onBack: (currentValues: SubscriptionFormData) => void;
  loading: boolean;
  initialData?: SubscriptionFormData | null;

}

const calculateEndDate = (startDateStr: string) => {
  if (!startDateStr) return ""
  const date = new Date(startDateStr);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];

};



const today = new Date().toISOString().split("T")[0];
const oneYearLater = calculateEndDate(today);

export default function SubscriptionStep({ onSubmit, onBack, loading, initialData }: SubscriptionStepProps) {
  const [classifications, setClassifications] = useState<any[]>([])
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
  const watchedStartDate = watch("startDate");



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
        console.error("خطأ في جلب بيانات الاشتراك:", error);

      }

    };
    fetchMetaData();
  }, []);

  useEffect(() => {
    if (classifications.length > 0) {
      const selectedClass = classifications.find(
        (c) => Number(c.memberClassificationID) === Number(categoryId)
      );
      if (selectedClass) {
        const name = selectedClass.memberClassificationName;
        if (name === "طالب") {
          setValue("amount", 25);
        } else if (name === "شخص") {
          setValue("amount", 35);
        } else if (name === "موظف بلدية") {
          setValue("amount", 0);
        }
      }
    }
  }, [categoryId, classifications, setValue]);

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
                  onChange={(e) => field.onChange(Number(e.target.value))} // مهم
                >
                  {classifications.length > 0 ? (
                    classifications.map((c) => (
                      <option
                        key={c.memberClassificationID}
                        value={c.memberClassificationID}
                      >
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
            </div>
          </div>

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
                  onChange={(e) => field.onChange(Number(e.target.value))} // مهم
                >

                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((m) => (
                      <option
                        key={m.paymentMethodID}
                        value={m.paymentMethodID}
                      >
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

        <div className="mt-5 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 flex justify-between items-center">
          <span className="text-foreground font-semibold">المبلغ المستحق للدفع</span>
          <span className="text-2xl font-black text-primary">{(amount || 0).toFixed(2)} ₪</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => onBack(getValues())}
            className="flex-1 py-3 rounded-xl border-2 border-border font-semibold hover:bg-muted transition-all"
          >  رجوع
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