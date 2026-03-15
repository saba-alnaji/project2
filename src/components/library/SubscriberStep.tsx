import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

const governorates = [
  "أريحا والأغوار", "بيت لحم", "الخليل", "القدس", "دير البلح",
  "رفح", "سلفيت", "شمال غزة", "طوباس", "طولكرم",
  "غزة", "قلقيلية", "خان يونس", "نابلس", "جنين", "رام الله والبيرة"
];

const subscriberSchema = z.object({
  subscriber_number: z.string().optional(),
  first_name: z.string().min(1, "الاسم الأول مطلوب").min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  father_name: z.string().min(1, "اسم الأب مطلوب").min(2, "اسم الأب يجب أن يكون حرفين على الأقل"),
  grandfather_name: z.string().min(1, "اسم الجد مطلوب").min(2, "اسم الجد يجب أن يكون حرفين على الأقل"),
  last_name: z.string().min(1, "اسم العائلة مطلوب").min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
  first_name_en: z.string().min(1, "الاسم الأول بالإنجليزية مطلوب").regex(/^[A-Za-z\s]+$/, "يجب إدخال حروف إنجليزية فقط"),
  last_name_en: z.string().min(1, "اسم العائلة بالإنجليزية مطلوب").regex(/^[A-Za-z\s]+$/, "يجب إدخال حروف إنجليزية فقط"),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  national_id: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "رقم الهوية يجب أن يكون أرقام فقط"),
  governorate: z.string().optional(),
  job: z.string().optional(),
  mobile_numbers: z.array(z.string())
    .min(1, "أدخل رقم جوال واحد على الأقل")
    .refine(numbers => numbers.some(num => num.trim().length > 0), "أدخل رقم جوال صحيح")
    .refine(numbers => numbers.every(num => !num || /^\d{7,10}$/.test(num)), "رقم الجوال يجب أن يكون 7-10 أرقام"),
  address_street: z.string().optional(),
  address_town: z.string().optional(),
  address_neighborhood: z.string().optional(),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;

interface SubscriberStepProps {
  onNext: (data: SubscriberFormData) => void;
}

export default function SubscriberStep({ onNext }: SubscriberStepProps) {

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } =
    useForm<SubscriberFormData>({
      resolver: zodResolver(subscriberSchema),
      mode: "onTouched",
      defaultValues: {
        subscriber_number: "",
        first_name: "",
        father_name: "",
        grandfather_name: "",
        last_name: "",
        first_name_en: "",
        last_name_en: "",
        birth_date: "",
        gender: "",
        national_id: "",
        governorate: "",
        job: "",
        mobile_numbers: [""],
        address_street: "",
        address_town: "",
        address_neighborhood: "",
      }
    });

  const mobile_numbers = watch("mobile_numbers");

  const addMobile = () => {
    const currentNumbers = getValues("mobile_numbers");
    setValue("mobile_numbers", [...currentNumbers, ""]);
  };

  const removeMobile = (index: number) => {
    const currentNumbers = getValues("mobile_numbers");
    setValue(
      "mobile_numbers",
      currentNumbers.filter((_, i) => i !== index)
    );
  };

  const updateMobile = (index: number, value: string) => {
    const currentNumbers = getValues("mobile_numbers");
    const updatedNumbers = [...currentNumbers];
    updatedNumbers[index] = value;
    setValue("mobile_numbers", updatedNumbers);
  };

  const onSubmit = async (data: SubscriberFormData) => {

    const cleanedData = {
      ...data,
      mobile_numbers: data.mobile_numbers.filter(m => m.trim())
    };

    try {

      const response = await axios.post("https://localhost:8080/create/CreateSubscription", cleanedData
      );

      console.log("API Response:", response.data);

      onNext(cleanedData);

    } catch (error) {
      console.error("Error submitting subscriber:", error);
    }
  };

  const inputClass = (fieldName?: string) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary",
    fieldName && errors[fieldName as keyof typeof errors]
      ? "border-destructive"
      : "border-border"
  );

  const getErrorMessage = (fieldName: string) => {
    const error = errors[fieldName as keyof typeof errors];
    return error?.message;
  };

  return (
   <div className="animate-fade-in">
  {/* Header */}
  <div className="text-center mb-6">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
      <User className="w-8 h-8 text-white" />
    </div>
    <h2 className="text-2xl font-bold">بيانات المشترك</h2>
    <p className="text-muted-foreground text-sm">
      أدخل البيانات الشخصية للمشترك
    </p>
  </div>

  <form onSubmit={handleSubmit(onSubmit)}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">

      {/* Subscriber Number */}
      <div>
        <label className="font-semibold mb-2 block">رقم المشترك</label>
        <input
          placeholder="أدخل رقم المشترك"
          {...register("subscriber_number")}
          className={inputClass("subscriber_number")}
          dir="ltr"
        />
      </div>

      {/* National ID */}
      <div>
        <label className="font-semibold mb-2 block">
          رقم الهوية <span className="text-destructive">*</span>
        </label>
        <input
          placeholder="رقم الهوية"
          {...register("national_id")}
          className={inputClass("national_id")}
          dir="ltr"
        />
        {getErrorMessage("national_id") && (
          <p className="text-destructive text-xs mt-1">
            {getErrorMessage("national_id")}
          </p>
        )}
      </div>

      <div className="hidden lg:block"></div>

      {/* Arabic Name */}
      <div className="lg:col-span-3 md:col-span-2 col-span-1">
        <label className="font-semibold mb-2 block">
          الاسم بالعربي <span className="text-destructive">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <input
              placeholder="الأول"
              {...register("first_name")}
              className={inputClass("first_name")}
            />
            {getErrorMessage("first_name") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("first_name")}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="الأب"
              {...register("father_name")}
              className={inputClass("father_name")}
            />
            {getErrorMessage("father_name") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("father_name")}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="الجد"
              {...register("grandfather_name")}
              className={inputClass("grandfather_name")}
            />
            {getErrorMessage("grandfather_name") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("grandfather_name")}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="العائلة"
              {...register("last_name")}
              className={inputClass("last_name")}
            />
            {getErrorMessage("last_name") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("last_name")}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* English Name */}
      <div className="lg:col-span-3 md:col-span-2 col-span-1">
        <label className="font-semibold mb-2 block">
          الاسم بالإنجليزية <span className="text-destructive">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div>
            <input
              placeholder="First Name"
              {...register("first_name_en")}
              className={inputClass("first_name_en")}
              dir="ltr"
            />
            {getErrorMessage("first_name_en") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("first_name_en")}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="Last Name"
              {...register("last_name_en")}
              className={inputClass("last_name_en")}
              dir="ltr"
            />
            {getErrorMessage("last_name_en") && (
              <p className="text-destructive text-xs mt-1">
                {getErrorMessage("last_name_en")}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Birth Date */}
      <div>
        <label className="font-semibold mb-2 block">تاريخ الميلاد</label>
        <input
          type="date"
          {...register("birth_date")}
          className={inputClass("birth_date")}
        />
      </div>

      {/* Gender */}
      <div>
        <label className="font-semibold mb-2 block">الجنس</label>
        <select {...register("gender")} className={inputClass("gender")}>
          <option value="">اختر</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
      </div>

      {/* Governorate */}
      <div>
        <label className="font-semibold mb-2 block">المحافظة</label>
        <select {...register("governorate")} className={inputClass("governorate")}>
          <option value="">اختر المحافظة</option>
          {governorates.map(g => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Address */}
      <div className="lg:col-span-3 md:col-span-2 col-span-1">
        <label className="font-semibold mb-2 block">العنوان</label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            placeholder="الشارع"
            {...register("address_street")}
            className={inputClass("address_street")}
          />

          <input
            placeholder="البلدة"
            {...register("address_town")}
            className={inputClass("address_town")}
          />

          <input
            placeholder="الحي"
            {...register("address_neighborhood")}
            className={inputClass("address_neighborhood")}
          />
        </div>
      </div>

      {/* Job */}
      <div>
        <label className="font-semibold mb-2 block">الوظيفة</label>
        <input {...register("job")} className={inputClass("job")} />
      </div>

      {/* Mobile Numbers */}
      <div className="lg:col-span-2">
        <label className="font-semibold mb-2 block">
          رقم الجوال <span className="text-destructive">*</span>
        </label>

        <div className="space-y-2">
          {mobile_numbers?.map((_, index) => (
            <div key={index} className="flex gap-2 items-center">

              <input
                value={mobile_numbers[index] || ""}
                onChange={e => updateMobile(index, e.target.value)}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border-2 transition-all",
                  "bg-card text-foreground",
                  "focus:outline-none focus:border-primary",
                  getErrorMessage("mobile_numbers") && index === 0
                    ? "border-destructive"
                    : "border-border"
                )}
                dir="ltr"
              />

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeMobile(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {getErrorMessage("mobile_numbers") && (
            <p className="text-destructive text-xs">
              {getErrorMessage("mobile_numbers")}
            </p>
          )}

          <button
            type="button"
            onClick={addMobile}
            className="flex gap-2 text-primary text-sm mt-2 hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة رقم
          </button>
        </div>
      </div>

    </div>

    {/* Submit */}
    <div className="flex justify-end mt-8">
      <button
        type="submit"
        className="px-8 py-3 rounded-xl gradient-primary text-white font-bold hover:shadow-lg transition-shadow"
      >
        التالي
      </button>
    </div>
  </form>
</div>
  );
}