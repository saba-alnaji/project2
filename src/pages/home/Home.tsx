import {
  BookOpen, BarChart2, ArrowLeftRight, Clock, RefreshCw,
  BookPlus, Globe, Bell, Edit, UserCircle, ChevronLeft
} from "lucide-react";
import libraryLogo from "@/assets/library-logo.png";
import { useNavigate } from "react-router-dom"; // 1. استيراد أداة التنقل

const sections = [
  {
    title: "إدارة الاشتراكات",
    color: "text-blue-600 bg-blue-50 border-blue-100",
    items: [
      { id: "new-subscription", path: "/subscription/new", label: "اشتراك جديد", description: "إنشاء اشتراك جديد للقراء", icon: BookPlus },
      { id: "renew-subscription", path: "/subscription/renew", label: "تجديد اشتراك", description: "تجديد الاشتراكات الحالية", icon: RefreshCw },
      { id: "edit-subscription", path: "/subscription/edit", label: "تعديل اشتراك", description: "تعديل بيانات المشتركين", icon: Edit },
    ],
  },
  {
    title: "خدمات الإعارات",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    items: [
      { id: "lend", path: "/loan", label: "إعارة كتاب", description: "إعارة كتاب لمشترك", icon: ArrowLeftRight },
      { id: "return", path: "/return-loan", label: "إرجاع كتاب", description: "إرجاع كتاب مُعار", icon: BookOpen },
      { id: "late-return", path: "/late-returns", label: "إرجاع متأخر", description: "متابعة الإرجاعات المتأخرة", icon: Clock },
    ],
  },
  {
    title: "التقارير والمتابعة",
    color: "text-amber-600 bg-amber-50 border-amber-100",
    items: [
      { id: "general-reports", path: "/reports", label: "التقارير العامة", description: "تقارير وإحصائيات المكتبة", icon: BarChart2 },
      { id: "personal-report", path: "/personal-reports", label: "تقرير شخصي", description: "تقرير لكل مشترك أو كتاب", icon: UserCircle },
      { id: "online-requests", path: "/online-requests", label: "الطلبات الأونلاين", description: "متابعة طلبات القراء", icon: Globe },
      { id: "alerts", path: "/alerts", label: "التنبيهات", description: "عرض التنبيهات المهمة", icon: Bell },
    ],
  },
];

export default function HomePage() {
  const navigate = useNavigate(); // 2. تعريف دالة التنقل

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-2 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-6 mb-12">
        <div className="relative group">
          {/* تأثير التوهج الخلفي عند تمرير الماوس */}
          <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>

          {/* الإطار الدائري الخارجي */}
          <div className="relative flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full border border-border shadow-sm bg-white dark:bg-slate-900 overflow-hidden">

            {/* حاوية الصورة: تم إلغاء الـ padding لضمان ملء الدائرة بالكامل */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={libraryLogo}
                alt="شعار بلدية طولكرم"
                /* التعديلات الأساسية:
                   1. object-cover: لضمان ملء الدائرة بالكامل.
                   2. rounded-full: لقص الصورة نفسها بشكل دائري.
                   3. transition: للحفاظ على نعومة الحركة عند تمرير الماوس.
                */
                className="w-full h-full object-cover rounded-full transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-4xl font-black text-foreground tracking-tight drop-shadow-sm">
            مكتبة بلدية طولكرم العامة
          </h1>

          <div className="flex items-center justify-center gap-3">
            <div className="h-[1.5px] w-10 bg-gradient-to-l from-primary/40 to-transparent rounded-full" />
            <p className="text-muted-foreground font-semibold text-sm md:text-base tracking-wide uppercase">
              نظام الإدارة المركزية والخدمات الذكية
            </p>
            <div className="h-[1.5px] w-10 bg-gradient-to-r from-primary/40 to-transparent rounded-full" />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-1.5 h-7 rounded-full ${section.color.split(' ')[0].replace('text', 'bg')}`} />
              <h2 className="text-xl font-bold text-foreground">
                {section.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-5 p-6 rounded-2xl bg-card border border-border/60 text-right 
                 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 
                 transition-all duration-300 group/btn relative overflow-hidden"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 
                      ${section.color} transition-transform duration-300 group-hover/btn:scale-110 shadow-sm`}>
                    <item.icon className="w-7 h-7" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-foreground font-bold text-lg group-hover/btn:text-primary transition-colors tracking-tight">
                      {item.label}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed opacity-80">
                      {item.description}
                    </p>
                  </div>

                  <ChevronLeft className="w-5 h-5 text-muted-foreground/30 group-hover/btn:text-primary group-hover/btn:translate-x-[-6px] transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}