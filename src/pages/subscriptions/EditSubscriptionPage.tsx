import { useState, useRef } from "react";
import { 
  Search, Save, Loader2, UserCheck, ShieldCheck, 
  ChevronRight, X, Plus, UserPlus, Info 
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات
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
  
  // 2. حالات البيانات
  const [userID, setUserID] = useState<number | null>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);

  // دالة البحث الأولية
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
        setGuarantorData(guarantorInfo);
        toast({ title: "تم جلب بيانات الاشتراك بنجاح" });
      } else {
        toast({ title: "لا يوجد نتائج لهذا البحث", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ في الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const onFinishUpdate = async (finalGuarantor: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        userID: userID,
        memberInfo: memberData,
        guarantorInfo: finalGuarantor 
      };

      await axios.put("https://localhost:8080/api/Subscription/update", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: "تم حفظ كافة التعديلات بنجاح ✅" });
    } catch (error) {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // مساعد لتنسيق المدخلات في فورم الكفيل
  const inputClass = (field: string) => "w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none bg-white";

  return (
    <div className="max-w-5xl mx-auto p-4 pb-20" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900">إدارة وتعديل الاشتراك</h1>
        <p className="text-slate-500 mt-2">ابحث برقم الهوية أو رقم المشترك لتعديل البيانات</p>
      </div>

      {/* بار البحث العلوي المحدث */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm", 
              currentStep === 1 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}>
              <UserCheck className="w-5 h-5" /> بيانات المشترك
            </div>
            <div className="h-px w-16 bg-slate-200 hidden md:block" />
            <div className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm", 
              currentStep === 2 ? "bg-primary text-white scale-105 shadow-lg" : "bg-white text-slate-400 border border-slate-100")}>
              <ShieldCheck className="w-5 h-5" /> بيانات الكفيل
            </div>
          </div>

          {/* محتوى المشترك */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card animate-in fade-in slide-in-from-right-4">
              <SubscriberStep 
                initialData={memberData}
                onNext={(updated) => { setMemberData(updated); setCurrentStep(2); }}
              />
            </div>
          )}

          {/* محتوى الكفيل */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card animate-in fade-in slide-in-from-left-4">
              
              {!showNewGuarantorSearch ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b pb-4 mb-4">
                    <Info className="text-primary w-6 h-6" /> بيانات الكفيل الحالي المرتبط بالاشتراك
                  </div>
                  
                  {/* فورم عرض بيانات الكفيل الحالي (التنسيق الذي طلبته) */}
                  <div className="space-y-5 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">رقم الهوية</label>
                        <input value={guarantorData?.idNumber || guarantorData?.IDNumber || ""} className={inputClass("")} dir="ltr" readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">الوظيفة</label>
                        <input value={guarantorData?.job || ""} className={inputClass("")} readOnly />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">الاسم بالعربي</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <input value={guarantorData?.firstName || ""} className={inputClass("")} readOnly />
                        <input value={guarantorData?.fatherName || ""} className={inputClass("")} readOnly />
                        <input value={guarantorData?.grandfatherName || ""} className={inputClass("")} readOnly />
                        <input value={guarantorData?.familyName || ""} className={inputClass("")} readOnly />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2">العنوان</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input value={guarantorData?.street || ""} className={inputClass("")} readOnly />
                        <input value={guarantorData?.village || ""} className={inputClass("")} readOnly />
                        <input value={guarantorData?.neighborhood || ""} className={inputClass("")} readOnly />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">أرقام الجوال</label>
                      <div className="flex flex-wrap gap-2">
                        {guarantorData?.phoneNumbers?.map((phone: string, idx: number) => (
                          <span key={idx} className="bg-white px-4 py-1 rounded-lg border border-slate-200 font-mono text-sm">
                            {phone}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p 
                    onClick={() => setShowNewGuarantorSearch(true)}
                    className="text-primary font-bold cursor-pointer hover:underline text-center flex items-center justify-center gap-2 py-4 bg-primary/5 rounded-xl border border-dashed border-primary/30 transition-all hover:bg-primary/10"
                  >
                    <UserPlus className="w-5 h-5" /> هل تريد تغيير الكفيل؟ اضغط هنا للبحث عن كفيل جديد
                  </p>
                </div>
              ) : (
                <div className="animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-primary flex items-center gap-2 italic">
                       البحث عن كفيل جديد وتعيينه للاشتراك
                    </h3>
                    <button 
                      onClick={() => setShowNewGuarantorSearch(false)}
                      className="text-slate-400 hover:text-red-500 text-sm font-bold"
                    >
                      إلغاء التغيير
                    </button>
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
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-5 h-5" /> العودة لبيانات المشترك
                </button>

                <button 
                  onClick={() => {
                    if (showNewGuarantorSearch) {
                      guarantorRef.current?.submitGuarantor();
                    } else {
                      onFinishUpdate(guarantorData);
                    }
                  }}
                  disabled={saving}
                  className="w-full md:w-auto px-16 py-4 rounded-2xl gradient-primary text-white font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                  حفظ التعديلات النهائية
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}