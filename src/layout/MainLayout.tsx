import { useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import Sidebar from "@/components/library/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { motion, AnimatePresence } from "framer-motion";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-cairo" dir="rtl">

      <TopHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      
<div className="flex min-h-[calc(100vh-80px)]">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Pages */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
   </div>
    

      <Footer />

    </div>
  );
}