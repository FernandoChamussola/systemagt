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

// Garantir que pasta base existe
if (!fs.existsSync(AUTH_BASE_PATH)) {
  fs.mkdirSync(AUTH_BASE_PATH, { recursive: true });
}

/**
 * Armazena todas as instâncias WhatsApp ativas
 * Chave: número de telefone (normalizado)
 * Valor: { sock, status, qr, reconnectAttempts }
 */
const instances = new Map();

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
    });
  }
  return instances.get(normalized);
}

/**
 * Conecta ao WhatsApp para um número específico
 */
async function connectToWhatsApp(numero) {
  const normalized = normalizeNumber(numero);
  const instance = getInstance(numero);
  const authPath = getAuthPath(numero);

  try {
    instance.status = "connecting";
    instance.qr = null;

    // Garantir que pasta de sessão existe
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    const { version } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp ${normalized}] Usando versao: ${version.join(".")}`);

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
      version,
      auth: state,
      logger: require("pino")({ level: "silent" }),
      browser: ["SystemAGT", "Chrome", "1.0.0"],
    });

    instance.sock = sock;

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsApp ${normalized}] QR Code gerado`);
        instance.qr = await QRCode.toDataURL(qr);
        instance.status = "waiting_qr";
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        instance.qr = null;

        if (reason === DisconnectReason.loggedOut) {
          console.log(`[WhatsApp ${normalized}] Sessao encerrada pelo usuario`);
          instance.status = "disconnected";
          instance.sock = null;
          instance.reconnectAttempts = 0;

          // Limpar sessão antiga
          if (fs.existsSync(authPath)) {
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
            console.log(`[WhatsApp ${normalized}] Reconectando... (tentativa ${instance.reconnectAttempts})`);
            instance.status = "reconnecting";
            setTimeout(() => connectToWhatsApp(numero), 3000);
          } else {
            console.log(`[WhatsApp ${normalized}] Max tentativas atingido. Limpando sessao...`);
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
          console.log(`[WhatsApp ${normalized}] Conexao substituida`);
          instance.status = "disconnected";
          instance.sock = null;
        } else {
          console.log(`[WhatsApp ${normalized}] Desconectado (codigo: ${reason})`);
          instance.status = "disconnected";
        }
      }

      if (connection === "open") {
        console.log(`[WhatsApp ${normalized}] Conectado com sucesso!`);
        instance.status = "connected";
        instance.qr = null;
        instance.reconnectAttempts = 0;
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error(`[WhatsApp ${normalized}] Erro ao conectar:`, error.message);
    instance.status = "disconnected";
  }
}

/**
 * Envia mensagem usando a instância correta
 */
async function sendMessage(origem, destino, mensagem) {
  const normalized = normalizeNumber(origem);
  const instance = instances.get(normalized);

  if (!instance || !instance.sock || instance.status !== "connected") {
    throw new Error(`WhatsApp ${normalized} nao conectado`);
  }

  // Normaliza destino
  const destinoNormalizado = normalizeNumber(destino);
  const jid = `${destinoNormalizado}@s.whatsapp.net`;

  await instance.sock.sendMessage(jid, { text: mensagem });
  console.log(`[WhatsApp ${normalized}] Mensagem enviada para ${destinoNormalizado}`);
  return true;
}

/**
 * Carrega todas as sessões salvas ao iniciar
 */
async function loadSavedSessions() {
  console.log("[Sistema] Carregando sessoes salvas...");

  if (!fs.existsSync(AUTH_BASE_PATH)) {
    console.log("[Sistema] Nenhuma sessao encontrada");
    return;
  }

  const folders = fs.readdirSync(AUTH_BASE_PATH);

  for (const folder of folders) {
    if (folder.startsWith("auth_")) {
      const numero = folder.replace("auth_", "");
      const authPath = path.join(AUTH_BASE_PATH, folder);

      // Verifica se tem arquivos de credenciais
      const hasCredentials = fs.existsSync(path.join(authPath, "creds.json"));

      if (hasCredentials) {
        console.log(`[Sistema] Reconectando sessao: ${numero}`);
        try {
          await connectToWhatsApp(numero);
          // Aguarda um pouco entre conexões para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`[Sistema] Erro ao reconectar ${numero}:`, error.message);
        }
      }
    }
  }

  console.log("[Sistema] Sessoes carregadas");
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

  if (instance.status === "connected") {
    return res.json({ success: true, message: "Já conectado" });
  }

  if (instance.status === "connecting" || instance.status === "waiting_qr") {
    return res.json({
      success: true,
      message: "Conexão em andamento",
      qr: instance.qr
    });
  }

  try {
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

    console.log(`[WhatsApp ${normalized}] Sessao resetada`);
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

// Inicia servidor
app.listen(PORT, async () => {
  console.log(`[WhatsApp Service] Servidor rodando na porta ${PORT}`);
  console.log("[WhatsApp Service] Carregando sessoes existentes...");

  // Carrega sessões salvas após iniciar o servidor
  await loadSavedSessions();

  console.log("[WhatsApp Service] Pronto para receber conexoes!");
});
