import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Bell, BarChart, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Devedores', path: '/devedores' },
  { icon: FileText, label: 'Dívidas', path: '/dividas' },
  { icon: Bell, label: 'Notificações', path: '/notificacoes' },
  { icon: BarChart, label: 'Relatórios', path: '/relatorios' },
  { icon: DollarSign, label: 'Configurações', path: '/definicoes' },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn('flex flex-col h-full bg-card border-r border-border', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">DebtTracker</h1>
            <p className="text-xs text-muted-foreground">Gestão Financeira</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Sistema desenvolvido com 💚</p>
        </div>
      </div>
    </aside>
  );
}
