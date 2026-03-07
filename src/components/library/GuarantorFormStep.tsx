import { useState } from "react";
import { Plus, X, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuarantorFormData {
  name: string;
  name_en: string;
  job: string;
  address: string;
  address_street: string;
  address_town: string;
  address_neighborhood: string;
  mobile_numbers: string[];
}

interface GuarantorFormStepProps {
  nationalId: string;
  onSubmit: (data: { name: string; job: string; address: string; mobile_numbers: string[] }) => void;
  onBack: () => void;
}

export default function GuarantorFormStep({ nationalId, onSubmit, onBack }: GuarantorFormStepProps) {
  const [form, setForm] = useState<GuarantorFormData>({
    name: "",
    name_en: "",
    job: "",
    address: "",
    address_street: "",
    address_town: "",
    address_neighborhood: "",
    mobile_numbers: [""],
  });
  const [localNationalId, setLocalNationalId] = useState(nationalId);
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
    if (!form.name.trim()) newErrors.name = "اسم الكفيل مطلوب";
    if (!form.mobile_numbers[0]?.trim()) newErrors.mobile = "رقم الموبايل مطلوب";
    if (!localNationalId.trim()) newErrors.national_id = "رقم الهوية مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const fullAddress = [form.address_street, form.address_town, form.address_neighborhood].filter(Boolean).join(" - ");
      onSubmit({
        name: form.name,
        job: form.job,
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-accent flex items-center justify-center shadow-accent">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">بيانات الكفيل الجديد</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* National ID */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            رقم هوية الكفيل <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={localNationalId}
            onChange={e => setLocalNationalId(e.target.value)}
            placeholder="رقم الهوية"
            className={inputClass("national_id")}
            dir="ltr"
          />
          {errors.national_id && <p className="text-destructive text-xs mt-1">{errors.national_id}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            اسم الكفيل <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="الاسم الكامل للكفيل"
            className={inputClass("name")}
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>

        {/* English Name */}
        <div className="md:col-span-2">
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

        {/* Job */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">الوظيفة</label>
          <input
            type="text"
            value={form.job}
            onChange={e => setForm(prev => ({ ...prev, job: e.target.value }))}
            placeholder="الوظيفة الحالية"
            className={inputClass("job")}
          />
        </div>

        {/* Empty for alignment */}
        <div className="hidden md:block" />

        {/* Address - 3 fields */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">عنوان الكفيل</label>
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
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-foreground mb-2">
            أرقام الموبايل <span className="text-destructive">*</span>
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

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all duration-200"
        >
          رجوع
        </button>
        <button
          onClick={handleSubmit}
          className="flex-2 flex-grow-[2] py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all duration-200"
        >
          المتابعة لتفاصيل الاشتراك
        </button>
      </div>
    </div>
  );
}
