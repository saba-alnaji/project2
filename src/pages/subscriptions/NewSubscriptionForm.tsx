import { useState } from "react";
import { CheckCircle, Plus } from "lucide-react";
import axios from "axios";
import StepIndicator from "@/components/library/StepIndicator";
import SubscriberStep, { SubscriberFormData } from "@/components/library/SubscriberStep";
import GuarantorCheckStep from "@/components/library/GuarantorCheckStep";
import GuarantorFormStep from "@/components/library/GuarantorFormStep";
import SubscriptionStep, { SubscriptionFormData } from "@/components/library/SubscriptionStep";

const steps = [
  { id: 1, label: "بيانات المشترك" },
  { id: 2, label: "بيانات الكفيل" },
  { id: 3, label: "تفاصيل الاشتراك" },
];

export default function NewSubscriptionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // States لحفظ البيانات بين الخطوات
  const [subscriberData, setSubscriberData] = useState<SubscriberFormData | null>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [guarantorFormValues, setGuarantorFormValues] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionFormData | null>(null);
  const [isNewGuarantor, setIsNewGuarantor] = useState(false);

  // ================= الخطوة 1: المشترك =================
  const handleSubscriberNext = (data: SubscriberFormData) => {
    setSubscriberData(data);
    setCurrentStep(2);
  };

  // ================= الخطوة 2: الكفيل =================
  const handleGuarantorFound = (data: any) => {
    setIsNewGuarantor(false);
    setGuarantorData(data);
    setGuarantorFormValues(null);
    setCurrentStep(3);
  };

  const handleGuarantorNew = (nationalId: string) => {
    setIsNewGuarantor(true);
    if (!guarantorFormValues) {
      setGuarantorFormValues({ idnumber: nationalId, phoneNumbers: [""] });
    }
  };

  const handleGuarantorFormSubmit = (data: any) => {
    setGuarantorData(data);
    setGuarantorFormValues(data);
    setCurrentStep(3);
  };

  const handleGuarantorBack = (currentFormValues?: any) => {
    if (isNewGuarantor) {
      if (currentFormValues) setGuarantorFormValues(currentFormValues);
      setIsNewGuarantor(false);
    } else {
      setCurrentStep(1);
    }
  };

  // ================= الخطوة 3: الاشتراك والارسال النهائي =================
  const handleSubscriptionBack = (currentValues: SubscriptionFormData) => {
    setSubscriptionData(currentValues); // حفظ البيانات عند الرجوع
    setCurrentStep(2);
  };

  const handleFinalSubmit = async (finalSubData: SubscriptionFormData) => {
    if (!subscriberData || !guarantorData) return;
    setSubscriptionData(finalSubData);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // التوافق التام مع الـ API Body (lowercase ومطابقة للمسميات)
      const apiPayload = {
        memberInfo: {
          firstName: subscriberData.firstName,
          familyName: subscriberData.familyName,
          fatherName: subscriberData.fatherName,
          grandfatherName: subscriberData.grandfatherName,
          firstNameEn: subscriberData.firstNameEn || "",
          familyNameEn: subscriberData.familyNameEn || "",
          birthDate: subscriberData.birthDate,
          gender: subscriberData.gender,
          idnumber: subscriberData.idnumber,
          memberNumber: subscriberData.memberNumber,
          job: subscriberData.job,
          cityId: subscriberData.cityId ? parseInt(subscriberData.cityId.toString()) : 0,
          street: subscriberData.street || "",
          village: subscriberData.village || "",
          neighborhood: subscriberData.neighborhood || "",
          phoneNumbers: subscriberData.phoneNumbers?.filter(n => n.trim()) || [],
        },
        guarantorInfo: {
          firstName: guarantorData.firstName || guarantorData.name?.split(" ")[0] || "",
          familyName: guarantorData.familyName || guarantorData.name?.split(" ").slice(-1)[0] || "",
          fatherName: guarantorData.fatherName || "",
          grandfatherName: guarantorData.grandfatherName || "",
          idnumber: guarantorData.idnumber,
          job: guarantorData.job || "",
          street: guarantorData.street || "",
          village: guarantorData.village || "",
          neighborhood: guarantorData.neighborhood || "",
          phoneNumbers: guarantorData.phoneNumbers || [],
        },
        subscriptionInfo: {
          subscriptionType: finalSubData.subscriptionType,
          startDate: finalSubData.startDate,
          endDate: finalSubData.endDate,
          amount: Number(finalSubData.amount),
          memberClassificationId: Number(finalSubData.memberClassificationId),
          paymentMethodId: Number(finalSubData.paymentMethodId),
          receiptNumber: finalSubData.receiptNumber,
          ledgerNumber: finalSubData.ledgerNumber,
          note: finalSubData.note || "",
        },
      };

      await axios.post("https://localhost:8080/api/Subscription/create", apiPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);
    } catch (error: any) {
      alert("خطأ: " + (error.response?.data?.message || "مشكلة في السيرفر"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3">تم بنجاح</h2>
        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 mx-auto shadow-elevated transition-all">
          <Plus className="w-5 h-5" /> إضافة جديد
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={steps} currentStep={currentStep} />
      <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
        {currentStep === 1 && <SubscriberStep onNext={handleSubscriberNext} initialData={subscriberData} />}
        {currentStep === 2 && (!isNewGuarantor ? (
          <GuarantorCheckStep
            onGuarantorFound={handleGuarantorFound}
            onGuarantorNew={handleGuarantorNew}
            onBack={handleGuarantorBack}
            previousGuarantor={guarantorData || guarantorFormValues}
            previousGuarantorIsNew={!!guarantorFormValues}
          />
        ) : (
          <GuarantorFormStep initialData={guarantorFormValues} onNext={handleGuarantorFormSubmit} onBack={handleGuarantorBack} />
        ))}
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