import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';
import BottomNavbar from './BottomNavbar';
import FeedbackSurveyModal from '@/components/FeedbackSurveyModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Detectar se está em rota admin
  const isAdminRoute = location.pathname.startsWith('/admin');
  const SidebarComponent = isAdminRoute ? AdminSidebar : Sidebar;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64 fixed top-4 left-4 bottom-4">
        <SidebarComponent />
      </div>

      {/* Sidebar - Mobile (Sheet) - apenas para rotas admin */}
      {isAdminRoute && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarComponent onItemClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-72 flex flex-col gap-4 lg:pr-4 lg:py-4">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-4 md:p-6 lg:px-4 lg:py-2 ${!isAdminRoute ? 'pb-24 lg:pb-2' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navbar for Mobile - apenas para rotas normais */}
      {!isAdminRoute && <BottomNavbar />}

      {!isAdminRoute && <FeedbackSurveyModal />}
    </div>
  );
}
