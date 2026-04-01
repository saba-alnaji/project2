import { useState, useRef } from "react";
import {
  Search, Save, Loader2, UserCheck, ShieldCheck, PencilLine, X, Plus, UserPlus, Info
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import SubscriberStep from "@/components/library/SubscriberStep";
import GuarantorStep from "@/components/library/GuarantorStep";

export default function EditSubscriptionPage() {
  const { toast } = useToast();
  const guarantorRef = useRef<any>(null);

  // 1. حالات التحكم والبحث
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"idNumber" | "memberNumber">("idNumber");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewGuarantorSearch, setShowNewGuarantorSearch] = useState(false);

  // 2. حالات البيانات الأساسية
  const [userID, setUserID] = useState<number | null>(null);
  const [memberData, setMemberData] = useState<any>(null);

  // 3. إعداد فورم الكفيل (للتعديل المباشر)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      idnumber: "",
      firstName: "",
      fatherName: "",
      grandfatherName: "",
      familyName: "",
      job: "",
      street: "",
      village: "",
      neighborhood: "",
      phoneNumbers: [""]
    }
  });

  const mobile_numbers = watch("phoneNumbers") || [""];

  const handleInitialSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setMemberData(null);
    setShowNewGuarantorSearch(false);
    setCurrentStep(1);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://localhost:8080/api/Subscription/search",
        { [searchType]: searchQuery.trim(), pageNumber: 1, pageSize: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.memberInfo) {
        const { memberInfo, guarantorInfo, userID: id } = res.data;
        setUserID(id);
        setMemberData({
          ...memberInfo,
          cityId: (memberInfo.cityId || memberInfo.cityID)?.toString() || "",
          phoneNumbers: memberInfo.phoneNumbers || [""]
        });
        reset({
          ...guarantorInfo,
          idnumber: guarantorInfo.idNumber || guarantorInfo.IDNumber || guarantorInfo.idnumber || "",
          phoneNumbers: guarantorInfo.phoneNumbers && guarantorInfo.phoneNumbers.length > 0 ? guarantorInfo.phoneNumbers : [""]
        });
        toast({ title: "تم جلب بيانات الاشتراك بنجاح" });
      } else {
        toast({ title: "لا يوجد نتائج لهذا البحث", variant: "destructive" });
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast({ title: "انتهت الجلسة، الرجاء تسجيل الدخول مجددًا", variant: "destructive" });
        window.location.href = "/login";
        return;
      }
      if (error.response && error.response.status === 404) {
        toast({ title: "لا يوجد نتائج لهذا البحث", variant: "destructive" });
      }
      else {
        toast({ title: "خطأ في الاتصال بالسيرفر أو رقم غير صحيح", variant: "destructive" });
      }
    } finally {
      setSearching(false);
    }
  };

  const onFinishUpdate = async (finalGuarantor: any) => {
    const isValidPhones = finalGuarantor.phoneNumbers.every((p: string) => /^\d{10,12}$/.test(p)) && finalGuarantor.phoneNumbers.length > 0;
    if (!isValidPhones) {
      toast({ title: "يرجى التأكد من صحة أرقام الجوال (10-12 رقم)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formattedGuarantor = {
        ...finalGuarantor,
        idNumber: finalGuarantor.idnumber
      };
      const payload = {
        userID: userID,
        memberInfo: memberData,
        guarantorInfo: formattedGuarantor
      };
      await axios.put("https://localhost:8080/api/Subscription/update", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "تم حفظ كافة التعديلات بنجاح ✅" });
      setMemberData(null);
      setUserID(null);
      setSearchQuery("");
      setCurrentStep(1);
      setShowNewGuarantorSearch(false);
      reset();

    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast({ title: "انتهت الجلسة، الرجاء تسجيل الدخول مجددًا", variant: "destructive" });
        window.location.href = "/login";
        return;
      }
      toast({ title: "حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقاً", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (fieldName: string) => cn(
    "w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none bg-white transition-all",
    errors[fieldName as any] && "border-destructive focus:border-destructive"
  );

  const updateMobile = (index: number, value: string) => {
    const updated = [...mobile_numbers];
    updated[index] = value;
    setValue("phoneNumbers", updated);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 pb-20" dir="rtl">
      <div className="mb-8 ">
        <div className="flex  gap-3 mb-2">
          {/* إضافة الأيقونة هنا */}
          <PencilLine className="w-10 h-10 text-primary" />

          <h1 className="text-3xl font-black text-slate-900">إدارة وتعديل الاشتراك</h1>
        </div>
        <p className="text-slate-500 mr-12">ابحث برقم الهوية أو رقم المشترك لتعديل البيانات</p>
      </div>
      {/* بار البحث العلوي */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleInitialSearch();
              }
            }}
            placeholder={searchType === "idNumber" ? "أدخل رقم الهوية..." : "أدخل رقم المشترك..."}
            className="w-full pr-4 pl-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-all"
          />
        </div>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="md:w-48 px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-primary bg-slate-50 outline-none cursor-pointer"
        >
          <option value="idNumber">رقم الهوية</option>
          <option value="memberNumber">رقم المشترك</option>
        </select>
        <button
          onClick={handleInitialSearch}
          disabled={searching}
          className="px-10 py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          بحث
        </button>
      </div>

      {memberData && (
        <div className="space-y-6">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm cursor-pointer",
              currentStep === 1 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}
              onClick={() => setCurrentStep(1)}>
              <UserCheck className="w-5 h-5" /> بيانات المشترك
            </div>
            <div className="h-px w-16 bg-slate-200 hidden md:block" />
            <div className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm cursor-pointer",
              currentStep === 2 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}
              onClick={() => setCurrentStep(2)}>
              <ShieldCheck className="w-5 h-5" /> بيانات الكفيل
            </div>
          </div>

          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card animate-in fade-in slide-in-from-right-4">
              <SubscriberStep
                initialData={memberData}
                onNext={(updated) => { setMemberData(updated); setCurrentStep(2); }}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card animate-in fade-in slide-in-from-left-4">

              {!showNewGuarantorSearch ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                      <Info className="text-primary w-6 h-6" /> بيانات الكفيل الحالية (قابلة للتعديل)
                    </div>
                  </div>

                  <div className="space-y-5 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700">رقم الهوية <span className="text-destructive">*</span></label>
                        <input
                          {...register("idnumber", {
                            required: "رقم الهوية مطلوب",
                            pattern: { value: /^\d{9}$/, message: "رقم الهوية يجب أن يكون 9 أرقام" }
                          })}
                          className={inputClass("idnumber")}
                          dir="ltr"
                          placeholder="9 أرقام فقط"
                        />
                        {errors.idnumber && <p className="text-xs text-destructive mt-1">{errors.idnumber.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700">الوظيفة</label>
                        <input {...register("job")} className={inputClass("job")} placeholder="الوظيفة" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">الاسم الرباعي</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input {...register("firstName")} className={inputClass("firstName")} placeholder="الأول" />
                        <input {...register("fatherName")} className={inputClass("fatherName")} placeholder="الأب" />
                        <input {...register("grandfatherName")} className={inputClass("grandfatherName")} placeholder="الجد" />
                        <input {...register("familyName")} className={inputClass("familyName")} placeholder="العائلة" />
                      </div>
                    </div>

                    {/* قسم العنوان الذي تم إرجاعه */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">العنوان</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input {...register("street")} className={inputClass("street")} placeholder="الشارع" />
                        <input {...register("village")} className={inputClass("village")} placeholder="القرية" />
                        <input {...register("neighborhood")} className={inputClass("neighborhood")} placeholder="الحي" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">أرقام الجوال <span className="text-destructive">*</span></label>
                      <div className="space-y-2">
                        {mobile_numbers.map((_, index) => (
                          <div key={index} className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              <input
                                value={mobile_numbers[index] || ""}
                                onChange={(e) => updateMobile(index, e.target.value)}
                                className={cn(inputClass("phoneNumbers"), "flex-1")}
                                dir="ltr"
                                placeholder="05xxxxxxxx"
                              />
                              {mobile_numbers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index))}
                                  className="text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {mobile_numbers[index] && !/^\d{10,12}$/.test(mobile_numbers[index]) && (
                              <p className="text-[10px] text-destructive">يجب أن يكون بين 10-12 خانة</p>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setValue("phoneNumbers", [...mobile_numbers, ""])}
                          className="text-primary text-sm font-bold flex items-center gap-1 mt-1 hover:underline"
                        >
                          <Plus className="w-4 h-4" /> إضافة رقم آخر
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowNewGuarantorSearch(true)}
                    className="w-full text-primary font-bold hover:underline text-center flex items-center justify-center gap-2 py-4 bg-primary/5 rounded-xl border border-dashed border-primary/30"
                  >
                    <UserPlus className="w-5 h-5" /> هل تريد تغيير الكفيل بالكامل؟ ابحث عن كفيل آخر
                  </button>
                </div>
              ) : (
                <div className="animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setShowNewGuarantorSearch(false)} className="text-slate-400 hover:text-red-500 font-bold">إلغاء البحث</button>
                  </div>
                  <GuarantorStep
                    ref={guarantorRef}
                    onNext={onFinishUpdate}
                    onBack={() => setShowNewGuarantorSearch(false)}
                  />
                </div>
              )}

              {/* أزرار التحكم السفلية */}
              <div className="mt-10 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <button onClick={() => setCurrentStep(1)} className="px-12 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center justify-center min-w-[140px]">
                  العودة لبيانات المشترك
                </button>

                <button
                  onClick={handleSubmit((data) => {
                    if (showNewGuarantorSearch) {
                      guarantorRef.current?.submitGuarantor();
                    } else {
                      onFinishUpdate(data);
                    }
                  })}
                  disabled={saving}
                  className="w-full md:w-auto px-16 py-4 rounded-2xl gradient-primary text-white font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                  حفظ كافة التعديلات
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}