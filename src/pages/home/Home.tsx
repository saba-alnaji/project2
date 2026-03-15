import { BookOpen, BarChart2, ArrowLeftRight, Clock, Users, RefreshCw } from "lucide-react";
import libraryLogo from "@/assets/library-logo.png";
import { useNavigate } from "react-router-dom";

const quickLinks = [
  {
    id: "new-subscription",
    label: "اشتراك جديد",
    description: "إنشاء اشتراك جديد للقراء",
    icon: Users,
    borderColor: "border-t-primary",
    iconBg: "bg-primary",
  },
  {
    id: "lend",
    label: "إعارة كتاب",
    description: "إعارة كتاب لمشترك",
    icon: ArrowLeftRight,
    borderColor: "border-t-primary",
    iconBg: "bg-primary",
  },
  {
    id: "return",
    label: "إرجاع كتاب",
    description: "إرجاع كتاب مُعار",
    icon: BookOpen,
    borderColor: "border-t-primary",
    iconBg: "bg-primary",
  },
  {
    id: "edit-subscription",
    label: "تعديل اشتراك",
    description: "تعديل بيانات المشتركين",
    icon: RefreshCw,
    borderColor: "border-t-accent",
    iconBg: "bg-accent",
  },
  {
    id: "late-return",
    label: "إرجاع متأخر",
    description: "متابعة الإرجاعات المتأخرة",
    icon: Clock,
    borderColor: "border-t-warning",
    iconBg: "bg-warning",
  },
  {
    id: "general-reports",
    label: "التقارير",
    description: "تقارير متقدمة وإحصائيات",
    icon: BarChart2,
    borderColor: "border-t-success",
    iconBg: "bg-success",
  },
];

export default function Home() {

  const navigate = useNavigate();

  const routes: Record<string,string> = {
    "new-subscription": "/subscription/new",
    lend: "/loan",
    return: "/return-loan",
    "edit-subscription": "/subscription/edit",
    "late-return": "/late-returns",
    "general-reports": "/reports",
  };

  return (
    <div className="animate-fade-in">

      <div className="text-center mb-10 pt-4">
        <img
          src={libraryLogo}
          alt="شعار مكتبة بلدية طولكرم"
          className="w-24 h-24 mx-auto mb-5 rounded-full shadow-elevated object-cover border-4 border-white"
        />

        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
          مكتبة بلدية طولكرم العامة
        </h1>

        <p className="text-muted-foreground text-base md:text-lg">
          نظام إدارة المكتبة الشامل - إدارة الكتب والتقارير والبحث المتقدم
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {quickLinks.map(link => (
          <button
            key={link.id}
            onClick={() => navigate(routes[link.id])}
            className={`group flex items-center gap-4 p-5 rounded-xl bg-card border border-border border-t-4 ${link.borderColor} shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 text-right`}
          >
            <div className={`w-12 h-12 rounded-xl ${link.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <link.icon className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="text-foreground font-bold text-base">{link.label}</h3>
              <p className="text-muted-foreground text-xs mt-0.5">{link.description}</p>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}