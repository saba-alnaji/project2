import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  User, 
  BookOpen,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LoanAlert {
  id: string;
  subscriber_name: string;
  subscriber_phone?: string;
  subscriber_email?: string;
  book_title: string;
  expected_return_date: string;
  days_remaining: number;
  loan_date: string;
  status: 'critical' | 'warning' | 'info';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LoanAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<LoanAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    avgDays: 0
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.status === filter));
    }
  }, [filter, alerts]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("loans")
        .select(`
          id, 
          loan_date, 
          expected_return_date, 
          subscriber_id, 
          book_id, 
          subscribers(name, phone, email), 
          books(title)
        `)
        .eq("status", "active")
        .lte("expected_return_date", sevenDaysLater.toISOString().split("T")[0])
        .order("expected_return_date", { ascending: true });

      if (error) throw error;

      let criticalCount = 0;
      let warningCount = 0;
      let infoCount = 0;
      let totalDays = 0;

      const mapped: LoanAlert[] = (data || []).map((loan: any) => {
        const expectedDate = new Date(loan.expected_return_date);
        const diffTime = expectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status: 'critical' | 'warning' | 'info' = 'info';
        if (diffDays < 0) {
          status = 'critical';
          criticalCount++;
        } else if (diffDays <= 2) {
          status = 'warning';
          warningCount++;
        } else {
          infoCount++;
        }
        
        totalDays += diffDays;

        return {
          id: loan.id,
          subscriber_name: loan.subscribers?.name || "غير معروف",
          subscriber_phone: loan.subscribers?.phone,
          subscriber_email: loan.subscribers?.email,
          book_title: loan.books?.title || "غير معروف",
          expected_return_date: loan.expected_return_date,
          days_remaining: diffDays,
          loan_date: loan.loan_date,
          status
        };
      });

      setAlerts(mapped);
      setFilteredAlerts(mapped);
      setStats({
        total: mapped.length,
        critical: criticalCount,
        warning: warningCount,
        info: infoCount,
        avgDays: mapped.length ? Math.round(totalDays / mapped.length) : 0
      });
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string, days?: number) => {
    switch(status) {
      case 'critical':
        return {
          color: 'from-rose-500 to-pink-600',
          lightBg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800',
          text: 'text-rose-600 dark:text-rose-400',
          icon: AlertCircle,
          label: days && days < 0 ? `متأخر ${Math.abs(days)} يوم` : 'حرج',
          progress: 100
        };
      case 'warning':
        return {
          color: 'from-amber-500 to-orange-500',
          lightBg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
          label: days === 0 ? 'آخر يوم' : `باقي ${days} أيام`,
          progress: days ? Math.min(100, (7 - days) * 14) : 0
        };
      default:
        return {
          color: 'from-blue-500 to-cyan-500',
          lightBg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-600 dark:text-blue-400',
          icon: Clock,
          label: `باقي ${days} أيام`,
          progress: days ? Math.max(0, 100 - (days * 10)) : 0
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const exportToCSV = () => {
    const csv = filteredAlerts.map(alert => ({
      'المشترك': alert.subscriber_name,
      'الكتاب': alert.book_title,
      'تاريخ الإعارة': alert.loan_date,
      'تاريخ الإرجاع': alert.expected_return_date,
      'الأيام المتبقية': alert.days_remaining,
      'الحالة': alert.status === 'critical' ? 'متأخر' : alert.status === 'warning' ? 'تحذير' : 'تنبيه'
    }));

    const headers = Object.keys(csv[0]).join(',');
    const rows = csv.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `\uFEFF${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تنبيهات_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
  };

  const printAlerts = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px;
          min-height: 100vh;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 30px;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        h1 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin-bottom: 20px;
          font-size: 36px;
          font-weight: 800;
        }
        .date {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(102,126,234,0.3);
        }
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 10px;
        }
        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          font-weight: 600;
          border-radius: 10px;
        }
        td {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
        }
        .critical { background: #fee; color: #e53e3e; }
        .warning { background: #fff3e0; color: #dd6b20; }
        .info { background: #e6f7ff; color: #0891b2; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    `;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تنبيهات الإعارة</title>
          ${styles}
        </head>
        <body>
          <div class="container">
            <h1>🔔 تنبيهات الإعارة</h1>
            <div class="date">
              📅 ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}
            </div>
            
            <div class="stats">
              <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">إجمالي التنبيهات</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.critical}</div>
                <div class="stat-label">حالات متأخرة</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.warning}</div>
                <div class="stat-label">تنبيهات عاجلة</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>الكتاب</th>
                  <th>تاريخ الإرجاع</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAlerts.map(alert => {
                  const statusClass = alert.status === 'critical' ? 'critical' : 
                                     alert.status === 'warning' ? 'warning' : 'info';
                  return `
                    <tr>
                      <td><strong>${alert.subscriber_name}</strong></td>
                      <td>${alert.book_title}</td>
                      <td>${new Date(alert.expected_return_date).toLocaleDateString('ar-EG')}</td>
                      <td><span class="${statusClass}" style="padding:5px 15px;border-radius:20px;">
                        ${alert.days_remaining < 0 ? `متأخر ${Math.abs(alert.days_remaining)} يوم` : 
                          alert.days_remaining === 0 ? 'آخر يوم' : `باقي ${alert.days_remaining} أيام`}
                      </span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              تم إنشاء هذا التقرير بواسطة نظام إدارة المكتبة © ${new Date().getFullYear()}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header with animated gradient */}
        <div className="relative mb-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"
          />
          <div className="relative flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl font-black bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 flex items-center gap-4"
              >
                <Bell className="w-12 h-12 text-purple-600 animate-pulse" />
                مركز التنبيهات
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl"
              >
                نظام متقدم لمتابعة الإعارات وتنبيه المشتركين في الوقت المناسب
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex gap-3"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={fetchAlerts}
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-12 w-12 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تحديث البيانات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-12 w-12 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تصدير CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={printAlerts}
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-12 w-12 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>طباعة التقرير</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { 
              label: 'إجمالي التنبيهات', 
              value: stats.total, 
              icon: Bell, 
              gradient: 'from-blue-600 to-cyan-600',
              delay: 0.7
            },
            { 
              label: 'حالات متأخرة', 
              value: stats.critical, 
              icon: AlertCircle, 
              gradient: 'from-rose-600 to-pink-600',
              delay: 0.8
            },
            { 
              label: 'تنبيهات عاجلة', 
              value: stats.warning, 
              icon: AlertTriangle, 
              gradient: 'from-amber-600 to-orange-600',
              delay: 0.9
            },
            { 
              label: 'تنبيهات مبكرة', 
              value: stats.info, 
              icon: Clock, 
              gradient: 'from-emerald-600 to-teal-600',
              delay: 1.0
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="relative overflow-hidden group cursor-pointer border-2 hover:border-transparent transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.value / Math.max(stats.total, 1)) * 100}%` }}
                      transition={{ delay: stat.delay + 0.3, duration: 0.8 }}
                      className={`h-full bg-gradient-to-r ${stat.gradient}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="mb-6"
        >
          <Tabs defaultValue="all" className="w-full" onValueChange={(v: any) => setFilter(v)}>
            <TabsList className="grid w-full max-w-md grid-cols-4 p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-2">
              <TabsTrigger value="all" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
                الكل
              </TabsTrigger>
              <TabsTrigger value="critical" className="text-sm data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                متأخر
              </TabsTrigger>
              <TabsTrigger value="warning" className="text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                عاجل
              </TabsTrigger>
              <TabsTrigger value="info" className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                مبكر
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-16 h-16 text-primary mb-4" />
            </motion.div>
            <p className="text-xl text-muted-foreground animate-pulse">جاري تحميل التنبيهات...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-32 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl border-2 border-dashed"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-3xl font-bold text-foreground mb-3">كل شيء على ما يرام!</h3>
            <p className="text-xl text-muted-foreground">لا توجد تنبيهات في هذا التصنيف حالياً</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredAlerts.map((alert, index) => {
                const config = getStatusConfig(alert.status, alert.days_remaining);
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02, x: 10 }}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl transition-all duration-300",
                      config.lightBg,
                      config.border
                    )}
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      className={cn("absolute inset-0 bg-gradient-to-r", config.color)}
                      initial={{ opacity: 0, x: '-100%' }}
                      animate={{ opacity: 0.1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    />
                    
                    <div className="relative p-6">
                      <div className="flex items-start gap-6">
                        {/* Icon with animated pulse */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={cn(
                            "p-4 rounded-2xl bg-gradient-to-br shadow-lg",
                            config.color
                          )}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </motion.div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-foreground mb-2">
                                {alert.book_title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {alert.subscriber_name}
                                </span>
                                {alert.subscriber_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {alert.subscriber_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Badge 
                              className={cn(
                                "px-4 py-2 text-sm font-bold border-2",
                                config.text,
                                config.lightBg,
                                config.border
                              )}
                            >
                              {config.label}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">مدة الإعارة</span>
                              <span className={cn("font-bold", config.text)}>
                                {alert.days_remaining < 0 ? 'منتهي' : `${alert.days_remaining} يوم متبقي`}
                              </span>
                            </div>
                            <Progress 
                              value={config.progress} 
                              className={cn("h-2 bg-gray-200 dark:bg-gray-700", {
                                'bg-rose-200': alert.status === 'critical'
                              })}
                            />
                          </div>

                          {/* Footer Info */}
                          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              تاريخ الإعارة: {new Date(alert.loan_date).toLocaleDateString('ar-EG')}
                            </span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              تاريخ الإرجاع: {new Date(alert.expected_return_date).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-white font-bold text-sm shadow-lg",
                              "bg-gradient-to-r",
                              config.color
                            )}
                          >
                            عرض التفاصيل
                          </motion.button>
                          {alert.subscriber_phone && (
                            <motion.a
                              href={`tel:${alert.subscriber_phone}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-center text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              اتصال
                            </motion.a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
