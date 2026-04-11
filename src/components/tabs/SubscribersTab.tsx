import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { cn } from "@/lib/utils";
import { useForm, FormProvider } from "react-hook-form";
import Swal from "sweetalert2";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCheck, RefreshCw, ShieldCheck, FileText, Eye, Info, UserPlus, Plus, X, Trash2, Clock } from "lucide-react";
import SubscriberStep from "../library/SubscriberStep";
import GuarantorStep from "../library/GuarantorStep";
import SubscriptionStep from "../library/SubscriptionStep";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject("Unauthorized");
    }
    return Promise.reject(error);
  }
);

const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const validationFilters = {
  arabic: (v: string) => v.replace(/[^\u0621-\u064A\s]/g, ""),
  numbers: (v: string) => v.replace(/\D/g, ""),
  address: (v: string) => v.replace(/[a-zA-Z]/g, ""),
  phone: (v: string) => v.replace(/[^\d+]/g, ""),
};

export default function SubscribersTab() {
  // --- States ---
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showNewGuarantorSearch, setShowNewGuarantorSearch] = useState(false);

  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const guarantorRef = useRef<any>(null);

  // --- React Hook Form ---
  const methods = useForm({
    defaultValues: {
      idnumber: "", firstName: "", fatherName: "", grandfatherName: "",
      familyName: "", job: "", street: "", village: "",
      neighborhood: "", phoneNumbers: [""]
    }
  });

  const { register, watch, reset, setValue, getValues, formState: { errors } } = methods;
  const mobile_numbers = watch("phoneNumbers") || [""];

  // --- API Actions ---
  const loadSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/Subscription/pending`, { headers: getAuthHeader() });
      setSubs(res.data?.$values || res.data || []);
    } catch (error) {
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAutoReject = async () => {
    setIsCleaning(true);
    try {
      const res = await axios.post(`/api/Subscription/auto-reject`, {}, { headers: getAuthHeader() });
      toast.success(res.data.message || "تم تنظيف طلبات الاشتراك المنتهية");
      loadSubs();
    } catch (error: any) {
      if (error !== "Unauthorized") {
        toast.error("فشل في عملية تنظيف الطلبات");
      }
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => { loadSubs(); }, []);

  useEffect(() => {
    if (showNewGuarantorSearch) return;
    if (currentStep === 2 && selectedSub?.fullOnlineData?.guarantorInfo && !guarantorData) {
      const info = selectedSub.fullOnlineData.guarantorInfo;
      reset(info);
      setGuarantorData(info);
    }
    else if (currentStep === 2 && guarantorData) {
      reset(guarantorData);
    }
  }, [currentStep, selectedSub, showNewGuarantorSearch]);

  const handleReview = async (rowData: any) => {
    const idNum = rowData.idNumber || rowData.memberInfo?.idnumber;
    if (!idNum) return toast.error("رقم الهوية غير متوفر");

    setLoading(true);
    try {
      const res = await axios.post(`/api/Subscription/search`,
        { idNumber: idNum.toString(), status: "Pending" },
        { headers: getAuthHeader() }
      );

      const fullData = res.data?.$values?.[0] || res.data[0] || res.data;
      if (!fullData?.memberInfo) throw new Error();

      setSelectedSub({
        ...fullData,
        fullOnlineData: {
          memberInfo: { ...fullData.memberInfo, cityId: String(fullData.memberInfo?.cityId || "") },
          guarantorInfo: { ...fullData.guarantorInfo, idnumber: fullData.guarantorInfo?.idNumber || fullData.guarantorInfo?.idnumber || "" }
        }
      });

      setGuarantorData(null);
      setFinancialData(null);
      setShowNewGuarantorSearch(false);
      setCurrentStep(1);
      reset();
    } catch (error) {
      toast.error("فشل في جلب البيانات الكاملة");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSubscriber = () => {
    if (!showNewGuarantorSearch) {
      setGuarantorData(getValues());
    }
    setCurrentStep(1);
  };

  const handleFinalSubmit = async (fData: any) => {
    if (submitLoading) return null;
    setSubmitLoading(true);
    try {
      const finalPayload = {
        userID: selectedSub.userID,
        memberInfo: selectedSub.fullOnlineData.memberInfo,
        guarantorInfo: { ...guarantorData, idNumber: guarantorData.idnumber },
        subscriptionInfo: {
          ...fData,
          amount: Number(fData.amount),
          memberClassificationId: Number(fData.memberClassificationId),
          paymentMethodId: Number(fData.paymentMethodId),
        }
      };
      const res = await axios.post(`/api/Subscription/online/accept`, finalPayload, { headers: getAuthHeader() });

      loadSubs();
      return res.data;

    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل في إتمام العملية");
      return null;
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReject = async (rowData: any) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم رفض طلب ${rowData.fullName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'نعم، ارفض الطلب',
      cancelButtonText: 'تراجع',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const searchRes = await axios.post(
        `/api/Subscription/search`,
        {
          idNumber: rowData.idNumber.toString(),
          status: "Pending"
        },
        { headers: getAuthHeader() }
      );

      const userId = searchRes.data?.userID;

      if (!userId) {
        toast.error("فشل العثور على المعرف الخاص بالمستخدم (UserID)");
        return;
      }

      await axios.post(`/api/Subscription/online/reject/${userId}`, {}, { headers: getAuthHeader() });

      toast.success("تم رفض الطلب بنجاح");

      setSubs(prev => prev.filter(item => item.idNumber !== rowData.idNumber));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "فشل في رفض الطلب");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName: string) => cn(
    "w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none bg-white transition-all",
    errors[fieldName as any] && "border-destructive focus:border-destructive"
  );

  return (
    <div className="p-6 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">طلبات الأونلاين</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">مراجعة الطلبات المعلقة وتفعيلها</p>
            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
            <div className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100 font-bold">
              <Clock className="w-3 h-3" />
              صلاحية الطلب 48 ساعة
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoReject}
            disabled={isCleaning || loading}
            className="flex items-center gap-2 rounded-xl h-11 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 font-bold px-4 transition-all disabled:opacity-50"
          >
            <Trash2 className={`w-4 h-4 ${isCleaning ? 'animate-bounce' : ''}`} />
            {isCleaning ? "جاري التنظيف..." : "تنظيف المنتهي"}
          </button>

          
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-xl border h-[500px] overflow-hidden p-2">
        <AgGridTable
          rowData={subs}
          columnDefs={[
            { headerName: "الاسم الكامل", field: "fullName", flex: 1.2, minWidth: 200 },
            { headerName: "رقم الهوية", field: "idNumber", width: 140 },
            { headerName: "رقم الجوال", field: "phoneNumber", width: 140 },
            { headerName: "العنوان", field: "address", flex: 1, minWidth: 200 },
            {
              headerName: "تاريخ الطلب",
              field: "requestDate",
              width: 150,
              valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : ''
            },
            {
              headerName: "الإجراءات",
              field: "actions",
              width: 220,
              sortable: false,
              filter: false,
              cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
              cellRenderer: (p: any) => (
                <div className="flex items-center gap-2 h-full py-1">
                  <button
                    onClick={() => handleReview(p.data)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>مراجعة</span>
                  </button>

                  <button
                    onClick={() => handleReject(p.data)}
                    className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6 border-b pb-4 text-right">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <UserCheck className="text-primary" /> مراجعة طلب الاشتراك
            </DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mb-10 py-2">
            {[
              { s: 1, n: "المشترك", i: UserCheck },
              { s: 2, n: "الكفيل", i: ShieldCheck },
              { s: 3, n: "المالية", i: FileText }
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-2xl font-bold transition-all",
                  currentStep === step.s ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-400"
                )}>
                  <step.i className="w-5 h-5" /> <span>{step.n}</span>
                </div>
                {idx < 2 && <div className="h-px w-8 bg-slate-200" />}
              </div>
            ))}
          </div>

          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <SubscriberStep
                initialData={selectedSub?.fullOnlineData?.memberInfo}
                onNext={(val) => {
                  setSelectedSub({ ...selectedSub, fullOnlineData: { ...selectedSub.fullOnlineData, memberInfo: val } });
                  setCurrentStep(2);
                }}
              />
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 animate-in fade-in slide-in-from-left-4">
                {!showNewGuarantorSearch ? (
                  <FormProvider {...methods}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                          <Info className="text-primary w-6 h-6" /> بيانات الكفيل الحالية (قابلة للتعديل)
                        </div>
                      </div>

                      <div className="space-y-5 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-1">رقم الهوية <span className="text-destructive">*</span></label>
                            <input {...register("idnumber", { required: true, pattern: /^\d{9}$/ })}
                              onChange={(e) => setValue("idnumber", validationFilters.numbers(e.target.value))}
                              className={inputClass("idnumber")} dir="ltr" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1">الوظيفة <span className="text-destructive">*</span></label>
                            <input {...register("job", { required: true })}
                              onChange={(e) => setValue("job", validationFilters.arabic(e.target.value))}
                              className={inputClass("job")} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">الاسم الرباعي <span className="text-destructive">*</span></label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <input {...register("firstName", { required: true })} onChange={(e) => setValue("firstName", validationFilters.arabic(e.target.value))} className={inputClass("firstName")} placeholder="الأول" />
                            <input {...register("fatherName", { required: true })} onChange={(e) => setValue("fatherName", validationFilters.arabic(e.target.value))} className={inputClass("fatherName")} placeholder="الأب" />
                            <input {...register("grandfatherName", { required: true })} onChange={(e) => setValue("grandfatherName", validationFilters.arabic(e.target.value))} className={inputClass("grandfatherName")} placeholder="الجد" />
                            <input {...register("familyName", { required: true })} onChange={(e) => setValue("familyName", validationFilters.arabic(e.target.value))} className={inputClass("familyName")} placeholder="العائلة" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">العنوان</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input {...register("street")} onChange={(e) => setValue("street", validationFilters.address(e.target.value))} className={inputClass("street")} placeholder="الشارع" />
                            <input {...register("village")} onChange={(e) => setValue("village", validationFilters.address(e.target.value))} className={inputClass("village")} placeholder="القرية" />
                            <input {...register("neighborhood")} onChange={(e) => setValue("neighborhood", validationFilters.address(e.target.value))} className={inputClass("neighborhood")} placeholder="الحي" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">أرقام الجوال <span className="text-destructive">*</span></label>
                          <div className="space-y-2">
                            {mobile_numbers.map((_, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  value={mobile_numbers[index] || ""}
                                  onChange={(e) => {
                                    const newPhones = [...mobile_numbers];
                                    newPhones[index] = validationFilters.phone(e.target.value);
                                    setValue("phoneNumbers", newPhones);
                                  }}
                                  className={cn(inputClass("phoneNumbers"), "flex-1")} dir="ltr"
                                />
                                {mobile_numbers.length > 1 && (
                                  <button type="button" onClick={() => setValue("phoneNumbers", mobile_numbers.filter((_, i) => i !== index))} className="text-destructive p-2 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => setValue("phoneNumbers", [...mobile_numbers, ""])} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                              <Plus className="w-4 h-4" /> إضافة رقم آخر
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setGuarantorData(null);
                          setShowNewGuarantorSearch(true);
                        }}
                        className="w-full text-primary font-bold py-4 bg-primary/5 rounded-xl border border-dashed border-primary/30 hover:bg-primary/10 transition-colors"
                      >
                        <UserPlus className="w-5 h-5 inline-block ml-2" /> هل تريد تغيير الكفيل بالكامل؟ ابحث عن كفيل آخر
                      </button>
                    </div>
                  </FormProvider>
                ) : (
                  <div className="animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => {
                          if (selectedSub?.fullOnlineData?.guarantorInfo) {
                            const originalGuarantor = selectedSub.fullOnlineData.guarantorInfo;
                            setGuarantorData(originalGuarantor);
                            reset(originalGuarantor);
                          }
                          setShowNewGuarantorSearch(false);
                        }}
                        className="text-slate-400 hover:text-red-500 font-bold transition-colors"
                      >
                        إلغاء البحث والعودة للكفيل الحالي
                      </button>
                    </div>
                    <GuarantorStep
                      ref={guarantorRef}
                      previousGuarantor={guarantorData}
                      onNext={(data) => {
                        setGuarantorData(data);
                        setCurrentStep(3);
                      }}
                      onBack={() => {
                        if (selectedSub?.fullOnlineData?.guarantorInfo) {
                          setGuarantorData(selectedSub.fullOnlineData.guarantorInfo);
                        }
                        setShowNewGuarantorSearch(false);
                      }}
                    />
                  </div>
                )}

                <div className="mt-10 pt-8 border-t flex justify-between gap-4">
                  <button
                    onClick={() => {
                      if (showNewGuarantorSearch) {
                        setGuarantorData(guarantorRef.current?.getCurrentValues());
                      } else {
                        setGuarantorData(getValues());
                      }
                      setCurrentStep(1);
                    }}
                    className="px-12 py-3.5 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    السابق
                  </button>

                  <button
                    onClick={() => {
                      let dataToSave;
                      if (showNewGuarantorSearch) {
                        dataToSave = guarantorRef.current?.getCurrentValues();
                      } else {
                        dataToSave = getValues();
                      }

                      if (dataToSave) {
                        setGuarantorData(dataToSave);
                        setCurrentStep(3);
                      }
                    }}
                    className="px-12 py-3.5 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <SubscriptionStep
                initialData={financialData}
                loading={submitLoading}
                onSubmit={handleFinalSubmit}
                onBack={(data: any) => { setFinancialData(data); setCurrentStep(2); }}
                resetForm={() => {
                  setSelectedSub(null);
                  setCurrentStep(1);
                  reset();
                  setFinancialData(null);
                  setShowNewGuarantorSearch(false);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}