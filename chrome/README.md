<div align="center">

<img src="icons/icon128.png" alt="نَسَق" width="128" height="128">

# نَسَق — مُنسّق الويب

### إضافة Chrome احترافية لتعديل خطوط أي موقع وألوانه ومظهره

[![License: MIT](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-1E40AF?style=for-the-badge)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Chrome](https://img.shields.io/badge/Chrome-116+-FBBC04?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-10B981?style=for-the-badge&logo=shield&logoColor=white)](PRIVACY.md)

**تطوير: [شؤون إسلامية](https://shuounislamiya.org)**

</div>

---

## 📖 ما هي نَسَق؟

**نَسَق** كلمة عربية أصيلة تعني **التنظيم والتناسق والانسجام على نمط واحد**.
وهذا بالضبط ما تفعله الإضافة بمواقع الويب: تعطيك تحكّمًا كاملًا في خطوط أي موقع وألوانه ومظهره عبر **لوحة جانبية احترافية بالأزرق الملكي**.

> 🎯 صُمِّمت خصيصًا للمحتوى العربي مع دعم RTL متميّز، خطوط عربية مدمجة، وتجربة سلسة لا تحتاج لمعرفة CSS.

---

## ✨ المميزات

| | الميزة | الوصف |
|---|---|---|
| 🖼️ | **لوحة جانبية تبقى مفتوحة** | Side Panel API الحديث — لا تُغلق كالـ popup |
| 🔤 | **3 خطوط عربية مدمجة محليًا** | Tajawal · IBM Plex Sans Arabic · Amiri |
| 🎯 | **اتجاه الصفحة بكبسة زر** | RTL · LTR · تلقائي — قسم بارز مخصّص للعربية |
| 🎨 | **محرّر مرئي (Basic)** | الخط، الحجم، الألوان، التخطيط، الإطار |
| 💻 | **محرّر كود (Code)** | اكتب CSS مخصّص مع تطبيق فوري |
| ⮾ | **أداة اختيار العنصر** | انقر — خوارزمية ذكية تولّد CSS selector مستقر |
| 💾 | **حفظ تلقائي بلا أزرار** | كل تعديل يُحفظ خلال 400ms |
| 🔒 | **خصوصية مطلقة** | تخزين محلي 100% — لا اتصال خارجي |

---

## 🚀 التثبيت

### من Chrome Web Store
سيكون متاحًا قريبًا.

### التثبيت اليدوي

```bash
git clone https://github.com/shuounislamiya/nasaq.git
```

1. افتح `chrome://extensions`
2. فعّل **"وضع المطوّر"** (أعلى يمين)
3. اضغط **"تحميل غير مُحزَّم"**
4. اختر مجلد المستودع المستنسخ
5. ستظهر أيقونة نَسَق (**ن**) في شريط الأدوات

> 💡 **نصيحة:** ثبّت الأيقونة في الشريط دائمًا عبر زر 📌 من قائمة الإضافات.

---

## 🎬 كيف تستخدمها

1. **افتح اللوحة** — اضغط أيقونة **ن** في شريط الأدوات
2. **فعّل الموقع** — اضغط مفتاح "تفعيل على هذا الموقع"
3. **عدّل المظهر** — اختر خطًا، حجمًا، اتجاهًا... كل تغيير يُطبَّق ويُحفظ تلقائيًا

### اختصارات لوحة المفاتيح

| الاختصار | الفعل |
|---|---|
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | فتح/إغلاق اللوحة |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | تفعيل/تعطيل على الموقع الحالي |

غيّرها من `chrome://extensions/shortcuts`.

---

## 🏗️ بنية الملفات

```
nasaq/
├── manifest.json          (Manifest V3)
├── background.js          (Service Worker)
├── content/
│   ├── inject.js          (حقن CSS مبكر — document_start)
│   └── picker.js          (أداة اختيار العنصر)
├── sidepanel/             (اللوحة الجانبية)
│   ├── sidepanel.html
│   ├── sidepanel.css
│   └── sidepanel.js
├── options/               (صفحة الإعدادات)
│   ├── options.html
│   ├── options.css
│   └── options.js
├── fonts/                 (8 ملفات woff2 — ~360 KB)
├── icons/                 (16, 32, 48, 128 px)
└── _locales/              (ar + en)
```

### التقنيات
- **Manifest V3** + **Side Panel API** (Chrome 116+)
- **Vanilla JavaScript** بدون أُطر
- خوارزمية CSS Selector مستوحاة من [@medv/finder](https://github.com/antonmedv/finder)
- خطوط مرخّصة **SIL OFL 1.1**
- حقن **`document_start`** لمنع وميض FOUC

---

## 🔐 الخصوصية

نَسَق **لا تجمع أي بيانات**:

- ✅ كل الإعدادات محفوظة محليًا في `chrome.storage.local`
- ✅ لا اتصال بأي خادم خارجي
- ✅ لا تحليلات، لا تتبّع، لا إعلانات
- ✅ الخطوط مدمجة محليًا
- ✅ الكود مفتوح ومقروء بالكامل

[**اقرأ سياسة الخصوصية الكاملة ←**](PRIVACY.md)

### الصلاحيات المطلوبة

| الصلاحية | الغرض |
|---|---|
| `sidePanel` | عرض اللوحة الجانبية |
| `storage` | حفظ تفضيلاتك محليًا |
| `scripting` | حقن CSS وأداة الاختيار |
| `activeTab` · `tabs` | معرفة الموقع الحالي |
| `contextMenus` | إضافة خيارات للقائمة اليمنى |
| `host_permissions: <all_urls>` | تطبيق CSS تلقائيًا على المواقع المُعدَّلة |

---

## ❤️ ادعم استمرار المشروع

نَسَق مجانية تمامًا، وكذلك بقية مشاريع **شؤون إسلامية**. استمرار التطوير يعتمد على دعمكم.

[![Patreon](https://img.shields.io/badge/Patreon-اشتراك_شهري-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/shuounislamiya)
[![YouTube](https://img.shields.io/badge/YouTube-عضوية_القناة-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@shuounislamiya/join)

> تبدأ من **دولار واحد** فقط — كل مساهمة تصنع فرقًا.

---

## 💬 تواصل معنا

| القناة | الرابط |
|---|---|
| 💬 واتساب | [+44 7537 189088](https://wa.me/447537189088) |
| ✈️ تليجرام مباشر | [@MoustafaJournalist](https://t.me/MoustafaJournalist) |
| 📺 قناة يوتيوب | [شؤون إسلامية](https://www.youtube.com/@shuounislamiya) |
| 𝕏 تويتر | [@Shuounislamiya](https://twitter.com/Shuounislamiya) |
| ✈️ قناة تليجرام | [@ArabAffairsTV](https://t.me/ArabAffairsTV) |
| 📘 فيسبوك | [Shuounislamiya](https://facebook.com/Shuounislamiya) |

---

## 📜 الترخيص

- **كود الإضافة**: [MIT License](LICENSE)
- **الخطوط المدمجة** (Tajawal، IBM Plex Sans Arabic، Amiri): **SIL OFL 1.1**

---

<div align="center">

**صُنع بحبّ للمحتوى العربي 💙**

تطوير: [**شؤون إسلامية**](https://shuounislamiya.org)

</div>
