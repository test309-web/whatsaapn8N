// node.js - ملف الاتصال الرئيسي
// WhatsApp - Israa Mode

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

// استدعاء منطق البوت
const { handleMessage } = require("./bot");

// ============================================
// الإعدادات
// ============================================

const AUTH_FOLDER = "auth_info";
const IMAGES_FOLDER = "received_images";

// إنشاء مجلد الصور إذا ما كانش موجود
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER, {
    recursive: true,
  });
}

// ============================================
// متغير الاتصال
// ============================================

let sock = null;
let isStarting = false;

// ============================================
// إنشاء اسم آمن للملف
// ============================================

function createSafeFileName(jid) {
  const timestamp = Date.now();

  const cleanJid = String(jid)
    .replace(/[^a-zA-Z0-9]/g, "_");

  return `${cleanJid}_${timestamp}.jpg`;
}

// ============================================
// التحقق واش الرسالة صورة
// ============================================

function getImageMessage(message) {
  if (!message) {
    return null;
  }

  // صورة عادية
  if (message.imageMessage) {
    return message.imageMessage;
  }

  // صورة داخل ephemeral message
  if (message.ephemeralMessage?.message?.imageMessage) {
    return message.ephemeralMessage.message.imageMessage;
  }

  // صورة داخل view once
  if (message.viewOnceMessage?.message?.imageMessage) {
    return message.viewOnceMessage.message.imageMessage;
  }

  // صورة داخل view once V2
  if (message.viewOnceMessageV2?.message?.imageMessage) {
    return message.viewOnceMessageV2.message.imageMessage;
  }

  return null;
}

// ============================================
// استخراج النص
// ============================================

function extractText(message) {
  if (!message) {
    return "";
  }

  if (message.conversation) {
    return message.conversation;
  }

  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  if (message.ephemeralMessage?.message?.conversation) {
    return message.ephemeralMessage.message.conversation;
  }

  if (
    message.ephemeralMessage?.message?.extendedTextMessage?.text
  ) {
    return message.ephemeralMessage.message.extendedTextMessage.text;
  }

  if (message.viewOnceMessage?.message?.conversation) {
    return message.viewOnceMessage.message.conversation;
  }

  if (
    message.viewOnceMessage?.message?.extendedTextMessage?.text
  ) {
    return message.viewOnceMessage.message.extendedTextMessage.text;
  }

  return "";
}

// ============================================
// تحميل وحفظ الصورة
// ============================================

async function saveWhatsAppImage(msg, jid) {
  try {
    console.log("📸 Downloading WhatsApp image...");

    const buffer = await downloadMediaMessage(
      msg,
      "buffer",
      {},
      {
        logger: pino({ level: "silent" }),
        reuploadRequest: sock?.updateMediaMessage,
      }
    );

    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Image buffer is empty");
    }

    const fileName = createSafeFileName(jid);

    const filePath = path.join(
      IMAGES_FOLDER,
      fileName
    );

    fs.writeFileSync(filePath, buffer);

    console.log("✅ Image saved:", filePath);

    return filePath;
  } catch (error) {
    console.error(
      "❌ Failed to download image:",
      error.message
    );

    return null;
  }
}

// ============================================
// إرسال رسالة
// ============================================

async function sendText(jid, text) {
  if (!sock) {
    return;
  }

  if (!text) {
    return;
  }

  await sock.sendMessage(jid, {
    text,
  });
}

// ============================================
// معالجة الطلب
// ============================================

async function processIncomingMessage(msg) {
  if (!msg) {
    return;
  }

  if (!msg.message) {
    return;
  }

  // تجاهل رسائلنا
  if (msg.key?.fromMe) {
    return;
  }

  const jid = msg.key?.remoteJid;

  if (!jid) {
    return;
  }

  // ==========================================
  // تجاهل Status
  // ==========================================

  if (jid === "status@broadcast") {
    return;
  }

  // ==========================================
  // تجاهل المجموعات
  // ==========================================

  if (jid.endsWith("@g.us")) {
    console.log("👥 Group message ignored:", jid);

    return;
  }

  // ==========================================
  // الحصول على message
  // ==========================================

  const message = msg.message;

  const text = extractText(message);

  const imageMessage = getImageMessage(message);

  // ==========================================
  // Log
  // ==========================================

  console.log("");
  console.log("==========================================");
  console.log("📩 New WhatsApp Message");
  console.log("👤:", jid);

  if (text) {
    console.log("💬:", text);
  }

  if (imageMessage) {
    console.log("📸 Image received");
  }

  console.log("==========================================");
  console.log("");

  // ==========================================
  // إذا كانت صورة
  // ==========================================

  let imagePath = null;

  if (imageMessage) {
    imagePath = await saveWhatsAppImage(
      msg,
      jid
    );

    if (!imagePath) {
      await sendText(
        jid,
        `❌ وقع مشكل في تحميل الصورة.

المرجو إرسال الصورة مرة أخرى.`
      );

      return;
    }
  }

  // ==========================================
  // إرسال الرسالة إلى bot.js
  // ==========================================

  try {
    const result = await handleMessage(
      jid,
      text,
      imagePath
    );

    // ========================================
    // إذا ما كان حتى رد
    // ========================================

    if (!result) {
      return;
    }

    // ========================================
    // الرد النصي
    // ========================================

    if (typeof result === "string") {
      await sendText(jid, result);

      return;
    }

    if (result.text) {
      await sendText(jid, result.text);
    }

    // ========================================
    // Log الطلب المؤكد
    // ========================================

    if (result.order) {
      console.log("");
      console.log("🛒 ORDER CONFIRMED");
      console.log(
        JSON.stringify(
          result.order,
          null,
          2
        )
      );
      console.log("");
    }

  } catch (error) {
    console.error(
      "❌ Error processing message:",
      error
    );

    try {
      await sendText(
        jid,
        `❌ عذراً، حدث خطأ في معالجة رسالتك.

الرجاء المحاولة مرة أخرى.

إذا استمر المشكل، اكتب *ابدأ* لإعادة تشغيل الطلب.`
      );
    } catch (sendError) {
      console.error(
        "❌ Failed to send error message:",
        sendError.message
      );
    }
  }
}

// ============================================
// تشغيل WhatsApp
// ============================================

async function startBot() {
  // منع تشغيل أكثر من اتصال في نفس الوقت
  if (isStarting) {
    return;
  }

  isStarting = true;

  try {
    console.log("");
    console.log("==========================================");
    console.log("🤖 WhatsApp Bot - Israa Mode");
    console.log("==========================================");
    console.log("");

    // ========================================
    // Auth
    // ========================================

    const {
      state,
      saveCreds,
    } = await useMultiFileAuthState(
      AUTH_FOLDER
    );

    // ========================================
    // إنشاء الاتصال
    // ========================================

    sock = makeWASocket({
      auth: state,

      logger: pino({
        level: "silent",
      }),

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      generateHighQualityLinkPreview: false,
    });

    // ========================================
    // حفظ Credentials
    // ========================================

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ========================================
    // Connection Update
    // ========================================

    sock.ev.on(
      "connection.update",
      async ({
        connection,
        qr,
        lastDisconnect,
      }) => {

        // ====================================
        // QR Code
        // ====================================

        if (qr) {
          console.log("");
          console.log(
            "📱 Scan this QR Code with WhatsApp:"
          );
          console.log("");

          qrcode.generate(
            qr,
            {
              small: true,
            }
          );

          console.log("");
        }

        // ====================================
        // Connected
        // ====================================

        if (connection === "open") {
          isStarting = false;

          console.log("");
          console.log(
            "=========================================="
          );
          console.log(
            "✅ WhatsApp Connected Successfully"
          );
          console.log(
            "=========================================="
          );
          console.log("");
        }

        // ====================================
        // Closed
        // ====================================

        if (connection === "close") {
          isStarting = false;

          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;

          console.log("");
          console.log(
            "❌ WhatsApp Connection Closed"
          );

          console.log(
            "Status Code:",
            statusCode
          );

          // ==================================
          // Logout
          // ==================================

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {
            console.log("");
            console.log(
              "🔴 WhatsApp session logged out."
            );

            console.log(
              "🗑️ Delete auth_info and scan QR again."
            );

            console.log("");

            return;
          }

          // ==================================
          // Reconnect
          // ==================================

          if (shouldReconnect) {
            console.log(
              "🔄 Reconnecting in 5 seconds..."
            );

            setTimeout(() => {
              startBot();
            }, 5000);
          }
        }
      }
    );

    // ========================================
    // استقبال الرسائل
    // ========================================

    sock.ev.on(
      "messages.upsert",
      async ({
        messages,
        type,
      }) => {

        if (type !== "notify") {
          return;
        }

        if (!messages || messages.length === 0) {
          return;
        }

        // معالجة جميع الرسائل وليس الأولى فقط
        for (const msg of messages) {
          try {
            await processIncomingMessage(
              msg
            );
          } catch (error) {
            console.error(
              "❌ Message processing error:",
              error.message
            );
          }
        }
      }
    );

  } catch (error) {
    isStarting = false;

    console.error("");
    console.error(
      "❌ Failed to start WhatsApp:"
    );
    console.error(error);
    console.error("");

    console.log(
      "🔄 Retrying in 5 seconds..."
    );

    setTimeout(() => {
      startBot();
    }, 5000);
  }
}

// ============================================
// تشغيل البرنامج
// ============================================

console.log("");
console.log(
  "🤖 WhatsApp Bot - Israa Mode"
);
console.log("");

startBot();

// ============================================
// التعامل مع إغلاق البرنامج
// ============================================

process.on(
  "SIGINT",
  async () => {
    console.log("");
    console.log(
      "🛑 Shutting down..."
    );

    try {
      if (sock) {
        sock.end(
          undefined
        );
      }
    } catch (error) {
      console.error(
        error.message
      );
    }

    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  async () => {
    console.log("");
    console.log(
      "🛑 Shutting down..."
    );

    try {
      if (sock) {
        sock.end(
          undefined
        );
      }
    } catch (error) {
      console.error(
        error.message
      );
    }

    process.exit(0);
  }
);