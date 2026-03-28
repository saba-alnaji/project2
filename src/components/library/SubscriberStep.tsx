import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";

const subscriberSchema = z.object({
  memberNumber: z.string().min(1, "رقم المشترك مطلوب"),
  idnumber: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "أرقام فقط"),
  cityId: z.string().min(1, "يرجى اختيار المحافظة"),
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  fatherName: z.string().min(1, "اسم الأب مطلوب"),
  grandfatherName: z.string().min(1, "اسم الجد مطلوب"),
  familyName: z.string().min(1, "اسم العائلة مطلوب"),
  gender: z.string().min(1, "يرجى اختيار الجنس"),
  job: z.string().min(1, "الوظيفة مطلوبة"),
  birthDate: z.string().min(1, "تاريخ الميلاد مطلوب"),
  firstNameEn: z.string().optional(),
  familyNameEn: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  neighborhood: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional(),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;

interface SubscriberStepProps {
  onNext: (data: SubscriberFormData) => void;
  initialData?: SubscriberFormData | null;
}

export default function SubscriberStep({ onNext, initialData }: SubscriberStepProps) {
  const [apiCities, setApiCities] = useState<{ id: number, name: string }[]>([]);
  // 1. استخراج reset من useForm
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } =
    useForm<SubscriberFormData>({
      resolver: zodResolver(subscriberSchema),
      mode: "onTouched",
      // نبقي على الـ defaultValues كما هي للتحميل الأول
      defaultValues: initialData || {
        phoneNumbers: [""],
        cityId: "",
      }
    });

  // 2. هذا هو الجزء الأهم: تحديث البيانات عند تغير initialData (عند الرجوع للخلف)
  // 2. تحديث البيانات عند تغير initialData أو وصول المدن
  useEffect(() => {
    // لا تقم بعمل reset إلا إذا كانت هناك بيانات أولية (عند الرجوع للخلف)
    if (initialData) {
      const formattedInitialData = {
        ...initialData,
        cityId: initialData.cityId?.toString() || ""
      };

      // الحل السحري: نستخدم setTimeout بسيط لضمان أن الـ DOM 
      // قد انتهى من رندر قائمة المدن قبل ضبط القيمة
      const timer = setTimeout(() => {
        reset(formattedInitialData);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialData, reset, apiCities]); // أضفنا apiCities هنا كمراقب

  // 3. دالة جلب المدن (تبقينها كما هي)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get("https://localhost:8080/api/City");
        setApiCities(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("خطأ في جلب المدن:", error);
        setApiCities([]);
      }
    };
    fetchCities();
  }, []);



  // تأمين مصفوفة أرقام الجوال
  const mobile_numbers = watch("phoneNumbers") || [""];

  const addMobile = () => setValue("phoneNumbers", [...mobile_numbers, ""]);
  const removeMobile = (index: number) => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index));
  const updateMobile = (index: number, value: string) => {
    const updated = [...mobile_numbers];
    updated[index] = value;
    setValue("phoneNumbers", updated);
  };

  const onSubmit = (data: SubscriberFormData) => {
    const formattedData = {
      ...data,
      cityId: data.cityId ? parseInt(data.cityId, 10) : null,
      phoneNumbers: data.phoneNumbers?.filter(num => num && num.trim() !== "")
    };
    console.log("البيانات الجاهزة للإرسال:", formattedData);
    onNext(formattedData as any);
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
            <input {...register("memberNumber")} className={inputClass("memberNumber")} dir="ltr" />
            {errors.memberNumber && <p className="text-destructive text-[11px] mt-1">{errors.memberNumber.message}</p>}
          </div>

          <div>
            <label className="font-semibold mb-2 block">رقم الهوية <span className="text-destructive">*</span></label>
            <input {...register("idnumber")} className={inputClass("idnumber")} dir="ltr" />
            {errors.idnumber && <p className="text-destructive text-[11px] mt-1">{errors.idnumber.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-2 block text-sm">
              المحافظة <span className="text-destructive">*</span>
            </label>

            <select
              {...register("cityId")}
              className={inputClass("cityId")}

              value={watch("cityId")?.toString() || ""}
            >
              <option value="">اختر المحافظة</option>
              {apiCities && apiCities.length > 0 ? (
                apiCities.map((city: any) => {
                  const cityId = (city?.cityId ?? city?.cityID ?? city?.id)?.toString();
                  const cityName = city?.cityName ?? city?.CityName ?? city?.name;

                  return (
                    <option key={cityId} value={cityId}>
                      {cityName}
                    </option>
                  );
                })
              ) : (
                <option disabled>جاري تحميل المحافظات...</option>
              )}
            </select>

            {errors.cityId && (
              <p className="text-destructive text-[11px] mt-1">
                {errors.cityId.message as string}
              </p>
            )}
          </div>
          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالعربي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><input placeholder="الأول" {...register("firstName")} className={inputClass("firstName")} />{errors.firstName && <p className="text-destructive text-[10px]">{errors.firstName.message}</p>}</div>
              <div><input placeholder="الأب" {...register("fatherName")} className={inputClass("fatherName")} />{errors.fatherName && <p className="text-destructive text-[10px]">{errors.fatherName.message}</p>}</div>
              <div><input placeholder="الجد" {...register("grandfatherName")} className={inputClass("grandfatherName")} />{errors.grandfatherName && <p className="text-destructive text-[10px]">{errors.grandfatherName.message}</p>}</div>
              <div><input placeholder="العائلة" {...register("familyName")} className={inputClass("familyName")} />{errors.familyName && <p className="text-destructive text-[10px]">{errors.familyName.message}</p>}</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="font-semibold mb-2 block">الاسم بالإنجليزي </label>
            <div className="grid grid-cols-2 gap-3">
              <div><input placeholder="First Name" {...register("firstNameEn")} className={inputClass("firstNameEn")} dir="ltr" /></div>
              <div><input placeholder="Last Name" {...register("familyNameEn")} className={inputClass("familyNameEn")} dir="ltr" /></div>
            </div>
          </div>

          <div>
            <label className="font-semibold mb-2 block">تاريخ الميلاد <span className="text-destructive">*</span></label>
            <input type="date" {...register("birthDate")} className={inputClass("birthDate")} />
            {errors.birthDate && <p className="text-destructive text-[11px] mt-1">{errors.birthDate.message}</p>}
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
            <label className="font-semibold mb-2 block">العنوان بالتفصيل</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><input placeholder="الشارع" {...register("street")} className={inputClass("street")} /></div>
              <div><input placeholder="البلدة" {...register("village")} className={inputClass("village")} /></div>
              <div><input placeholder="الحي" {...register("neighborhood")} className={inputClass("neighborhood")} /></div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="font-semibold mb-2 block">أرقام الجوال </label>
            <div className="space-y-2">
              {mobile_numbers.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={mobile_numbers[index] || ""}
                    onChange={(e) => updateMobile(index, e.target.value)}
                    className={cn("w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card border-border")}
                    dir="ltr"
                    placeholder="05xxxxxxxx"
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => removeMobile(index)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMobile}
                className="text-primary text-xs flex items-center gap-1 hover:underline mt-1"
              >
                <Plus size={14} /> إضافة رقم
              </button>
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