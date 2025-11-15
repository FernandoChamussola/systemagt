import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { debtApi, paymentApi, notificationApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  Loader2,
  User,
  Percent,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';
import CollateralSection from '@/components/CollateralSection';

export default function DividaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    valor: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    descricao: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['debt', id],
    queryFn: () => debtApi.get(id!),
    enabled: !!id,
  });

  const createPaymentMutation = useMutation({
    mutationFn: paymentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowAddPaymentModal(false);
      setPaymentForm({
        valor: '',
        dataPagamento: new Date().toISOString().split('T')[0],
        descricao: '',
      });
      toast({
        title: 'Pagamento registrado!',
        description: 'O pagamento foi adicionado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: paymentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowDeletePaymentModal(false);
      setSelectedPaymentId(null);
      toast({
        title: 'Pagamento removido!',
        description: 'O pagamento foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover pagamento',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: () => notificationApi.sendManual(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowSendNotificationModal(false);
      if (data.sucesso) {
        toast({
          title: 'Notificação enviada!',
          description: 'A mensagem foi enviada via WhatsApp com sucesso.',
        });
      } else {
        toast({
          title: 'Falha no envio',
          description: 'Não foi possível enviar a notificação.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar notificação',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  function handleAddPayment() {
    if (!id) return;
    createPaymentMutation.mutate({
      dividaId: id,
      valor: parseFloat(paymentForm.valor),
      dataPagamento: paymentForm.dataPagamento,
      descricao: paymentForm.descricao || undefined,
    });
  }

  function handleDeletePayment() {
    if (!selectedPaymentId) return;
    deletePaymentMutation.mutate(selectedPaymentId);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.debt) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dívida não encontrada</p>
        <Link to="/dividas">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const { debt } = data;
  const diasAtrasados = Math.floor(
    (new Date().getTime() - new Date(debt.dataVencimento).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalPago = debt.pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0;
  const valorRestante = debt.valorAtual - totalPago;

  function getStatusIcon(status: string) {
    switch (status) {
      case 'PAGO':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'ATRASADO':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PAGO':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ATRASADO':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/dividas">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(debt.status)}
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full border ${getStatusColor(
                  debt.status
                )}`}
              >
                {debt.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Total: {debt.valorAtual.toLocaleString('pt-MZ')} MT
            </h1>
            <p className="text-muted-foreground mt-1">
              Valor inicial: {debt.valorInicial.toLocaleString('pt-MZ')} MT
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Valor Total a Pagar</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {debt.valorAtual.toLocaleString('pt-MZ')} MT
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Valor Pago</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {totalPago.toLocaleString('pt-MZ')} MT
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Valor Restante</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {valorRestante.toLocaleString('pt-MZ')} MT
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Informações do Devedor</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <Link
                  to={`/devedores/${debt.devedorId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {debt.devedor?.nome}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Detalhes Financeiros</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Juros</p>
                <p className="font-medium">{debt.taxaJuros}% ao mês</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Juros Acumulados</p>
                <p className="font-medium text-red-500">
                  {(debt.valorAtual - debt.valorInicial).toLocaleString('pt-MZ')} MT
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Datas</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Empréstimo</p>
                <p className="font-medium">
                  {new Date(debt.dataEmprestimo).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                <p className="font-medium">
                  {new Date(debt.dataVencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {debt.status === 'ATRASADO' && diasAtrasados > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm font-medium text-red-500">
                  Atrasado há {diasAtrasados} dia{diasAtrasados > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {debt.notificacaoAuto ? 'Ativas' : 'Desativadas'}
              </p>
            </div>

            {debt.notificacaoAuto && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Periodicidade</p>
                  <p className="font-medium">A cada {debt.periodicidadeNotificacao} dias</p>
                </div>

                {debt.ultimaNotificacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Última Notificação</p>
                    <p className="font-medium">
                      {new Date(debt.ultimaNotificacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Histórico de Pagamentos</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSendNotificationModal(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Notificação
            </Button>
            {debt.status !== 'PAGO' && valorRestante > 0 && (
              <Button size="sm" onClick={() => setShowAddPaymentModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Pagamento
              </Button>
            )}
          </div>
        </div>

        {debt.pagamentos && debt.pagamentos.length > 0 ? (
          <div className="space-y-3">
            {debt.pagamentos.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.valor.toLocaleString('pt-MZ')} MT
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.dataPagamento).toLocaleDateString('pt-BR')}
                      {payment.descricao && ` • ${payment.descricao}`}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPaymentId(payment.id);
                    setShowDeletePaymentModal(true);
                  }}
                  title="Remover pagamento"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento registrado ainda
            </p>
          </div>
        )}
      </div>

      {/* Calculation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Cálculo Detalhado
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Inicial:</span>
            <span className="font-medium">{debt.valorInicial.toLocaleString('pt-MZ')} MT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa de Juros:</span>
            <span className="font-medium">{debt.taxaJuros}% / mês</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Juros Acumulados:</span>
            <span className="font-medium text-red-500">
              +{(debt.valorAtual - debt.valorInicial).toLocaleString('pt-MZ')} MT
            </span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold">Valor Total a Pagar:</span>
              <span className="font-bold text-lg text-primary">
                {debt.valorAtual.toLocaleString('pt-MZ')} MT
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-green-600">Total Pago:</span>
            <span className="font-bold text-green-600">
              -{totalPago.toLocaleString('pt-MZ')} MT
            </span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold">Valor Restante:</span>
              <span className="font-bold text-lg text-red-500">
                {valorRestante.toLocaleString('pt-MZ')} MT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collateral Section */}
      <CollateralSection dividaId={id!} garantias={debt.garantias} />

      {/* Add Payment Modal */}
      <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Adicione um novo pagamento para esta dívida
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor restante a pagar</p>
              <p className="text-2xl font-bold">{valorRestante.toLocaleString('pt-MZ')} MT</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor do Pagamento (MT) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                max={valorRestante}
                value={paymentForm.valor}
                onChange={(e) => setPaymentForm({ ...paymentForm, valor: e.target.value })}
                placeholder="1000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPagamento">Data do Pagamento *</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={paymentForm.dataPagamento}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, dataPagamento: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                type="text"
                value={paymentForm.descricao}
                onChange={(e) => setPaymentForm({ ...paymentForm, descricao: e.target.value })}
                placeholder="Ex: Pagamento parcial"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPaymentModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Modal */}
      <Dialog open={showDeletePaymentModal} onOpenChange={setShowDeletePaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este pagamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePaymentModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayment}
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog open={showSendNotificationModal} onOpenChange={setShowSendNotificationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação</DialogTitle>
            <DialogDescription>
              Deseja enviar uma notificação via WhatsApp para {debt.devedor?.nome || 'o devedor'}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted border border-border">
              <p className="text-sm text-muted-foreground mb-1">Telefone:</p>
              <p className="font-medium">{debt.devedor?.telefone || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted border border-border">
              <p className="text-sm text-muted-foreground mb-1">Valor Restante:</p>
              <p className="font-medium text-lg text-destructive">
                {valorRestante.toLocaleString('pt-MZ')} MT
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Uma mensagem de cobrança será enviada automaticamente para o devedor.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendNotificationModal(false)}
              disabled={sendNotificationMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendNotificationMutation.mutate()}
              disabled={sendNotificationMutation.isPending}
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
