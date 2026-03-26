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

  const [subscriberData, setSubscriberData] = useState<SubscriberFormData | null>(null);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [guarantorFormValues, setGuarantorFormValues] = useState<any>(null);
  const [isNewGuarantor, setIsNewGuarantor] = useState(false);

  // ================= Step 1 =================
  const handleSubscriberNext = (data: SubscriberFormData) => {
    setSubscriberData(data);
    setCurrentStep(2);
  };

  // ================= Step 2 (موجود) =================
  const handleGuarantorFound = (data: any) => {
    setIsNewGuarantor(false);
    setGuarantorData(data);
    setGuarantorFormValues(null);
    setCurrentStep(3);
  };

  // ================= Step 2 (جديد) =================
  const handleGuarantorNew = (nationalId: string) => {
    setIsNewGuarantor(true);
    if (!guarantorFormValues) {
      setGuarantorFormValues({ national_id: nationalId, mobile_numbers: [""] });
    }
  };

  // ================= فورم الكفيل =================
  const handleGuarantorFormSubmit = (data: any) => {
    setGuarantorData(data);
    setGuarantorFormValues(data);
    setCurrentStep(3);
  };

  // ================= رجوع =================
  const handleGuarantorBack = () => {
    if (isNewGuarantor) {
      setIsNewGuarantor(false);
    } else {
      setCurrentStep(1);
    }
  };

  // ================= Submit =================
  const handleFinalSubmit = async (subscriptionData: SubscriptionFormData) => {
    if (!subscriberData || !guarantorData) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const apiPayload = {
        memberInfo: {
          firstName: (subscriberData as any).first_name,
          familyName: (subscriberData as any).last_name,
          fatherName: (subscriberData as any).father_name,
          grandfatherName: (subscriberData as any).grandfather_name,
          firstNameEn: (subscriberData as any).first_name_en,
          familyNameEn: (subscriberData as any).last_name_en,
          birthDate: subscriberData.birth_date,
          gender: subscriberData.gender,
          idnumber: subscriberData.national_id,
          memberNumber: subscriberData.subscriber_number,
          job: subscriberData.job,
          cityId: parseInt((subscriberData as any).cityId),
          street: (subscriberData as any).address_street,
          village: (subscriberData as any).address_town,
          neighborhood: (subscriberData as any).address_neighborhood,
          phoneNumbers: subscriberData.mobile_numbers.filter((m: string) => m.trim()),
        },
        guarantorInfo: {
          firstName: guarantorData.first_name || guarantorData.name?.split(" ")[0] || "",
          familyName: guarantorData.last_name || guarantorData.name?.split(" ").slice(-1)[0] || "",
          fatherName: guarantorData.father_name || "",
          grandfatherName: guarantorData.grandfather_name || "",
          idnumber: guarantorData.national_id || guarantorData.idnumber,
          job: guarantorData.job,
          street: guarantorData.address_street || "",
          village: guarantorData.address_town || guarantorData.village || "",
          neighborhood: guarantorData.address_neighborhood || guarantorData.neighborhood || "",
          phoneNumbers: guarantorData.mobile_numbers || guarantorData.phoneNumbers || [],
        },
        subscriptionInfo: {
          subscriptionType: subscriptionData.type,
          startDate: subscriptionData.start_date,
          endDate: subscriptionData.end_date,
          amount: parseFloat(subscriptionData.fee.toString()),
          receiptNumber: subscriptionData.receipt_number,
          notes: subscriptionData.notes,
        },
      };

      await axios.post("https://localhost:8080/api/Subscription/create", apiPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess(true);
    } catch (error: any) {
      alert("خطأ: " + (error.response?.data?.message || "مشكلة في السيرفر"));
    } finally {
      setLoading(false);
    }
  };

  // ================= Success UI =================
  if (success) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3">تم بنجاح</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 mx-auto shadow-elevated hover:shadow-accent transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          إضافة جديد
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
        {/* Step 1 */}
        {currentStep === 1 && (
          <SubscriberStep onNext={handleSubscriberNext} initialData={subscriberData} />
        )}

        {/* Step 2 */}
        {currentStep === 2 &&
          (!isNewGuarantor ? (
            <GuarantorCheckStep
              onGuarantorFound={handleGuarantorFound}
              onGuarantorNew={handleGuarantorNew}
              onBack={handleGuarantorBack}
              previousGuarantor={guarantorData}
            />
          ) : (
            <GuarantorFormStep
              initialData={guarantorFormValues}
              onNext={handleGuarantorFormSubmit}
              onBack={handleGuarantorBack}
            />
          ))}

        {/* Step 3 */}
        {currentStep === 3 && (
          <SubscriptionStep
            onSubmit={handleFinalSubmit}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
