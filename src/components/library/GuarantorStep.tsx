import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck, Plus, X, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ================= Types & Schema (نفس اللي عندك بالظبط) =================

interface Guarantor {
  guarantorId?: string | number | null;
  idnumber: string;
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  name?: string;
  job: string;
  village?: string;
  neighborhood?: string;
  street?: string;
  phoneNumbers: string[];
  isNew?: boolean;
}

const guarantorSchema = z.object({
  idnumber: z.string().length(9, "رقم الهوية يجب أن يكون 9 أرقام").regex(/^\d+$/, "يجب إدخال أرقام فقط"),
  firstName: z.string().min(1, "الاسم الأول مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  fatherName: z.string().min(1, "اسم الأب مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  grandfatherName: z.string().min(1, "اسم الجد مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  familyName: z.string().min(1, "اسم العائلة مطلوب").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال حروف عربية فقط"),
  job: z.string().min(1, "الوظيفة مطلوبة").regex(/^[\u0621-\u064A\s]+$/, "يجب إدخال الوظيفة باللغة العربية فقط"),
  street: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط").optional().nullable(),
  village: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط").optional().nullable(),
  neighborhood: z.string().regex(/^[\u0621-\u064A0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/, "يجب استخدام اللغة العربية والرموز فقط").optional().nullable(),
  phoneNumbers: z.array(
    z.string().regex(/^[0-9+\-() ]+$/, "رقم الجوال يجب أن يحتوي على أرقام ورموز فقط").min(10, "الرقم قصير جداً")
  ).min(1, "يجب إضافة رقم جوال واحد على الأقل"),
});

type GuarantorFormData = z.infer<typeof guarantorSchema>;

interface GuarantorStepProps {
  onNext: (guarantorData: any) => void;
  onBack: () => void;
  previousGuarantor?: any;
  previousFormValues?: any;
}

const GuarantorStep = forwardRef((props: GuarantorStepProps, ref) => {
  const { onNext, onBack, previousGuarantor, previousFormValues } = props;

  const [nationalId, setNationalId] = useState(previousGuarantor?.idnumber || previousFormValues?.idnumber || "");
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundGuarantor, setFoundGuarantor] = useState<Guarantor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<"search" | "found" | "new-form">("search");

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, reset } = useForm<GuarantorFormData>({
    resolver: zodResolver(guarantorSchema),
    mode: "onTouched",
    defaultValues: {
      phoneNumbers: [""],
    },
  });

  // --- دالات التصفية الحية (نفس اللي عندك بالظبط) ---
  const filterNumbers = (val: string) => val.replace(/[^\d]/g, "");
  const filterArabic = (val: string) => val.replace(/[^\u0621-\u064A\s]/g, "");
  const filterNoEnglish = (val: string) => val.replace(/[a-zA-Z]/g, "");
  const filterPhone = (val: string) => val.replace(/[^0-9+\-() ]/g, "");

  const handleLiveChange = (name: keyof GuarantorFormData, filterFn: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterFn(e.target.value);
    setValue(name, filteredValue, { shouldValidate: true });
  };

  // تعديل الـ useEffect لضمان استرجاع البيانات عند العودة
  useEffect(() => {
    if (previousGuarantor) {
      setSearched(true);
      setNationalId(previousGuarantor.idnumber || "");
      
      if (previousGuarantor.isNew) {
        setMode("new-form");
        reset(previousGuarantor); // تعبئة الفورم إذا كان جديداً
      } else {
        setMode("found");
        setFoundGuarantor(previousGuarantor); // عرض البيانات إذا كان موجوداً
      }
    } else if (previousFormValues) {
       // في حال وجود قيم فورم فقط بدون كائن كفيل كامل
       setMode("new-form");
       setSearched(true);
       reset(previousFormValues);
    }
  }, [previousGuarantor, previousFormValues, reset]);

  useImperativeHandle(ref, () => ({
    submitGuarantor: () => {
      if (mode === "found" && foundGuarantor) {
        onNext({ ...foundGuarantor, isNew: false });
      } else if (mode === "new-form") {
        handleSubmit((data) => {
          onNext({ ...data, guarantorId: 0, isNew: true });
        })();
      } else {
        toast.error("تنبيه: يرجى البحث أو تعبئة البيانات");
      }
    },
    getCurrentValues: () => {
      if (mode === "found") return { ...foundGuarantor, isNew: false };
      if (mode === "new-form") return { ...getValues(), isNew: true };
      return { idnumber: nationalId, isNew: false };
    }
  }));

  const handleSearch = async () => {
    if (!nationalId.trim()) return;
    setSearchLoading(true);
    setFoundGuarantor(null);
    setNotFound(false);
    setSearched(false);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/Subscription/search-guarantor", {
        params: { IDNumber: nationalId.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearched(true);
      if (response.data && (response.data.id || response.data.guarantorId)) {
        const data = response.data;
        const mapped: Guarantor = {
          guarantorId: data.guarantorId || data.id,
          idnumber: String(data.idNumber || data.idnumber || nationalId.trim()),
          firstName: data.firstName || "",
          fatherName: data.fatherName || "",
          grandfatherName: data.grandFatherName || data.grandfatherName || "",
          familyName: data.familyName || "",
          job: data.job || "",
          village: data.village || "",
          neighborhood: data.neighborhood || "",
          street: data.street || "",
          phoneNumbers: Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [data.phoneNumber || ""],
          name: `${data.firstName || ""} ${data.familyName || ""}`.trim(),
        };
        setFoundGuarantor(mapped);
        setMode("found");
        toast.success("تم العثور على الكفيل بنجاح");
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      setSearched(true);
      setNotFound(true);
      const serverMsg = error.response?.data?.message || "خطأ في البحث عن الكفيل";
      toast.error(serverMsg);
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
      job: "",
      street: "",
      village: "",
      neighborhood: "",
      phoneNumbers: [""],
    });
    setMode("new-form");
  };

  const mobile_numbers = watch("phoneNumbers") ?? [""];

  // نفس دالة التصميم تبعتك بالظبط
  const inputClassCustom = (name: keyof GuarantorFormData, isReadOnly: boolean) => cn(
    "w-full px-4 py-3 rounded-xl border-2 text-base transition-all focus:outline-none",
    isReadOnly
      ? "bg-green-50 border-green-200 text-green-900 cursor-default"
      : (errors[name] ? "border-destructive bg-card" : "border-border focus:border-primary bg-card")
  );

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl gradient-primary shadow-card">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">بيانات الكفيل</h2>
          <p className="text-sm text-muted-foreground">ابحث عن كفيل موجود أو أضف كفيل جديد</p>
        </div>
      </div>

      <div className="space-y-2 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <label className="block text-sm font-semibold mb-1 mr-1">البحث برقم الهوية</label>
        <div className="flex gap-2">
          <input
            value={nationalId}
            onChange={(e) => setNationalId(filterNumbers(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="أدخل رقم هوية الكفيل..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none bg-slate-50"
            dir="ltr"
            maxLength={9}
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

      {searched && notFound && mode !== "new-form" && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 mb-4 animate-in zoom-in-95">
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

      {(mode === "found" || mode === "new-form") && (
        <div className={cn(
          "space-y-5 p-6 rounded-3xl border-2 animate-in slide-in-from-bottom-4 transition-colors duration-500",
          mode === "found" ? "bg-green-50/50 border-green-500/30" : "bg-primary/5 border-primary/20"
        )}>
          
          <div className="flex items-center gap-2 mb-2">
            {mode === "found" ? (
              <><CheckCircle className="w-5 h-5 text-green-600" /> <span className="font-bold text-green-700">تم جلب بيانات الكفيل من النظام</span></>
            ) : (
              <><AlertCircle className="w-5 h-5 text-primary" /> <span className="font-bold text-primary">يرجى إدخال بيانات الكفيل الجديد</span></>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-xs font-bold mb-1 mr-2", mode === "found" ? "text-green-600" : "text-slate-500")}>رقم الهوية <span className="text-destructive">*</span></label>
              <input 
                {...(mode === "new-form" ? { ...register("idnumber"), onChange: handleLiveChange("idnumber", filterNumbers) } : {})} 
                value={mode === "found" ? foundGuarantor?.idnumber : undefined}
                className={inputClassCustom("idnumber", mode === "found")} 
                readOnly={mode === "found"}
                maxLength={9}
                dir="ltr"
              />
              {errors.idnumber && mode === "new-form" && <p className="text-[10px] text-destructive mt-1 mr-2">{errors.idnumber.message}</p>}
            </div>
            <div>
              <label className={cn("block text-xs font-bold mb-1 mr-2", mode === "found" ? "text-green-600" : "text-slate-500")}>الوظيفة <span className="text-destructive">*</span></label>
              <input 
                {...(mode === "new-form" ? { ...register("job"), onChange: handleLiveChange("job", filterArabic) } : {})} 
                value={mode === "found" ? foundGuarantor?.job : undefined}
                className={inputClassCustom("job", mode === "found")} 
                readOnly={mode === "found"}
                placeholder="الوظيفة بالعربي"
              />
              {errors.job && mode === "new-form" && <p className="text-[10px] text-destructive mt-1 mr-2">{errors.job.message}</p>}
            </div>
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-1 mr-2", mode === "found" ? "text-green-600" : "text-slate-500")}>الاسم الرباعي <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <input {...(mode === "new-form" ? { ...register("firstName"), onChange: handleLiveChange("firstName", filterArabic) } : {})} value={mode === "found" ? foundGuarantor?.firstName : undefined} className={inputClassCustom("firstName", mode === "found")} readOnly={mode === "found"} placeholder="الأول" />
                {errors.firstName && mode === "new-form" && <span className="text-[9px] text-destructive mr-1">{errors.firstName.message}</span>}
              </div>
              <div className="flex flex-col">
                <input {...(mode === "new-form" ? { ...register("fatherName"), onChange: handleLiveChange("fatherName", filterArabic) } : {})} value={mode === "found" ? foundGuarantor?.fatherName : undefined} className={inputClassCustom("fatherName", mode === "found")} readOnly={mode === "found"} placeholder="الأب" />
                {errors.fatherName && mode === "new-form" && <span className="text-[9px] text-destructive mr-1">{errors.fatherName.message}</span>}
              </div>
              <div className="flex flex-col">
                <input {...(mode === "new-form" ? { ...register("grandfatherName"), onChange: handleLiveChange("grandfatherName", filterArabic) } : {})} value={mode === "found" ? foundGuarantor?.grandfatherName : undefined} className={inputClassCustom("grandfatherName", mode === "found")} readOnly={mode === "found"} placeholder="الجد" />
                {errors.grandfatherName && mode === "new-form" && <span className="text-[9px] text-destructive mr-1">{errors.grandfatherName.message}</span>}
              </div>
              <div className="flex flex-col">
                <input {...(mode === "new-form" ? { ...register("familyName"), onChange: handleLiveChange("familyName", filterArabic) } : {})} value={mode === "found" ? foundGuarantor?.familyName : undefined} className={inputClassCustom("familyName", mode === "found")} readOnly={mode === "found"} placeholder="العائلة" />
                {errors.familyName && mode === "new-form" && <span className="text-[9px] text-destructive mr-1">{errors.familyName.message}</span>}
              </div>
            </div>
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-1 mr-2", mode === "found" ? "text-green-600" : "text-slate-500")}>العنوان</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input {...(mode === "new-form" ? { ...register("street"), onChange: handleLiveChange("street", filterNoEnglish) } : {})} value={mode === "found" ? foundGuarantor?.street || "" : undefined} className={inputClassCustom("street", mode === "found")} readOnly={mode === "found"} placeholder="الشارع" />
              <input {...(mode === "new-form" ? { ...register("village"), onChange: handleLiveChange("village", filterNoEnglish) } : {})} value={mode === "found" ? foundGuarantor?.village || "" : undefined} className={inputClassCustom("village", mode === "found")} readOnly={mode === "found"} placeholder="القرية" />
              <input {...(mode === "new-form" ? { ...register("neighborhood"), onChange: handleLiveChange("neighborhood", filterNoEnglish) } : {})} value={mode === "found" ? foundGuarantor?.neighborhood || "" : undefined} className={inputClassCustom("neighborhood", mode === "found")} readOnly={mode === "found"} placeholder="الحي" />
            </div>
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-1 mr-2", mode === "found" ? "text-green-600" : "text-slate-500")}>رقم الجوال <span className="text-destructive">*</span></label>
            <div className="space-y-2">
              {(mode === "found" ? (foundGuarantor?.phoneNumbers || [""]) : mobile_numbers).map((num, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      value={mode === "found" ? num : mobile_numbers[index]}
                      onChange={(e) => {
                        if (mode === "new-form") {
                          const filtered = filterPhone(e.target.value);
                          const arr = [...mobile_numbers];
                          arr[index] = filtered;
                          setValue("phoneNumbers", arr, { shouldValidate: true });
                        }
                      }}
                      className={inputClassCustom("phoneNumbers", mode === "found")}
                      readOnly={mode === "found"}
                      dir="ltr"
                      placeholder="05xxxxxxxx"
                    />
                    {mode === "new-form" && mobile_numbers.length > 1 && (
                      <button type="button" onClick={() => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index))} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {errors.phoneNumbers?.[index] && mode === "new-form" && (
                    <span className="text-[10px] text-destructive mr-1">{errors.phoneNumbers[index]?.message}</span>
                  )}
                </div>
              ))}
              {mode === "new-form" && (
                <button type="button" onClick={() => setValue("phoneNumbers", [...mobile_numbers, ""])} className="text-primary text-sm font-bold flex items-center gap-1 mt-1 hover:underline">
                  <Plus className="w-4 h-4" /> إضافة رقم آخر
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 italic text-center">هل تريد تغيير الكفيل أو البحث عن رقم هوية آخر؟</p>
            <button 
              type="button"
              onClick={() => { setMode("search"); setSearched(false); setNotFound(false); }} 
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-4 h-4" /> بحث جديد
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default GuarantorStep;