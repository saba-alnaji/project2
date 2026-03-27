import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const guarantorSchema = z.object({
  idnumber: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "أرقام فقط"),
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  fatherName: z.string().min(1, "اسم الأب مطلوب"),
  grandfatherName: z.string().min(1, "اسم الجد مطلوب"),
  familyName: z.string().min(1, "اسم العائلة مطلوب"),
  first_name_en: z.string().optional(),
  last_name_en: z.string().optional(),
  job: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  neighborhood: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional(),
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
      idnumber: initialData?.idnumber || "",
      firstName: initialData?.firstName || "",
      fatherName: initialData?.fatherName || "",
      grandfatherName: initialData?.grandfatherName || "",
      familyName: initialData?.familyName || "",
      first_name_en: initialData?.first_name_en || "",
      last_name_en: initialData?.last_name_en || "",
      job: initialData?.job || "",
      street: initialData?.street || "",
      village: initialData?.village || "",
      neighborhood: initialData?.neighborhood || "",
      phoneNumbers: initialData?.phoneNumbers?.length ? initialData.phoneNumbers : [""],
    },
  });

  const mobile_numbers = watch("phoneNumbers") ?? [];

  const updateMobile = (index: number, val: string) => {
    const arr = [...(getValues("phoneNumbers") ?? [])];
    arr[index] = val;
    setValue("phoneNumbers", arr);
  };

  const removeMobile = (index: number) => {
    const arr = mobile_numbers.filter((_, idx) => idx !== index);
    setValue("phoneNumbers", arr);
  };

  const addMobile = () => {
    setValue("phoneNumbers", [...mobile_numbers, ""]);
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
            <input {...register("idnumber")} className={inputClass("idnumber")} dir="ltr" placeholder="أدخل رقم الهوية" />
            {errors.idnumber && <p className="text-destructive text-[11px] mt-1">{errors.idnumber.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">الوظيفة </label>
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
                <input placeholder="الأول" {...register("firstName")} className={inputClass("firstName")} />
                {errors.firstName && <p className="text-destructive text-[10px] mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <input placeholder="الأب" {...register("fatherName")} className={inputClass("fatherName")} />
                {errors.fatherName && <p className="text-destructive text-[10px] mt-1">{errors.fatherName.message}</p>}
              </div>
              <div>
                <input placeholder="الجد" {...register("grandfatherName")} className={inputClass("grandfatherName")} />
                {errors.grandfatherName && <p className="text-destructive text-[10px] mt-1">{errors.grandfatherName.message}</p>}
              </div>
              <div>
                <input placeholder="العائلة" {...register("familyName")} className={inputClass("familyName")} />
                {errors.familyName && <p className="text-destructive text-[10px] mt-1">{errors.familyName.message}</p>}
              </div>
            </div>
          </div>

          {/* الاسم بالإنجليزي */}
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالإنجليزي </label>
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
            <label className="font-semibold mb-2 block">العنوان بالتفصيل </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input placeholder="الشارع" {...register("street")} className={inputClass("street")} />
                {errors.street && <p className="text-destructive text-[10px] mt-1">{errors.street.message}</p>}
              </div>
              <div>
                <input placeholder="البلدة" {...register("village")} className={inputClass("village")} />
                {errors.village && <p className="text-destructive text-[10px] mt-1">{errors.village.message}</p>}
              </div>
              <div>
                <input placeholder="الحي" {...register("neighborhood")} className={inputClass("neighborhood")} />
                {errors.neighborhood && <p className="text-destructive text-[10px] mt-1">{errors.neighborhood.message}</p>}
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
              {errors.phoneNumbers && <p className="text-destructive text-[11px] mt-1">{errors.phoneNumbers.message}</p>}
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