const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");

let sock = null;

async function connectToWhatsApp() {
  // Busca a versão mais recente do WhatsApp Web suportada
  const { version } = await fetchLatestBaileysVersion();
  console.log(`📌 Usando WA versão: ${version.join(".")}`);

  const { state, saveCreds } = await useMultiFileAuthState("auth_session");

  sock = makeWASocket({
    version,
    auth: state,
    logger: require("pino")({ level: "silent" }), // silencia logs internos
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Deslogado pelo WhatsApp. Delete a pasta auth_session e reinicie.");
        process.exit(0);
      } else if (
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.timedOut ||
        reason === DisconnectReason.restartRequired
      ) {
        console.log(`🔄 Reconectando... (motivo: ${reason})`);
        connectToWhatsApp();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("⚠️ Outra sessão aberta. Encerrando esta.");
        process.exit(0);
      } else {
        console.log(`⚠️ Desconectado (código: ${reason}). Reconectando...`);
        connectToWhatsApp();
      }
    }

    if (connection === "open") {
      console.log("✅ Conectado ao WhatsApp com sucesso!\n");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

/**
 * Envia mensagem para um número do WhatsApp
 * @param {string} destino - Número com DDI+DDD, ex: "5511999999999"
 * @param {string} mensagem - Texto da mensagem
 */
async function enviarMensagem(destino, mensagem) {
  if (!sock) {
    throw new Error("Bot não conectado.");
  }

  const jid = destino.includes("@s.whatsapp.net")
    ? destino
    : `${destino}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: mensagem });
  console.log(`📤 Mensagem enviada para ${destino}`);
}

// Inicia a conexão
connectToWhatsApp();

// Exemplo de envio após conectar (remova ou ajuste conforme necessário)
setTimeout(async () => {
  await enviarMensagem("258855075735", "Olá! Bot funcionando 🤖");
}, 8000);

module.exports = { enviarMensagem };