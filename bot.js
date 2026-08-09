// bot.js - منطق الطلب الكامل
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
  EDIT_VALUE: "edit_value",
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

  product_type: WELCOME_TEXT,

  product_image: `📸 أرسل صورة المنتج الذي تريده.

يمكنك إرسال الصورة مباشرة من معرض هاتفك.

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
10- لون آخر (اكتبه)`,

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

    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// الحصول على جلسة المستخدم
function getSession(jid) {
  if (!sessions.has(jid)) {
    sessions.set(jid, createSession(jid));
  }

  const session = sessions.get(jid);

  session.updatedAt = Date.now();

  return session;
}

// حذف جلسة المستخدم
function deleteSession(jid) {
  sessions.delete(jid);
}

// ============================================
// الحصول على اسم المنتج من الرقم
// ============================================

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

// ============================================
// الحصول على المقاس من الرقم
// ============================================

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

// ============================================
// الحصول على اللون من الرقم
// ============================================

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

// ============================================
// التحقق من صحة الرقم
// ============================================

function isValidNumber(value) {
  return !isNaN(value) && Number(value) > 0;
}

// ============================================
// تنظيف النص
// ============================================

function normalizeText(text) {
  return String(text || "").trim();
}

// ============================================
// الحصول على الرقم من النص
// ============================================

function normalizeNumber(text) {
  const arabicNumbers = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  return String(text || "")
    .split("")
    .map((char) => arabicNumbers[char] || char)
    .join("");
}

// ============================================
// أوامر عامة
// ============================================

function isCancelCommand(text) {
  const value = normalizeText(text).toLowerCase();

  return (
    value === "إلغاء" ||
    value === "الغاء" ||
    value === "cancel"
  );
}

function isStartCommand(text) {
  const value = normalizeText(text).toLowerCase();

  return (
    value === "ابدأ" ||
    value === "ابدا" ||
    value === "start" ||
    value === "سلام" ||
    value === "مرحبا" ||
    value === "مرحبا!" ||
    value === "hi" ||
    value === "hello"
  );
}

// ============================================
// 5. منطق معالجة الرسائل
// ============================================

async function handleMessage(jid, text, imageData = null) {
  const session = getSession(jid);

  const trimmedText = normalizeText(text);

  // تحديث وقت الجلسة
  session.updatedAt = Date.now();

  // ==========================================
  // أوامر عامة
  // ==========================================

  if (isCancelCommand(trimmedText)) {
    deleteSession(jid);

    return {
      text: MESSAGES.cancel,
    };
  }

  if (isStartCommand(trimmedText)) {
    sessions.set(jid, createSession(jid));

    return {
      text: MESSAGES.welcome,
    };
  }

  // ==========================================
  // إذا المستخدم أرسل صورة
  // ==========================================

  if (imageData) {
    if (session.step === STEPS.PRODUCT_IMAGE) {
      return handleProductImage(session, "", imageData);
    }

    // إذا الصورة وصلت في مرحلة أخرى
    return {
      text: `📸 شكراً! لكن الصورة مطلوبة فقط في مرحلة اختيار المنتج.

المرجو متابعة الخطوات الحالية.

${getCurrentStepMessage(session)}`,
    };
  }

  // ==========================================
  // إذا ما كاين لا نص لا صورة
  // ==========================================

  if (!trimmedText) {
    return {
      text: MESSAGES.invalid_input,
    };
  }

  // ==========================================
  // معالجة حسب الخطوة
  // ==========================================

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

    case STEPS.EDIT_VALUE:
      return handleEditValue(session, trimmedText);

    case STEPS.DONE:
      return {
        text: `✅ هذا الطلب تم تأكيده بالفعل.

إذا كنت تريد إنشاء طلب جديد، اكتب *ابدأ*.`,
      };

    default:
      return {
        text: MESSAGES.unknown,
      };
  }
}

// ============================================
// الحصول على رسالة المرحلة الحالية
// ============================================

function getCurrentStepMessage(session) {
  switch (session.step) {
    case STEPS.WELCOME:
    case STEPS.PRODUCT_TYPE:
      return MESSAGES.product_type;

    case STEPS.PRODUCT_IMAGE:
      return MESSAGES.product_image;

    case STEPS.SIZE:
      return MESSAGES.size;

    case STEPS.COLOR:
      return MESSAGES.color;

    case STEPS.QUANTITY:
      return MESSAGES.quantity;

    case STEPS.CUSTOMER_NAME:
      return MESSAGES.customer_name;

    case STEPS.CITY:
      return MESSAGES.city;

    case STEPS.ADDRESS:
      return MESSAGES.address;

    case STEPS.PHONE:
      return MESSAGES.phone;

    default:
      return MESSAGES.welcome;
  }
}

// ============================================
// 6. دوال معالجة كل خطوة
// ============================================

// ============================================
// نوع المنتج
// ============================================

function handleProductType(session, text) {
  const normalized = normalizeNumber(text);
  const productNumber = parseInt(normalized);

  if (
    isValidNumber(productNumber) &&
    productNumber >= 1 &&
    productNumber <= 5
  ) {
    const productName = getProductName(productNumber);

    session.product_type = productName;
    session.step = STEPS.PRODUCT_IMAGE;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.product_image,
    };
  }

  return {
    text: `❌ الرجاء اختيار رقم صحيح (1-5):

1- فستان
2- قفطان
3- جلباب
4- عباية
5- طقم نسائي

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// صورة المنتج
// ============================================

function handleProductImage(session, text, imageData = null) {
  // ==========================================
  // صورة حقيقية من WhatsApp
  // ==========================================

  if (imageData) {
    session.image = imageData;

    session.step = STEPS.SIZE;
    session.updatedAt = Date.now();

    return {
      text: `✅ تم استلام صورة المنتج بنجاح.

${MESSAGES.size}`,
    };
  }

  // ==========================================
  // تخطي الصورة
  // ==========================================

  if (text.toLowerCase() === "تخطي" || text.toLowerCase() === "skip") {
    session.image = "بدون صورة";

    session.step = STEPS.SIZE;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.size,
    };
  }

  // ==========================================
  // إذا أرسل رابط صورة
  // ==========================================

  if (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.includes(".jpg") ||
    text.includes(".jpeg") ||
    text.includes(".png") ||
    text.includes(".webp")
  ) {
    session.image = text;

    session.step = STEPS.SIZE;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.size,
    };
  }

  return {
    text: `❌ لم يتم التعرف على الصورة.

📸 أرسل صورة المنتج مباشرة من WhatsApp.

أو اكتب *تخطي* للمتابعة بدون صورة.`,
  };
}

// ============================================
// المقاس
// ============================================

function handleSize(session, text) {
  const normalized = normalizeNumber(text);
  const sizeNumber = parseInt(normalized);

  if (
    isValidNumber(sizeNumber) &&
    sizeNumber >= 1 &&
    sizeNumber <= 6
  ) {
    const size = getSize(sizeNumber);

    session.size = size;
    session.step = STEPS.COLOR;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.color,
    };
  }

  return {
    text: `❌ الرجاء اختيار رقم صحيح (1-6):

1- XS
2- S
3- M
4- L
5- XL
6- XXL

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// اللون
// ============================================

function handleColor(session, text) {
  const normalized = normalizeNumber(text);
  const colorNumber = parseInt(normalized);

  if (
    isValidNumber(colorNumber) &&
    colorNumber >= 1 &&
    colorNumber <= 9
  ) {
    const color = getColor(colorNumber);

    session.color = color;
    session.step = STEPS.QUANTITY;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.quantity,
    };
  }

  const colorNames = [
    "أسود",
    "أبيض",
    "أحمر",
    "أزرق",
    "أخضر",
    "وردي",
    "بيج",
    "كحلي",
    "بنفسجي",
  ];

  const lowerText = text.toLowerCase();

  const foundColor = colorNames.find(
    (color) => color.toLowerCase() === lowerText
  );

  if (foundColor) {
    session.color = foundColor;
    session.step = STEPS.QUANTITY;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.quantity,
    };
  }

  // اللون رقم 10 = لون آخر
  if (colorNumber === 10) {
    session.step = STEPS.EDIT_VALUE;
    session.editing = "color";
    session.updatedAt = Date.now();

    return {
      text: `🎨 اكتب اسم اللون الذي تريده:`,
    };
  }

  // إذا كتب لون غير موجود في القائمة
  if (text.length >= 2) {
    session.color = text;
    session.step = STEPS.QUANTITY;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.quantity,
    };
  }

  return {
    text: `❌ الرجاء اختيار لون صحيح:

1- أسود
2- أبيض
3- أحمر
4- أزرق
5- أخضر
6- وردي
7- بيج
8- كحلي
9- بنفسجي
10- لون آخر (اكتبه)

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// الكمية
// ============================================

function handleQuantity(session, text) {
  const normalized = normalizeNumber(text);
  const quantity = parseInt(normalized);

  if (
    isValidNumber(quantity) &&
    quantity > 0 &&
    quantity <= 100 &&
    Number.isInteger(quantity)
  ) {
    session.quantity = quantity;
    session.step = STEPS.CUSTOMER_NAME;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.customer_name,
    };
  }

  return {
    text: `❌ الرجاء إدخال عدد صحيح (1-100):

مثال: 1, 2, 3...

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// اسم الزبون
// ============================================

function handleCustomerName(session, text) {
  if (text.length >= 3) {
    session.customer_name = text;
    session.step = STEPS.CITY;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.city,
    };
  }

  return {
    text: `❌ الرجاء إدخال اسمك الكامل (3 أحرف على الأقل).

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// المدينة
// ============================================

function handleCity(session, text) {
  if (text.length >= 2) {
    session.city = text;
    session.step = STEPS.ADDRESS;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.address,
    };
  }

  return {
    text: `❌ الرجاء إدخال اسم مدينتك.

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// العنوان
// ============================================

function handleAddress(session, text) {
  if (text.length >= 5) {
    session.address = text;
    session.step = STEPS.PHONE;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.phone,
    };
  }

  return {
    text: `❌ الرجاء إدخال عنوانك التفصيلي (5 أحرف على الأقل).

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// الهاتف
// ============================================

function handlePhone(session, text) {
  const cleanPhone = text.replace(/[\s\-().]/g, "");

  const normalizedPhone = normalizeNumber(cleanPhone);

  if (
    /^\+?[0-9]{8,15}$/.test(normalizedPhone)
  ) {
    session.phone = normalizedPhone;
    session.step = STEPS.CONFIRM_ORDER;
    session.updatedAt = Date.now();

    return {
      text: MESSAGES.confirm_order(session),
    };
  }

  return {
    text: `❌ الرجاء إدخال رقم هاتف صحيح (8 إلى 15 رقماً).

مثال: 0612345678

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// تأكيد الطلب
// ============================================

function handleConfirmOrder(session, text) {
  const normalized = normalizeNumber(text);
  const choice = parseInt(normalized);

  // ==========================================
  // تأكيد
  // ==========================================

  if (choice === 1) {
    session.step = STEPS.DONE;

    const orderDetails = {
      jid: session._jid,

      product_type: session.product_type,

      image: session.image,

      size: session.size,

      color: session.color,

      quantity: session.quantity,

      customer_name: session.customer_name,

      city: session.city,

      address: session.address,

      phone: session.phone,

      createdAt: new Date().toISOString(),
    };

    console.log("");
    console.log("==========================================");
    console.log("📦 طلب جديد");
    console.log("==========================================");
    console.log(JSON.stringify(orderDetails, null, 2));
    console.log("==========================================");
    console.log("");

    // حذف الجلسة بعد تأكيد الطلب
    deleteSession(session._jid);

    return {
      text: MESSAGES.order_confirmed,

      order: orderDetails,
    };
  }

  // ==========================================
  // تعديل
  // ==========================================

  if (choice === 2) {
    session.step = STEPS.EDIT_ORDER;
    session.updatedAt = Date.now();

    return {
      text: getEditMenu(session),
    };
  }

  return {
    text: `❌ الرجاء اختيار:

1- نعم ✅ (لتأكيد الطلب)
2- لا ❌ (لتعديل المعلومات)

أو اكتب *إلغاء* للإلغاء.`,
  };
}

// ============================================
// قائمة تعديل الطلب
// ============================================

function getEditMenu(session) {
  return `✏️ *تعديل الطلب*

اختر رقم الحقل الذي تريد تعديله:

1- نوع المنتج (${session.product_type || "غير محدد"})
2- الصورة (${session.image || "بدون"})
3- المقاس (${session.size || "غير محدد"})
4- اللون (${session.color || "غير محدد"})
5- الكمية (${session.quantity || "غير محدد"})
6- الاسم (${session.customer_name || "غير محدد"})
7- المدينة (${session.city || "غير محدد"})
8- العنوان (${session.address || "غير محدد"})
9- رقم الهاتف (${session.phone || "غير محدد"})

أو اكتب *إلغاء* للإلغاء.`;
}

// ============================================
// تعديل الطلب - اختيار الحقل
// ============================================

function handleEditOrder(session, text) {
  const normalized = normalizeNumber(text);
  const choice = parseInt(normalized);

  if (
    isValidNumber(choice) &&
    choice >= 1 &&
    choice <= 9
  ) {
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
    session.step = STEPS.EDIT_VALUE;
    session.updatedAt = Date.now();

    return {
      text: getEditPrompt(field),
    };
  }

  return {
    text: `❌ الرجاء اختيار رقم صحيح (1-9).

أو اكتب *إلغاء* للإلغاء.

${getEditMenu(session)}`,
  };
}

// ============================================
// الرسالة الخاصة بتعديل كل حقل
// ============================================

function getEditPrompt(field) {
  const prompts = {
    product_type: `✏️ *تعديل نوع المنتج*

اختر نوع اللباس:

1- فستان
2- قفطان
3- جلباب
4- عباية
5- طقم نسائي`,

    image: MESSAGES.product_image,

    size: MESSAGES.size,

    color: MESSAGES.color,

    quantity: MESSAGES.quantity,

    customer_name: MESSAGES.customer_name,

    city: MESSAGES.city,

    address: MESSAGES.address,

    phone: MESSAGES.phone,
  };

  return prompts[field] || MESSAGES.invalid_input;
}

// ============================================
// تعديل قيمة الحقل
// ============================================

function handleEditValue(session, text, imageData = null) {
  const field = session.editing;

  // ==========================================
  // تعديل الصورة
  // ==========================================

  if (field === "image") {
    if (imageData) {
      session.image = imageData;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث الصورة بنجاح.

${MESSAGES.confirm_order(session)}`,
      };
    }

    if (
      text.toLowerCase() === "تخطي" ||
      text.toLowerCase() === "skip"
    ) {
      session.image = "بدون صورة";

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: MESSAGES.confirm_order(session),
      };
    }

    return {
      text: `❌ المرجو إرسال صورة صحيحة.

أو اكتب *تخطي* لحذف الصورة.`,
    };
  }

  // ==========================================
  // تعديل نوع المنتج
  // ==========================================

  if (field === "product_type") {
    const normalized = normalizeNumber(text);
    const number = parseInt(normalized);

    if (
      isValidNumber(number) &&
      number >= 1 &&
      number <= 5
    ) {
      session.product_type = getProductName(number);

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث نوع المنتج.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: getEditPrompt("product_type"),
    };
  }

  // ==========================================
  // تعديل المقاس
  // ==========================================

  if (field === "size") {
    const normalized = normalizeNumber(text);
    const number = parseInt(normalized);

    if (
      isValidNumber(number) &&
      number >= 1 &&
      number <= 6
    ) {
      session.size = getSize(number);

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث المقاس.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.size,
    };
  }

  // ==========================================
  // تعديل اللون
  // ==========================================

  if (field === "color") {
    const normalized = normalizeNumber(text);
    const number = parseInt(normalized);

    if (
      isValidNumber(number) &&
      number >= 1 &&
      number <= 9
    ) {
      session.color = getColor(number);

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث اللون.

${MESSAGES.confirm_order(session)}`,
      };
    }

    if (text.length >= 2) {
      session.color = text;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث اللون.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.color,
    };
  }

  // ==========================================
  // تعديل الكمية
  // ==========================================

  if (field === "quantity") {
    const normalized = normalizeNumber(text);
    const quantity = parseInt(normalized);

    if (
      isValidNumber(quantity) &&
      quantity > 0 &&
      quantity <= 100 &&
      Number.isInteger(quantity)
    ) {
      session.quantity = quantity;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث الكمية.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.quantity,
    };
  }

  // ==========================================
  // تعديل الاسم
  // ==========================================

  if (field === "customer_name") {
    if (text.length >= 3) {
      session.customer_name = text;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث الاسم.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.customer_name,
    };
  }

  // ==========================================
  // تعديل المدينة
  // ==========================================

  if (field === "city") {
    if (text.length >= 2) {
      session.city = text;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث المدينة.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.city,
    };
  }

  // ==========================================
  // تعديل العنوان
  // ==========================================

  if (field === "address") {
    if (text.length >= 5) {
      session.address = text;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث العنوان.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.address,
    };
  }

  // ==========================================
  // تعديل الهاتف
  // ==========================================

  if (field === "phone") {
    const cleanPhone = text.replace(/[\s\-().]/g, "");
    const normalizedPhone = normalizeNumber(cleanPhone);

    if (/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      session.phone = normalizedPhone;

      session.editing = null;
      session.step = STEPS.CONFIRM_ORDER;
      session.updatedAt = Date.now();

      return {
        text: `✅ تم تحديث رقم الهاتف.

${MESSAGES.confirm_order(session)}`,
      };
    }

    return {
      text: MESSAGES.phone,
    };
  }

  return {
    text: MESSAGES.invalid_input,
  };
}

// ============================================
// تعديل handleMessage لدعم EDIT_VALUE
// ============================================

// إعادة تعريف الجزء الخاص بالصور والتعديل
// داخل handleMessage الأساسي يتم التعامل مع EDIT_VALUE
// بواسطة هذه الدالة المساعدة.

// ============================================
// Wrapper داخلي
// ============================================

const originalHandleMessage = handleMessage;

// ============================================
// دالة المعالجة النهائية
// ============================================

async function processMessage(jid, text, imageData = null) {
  const session = getSession(jid);

  // إذا كان المستخدم يقوم بتعديل حقل
  if (session.step === STEPS.EDIT_VALUE) {
    if (isCancelCommand(text)) {
      deleteSession(jid);

      return {
        text: MESSAGES.cancel,
      };
    }

    return handleEditValue(session, normalizeText(text), imageData);
  }

  return originalHandleMessage(jid, text, imageData);
}

// ============================================
// تنظيف الجلسات القديمة
// ============================================

setInterval(() => {
  const now = Date.now();

  for (const [jid, session] of sessions.entries()) {
    const age = now - session.updatedAt;

    // حذف الجلسات التي لم تستعمل لمدة 2 ساعات
    if (age > 2 * 60 * 60 * 1000) {
      sessions.delete(jid);

      console.log(`🧹 Session expired: ${jid}`);
    }
  }
}, 10 * 60 * 1000);

// ============================================
// تصدير الدوال
// ============================================

module.exports = {
  handleMessage: processMessage,
  sessions,
  STEPS,
};