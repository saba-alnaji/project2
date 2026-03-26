import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const cities = [
  { id: 1, name: "أريحا والأغوار" }, { id: 2, name: "بيت لحم" },
  { id: 3, name: "الخليل" }, { id: 4, name: "القدس" },
  { id: 5, name: "دير البلح" }, { id: 6, name: "رفح" },
  { id: 7, name: "سلفيت" }, { id: 8, name: "شمال غزة" },
  { id: 9, name: "طوباس" }, { id: 10, name: "طولكرم" },
  { id: 11, name: "غزة" }, { id: 12, name: "قلقيلية" },
  { id: 13, name: "خان يونس" }, { id: 14, name: "نابلس" },
  { id: 15, name: "جنين" }, { id: 16, name: "رام الله والبيرة" }
];

const subscriberSchema = z.object({
  subscriber_number: z.string().min(1, "رقم المشترك مطلوب"),
  first_name: z.string().min(1, "الاسم الأول مطلوب"),
  father_name: z.string().min(1, "اسم الأب مطلوب"),
  grandfather_name: z.string().min(1, "اسم الجد مطلوب"),
  last_name: z.string().min(1, "اسم العائلة مطلوب"),
  first_name_en: z.string().min(1, "الاسم بالإنجليزي مطلوب").regex(/^[A-Za-z\s]+$/, "أحرف إنجليزية فقط"),
  last_name_en: z.string().min(1, "الاسم بالإنجليزي مطلوب").regex(/^[A-Za-z\s]+$/, "أحرف إنجليزية فقط"),
  birth_date: z.string().min(1, "تاريخ الميلاد مطلوب"),
  gender: z.string().min(1, "يرجى اختيار الجنس"),
  national_id: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "أرقام فقط"),
  cityId: z.string().min(1, "يرجى اختيار المحافظة"), 
  job: z.string().min(1, "الوظيفة مطلوبة"),
  address_street: z.string().min(1, "الشارع مطلوب"),
  address_town: z.string().min(1, "البلدة/القرية مطلوبة"),
  address_neighborhood: z.string().min(1, "الحي مطلوب"),
  mobile_numbers: z.array(z.string()).min(1, "أدخل رقم جوال واحد على الأقل"),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;

interface SubscriberStepProps {
  onNext: (data: SubscriberFormData) => void;
  initialData?: SubscriberFormData | null;
}

export default function SubscriberStep({ onNext, initialData }: SubscriberStepProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } =
    useForm<SubscriberFormData>({
      resolver: zodResolver(subscriberSchema),
      mode: "onTouched",
      defaultValues: initialData || {
        mobile_numbers: [""],
        cityId: "",
      }
    });

  const mobile_numbers = watch("mobile_numbers");
  const addMobile = () => setValue("mobile_numbers", [...getValues("mobile_numbers"), ""]);
  const removeMobile = (index: number) => setValue("mobile_numbers", getValues("mobile_numbers").filter((_, i) => i !== index));
  const updateMobile = (index: number, value: string) => {
    const updated = [...getValues("mobile_numbers")];
    updated[index] = value;
    setValue("mobile_numbers", updated);
  };

  const onSubmit = (data: SubscriberFormData) => {
    onNext(data); // فقط نمرر البيانات للأب بدون إرسال API هنا
  };

  const inputClass = (fieldName: keyof SubscriberFormData) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card",
    errors[fieldName] ? "border-destructive" : "border-border"
  );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">بيانات المشترك</h2>
        <p className="text-muted-foreground text-sm">تأكد من تعبئة كافة الحقول المطلوبة <span className="text-destructive">*</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          
          <div>
            <label className="font-semibold mb-2 block">رقم المشترك <span className="text-destructive">*</span></label>
            <input {...register("subscriber_number")} className={inputClass("subscriber_number")} dir="ltr" />
            {errors.subscriber_number && <p className="text-destructive text-[11px] mt-1">{errors.subscriber_number.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">رقم الهوية <span className="text-destructive">*</span></label>
            <input {...register("national_id")} className={inputClass("national_id")} dir="ltr" />
            {errors.national_id && <p className="text-destructive text-[11px] mt-1">{errors.national_id.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">المحافظة <span className="text-destructive">*</span></label>
            <select {...register("cityId")} className={inputClass("cityId")}>
              <option value="">اختر المحافظة</option>
              {cities.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
            </select>
            {errors.cityId && <p className="text-destructive text-[11px] mt-1">{errors.cityId.message}</p>}
          </div>
                    
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالعربي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><input placeholder="الأول" {...register("first_name")} className={inputClass("first_name")} />{errors.first_name && <p className="text-destructive text-[10px]">{errors.first_name.message}</p>}</div>
              <div><input placeholder="الأب" {...register("father_name")} className={inputClass("father_name")} />{errors.father_name && <p className="text-destructive text-[10px]">{errors.father_name.message}</p>}</div>
              <div><input placeholder="الجد" {...register("grandfather_name")} className={inputClass("grandfather_name")} />{errors.grandfather_name && <p className="text-destructive text-[10px]">{errors.grandfather_name.message}</p>}</div>
              <div><input placeholder="العائلة" {...register("last_name")} className={inputClass("last_name")} />{errors.last_name && <p className="text-destructive text-[10px]">{errors.last_name.message}</p>}</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالإنجليزي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <div><input placeholder="First Name" {...register("first_name_en")} className={inputClass("first_name_en")} dir="ltr" />{errors.first_name_en && <p className="text-destructive text-[10px]">{errors.first_name_en.message}</p>}</div>
              <div><input placeholder="Last Name" {...register("last_name_en")} className={inputClass("last_name_en")} dir="ltr" />{errors.last_name_en && <p className="text-destructive text-[10px]">{errors.last_name_en.message}</p>}</div>
            </div>
          </div>

          <div>
            <label className="font-semibold mb-2 block">تاريخ الميلاد <span className="text-destructive">*</span></label>
            <input type="date" {...register("birth_date")} className={inputClass("birth_date")} />
            {errors.birth_date && <p className="text-destructive text-[11px] mt-1">{errors.birth_date.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">الجنس <span className="text-destructive">*</span></label>
            <select {...register("gender")} className={inputClass("gender")}>
              <option value="">اختر</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            {errors.gender && <p className="text-destructive text-[11px] mt-1">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">الوظيفة <span className="text-destructive">*</span></label>
            <input {...register("job")} className={inputClass("job")} />
            {errors.job && <p className="text-destructive text-[11px] mt-1">{errors.job.message}</p>}
          </div>

          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">العنوان بالتفصيل <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><input placeholder="الشارع" {...register("address_street")} className={inputClass("address_street")} />{errors.address_street && <p className="text-destructive text-[10px]">{errors.address_street.message}</p>}</div>
              <div><input placeholder="البلدة" {...register("address_town")} className={inputClass("address_town")} />{errors.address_town && <p className="text-destructive text-[10px]">{errors.address_town.message}</p>}</div>
              <div><input placeholder="الحي" {...register("address_neighborhood")} className={inputClass("address_neighborhood")} />{errors.address_neighborhood && <p className="text-destructive text-[10px]">{errors.address_neighborhood.message}</p>}</div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="font-semibold mb-2 block">أرقام الجوال</label>
            <div className="space-y-2">
              {mobile_numbers.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <input value={mobile_numbers[index]} onChange={(e) => updateMobile(index, e.target.value)} className={inputClass("mobile_numbers" as any)} dir="ltr" />
                  {index > 0 && <button type="button" onClick={() => removeMobile(index)} className="text-destructive p-1"><X size={16}/></button>}
                </div>
              ))}
              <button type="button" onClick={addMobile} className="text-primary text-xs flex items-center gap-1"><Plus size={14}/> إضافة رقم</button>
            </div>
          </div>

        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" className="px-10 py-3 rounded-xl gradient-primary text-white font-bold">التالي</button>
        </div>
      </form>
    </div>
  );
}