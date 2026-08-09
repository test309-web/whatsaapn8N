// bot.js - إرسال كل شيء تلقائياً بدون انتظار
const fs = require('fs');
const path = require('path');

// ============================================
// 1. مسار مجلد الفيديوهات
// ============================================
const VIDEOS_FOLDER = path.join(__dirname, 'videos');

// قائمة الفيديوهات المتوفرة
const availableVideos = [
  { id: 1, name: "موديل 1", file: "video1.mp4" },
  { id: 2, name: "موديل 2", file: "video2.mp4" },
  { id: 3, name: "موديل 3", file: "video3.mp4" },
  { id: 4, name: "موديل 4", file: "video4.mp4" },
  { id: 5, name: "موديل 5", file: "video5.mp4" },
];

// ============================================
// 2. منع التكرار (كل رقم يرسل له مرة واحدة)
// ============================================
const sentUsers = new Map();

// ============================================
// 3. دالة إرسال فيديو
// ============================================
async function sendVideo(sock, jid, videoFile, index, total) {
  try {
    const videoPath = path.join(VIDEOS_FOLDER, videoFile);
    
    if (!fs.existsSync(videoPath)) {
      console.log(`⚠️ الفيديو غير موجود: ${videoPath}`);
      return false;
    }

    const videoBuffer = fs.readFileSync(videoPath);

    await sock.sendMessage(jid, {
      video: videoBuffer,
      caption: `🎬 موديل ${index}/${total}`,
      mimetype: 'video/mp4',
    });

    console.log(`✅ تم إرسال موديل ${index}/${total}`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في إرسال موديل ${index}:`, error.message);
    return false;
  }
}

// ============================================
// 4. دالة إرسال كل شيء دفعة واحدة (بدون انتظار)
// ============================================
async function sendAllAutomatically(sock, jid) {
  // منع التكرار لنفس المستخدم
  if (sentUsers.has(jid)) {
    console.log(`⏭️ تم الإرسال بالفعل لـ ${jid}`);
    return;
  }

  // تسجيل المستخدم
  sentUsers.set(jid, true);

  console.log(`📤 بدء الإرسال التلقائي لـ ${jid}...`);

  try {
    // ==========================================
    // 1. رسالة الترحيب الأولى
    // ==========================================
    await sock.sendMessage(jid, {
      text: `مرحبا ❤️
التمن 29 درهم
التوصيل داخل الدار البيضاء 20 درهم
المدن الاخرى 35 درهم
منتجات أخرى:
https://www.facebook.com/share/1EsLCKcMk8/`
    });
    console.log(`✅ 1. تم إرسال رسالة الترحيب`);

    // تأخير نصف ثانية
    await delay(500);

    // ==========================================
    // 2. رسالة طلب المعلومات
    // ==========================================
    await sock.sendMessage(jid, {
      text: `خلي لينا داكشي لي بغيتي والعنوان والنمرة لي فيها أبيل ونجمعو ليك كوموند ديالك`
    });
    console.log(`✅ 2. تم إرسال رسالة طلب المعلومات`);

    // تأخير نصف ثانية
    await delay(500);

    // ==========================================
    // 3. إرسال كل الفيديوهات
    // ==========================================
    const totalVideos = availableVideos.length;
    let sentCount = 0;

    for (let i = 0; i < availableVideos.length; i++) {
      const video = availableVideos[i];
      const success = await sendVideo(sock, jid, video.file, i + 1, totalVideos);
      if (success) {
        sentCount++;
      }
      // تأخير صغير بين الفيديوهات (نصف ثانية)
      if (i < availableVideos.length - 1) {
        await delay(500);
      }
    }
    console.log(`✅ 3. تم إرسال ${sentCount}/${totalVideos} فيديو`);

    // تأخير نصف ثانية
    await delay(500);

    // ==========================================
    // 4. الرسالة النهائية
    // ==========================================
    await sock.sendMessage(jid, {
      text: `✅ تم إرسال ${sentCount}/${totalVideos} موديل بنجاح!

━━━━━━━━━━━━━━━━━━
👗 *هاد هوما لمدلات لكينين مرحبا*
━━━━━━━━━━━━━━━━━━`
    });
    console.log(`✅ 4. تم إرسال الرسالة النهائية`);

    console.log(`✅✅ تم الإرسال التلقائي الكامل لـ ${jid}`);

  } catch (error) {
    console.error(`❌ خطأ في الإرسال التلقائي لـ ${jid}:`, error.message);
  }
}

// ============================================
// 5. دالة تأخير
// ============================================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 6. دالة معالجة الرسائل
// ============================================
async function handleMessage(sock, jid, text) {
  console.log(`📩 ${jid}: "${text}"`);

  // إرسال كل شيء تلقائياً بدون انتظار
  await sendAllAutomatically(sock, jid);
  
  // ما كاينش رد إضافي لأن البوت كيرسل كل شيء بنفسه
  return null;
}

// ============================================
// 7. دالة إعادة تعيين (للمطورين)
// ============================================
function resetSentUsers() {
  sentUsers.clear();
  console.log("🔄 تم إعادة تعيين قائمة المستخدمين");
}

// ============================================
// 8. تصدير الدوال
// ============================================
module.exports = {
  handleMessage,
  resetSentUsers,
  availableVideos,
  sentUsers,
};