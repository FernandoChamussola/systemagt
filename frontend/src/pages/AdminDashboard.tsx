import { useEffect, useState } from 'react';
import { adminApi, AdminStats } from '@/lib/api';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar estatísticas do sistema</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuários */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Usuários
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.users.active} ativos
            </p>
          </CardContent>
        </Card>

        {/* Dívidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Dívidas
            </CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.debts.total}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.debts.byStatus.length} status diferentes
            </p>
          </CardContent>
        </Card>

        {/* Valor Emprestado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Emprestado
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.debts.totalLent)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total em circulação</p>
          </CardContent>
        </Card>

        {/* Valor a Receber */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor a Receber
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.debts.totalReceivable)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Pendente de pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dívidas por Status */}
      {stats.debts.byStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dívidas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.debts.byStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="font-medium capitalize">{item.status.toLowerCase()}</span>
                  <span className="text-gray-600">{item._count} dívidas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas de Notificações */}
      {stats.notifications.byStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notificações por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.notifications.byStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="font-medium capitalize">{item.status.toLowerCase()}</span>
                  <span className="text-gray-600">{item._count} notificações</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crescimento de Usuários */}
      {stats.growth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.growth.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="font-medium">
                    {new Date(item.criadoEm).toLocaleDateString('pt-MZ')}
                  </span>
                  <span className="text-gray-600">{item._count} usuários</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
