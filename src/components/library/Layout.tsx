import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useState } from "react";
import libraryLogo from "@/assets/library-logo.png";

interface LayoutProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  children: React.ReactNode;
}

export default function Layout({ activeSection, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-primary shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Right side: Logo + Name */}
          <div className="flex items-center gap-3">
            <img src={libraryLogo} alt="شعار المكتبة" className="w-10 h-10 rounded-full object-cover bg-white p-0.5" />
            <div className="text-right">
              <h1 className="text-primary-foreground font-bold text-sm leading-tight">بلدية طولكرم</h1>
              <p className="text-primary-foreground/70 text-xs">المكتبة العامة</p>
            </div>
          </div>

          {/* Center: English name */}
          <div className="hidden md:block text-center">
            <h2 className="text-primary-foreground font-semibold text-sm">Tulkarm Municipality</h2>
            <p className="text-primary-foreground/70 text-xs">Public Library</p>
          </div>

          {/* Left side: Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={(section) => {
          onNavigate(section);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="min-h-[calc(100vh-60px)]">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
