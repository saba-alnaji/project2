import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookPlus, BookOpen, RefreshCw, Edit, BookMarked, RotateCcw, Clock,
  BarChart2, UserCircle, Globe, Bell, LogOut, X, ChevronDown, ChevronUp, Library
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  children: { label: string; path: string; icon: React.ElementType }[];
}

const menuGroups: (MenuGroup | { label: string; path: string; icon: React.ElementType })[] = [
  { label: "الرئيسية", path: "/", icon: Home },

  {
    label: "الاشتراكات",
    icon: BookPlus,
    children: [
      { label: "اشتراك جديد", path: "/subscription/new", icon: BookPlus },
      { label: "تجديد اشتراك", path: "/subscription/renew", icon: RefreshCw },
      { label: "تعديل اشتراك", path: "/subscription/edit", icon: Edit },
    ],
  },

  {
    label: "الإعارات",
    icon: BookMarked,
    children: [
      { label: "إعارة كتاب", path: "/loan", icon: BookOpen },
      { label: "إرجاع كتاب", path: "/return-loan", icon: RotateCcw },
      { label: "إرجاع متأخر", path: "/late-returns", icon: Clock },
    ],
  },

  {
    label: "التقارير",
    icon: BarChart2,
    children: [
      { label: "تقارير عامة", path: "/reports", icon: BarChart2 },
      { label: "تقرير شخصي", path: "/personal-reports", icon: UserCircle },
    ],
  },

  { label: "الطلبات الأونلاين", path: "/online-requests", icon: Globe },
  { label: "التنبيهات", path: "/alerts", icon: Bell },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupLabel)
        ? prev.filter(id => id !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose(); // يغلق الـ Sidebar عند اختيار أي صفحة
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    onClose();
    navigate("/Login");
  };

  const isChildActive = (group: MenuGroup) =>
    group.children.some(c => location.pathname === c.path);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm"
            onClick={onClose} // الضغط على الخلفية يغلق Sidebar
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: isOpen ? 0 : 300, opacity: isOpen ? 1 : 0 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className={cn(
          "fixed top-0 right-0 h-full w-[290px] z-50 flex flex-col overflow-hidden bg-card/80 backdrop-blur-xl border-l border-border shadow-2xl",
        )}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg">
  <Library className="w-5 h-5 text-primary" />
</div>
              <div>
                <h3 className="font-bold text-sm text-foreground">مكتبة البلدية</h3>
                <p className="text-[10px] text-muted-foreground font-medium">لوحة التحكم</p>
              </div>
            </div>
            <button
              onClick={onClose} // زر الإغلاق
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition-all duration-200 group"
            >
              <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
          <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent" />
        </div>

        {/* Menu */}
        <nav className="flex-1 py-2 px-4 space-y-1 overflow-y-auto">
          {menuGroups.map(item => {
            if (!("children" in item)) {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/60 text-muted-foreground group-hover:bg-muted"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            }

            const group = item as MenuGroup;
            const isExpanded = expandedGroups.includes(group.label);
            const hasActive = isChildActive(group);

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 group",
                    hasActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      hasActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-muted"
                    )}>
                      <group.icon className="w-4 h-4" />
                    </div>
                    <span>{group.label}</span>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>

                {isExpanded && (
                  <div className="mr-4 mt-2 space-y-1">
                    {group.children.map(child => {
                      const isActive = location.pathname === child.path;
                      return (
                        <button
                          key={child.path}
                          onClick={() => handleNavigate(child.path)} // يغلق Sidebar عند اختيار الصفحة
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/60 text-muted-foreground"
                          )}>
                            <child.icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4">
          <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent mb-4" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">تسجيل الخروج</h3>
              <p className="text-sm text-muted-foreground mb-6">
                هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors shadow-md"
                >
                  تأكيد الخروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}