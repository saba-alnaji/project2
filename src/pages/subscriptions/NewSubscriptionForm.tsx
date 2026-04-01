import { useState, useRef } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from "@/components/library/StepIndicator";
import SubscriberStep from "@/components/library/SubscriberStep";
import type { SubscriberFormData } from "@/components/library/SubscriberStep";
import GuarantorStep from "@/components/library/GuarantorStep";
import SubscriptionStep from "@/components/library/SubscriptionStep";
import type { SubscriptionFormData } from "@/components/library/SubscriptionStep";

const steps = [
  { id: 1, label: "بيانات المشترك" },
  { id: 2, label: "بيانات الكفيل" },
  { id: 3, label: "تفاصيل الاشتراك" },
];

export default function NewSubscriptionForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const guarantorRef = useRef<any>(null);

  const [subscriberData, setSubscriberData] = useState<SubscriberFormData | null>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionFormData | null>(null);

  // دالة لإعادة ضبط الفورم والعودة للبداية
  const resetForm = () => {
    setSubscriberData(null);
    setGuarantorData(null);
    setSubscriptionData(null);
    setCurrentStep(1);
    setSuccess(false);
  };

  // ================= الخطوة 1: المشترك =================
  const handleSubscriberNext = (data: SubscriberFormData) => {
    setSubscriberData(data);
    setCurrentStep(2);
  };

  // ================= الخطوة 2: الكفيل =================
  const handleGuarantorNext = (data: any) => {
    setGuarantorData(data);
    setCurrentStep(3);
  };

  const triggerGuarantorSubmit = () => {
    if (guarantorRef.current) {
      guarantorRef.current.submitGuarantor();
    }
  };

  const handleGuarantorBack = () => {
    if (guarantorRef.current) {
      const currentValues = guarantorRef.current.getCurrentValues();
      if (currentValues?.idnumber || currentValues?.IDNumber) {
        setGuarantorData(currentValues);
      } else {
        setGuarantorData(null);
      }
    }
    setCurrentStep(1);
  };

  // ================= الخطوة 3: الاشتراك =================
  const handleSubscriptionBack = (currentValues: SubscriptionFormData) => {
    setSubscriptionData(currentValues);
    setCurrentStep(2);
  };

const handleFinalSubmit = async (finalSubData: SubscriptionFormData) => {
    if (!subscriberData || !guarantorData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiPayload = {
        memberInfo: {
          ...subscriberData,
          cityId: subscriberData.cityId ? Number(subscriberData.cityId) : null
        },
        guarantorInfo: {
          firstName: guarantorData?.firstName || "",
          fatherName: guarantorData?.fatherName || "",
          grandfatherName: guarantorData?.grandfatherName || "",
          familyName: guarantorData?.familyName || "",
          IDNumber: String(guarantorData.idnumber || guarantorData.IDNumber || ""),
          job: guarantorData?.job || "",
          neighborhood: guarantorData?.neighborhood || "",
          street: guarantorData?.street || "",
          village: guarantorData?.village || "",
          phoneNumbers: Array.isArray(guarantorData?.phoneNumbers)
            ? guarantorData.phoneNumbers.filter((n: any) => n && String(n).trim() !== "")
            : []
        },
        subscriptionInfo: {
          ...finalSubData,
          memberClassificationId: Number(finalSubData.memberClassificationId),
          paymentMethodId: Number(finalSubData.paymentMethodId),
          amount: Number(finalSubData.amount)
        }
      };
      await axios.post("https://localhost:8080/api/Subscription/create", apiPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: "تم تسجيل الاشتراك بنجاح ✅" });
      resetForm(); 

    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        toast({  title: "انتهت الجلسة، الرجاء تسجيل الدخول مجددًا", variant: "destructive" });
        window.location.href = "/login";
        return;
      }

      toast({
        variant: "destructive",
        title: "خطأ في الحفظ ❌",
        description: error.response?.data?.message || "تعذر الاتصال بالسيرفر."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto ">
      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card border border-border mt-8 h-auto transition-all duration-500">

        {currentStep === 1 && (
          <SubscriberStep
            onNext={handleSubscriberNext}
            initialData={subscriberData}
          />
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col">
            <GuarantorStep
              ref={guarantorRef}
              onNext={handleGuarantorNext}
              onBack={handleGuarantorBack}
              previousGuarantor={guarantorData?.isNew === false ? guarantorData : null}
              previousFormValues={guarantorData?.isNew === true ? guarantorData : null}
            />

            <div className="flex flex-row justify-between items-center gap-4 mt-10 pt-6  border-border">
              <button
                type="button"
                onClick={handleGuarantorBack}
                className="px-12 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center justify-center min-w-[140px]"
              >
                السابق
              </button>

              <button
                type="button"
                onClick={triggerGuarantorSubmit}
                className="px-12 py-3 rounded-xl gradient-primary text-white font-bold shadow-card hover:shadow-elevated transition-all flex items-center justify-center min-w-[140px]"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <SubscriptionStep
            onSubmit={handleFinalSubmit}
            onBack={handleSubscriptionBack}
            loading={loading}
            initialData={subscriptionData}
          />
        )}
      </div>
    </div>
  );
}