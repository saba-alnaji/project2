import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ================= Types =================
interface Guarantor {
  id?: string;
  idnumber: string;
  firstName: string;
  fatherName?: string;
  grandfatherName?: string;
  familyName: string;
  name: string;
  job?: string;
  village?: string;
  neighborhood?: string;
  street?: string;
  phoneNumbers?: string[];
  isNew?: boolean;
}
const guarantorSchema = z.object({
  idnumber: z.string().min(1, "رقم الهوية مطلوب").regex(/^\d+$/, "أرقام فقط"),
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  fatherName: z.string().min(1, "اسم الأب مطلوب"),
  grandfatherName: z.string().min(1, "اسم الجد مطلوب"),
  familyName: z.string().min(1, "اسم العائلة مطلوب"),
  job: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  neighborhood: z.string().optional(),
  phoneNumbers: z.array(
    z.string().optional().refine(
      (val) => !val || /^\d{10,12}$/.test(val),
      "رقم الجوال يجب أن يكون 10-12 رقم"
    )
  ).optional(),
});

type GuarantorFormData = z.infer<typeof guarantorSchema>;
interface GuarantorStepProps {
  onNext: (guarantorData: any) => void;
  onBack: () => void;
  previousGuarantor?: any; // الكفيل الذي تم العثور عليه سابقاً
  previousFormValues?: any; // بيانات الفورم في حال كان كفيلاً جديداً
}

const GuarantorStep = forwardRef((props: GuarantorStepProps, ref) => {
  const { onNext, onBack, previousGuarantor, previousFormValues } = props;
  const { toast } = useToast();
  const [nationalId, setNationalId] = useState(previousGuarantor?.idnumber || previousFormValues?.idnumber || "");
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundGuarantor, setFoundGuarantor] = useState<Guarantor | null>(previousGuarantor || null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(!!previousGuarantor || !!previousFormValues);
  const [mode, setMode] = useState<"search" | "found" | "new-form">("search");

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, reset } = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    mode: "onTouched",
    defaultValues: previousFormValues || {
      phoneNumbers: [""],
    },
  });
  useEffect(() => {
    if (previousFormValues?.isNew) {
      setMode("new-form");
      setNotFound(true);
      reset(previousFormValues);
    } else if (previousGuarantor) {
      setFoundGuarantor(previousGuarantor);
      setMode("found");
    }
  }, [previousGuarantor, previousFormValues, reset]);

  useImperativeHandle(ref, () => ({
    submitGuarantor: () => {
      if (mode === "found" && foundGuarantor) {
        onNext({ ...foundGuarantor, isNew: false });
      } else if (mode === "new-form") {
        handleSubmit((data) => onNext({ ...data, isNew: true }))();
      } else {
        toast({
          title: "تنبيه",
          description: "يرجى البحث عن كفيل أو تعبئة بيانات كفيل جديد أولاً",
          variant: "destructive",
        });
      }
    },
    getCurrentValues: () => ({ ...getValues(), isNew: mode === "new-form" }),
    getMode: () => mode,
  }));

  const handleSearch = async () => {
    if (!nationalId.trim()) return;
    setSearchLoading(true);
    setFoundGuarantor(null);
    setNotFound(false);
    setSearched(false);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://localhost:8080/api/Subscription/search-guarantor", {
        params: { IDNumber: nationalId.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearched(true);
      if (response.data) {
        const data = response.data;
        const mapped: Guarantor = {
          id: data.id,
          idnumber: String(data.IDNumber || data.idNumber || nationalId.trim()),
          firstName: data.firstName || "",
          fatherName: data.fatherName || "",
          grandfatherName: data.grandfatherName || "",
          familyName: data.familyName || "",
          name: `${data.firstName || ""} ${data.fatherName || ""} ${data.familyName || ""}`.trim(),
          job: data.job || "",
          village: data.village || "",
          neighborhood: data.neighborhood || "",
          street: data.street || "",
          phoneNumbers: Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [],
        };
        setFoundGuarantor(mapped);
        setMode("found")
        toast({ title: "تم العثور على الكفيل ✅" });
      } else {
        setNotFound(true)
      }
    } catch {
      setSearched(true);
      setNotFound(true);
    } finally {
      setSearchLoading(false);
    }

  };

  const handleAddNewGuarantor = () => {
    reset({
      idnumber: nationalId.trim(),
      firstName: "",
      fatherName: "",
      grandfatherName: "",
      familyName: "",
      phoneNumbers: [""],
    });
    setMode("new-form");
  };

  const mobile_numbers = watch("phoneNumbers") ?? [""];
  const updateMobile = (index: number, val: string) => {
    const arr = [...mobile_numbers];
    arr[index] = val;
    setValue("phoneNumbers", arr);
  };

  const inputClass = (name: keyof GuarantorFormData) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all bg-card text-foreground focus:outline-none",
    errors[name] ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
  );

  return (
  <div className="w-full max-w-3xl mx-auto animate-fade-in">
  {/* العنوان */}
  <div className="flex items-center gap-3 mb-6">
    <div className="p-3 rounded-2xl gradient-primary shadow-card">
      <UserCheck className="w-6 h-6 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-foreground">بيانات الكفيل</h2>
      <p className="text-sm text-muted-foreground">ابحث عن كفيل موجود أو أضف كفيل جديد</p>
    </div>
  </div>

  {/* البحث */}
  <div className="space-y-2 mb-6">
    <label className="block text-sm font-semibold mb-1">البحث برقم الهوية</label>
    <div className="flex gap-2">
      <input
        value={nationalId}
        onChange={(e) => setNationalId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="أدخل رقم هوية الكفيل..."
        className="flex-1 px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none bg-card"
        dir="ltr"
      />
      <button
        type="button"
        onClick={handleSearch}
        disabled={searchLoading}
        className="px-5 py-3 rounded-xl gradient-primary text-white font-bold"
      >
        {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
      </button>
    </div>
  </div>
  {/* نتائج البحث: في حال العثور على الكفيل */}
  {mode === "found" && foundGuarantor && (
    <div className="p-4 rounded-2xl bg-green-500/10 border-2 border-green-500/30 mb-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-bold text-green-700">تم العثور على الكفيل</p>
          <p className="font-semibold text-lg">{foundGuarantor.name}</p>
          <p className="text-muted-foreground text-sm">رقم الهوية: {foundGuarantor.idnumber}</p>
        </div>
      </div>
    </div>
  )}

  {/* نتائج البحث: في حال عدم العثور على الكفيل */}
  {searched && notFound && mode !== "new-form" && (
    <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="font-bold text-amber-700">الكفيل غير مسجل في النظام</p>
      </div>
      <button
        type="button"
        onClick={handleAddNewGuarantor}
        className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all"
      >
        إضافة كفيل جديد
      </button>
    </div>
  )}

  {/* فورمة الكفيل الجديد */}
  {mode === "new-form" && (
    <div className="space-y-5 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">رقم الهوية</label>
          <input {...register("idnumber")} className={inputClass("idnumber")} dir="ltr" readOnly />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">الوظيفة</label>
          <input {...register("job")} className={inputClass("job")} placeholder="الوظيفة" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">الاسم بالعربي <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <input {...register("firstName")} className={inputClass("firstName")} placeholder="الأول" />
          <input {...register("fatherName")} className={inputClass("fatherName")} placeholder="الأب" />
          <input {...register("grandfatherName")} className={inputClass("grandfatherName")} placeholder="الجد" />
          <input {...register("familyName")} className={inputClass("familyName")} placeholder="العائلة" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">العنوان</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input {...register("street")} className={inputClass("street")} placeholder="الشارع" />
          <input {...register("village")} className={inputClass("village")} placeholder="القرية" />
          <input {...register("neighborhood")} className={inputClass("neighborhood")} placeholder="الحي" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">أرقام الجوال</label>
        <div className="space-y-2">
          {mobile_numbers.map((_, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={mobile_numbers[index] || ""}
                onChange={(e) => updateMobile(index, e.target.value)}
                className={cn(inputClass("phoneNumbers" as any), "flex-1")}
                dir="ltr"
                placeholder="05xxxxxxxx"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index))}
                  className="text-destructive p-2 hover:bg-destructive/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setValue("phoneNumbers", [...mobile_numbers, ""])}
            className="text-primary text-sm font-bold flex items-center gap-1 mt-1"
          >
            <Plus className="w-4 h-4" /> إضافة رقم
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
});
GuarantorStep.displayName = "GuarantorStep";
export default GuarantorStep;