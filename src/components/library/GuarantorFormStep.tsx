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
  onBack: (currentValues?: any) => void;
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

  const removeMobile = (index: number) => {
    const arr = mobile_numbers.filter((_, idx) => idx !== index);
    setValue("mobile_numbers", arr);
  };

  const addMobile = () => {
    setValue("mobile_numbers", [...mobile_numbers, ""]);
  };

  const inputClass = (name: keyof GuarantorFormData) =>
    cn(
      "w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card",
      errors[name] ? "border-destructive" : "border-border"
    );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">بيانات الكفيل الجديد</h2>
        <p className="text-muted-foreground text-sm">يرجى تعبئة كافة الحقول المطلوبة <span className="text-destructive">*</span></p>
      </div>

      <form onSubmit={handleSubmit((data) => onNext({ ...data, isNew: true }))}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          
          {/* رقم الهوية والوظيفة */}
          <div>
            <label className="font-semibold mb-2 block">رقم الهوية <span className="text-destructive">*</span></label>
            <input {...register("national_id")} className={inputClass("national_id")} dir="ltr" placeholder="أدخل رقم الهوية" />
            {errors.national_id && <p className="text-destructive text-[11px] mt-1">{errors.national_id.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">الوظيفة <span className="text-destructive">*</span></label>
            <input {...register("job")} className={inputClass("job")} placeholder="أدخل الوظيفة" />
            {errors.job && <p className="text-destructive text-[11px] mt-1">{errors.job.message}</p>}
          </div>

          {/* فراغ للمحافظة على التوازن إذا لزم الأمر أو يمكن ترك الحقل الثالث فارغاً */}
          <div className="hidden lg:block"></div>

          {/* الاسم بالعربي */}
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالعربي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <input placeholder="الأول" {...register("first_name")} className={inputClass("first_name")} />
                {errors.first_name && <p className="text-destructive text-[10px] mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <input placeholder="الأب" {...register("father_name")} className={inputClass("father_name")} />
                {errors.father_name && <p className="text-destructive text-[10px] mt-1">{errors.father_name.message}</p>}
              </div>
              <div>
                <input placeholder="الجد" {...register("grandfather_name")} className={inputClass("grandfather_name")} />
                {errors.grandfather_name && <p className="text-destructive text-[10px] mt-1">{errors.grandfather_name.message}</p>}
              </div>
              <div>
                <input placeholder="العائلة" {...register("last_name")} className={inputClass("last_name")} />
                {errors.last_name && <p className="text-destructive text-[10px] mt-1">{errors.last_name.message}</p>}
              </div>
            </div>
          </div>

          {/* الاسم بالإنجليزي */}
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالإنجليزي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input placeholder="First Name" {...register("first_name_en")} className={inputClass("first_name_en")} dir="ltr" />
                {errors.first_name_en && <p className="text-destructive text-[10px] mt-1">{errors.first_name_en.message}</p>}
              </div>
              <div>
                <input placeholder="Last Name" {...register("last_name_en")} className={inputClass("last_name_en")} dir="ltr" />
                {errors.last_name_en && <p className="text-destructive text-[10px] mt-1">{errors.last_name_en.message}</p>}
              </div>
            </div>
          </div>

          {/* العنوان بالتفصيل */}
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">العنوان بالتفصيل <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input placeholder="الشارع" {...register("address_street")} className={inputClass("address_street")} />
                {errors.address_street && <p className="text-destructive text-[10px] mt-1">{errors.address_street.message}</p>}
              </div>
              <div>
                <input placeholder="البلدة" {...register("address_town")} className={inputClass("address_town")} />
                {errors.address_town && <p className="text-destructive text-[10px] mt-1">{errors.address_town.message}</p>}
              </div>
              <div>
                <input placeholder="الحي" {...register("address_neighborhood")} className={inputClass("address_neighborhood")} />
                {errors.address_neighborhood && <p className="text-destructive text-[10px] mt-1">{errors.address_neighborhood.message}</p>}
              </div>
            </div>
          </div>

          {/* أرقام الجوال */}
          <div className="lg:col-span-2">
            <label className="font-semibold mb-2 block">أرقام الجوال </label>
            <div className="space-y-2">
              {mobile_numbers.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    value={mobile_numbers[index]} 
                    onChange={(e) => updateMobile(index, e.target.value)} 
                    className={inputClass("mobile_numbers" as any)} 
                    dir="ltr" 
                    placeholder="05xxxxxxxx"
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => removeMobile(index)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-colors">
                      <X size={16}/>
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addMobile} 
                className="text-primary text-xs flex items-center gap-1 hover:underline mt-1"
              >
                <Plus size={14}/> إضافة رقم
              </button>
              {errors.mobile_numbers && <p className="text-destructive text-[11px] mt-1">{errors.mobile_numbers.message}</p>}
            </div>
          </div>
        </div>

        {/* أزرار التحكم - متناسقة مع التصميم العام */}
        <div className="flex justify-between mt-8 pt-6">
          <button
            type="button"
            onClick={() => onBack(getValues())}
            className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 shadow-elevated hover:shadow-accent transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            السابق
          </button>
          <button
            type="submit"
            className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 shadow-elevated hover:shadow-accent transition-all"
          >
            المتابعة
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}