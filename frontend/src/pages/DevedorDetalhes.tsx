import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { debtorApi, debtApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  User,
  FileText,
  DollarSign,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function DevedorDetalhes() {
  const { id } = useParams<{ id: string }>();

  const { data: debtorData, isLoading: loadingDebtor } = useQuery({
    queryKey: ['debtor', id],
    queryFn: () => debtorApi.get(id!),
    enabled: !!id,
  });

  const { data: debtsData, isLoading: loadingDebts } = useQuery({
    queryKey: ['debts', id],
    queryFn: () => debtApi.list({ devedorId: id! }),
    enabled: !!id,
  });

  if (loadingDebtor) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!debtorData?.debtor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Devedor não encontrado</p>
        <Link to="/devedores">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const { debtor } = debtorData;
  const debts = debtsData?.debts || [];
  const totalDividas = debts.reduce((sum, debt) => sum + debt.valorAtual, 0);
  const dividasAtivas = debts.filter((d) => d.status !== 'PAGO');

  function getStatusIcon(status: string) {
    switch (status) {
      case 'PAGO':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ATRASADO':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/devedores">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{debtor.nome}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {debtor.telefone}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total em Dívidas</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {totalDividas.toLocaleString('pt-MZ')} MT
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Dívidas Ativas</p>
          <p className="text-2xl font-bold text-foreground mt-1">{dividasAtivas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Dívidas Pagas</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {debts.filter((d) => d.status === 'PAGO').length}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Informações</h3>

          <div className="space-y-3">
            {debtor.localizacao && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{debtor.localizacao}</span>
              </div>
            )}

            {debtor.outrosTelefones && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{debtor.outrosTelefones}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Cadastrado em {new Date(debtor.criadoEm).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {debtor.descricao && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descrição
            </h3>
            <p className="text-sm text-muted-foreground">{debtor.descricao}</p>
          </div>
        )}
      </div>

      {/* Dívidas */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Dívidas</h3>
          <Link to="/dividas">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Dívida
            </Button>
          </Link>
        </div>

        {loadingDebts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : debts.length > 0 ? (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(debt.status)}
                  <div>
                    <p className="font-medium">
                      {debt.valorAtual.toLocaleString('pt-MZ')} MT
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vence em {new Date(debt.dataVencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <Link to={`/dividas/${debt.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-3 w-3" />
                    Ver
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma dívida cadastrada para este devedor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
