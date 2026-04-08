import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  UserCheck, Loader2, RefreshCw, LayoutDashboard, Calendar, 
  Phone, XCircle, ShieldCheck, FileText, CheckCircle2 
} from "lucide-react";

// استيراد الخطوات
import SubscriberStep from "../library/SubscriberStep";
import GuarantorStep from "../library/GuarantorStep";
import SubscriptionStep from "../library/SubscriptionStep";

export default function SubscribersTab() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);

  const guarantorRef = useRef<any>(null);
  // السيت الخاص ببيانات الكفيل (التي عبأها المستخدم أونلاين)
  const [guarantorData, setGuarantorData] = useState<any>(null);

  const loadSubs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/Subscription/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data?.$values || res.data || [];
      setSubs(mapApiDataToForm(rawData));
    } catch (error) {
      toast.error("فشل في تحديث قائمة الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubs(); }, []);

  // دالة المابينج لضمان وصول البيانات بشكل صحيح للمكونات
  const mapApiDataToForm = (rawData: any[]) => {
    return rawData.map((item: any) => {
      return {
        ...item,
        userId: item.userId || item.id,
        // تجهيز بيانات المشترك
        memberInfo: {
          firstName: item.fullName?.split(" ")[0] || "",
          familyName: item.fullName?.split(" ").pop() || "",
          idnumber: item.idNumber || "",
          phoneNumbers: item.phoneNumber ? [item.phoneNumber] : [""],
          cityId: item.cityId || "1",
          job: item.job || "موظف",
          gender: "ذكر"
        },
        // تجهيز بيانات الكفيل القادمة من الأونلاين (لو الباك إند ببعتها بنفس الطلب)
        // إذا كانت الحقول مباشرة في item، نجمعها هنا
        onlineGuarantor: {
          idnumber: item.guarantorIdNumber || "",
          firstName: item.guarantorFirstName || "",
          fatherName: item.guarantorFatherName || "",
          grandfatherName: item.guarantorGrandfatherName || "",
          familyName: item.guarantorFamilyName || "",
          job: item.guarantorJob || "",
          phoneNumbers: item.guarantorPhone ? [item.guarantorPhone] : [""],
          street: item.guarantorStreet || "",
          village: item.guarantorVillage || "",
          neighborhood: item.guarantorNeighborhood || "",
          isNew: true // نعتبرها جديدة ليقوم الفورم بعرضها في الحقول القابلة للتعديل
        }
      };
    });
  };

  const handleFinalAccept = async (financialData: any) => {
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");
      // نأخذ القيم الحالية من الـ Ref الخاص بالكفيل (لضمان أخذ التعديلات التي قام بها الموظف)
      const currentGuarantorValues = guarantorRef.current?.getCurrentValues();

      const payload = {
        userID: parseInt(selectedSub.userId),
        memberInfo: selectedSub.memberInfo,
        guarantorInfo: currentGuarantorValues || guarantorData,
        subscriptionInfo: {
          ...financialData,
          amount: parseFloat(financialData.amount).toString()
        }
      };

      await axios.post(`/api/Subscription/online/accept`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("تم تفعيل الحساب بنجاح");
      setSelectedSub(null);
      loadSubs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء التفعيل");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen" dir="rtl">
      {/* الترويسة والجدول بقيت كما هي لتركيز العمل على المودال */}
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold">طلبات الاشتراك أونلاين</h1>
        <button onClick={loadSubs} className="flex gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold"><RefreshCw className={loading ? "animate-spin" : ""} /> تحديث</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden h-[800px] p-2 border border-slate-100">
        <AgGridTable
          rowData={subs}
          columnDefs={[
            { headerName: "الاسم الكامل", field: "fullName", flex: 1 },
            { headerName: "رقم الهوية", field: "idNumber", width: 150 },
            { 
              headerName: "الإجراءات", 
              width: 280,
              cellRenderer: (p: any) => (
                <div className="flex gap-2 py-1">
                  <button 
                    onClick={() => {
                      setSelectedSub(p.data);
                      setGuarantorData(p.data.onlineGuarantor); // نمرر بيانات الكفيل التي عبأها المستخدم
                      setCurrentStep(1);
                    }}
                    className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:shadow-md transition-all"
                  >
                    مراجعة للتفعيل
                  </button>
                  <button 
                    onClick={() => {/* دالة الرفض */}}
                    className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100"
                  >
                    رفض
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* المودال الذي يتبع منطق صفحة التعديل */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-[2rem] p-0 border-none">
          <div className="p-8 space-y-8 bg-white" dir="rtl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                مراجعة طلب: {selectedSub?.fullName}
              </DialogTitle>
            </DialogHeader>

            {/* Stepper (نفس تصميم صفحة التعديل) */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm", currentStep === 1 ? "bg-primary text-white scale-105" : "bg-white text-slate-400 border")}>
                <UserCheck className="w-5 h-5" /> <span>بيانات المشترك</span>
              </div>
              <div className="h-px w-8 bg-slate-200" />
              <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm", currentStep === 2 ? "bg-primary text-white scale-105" : "bg-white text-slate-400 border")}>
                <ShieldCheck className="w-5 h-5" /> <span>بيانات الكفيل</span>
              </div>
              <div className="h-px w-8 bg-slate-200" />
              <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm", currentStep === 3 ? "bg-primary text-white scale-105" : "bg-white text-slate-400 border")}>
                <FileText className="w-5 h-5" /> <span>تفعيل الاشتراك</span>
              </div>
            </div>

            {/* محتوى الخطوات */}
            <div className="min-h-[450px]">
              {currentStep === 1 && (
                <SubscriberStep 
                  initialData={selectedSub?.memberInfo} 
                  onNext={(updated) => {
                    setSelectedSub({...selectedSub, memberInfo: updated});
                    setCurrentStep(2);
                  }} 
                />
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-left-4">
                  <GuarantorStep 
                    ref={guarantorRef}
                    // السحر هنا: نمرر البيانات القادمة من الأونلاين كقيم أولية للفورم
                    // لتظهر في الحقول (الاسم، الوظيفة، الهوية) بشكل تلقائي
                    previousFormValues={guarantorData} 
                    onNext={(data) => {
                      setGuarantorData(data);
                      setCurrentStep(3);
                    }}
                    onBack={() => setCurrentStep(1)}
                  />
                  {/* زر التنقل للسابق (مثل صفحة التعديل) */}
                  <div className="mt-8 flex justify-between border-t pt-6">
                    <button onClick={() => setCurrentStep(1)} className="px-10 py-3 rounded-xl bg-slate-100 font-bold">السابق</button>
                    <button 
                      onClick={() => {
                        const vals = guarantorRef.current?.getCurrentValues();
                        if(vals) setGuarantorData(vals);
                        setCurrentStep(3);
                      }} 
                      className="px-10 py-3 rounded-xl bg-primary text-white font-bold"
                    >
                      التالي: التفعيل المالي
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <SubscriptionStep 
                  loading={submitLoading}
                  onSubmit={handleFinalAccept}
                  onBack={() => setCurrentStep(2)}
                  resetForm={() => setSelectedSub(null)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}