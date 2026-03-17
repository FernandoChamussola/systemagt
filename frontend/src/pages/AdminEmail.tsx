import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { emailApi, adminApi } from '@/lib/api';
import {
  Mail,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  AlertTriangle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminEmail() {
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);

  const [formData, setFormData] = useState({
    assunto: '',
    mensagem: '',
  });

  // Buscar status do email
  const { data: emailStatus, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['email-status'],
    queryFn: emailApi.getStatus,
  });

  // Buscar usuários
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-email'],
    queryFn: () => adminApi.getUsers({ limit: 1000, status: 'active' }),
  });

  const users = usersData?.users || [];

  // Filtrar usuários pela busca
  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Mutation para enviar emails
  const sendEmailMutation = useMutation({
    mutationFn: (data: { userIds: string[]; assunto: string; mensagem: string }) =>
      emailApi.sendToUsers(data),
    onSuccess: (result) => {
      setShowComposeModal(false);
      setSelectedUsers([]);
      resetForm();
      toast({
        title: 'Emails enviados',
        description: `${result.enviados} de ${result.total} emails enviados com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar',
        description: error.response?.data?.error || 'Erro ao enviar emails',
        variant: 'destructive',
      });
    },
  });

  // Mutation para enviar para todos
  const sendToAllMutation = useMutation({
    mutationFn: (data: { assunto: string; mensagem: string }) => emailApi.sendToAll(data),
    onSuccess: (result) => {
      setShowConfirmAllModal(false);
      setShowComposeModal(false);
      resetForm();
      toast({
        title: 'Emails enviados',
        description: `${result.enviados} de ${result.total} emails enviados com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar',
        description: error.response?.data?.error || 'Erro ao enviar emails',
        variant: 'destructive',
      });
    },
  });

  function resetForm() {
    setFormData({ assunto: '', mensagem: '' });
    setSendToAll(false);
  }

  function handleSelectUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function handleSelectAll() {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  }

  function handleSend() {
    if (sendToAll) {
      setShowConfirmAllModal(true);
    } else {
      sendEmailMutation.mutate({
        userIds: selectedUsers,
        assunto: formData.assunto,
        mensagem: formData.mensagem,
      });
    }
  }

  function handleConfirmSendAll() {
    sendToAllMutation.mutate({
      assunto: formData.assunto,
      mensagem: formData.mensagem,
    });
  }

  const isConfigured = emailStatus?.configured;
  const isConnected = emailStatus?.connected;

  if (loadingStatus) {
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
            <Mail className="w-8 h-8 text-purple-500" />
            Envio de Emails
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie emails para usuários do sistema
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchStatus()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar Conexao
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowComposeModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!isConfigured || !isConnected}
          >
            <Send className="mr-2 h-4 w-4" />
            Compor Email
          </Button>
        </div>
      </div>

      {/* Status do Email */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isConfigured
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}
            >
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium">Configuracao</p>
              <p className="text-sm text-muted-foreground">
                {isConfigured ? 'Configurado' : 'Nao configurado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isConnected
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}
            >
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="font-medium">Conexao SMTP</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Usuarios Ativos</p>
              <p className="text-sm text-muted-foreground">{users.length} usuarios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem se nao configurado */}
      {!isConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Servico de email nao configurado
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Configure as variaveis de ambiente EMAIL_USER e EMAIL_APP_PASSWORD para habilitar
                o envio de emails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Selecionar Destinatarios</h2>
              {selectedUsers.length > 0 && (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm px-2 py-0.5 rounded-full">
                  {selectedUsers.length} selecionados
                </span>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar usuarios..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedUsers.length === filteredUsers.length ? 'Desmarcar' : 'Selecionar'} Todos
              </Button>
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum usuario encontrado</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium w-12"></th>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t border-border hover:bg-muted/30 cursor-pointer ${
                      selectedUsers.includes(user.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="p-3 font-medium">{user.nome}</td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3 text-muted-foreground">{user.telefone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer com botao de enviar */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedUsers.length} usuario(s) selecionado(s)
              </p>
              <Button
                onClick={() => {
                  setSendToAll(false);
                  setShowComposeModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!isConfigured || !isConnected}
              >
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Composicao */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compor Email
            </DialogTitle>
            <DialogDescription>
              {sendToAll
                ? 'Este email sera enviado para todos os usuarios ativos do sistema.'
                : `Este email sera enviado para ${selectedUsers.length} usuario(s) selecionado(s).`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendToAll"
                checked={sendToAll}
                onCheckedChange={(checked: boolean) => setSendToAll(checked)}
              />
              <Label htmlFor="sendToAll" className="cursor-pointer">
                Enviar para todos os usuarios ativos ({users.length})
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                placeholder="Assunto do email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={formData.mensagem}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, mensagem: e.target.value })
                }
                placeholder="Escreva sua mensagem aqui..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                A mensagem sera formatada automaticamente com o nome do usuario.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                !formData.assunto ||
                !formData.mensagem ||
                (!sendToAll && selectedUsers.length === 0) ||
                sendEmailMutation.isPending ||
                sendToAllMutation.isPending
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sendEmailMutation.isPending || sendToAllMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmacao para Enviar a Todos */}
      <Dialog open={showConfirmAllModal} onOpenChange={setShowConfirmAllModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar envio em massa
            </DialogTitle>
            <DialogDescription>
              Voce esta prestes a enviar um email para <strong>{users.length} usuarios</strong>.
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>Assunto:</strong> {formData.assunto}
            </p>
            <p className="text-sm">
              <strong>Mensagem:</strong>
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {formData.mensagem.substring(0, 200)}
              {formData.mensagem.length > 200 && '...'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmAllModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSendAll}
              disabled={sendToAllMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {sendToAllMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar Envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
