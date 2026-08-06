import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, User, Settings, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="h-16 border-b lg:border border-border bg-card px-4 flex items-center justify-between sticky top-0 lg:top-4 z-40 lg:rounded-2xl lg:shadow-sm">
        {/* Menu button (mobile, only for admin routes) */}
        {isAdminRoute ? (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          /* Logo (mobile only, hidden on desktop and admin routes) */
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground">DebtTracker</span>
          </div>
        )}

        {/* Page title (hidden on mobile) */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-foreground">
            Bem-vindo de volta!
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seus devedores e cobranças
          </p>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">{user?.nome}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Configurações"
              onClick={() => navigate('/definicoes')}
            >
              <Settings className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title="Sair"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar saída</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja sair do sistema?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleLogout}>Sair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
