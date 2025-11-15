import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Users, DollarSign, TrendingUp, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Carregando estatísticas...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 h-[120px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.resumo;
  const dividasProximas = data?.dividasProximasVencimento || [];
  const dividasAtrasadas = data?.dividasAtrasadas || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu sistema de gestão</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Devedores</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalDevedores || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Emprestado</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(stats?.totalEmprestado || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total a Receber</p>
                <p className="text-2xl font-bold text-green-500 mt-1">
                  {formatCurrency(stats?.totalAReceber || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  {formatCurrency(stats?.valorEmAtraso || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dívidas Ativas</p>
                <p className="text-xl font-bold text-foreground mt-1">{stats?.dividasAtivas || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas ao Vencimento</p>
                <p className="text-xl font-bold text-orange-500 mt-1">{dividasProximas.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dívidas Atrasadas</p>
                <p className="text-xl font-bold text-destructive mt-1">{dividasAtrasadas.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dívidas Próximas ao Vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Próximas ao Vencimento
            </CardTitle>
            <CardDescription>Dívidas que vencem nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {dividasProximas.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma dívida próxima ao vencimento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dividasProximas.map((divida) => (
                  <Link
                    key={divida.id}
                    to={`/dividas/${divida.id}`}
                    className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{divida.devedorNome}</p>
                        <p className="text-sm text-muted-foreground">{divida.devedorTelefone}</p>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                        {divida.diasParaVencer} {divida.diasParaVencer === 1 ? 'dia' : 'dias'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Restante</p>
                        <p className="text-lg font-bold text-destructive">{formatCurrency(divida.valorRestante)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="text-sm font-medium">{formatDate(divida.dataVencimento)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dívidas Atrasadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Dívidas Atrasadas
            </CardTitle>
            <CardDescription>Top 5 dívidas com maior atraso</CardDescription>
          </CardHeader>
          <CardContent>
            {dividasAtrasadas.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhuma dívida atrasada! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dividasAtrasadas.map((divida) => (
                  <Link
                    key={divida.id}
                    to={`/dividas/${divida.id}`}
                    className="block p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{divida.devedorNome}</p>
                        <p className="text-sm text-muted-foreground">{divida.devedorTelefone}</p>
                      </div>
                      <Badge variant="destructive">
                        {divida.diasAtrasado} {divida.diasAtrasado === 1 ? 'dia' : 'dias'} atrasado
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Restante</p>
                        <p className="text-lg font-bold text-destructive">{formatCurrency(divida.valorRestante)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Venceu em</p>
                        <p className="text-sm font-medium">{formatDate(divida.dataVencimento)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/devedores">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Ver Devedores
              </Button>
            </Link>
            <Link to="/dividas">
              <Button variant="outline" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Ver Dívidas
              </Button>
            </Link>
            <Link to="/dividas">
              <Button variant="outline" className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Cadastrar Dívida
              </Button>
            </Link>
            <Button variant="outline" className="w-full" disabled>
              <AlertCircle className="mr-2 h-4 w-4" />
              Notificações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
