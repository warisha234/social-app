import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";
import MobileBottomNav from "./MobileBottomNav";
import MobileMenu from "./MobileMenu";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-app min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 flex pb-[64px] md:pb-0">
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-8 py-6">
            <Outlet />
          </div>

          <RightSidebar />
        </main>
      </div>

      {/* Mobile only */}
      <MobileBottomNav />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}