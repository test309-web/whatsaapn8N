// node.js - ملف الاتصال الرئيسي
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");

// استدعاء منطق البوت من ملف منفصل
const { handleMessage } = require("./bot");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      console.log("📱 Scan this QR Code:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Connection closed");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log("📩", jid, ":", text);

    try {
      // استدعاء منطق البوت من bot.js
      const reply = await handleMessage(jid, text);

      // إرسال الرد إلى WhatsApp
      if (reply) {
        await sock.sendMessage(jid, {
          text: reply,
        });
      }
    } catch (error) {
      console.error("❌ Error processing message:", error.message);
      await sock.sendMessage(jid, {
        text: "❌ عذراً، حدث خطأ في معالجة رسالتك. الرجاء المحاولة مرة أخرى.",
      });
    }
  });
}

console.log("🤖 WhatsApp Bot - Israa Mode");
startBot();