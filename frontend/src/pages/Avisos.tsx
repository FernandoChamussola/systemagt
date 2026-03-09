import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemNoticeApi, SystemNotice } from '@/lib/api';
import {
  Bell,
  CheckCircle,
  Circle,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Avisos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotice, setSelectedNotice] = useState<SystemNotice | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['system-notices'],
    queryFn: systemNoticeApi.list,
  });

  const markAsReadMutation = useMutation({
    mutationFn: systemNoticeApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notices'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notices-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: systemNoticeApi.markAllAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-notices'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notices-count'] });
      toast({
        title: 'Avisos marcados como lidos',
        description: `${data.count} avisos foram marcados como lidos.`,
      });
    },
  });

  const notices = data?.notices || [];
  const unreadCount = notices.filter((n) => !n.lido).length;

  function getPriorityConfig(priority: string) {
    switch (priority) {
      case 'URGENT':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
          label: 'Urgente',
        };
      case 'HIGH':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          border: 'border-orange-200 dark:border-orange-800',
          badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
          label: 'Alta',
        };
      case 'LOW':
        return {
          icon: Info,
          color: 'text-gray-500',
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
          label: 'Baixa',
        };
      default:
        return {
          icon: Bell,
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
          label: 'Normal',
        };
    }
  }

  function handleOpenNotice(notice: SystemNotice) {
    setSelectedNotice(notice);
    if (!notice.lido) {
      markAsReadMutation.mutate(notice.id);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hoje às ' + date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem às ' + date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `Há ${days} dias`;
    } else {
      return date.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Avisos do Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Fique por dentro das novidades e comunicados importantes
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Marcar todos como lidos ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{notices.length}</p>
          <p className="text-sm text-muted-foreground">Total de avisos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
          <p className="text-sm text-muted-foreground">Não lidos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{notices.filter((n) => n.lido).length}</p>
          <p className="text-sm text-muted-foreground">Lidos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {notices.filter((n) => n.prioridade === 'URGENT' && !n.lido).length}
          </p>
          <p className="text-sm text-muted-foreground">Urgentes</p>
        </div>
      </div>

      {/* Notices List */}
      {notices.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum aviso</h3>
          <p className="text-muted-foreground">
            Não há avisos do sistema no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const config = getPriorityConfig(notice.prioridade);
            const Icon = config.icon;

            return (
              <div
                key={notice.id}
                onClick={() => handleOpenNotice(notice)}
                className={`
                  bg-card border rounded-lg p-4 cursor-pointer transition-all
                  hover:shadow-md
                  ${notice.lido ? 'border-border opacity-75' : `${config.border} ${config.bg}`}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${notice.lido ? 'bg-muted' : config.bg}`}>
                    <Icon className={`w-5 h-5 ${notice.lido ? 'text-muted-foreground' : config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!notice.lido && (
                        <Circle className="w-2 h-2 fill-primary text-primary" />
                      )}
                      <h3 className={`font-semibold truncate ${notice.lido ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notice.titulo}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {notice.conteudo}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(notice.criadoEm)}</span>
                      {notice.lido && notice.lidoEm && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Lido
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNotice && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getPriorityConfig(selectedNotice.prioridade);
                    const Icon = config.icon;
                    return (
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <DialogTitle className="text-xl">{selectedNotice.titulo}</DialogTitle>
                    <DialogDescription>
                      {formatDate(selectedNotice.criadoEm)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{selectedNotice.conteudo}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Marcado como lido
                </div>
                <Button variant="outline" onClick={() => setSelectedNotice(null)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
