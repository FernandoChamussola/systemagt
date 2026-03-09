import { useEffect, useRef, useState } from 'react';
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  Send,
  Smartphone,
  Info,
  Clock,
  PlayCircle,
  Video,
  Signal,
  ShieldCheck,
  X,
  Lock,
} from 'lucide-react';

type UltimaConexao = {
  status: 'sucesso' | 'erro';
  data: string;
};

type Tutorial = {
  id: string;
  titulo: string;
  descricao: string;
  videoUrl: string | null;
  duracao: string;
  disponivel: boolean;
};

const TUTORIAIS: Tutorial[] = [
  {
    id: 'intro',
    titulo: 'Introdução ao Sistema',
    descricao: 'Conheça o SystemAGT e suas principais funcionalidades',
    videoUrl: '/systemAGT.mp4',
    duracao: '5:30',
    disponivel: true,
  },
  {
    id: 'whatsapp',
    titulo: 'Conectar WhatsApp',
    descricao: 'Aprenda a conectar seu WhatsApp ao sistema passo a passo',
    videoUrl: null,
    duracao: '3:45',
    disponivel: false,
  },
  {
    id: 'devedores',
    titulo: 'Gerenciar Devedores',
    descricao: 'Como cadastrar e gerenciar seus devedores',
    videoUrl: null,
    duracao: '4:20',
    disponivel: false,
  },
  {
    id: 'dividas',
    titulo: 'Criar e Acompanhar Dívidas',
    descricao: 'Registre dívidas e acompanhe pagamentos',
    videoUrl: null,
    duracao: '6:15',
    disponivel: false,
  },
  {
    id: 'notificacoes',
    titulo: 'Sistema de Notificações',
    descricao: 'Configure notificações automáticas via WhatsApp',
    videoUrl: null,
    duracao: '4:50',
    disponivel: false,
  },
  {
    id: 'relatorios',
    titulo: 'Gerar Relatórios',
    descricao: 'Exporte relatórios em PDF com análises completas',
    videoUrl: null,
    duracao: '3:30',
    disponivel: false,
  },
];

export default function Definicoes() {
  const [numero, setNumero] = useState('');
  const [status, setStatus] = useState<string>('desconectado');
  const [qr, setQr] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [ultimaConexao, setUltimaConexao] = useState<UltimaConexao | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [tutorialSelecionado, setTutorialSelecionado] = useState<Tutorial | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  function guardarUltimaConexao(status: 'sucesso' | 'erro') {
    const data = new Date().toLocaleString();
    const info = { status, data };
    setUltimaConexao(info);
  }

  async function conectar() {
    setIsConnecting(true);
    try {
      const res = await fetch('/wts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.qr) setQr(data.qr);
      guardarUltimaConexao('sucesso');
      iniciarPolling();
    } catch (error) {
      guardarUltimaConexao('erro');
      setToastMessage({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao WhatsApp.',
        type: 'error'
      });
    } finally {
      setIsConnecting(false);
    }
  }

  async function enviarTeste() {
    setIsSending(true);
    try {
      const res = await fetch('/wts/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem: numero,
          destino: numero,
          mensagem,
        }),
      });
      if (!res.ok) throw new Error();
      
      setToastMessage({
        title: 'Mensagem enviada!',
        description: 'Mensagem de teste enviada com sucesso.',
        type: 'success'
      });
      setMensagem('');
    } catch (error) {
      setToastMessage({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  }

  function iniciarPolling() {
    if (!numero) return;
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/wts/status?numero=${numero}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();

        setStatus(data.status);

        if (data.status === 'conectado') {
          setQr(null);
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.qr) {
          setQr(data.qr);
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 2000);
  }

  function abrirTutorial(tutorial: Tutorial) {
    if (!tutorial.disponivel) {
      setToastMessage({
        title: 'Em breve',
        description: 'Este tutorial estará disponível em breve!',
        type: 'success'
      });
      return;
    }
    setTutorialSelecionado(tutorial);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setTutorialSelecionado(null);
  }

  return (
    <div className="space-y-6 max-w-6xl p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top">
          <div className={`rounded-lg border p-4 shadow-lg ${
            toastMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <h3 className="font-semibold mb-1">{toastMessage.title}</h3>
            <p className="text-sm text-muted-foreground">{toastMessage.description}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conexão WhatsApp e aprenda a usar todas as funcionalidades
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Ver Tutoriais
        </button>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status da Conexão */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            {status === 'conectado' ? (
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{status}</p>
            </div>
          </div>
        </div>

        {/* Qualidade do Sinal */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Signal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Qualidade</p>
              <p className="font-semibold">
                {status === 'conectado' ? 'Excelente' : 'Aguardando...'}
              </p>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Segurança</p>
              <p className="font-semibold">Criptografado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso Importante */}
      <div className="space-y-3 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <p className="font-semibold text-foreground">
              ⚡ Importante: Leia antes de conectar
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Use o número com código do país e DDD (ex: 25884xxxxxxx)</li>
              <li>Só reconecte se houver problemas no envio de mensagens</li>
              <li>O número deve ser o mesmo do cadastro da sua conta</li>
              <li>Mantenha o WhatsApp Web desconectado em outros dispositivos</li>
            </ul>

            {ultimaConexao && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Última conexão:</span>
                <span
                  className={`text-sm font-medium ${
                    ultimaConexao.status === 'sucesso'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {ultimaConexao.data}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conexão WhatsApp */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Conectar WhatsApp
          </h3>
          <button
            onClick={() => abrirTutorial(TUTORIAIS[1])}
            disabled
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
          >
            <Video className="w-4 h-4" />
            Ver tutorial (em breve)
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="numero" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Número com DDD e código do país
            </label>
            <input
              id="numero"
              placeholder="25884xxxxxxx"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: 25884xxxxxxx (Moçambique)
            </p>
          </div>

          <button
            onClick={conectar}
            disabled={isConnecting || !numero}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full gap-2"
          >
            <QrCode className="h-5 w-5" />
            {isConnecting ? 'Conectando...' : 'Gerar QR Code'}
          </button>
        </div>

        {qr && (
          <div className="flex flex-col items-center gap-4 pt-4 border-t border-border">
            <div className="text-center space-y-2">
              <p className="font-medium">Escaneie o QR Code no WhatsApp</p>
              <ol className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em Mais opções (⋮) {'>'} Dispositivos conectados</li>
                <li>3. Toque em Conectar um dispositivo</li>
                <li>4. Aponte seu celular para esta tela para escanear o código</li>
              </ol>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
              <img src={qr} alt="QR Code" className="w-64 h-64" />
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando escaneamento...
            </p>
          </div>
        )}
      </div>

      {/* Teste de Envio */}
      {status === 'conectado' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Testar Envio de Mensagem
          </h3>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✅ WhatsApp conectado com sucesso! Envie uma mensagem de teste para confirmar.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="mensagem" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Mensagem de teste
            </label>
            <input
              id="mensagem"
              placeholder="Olá! Testando o sistema..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            onClick={enviarTeste}
            disabled={isSending || !mensagem}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full gap-2"
          >
            <Send className="h-5 w-5" />
            {isSending ? 'Enviando...' : 'Enviar Mensagem de Teste'}
          </button>
        </div>
      )}

      {/* Seção de Tutoriais */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <PlayCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Central de Tutoriais</h3>
            <p className="text-sm text-muted-foreground">
              Aprenda a usar todas as funcionalidades do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TUTORIAIS.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => abrirTutorial(tutorial)}
              disabled={!tutorial.disponivel}
              className={`bg-muted border border-border rounded-lg p-4 transition-all text-left group relative ${
                tutorial.disponivel
                  ? 'hover:bg-muted/80 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {!tutorial.disponivel && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg transition-transform ${
                    tutorial.disponivel
                      ? 'bg-red-100 dark:bg-red-900/20 group-hover:scale-110'
                      : 'bg-gray-100 dark:bg-gray-900/20'
                  }`}
                >
                  <Video
                    className={`w-5 h-5 ${
                      tutorial.disponivel
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-1 text-sm ${
                      tutorial.disponivel ? 'group-hover:text-primary transition-colors' : ''
                    }`}
                  >
                    {tutorial.titulo}
                  </h4>
                  <p className="text-xs text-muted-foreground">{tutorial.duracao}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tutorial.descricao}
              </p>
              {!tutorial.disponivel && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  Em breve
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Tutorial */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-card border border-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Header do Modal */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    {tutorialSelecionado?.titulo || 'Tutoriais do Sistema'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tutorialSelecionado?.descricao || 'Aprenda a usar todas as funcionalidades'}
                  </p>
                </div>
                <button
                  onClick={fecharModal}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {tutorialSelecionado ? (
                <div className="space-y-4">
                  {/* Player de Vídeo */}
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={tutorialSelecionado.videoUrl || ''}
                      className="w-full h-full"
                      allow="autoplay"
                      allowFullScreen
                      title={tutorialSelecionado.titulo}
                    />
                  </div>

                  {/* Outros Tutoriais */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-3">Outros tutoriais</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {TUTORIAIS.filter((t) => t.id !== tutorialSelecionado.id).map((tutorial) => (
                        <button
                          key={tutorial.id}
                          onClick={() => tutorial.disponivel && setTutorialSelecionado(tutorial)}
                          disabled={!tutorial.disponivel}
                          className={`rounded-lg p-3 text-left text-sm transition-colors relative ${
                            tutorial.disponivel
                              ? 'bg-muted hover:bg-muted/80 cursor-pointer'
                              : 'bg-muted/50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {!tutorial.disponivel && (
                            <Lock className="w-3 h-3 text-muted-foreground absolute top-2 right-2" />
                          )}
                          <p className="font-medium text-xs mb-1">{tutorial.titulo}</p>
                          <p className="text-xs text-muted-foreground">{tutorial.duracao}</p>
                          {!tutorial.disponivel && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Em breve
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TUTORIAIS.map((tutorial) => (
                    <button
                      key={tutorial.id}
                      onClick={() => abrirTutorial(tutorial)}
                      disabled={!tutorial.disponivel}
                      className={`border border-border rounded-lg p-4 transition-all text-left group relative ${
                        tutorial.disponivel
                          ? 'bg-muted hover:bg-muted/80 cursor-pointer'
                          : 'bg-muted/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {!tutorial.disponivel && (
                        <div className="absolute top-3 right-3">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            tutorial.disponivel
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-gray-100 dark:bg-gray-900/20'
                          }`}
                        >
                          <Video
                            className={`w-5 h-5 ${
                              tutorial.disponivel
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{tutorial.titulo}</h4>
                          <p className="text-xs text-muted-foreground">{tutorial.duracao}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{tutorial.descricao}</p>
                      {!tutorial.disponivel && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                          Em breve
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}