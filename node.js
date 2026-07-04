const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");
const axios = require("axios");

// الرابط الصحيح ديال Webhook
const WEBHOOK_URL = "https://abdouyu-n8n-free.hf.space/webhook/4b9b3451-8983-476c-a3e2-fac32081e9e1";

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
      // ✅ LOG قبل الإرسال
      console.log("🚀 Sending POST to:", WEBHOOK_URL);
      console.log("📦 Payload:", {
        numero: jid,
        message: text,
        timestamp: new Date().toISOString()
      });

      // إرسال إلى Webhook
      const response = await axios.post(
        WEBHOOK_URL,
        {
          numero: jid,
          message: text,
          timestamp: new Date().toISOString()
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Webhook response status:", response.status);
      console.log("✅ Webhook response data:", response.data);

      // معالجة الرد
      let replyText = "✅ تم استلام رسالتك.";

      if (response.data) {
        if (typeof response.data === 'string') {
          replyText = response.data;
        } else if (response.data.reply) {
          replyText = response.data.reply;
        } else if (response.data.message) {
          replyText = response.data.message;
        } else if (response.data.text) {
          replyText = response.data.text;
        } else if (response.data.output) {
          replyText = response.data.output;
        } else {
          const dataStr = JSON.stringify(response.data);
          if (dataStr.length < 200) {
            replyText = dataStr;
          }
        }
      }

      await sock.sendMessage(jid, {
        text: replyText
      });

    } catch (error) {
      console.error("❌ Error:", error.message);
      
      if (error.response) {
        console.error("❌ Status:", error.response.status);
        console.error("❌ Data:", error.response.data);
      } else if (error.request) {
        console.error("❌ No response received from server");
      } else {
        console.error("❌ Request error:", error.message);
      }

      await sock.sendMessage(jid, {
        text: "❌ عذراً، حدث خطأ في معالجة رسالتك. الرجاء المحاولة مرة أخرى."
      });
    }
  });
}

console.log("🤖 WhatsApp Bot");
console.log(`📡 Webhook: ${WEBHOOK_URL}`);
startBot();