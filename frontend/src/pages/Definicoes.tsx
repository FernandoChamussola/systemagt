import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  Send,
  Smartphone,
  Info,
  Clock,
} from 'lucide-react';

type UltimaConexao = {
  status: 'sucesso' | 'erro';
  data: string;
};

export default function Definicoes() {
  const { toast } = useToast();

  const [numero, setNumero] = useState('');
  const [status, setStatus] = useState<string>('desconectado');
  const [qr, setQr] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [ultimaConexao, setUltimaConexao] = useState<UltimaConexao | null>(null);

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ultima_conexao_whatsapp');
    if (saved) setUltimaConexao(JSON.parse(saved));
    iniciarPolling();
  }, []);

  function guardarUltimaConexao(status: 'sucesso' | 'erro') {
    const data = new Date().toLocaleString();
    const info = { status, data };
    localStorage.setItem(
      'ultima_conexao_whatsapp',
      JSON.stringify(info)
    );
    setUltimaConexao(info);
  }

  const conectarMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('https://wtsapi.duckdns.org/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: (data) => {
      if (data.qr) setQr(data.qr);
      guardarUltimaConexao('sucesso');
      iniciarPolling();
    },
    onError: () => {
      guardarUltimaConexao('erro');
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao WhatsApp.',
        variant: 'destructive',
      });
    },
  });

  const enviarTesteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('https://wtsapi.duckdns.org/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem: numero,
          destino: numero,
          mensagem,
        }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada!',
        description: 'Mensagem de teste enviada com sucesso.',
      });
      setMensagem('');
    },
  });

  function iniciarPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const res = await fetch(
        `https://wtsapi.duckdns.org/status?numero=${numero}`
      );
      const data = await res.json();

      setStatus(data.status);

      if (data.status === 'conectado') {
        setQr(null);
        clearInterval(pollingRef.current!);
      } else if (data.qr) {
        setQr(data.qr);
      }
    }, 2000);
  }

  function AvisoInfo() {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <p className="text-muted-foreground">
            <strong>Importante:</strong> Não volte a conectar este número após
            uma conexão bem-sucedida.  
            Só reconecte caso tenha problemas no envio de mensagens.
            O número a conectar deve ser o mesmo do cadastro da conta no sistema.
          </p>
        </div>

        {ultimaConexao && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Última conexão:
            </span>
            <span
              className={`font-medium ${
                ultimaConexao.status === 'sucesso'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {ultimaConexao.data}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Definições</h1>
        <p className="text-muted-foreground">
          Configuração da conexão com WhatsApp
        </p>
      </div>

      {/* Aviso + Última conexão */}
      <AvisoInfo />

      {/* Status */}
      <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-3">
        {status === 'conectado' ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        )}
        <div>
          <p className="text-sm text-muted-foreground">Status da Conexão</p>
          <p className="font-medium capitalize">{status}</p>
        </div>
      </div>

      {/* Conexão */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Conectar WhatsApp
        </h3>

        <div className="space-y-2">
          <Label>Número com DDD e país</Label>
          <Input
            placeholder="25884xxxxxxx"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>

        <Button
          onClick={() => conectarMutation.mutate()}
          disabled={conectarMutation.isPending}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Conectar
        </Button>

        {qr && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code no WhatsApp
            </p>
            <img src={qr} alt="QR Code" className="w-52 h-52" />
          </div>
        )}
      </div>

      {/* Teste */}
      {status === 'conectado' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" />
            Testar Envio
          </h3>

          <AvisoInfo />

          <div className="space-y-2">
            <Label>Mensagem de teste</Label>
            <Input
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>

          <Button onClick={() => enviarTesteMutation.mutate()}>
            <Send className="mr-2 h-4 w-4" />
            Testar
          </Button>
        </div>
      )}
    </div>
  );
}
