import { useEffect, useMemo, useState } from 'react';
import { adminApi, SurveyModal, SurveyModalInput, SurveyResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareText,
  Plus,
  Trash2,
} from 'lucide-react';

const emptyForm: SurveyModalInput = {
  titulo: '',
  descricao: '',
  pergunta: '',
  opcoes: ['Sim', 'Nao'],
  ativo: true,
};

function normalizeOptions(opcoes?: string[]) {
  return Array.isArray(opcoes) && opcoes.length >= 2 ? opcoes : ['Sim', 'Nao'];
}

export default function AdminSurveyResponses() {
  const { toast } = useToast();
  const [modals, setModals] = useState<SurveyModal[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<{ total: number; byAnswer: Record<string, number> }>({
    total: 0,
    byAnswer: {},
  });
  const [selectedModalId, setSelectedModalId] = useState<string>('');
  const [formData, setFormData] = useState<SurveyModalInput>(emptyForm);
  const [editingModalId, setEditingModalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedModal = useMemo(
    () => modals.find((modal) => modal.id === selectedModalId) || null,
    [modals, selectedModalId]
  );

  useEffect(() => {
    loadModals();
  }, []);

  useEffect(() => {
    loadResponses(selectedModalId || undefined);
  }, [selectedModalId]);

  async function loadModals() {
    try {
      setLoading(true);
      const data = await adminApi.getSurveyModals();
      const loadedModals = Array.isArray(data.modals) ? data.modals : [];
      setModals(loadedModals);
      setSelectedModalId((current) => current || loadedModals[0]?.id || '');
    } catch (error) {
      console.error('Erro ao carregar modais:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar os modais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadResponses(modalId?: string) {
    try {
      const data = await adminApi.getSurveyResponses(modalId);
      setResponses(Array.isArray(data.responses) ? data.responses : []);
      setStats({
        total: data.stats?.total || 0,
        byAnswer: data.stats?.byAnswer || {},
      });
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    }
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingModalId(null);
  }

  function handleEdit(modal: SurveyModal) {
    setEditingModalId(modal.id);
    setFormData({
      titulo: modal.titulo,
      descricao: modal.descricao || '',
      pergunta: modal.pergunta,
      opcoes: normalizeOptions(modal.opcoes),
      ativo: modal.ativo,
    });
  }

  function updateOption(index: number, value: string) {
    setFormData((current) => ({
      ...current,
      opcoes: normalizeOptions(current.opcoes).map((opcao, optionIndex) =>
        optionIndex === index ? value : opcao
      ),
    }));
  }

  function addOption() {
    setFormData((current) => ({
      ...current,
      opcoes: [...normalizeOptions(current.opcoes), ''],
    }));
  }

  function removeOption(index: number) {
    setFormData((current) => ({
      ...current,
      opcoes: normalizeOptions(current.opcoes).filter((_, optionIndex) => optionIndex !== index),
    }));
  }

  async function handleSave() {
    const payload = {
      ...formData,
      opcoes: normalizeOptions(formData.opcoes).map((opcao) => opcao.trim()).filter(Boolean),
    };

    if (!payload.titulo || !payload.pergunta || payload.opcoes.length < 2) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Informe titulo, pergunta e pelo menos duas opcoes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      if (editingModalId) {
        await adminApi.updateSurveyModal(editingModalId, payload);
        toast({ title: 'Modal atualizado', description: 'Alteracoes salvas.' });
      } else {
        await adminApi.createSurveyModal(payload);
        toast({ title: 'Modal publicado', description: 'O modal ja pode aparecer aos usuarios.' });
      }

      resetForm();
      await loadModals();
    } catch (error) {
      console.error('Erro ao salvar modal:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar o modal.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleModal(modal: SurveyModal) {
    try {
      await adminApi.updateSurveyModal(modal.id, { ativo: !modal.ativo });
      await loadModals();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel alterar o status.',
        variant: 'destructive',
      });
    }
  }

  async function deleteModal(modal: SurveyModal) {
    if (!confirm(`Remover o modal "${modal.titulo}" e as suas respostas?`)) {
      return;
    }

    try {
      await adminApi.deleteSurveyModal(modal.id);
      if (selectedModalId === modal.id) {
        setSelectedModalId('');
      }
      await loadModals();
      toast({ title: 'Modal removido', description: 'O modal foi apagado.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel remover o modal.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <MessageSquareText className="h-8 w-8 text-purple-600" />
            Modais e Pesquisas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Publique modais que aparecem uma vez para cada usuario.
          </p>
        </div>
        {editingModalId && (
          <Button variant="outline" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Modal
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingModalId ? 'Editar Modal' : 'Novo Modal'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(event) =>
                  setFormData({ ...formData, titulo: event.target.value })
                }
                placeholder="Ex: Pesquisa de satisfacao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(event) =>
                  setFormData({ ...formData, descricao: event.target.value })
                }
                placeholder="Texto curto que aparece antes da pergunta"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pergunta">Pergunta</Label>
              <Input
                id="pergunta"
                value={formData.pergunta}
                onChange={(event) =>
                  setFormData({ ...formData, pergunta: event.target.value })
                }
                placeholder="Ex: Estas a gostar do SystemAGT?"
              />
            </div>

            <div className="space-y-2">
              <Label>Opcoes</Label>
              <div className="space-y-2">
                {normalizeOptions(formData.opcoes).map((opcao, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={opcao}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder={`Opcao ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={normalizeOptions(formData.opcoes).length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Opcao
              </Button>
            </div>

            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(formData.ativo)}
                onChange={(event) =>
                  setFormData({ ...formData, ativo: event.target.checked })
                }
              />
              Publicar como ativo
            </label>

            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {editingModalId ? 'Salvar Alteracoes' : 'Publicar Modal'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modais Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : modals.length === 0 ? (
                <p className="py-8 text-center text-gray-600">Nenhum modal criado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Modal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Respostas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modals.map((modal) => (
                        <tr
                          key={modal.id}
                          className={`hover:bg-gray-50 ${selectedModalId === modal.id ? 'bg-purple-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <button className="text-left" onClick={() => setSelectedModalId(modal.id)}>
                              <p className="font-medium text-gray-900">{modal.titulo}</p>
                              <p className="text-sm text-gray-600">{modal.pergunta}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${modal.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                              {modal.ativo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {modal.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{modal.totalRespostas || 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => toggleModal(modal)}>
                                {modal.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(modal)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteModal(modal)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Respostas {selectedModal ? `- ${selectedModal.titulo}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedModalId === '' ? 'default' : 'outline'}
                  onClick={() => setSelectedModalId('')}
                >
                  Todas
                </Button>
                {Object.entries(stats.byAnswer).map(([answer, count]) => (
                  <span key={answer} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                    {answer}: {count}
                  </span>
                ))}
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  Total: {stats.total}
                </span>
              </div>

              {responses.length === 0 ? (
                <p className="py-8 text-center text-gray-600">Ainda nao existem respostas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Modal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resposta</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {responses.map((response) => (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{response.nome}</p>
                            <p className="text-sm text-gray-600">{response.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{response.modalTitulo}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                              {response.resposta}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(response.respondidoEm).toLocaleString('pt-MZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
