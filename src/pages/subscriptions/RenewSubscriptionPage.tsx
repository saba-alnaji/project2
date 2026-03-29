import { useState, useEffect } from "react"; 
import { useForm, Controller, useWatch } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, RefreshCw, CheckCircle, UserCheck, BookOpen, CreditCard, Save } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AgGridTable from "@/components/library/AgGridTable";

// --- 1. الإعدادات والثوابت ---
const today = new Date().toISOString().split("T")[0];
const oneYearLater = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
})();

const feeByCategory: Record<number, number> = {
  1: 35, // شخص
  2: 25, // طالب
  4: 0,  // موظف بلدية
};

// --- 2. السكيما ---
const renewSchema = z.object({
  subscriptionType: z.string().min(1, "نوع الاشتراك مطلوب"),
  memberClassificationId: z.coerce.number().min(1, "تصنيف المشترك مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  amount: z.coerce.number().min(0, "الرسوم يجب أن تكون 0 أو أكثر"),
  paymentMethodId: z.coerce.number().min(1, "طريقة الدفع مطلوبة"),
  receiptNumber: z.string().min(1, "رقم الوصل مطلوب"),
  ledgerNumber: z.string().min(1, "رقم الدفتر مطلوب"),
  duration: z.string().optional(),
  note: z.string().optional().default(""),
});

type RenewFormData = z.infer<typeof renewSchema>;

const inputClass = cn(
  "w-full px-4 py-3 rounded-xl border-2 border-border text-base transition-all duration-200",
  "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
);

export default function RenewSubscriptionPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [classifications, setClassifications] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const { control, handleSubmit, setValue, reset } = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      subscriptionType: "مكتبة عامة",
      memberClassificationId: 1,
      startDate: today,
      endDate: oneYearLater,
      amount: 35,
      paymentMethodId: 1,
      receiptNumber: "",
      ledgerNumber: "",
      note: "",
      duration: "annual"
    },
  });

  // --- جلب بيانات التصنيفات وطرق الدفع عند تحميل الصفحة ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resClass, resMethods] = await Promise.all([
          axios.get("https://localhost:8080/api/MemberClassification", { headers }),
          axios.get("https://localhost:8080/api/PaymentMethod", { headers })
        ]);

        setClassifications(resClass.data);
        setPaymentMethods(resMethods.data);
      } catch (error) {
        console.error("Error fetching lookup data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const watchedStartDate = useWatch({ control, name: "startDate" });

  useEffect(() => {
    if (watchedStartDate) {
      const d = new Date(watchedStartDate);
      if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        setValue("endDate", d.toISOString().split("T")[0]);
      }
    }
  }, [watchedStartDate, setValue]);

  // --- 3. تعريف أعمدة الجداول ---
  const paymentColumns = [
    {
      field: "paymentDate",
      headerName: "تاريخ الدفع",
      flex: 1,
      cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ar-EG') : "-"
    },
    {
      field: "amount",
      headerName: "المبلغ",
      flex: 1,
      cellRenderer: (p: any) => `${p.value} ₪`
    },
    {
      field: "paymentMethod",
      headerName: "طريقة الدفع",
      flex: 1
    },
    {
      field: "subscriptionType",
      headerName: "نوع الاشتراك",
      flex: 1
    },
    {
      field: "createdBy",
      headerName: "بواسطة",
      flex: 1
    }
  ];

  const loanColumns = [
    { field: "BookTitle", headerName: "عنوان الكتاب", flex: 2 },
    { field: "LoanDate", headerName: "تاريخ الإعارة", flex: 1 },
    { field: "ReturnDate", headerName: "تاريخ الإرجاع", flex: 1 },
    {
      field: "Status",
      headerName: "الحالة",
      flex: 1,
      cellRenderer: (p: any) => p.value === "Returned" ? "تم الإرجاع" : "قيد الإعارة"
    },
  ];

  // --- 4. دالة البحث المجمعة ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSuccess(false);
    setSubscriber(null);

    try {
      const token = localStorage.getItem("token");
      const commonBody = { idNumber: searchQuery.trim(), memberNumber: null, status: null };

      const [resSearch, resPayments, resLoans] = await Promise.all([
        axios.post("https://localhost:8080/api/Subscription/search", commonBody, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post("https://localhost:8080/api/Subscription/payment-history", commonBody, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post("https://localhost:8080/api/Borrow/Borrow-history", {
          ...commonBody,
          pageNumber: 1,
          pageSize: 50
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const mainInfo = Array.isArray(resSearch.data) ? resSearch.data[0] : resSearch.data;

      if (mainInfo) {
        setSubscriber({
          ...mainInfo,
          paymentHistory: resPayments.data || [],
          loanHistory: resLoans.data || []
        });
        toast({ title: "تم العثور على المشترك وجلب سجلاته ✅" });
      } else {
        toast({ title: "المشترك غير موجود", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ في جلب البيانات من السيرفر", variant: "destructive" });
    } finally { setSearching(false); }
  };

  // --- 5. دالة التجديد ---
  const onSubmit = async (data: RenewFormData) => {
    if (!subscriber) return;
    setRenewing(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        userID: subscriber.userID,
        subscriptionInfo: { ...data }
      };

      await axios.post("https://localhost:8080/api/Subscription/renew", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      toast({ title: "تم تجديد الاشتراك بنجاح ✅" });
    } catch (error) {
      toast({ title: "فشل في عملية التجديد", variant: "destructive" });
    } finally { setRenewing(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-foreground">تجديد الاشتراك</h1>
        <p className="text-muted-foreground">ابحث عن المشترك برقم الهوية لتحديث بياناته والاطلاع على سجلاته.</p>
      </div>

      {/* البحث */}
      <div className="bg-card rounded-2xl p-6 border border-border mb-6 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="أدخل رقم الهوية للبحث..."
            className={cn(inputClass, "flex-1")}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-8 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            بحث
          </button>
        </div>
      </div>

      {success ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">تم التجديد بنجاح!</h2>
          <button
            onClick={() => { setSuccess(false); setSubscriber(null); setSearchQuery(""); reset(); }}
            className="px-6 py-2 bg-primary text-white rounded-lg font-bold"
          >
            تجديد لمشترك آخر
          </button>
        </div>
      ) : subscriber && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

          {/* كارت المعلومات الأساسية */}
          <div className="bg-card rounded-2xl p-6 border-2 border-primary/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCheck className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {subscriber.memberInfo?.firstName} {subscriber.memberInfo?.familyName}
                </h3>
                <p className="text-sm text-muted-foreground">رقم الهوية: {subscriber.memberInfo?.idnumber}</p>
              </div>
            </div>
            <div className="text-left">
              {(() => {
                const lastPayment = subscriber.paymentHistory?.[0];
                const pDate = lastPayment?.paymentDate;
                let isActive = false;
                if (pDate) {
                  const paymentDate = new Date(pDate);
                  const expiryDate = new Date(paymentDate);
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  isActive = expiryDate > new Date();
                }
                if (!isActive && subscriber.status?.toLowerCase().includes("active")) {
                  isActive = true;
                }
                return (
                  <span className={cn(
                    "px-4 py-1 rounded-xl text-xs font-black shadow-sm border", 
                    isActive ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"
                  )}>
                    {isActive ? "اشتراك فعّال ✅" : "اشتراك منتهي ⚠️"}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> سجل المدفوعات السابقة
              </h3>
              <div className="h-[350px] w-full">
                <AgGridTable
                  rowData={subscriber.paymentHistory}
                  columnDefs={paymentColumns}
                  pageSize={5}
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> سجل الإعارات (Borrowing)
              </h3>
              <div className="h-[350px] w-full">
                <AgGridTable
                  rowData={subscriber.loanHistory}
                  columnDefs={loanColumns}
                  pageSize={5}
                />
              </div>
            </div>
          </div>

          {/* نموذج التجديد */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
              <RefreshCw className="w-5 h-5 text-primary" /> تفاصيل التجديد الجديد
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold">تاريخ البداية</label>
                  <Controller name="startDate" control={control} render={({ field }) => (
                    <input type="date" {...field} className={inputClass} />
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">تاريخ النهاية (تلقائي)</label>
                  <Controller name="endDate" control={control} render={({ field }) => (
                    <input type="date" {...field} className={cn(inputClass, "bg-muted cursor-not-allowed")} readOnly />
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">نوع الاشتراك</label>
                  <Controller name="subscriptionType" control={control} render={({ field }) => (
                    <select {...field} className={inputClass}>
                      <option value="مكتبة عامة">مكتبة عامة</option>
                      <option value="مكتبة أطفال">مكتبة أطفال</option>
                    </select>
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">تصنيف المشترك</label>
                  <Controller name="memberClassificationId" control={control} render={({ field }) => (
                    <select
                      className={inputClass}
                      {...field}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        field.onChange(val);
                        setValue("amount", feeByCategory[val] ?? 35);
                      }}
                    >
                      {/* عرض الخيارات القادمة من السيرفر */}
                      {classifications.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">الرسوم المستحقة (₪)</label>
                  <Controller name="amount" control={control} render={({ field }) => (
                    <input type="number" {...field} className={cn(inputClass, "font-bold text-primary bg-primary/5")} />
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">طريقة الدفع</label>
                  <Controller name="paymentMethodId" control={control} render={({ field }) => (
                    <select 
                      {...field} 
                      className={inputClass} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                       {/* عرض طرق الدفع القادمة من السيرفر */}
                       {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">رقم الوصل</label>
                  <Controller name="receiptNumber" control={control} render={({ field }) => (
                    <input {...field} className={inputClass} />
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">رقم الدفتر</label>
                  <Controller name="ledgerNumber" control={control} render={({ field }) => (
                    <input {...field} className={inputClass} />
                  )} />
                </div>
              </div>

              <button
                type="submit"
                disabled={renewing}
                className="w-full mt-6 py-4 bg-primary text-white rounded-xl font-black text-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {renewing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                حفظ وإتمام عملية التجديد
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}