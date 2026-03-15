import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookPlus, BookOpen, RefreshCw, Edit, BookMarked, RotateCcw, Clock,
  BarChart2, UserCircle, Globe, Bell, LogOut, X, ChevronDown, ChevronUp
} from "lucide-react";
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

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupLabel)
        ? prev.filter(id => id !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isChildActive = (group: MenuGroup) =>
    group.children.some(c => location.pathname === c.path);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300",
          "bg-gradient-to-b from-[#0f2a44] to-[#091a2c]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        dir="rtl"
      >

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-sidebar-primary font-bold text-lg">القائمة</h2>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-200" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">

          {menuGroups.map(item => {

            if (!("children" in item)) {

              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-gray-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
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
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    hasActive
                      ? "bg-white/10 text-white"
                      : "text-gray-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="w-5 h-5" />
                    <span>{group.label}</span>
                  </div>

                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>

                {isExpanded && (
                  <div className="mr-6 mt-1 space-y-1 border-r border-white/10 pr-3">

                    {group.children.map(child => {

                      const isActive = location.pathname === child.path;

                      return (
                        <button
                          key={child.path}
                          onClick={() => handleNavigate(child.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-gray-300 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <child.icon className="w-4 h-4" />
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

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

      </aside>
    </>
  );
}