import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtApi, debtorApi, Debt, DebtStatus } from '@/lib/api';
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
  Plus,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
  Percent,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dividas() {
  const [statusFilter, setStatusFilter] = useState<DebtStatus | 'TODAS'>('TODAS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showIncreaseInterestModal, setShowIncreaseInterestModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [novoJuros, setNovoJuros] = useState('');
  const [formData, setFormData] = useState({
    devedorId: '',
    valorInicial: '',
    taxaJuros: '',
    dataVencimento: '',
    notificacaoAuto: false,
    periodicidadeNotificacao: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: debtsData, isLoading } = useQuery({
    queryKey: ['debts', statusFilter],
    queryFn: () => debtApi.list(statusFilter !== 'TODAS' ? { status: statusFilter } : undefined),
  });

  const { data: debtorsData } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => debtorApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: debtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: 'Dívida criada!',
        description: 'A dívida foi cadastrada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar dívida',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => debtApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowEditModal(false);
      setSelectedDebt(null);
      resetForm();
      toast({
        title: 'Dívida atualizada!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar dívida',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const increaseInterestMutation = useMutation({
    mutationFn: ({ id, novoJuros }: { id: string; novoJuros: number }) =>
      debtApi.increaseInterest(id, novoJuros),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowIncreaseInterestModal(false);
      setSelectedDebt(null);
      setNovoJuros('');
      toast({
        title: 'Juros aumentados!',
        description: 'A taxa de juros foi atualizada.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aumentar juros',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: debtApi.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: 'Dívida marcada como paga!',
        description: 'A dívida foi quitada.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como paga',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: debtApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowDeleteModal(false);
      setSelectedDebt(null);
      toast({
        title: 'Dívida removida!',
        description: 'A dívida foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover dívida',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  function resetForm() {
    setFormData({
      devedorId: '',
      valorInicial: '',
      taxaJuros: '',
      dataVencimento: '',
      notificacaoAuto: false,
      periodicidadeNotificacao: '',
    });
  }

  function openEditModal(debt: Debt) {
    setSelectedDebt(debt);
    setFormData({
      devedorId: debt.devedorId,
      valorInicial: debt.valorInicial.toString(),
      taxaJuros: debt.taxaJuros.toString(),
      dataVencimento: debt.dataVencimento.split('T')[0],
      notificacaoAuto: debt.notificacaoAuto,
      periodicidadeNotificacao: debt.periodicidadeNotificacao?.toString() || '',
    });
    setShowEditModal(true);
  }

  function openDeleteModal(debt: Debt) {
    setSelectedDebt(debt);
    setShowDeleteModal(true);
  }

  function openIncreaseInterestModal(debt: Debt) {
    setSelectedDebt(debt);
    setNovoJuros(debt.taxaJuros.toString());
    setShowIncreaseInterestModal(true);
  }

  function handleCreate() {
    const data = {
      devedorId: formData.devedorId,
      valorInicial: parseFloat(formData.valorInicial),
      taxaJuros: parseFloat(formData.taxaJuros),
      dataVencimento: formData.dataVencimento,
      notificacaoAuto: formData.notificacaoAuto,
      periodicidadeNotificacao: formData.periodicidadeNotificacao
        ? parseInt(formData.periodicidadeNotificacao)
        : undefined,
    };
    createMutation.mutate(data);
  }

  function handleUpdate() {
    if (selectedDebt) {
      const data = {
        devedorId: formData.devedorId,
        valorInicial: parseFloat(formData.valorInicial),
        taxaJuros: parseFloat(formData.taxaJuros),
        dataVencimento: formData.dataVencimento,
        notificacaoAuto: formData.notificacaoAuto,
        periodicidadeNotificacao: formData.periodicidadeNotificacao
          ? parseInt(formData.periodicidadeNotificacao)
          : undefined,
      };
      updateMutation.mutate({ id: selectedDebt.id, data });
    }
  }

  function handleIncreaseInterest() {
    if (selectedDebt) {
      increaseInterestMutation.mutate({
        id: selectedDebt.id,
        novoJuros: parseFloat(novoJuros),
      });
    }
  }

  function handleDelete() {
    if (selectedDebt) {
      deleteMutation.mutate(selectedDebt.id);
    }
  }

  function handleMarkAsPaid(id: string) {
    markAsPaidMutation.mutate(id);
  }

  function getStatusIcon(status: DebtStatus) {
    switch (status) {
      case 'PAGO':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ATRASADO':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  }

  function getStatusColor(status: DebtStatus) {
    switch (status) {
      case 'PAGO':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ATRASADO':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  }

  const filteredDebts = debtsData?.debts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dívidas</h1>
          <p className="text-muted-foreground mt-1">Gerencie empréstimos e cobranças</p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Dívida
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['TODAS', 'PENDENTE', 'ATRASADO', 'PAGO'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'TODAS' && 'Todas'}
            {status === 'PENDENTE' && (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Pendentes
              </>
            )}
            {status === 'ATRASADO' && (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Atrasadas
              </>
            )}
            {status === 'PAGO' && (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Pagas
              </>
            )}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDebts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDebts.map((debt) => (
            <div
              key={debt.id}
              className={`bg-card border rounded-lg p-5 hover:shadow-lg transition-shadow ${
                debt.status === 'ATRASADO' ? 'border-red-500/50' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(debt.status)}
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(
                      debt.status
                    )}`}
                  >
                    {debt.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {debt.devedor?.nome || 'Devedor'}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div className="w-full">
                    <p className="text-lg font-bold text-foreground">
                      Total: {debt.valorAtual.toLocaleString('pt-MZ')} MT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inicial: {debt.valorInicial.toLocaleString('pt-MZ')} MT
                    </p>
                    {(() => {
                      const totalPago = debt.pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0;
                      const valorRestante = debt.valorAtual - totalPago;
                      return (
                        <>
                          {totalPago > 0 && (
                            <p className="text-xs text-green-600">
                              Pago: {totalPago.toLocaleString('pt-MZ')} MT
                            </p>
                          )}
                          {valorRestante > 0 && debt.status !== 'PAGO' && (
                            <p className="text-xs text-red-500 font-medium">
                              Restante: {valorRestante.toLocaleString('pt-MZ')} MT
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Juros: {debt.taxaJuros}% / mês</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Vence: {new Date(debt.dataVencimento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <Link to={`/dividas/${debt.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="mr-1 h-3 w-3" />
                    Ver
                  </Button>
                </Link>

                {debt.status !== 'PAGO' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(debt)}
                      title="Editar"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openIncreaseInterestModal(debt)}
                      title="Aumentar juros"
                    >
                      <TrendingUp className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => handleMarkAsPaid(debt.id)}
                      title="Marcar como paga"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteModal(debt)}
                  title="Deletar"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma dívida encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter !== 'TODAS'
              ? `Nenhuma dívida com status "${statusFilter}"`
              : 'Comece cadastrando uma nova dívida'}
          </p>
          {statusFilter === 'TODAS' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Dívida
            </Button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Dívida</DialogTitle>
            <DialogDescription>Cadastre uma nova dívida para um devedor</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="devedor">Devedor *</Label>
              <select
                id="devedor"
                value={formData.devedorId}
                onChange={(e) => setFormData({ ...formData, devedorId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione um devedor</option>
                {debtorsData?.debtors.map((debtor) => (
                  <option key={debtor.id} value={debtor.id}>
                    {debtor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorInicial">Valor Inicial (MT) *</Label>
              <Input
                id="valorInicial"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valorInicial}
                onChange={(e) => setFormData({ ...formData, valorInicial: e.target.value })}
                placeholder="1000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaJuros">Taxa de Juros (% ao mês) *</Label>
              <Input
                id="taxaJuros"
                type="number"
                step="0.1"
                min="0"
                value={formData.taxaJuros}
                onChange={(e) => setFormData({ ...formData, taxaJuros: e.target.value })}
                placeholder="5.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="notificacaoAuto"
                type="checkbox"
                checked={formData.notificacaoAuto}
                onChange={(e) =>
                  setFormData({ ...formData, notificacaoAuto: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="notificacaoAuto" className="cursor-pointer">
                Ativar notificações automáticas
              </Label>
            </div>

            {formData.notificacaoAuto && (
              <div className="space-y-2">
                <Label htmlFor="periodicidade">Periodicidade (dias)</Label>
                <Input
                  id="periodicidade"
                  type="number"
                  min="1"
                  value={formData.periodicidadeNotificacao}
                  onChange={(e) =>
                    setFormData({ ...formData, periodicidadeNotificacao: e.target.value })
                  }
                  placeholder="7"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dívida</DialogTitle>
            <DialogDescription>Altere os dados da dívida</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-devedor">Devedor *</Label>
              <select
                id="edit-devedor"
                value={formData.devedorId}
                onChange={(e) => setFormData({ ...formData, devedorId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione um devedor</option>
                {debtorsData?.debtors.map((debtor) => (
                  <option key={debtor.id} value={debtor.id}>
                    {debtor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valorInicial">Valor Inicial (MT) *</Label>
              <Input
                id="edit-valorInicial"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valorInicial}
                onChange={(e) => setFormData({ ...formData, valorInicial: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-taxaJuros">Taxa de Juros (% ao mês) *</Label>
              <Input
                id="edit-taxaJuros"
                type="number"
                step="0.1"
                min="0"
                value={formData.taxaJuros}
                onChange={(e) => setFormData({ ...formData, taxaJuros: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dataVencimento">Data de Vencimento *</Label>
              <Input
                id="edit-dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="edit-notificacaoAuto"
                type="checkbox"
                checked={formData.notificacaoAuto}
                onChange={(e) =>
                  setFormData({ ...formData, notificacaoAuto: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-notificacaoAuto" className="cursor-pointer">
                Ativar notificações automáticas
              </Label>
            </div>

            {formData.notificacaoAuto && (
              <div className="space-y-2">
                <Label htmlFor="edit-periodicidade">Periodicidade (dias)</Label>
                <Input
                  id="edit-periodicidade"
                  type="number"
                  min="1"
                  value={formData.periodicidadeNotificacao}
                  onChange={(e) =>
                    setFormData({ ...formData, periodicidadeNotificacao: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Increase Interest Modal */}
      <Dialog open={showIncreaseInterestModal} onOpenChange={setShowIncreaseInterestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aumentar Juros</DialogTitle>
            <DialogDescription>
              Defina a nova taxa de juros para a dívida de{' '}
              <strong>{selectedDebt?.devedor?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Taxa atual</p>
              <p className="text-2xl font-bold">{selectedDebt?.taxaJuros}% / mês</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novoJuros">Nova Taxa de Juros (% ao mês)</Label>
              <Input
                id="novoJuros"
                type="number"
                step="0.1"
                min="0"
                value={novoJuros}
                onChange={(e) => setNovoJuros(e.target.value)}
                placeholder="10.0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIncreaseInterestModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleIncreaseInterest}
              disabled={increaseInterestMutation.isPending}
            >
              {increaseInterestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a dívida de{' '}
              <strong>{selectedDebt?.devedor?.nome}</strong> no valor de{' '}
              <strong>{selectedDebt?.valorAtual.toLocaleString('pt-MZ')} MT</strong>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
    </div>
  );
}
