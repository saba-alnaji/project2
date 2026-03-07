import { useState } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type GuarantorMode = "check" | "form" | "existing";

interface ExistingGuarantor {
  id: string;
  national_id: string;
  name: string;
  job?: string;
  address?: string;
  mobile_numbers?: string[];
}

export default function NewSubscriptionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [subscriberData, setSubscriberData] = useState<SubscriberFormData | null>(null);
  const [guarantorMode, setGuarantorMode] = useState<GuarantorMode>("check");
  const [newGuarantorNationalId, setNewGuarantorNationalId] = useState("");
  const [existingGuarantor, setExistingGuarantor] = useState<ExistingGuarantor | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1 done
  const handleSubscriberNext = (data: SubscriberFormData) => {
    setSubscriberData(data);
    setCurrentStep(2);
    setGuarantorMode("check");
  };

  // Guarantor found in DB
  const handleGuarantorFound = (guarantor: ExistingGuarantor) => {
    setExistingGuarantor(guarantor);
    setGuarantorMode("existing");
    setCurrentStep(3);
  };

  // Guarantor not found → show form
  const handleGuarantorNew = (nationalId: string) => {
    setNewGuarantorNationalId(nationalId);
    setGuarantorMode("form");
  };

  // New guarantor form submitted
  const handleGuarantorFormSubmit = (data: {
    name: string;
    job: string;
    address: string;
    mobile_numbers: string[];
  }) => {
    setExistingGuarantor({
      id: "", // will be created on save
      national_id: newGuarantorNationalId,
      ...data,
    });
    setCurrentStep(3);
  };

  // Final save
  const handleSubscriptionSubmit = async (subData: SubscriptionFormData) => {
    if (!subscriberData || !existingGuarantor) return;
    setLoading(true);

    try {
      let guarantorId = existingGuarantor.id;

      // If new guarantor, insert first
      if (!guarantorId) {
        const { data: gData, error: gError } = await supabase
          .from("guarantors")
          .insert({
            national_id: existingGuarantor.national_id,
            name: existingGuarantor.name,
            job: existingGuarantor.job || null,
            address: existingGuarantor.address || null,
            mobile_numbers: existingGuarantor.mobile_numbers || [],
          })
          .select("id")
          .single();

        if (gError) throw gError;
        guarantorId = gData.id;
      }

      // Insert subscriber
      const { data: sData, error: sError } = await supabase
        .from("subscribers")
        .insert({
          subscriber_number: subscriberData.subscriber_number || null,
          name: subscriberData.name,
          birth_date: subscriberData.birth_date || null,
          gender: subscriberData.gender || null,
          national_id: subscriberData.national_id,
          governorate: subscriberData.governorate || null,
          job: subscriberData.job || null,
          mobile_numbers: subscriberData.mobile_numbers,
          address: subscriberData.address || null,
          guarantor_id: guarantorId,
        })
        .select("id")
        .single();

      if (sError) throw sError;

      // Insert subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          subscriber_id: sData.id,
          duration: subData.duration,
          type: subData.type,
          category: subData.category,
          start_date: subData.start_date,
          end_date: subData.end_date,
          fee: subData.fee,
          payment_method: subData.payment_method,
          receipt_number: subData.receipt_number || null,
          book_number: subData.book_number || null,
          notes: subData.notes || null,
        });

      if (subError) throw subError;

      setSuccess(true);
    } catch (err) {
      console.error("Error saving subscription:", err);
      alert("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSubscriberData(null);
    setGuarantorMode("check");
    setNewGuarantorNationalId("");
    setExistingGuarantor(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-3">تم الحفظ بنجاح!</h2>
        <p className="text-muted-foreground text-lg mb-8">تم إنشاء الاشتراك الجديد بنجاح في النظام</p>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-primary text-white font-bold text-lg shadow-elevated hover:shadow-accent transition-all duration-200"
        >
          <Plus className="w-6 h-6" />
          اشتراك جديد
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
        {currentStep === 1 && (
          <SubscriberStep onNext={handleSubscriberNext} />
        )}

        {currentStep === 2 && guarantorMode === "check" && (
          <GuarantorCheckStep
            onGuarantorFound={handleGuarantorFound}
            onGuarantorNew={handleGuarantorNew}
          />
        )}

        {currentStep === 2 && guarantorMode === "form" && (
          <GuarantorFormStep
            nationalId={newGuarantorNationalId}
            onSubmit={handleGuarantorFormSubmit}
            onBack={() => setGuarantorMode("check")}
          />
        )}

        {currentStep === 3 && (
          <SubscriptionStep
            onSubmit={handleSubscriptionSubmit}
            onBack={() => {
              setCurrentStep(2);
              if (existingGuarantor?.id) {
                setGuarantorMode("check");
              } else {
                setGuarantorMode("form");
              }
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
