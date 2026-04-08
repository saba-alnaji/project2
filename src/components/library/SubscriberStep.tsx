import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";

const subscriberSchema = z.object({
  memberNumber: z.string().min(1, "رقم المشترك مطلوب").regex(/^\d+$/, "يجب إدخال أرقام فقط"),
  idnumber: z.string().length(9, "رقم الهوية يجب أن يكون 9 أرقام").regex(/^\d+$/, "يجب إدخال أرقام فقط"),
  cityId: z.string().min(1, "يرجى اختيار المحافظة"),
  firstName: z.string().min(1, "الاسم الأول مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  fatherName: z.string().min(1, "اسم الأب مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  grandfatherName: z.string().min(1, "اسم الجد مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  familyName: z.string().min(1, "اسم العائلة مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  gender: z.string().min(1, "يرجى اختيار الجنس"),
  job: z.string().min(1, "الوظيفة مطلوبة").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال الوظيفة باللغة العربية فقط"),
  birthDate: z.string().min(1, "تاريخ الميلاد مطلوب")
    .refine((date) => {
      const birth = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1 >= 10;
      }
      return age >= 10;
    }, "يجب أن يكون العمر 10 سنوات على الأقل"), firstNameEn: z.string().min(1, "الاسم الأول بالإنجليزي مطلوب").regex(/^[a-zA-Z\s]+$/, "يجب إدخال حروف إنجليزية فقط"),
  familyNameEn: z.string().min(1, "اسم العائلة بالإنجليزي مطلوب").regex(/^[a-zA-Z\s]+$/, "يجب إدخال حروف إنجليزية فقط"),
  street: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط في العنوان").optional(),
  village: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط في اسم القرية").optional(),
  neighborhood: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط في اسم الحي").optional(),
  phoneNumbers: z.array(z.string().regex(/^[0-9+\-() ]+$/, "رقم الجوال يجب أن يحتوي على أرقام ورموز فقط").min(10, "الرقم قصير جداً")).min(1, "يجب إضافة رقم جوال واحد على الأقل"),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;

interface SubscriberStepProps {
  onNext: (data: SubscriberFormData) => void;
  initialData?: SubscriberFormData | null;
}

export default function SubscriberStep({ onNext, initialData }: SubscriberStepProps) {
  const [apiCities, setApiCities] = useState<{ id: number, name: string }[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
    mode: "onTouched",
    defaultValues: initialData || { phoneNumbers: [""], cityId: "" }
  });

  const filterNumbers = (val: string) => val.replace(/[^\d]/g, "");
  const filterArabic = (val: string) => val.replace(/[^\u0621-\u064A\s]/g, "");
  const filterEnglish = (val: string) => val.replace(/[^a-zA-Z\s]/g, "");
  const filterNoEnglish = (val: string) => val.replace(/[a-zA-Z]/g, "");
  const filterPhone = (val: string) => val.replace(/[^0-9+\-() ]/g, "");

  const handleLiveChange = (name: keyof SubscriberFormData, filterFn: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterFn(e.target.value);
    setValue(name, filteredValue, { shouldValidate: true });
  };
  useEffect(() => {
    if (initialData && apiCities.length > 0) {
      reset(initialData);
    }
  }, [initialData, apiCities, reset]);
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/City", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // تأكدي من شكل البيانات الراجعة
        console.log("Cities from API:", response.data);
        setApiCities(Array.isArray(response.data) ? response.data : []);
      } catch (error: any) {
        console.error("Error fetching cities:", error);
        setApiCities([]);
      }
    };
    fetchCities();
  }, []);

  const mobile_numbers = watch("phoneNumbers") || [""];
  const addMobile = () => setValue("phoneNumbers", [...mobile_numbers, ""]);
  const removeMobile = (index: number) => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index));

  const onSubmit = (data: SubscriberFormData) => {
    onNext(data);
  };
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 10);
  const maxDateString = maxDate.toISOString().split("T")[0];
  const inputClass = (fieldName: keyof SubscriberFormData) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card",
    errors[fieldName] ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      {/* الهيدر العلوي - بسيط وأنيق */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">بيانات المشترك</h2>
        <p className="text-muted-foreground text-sm">تأكد من تعبئة كافة الحقول المطلوبة <span className="text-destructive">*</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* القسم الأول: المعلومات الأساسية - داخل بطاقة بيضاء ناعمة */}
        <div className="bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm space-y-6">
          <h3 className="text-primary font-bold border-b border-primary/10 pb-3 text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            المعلومات الأساسية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">


            <div>
              <label className="font-semibold mb-2 block">رقم المشترك <span className="text-destructive">*</span></label>
              <input {...register("memberNumber")} onChange={handleLiveChange("memberNumber", filterNumbers)} className={inputClass("memberNumber")} dir="ltr" />
              {errors.memberNumber && <p className="text-destructive text-[11px] mt-1">{errors.memberNumber.message}</p>}
            </div>
            <div>
              <label className="font-semibold mb-2 block">رقم الهوية <span className="text-destructive">*</span></label>
              <input {...register("idnumber")} onChange={handleLiveChange("idnumber", filterNumbers)} className={inputClass("idnumber")} dir="ltr" maxLength={9} />
              {errors.idnumber && <p className="text-destructive text-[11px] mt-1">{errors.idnumber.message}</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="font-semibold mb-2 block">الاسم بالعربي <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <input placeholder="الأول" {...register("firstName")} onChange={handleLiveChange("firstName", filterArabic)} className={inputClass("firstName")} />
                <input placeholder="الأب" {...register("fatherName")} onChange={handleLiveChange("fatherName", filterArabic)} className={inputClass("fatherName")} />
                <input placeholder="الجد" {...register("grandfatherName")} onChange={handleLiveChange("grandfatherName", filterArabic)} className={inputClass("grandfatherName")} />
                <input placeholder="العائلة" {...register("familyName")} onChange={handleLiveChange("familyName", filterArabic)} className={inputClass("familyName")} />
              </div>
              {(errors.firstName || errors.fatherName || errors.grandfatherName || errors.familyName) && <p className="text-destructive text-[10px] mt-1">الاسم كاملاً مطلوب بالعربي</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="font-semibold mb-2 block">الاسم بالإنجليزي <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Last Name" {...register("familyNameEn")} onChange={handleLiveChange("familyNameEn", filterEnglish)} className={inputClass("familyNameEn")} dir="ltr" />
                <input placeholder="First Name" {...register("firstNameEn")} onChange={handleLiveChange("firstNameEn", filterEnglish)} className={inputClass("firstNameEn")} dir="ltr" />

              </div>
              {(errors.firstNameEn || errors.familyNameEn) && <p className="text-destructive text-[10px] mt-1">الاسم مطلوب بالإنجليزي</p>}
            </div>

            <div>
              <label className="font-semibold mb-2 block">تاريخ الميلاد <span className="text-destructive">*</span></label>
              <input type="date" {...register("birthDate")} max={maxDateString} className={inputClass("birthDate")} />
              {errors.birthDate && <p className="text-destructive text-[11px] mt-1">{errors.birthDate.message}</p>}
            </div>

            <div>
              <label className="font-semibold mb-2 block">الجنس <span className="text-destructive">*</span></label>
              <select {...register("gender")} className={inputClass("gender")}>
                <option value="">اختر</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
              {errors.gender && <p className="text-destructive text-[11px] mt-1">{errors.gender.message}</p>}
            </div>
          </div>
        </div>

        {/* القسم الثاني: العمل والعنوان */}
        <div className="bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm space-y-6">
          <h3 className="text-primary font-bold border-b border-primary/10 pb-3 text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            العمل والعنوان
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 block text-sm">المحافظة <span className="text-destructive">*</span></label>
              <select
                {...register("cityId")}
                className={inputClass("cityId")}
              >
                <option value="">اختر المحافظة</option>
                {apiCities.map((city: any) => {
                  // هنا السحر: بنجرب كل المسميات الممكنة للـ ID
                  const cId = (city.cityId || city.cityID || city.id || city.Id)?.toString();
                  const cName = city.cityName || city.CityName || city.name || city.Name;

                  if (!cId) return null;

                  return (
                    <option key={cId} value={cId}>
                      {cName}
                    </option>
                  );
                })}
              </select>
              {errors.cityId && <p className="text-destructive text-[11px] mt-1">{errors.cityId.message}</p>}
            </div>

            <div>
              <label className="font-semibold mb-2 block">الوظيفة <span className="text-destructive">*</span></label>
              <input {...register("job")} onChange={handleLiveChange("job", filterArabic)} className={inputClass("job")} />
              {errors.job && <p className="text-destructive text-[11px] mt-1">{errors.job.message}</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="font-semibold mb-2 block">العنوان بالتفصيل</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="الشارع" {...register("street")} onChange={handleLiveChange("street", filterNoEnglish)} className={inputClass("street")} />
                <input placeholder="البلدة" {...register("village")} onChange={handleLiveChange("village", filterNoEnglish)} className={inputClass("village")} />
                <input placeholder="الحي" {...register("neighborhood")} onChange={handleLiveChange("neighborhood", filterNoEnglish)} className={inputClass("neighborhood")} />
              </div>
            </div>
          </div>
        </div>

        {/* القسم الثالث: أرقام التواصل */}
        <div className="bg-card p-7 rounded-[2rem] border border-border/50 shadow-sm space-y-6">
          <h3 className="text-primary font-bold border-b border-primary/10 pb-3 text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            أرقام التواصل
          </h3>
          <div className="space-y-4">
            <label className="font-semibold mb-1 block text-sm">رقم الجوال <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mobile_numbers.map((_, index) => (
                <div key={index} className="flex flex-col gap-1 animate-in fade-in duration-300">
                  <div className="flex gap-2">
                    <input
                      {...register(`phoneNumbers.${index}`)}
                      onChange={(e) => {
                        const filtered = filterPhone(e.target.value);
                        setValue(`phoneNumbers.${index}`, filtered, { shouldValidate: true });
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card/50 focus:bg-card",
                        errors.phoneNumbers?.[index] ? "border-destructive" : "border-border focus:border-primary"
                      )}
                      dir="ltr"
                      placeholder="05xxxxxxxx"
                    />
                    {index > 0 && (
                      <button type="button" onClick={() => removeMobile(index)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {errors.phoneNumbers?.[index] && <p className="text-destructive text-[10px]">{errors.phoneNumbers[index]?.message}</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={addMobile} className="text-primary text-xs flex items-center gap-1 hover:underline font-bold mt-2">
              <Plus size={14} /> إضافة رقم جوال آخر
            </button>
          </div>
        </div>

        {/* زر الإرسال */}
        <div className="flex justify-center md:justify-end mt-8">
          <button type="submit" className="w-full md:w-auto px-12 py-3.5 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            التالي
          </button>
        </div>
      </form>
    </div>
  );
}