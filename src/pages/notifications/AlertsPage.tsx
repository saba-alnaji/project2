import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Clock, User, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LoanAlert {
  id: string;
  subscriber_name: string;
  book_title: string;
  expected_return_date: string;
  days_remaining: number;
  loan_date: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LoanAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);

      const { data, error } = await supabase
        .from("loans")
        .select("id, loan_date, expected_return_date, subscriber_id, book_id, subscribers(name), books(title)")
        .eq("status", "active")
        .lte("expected_return_date", threeDaysLater.toISOString().split("T")[0])
        .order("expected_return_date", { ascending: true });

      if (error) throw error;

      const mapped: LoanAlert[] = (data || []).map((loan: any) => {
        const expectedDate = new Date(loan.expected_return_date);
        const diffTime = expectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: loan.id,
          subscriber_name: loan.subscribers?.name || "غير معروف",
          book_title: loan.books?.title || "غير معروف",
          expected_return_date: loan.expected_return_date,
          days_remaining: diffDays,
          loan_date: loan.loan_date,
        };
      });

      setAlerts(mapped);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (days: number) => {
    if (days < 0) return "border-destructive bg-destructive/5";
    if (days === 0) return "border-warning bg-warning-bg";
    return "border-accent bg-accent/5";
  };

  const getAlertLabel = (days: number) => {
    if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, className: "bg-destructive/10 text-destructive" };
    if (days === 0) return { text: "اليوم آخر يوم", className: "bg-warning/10 text-warning" };
    return { text: `باقي ${days} أيام`, className: "bg-accent/10 text-accent" };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          التنبيهات
        </h1>
        <p className="text-muted-foreground">
          تنبيهات الإعارة للكتب التي اقترب موعد إرجاعها أو تأخرت، لتتمكن من متابعة الإعارات وتنبيه المشتركين في الوقت المناسب.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل التنبيهات...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد تنبيهات حالياً</h3>
          <p className="text-muted-foreground">جميع الإعارات النشطة في الوقت المحدد 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const label = getAlertLabel(alert.days_remaining);
            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all duration-200",
                  getAlertColor(alert.days_remaining)
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold text-foreground">{alert.book_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground/80 text-sm">{alert.subscriber_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        موعد الإرجاع: {alert.expected_return_date}
                      </span>
                    </div>
                  </div>
                  <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap", label.className)}>
                    {alert.days_remaining < 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    {label.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
