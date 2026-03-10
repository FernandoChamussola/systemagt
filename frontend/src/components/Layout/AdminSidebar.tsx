import { Link, useLocation } from 'react-router-dom';
import { Shield, UserCog, FileText, Users, BarChart, LogOut, Home, Megaphone, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const adminMenuItems = [
  { icon: Shield, label: 'Dashboard Admin', path: '/admin' },
  { icon: UserCog, label: 'Gestao de Usuarios', path: '/admin/users' },
  { icon: FileText, label: 'Todas as Dividas', path: '/admin/debts' },
  { icon: Users, label: 'Todos os Devedores', path: '/admin/debtors' },
  { icon: Megaphone, label: 'Avisos do Sistema', path: '/admin/notices' },
  { icon: History, label: 'Logs de Acesso', path: '/admin/access-logs' },
  { icon: BarChart, label: 'Relatorios do Sistema', path: '/admin/reports' },
];

interface AdminSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function AdminSidebar({ className, onItemClick }: AdminSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <aside className={cn('flex flex-col h-full bg-gradient-to-b from-purple-900 to-purple-800 text-white', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Admin Panel</h1>
            <p className="text-xs text-purple-200">Painel Administrativo</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'text-purple-100 hover:bg-purple-700/50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-purple-700">
          <Link
            to="/dashboard"
            onClick={onItemClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-700/50 transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Voltar ao Sistema</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-purple-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>

        <div className="px-4 py-3 bg-purple-700/30 rounded-lg mt-3">
          <p className="text-xs text-purple-200">Admin Panel v1.0</p>
          <p className="text-xs text-purple-300 mt-1">© 2024 DebtTracker</p>
        </div>
      </div>
    </aside>
  );
}
