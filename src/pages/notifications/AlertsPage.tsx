import { useState, useEffect } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AgGridTable from "@/components/library/AgGridTable";
import { motion } from "framer-motion";
import {
  Bell,
  Phone,
  Hourglass,
  Clock,
} from "lucide-react";


const glassCardClass = cn(
  "backdrop-blur-md bg-white/90 dark:bg-gray-900/90",
  "border border-white/20 dark:border-gray-800/20",
  "shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl",
);

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/Borrow/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      const today = new Date();

      const filtered = (data || [])
        .filter((loan: any) => {
          const expectedDate = new Date(loan.endDate);
          const diffTime = expectedDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          // التعديل هنا: الفلترة لتظهر فقط من بقي له 5 أيام أو أقل
          return diffDays <= 5 && diffDays >= 0;
        })
        .map((loan: any) => ({
          ...loan,
          days_remaining: Math.ceil(
            (new Date(loan.endDate).getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        }));

      setAlerts(filtered);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        toast.error("انتهت الجلسة، الرجاء تسجيل الدخول مجددًا");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const criticalCount = alerts.filter((a) => a.days_remaining <= 2).length;

  return (
    <div className="min-h-screen p-8 bg-[#f8fafc]" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* الهيدر والكروت الإحصائية */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500 rounded-2xl shadow-lg text-white">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">تنبيهات الإعارة</h1>
              <p className="text-slate-500 font-medium">نظام مراقبة مواعيد تسليم الكتب</p>
            </div>
          </div>

          <div className="flex gap-4">
            <StatCard
              icon={<Clock className="text-blue-600" />}
              label="الإجمالي"
              value={alerts.length}
              bg="bg-blue-50"
            />
            <StatCard 
              icon={<Hourglass className="text-rose-600" />} 
              label="مستحق قريباً" 
              value={criticalCount} 
              bg="bg-rose-50" 
            />
          </div>
        </div>

        {/* الجدول */}
        <div className={cn(glassCardClass, "bg-card p-4 h-[500px] flex flex-col border-none shadow-xl")}>
          <AgGridTable
            columnDefs={[
              { field: "memberNumber", headerName: "رقم المشترك", flex: 0.8 },
              {
                field: "fullName",
                headerName: "اسم المشترك",
                flex: 1,
                cellRenderer: (p: any) => <span className="font-bold">{p.value}</span>,
              },
              { field: "bookTitle", headerName: "عنوان الكتاب", flex: 1.3 },
              {
                field: "serialNumber", 
                headerName: "رقم التسلسل",
                flex: 1,
              },
              {
                field: "phoneNumber",
                headerName: "الجوال",
                flex: 1,
                cellRenderer: (p: any) => (
                  <div className="flex items-center gap-2 font-bold">
                    <Phone size={14} className="text-slate-400" />
                    {p.value || "غير مسجل"}
                  </div>
                ),
              },
              {
                field: "endDate",
                headerName: "تاريخ الاستحقاق",
                flex: 1,
                valueFormatter: (p: any) => new Date(p.value).toLocaleDateString("ar-EG"),
              },
              {
                field: "days_remaining",
                headerName: "الحالة",
                flex: 1,
                cellRenderer: (params: any) => {
                  const days = params.value;
                  let textColor = "";

                  // التعديل هنا بناءً على طلبك للألوان
                  if (days <= 2) {
                    // يومين أو يوم أو صفر: أحمر
                    textColor = "text-rose-600 font-black animate-pulse";
                  } else {
                    // 3 أيام أو أكثر (حتى 5): أخضر
                    textColor = "text-emerald-600 font-bold";
                  }

                  return (
                    <div className="flex justify-center items-center h-full">
                      <span className={cn("px-2 transition-all font-bold", textColor)}>
                        {days === 0 ? "ينتهي اليوم" : `باقي ${days} يوم`}
                      </span>
                    </div>
                  );
                },
              },
            ]}
            pageSize={15}
            rowData={alerts}
          />
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: any) {
  return (
    <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[170px]">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bg)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}