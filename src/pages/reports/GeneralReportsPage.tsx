import { useState, useEffect } from "react";
import AgGridTable from "@/components/library/AgGridTable";
import { toast } from "sonner";

type Tab = "loans" | "subscribers" | "late";

const API_BASE_URL = "/api/GeneralReports";

export default function GeneralReportsPage() {
  const [tab, setTab] = useState<Tab>("loans");
  const [loanData, setLoanData] = useState<any[]>([]);
  const [subData, setSubData] = useState<any[]>([]);
  const [lateData, setLateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    const requestOptions = {
      headers: {
"Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };

    try {
      const [resLoans, resSubs, resLate] = await Promise.all([
        fetch(`${API_BASE_URL}/borrow?page=1&pageSize=200`, requestOptions),
        fetch(`${API_BASE_URL}/members?page=1&pageSize=200`, requestOptions),
        fetch(`${API_BASE_URL}/late-borrows?page=1&pageSize=200`, requestOptions)
      ]);

      const responses = [resLoans, resSubs, resLate];
      for (const response of responses) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          toast.error("انتهت الجلسة، الرجاء تسجيل الدخول مجددًا");
          window.location.href = "/login";
          return;
        }
      }

      const loansJson = await resLoans.json();
      const subsJson = await resSubs.json();
      const lateJson = await resLate.json();

      setLoanData(loansJson.data || []);
      setSubData(subsJson.data || []);
      setLateData(lateJson.data || []);

    } catch (error: any) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "loans", label: "تقارير الإعارة", emoji: "📚" },
    { id: "subscribers", label: "تقارير المشتركين", emoji: "👥" },
    { id: "late", label: "المتأخرين", emoji: "⏰" },
  ];

  return (
    <div className="max-w-[98%] mx-auto py-8 animate-fade-in print:p-0">
      <div className="mb-8 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-4xl font-black text-foreground mb-2">التقارير العامة</h1>
          <p className="text-muted-foreground text-lg">نظام التقارير الموحد لمكتبة بلدية طولكرم.</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8 print:hidden">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-4 rounded-2xl font-bold text-md transition-all shadow-sm ${
              tab === t.id 
              ? "bg-primary text-white scale-[1.02] shadow-lg" 
              : "bg-card border border-border text-foreground hover:bg-muted"
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin text-4xl mb-4 text-primary">⏳</div>
          <p className="text-xl font-medium">جاري معالجة البيانات من السيرفر...</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden print:shadow-none print:border-none">
          
          {tab === "loans" && (
            <div className="h-[800px]">
            <AgGridTable
              columnDefs={[
                { field: "memberIdNumber", headerName: "رقم الهوية", maxWidth: 140 },
                { field: "memberName", headerName: "اسم المشترك", minWidth: 180 },
                { field: "bookTitle", headerName: "عنوان الكتاب", minWidth: 180 },
                { field: "serialNumber", headerName: "الرقم التسلسلي", maxWidth: 120 },
                { field: "authors", headerName: "المؤلفون", minWidth: 150 },
                { field: "startDate", headerName: "تاريخ الإعارة" },
                { field: "endDate", headerName: "تاريخ الإرجاع" },
              ]}
              rowData={loanData}
              title="تقرير سجل الإعارات العام"
              pagination={true}
              pageSize={15}
            />
            </div>
          )}

          {tab === "subscribers" && (
            <div className="h-[800px]">
            <AgGridTable
              columnDefs={[
                { field: "memberIdNumber", headerName: "رقم الهوية", maxWidth: 150 },
                { field: "memberName", headerName: "اسم المشترك", minWidth: 200 },
                { field: "subscriptionDate", headerName: "تاريخ الاشتراك" },
                { field: "subscriptionDuration", headerName: "عدد الاشتراكات", maxWidth: 150 },
              ]}
              rowData={subData}
              title="تقرير سجل المشتركين"
              pagination={true}
              pageSize={15}
            />
            </div>
          )}

          {tab === "late" && (
            <div className="h-[800px]">
            <AgGridTable
              columnDefs={[
                { field: "memberIdNumber", headerName: "رقم الهوية", maxWidth: 140 },
                { field: "memberName", headerName: "اسم المشترك", minWidth: 180 },
                { field: "bookTitle", headerName: "الكتاب", minWidth: 180 },
                { field: "serialNumber", headerName: "الرقم التسلسلي", maxWidth: 120 },
                { field: "authors", headerName: "المؤلفون", minWidth: 150 },
                { field: "startDate", headerName: "تاريخ الإعارة" },
                { field: "endDate", headerName: "تاريخ الإرجاع" },
                { 
                  field: "lateDays", 
                  headerName: "أيام التأخير", 
                  maxWidth: 120,
                  cellStyle: { color: 'red', fontWeight: 'bold' }
                },
              ]}
              rowData={lateData}
              title="تقرير الكتب المتأخرة"
              pagination={true}
              pageSize={15}
            />
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}