import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Users, FileText, Megaphone, DollarSign, ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { systemNoticeApi } from '@/lib/api';

const bottomMenuItems = [
  { icon: Home, label: 'Início', path: '/dashboard' },
  { icon: Users, label: 'Devedores', path: '/devedores' },
  { icon: FileText, label: 'Dívidas', path: '/dividas' },
  { icon: Megaphone, label: 'Avisos', path: '/avisos', showBadge: true },
  { icon: DollarSign, label: 'Definições', path: '/definicoes' },
];

export default function BottomNavbar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notices-count'],
    queryFn: systemNoticeApi.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  /* ── Colapsado: bolinha flutuante no canto inferior direito ── */
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full
          border border-white/[0.12] bg-card/70 backdrop-blur-xl
          shadow-[0_8px_32px_rgba(0,0,0,0.55)]
          flex items-center justify-center
          text-muted-foreground hover:text-foreground
          transition-all duration-200 active:scale-90"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    );
  }

  /* ── Expandido: barra completa ── */
  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 h-[68px] rounded-2xl
      border border-white/[0.08] bg-card/60 backdrop-blur-xl
      shadow-[0_8px_32px_rgba(0,0,0,0.5)]
      flex items-center justify-around px-2">

      {bottomMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const showBadge = item.showBadge && unreadCount > 0;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ease-in-out active:scale-95',
              isActive
                ? 'text-primary bg-primary/15'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium leading-none tracking-tight',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Botão fechar (colapsar) */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl
          text-muted-foreground/50 hover:text-muted-foreground
          transition-all duration-200 active:scale-90"
        aria-label="Fechar menu"
      >
        <ChevronDown className="w-4 h-4" />
        <span className="text-[10px] font-medium leading-none tracking-tight">Fechar</span>
      </button>
    </div>
  );
}

