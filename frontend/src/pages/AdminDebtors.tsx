import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDebtors() {
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    loadDebtors();
  }, [page]);

  async function loadDebtors() {
    try {
      setLoading(true);
      const data = await adminApi.getDebtors({
        page,
        limit,
      });
      setDebtors(data.debtors);
      setTotal(data.total);
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os devedores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Devedores</h1>
      </div>

      {/* Tabela de Devedores */}
      <Card>
        <CardHeader>
          <CardTitle>
            Devedores ({total}) - Página {page} de {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : debtors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum devedor encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Localização
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dívidas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debtors.map((debtor) => (
                    <tr key={debtor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          {debtor.nome}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{debtor.telefone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {debtor.localizacao || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {debtor.usuario?.nome || '-'}
                        <br />
                        <span className="text-xs text-gray-500">{debtor.usuario?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="font-medium">{debtor._count?.dividas || 0}</span>{' '}
                        dívida(s)
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            debtor.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {debtor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(debtor.criadoEm).toLocaleDateString('pt-MZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de{' '}
                {total} devedores
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
