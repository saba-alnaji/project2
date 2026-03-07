import { useState } from "react";
import {
  Home, BookPlus, BookOpen, RefreshCw, Edit, BookMarked, RotateCcw, Clock,
  BarChart2, UserCircle, Globe, Bell, LogOut, X, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  children: { id: string; label: string; icon: React.ElementType }[];
}

const menuGroups: (MenuGroup | { id: string; label: string; icon: React.ElementType; children?: undefined })[] = [
  { id: "home", label: "الرئيسية", icon: Home },
  {
    id: "subscriptions",
    label: "الاشتراكات",
    icon: BookPlus,
    children: [
      { id: "new-subscription", label: "اشتراك جديد", icon: BookPlus },
      { id: "renew-subscription", label: "تجديد اشتراك", icon: RefreshCw },
      { id: "edit-subscription", label: "تعديل اشتراك", icon: Edit },
    ],
  },
  {
    id: "loans",
    label: "الإعارات",
    icon: BookMarked,
    children: [
      { id: "lend", label: "إعارة كتاب", icon: BookOpen },
      { id: "return", label: "إرجاع كتاب", icon: RotateCcw },
      { id: "late-return", label: "إرجاع متأخر", icon: Clock },
    ],
  },
  {
    id: "reports",
    label: "التقارير",
    icon: BarChart2,
    children: [
      { id: "general-reports", label: "تقارير عامة", icon: BarChart2 },
      { id: "personal-report", label: "تقرير شخصي", icon: UserCircle },
    ],
  },
  { id: "online-requests", label: "الطلبات الأونلاين", icon: Globe },
  { id: "alerts", label: "التنبيهات", icon: Bell },
];

export default function Sidebar({ activeSection, onNavigate, isOpen, onClose }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["subscriptions", "loans", "reports"]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const isChildActive = (group: MenuGroup) => group.children.some(c => c.id === activeSection);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-card z-50 shadow-elevated transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">القائمة</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuGroups.map(item => {
            // Simple item (no children)
            if (!item.children) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    activeSection === item.id
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", activeSection === item.id ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </button>
              );
            }

            // Group with children
            const group = item as MenuGroup;
            const isExpanded = expandedGroups.includes(group.id);
            const hasActive = isChildActive(group);

            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    hasActive
                      ? "bg-primary/5 text-primary font-bold"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className={cn("w-5 h-5", hasActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{group.label}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mr-6 mt-1 space-y-0.5 border-r-2 border-border pr-3">
                    {group.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                          activeSection === child.id
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-foreground/60 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <child.icon className={cn("w-4 h-4", activeSection === child.id ? "text-primary" : "text-muted-foreground")} />
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
