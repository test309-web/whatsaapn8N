const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");

const { handleMessage, resetSentUsers } = require("./bot");

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
      console.log("📤 البوت جاهز للإرسال التلقائي...");
      console.log("📌 أي رسالة تصل = إرسال كل شيء دفعة واحدة");
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

    try {
      // استدعاء البوت (يرسل كل شيء تلقائياً)
      await handleMessage(sock, jid, text);
      // ما كاينش رد إضافي
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  });

  // إعادة تعيين المستخدمين كل ساعة (اختياري)
  setInterval(() => {
    resetSentUsers();
    console.log("🔄 تم إعادة تعيين قائمة المستخدمين (كل ساعة)");
  }, 3600000);
}

console.log("🤖 WhatsApp Bot - Israa Mode");
console.log("📤 الإرسال التلقائي بدون انتظار:");
console.log("   1. رسالة ترحيب");
console.log("   2. رسالة طلب معلومات");
console.log("   3. كل الفيديوهات");
console.log("   4. رسالة نهائية");
startBot();