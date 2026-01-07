import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDebts() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    loadDebts();
  }, [page, statusFilter]);

  async function loadDebts() {
    try {
      setLoading(true);
      const data = await adminApi.getDebts({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setDebts(data.debts);
      setTotal(data.total);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as dívidas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAGO':
        return 'bg-green-100 text-green-800';
      case 'ATRASADO':
        return 'bg-red-100 text-red-800';
      case 'PARCIALMENTE_PAGO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Dívidas</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'PENDENTE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PENDENTE')}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === 'PAGO' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PAGO')}
              >
                Pagas
              </Button>
              <Button
                variant={statusFilter === 'ATRASADO' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ATRASADO')}
              >
                Atrasadas
              </Button>
              <Button
                variant={statusFilter === 'PARCIALMENTE_PAGO' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('PARCIALMENTE_PAGO')}
              >
                Parcialmente Pagas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dívidas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Dívidas ({total}) - Página {page} de {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhuma dívida encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Devedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor Inicial
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valor Atual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vencimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Criada em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debts.map((debt) => (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {debt.usuario?.nome || '-'}
                        <br />
                        <span className="text-xs text-gray-500">{debt.usuario?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {debt.devedor?.nome || '-'}
                        <br />
                        <span className="text-xs text-gray-500">{debt.devedor?.telefone}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(debt.valorInicial)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(debt.valorAtual)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            debt.status
                          )}`}
                        >
                          {debt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {debt.dataVencimento
                          ? new Date(debt.dataVencimento).toLocaleDateString('pt-MZ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(debt.criadoEm).toLocaleDateString('pt-MZ')}
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
                {total} dívidas
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
