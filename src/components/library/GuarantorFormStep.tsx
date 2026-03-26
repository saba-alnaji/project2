import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const guarantorSchema = z.object({
  national_id: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "أرقام فقط"),
  first_name: z.string().min(1, "الاسم الأول مطلوب"),
  father_name: z.string().min(1, "اسم الأب مطلوب"),
  grandfather_name: z.string().min(1, "اسم الجد مطلوب"),
  last_name: z.string().min(1, "اسم العائلة مطلوب"),
  first_name_en: z.string().min(1, "الاسم بالإنجليزي مطلوب").regex(/^[A-Za-z\s]+$/, "أحرف إنجليزية فقط"),
  last_name_en: z.string().min(1, "الاسم بالإنجليزي مطلوب").regex(/^[A-Za-z\s]+$/, "أحرف إنجليزية فقط"),
  job: z.string().min(1, "الوظيفة مطلوبة"),
  address_street: z.string().min(1, "الشارع مطلوب"),
  address_town: z.string().min(1, "البلدة/القرية مطلوبة"),
  address_neighborhood: z.string().min(1, "الحي مطلوب"),
  mobile_numbers: z.array(z.string()).min(1, "أدخل رقم جوال واحد على الأقل"),
});

type GuarantorFormData = z.infer<typeof guarantorSchema>;

interface Props {
  initialData?: Partial<GuarantorFormData> & Record<string, any>;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function GuarantorFormStep({ initialData, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    mode: "onTouched",
    defaultValues: {
      national_id: initialData?.national_id || "",
      first_name: initialData?.first_name || "",
      father_name: initialData?.father_name || "",
      grandfather_name: initialData?.grandfather_name || "",
      last_name: initialData?.last_name || "",
      first_name_en: initialData?.first_name_en || "",
      last_name_en: initialData?.last_name_en || "",
      job: initialData?.job || "",
      address_street: initialData?.address_street || "",
      address_town: initialData?.address_town || "",
      address_neighborhood: initialData?.address_neighborhood || "",
      mobile_numbers: initialData?.mobile_numbers?.length ? initialData.mobile_numbers : [""],
    },
  });

  const mobile_numbers = watch("mobile_numbers") ?? [];

  const updateMobile = (index: number, val: string) => {
    const arr = [...(getValues("mobile_numbers") ?? [])];
    arr[index] = val;
    setValue("mobile_numbers", arr);
  };

  const inputClass = (name: keyof GuarantorFormData) =>
    cn(
      "w-full px-4 py-3 rounded-xl border-2 text-base bg-card transition-all focus:outline-none focus:border-primary",
      errors[name] ? "border-destructive" : "border-border"
    );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">بيانات الكفيل الجديد</h2>
        <p className="text-muted-foreground">يرجى تعبئة كافة الحقول المطلوبة *</p>
      </div>

      <form onSubmit={handleSubmit((data) => onNext({ ...data, isNew: true }))}>
        <div className="max-w-2xl mx-auto space-y-5">
          {/* رقم الهوية */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">رقم الهوية *</label>
            <input {...register("national_id")} className={inputClass("national_id")} dir="ltr" placeholder="أدخل رقم الهوية" />
            {errors.national_id && <p className="text-destructive text-xs mt-1">{errors.national_id.message}</p>}
          </div>

          {/* الوظيفة */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الوظيفة *</label>
            <input {...register("job")} className={inputClass("job")} placeholder="أدخل الوظيفة" />
            {errors.job && <p className="text-destructive text-xs mt-1">{errors.job.message}</p>}
          </div>

          {/* الاسم بالعربي */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الاسم بالعربي *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input {...register("first_name")} className={inputClass("first_name")} placeholder="الاسم الأول" />
              <input {...register("father_name")} className={inputClass("father_name")} placeholder="اسم الأب" />
              <input {...register("grandfather_name")} className={inputClass("grandfather_name")} placeholder="اسم الجد" />
              <input {...register("last_name")} className={inputClass("last_name")} placeholder="اسم العائلة" />
            </div>
          </div>

          {/* الاسم بالإنجليزي */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">الاسم بالإنجليزي *</label>
            <div className="grid grid-cols-2 gap-2">
              <input {...register("first_name_en")} className={inputClass("first_name_en")} dir="ltr" placeholder="First Name" />
              <input {...register("last_name_en")} className={inputClass("last_name_en")} dir="ltr" placeholder="Last Name" />
            </div>
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">العنوان بالتفصيل *</label>
            <div className="grid grid-cols-3 gap-2">
              <input {...register("address_street")} className={inputClass("address_street")} placeholder="الشارع" />
              <input {...register("address_town")} className={inputClass("address_town")} placeholder="البلدة/القرية" />
              <input {...register("address_neighborhood")} className={inputClass("address_neighborhood")} placeholder="الحي" />
            </div>
          </div>

          {/* الجوال */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">أرقام الجوال *</label>
            <div className="space-y-2">
              {mobile_numbers.map((_, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={mobile_numbers[i] || ""}
                    onChange={(e) => updateMobile(i, e.target.value)}
                    className={inputClass("mobile_numbers" as any)}
                    dir="ltr"
                    placeholder="05xxxxxxxx"
                  />
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setValue("mobile_numbers", mobile_numbers.filter((_, idx) => idx !== i))}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setValue("mobile_numbers", [...mobile_numbers, ""])}
                className="text-primary text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> إضافة رقم
              </button>
            </div>
          </div>
        </div>

        {/* الأزرار */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-xl border-2 border-border text-foreground font-semibold flex items-center gap-2 hover:bg-muted transition-all duration-200"
          >
            <ArrowRight className="w-5 h-5" />
            السابق
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 shadow-elevated hover:shadow-accent transition-all duration-200"
          >
            المتابعة للاشتراك
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
