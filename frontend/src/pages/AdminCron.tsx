import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cronApi } from '@/lib/api';
import {
  Clock,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  RotateCcw,
  Send,
  Timer,
  Bell,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminCron() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLimparModal, setShowLimparModal] = useState(false);
  const [diasLimpar, setDiasLimpar] = useState(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cron-status'],
    queryFn: cronApi.getStatus,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const executarNotificacoesMutation = useMutation({
    mutationFn: cronApi.executarNotificacoes,
    onSuccess: (data) => {
      toast({
        title: 'Cron iniciado',
        description: data.message,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['cron-status'] });
      }, 5000);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar o cron de notificacoes',
        variant: 'destructive',
      });
    },
  });

  const executarRetryMutation = useMutation({
    mutationFn: cronApi.executarRetry,
    onSuccess: (data) => {
      toast({
        title: 'Cron de retry iniciado',
        description: data.message,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['cron-status'] });
      }, 5000);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar o cron de retry',
        variant: 'destructive',
      });
    },
  });

  const forcarRetryMutation = useMutation({
    mutationFn: cronApi.forcarRetry,
    onSuccess: () => {
      toast({
        title: 'Retry agendado',
        description: 'A notificacao sera reenviada em breve',
      });
      queryClient.invalidateQueries({ queryKey: ['cron-status'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao agendar retry',
        variant: 'destructive',
      });
    },
  });

  const limparFalhasMutation = useMutation({
    mutationFn: () => cronApi.limparFalhas(diasLimpar),
    onSuccess: (data) => {
      toast({
        title: 'Limpeza concluida',
        description: `${data.removidas} notificacoes removidas`,
      });
      setShowLimparModal(false);
      queryClient.invalidateQueries({ queryKey: ['cron-status'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao limpar notificacoes',
        variant: 'destructive',
      });
    },
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const stats = data?.estatisticas;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            Gestao de Crons
          </h1>
          <p className="text-muted-foreground mt-1">
            Execute e monitore os crons do sistema manualmente
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.notificacoesHoje || 0}</p>
              <p className="text-sm text-muted-foreground">Criadas Hoje</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.enviadasHoje || 0}</p>
              <p className="text-sm text-muted-foreground">Enviadas Hoje</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Timer className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.aguardandoRetry || 0}</p>
              <p className="text-sm text-muted-foreground">Aguardando Retry</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.falhasHoje || 0}</p>
              <p className="text-sm text-muted-foreground">Falhas Hoje</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.dividasComNotificacaoAuto || 0}</p>
              <p className="text-sm text-muted-foreground">Dividas c/ Auto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="grid md:grid-cols-2 gap-6">
        {data?.crons.map((cron) => (
          <div key={cron.endpoint} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  {cron.endpoint === 'notificacoes' ? (
                    <Bell className="w-6 h-6 text-purple-600" />
                  ) : (
                    <RotateCcw className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{cron.nome}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cron.horarioAgendado}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{cron.descricao}</p>

            <Button
              onClick={() =>
                cron.endpoint === 'notificacoes'
                  ? executarNotificacoesMutation.mutate()
                  : executarRetryMutation.mutate()
              }
              disabled={
                executarNotificacoesMutation.isPending || executarRetryMutation.isPending
              }
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {(cron.endpoint === 'notificacoes'
                ? executarNotificacoesMutation.isPending
                : executarRetryMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Notificacoes Aguardando Retry */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold">Notificacoes Aguardando Retry</h2>
            <span className="text-sm text-muted-foreground">
              ({data?.notificacoesAguardandoRetry.length || 0})
            </span>
          </div>
        </div>

        {data?.notificacoesAguardandoRetry.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>Nenhuma notificacao aguardando retry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Devedor</th>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Tentativas</th>
                  <th className="text-left p-3 font-medium">Proxima Tentativa</th>
                  <th className="text-left p-3 font-medium">Erro</th>
                  <th className="text-right p-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data?.notificacoesAguardandoRetry.map((notif) => (
                  <tr key={notif.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{notif.devedor}</td>
                    <td className="p-3 text-sm text-muted-foreground">{notif.usuario}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                        {notif.tentativas}x
                      </span>
                    </td>
                    <td className="p-3 text-sm">{formatDate(notif.proximaTentativa)}</td>
                    <td className="p-3 text-sm text-red-500 max-w-xs truncate">
                      {notif.erro || 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => forcarRetryMutation.mutate(notif.id)}
                        disabled={forcarRetryMutation.isPending}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ultimas Falhas */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold">Ultimas Falhas Definitivas</h2>
            <span className="text-sm text-muted-foreground">
              ({data?.ultimasFalhas.length || 0})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLimparModal(true)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Antigas
          </Button>
        </div>

        {data?.ultimasFalhas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>Nenhuma falha definitiva registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Devedor</th>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Tentativas</th>
                  <th className="text-left p-3 font-medium">Ultimo Erro</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-right p-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data?.ultimasFalhas.map((notif) => (
                  <tr key={notif.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{notif.devedor}</td>
                    <td className="p-3 text-sm text-muted-foreground">{notif.usuario}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs">
                        {notif.tentativas}x
                      </span>
                    </td>
                    <td className="p-3 text-sm text-red-500 max-w-xs truncate">
                      {notif.erro || 'Erro desconhecido'}
                    </td>
                    <td className="p-3 text-sm">{formatDate(notif.atualizadoEm)}</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => forcarRetryMutation.mutate(notif.id)}
                        disabled={forcarRetryMutation.isPending}
                        title="Tentar novamente"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Limpar Falhas */}
      <Dialog open={showLimparModal} onOpenChange={setShowLimparModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar Notificacoes com Falha</DialogTitle>
            <DialogDescription>
              Remove notificacoes que falharam definitivamente ha mais de X dias.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Remover falhas com mais de:</label>
              <select
                value={diasLimpar}
                onChange={(e) => setDiasLimpar(Number(e.target.value))}
                className="w-full p-2 border border-border rounded-lg bg-background"
              >
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimparModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => limparFalhasMutation.mutate()}
              disabled={limparFalhasMutation.isPending}
            >
              {limparFalhasMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
