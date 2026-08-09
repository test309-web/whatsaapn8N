// bot.js - منطق البوت الكامل
// متجر Israa Mode - بيع الملابس النسائية

// ============================================
// 1. إدارة الجلسات (Sessions)
// ============================================
const sessions = new Map();

// ============================================
// 2. تعريف الخطوات (Steps)
// ============================================
const STEPS = {
  WELCOME: "welcome",
  PRODUCT_TYPE: "product_type",
  PRODUCT_IMAGE: "product_image",
  SIZE: "size",
  COLOR: "color",
  QUANTITY: "quantity",
  CUSTOMER_NAME: "customer_name",
  CITY: "city",
  ADDRESS: "address",
  PHONE: "phone",
  CONFIRM_ORDER: "confirm_order",
  EDIT_ORDER: "edit_order",
  DONE: "done",
};

// ============================================
// 3. رسائل النظام
// ============================================
const WELCOME_TEXT = `🌸 مرحباً بك في *Israa Mode*

نحن متجر متخصص في بيع الملابس النسائية.

سنساعدك في إنشاء طلبك خطوة بخطوة.

اختر نوع اللباس:

1- فستان
2- قفطان
3- جلباب
4- عباية
5- طقم نسائي

أو اكتب *إلغاء* لإلغاء الطلب.`;

const MESSAGES = {
  welcome: WELCOME_TEXT,

  product_image: `📸 أرسل صورة المنتج الذي تريده.

يمكنك إرسال الصورة من معرض هاتفك.

أو اكتب *تخطي* للمتابعة بدون صورة.`,

  size: `📏 اختر المقاس المناسب:

1- XS
2- S
3- M
4- L
5- XL
6- XXL

أو اكتب الرقم المناسب.`,

  color: `🎨 اختر اللون المناسب:

يمكنك كتابة اسم اللون أو إرسال رقمه:

1- أسود
2- أبيض
3- أحمر
4- أزرق
5- أخضر
6- وردي
7- بيج
8- كحلي
9- بنفسجي
10- لون آخر (اكتبه) `,

  quantity: `🔢 كم عدد القطع التي تريدها؟

أدخل رقماً (مثال: 1, 2, 3...)`,

  customer_name: `👤 ما هو اسمك الكامل؟`,

  city: `🏙️ ما هي مدينتك؟`,

  address: `📍 ما هو عنوانك التفصيلي؟`,

  phone: `📱 ما هو رقم هاتفك؟`,

  confirm_order: (order) => `📋 *ملخص الطلب*

━━━━━━━━━━━━━━━━━━
🛍️ *نوع المنتج:* ${order.product_type}
📸 *الصورة:* ${order.image || "بدون صورة"}
📏 *المقاس:* ${order.size}
🎨 *اللون:* ${order.color}
🔢 *الكمية:* ${order.quantity}
👤 *الاسم:* ${order.customer_name}
🏙️ *المدينة:* ${order.city}
📍 *العنوان:* ${order.address}
📱 *الهاتف:* ${order.phone}
━━━━━━━━━━━━━━━━━━

هل تريد تأكيد الطلب؟

1- نعم ✅
2- لا ❌ (لتعديل المعلومات)`,

  order_confirmed: `✅ *تم تأكيد طلبك بنجاح!*

شكراً لك على ثقتك في *Israa Mode* 🌸

سيتم التواصل معك قريباً لتأكيد الطلب وتفاصيل الدفع والتوصيل.

*للطلب الجديد اكتب:* ابدأ`,

  order_cancelled: `❌ *تم إلغاء الطلب*

إذا كنت ترغب في الطلب مرة أخرى، اكتب *ابدأ*.

نحن في انتظارك في *Israa Mode* 🌸`,

  invalid_input: `❌ إدخال غير صحيح.

الرجاء إدخال قيمة صحيحة.`,

  cancel: `❌ *تم إلغاء الطلب*

إذا كنت ترغب في الطلب مرة أخرى، اكتب *ابدأ*.

نحن في انتظارك في *Israa Mode* 🌸`,

  restart: `🔄 *تم إعادة التشغيل*

${WELCOME_TEXT}`,

  unknown: `❌ عذراً، لم أفهم رسالتك.

${WELCOME_TEXT}`,
};

// ============================================
// 4. دوال المساعدة
// ============================================

// إنشاء جلسة جديدة
function createSession(jid) {
  return {
    step: STEPS.WELCOME,
    product_type: null,
    image: null,
    size: null,
    color: null,
    quantity: null,
    customer_name: null,
    city: null,
    address: null,
    phone: null,
    editing: null,
    _jid: jid,
  };
}

// الحصول على جلسة المستخدم
function getSession(jid) {
  if (!sessions.has(jid)) {
    sessions.set(jid, createSession(jid));
  }
  return sessions.get(jid);
}

// حذف جلسة المستخدم
function deleteSession(jid) {
  sessions.delete(jid);
}

// الحصول على اسم المنتج من الرقم
function getProductName(number) {
  const products = {
    1: "فستان",
    2: "قفطان",
    3: "جلباب",
    4: "عباية",
    5: "طقم نسائي",
  };
  return products[number] || null;
}

// الحصول على المقاس من الرقم
function getSize(number) {
  const sizes = {
    1: "XS",
    2: "S",
    3: "M",
    4: "L",
    5: "XL",
    6: "XXL",
  };
  return sizes[number] || null;
}

// الحصول على اللون من الرقم
function getColor(number) {
  const colors = {
    1: "أسود",
    2: "أبيض",
    3: "أحمر",
    4: "أزرق",
    5: "أخضر",
    6: "وردي",
    7: "بيج",
    8: "كحلي",
    9: "بنفسجي",
  };
  return colors[number] || null;
}

// التحقق من صحة الرقم
function isValidNumber(value) {
  return !isNaN(value) && Number(value) > 0;
}

// ============================================
// 5. منطق معالجة الرسائل
// ============================================

async function handleMessage(jid, text) {
  const session = getSession(jid);
  const trimmedText = text.trim();

  // ========== أوامر عامة ==========
  if (trimmedText.toLowerCase() === "إلغاء" || trimmedText.toLowerCase() === "الغاء") {
    deleteSession(jid);
    return MESSAGES.cancel;
  }

  if (trimmedText.toLowerCase() === "ابدأ" || 
      trimmedText.toLowerCase() === "start" ||
      trimmedText.toLowerCase() === "سلام" ||
      trimmedText.toLowerCase() === "مرحبا" ||
      trimmedText.toLowerCase() === "hi" ||
      trimmedText.toLowerCase() === "hello") {
    sessions.set(jid, createSession(jid));
    return MESSAGES.welcome;
  }

  // ========== معالجة حسب الخطوة ==========
  switch (session.step) {
    case STEPS.WELCOME:
    case STEPS.PRODUCT_TYPE:
      return handleProductType(session, trimmedText);

    case STEPS.PRODUCT_IMAGE:
      return handleProductImage(session, trimmedText);

    case STEPS.SIZE:
      return handleSize(session, trimmedText);

    case STEPS.COLOR:
      return handleColor(session, trimmedText);

    case STEPS.QUANTITY:
      return handleQuantity(session, trimmedText);

    case STEPS.CUSTOMER_NAME:
      return handleCustomerName(session, trimmedText);

    case STEPS.CITY:
      return handleCity(session, trimmedText);

    case STEPS.ADDRESS:
      return handleAddress(session, trimmedText);

    case STEPS.PHONE:
      return handlePhone(session, trimmedText);

    case STEPS.CONFIRM_ORDER:
      return handleConfirmOrder(session, trimmedText);

    case STEPS.EDIT_ORDER:
      return handleEditOrder(session, trimmedText);

    default:
      return MESSAGES.unknown;
  }
}

// ============================================
// 6. دوال معالجة كل خطوة
// ============================================

function handleProductType(session, text) {
  const productNumber = parseInt(text);

  if (isValidNumber(productNumber) && productNumber >= 1 && productNumber <= 5) {
    const productName = getProductName(productNumber);
    session.product_type = productName;
    session.step = STEPS.PRODUCT_IMAGE;
    return MESSAGES.product_image;
  }

  return `❌ الرجاء اختيار رقم صحيح (1-5):

1- فستان
2- قفطان
3- جلباب
4- عباية
5- طقم نسائي

أو اكتب *إلغاء* للإلغاء.`;
}

function handleProductImage(session, text) {
  if (text.toLowerCase() === "تخطي") {
    session.image = "بدون صورة";
    session.step = STEPS.SIZE;
    return MESSAGES.size;
  }

  if (text.startsWith("http") || text.includes(".jpg") || text.includes(".png")) {
    session.image = text;
    session.step = STEPS.SIZE;
    return MESSAGES.size;
  }

  session.image = "بدون صورة";
  session.step = STEPS.SIZE;
  return MESSAGES.size;
}

function handleSize(session, text) {
  const sizeNumber = parseInt(text);

  if (isValidNumber(sizeNumber) && sizeNumber >= 1 && sizeNumber <= 6) {
    const size = getSize(sizeNumber);
    session.size = size;
    session.step = STEPS.COLOR;
    return MESSAGES.color;
  }

  return `❌ الرجاء اختيار رقم صحيح (1-6):

1- XS
2- S
3- M
4- L
5- XL
6- XXL

أو اكتب *إلغاء* للإلغاء.`;
}

function handleColor(session, text) {
  const colorNumber = parseInt(text);

  if (isValidNumber(colorNumber) && colorNumber >= 1 && colorNumber <= 9) {
    const color = getColor(colorNumber);
    session.color = color;
    session.step = STEPS.QUANTITY;
    return MESSAGES.quantity;
  }

  const colorNames = ["أسود", "أبيض", "أحمر", "أزرق", "أخضر", "وردي", "بيج", "كحلي", "بنفسجي"];
  if (colorNames.includes(text)) {
    session.color = text;
    session.step = STEPS.QUANTITY;
    return MESSAGES.quantity;
  }

  return `❌ الرجاء اختيار لون صحيح:

1- أسود
2- أبيض
3- أحمر
4- أزرق
5- أخضر
6- وردي
7- بيج
8- كحلي
9- بنفسجي

أو اكتب اسم اللون.

أو اكتب *إلغاء* للإلغاء.`;
}

function handleQuantity(session, text) {
  const quantity = parseInt(text);

  if (isValidNumber(quantity) && quantity > 0 && quantity <= 100) {
    session.quantity = quantity;
    session.step = STEPS.CUSTOMER_NAME;
    return MESSAGES.customer_name;
  }

  return `❌ الرجاء إدخال عدد صحيح (1-100):

مثال: 1, 2, 3...

أو اكتب *إلغاء* للإلغاء.`;
}

function handleCustomerName(session, text) {
  if (text.length >= 3) {
    session.customer_name = text;
    session.step = STEPS.CITY;
    return MESSAGES.city;
  }

  return `❌ الرجاء إدخال اسمك الكامل (3 أحرف على الأقل).

أو اكتب *إلغاء* للإلغاء.`;
}

function handleCity(session, text) {
  if (text.length >= 2) {
    session.city = text;
    session.step = STEPS.ADDRESS;
    return MESSAGES.address;
  }

  return `❌ الرجاء إدخال اسم مدينتك.

أو اكتب *إلغاء* للإلغاء.`;
}

function handleAddress(session, text) {
  if (text.length >= 5) {
    session.address = text;
    session.step = STEPS.PHONE;
    return MESSAGES.phone;
  }

  return `❌ الرجاء إدخال عنوانك التفصيلي (5 أحرف على الأقل).

أو اكتب *إلغاء* للإلغاء.`;
}

function handlePhone(session, text) {
  const cleanPhone = text.replace(/\s/g, "");
  
  if (cleanPhone.length >= 8 && !isNaN(cleanPhone)) {
    session.phone = cleanPhone;
    session.step = STEPS.CONFIRM_ORDER;
    return MESSAGES.confirm_order(session);
  }

  return `❌ الرجاء إدخال رقم هاتف صحيح (8 أرقام على الأقل).

مثال: 0612345678

أو اكتب *إلغاء* للإلغاء.`;
}

function handleConfirmOrder(session, text) {
  const choice = parseInt(text);

  if (choice === 1) {
    session.step = STEPS.DONE;
    const orderDetails = {
      product_type: session.product_type,
      image: session.image,
      size: session.size,
      color: session.color,
      quantity: session.quantity,
      customer_name: session.customer_name,
      city: session.city,
      address: session.address,
      phone: session.phone,
    };
    console.log("📦 طلب جديد:", orderDetails);
    deleteSession(session._jid);
    return MESSAGES.order_confirmed;
  }

  if (choice === 2) {
    session.step = STEPS.EDIT_ORDER;
    return `✏️ *تعديل الطلب*

اختر رقم الحقل الذي تريد تعديله:

1- نوع المنتج (${session.product_type})
2- الصورة (${session.image || "بدون"})
3- المقاس (${session.size})
4- اللون (${session.color})
5- الكمية (${session.quantity})
6- الاسم (${session.customer_name})
7- المدينة (${session.city})
8- العنوان (${session.address})
9- رقم الهاتف (${session.phone})

أو اكتب *إلغاء* للإلغاء.`;
  }

  return `❌ الرجاء اختيار:

1- نعم ✅ (لتأكيد الطلب)
2- لا ❌ (لتعديل المعلومات)

أو اكتب *إلغاء* للإلغاء.`;
}

function handleEditOrder(session, text) {
  const choice = parseInt(text);

  if (isValidNumber(choice) && choice >= 1 && choice <= 9) {
    const fields = {
      1: "product_type",
      2: "image",
      3: "size",
      4: "color",
      5: "quantity",
      6: "customer_name",
      7: "city",
      8: "address",
      9: "phone",
    };

    const field = fields[choice];
    session.editing = field;
    session.step = STEPS.WELCOME;

    const prompts = {
      product_type: MESSAGES.product_type,
      image: MESSAGES.product_image,
      size: MESSAGES.size,
      color: MESSAGES.color,
      quantity: MESSAGES.quantity,
      customer_name: MESSAGES.customer_name,
      city: MESSAGES.city,
      address: MESSAGES.address,
      phone: MESSAGES.phone,
    };

    return `✏️ *تعديل: ${field.replace("_", " ")}*

${prompts[field]}`;
  }

  return `❌ الرجاء اختيار رقم صحيح (1-9).

أو اكتب *إلغاء* للإلغاء.`;
}

// ============================================
// 7. تصدير الدوال
// ============================================
module.exports = {
  handleMessage,
  sessions,
};