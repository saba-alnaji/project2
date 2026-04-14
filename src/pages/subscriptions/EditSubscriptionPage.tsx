import { useState, useRef } from "react";
import {
  Search, Save, Loader2, UserCheck, ShieldCheck, PencilLine, X, Plus, UserPlus, Info, FileText
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import SubscriberStep from "@/components/library/SubscriberStep";
import GuarantorStep from "@/components/library/GuarantorStep";
import SubscriptionStep from "@/components/library/SubscriptionStep";

export default function EditSubscriptionPage() {
  const guarantorRef = useRef<any>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"idNumber" | "memberNumber">("idNumber");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewGuarantorSearch, setShowNewGuarantorSearch] = useState(false);

  const [userID, setUserID] = useState<number | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

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

  // --- دوال التحقق المضافة ---
  const arabicOnly = (value: string) => value.replace(/[^\u0621-\u064A\s]/g, "");
  const numbersOnly = (value: string) => value.replace(/\D/g, "");
  const addressValidation = (value: string) => value.replace(/[a-zA-Z]/g, ""); // يمنع الإنجليزية فقط
  const phoneValidation = (value: string) => value.replace(/[^\d+]/g, ""); // أرقام وعلامة + فقط

  const handleInitialSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setMemberData(null);
    setGuarantorData(null);
    setSubscriptionData(null);
    setShowNewGuarantorSearch(false);
    setCurrentStep(1);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/Subscription/search",
        { [searchType]: searchQuery.trim(),status: "Active", pageNumber: 1, pageSize: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.memberInfo) {
        const { memberInfo, guarantorInfo, subscriptionInfo, userID: id } = res.data;
        setUserID(id);
        
        const initialMember = {
          ...memberInfo,
          cityId: (memberInfo.cityId || memberInfo.cityID)?.toString() || "",
          phoneNumbers: memberInfo.phoneNumbers || [""]
        };
        setMemberData(initialMember);

        const initialGuarantor = {
          ...guarantorInfo,
          idnumber: guarantorInfo.idNumber || guarantorInfo.IDNumber || guarantorInfo.idnumber || "",
          phoneNumbers: guarantorInfo.phoneNumbers && guarantorInfo.phoneNumbers.length > 0 ? guarantorInfo.phoneNumbers : [""]
        };
        setGuarantorData(initialGuarantor);
        setSubscriptionData(subscriptionInfo);

        reset(initialGuarantor);
        toast.success("تم جلب بيانات الاشتراك بنجاح");
      } else {
        toast.error("لا يوجد نتائج لهذا البحث");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("انتهت الجلسة، الرجاء تسجيل الدخول مجددًا"); window.location.href = "/login";
        return;
      }
      const serverMessage = error.response?.data?.message || error.response?.data || "حدث خطأ في الاتصال بالسيرفر";
      toast.error("عذراً، لم يكتمل الطلب", { description: serverMessage });
    } finally {
      setSearching(false);
    }
  };

  const handleBackToSubscriber = () => {
    if (showNewGuarantorSearch && guarantorRef.current) {
      const currentValues = guarantorRef.current.getCurrentValues();
      setGuarantorData(currentValues);
    } else {
      setGuarantorData(watch());
    }
    setCurrentStep(1);
  };

  const onFinishUpdate = async (finalGuarantor: any) => {
    const isValidPhones = finalGuarantor.phoneNumbers.every((p: string) => p && /^\d{7,15}$/.test(p.replace('+', ''))) && finalGuarantor.phoneNumbers.length > 0;
    if (!isValidPhones) {
      toast.error("يرجى التأكد من صحة أرقام الجوال"); return;
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
      await axios.put("/api/Subscription/update", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حفظ كافة التعديلات بنجاح"); 
      setMemberData(null);
      setGuarantorData(null);
      setSubscriptionData(null);
      setUserID(null);
      setSearchQuery("");
      setCurrentStep(1);
      setShowNewGuarantorSearch(false);
      reset();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("انتهت الجلسة، الرجاء تسجيل الدخول مجددًا");
        window.location.href = "/login";
        return;
      }
      toast.error("حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقاً");
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
        <div className="flex gap-3 mb-2">
          <PencilLine className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-black text-slate-900">إدارة وتعديل الاشتراك</h1>
        </div>
        <p className="text-slate-500 mr-12">ابحث برقم الهوية أو رقم المشترك لتعديل البيانات</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInitialSearch()}
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
          <div className="flex items-center justify-center gap-4 mb-10 overflow-x-auto py-2">
            <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap",
              currentStep === 1 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}
              onClick={() => setCurrentStep(1)}>
              <UserCheck className="w-5 h-5" /> <span className="text-sm">بيانات المشترك</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap",
              currentStep === 2 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}
              onClick={() => setCurrentStep(2)}>
              <ShieldCheck className="w-5 h-5" /> <span className="text-sm">بيانات الكفيل</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap",
              currentStep === 3 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}
              onClick={() => setCurrentStep(3)}>
              <FileText className="w-5 h-5" /> <span className="text-sm">تفاصيل الاشتراك</span>
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
                          onChange={(e) => setValue("idnumber", numbersOnly(e.target.value))}
                          className={inputClass("idnumber")}
                          dir="ltr"
                          placeholder="9 أرقام فقط"
                        />
                        {errors.idnumber && <p className="text-xs text-destructive mt-1">{errors.idnumber.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700">الوظيفة<span className="text-destructive">*</span></label>
                        <input 
                            {...register("job", { required: "الوظيفة مطلوبة" })} 
                            onChange={(e) => setValue("job", arabicOnly(e.target.value))}
                            className={inputClass("job")} 
                            placeholder="الوظيفة (بالعربي فقط)" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">الاسم الرباعي<span className="text-destructive">*</span></label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input {...register("firstName", { required: true })} onChange={(e) => setValue("firstName", arabicOnly(e.target.value))} className={inputClass("firstName")} placeholder="الأول" />
                        <input {...register("fatherName", { required: true })} onChange={(e) => setValue("fatherName", arabicOnly(e.target.value))} className={inputClass("fatherName")} placeholder="الأب" />
                        <input {...register("grandfatherName", { required: true })} onChange={(e) => setValue("grandfatherName", arabicOnly(e.target.value))} className={inputClass("grandfatherName")} placeholder="الجد" />
                        <input {...register("familyName", { required: true })} onChange={(e) => setValue("familyName", arabicOnly(e.target.value))} className={inputClass("familyName")} placeholder="العائلة" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">العنوان</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input {...register("street")} onChange={(e) => setValue("street", addressValidation(e.target.value))} className={inputClass("street")} placeholder="الشارع" />
                        <input {...register("village")} onChange={(e) => setValue("village", addressValidation(e.target.value))} className={inputClass("village")} placeholder="القرية" />
                        <input {...register("neighborhood")} onChange={(e) => setValue("neighborhood", addressValidation(e.target.value))} className={inputClass("neighborhood")} placeholder="الحي" />
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
                                onChange={(e) => updateMobile(index, phoneValidation(e.target.value))}
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
                            {mobile_numbers[index] && !/^\+?\d{10,15}$/.test(mobile_numbers[index]) && (
                              <p className="text-[10px] text-destructive">تنسيق رقم غير صحيح</p>
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
                    <button onClick={() => setShowNewGuarantorSearch(false)} className="text-slate-400 hover:text-red-500 font-bold">إلغاء البحث والعودة للكفيل الحالي</button>
                  </div>
                  <GuarantorStep
                    ref={guarantorRef}
                    onNext={(data) => {
                       setGuarantorData(data);
                       setCurrentStep(3);
                    }}
                    onBack={() => setShowNewGuarantorSearch(false)}
                    previousGuarantor={guarantorData?.isNew === false ? guarantorData : null}
                    previousFormValues={guarantorData?.isNew === true ? guarantorData : null}
                  />
                </div>
              )}
              
              <div className="mt-10 pt-8 border-t flex justify-between">
                 <button onClick={handleBackToSubscriber} className="w-full md:w-auto px-12 py-3.5 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                     السابق
                 </button>
                  <button 
                      onClick={() => {
                        if (showNewGuarantorSearch) {
                          const newData = guarantorRef.current?.getCurrentValues();
                          if (newData) setGuarantorData(newData);
                        } else {
                          setGuarantorData(watch());
                        }
                        setCurrentStep(3);
                      }} 
                      className="w-full md:w-auto px-12 py-3.5 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      التالي: معاينة الاشتراك 
                    </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card animate-in fade-in slide-in-from-left-4 text-right">
              <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-xl border-b pb-4">
                <FileText className="text-primary w-6 h-6" /> معاينة نهائية للاشتراك
              </div>
              
              <SubscriptionStep
                initialData={subscriptionData}
                isReadOnly={true} 
                onSubmit={async () => {}} 
                onBack={() => setCurrentStep(2)}
                loading={false}
                resetForm={() => {}} 
              />

              <div className="mt-10 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="w-full md:w-auto px-12 py-3.5 rounded-2xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  السابق
                </button>

                <button
                  onClick={() => {
                    if (guarantorData) {
                      onFinishUpdate(guarantorData);
                    } else if (!showNewGuarantorSearch) {
                      handleSubmit(onFinishUpdate)();
                    }
                  }}
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