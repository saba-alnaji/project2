import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, RefreshCw, CheckCircle, UserCheck, BookOpen, CreditCard, RotateCcw, Save, Wallet} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";

// Helper لزيادة سنة
const calculateEndDate = (startDateStr: string) => {
  if (!startDateStr) return "";
  const date = new Date(startDateStr);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
};

const today = new Date().toISOString().split("T")[0];

const renewSchema = z.object({
  subscriptionType: z.string().min(1, "نوع الاشتراك مطلوب"),
  memberClassificationId: z.coerce.number().min(1, "تصنيف المشترك مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  amount: z.coerce.number().min(0, "الرسوم يجب أن تكون 0 أو أكثر"),
  paymentMethodId: z.coerce.number().min(1, "طريقة الدفع مطلوبة"),
  receiptNumber: z.string().min(1, "رقم الوصل مطلوب"),
  ledgerNumber: z.string().min(1, "رقم الدفتر مطلوب"),
  note: z.string().optional().default(""),
});

type RenewFormData = z.infer<typeof renewSchema>;

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

export default function RenewSubscriptionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"idNumber" | "memberNumber">("idNumber");
  const [searching, setSearching] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [classifications, setClassifications] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      subscriptionType: "مكتبة عامة",
      memberClassificationId: 1,
      startDate: today,
      endDate: calculateEndDate(today),
      amount: 35,
      paymentMethodId: 1,
      receiptNumber: "",
      ledgerNumber: "",
      note: "",
    },
  });

  const watchedStartDate = watch("startDate");
  const categoryId = watch("memberClassificationId");
  const amount = watch("amount");

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [resClass, resMethods] = await Promise.all([
          axios.get("/api/MemberClassification", { headers }),
          axios.get("/api/PaymentMethod", { headers })
        ]);
        setClassifications(resClass.data);
        setPaymentMethods(resMethods.data);
      } catch (e: any) {
        console.error("خطأ في جلب البيانات الأساسية:", e);
      }
    };
    fetchMetaData();
  }, []);

  useEffect(() => {
    if (watchedStartDate) {
      setValue("endDate", calculateEndDate(watchedStartDate));
    }
  }, [watchedStartDate, setValue]);

  useEffect(() => {
    const selected = classifications.find(c => Number(c.memberClassificationID) === Number(categoryId));
    if (selected) {
      const name = selected.memberClassificationName;
      if (name === "طالب") setValue("amount", 25);
      else if (name === "شخص") setValue("amount", 35);
      else if (name === "موظف بلدية") setValue("amount", 0);
    }
  }, [categoryId, classifications, setValue]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSubscriber(null);

    try {
      const token = localStorage.getItem("token");
      const body = {
        idNumber: searchType === "idNumber" ? searchQuery.trim() : null,
        memberNumber: searchType === "memberNumber" ? searchQuery.trim() : null,
        status: null
      };

      const resSearch = await axios.post("/api/Subscription/search", body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = Array.isArray(resSearch.data) ? resSearch.data[0] : resSearch.data;

      if (!data || !data.memberInfo) {
        toast.error("عذراً، المشترك غير موجود"); return;
      }

      const [resPayments, resLoans] = await Promise.all([
        axios.post("/api/Subscription/payment-history", body, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post("/api/Borrow/Borrow-history",
          { ...body, pageNumber: 1, pageSize: 50 }, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setSubscriber({
        ...data,
        paymentHistory: resPayments.data || [],
        loanHistory: resLoans.data.data || []
      });

      toast.success("تم جلب بيانات المشترك بنجاح");
    } catch (e: any) {
      toast.error("حدث خطأ أثناء البحث");
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (formData: RenewFormData) => {
    setRenewing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/Subscription/renew", {
        userID: subscriber.userID,
        subscriptionInfo: formData
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("تم تجديد الاشتراك بنجاح");
      setSuccess(true);
    } catch (e: any) {
      const msg = e.response?.data?.message || "فشل التجديد";
      toast.error(msg);
    } finally {
      setRenewing(false);
    }
  };

  const isActive = subscriber?.subscriptionInfo?.endDate ? new Date(subscriber.subscriptionInfo.endDate) > new Date() : false;

  // تعريف الأعمدة المحدثة بناءً على الـ API
  const paymentColumns = [
    { field: "paymentDate", headerName: "تاريخ الدفع", flex: 1.2, cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-" },
    { field: "amount", headerName: "المبلغ", flex: 0.8, cellRenderer: (p: any) => `${p.value} ₪` },
    { field: "paymentMethod", headerName: "طريقة الدفع", flex: 1 },
    { field: "subscriptionType", headerName: "نوع الاشتراك", flex: 1.2 },
    { field: "createdBy", headerName: "بواسطة", flex: 1 },
  ];

  const loanColumns = [
    { field: "serial", headerName: "رقم التسلسل", flex: 0.7 },
    { field: "bookName", headerName: "عنوان الكتاب", flex: 2 },
    { field: "borrowDate", headerName: "تاريخ الإعارة", flex: 1, cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-" },
    { field: "returnDate", headerName: "تاريخ الإرجاع", flex: 1, cellRenderer: (p: any) => {
      if (p.value) {
        return new Date(p.value).toLocaleDateString('ar-EG');
      }
      return <span className="text-green-600 font-bold">قيد الإعارة</span>;
    }
  },    { field: "createdBy", headerName: "الموظف", flex: 1 },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4" dir="rtl">
      {/* العنوان */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20 shadow-sm">
          <RotateCcw className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">تجديد الاشتراك</h1>
          <p className="text-muted-foreground font-medium">تحديث وتجديد ملفات المشتركين المالية</p>
        </div>
      </div>

     {/* قسم البحث */}
<div className="bg-white rounded-2xl p-4 border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row gap-3">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    // إضافة هذا الجزء هنا
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    }}
    placeholder={searchType === "idNumber" ? "أدخل رقم الهوية..." : "أدخل رقم المشترك..."}
    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none"
  />
  
  <select
    value={searchType}
    onChange={(e) => setSearchType(e.target.value as any)}
    className="md:w-48 px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-primary bg-slate-50 outline-none cursor-pointer"
  >
    <option value="idNumber">رقم الهوية</option>
    <option value="memberNumber">رقم المشترك</option>
  </select>

  <button
    onClick={handleSearch}
    disabled={searching}
    className="px-10 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
  >
    {searching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
    بحث
  </button>
</div>

      {success ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border shadow-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">تمت عملية التجديد بنجاح!</h2>
          <button 
            onClick={() => { setSuccess(false); setSubscriber(null); reset(); setSearchQuery(""); }} 
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold"
          >
            تجديد لمشترك آخر
          </button>
        </div>
      ) : subscriber && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10">
          
          {/* كارت معلومات المشترك */}
          <div className="bg-card rounded-2xl p-6 border-2 border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCheck className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{subscriber.memberInfo?.firstName} {subscriber.memberInfo?.familyName}</h3>
                <p className="text-sm text-muted-foreground">رقم الهوية: {subscriber.memberInfo?.idnumber}</p>
              </div>
            </div>
            <span className={`px-6 py-1 rounded-full text-sm font-bold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isActive ? "فعال" : "منتهي الصلاحية/غير مشترك"}
            </span>
          </div>

          {/* تفاصيل الاشتراك المالي */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">تفاصيل الاشتراك المالي</h2>
              <p className="text-muted-foreground text-sm">أدخل بيانات التحصيل وتاريخ الصلاحية الجديد</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">نوع الاشتراك <span className="text-red-500">*</span></label>
                  <Controller name="subscriptionType" control={control} render={({ field }) => (
                    <select {...field} className={inputClass}>
                      <option value="مكتبة عامة">مكتبة عامة</option>
                      <option value="مكتبة أطفال">مكتبة أطفال</option>
                    </select>
                  )} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">تصنيف المشترك <span className="text-red-500">*</span></label>
                  <Controller name="memberClassificationId" control={control} render={({ field }) => (
                    <select {...field} className={inputClass} onChange={(e) => field.onChange(Number(e.target.value))}>
                      {classifications.map((c) => (
                        <option key={c.memberClassificationID} value={c.memberClassificationID}>{c.memberClassificationName}</option>
                      ))}
                    </select>
                  )} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">الرسوم (شيكل) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Controller name="amount" control={control} render={({ field }) => (
                      <input type="number" {...field} className={cn(inputClass, "font-bold text-lg pr-10 pl-3")} dir="ltr" />
                    )} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₪</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">طريقة الدفع <span className="text-red-500">*</span></label>
                  <Controller name="paymentMethodId" control={control} render={({ field }) => (
                    <select {...field} className={inputClass} onChange={(e) => field.onChange(Number(e.target.value))}>
                      {paymentMethods.map((m) => (
                        <option key={m.paymentMethodID} value={m.paymentMethodID}>{m.paymentMethodName}</option>
                      ))}
                    </select>
                  )} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">تاريخ بداية الاشتراك (تلقائي)</label>
                  <Controller name="startDate" control={control} render={({ field }) => (
                    <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed opacity-80")} dir="ltr" />
                  )} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">تاريخ نهاية الاشتراك (تلقائي)</label>
                  <Controller name="endDate" control={control} render={({ field }) => (
                    <input type="date" {...field} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed opacity-80")} dir="ltr" />
                  )} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">رقم الوصل <span className="text-red-500">*</span></label>
                  <Controller name="receiptNumber" control={control} render={({ field }) => (
                    <input {...field} placeholder="أدخل رقم الوصل" className={inputClass} dir="ltr" />
                  )} />
                  {errors.receiptNumber && <p className="text-red-500 text-xs mt-1">{errors.receiptNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">رقم الدفتر <span className="text-red-500">*</span></label>
                  <Controller name="ledgerNumber" control={control} render={({ field }) => (
                    <input {...field} placeholder="أدخل رقم الدفتر" className={inputClass} dir="ltr" />
                  )} />
                  {errors.ledgerNumber && <p className="text-red-500 text-xs mt-1">{errors.ledgerNumber.message}</p>}
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex justify-between items-center">
                <span className="font-bold text-lg">إجمالي المبلغ المطلوب:</span>
                <span className="text-3xl font-black text-primary">{Number(amount).toFixed(2)} ₪</span>
              </div>

              <button
                type="submit"
                disabled={renewing}
                className="w-full py-4 bg-primary text-white rounded-xl font-black text-xl shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {renewing ? <RefreshCw className="animate-spin" /> : <Save />}
                {renewing ? "جاري المعالجة..." : "تأكيد تجديد الاشتراك"}
              </button>
            </form>
          </div>

          {/* الجداول السفلى - مع إصلاح الارتفاع والأعمدة المحدثة */}
          <div className="bg-card rounded-2xl p-6 border border-border h-[450px] shadow-sm flex flex-col transition-all">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary shrink-0">
              <CreditCard className="w-5 h-5" /> سجل المدفوعات السابق
            </h3>
            <div className="flex-1 min-h-0">
              <AgGridTable
                rowData={subscriber.paymentHistory}
                columnDefs={paymentColumns}
                pageSize={10}
                title={`سجل مدفوعات: ${subscriber.memberInfo?.firstName}`}
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border h-[500px] shadow-sm flex flex-col transition-all">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary shrink-0">
              <BookOpen className="w-5 h-5" /> سجل الإعارات والكتب
            </h3>
            <div className="flex-1 min-h-0">
              <AgGridTable
                rowData={subscriber.loanHistory}
                columnDefs={loanColumns}
                pageSize={10}
                title={`سجل إعارات: ${subscriber.memberInfo?.firstName}`}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}