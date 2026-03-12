const express = require("express");
const cors = require("cors");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const AUTH_BASE_PATH = "./auth_sessions";

// ============ SISTEMA DE LOGS DETALHADOS ============

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function log(type, context, message, data = null) {
  const timestamp = getTimestamp();
  const prefix = {
    'INFO': '\x1b[36m[INFO]\x1b[0m',
    'SUCCESS': '\x1b[32m[OK]\x1b[0m',
    'WARN': '\x1b[33m[WARN]\x1b[0m',
    'ERROR': '\x1b[31m[ERRO]\x1b[0m',
    'DEBUG': '\x1b[35m[DEBUG]\x1b[0m',
    'SYSTEM': '\x1b[34m[SISTEMA]\x1b[0m',
    'WTS': '\x1b[32m[WHATSAPP]\x1b[0m',
    'API': '\x1b[33m[API]\x1b[0m',
  }[type] || `[${type}]`;

  const contextStr = context ? `\x1b[90m(${context})\x1b[0m` : '';
  console.log(`${timestamp} ${prefix} ${contextStr} ${message}`);

  if (data) {
    console.log(`               └─ Dados:`, JSON.stringify(data, null, 2));
  }
}

// Middleware para logar requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    log('API', req.method, `${req.path} ${statusColor}${res.statusCode}\x1b[0m (${duration}ms)`,
      req.body && Object.keys(req.body).length ? { body: req.body } : null
    );
  });
  next();
});

// Garantir que pasta base existe
if (!fs.existsSync(AUTH_BASE_PATH)) {
  fs.mkdirSync(AUTH_BASE_PATH, { recursive: true });
}

/**
 * Armazena todas as instâncias WhatsApp ativas
 * Chave: número de telefone (normalizado)
 * Valor: { sock, status, qr, reconnectAttempts, isConnecting }
 */
const instances = new Map();

/**
 * Locks para evitar conexões simultâneas ao mesmo número
 */
const connectionLocks = new Map();

/**
 * Normaliza número de telefone (remove caracteres especiais)
 */
function normalizeNumber(numero) {
  return numero.replace(/\D/g, "");
}

/**
 * Retorna o caminho da pasta auth para um número
 */
function getAuthPath(numero) {
  const normalized = normalizeNumber(numero);
  return path.join(AUTH_BASE_PATH, `auth_${normalized}`);
}

/**
 * Obtém ou cria instância para um número
 */
function getInstance(numero) {
  const normalized = normalizeNumber(numero);
  if (!instances.has(normalized)) {
    instances.set(normalized, {
      sock: null,
      status: "disconnected",
      qr: null,
      reconnectAttempts: 0,
      isConnecting: false,
    });
  }
  return instances.get(normalized);
}

/**
 * Fecha socket de forma segura
 */
async function closeSocket(sock, normalized) {
  if (!sock) return;

  try {
    log('INFO', normalized, 'Fechando socket antigo...');
    sock.ev.removeAllListeners();
    await sock.ws?.close();
    sock.end?.();
  } catch (error) {
    log('WARN', normalized, `Erro ao fechar socket: ${error.message}`);
  }
}

/**
 * Conecta ao WhatsApp para um número específico
 */
async function connectToWhatsApp(numero) {
  const normalized = normalizeNumber(numero);
  const instance = getInstance(numero);
  const authPath = getAuthPath(numero);

  // ============ PROTEÇÃO CONTRA CONEXÕES DUPLICADAS ============
  // Verifica se já existe uma conexão em andamento
  if (instance.isConnecting) {
    log('WARN', normalized, '⚠️ Conexão já em andamento - ignorando chamada duplicada');
    return;
  }

  // Verifica se já está conectado
  if (instance.status === "connected" && instance.sock) {
    log('INFO', normalized, 'Já conectado - ignorando');
    return;
  }

  // Marca como conectando para evitar duplicações
  instance.isConnecting = true;

  log('WTS', normalized, '═══════════════════════════════════════════════');
  log('WTS', normalized, `Iniciando processo de conexão WhatsApp`);
  log('WTS', normalized, `Número: ${normalized}`);
  log('WTS', normalized, `Pasta de sessão: ${authPath}`);

  try {
    // ============ FECHAR SOCKET ANTIGO SE EXISTIR ============
    if (instance.sock) {
      log('WARN', normalized, '⚠️ Socket antigo detectado - fechando antes de criar novo');
      await closeSocket(instance.sock, normalized);
      instance.sock = null;
    }

    instance.status = "connecting";
    instance.qr = null;

    // Garantir que pasta de sessão existe
    if (!fs.existsSync(authPath)) {
      log('INFO', normalized, 'Criando pasta de sessão (primeira conexão)');
      fs.mkdirSync(authPath, { recursive: true });
    } else {
      const hasCredentials = fs.existsSync(path.join(authPath, "creds.json"));
      log('INFO', normalized, `Pasta existente - Credenciais: ${hasCredentials ? 'SIM' : 'NÃO'}`);
    }

    log('INFO', normalized, 'Obtendo versão mais recente do Baileys...');
    const { version } = await fetchLatestBaileysVersion();
    log('SUCCESS', normalized, `Versão Baileys: ${version.join(".")}`);

    log('INFO', normalized, 'Carregando estado de autenticação...');
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    log('INFO', normalized, 'Criando socket WhatsApp...');
    const sock = makeWASocket({
      version,
      auth: state,
      logger: require("pino")({ level: "silent" }),
      browser: ["SystemAGT", "Chrome", "1.0.0"],
      // Configurações para manter conexão estável
      connectTimeoutMs: 60000,           // Timeout de conexão: 60s
      defaultQueryTimeoutMs: 60000,      // Timeout de queries: 60s
      keepAliveIntervalMs: 30000,        // Keepalive a cada 30s
      retryRequestDelayMs: 500,          // Delay entre retries
      markOnlineOnConnect: true,         // Marcar como online ao conectar
    });

    instance.sock = sock;
    log('SUCCESS', normalized, 'Socket criado com sucesso');

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        log('WTS', normalized, '📱 QR Code gerado - Aguardando escaneamento...');
        instance.qr = await QRCode.toDataURL(qr);
        instance.status = "waiting_qr";
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        instance.qr = null;
        instance.isConnecting = false;  // Reset flag ao fechar conexão

        if (reason === DisconnectReason.loggedOut) {
          log('WARN', normalized, '🚪 Sessão encerrada pelo usuário (logout)');
          instance.status = "disconnected";
          instance.sock = null;
          instance.reconnectAttempts = 0;

          // Limpar sessão antiga
          if (fs.existsSync(authPath)) {
            log('INFO', normalized, 'Limpando dados da sessão anterior...');
            fs.rmSync(authPath, { recursive: true, force: true });
            fs.mkdirSync(authPath, { recursive: true });
          }
        } else if (
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.timedOut ||
          reason === DisconnectReason.restartRequired
        ) {
          instance.reconnectAttempts++;

          if (instance.reconnectAttempts <= 3) {
            log('WARN', normalized, `🔄 Conexão perdida - Reconectando... (tentativa ${instance.reconnectAttempts}/3)`);
            instance.status = "reconnecting";
            // Aguarda mais tempo entre tentativas para evitar rate limiting
            setTimeout(() => connectToWhatsApp(numero), 5000);
          } else {
            log('ERROR', normalized, '❌ Máximo de tentativas atingido (3). Resetando sessão...');
            instance.status = "disconnected";
            instance.sock = null;
            instance.reconnectAttempts = 0;

            // Limpar sessão para forçar novo QR
            if (fs.existsSync(authPath)) {
              fs.rmSync(authPath, { recursive: true, force: true });
              fs.mkdirSync(authPath, { recursive: true });
            }
          }
        } else if (reason === DisconnectReason.connectionReplaced) {
          log('ERROR', normalized, '⚠️ CONEXÃO SUBSTITUÍDA - Possível conexão duplicada detectada!');
          log('WARN', normalized, '   Isso pode ocorrer quando múltiplas conexões são abertas para o mesmo número');
          instance.status = "disconnected";
          instance.sock = null;
          // NÃO reconectar automaticamente para evitar loop
        } else {
          log('WARN', normalized, `Desconectado (código: ${reason})`);
          instance.status = "disconnected";
        }
      }

      if (connection === "open") {
        log('SUCCESS', normalized, '✅ ═══════════════════════════════════════════');
        log('SUCCESS', normalized, `✅ CONECTADO COM SUCESSO!`);
        log('SUCCESS', normalized, `✅ Número: ${normalized}`);
        log('SUCCESS', normalized, '✅ ═══════════════════════════════════════════');
        instance.status = "connected";
        instance.qr = null;
        instance.reconnectAttempts = 0;
        instance.isConnecting = false;  // Conexão completa
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    log('ERROR', normalized, `Erro ao conectar: ${error.message}`);
    instance.status = "disconnected";
    instance.isConnecting = false;  // Reset em caso de erro
  }
}

/**
 * Envia mensagem usando a instância correta
 */
async function sendMessage(origem, destino, mensagem) {
  const normalized = normalizeNumber(origem);
  const instance = instances.get(normalized);

  log('WTS', normalized, '───────────────────────────────────────────────');
  log('WTS', normalized, `📤 Enviando mensagem`);
  log('INFO', normalized, `De: ${normalized}`);
  log('INFO', normalized, `Para: ${destino}`);
  log('INFO', normalized, `Mensagem: ${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}`);

  if (!instance || !instance.sock || instance.status !== "connected") {
    log('ERROR', normalized, `❌ WhatsApp não conectado! Status: ${instance?.status || 'não iniciado'}`);
    throw new Error(`WhatsApp ${normalized} nao conectado`);
  }

  // Normaliza destino
  const destinoNormalizado = normalizeNumber(destino);
  const jid = `${destinoNormalizado}@s.whatsapp.net`;

  await instance.sock.sendMessage(jid, { text: mensagem });
  log('SUCCESS', normalized, `✅ Mensagem enviada com sucesso para ${destinoNormalizado}`);
  return true;
}

/**
 * Carrega todas as sessões salvas ao iniciar
 */
async function loadSavedSessions() {
  log('SYSTEM', null, '═══════════════════════════════════════════════════════════');
  log('SYSTEM', null, '🔄 Carregando sessões salvas do disco...');
  log('SYSTEM', null, `📁 Pasta de sessões: ${AUTH_BASE_PATH}`);

  if (!fs.existsSync(AUTH_BASE_PATH)) {
    log('INFO', null, 'Nenhuma pasta de sessões encontrada');
    return;
  }

  const folders = fs.readdirSync(AUTH_BASE_PATH);
  const authFolders = folders.filter(f => f.startsWith("auth_"));
  log('INFO', null, `Encontradas ${authFolders.length} pasta(s) de sessão`);

  let reconnected = 0;
  let skipped = 0;

  for (const folder of authFolders) {
    const numero = folder.replace("auth_", "");
    const authPath = path.join(AUTH_BASE_PATH, folder);

    // Verifica se tem arquivos de credenciais
    const hasCredentials = fs.existsSync(path.join(authPath, "creds.json"));

    if (hasCredentials) {
      log('INFO', numero, `Sessão encontrada - Iniciando reconexão...`);
      try {
        await connectToWhatsApp(numero);
        reconnected++;
        // Aguarda entre conexões para não sobrecarregar e evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        log('ERROR', numero, `Erro ao reconectar: ${error.message}`);
      }
    } else {
      log('INFO', numero, 'Pasta sem credenciais - Ignorando');
      skipped++;
    }
  }

  log('SYSTEM', null, '═══════════════════════════════════════════════════════════');
  log('SYSTEM', null, `✅ Carregamento concluído: ${reconnected} reconectadas, ${skipped} ignoradas`);
  log('SYSTEM', null, '═══════════════════════════════════════════════════════════');
}

// ============ ROTAS DA API ============

/**
 * GET /status - Retorna status de uma instância
 * Query: numero
 */
app.get("/status", (req, res) => {
  const { numero } = req.query;

  if (!numero) {
    return res.status(400).json({ error: "numero é obrigatório" });
  }

  const normalized = normalizeNumber(numero);
  const instance = instances.get(normalized);

  if (!instance) {
    return res.json({
      status: "disconnected",
      connected: false,
      qr: null,
    });
  }

  res.json({
    status: instance.status,
    connected: instance.status === "connected",
    qr: instance.qr,
  });
});

/**
 * GET /qrcode - Retorna QR Code de uma instância
 * Query: numero
 */
app.get("/qrcode", (req, res) => {
  const { numero } = req.query;

  if (!numero) {
    return res.status(400).json({ error: "numero é obrigatório" });
  }

  const normalized = normalizeNumber(numero);
  const instance = instances.get(normalized);

  if (!instance) {
    return res.json({ qrcode: null, status: "disconnected" });
  }

  if (instance.status === "connected") {
    return res.json({ qrcode: null, message: "Já conectado" });
  }

  res.json({
    qrcode: instance.qr,
    status: instance.status,
  });
});

/**
 * POST /connect - Inicia conexão para um número
 * Body: { numero }
 */
app.post("/connect", async (req, res) => {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ success: false, error: "numero é obrigatório" });
  }

  const normalized = normalizeNumber(numero);
  const instance = getInstance(numero);

  // Já conectado - retorna sucesso imediato
  if (instance.status === "connected") {
    log('INFO', normalized, 'Requisição /connect - Já conectado');
    return res.json({ success: true, message: "Já conectado", status: "connected" });
  }

  // Conexão em andamento - retorna status atual sem iniciar nova
  if (instance.isConnecting || instance.status === "connecting" || instance.status === "waiting_qr" || instance.status === "reconnecting") {
    log('INFO', normalized, `Requisição /connect - Conexão já em andamento (${instance.status})`);
    return res.json({
      success: true,
      message: "Conexão em andamento",
      qr: instance.qr,
      status: instance.status
    });
  }

  try {
    log('INFO', normalized, 'Requisição /connect - Iniciando nova conexão');

    // Inicia conexão de forma assíncrona
    connectToWhatsApp(numero);

    // Aguarda um pouco para o QR ser gerado
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedInstance = getInstance(numero);
    res.json({
      success: true,
      message: "Iniciando conexão...",
      qr: updatedInstance.qr,
      status: updatedInstance.status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /disconnect - Desconecta uma instância
 * Body: { numero }
 */
app.post("/disconnect", async (req, res) => {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ success: false, error: "numero é obrigatório" });
  }

  const normalized = normalizeNumber(numero);
  const instance = instances.get(normalized);

  try {
    if (instance && instance.sock) {
      await instance.sock.logout();
      instance.sock = null;
    }

    if (instance) {
      instance.status = "disconnected";
      instance.qr = null;
    }

    res.json({ success: true, message: "Desconectado" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /send - Envia mensagem (compatível com frontend)
 * Body: { origem, destino, mensagem }
 */
app.post("/send", async (req, res) => {
  const { origem, destino, mensagem } = req.body;

  if (!origem || !destino || !mensagem) {
    return res.status(400).json({
      success: false,
      error: "origem, destino e mensagem são obrigatórios"
    });
  }

  try {
    await sendMessage(origem, destino, mensagem);
    res.json({ success: true, message: "Mensagem enviada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /enviar - Alias para /send (compatibilidade com frontend atual)
 */
app.post("/enviar", async (req, res) => {
  const { origem, destino, mensagem } = req.body;

  if (!origem || !destino || !mensagem) {
    return res.status(400).json({
      success: false,
      error: "origem, destino e mensagem são obrigatórios"
    });
  }

  try {
    await sendMessage(origem, destino, mensagem);
    res.json({ success: true, message: "Mensagem enviada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /reset - Limpa sessão de um número
 * Body: { numero }
 */
app.post("/reset", async (req, res) => {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ success: false, error: "numero é obrigatório" });
  }

  const normalized = normalizeNumber(numero);
  const instance = instances.get(normalized);
  const authPath = getAuthPath(numero);

  try {
    // Desconectar se conectado
    if (instance && instance.sock) {
      try {
        await instance.sock.logout();
      } catch (e) {
        // Ignorar erro de logout
      }
      instance.sock = null;
    }

    // Limpar pasta de sessão
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      fs.mkdirSync(authPath, { recursive: true });
    }

    if (instance) {
      instance.status = "disconnected";
      instance.qr = null;
      instance.reconnectAttempts = 0;
    }

    log('SUCCESS', normalized, '🔄 Sessão resetada com sucesso');
    res.json({ success: true, message: "Sessão resetada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /instances - Lista todas as instâncias (para debug/admin)
 */
app.get("/instances", (req, res) => {
  const list = [];

  instances.forEach((instance, numero) => {
    list.push({
      numero,
      status: instance.status,
      connected: instance.status === "connected",
      hasQR: !!instance.qr,
    });
  });

  res.json({ instances: list, total: list.length });
});

/**
 * GET /health - Health check
 */
app.get("/health", (req, res) => {
  const connectedCount = Array.from(instances.values())
    .filter(i => i.status === "connected").length;

  res.json({
    ok: true,
    instances: instances.size,
    connected: connectedCount
  });
});

// Monitor de conexões - loga estado e reconecta desconectados a cada 2 minutos
function startConnectionMonitor() {
  setInterval(async () => {
    const stats = {
      total: instances.size,
      connected: 0,
      disconnected: 0,
      connecting: 0,
      waiting_qr: 0,
      reconnecting: 0,
    };

    // Lista de números desconectados para reconectar
    const disconnectedNumbers = [];

    instances.forEach((instance, numero) => {
      if (instance.status === 'connected') stats.connected++;
      else if (instance.status === 'disconnected') {
        stats.disconnected++;
        disconnectedNumbers.push(numero);
      }
      else if (instance.status === 'connecting') stats.connecting++;
      else if (instance.status === 'waiting_qr') stats.waiting_qr++;
      else if (instance.status === 'reconnecting') stats.reconnecting++;
    });

    if (stats.total > 0) {
      log('SYSTEM', null, `📊 Monitor: ${stats.connected}/${stats.total} conectados | ` +
        `${stats.disconnected} desconectados | ${stats.reconnecting} reconectando | ` +
        `${stats.waiting_qr} aguardando QR`);
    }

    // Reconectar instâncias desconectadas que possuem credenciais
    if (disconnectedNumbers.length > 0) {
      log('SYSTEM', null, `🔄 Iniciando reconexão automática de ${disconnectedNumbers.length} instância(s)...`);

      for (const numero of disconnectedNumbers) {
        const authPath = getAuthPath(numero);
        const hasCredentials = fs.existsSync(path.join(authPath, "creds.json"));

        if (hasCredentials) {
          const instance = instances.get(numero);

          // Só reconecta se não estiver em processo de conexão
          if (instance && !instance.isConnecting) {
            log('SYSTEM', numero, `🔌 Reconectando automaticamente...`);

            // Reset tentativas para permitir nova reconexão
            instance.reconnectAttempts = 0;

            try {
              await connectToWhatsApp(numero);
              // Aguarda entre conexões para evitar rate limiting
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
              log('ERROR', numero, `Erro na reconexão automática: ${error.message}`);
            }
          }
        } else {
          log('INFO', numero, `Sem credenciais salvas - ignorando reconexão automática`);
        }
      }

      log('SYSTEM', null, `✅ Reconexão automática concluída`);
    }
  }, 2 * 60 * 1000); // A cada 2 minutos
}

// Inicia servidor
app.listen(PORT, async () => {
  console.log('');
  log('SYSTEM', null, '╔══════════════════════════════════════════════════════════╗');
  log('SYSTEM', null, '║       SYSTEMAGT - SERVIÇO WHATSAPP MULTI-USUÁRIO         ║');
  log('SYSTEM', null, '╠══════════════════════════════════════════════════════════╣');
  log('SYSTEM', null, `║  Porta: ${PORT}                                             ║`);
  log('SYSTEM', null, `║  Pasta de sessões: ${AUTH_BASE_PATH.padEnd(28)}      ║`);
  log('SYSTEM', null, '╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Carrega sessões salvas após iniciar o servidor
  await loadSavedSessions();

  // Inicia monitor de conexões
  startConnectionMonitor();

  console.log('');
  log('SUCCESS', null, '🚀 Serviço WhatsApp pronto para receber conexões!');
  console.log('');
});
