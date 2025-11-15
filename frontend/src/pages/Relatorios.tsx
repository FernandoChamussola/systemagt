import { useState } from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { debtorApi, DebtStatus } from '@/lib/api';

export default function Relatorios() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Filtros para relatório de dívidas
  const [dividaFilters, setDividaFilters] = useState({
    devedorId: '',
    status: '' as DebtStatus | '',
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
  });

  // Filtros para relatório de pagamentos
  const [pagamentoFilters, setPagamentoFilters] = useState({
    devedorId: '',
    dividaId: '',
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
  });

  const [devedores, setDevedores] = useState<any[]>([]);

  // Carregar devedores ao montar o componente
  useState(() => {
    const loadDevedores = async () => {
      try {
        const data = await debtorApi.list();
        setDevedores(data.debtors || []);
      } catch (error) {
        console.error('Erro ao carregar devedores:', error);
      }
    };
    loadDevedores();
  });

  const gerarRelatorioDividas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dividaFilters.devedorId) params.append('devedorId', dividaFilters.devedorId);
      if (dividaFilters.status) params.append('status', dividaFilters.status);
      if (dividaFilters.dataInicio) params.append('dataInicio', dividaFilters.dataInicio.toISOString());
      if (dividaFilters.dataFim) params.append('dataFim', dividaFilters.dataFim.toISOString());

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/reports/dividas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-dividas-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório de dívidas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioPagamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pagamentoFilters.devedorId) params.append('devedorId', pagamentoFilters.devedorId);
      if (pagamentoFilters.dividaId) params.append('dividaId', pagamentoFilters.dividaId);
      if (pagamentoFilters.dataInicio) params.append('dataInicio', pagamentoFilters.dataInicio.toISOString());
      if (pagamentoFilters.dataFim) params.append('dataFim', pagamentoFilters.dataFim.toISOString());

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/reports/pagamentos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-pagamentos-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório de pagamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioDevedores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/reports/devedores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-devedores-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório de devedores.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioCompleto = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/reports/completo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-completo-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado!',
        description: 'O download do PDF foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro ao gerar o relatório completo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-gray-500 mt-1">
            Gere relatórios em PDF com informações detalhadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatório de Dívidas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle>Relatório de Dívidas</CardTitle>
            </div>
            <CardDescription>
              Exporte todas as dívidas cadastradas com detalhes completos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="divida-devedor">Filtrar por Devedor (opcional)</Label>
              <Select
                value={dividaFilters.devedorId || undefined}
                onValueChange={(value: string) =>
                  setDividaFilters({ ...dividaFilters, devedorId: value })
                }
              >
                <SelectTrigger id="divida-devedor">
                  <SelectValue placeholder="Todos os devedores" />
                </SelectTrigger>
                <SelectContent>
                  {devedores.map((devedor) => (
                    <SelectItem key={devedor.id} value={devedor.id}>
                      {devedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="divida-status">Filtrar por Status (opcional)</Label>
              <Select
                value={dividaFilters.status || undefined}
                onValueChange={(value: string) =>
                  setDividaFilters({ ...dividaFilters, status: value as DebtStatus | '' })
                }
              >
                <SelectTrigger id="divida-status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="ATRASADO">Atrasado</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <DatePicker
                  date={dividaFilters.dataInicio}
                  onDateChange={(date) =>
                    setDividaFilters({ ...dividaFilters, dataInicio: date })
                  }
                  placeholder="Selecione a data inicial"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <DatePicker
                  date={dividaFilters.dataFim}
                  onDateChange={(date) =>
                    setDividaFilters({ ...dividaFilters, dataFim: date })
                  }
                  placeholder="Selecione a data final"
                />
              </div>
            </div>

            <Button
              onClick={gerarRelatorioDividas}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Pagamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <CardTitle>Relatório de Pagamentos</CardTitle>
            </div>
            <CardDescription>
              Exporte todos os pagamentos registrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pagamento-devedor">Filtrar por Devedor (opcional)</Label>
              <Select
                value={pagamentoFilters.devedorId || undefined}
                onValueChange={(value: string) =>
                  setPagamentoFilters({ ...pagamentoFilters, devedorId: value })
                }
              >
                <SelectTrigger id="pagamento-devedor">
                  <SelectValue placeholder="Todos os devedores" />
                </SelectTrigger>
                <SelectContent>
                  {devedores.map((devedor) => (
                    <SelectItem key={devedor.id} value={devedor.id}>
                      {devedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <DatePicker
                  date={pagamentoFilters.dataInicio}
                  onDateChange={(date) =>
                    setPagamentoFilters({ ...pagamentoFilters, dataInicio: date })
                  }
                  placeholder="Selecione a data inicial"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <DatePicker
                  date={pagamentoFilters.dataFim}
                  onDateChange={(date) =>
                    setPagamentoFilters({ ...pagamentoFilters, dataFim: date })
                  }
                  placeholder="Selecione a data final"
                />
              </div>
            </div>

            <Button
              onClick={gerarRelatorioPagamentos}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Devedores */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-red-600" />
              <CardTitle>Relatório de Devedores</CardTitle>
            </div>
            <CardDescription>
              Exporte a lista completa de devedores cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Este relatório inclui todos os devedores cadastrados no sistema com suas
              respectivas estatísticas de dívidas.
            </p>

            <Button
              onClick={gerarRelatorioDevedores}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Relatório Completo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle>Relatório Executivo Completo</CardTitle>
            </div>
            <CardDescription>
              Resumo executivo com todas as estatísticas e análises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Este relatório contém um resumo executivo completo com visão geral do
              negócio, status das dívidas, resumo financeiro e top 5 maiores devedores.
            </p>

            <Button
              onClick={gerarRelatorioCompleto}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
