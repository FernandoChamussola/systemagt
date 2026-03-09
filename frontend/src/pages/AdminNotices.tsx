import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemNoticeApi, SystemNotice, SystemNoticePriority } from '@/lib/api';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<SystemNotice | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    prioridade: 'NORMAL' as SystemNoticePriority,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notices'],
    queryFn: () => systemNoticeApi.adminList(),
  });

  const createMutation = useMutation({
    mutationFn: systemNoticeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: 'Aviso criado',
        description: 'O aviso foi criado e enviado para todos os usuários.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o aviso.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      systemNoticeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
      setShowEditModal(false);
      setSelectedNotice(null);
      toast({
        title: 'Aviso atualizado',
        description: 'As alterações foram salvas.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o aviso.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: systemNoticeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
      setShowDeleteModal(false);
      setSelectedNotice(null);
      toast({
        title: 'Aviso removido',
        description: 'O aviso foi removido permanentemente.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o aviso.',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      systemNoticeApi.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do aviso foi alterado.',
      });
    },
  });

  const notices = data?.notices || [];

  function resetForm() {
    setFormData({
      titulo: '',
      conteudo: '',
      prioridade: 'NORMAL',
    });
  }

  function handleEdit(notice: SystemNotice) {
    setSelectedNotice(notice);
    setFormData({
      titulo: notice.titulo,
      conteudo: notice.conteudo,
      prioridade: notice.prioridade,
    });
    setShowEditModal(true);
  }

  function handleDelete(notice: SystemNotice) {
    setSelectedNotice(notice);
    setShowDeleteModal(true);
  }

  function getPriorityConfig(priority: string) {
    switch (priority) {
      case 'URGENT':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: 'Urgente',
        };
      case 'HIGH':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          label: 'Alta',
        };
      case 'LOW':
        return {
          icon: Info,
          color: 'text-gray-500',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          label: 'Baixa',
        };
      default:
        return {
          icon: Bell,
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Normal',
        };
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" />
            Gestão de Avisos
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie avisos para todos os usuários do sistema
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Aviso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notices.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notices.filter((n) => n.ativo).length}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notices.filter((n) => !n.ativo).length}</p>
              <p className="text-sm text-muted-foreground">Inativos</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notices.filter((n) => n.prioridade === 'URGENT' && n.ativo).length}
              </p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notices Table */}
      {notices.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum aviso criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie o primeiro aviso para comunicar com seus usuários.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Aviso
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Aviso</th>
                  <th className="text-left p-4 font-medium">Prioridade</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Leituras</th>
                  <th className="text-left p-4 font-medium">Criado em</th>
                  <th className="text-right p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => {
                  const config = getPriorityConfig(notice.prioridade);
                  const Icon = config.icon;

                  return (
                    <tr key={notice.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-xs">{notice.titulo}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {notice.conteudo.substring(0, 60)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: notice.id, ativo: !notice.ativo })
                          }
                          className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-full transition-colors ${
                            notice.ativo
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {notice.ativo ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {notice.totalLeituras || 0}/{notice.totalUsuarios || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({notice.percentualLeitura || 0}%)
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(notice.criadoEm)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(notice)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Aviso</DialogTitle>
            <DialogDescription>
              Crie um novo aviso que será exibido para todos os usuários do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do aviso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo</Label>
              <Textarea
                id="conteudo"
                value={formData.conteudo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Escreva o conteúdo do aviso..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value: SystemNoticePriority) =>
                  setFormData({ ...formData, prioridade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.titulo || !formData.conteudo || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Aviso'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Aviso</DialogTitle>
            <DialogDescription>Faça alterações no aviso selecionado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-conteudo">Conteúdo</Label>
              <Textarea
                id="edit-conteudo"
                value={formData.conteudo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, conteudo: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value: SystemNoticePriority) =>
                  setFormData({ ...formData, prioridade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                selectedNotice &&
                updateMutation.mutate({ id: selectedNotice.id, data: formData })
              }
              disabled={!formData.titulo || !formData.conteudo || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
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
              Tem certeza que deseja excluir o aviso "{selectedNotice?.titulo}"? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedNotice && deleteMutation.mutate(selectedNotice.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
