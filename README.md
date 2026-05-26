# نَسَق (Nasaq) — مُنسّق الويب

> إضافة Chrome احترافية لتعديل خطوط أي موقع وألوانه ومظهره عبر **لوحة جانبية** أنيقة بالأزرق الملكي. ثلاثة خطوط عربية احترافية مدمجة، محرّر CSS كامل، تخزين محلي 100%.

**نَسَق** كلمة عربية أصيلة تعني التنظيم والتناسق والانسجام على نمط واحد — وهذا بالضبط ما تفعله الإضافة بمواقعك.

> **تطوير: شؤون إسلامية**

---

## المميزات

- **لوحة جانبية تبقى مفتوحة** أثناء التصفّح — لا تُغلق كالـ popup
- **محرّر مرئي (Basic)** — تحكّم في الخط، الحجم، اللون، التخطيط، الإطار، التأثيرات
- **محرّر كود (Code)** — اكتب CSS مخصّص مع تطبيق فوري
- **أداة اختيار العنصر** بالماوس — مع خوارزمية تولّد CSS selector مستقر
- **3 خطوط عربية احترافية مدمجة** (Tajawal, IBM Plex Sans Arabic, Amiri) تعمل **بدون اتصال إنترنت** — مع دعم خطوط النظام (Tahoma, Segoe UI, إلخ)
- **التحكم بالاتجاه** RTL/LTR/تلقائي لكل عنصر
- **تفعيل/تعطيل لكل موقع** مستقلًا
- **تصدير/استيراد** كل الإعدادات بصيغة JSON
- **خصوصية كاملة** — لا اتصال خارجي، لا تتبع، لا تحليلات
- **Manifest V3** — يلتزم بأحدث معايير Chrome 2026

---

## التثبيت (تطوير محلي)

1. حمّل المشروع كاملًا
2. شغّل سكريبت تحميل الخطوط:
   ```bash
   pip install requests
   python download-fonts.py
   ```
3. (اختياري) شغّل سكريبت توليد الأيقونات:
   ```bash
   pip install pillow
   python build-icons.py
   ```
4. افتح `chrome://extensions`
5. فعّل **"وضع المطوّر"** (أعلى يمين)
6. اضغط **"تحميل غير مُحزَّم"** واختر مجلد `extension/`

> ⚠️ **مهم:** اختر مجلد `extension/` نفسه، وليس جذر المشروع.

---

## الاستخدام

### الاستخدام الأساسي

1. افتح أي موقع
2. اضغط أيقونة Nasaq في شريط الأدوات → تُفتح اللوحة الجانبية يمين الشاشة
3. فعّل التبديل **"تفعيل على هذا الموقع"**
4. اختر selector من حقل النص أو اضغط زر <kbd>⮾</kbd> لاختياره من الصفحة
5. عدّل من **Basic** أو اكتب CSS في **Code**
6. اضغط **حفظ** لتثبيت التغييرات

### اختصارات لوحة المفاتيح

| الاختصار | الفعل |
|---|---|
| `Alt+Shift+S` | فتح/إغلاق اللوحة |
| `Alt+Shift+D` | تفعيل/تعطيل على الموقع الحالي |

> غيّر الاختصارات من `chrome://extensions/shortcuts`.

---

## بنية المشروع

```
.
├── extension/                  ← مجلد الإضافة (حمّله في Chrome)
│   ├── manifest.json            (Manifest V3)
│   ├── background.js            (Service Worker)
│   ├── content/
│   │   ├── inject.js            (حقن CSS مبكر — document_start)
│   │   └── picker.js            (أداة اختيار العنصر)
│   ├── sidepanel/
│   │   ├── sidepanel.html
│   │   ├── sidepanel.css        (ثيم أزرق ملكي)
│   │   └── sidepanel.js
│   ├── options/
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── fonts/                   (8 ملفات woff2 — ~300 KB)
│   │   ├── tajawal-{400,500,700}.woff2
│   │   ├── ibm-plex-arabic-{400,500,700}.woff2
│   │   └── amiri-{400,700}.woff2
│   ├── icons/                   (16, 32, 48, 128 px)
│   └── _locales/
│       ├── ar/messages.json
│       └── en/messages.json
│
├── store-assets/                (Promo tiles لـ Chrome Web Store)
├── download-fonts.py            (سكريبت تحميل الخطوط من Google)
├── build-icons.py               (سكريبت توليد الأيقونات)
└── README.md
```

---

## التقنيات

- **Manifest V3** + **Side Panel API** (Chrome 116+)
- **Vanilla JS** (لا frameworks ولا bundlers — خفيف وسريع)
- **خوارزمية CSS Selector** مستوحاة من `@medv/finder` مع تخصيصات لمواقع Tailwind/CSS-in-JS
- **خطوط محلية** مرخّصة OFL 1.1 و Apache 2.0
- **حقن مبكر** عند `document_start` لمنع وميض FOUC

---

## الخصوصية

Nasaq لا تجمع **أي** بيانات شخصية:

- كل الإعدادات والأنماط محفوظة في `chrome.storage.local` على جهازك فقط
- لا اتصال بأي خادم خارجي — لا حتى لتحميل الخطوط (مدمجة)
- لا تحليلات، لا تتبع، لا إعلانات
- الكود مفتوح ومقروء بالكامل

**الصلاحيات المطلوبة وتبريرها:**

| الصلاحية | السبب |
|---|---|
| `sidePanel` | لعرض اللوحة الجانبية بدلًا من popup |
| `storage` | لحفظ تفضيلاتك محليًا |
| `scripting` | لحقن CSS وأداة الاختيار في الصفحات |
| `activeTab` | لتطبيق التغييرات على التبويب الحالي |
| `contextMenus` | لإضافة خيار "اختر عنصر" للقائمة اليمنى |
| `tabs` | لقراءة hostname الموقع الحالي |
| `host_permissions: <all_urls>` | لتطبيق CSS تلقائيًا على أي موقع تعدّله |

---

## النشر على Chrome Web Store

### قبل النشر

1. تحقق من تحميل كل ملفات الخطوط (`extension/fonts/*.woff2`)
2. تحقق من وجود الأيقونات (`extension/icons/*.png`)
3. أنشئ Privacy Policy على GitHub Pages أو أي استضافة (نص مقترح في قسم الخصوصية)
4. حضّر screenshots بدقة `1280x800` (4-5 صور)

### الأصول الجاهزة

في مجلد `store-assets/` ستجد:

- `promo-small.png` (440×280) — Small promo tile (إلزامي)
- `promo-marquee.png` (1400×560) — Marquee promo tile (لطلب featuring)
- `promo-large.png` (920×680) — لاستخدامات عامة

### Single-purpose description (للنموذج)

> **تعديل خطوط ومظهر المواقع لتحسين تجربة القراءة، مع دعم متميّز للخطوط العربية.**

### Permissions justification (للنموذج)

نُسخ نصوص جاهزة في قسم **الخصوصية** أعلاه — انقلها كما هي لنموذج Chrome Web Store.

### رفع الإضافة

```bash
cd extension
zip -r ../nasaq-v1.0.0.zip . -x "*.DS_Store" -x "*.gitkeep"
```

ثم ارفع `nasaq-v1.0.0.zip` على [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).

---

## التطوير

### إعادة تحميل الخطوط

عدّل قائمة `FONTS` في `download-fonts.py` ثم:
```bash
python download-fonts.py
```

### إعادة توليد الأيقونات

عدّل ألوان `PRIMARY`/`PRIMARY_LIGHT`/`PRIMARY_DARK` في `build-icons.py` ثم:
```bash
python build-icons.py
```

### إضافة خط جديد

1. أضفه إلى `FONTS` في `download-fonts.py`
2. شغّل السكريبت
3. أضفه إلى `BUNDLED_FONTS` في `extension/content/inject.js`
4. أضفه إلى `BUNDLED_FONTS` في `extension/sidepanel/sidepanel.js`

### تخصيص الألوان

كل الألوان معرّفة في أعلى:
- `extension/sidepanel/sidepanel.css`  (`:root { --primary: ... }`)
- `extension/options/options.css`

غيّر `--primary` و `--gradient` وستتغير الواجهة كلها.

---

## الترخيص

- كود الإضافة: **MIT License**
- الخطوط المدمجة (Tajawal، IBM Plex Sans Arabic، Amiri): **OFL 1.1**. تفاصيل في `extension/fonts/LICENSE.txt`

---

## شكر

- بنية الاختيار مستوحاة من [@medv/finder](https://github.com/antonmedv/finder)
- الخطوط من [Google Fonts](https://fonts.google.com)
- الأيقونات بنمط [Lucide](https://lucide.dev)
- استلهام أساسي: [Stylebot](https://github.com/ankit/stylebot) و [Stylus](https://github.com/openstyles/stylus)

---

**تطوير: شؤون إسلامية** — صُنع بحب للمحتوى العربي.
