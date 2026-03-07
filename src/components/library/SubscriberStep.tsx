import { useState } from "react";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const governorates = [
  "أريحا والأغوار", "بيت لحم", "الخليل", "القدس", "دير البلح",
  "رفح", "سلفيت", "شمال غزة", "طوباس", "طولكرم",
  "غزة", "قلقيلية", "خان يونس", "نابلس", "جنين", "رام الله والبيرة"
];

export interface SubscriberFormData {
  subscriber_number: string;
  name: string;
  name_en: string;
  first_name: string;
  second_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  national_id: string;
  governorate: string;
  job: string;
  mobile_numbers: string[];
  address: string;
  address_street: string;
  address_town: string;
  address_neighborhood: string;
}

interface SubscriberStepProps {
  onNext: (data: SubscriberFormData) => void;
}

export default function SubscriberStep({ onNext }: SubscriberStepProps) {
  const [form, setForm] = useState<SubscriberFormData>({
    subscriber_number: "",
    name: "",
    name_en: "",
    first_name: "",
    second_name: "",
    last_name: "",
    birth_date: "",
    gender: "",
    national_id: "",
    governorate: "",
    job: "",
    mobile_numbers: [""],
    address: "",
    address_street: "",
    address_town: "",
    address_neighborhood: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addMobile = () => {
    setForm(prev => ({ ...prev, mobile_numbers: [...prev.mobile_numbers, ""] }));
  };

  const removeMobile = (index: number) => {
    setForm(prev => ({
      ...prev,
      mobile_numbers: prev.mobile_numbers.filter((_, i) => i !== index),
    }));
  };

  const updateMobile = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      mobile_numbers: prev.mobile_numbers.map((m, i) => (i === index ? value : m)),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name.trim()) newErrors.first_name = "الاسم الأول مطلوب";
    if (!form.last_name.trim()) newErrors.last_name = "اسم العائلة مطلوب";
    if (!form.national_id.trim()) newErrors.national_id = "رقم الهوية مطلوب";
    if (!form.mobile_numbers[0]?.trim()) newErrors.mobile = "رقم الموبايل مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      const fullName = [form.first_name, form.second_name, form.last_name].filter(Boolean).join(" ");
      const fullAddress = [form.address_street, form.address_town, form.address_neighborhood].filter(Boolean).join(" - ");
      onNext({
        ...form,
        name: fullName,
        address: fullAddress,
        mobile_numbers: form.mobile_numbers.filter(m => m.trim()),
      });
    }
  };

  const inputClass = (field: string) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all duration-200",
    "bg-card text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary",
    errors[field] ? "border-destructive" : "border-border"
  );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">بيانات المشترك</h2>
        <p className="text-muted-foreground text-sm">أدخل البيانات الشخصية للمشترك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Subscriber Number */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">رقم المشترك</label>
          <input
            type="text"
            value={form.subscriber_number}
            onChange={e => setForm(prev => ({ ...prev, subscriber_number: e.target.value }))}
            placeholder="يُولَّد تلقائياً"
            className={inputClass("subscriber_number")}
            dir="ltr"
          />
        </div>

        {/* National ID */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            رقم الهوية <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.national_id}
            onChange={e => setForm(prev => ({ ...prev, national_id: e.target.value }))}
            placeholder="رقم الهوية الوطنية"
            className={inputClass("national_id")}
            dir="ltr"
          />
          {errors.national_id && <p className="text-destructive text-xs mt-1">{errors.national_id}</p>}
        </div>

        {/* Empty space for alignment */}
        <div className="hidden md:block" />

        {/* First Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            الاسم الأول <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.first_name}
            onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
            placeholder="الاسم الأول"
            className={inputClass("first_name")}
          />
          {errors.first_name && <p className="text-destructive text-xs mt-1">{errors.first_name}</p>}
        </div>

        {/* Second Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">اسم الأب</label>
          <input
            type="text"
            value={form.second_name}
            onChange={e => setForm(prev => ({ ...prev, second_name: e.target.value }))}
            placeholder="اسم الأب"
            className={inputClass("second_name")}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            اسم العائلة <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.last_name}
            onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
            placeholder="اسم العائلة"
            className={inputClass("last_name")}
          />
          {errors.last_name && <p className="text-destructive text-xs mt-1">{errors.last_name}</p>}
        </div>

        {/* English Name */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-foreground mb-2">الاسم بالإنجليزية</label>
          <input
            type="text"
            value={form.name_en}
            onChange={e => setForm(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="Full name in English"
            className={inputClass("name_en")}
            dir="ltr"
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">تاريخ الميلاد</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={e => setForm(prev => ({ ...prev, birth_date: e.target.value }))}
            className={inputClass("birth_date")}
            dir="ltr"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">الجنس</label>
          <div className="flex gap-3">
            {[{ value: "male", label: "ذكر" }, { value: "female", label: "أنثى" }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, gender: opt.value }))}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 font-semibold text-base transition-all duration-200",
                  form.gender === opt.value
                    ? "gradient-primary text-white border-primary shadow-card"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Governorate */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">المحافظة</label>
          <select
            value={form.governorate}
            onChange={e => setForm(prev => ({ ...prev, governorate: e.target.value }))}
            className={inputClass("governorate")}
          >
            <option value="">اختر المحافظة</option>
            {governorates.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Job */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">الوظيفة</label>
          <input
            type="text"
            value={form.job}
            onChange={e => setForm(prev => ({ ...prev, job: e.target.value }))}
            placeholder="المسمى الوظيفي"
            className={inputClass("job")}
          />
        </div>

        {/* Address - 3 fields */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-foreground mb-2">العنوان</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={form.address_street}
              onChange={e => setForm(prev => ({ ...prev, address_street: e.target.value }))}
              placeholder="الشارع"
              className={inputClass("address_street")}
            />
            <input
              type="text"
              value={form.address_town}
              onChange={e => setForm(prev => ({ ...prev, address_town: e.target.value }))}
              placeholder="البلدة"
              className={inputClass("address_town")}
            />
            <input
              type="text"
              value={form.address_neighborhood}
              onChange={e => setForm(prev => ({ ...prev, address_neighborhood: e.target.value }))}
              placeholder="الحي / المركز"
              className={inputClass("address_neighborhood")}
            />
          </div>
        </div>

        {/* Mobile numbers */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-foreground mb-2">
            رقم الموبايل <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            {form.mobile_numbers.map((mobile, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                  <span className="px-3 py-3 bg-muted rounded-xl text-muted-foreground text-sm font-medium">+970</span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => updateMobile(index, e.target.value)}
                    placeholder="رقم الموبايل"
                    dir="ltr"
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl border-2 text-base transition-all duration-200",
                      "bg-card text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:border-primary",
                      errors.mobile && index === 0 ? "border-destructive" : "border-border"
                    )}
                  />
                </div>
                {index > 0 && (
                  <button
                    onClick={() => removeMobile(index)}
                    className="p-2.5 rounded-xl text-destructive border-2 border-destructive/20 hover:bg-destructive/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.mobile && <p className="text-destructive text-xs">{errors.mobile}</p>}
            <button
              onClick={addMobile}
              className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة رقم آخر
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all duration-200 text-base"
        >
          التالي: بيانات الكفيل
        </button>
      </div>
    </div>
  );
}
