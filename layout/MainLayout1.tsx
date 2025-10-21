import React, { useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useSession } from "../context/SessionContext";
import { useSettings } from "../context/SettingsContext";
import { useNotification } from "../context/NotificationContext";
import { AnimatePresence, motion } from "framer-motion";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { page } = useSession();
  const { settings } = useSettings();
  const { notification } = useNotification();

  // ✅ Terapkan tema ke seluruh dokumen
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  return (
    <div className="flex flex-col min-h-screen bg-primary text-primary transition-colors duration-300">
      {/* === HEADER === */}
      <Header />

      {/* === KONTEN UTAMA === */}
      <main className="flex-1 p-3 md:p-6 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* === FOOTER NAVIGASI === */}
      <BottomNav />

      {/* === NOTIFIKASI FLOATING === */}
      {notification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-accent-bg text-center text-white font-medium py-2 px-4 rounded-lg shadow-lg">
            {notification}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
