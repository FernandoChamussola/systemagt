import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtorApi, Debtor } from '@/lib/api';
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
  Search,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Devedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    localizacao: '',
    descricao: '',
    outrosTelefones: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => debtorApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: debtorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: 'Devedor criado!',
        description: 'O devedor foi cadastrado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar devedor',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => debtorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setShowEditModal(false);
      setSelectedDebtor(null);
      resetForm();
      toast({
        title: 'Devedor atualizado!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar devedor',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: debtorApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setShowDeleteModal(false);
      setSelectedDebtor(null);
      toast({
        title: 'Devedor removido!',
        description: 'O devedor foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover devedor',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  function resetForm() {
    setFormData({
      nome: '',
      telefone: '',
      localizacao: '',
      descricao: '',
      outrosTelefones: '',
    });
  }

  function openEditModal(debtor: Debtor) {
    setSelectedDebtor(debtor);
    setFormData({
      nome: debtor.nome,
      telefone: debtor.telefone,
      localizacao: debtor.localizacao || '',
      descricao: debtor.descricao || '',
      outrosTelefones: debtor.outrosTelefones || '',
    });
    setShowEditModal(true);
  }

  function openDeleteModal(debtor: Debtor) {
    setSelectedDebtor(debtor);
    setShowDeleteModal(true);
  }

  function handleCreate() {
    createMutation.mutate(formData);
  }

  function handleUpdate() {
    if (selectedDebtor) {
      updateMutation.mutate({ id: selectedDebtor.id, data: formData });
    }
  }

  function handleDelete() {
    if (selectedDebtor) {
      deleteMutation.mutate(selectedDebtor.id);
    }
  }

  const filteredDebtors = data?.debtors.filter((debtor) =>
    debtor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.telefone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua lista de clientes devedores
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Devedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDebtors && filteredDebtors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDebtors.map((debtor) => (
            <div
              key={debtor.id}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{debtor.nome}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {debtor.telefone}
                    </p>
                  </div>
                </div>
              </div>

              {debtor.localizacao && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3" />
                  {debtor.localizacao}
                </p>
              )}

              {debtor.descricao && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {debtor.descricao}
                </p>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Link to={`/devedores/${debtor.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(debtor)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteModal(debtor)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum devedor encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece cadastrando seu primeiro devedor'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Devedor
            </Button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Devedor</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo devedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do devedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="+258 XX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Cidade, bairro..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Informações adicionais"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outrosTelefones">Outros telefones</Label>
              <Input
                id="outrosTelefones"
                value={formData.outrosTelefones}
                onChange={(e) =>
                  setFormData({ ...formData, outrosTelefones: e.target.value })
                }
                placeholder="Telefones alternativos"
              />
            </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Devedor</DialogTitle>
            <DialogDescription>Altere os dados do devedor</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome completo *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do devedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefone">Telefone *</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="+258 XX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-localizacao">Localização</Label>
              <Input
                id="edit-localizacao"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Cidade, bairro..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Informações adicionais"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-outrosTelefones">Outros telefones</Label>
              <Input
                id="edit-outrosTelefones"
                value={formData.outrosTelefones}
                onChange={(e) =>
                  setFormData({ ...formData, outrosTelefones: e.target.value })
                }
                placeholder="Telefones alternativos"
              />
            </div>
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

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{selectedDebtor?.nome}</strong>? Esta ação não pode ser desfeita.
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
