<div align="center">

<img src="extension/icons/icon128.png" alt="نَسَق" width="128" height="128">

# نَسَق — مُنسّق الويب

### إضافة Chrome احترافية لتعديل خطوط أي موقع وألوانه ومظهره

[![License: MIT](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-1E40AF?style=for-the-badge)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Chrome](https://img.shields.io/badge/Chrome-116+-FBBC04?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-10B981?style=for-the-badge&logo=shield&logoColor=white)](PRIVACY.md)

[الموقع الرسمي](https://shuounislamiya.github.io/nasaq/) ·
[الدليل التفصيلي](https://shuounislamiya.github.io/nasaq/guide.html) ·
[سياسة الخصوصية](https://shuounislamiya.github.io/nasaq/privacy.html) ·
[تواصل ودعم](https://shuounislamiya.github.io/nasaq/contact.html)

**تطوير: [شؤون إسلامية](https://shuounislamiya.org)**

</div>

---

## 📖 ما هي نَسَق؟

**نَسَق** كلمة عربية أصيلة تعني **التنظيم والتناسق والانسجام على نمط واحد**.
وهذا بالضبط ما تفعله الإضافة بمواقع الويب: تعطيك تحكّمًا كاملًا في خطوط أي موقع وألوانه ومظهره عبر **لوحة جانبية احترافية بالأزرق الملكي**.

> 🎯 صُمِّمت خصيصًا للمحتوى العربي مع دعم RTL متميّز، خطوط عربية مدمجة، وتجربة سلسة لا تحتاج لمعرفة CSS.

---

## ✨ المميزات الرئيسية

| | الميزة | الوصف |
|---|---|---|
| 🖼️ | **لوحة جانبية تبقى مفتوحة** | Side Panel API الحديث — لا تُغلق كالـ popup |
| 🔤 | **3 خطوط عربية مدمجة محليًا** | Tajawal · IBM Plex Sans Arabic · Amiri (تعمل بدون إنترنت) |
| 🎯 | **اتجاه الصفحة بكبسة زر** | RTL · LTR · تلقائي — قسم بارز مخصّص للعربية |
| 🎨 | **محرّر مرئي (Basic)** | تحكّم في الخط، الحجم، الألوان، التخطيط، الإطار |
| 💻 | **محرّر كود (Code)** | اكتب CSS مخصّص مع تطبيق فوري |
| ⮾ | **أداة اختيار العنصر** | انقر على أي عنصر — خوارزمية ذكية تولّد CSS selector مستقر |
| 💾 | **حفظ تلقائي بلا أزرار** | كل تعديل يُحفظ خلال 400ms — لا تحتاج زرّ "حفظ" |
| ⚡ | **توقّف عن المتاهات** | تأكيد بنقرتين بدل النوافذ المنبثقة القبيحة |
| 🔒 | **خصوصية مطلقة** | تخزين محلي 100% — لا اتصال خارجي، لا تتبّع، لا إعلانات |
| 📦 | **تصدير/استيراد JSON** | انقل إعداداتك بين أجهزتك بسهولة |

---

## 🚀 التثبيت السريع

### من Chrome Web Store (قريبًا)
سيكون متاحًا قريبًا.

### التثبيت اليدوي (الآن)

```bash
git clone https://github.com/shuounislamiya/nasaq.git
cd nasaq
```

1. افتح Chrome واذهب إلى `chrome://extensions`
2. فعّل **"وضع المطوّر"** (أعلى يمين)
3. اضغط **"تحميل غير مُحزَّم"**
4. اختر مجلد `extension/` (وليس جذر المشروع)
5. ستظهر أيقونة نَسَق (**ن**) في شريط الأدوات

> 💡 **نصيحة:** ثبّت الأيقونة في الشريط دائمًا عبر زر 📌 من قائمة الإضافات.

---

## 🎬 كيف تستخدمها

<table>
<tr>
<td align="center" width="33%">

### 1️⃣ افتح اللوحة
اضغط أيقونة **ن** في شريط الأدوات.<br>
تفتح اللوحة الجانبية يمين الشاشة.

</td>
<td align="center" width="33%">

### 2️⃣ فعّل الموقع
اضغط على المفتاح <kbd>تفعيل على هذا الموقع</kbd>.<br>
الإضافة معطّلة افتراضيًا على كل موقع.

</td>
<td align="center" width="33%">

### 3️⃣ عدّل المظهر
اختر خطًا، حجمًا، اتجاهًا...<br>
كل تغيير يُطبَّق ويُحفظ تلقائيًا.

</td>
</tr>
</table>

### اختصارات لوحة المفاتيح

| الاختصار | الفعل |
|---|---|
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | فتح/إغلاق اللوحة |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | تفعيل/تعطيل على الموقع الحالي |

غيّرها من `chrome://extensions/shortcuts`.

---

## 🏗️ البنية التقنية

```
nasaq/
├── extension/                    ← مجلد الإضافة (حمّله في Chrome)
│   ├── manifest.json              (Manifest V3)
│   ├── background.js              (Service Worker)
│   ├── content/
│   │   ├── inject.js              (حقن CSS مبكر — document_start)
│   │   └── picker.js              (أداة اختيار العنصر)
│   ├── sidepanel/                 (اللوحة الجانبية)
│   ├── options/                   (صفحة الإعدادات)
│   ├── fonts/                     (8 ملفات woff2 — ~360 KB)
│   ├── icons/                     (16, 32, 48, 128 px)
│   └── _locales/                  (ar + en)
│
├── website/                      ← صفحات الموقع (GitHub Pages)
│   ├── index.html                  الصفحة الرئيسية
│   ├── guide.html                  دليل الاستخدام التفصيلي
│   ├── privacy.html                سياسة الخصوصية
│   └── contact.html                تواصل ودعم
│
├── store-assets/                 ← أصول Chrome Web Store
├── download-fonts.py             ← سكريبت تحميل الخطوط
├── build-icons.py                ← سكريبت توليد الأيقونات
└── PRIVACY.md
```

### التقنيات المستخدمة
- **Manifest V3** + **Side Panel API** (Chrome 116+)
- **Vanilla JavaScript** (بدون أُطر — خفيف وسريع)
- خوارزمية **CSS Selector** مستوحاة من [@medv/finder](https://github.com/antonmedv/finder) مع تخصيصات لمواقع Tailwind/CSS-in-JS
- خطوط مرخّصة **SIL OFL 1.1**
- حقن **`document_start`** لمنع وميض FOUC

---

## 🔐 الخصوصية

نَسَق **لا تجمع أي بيانات**:

- ✅ كل الإعدادات محفوظة محليًا في `chrome.storage.local`
- ✅ لا اتصال بأي خادم خارجي
- ✅ لا تحليلات، لا تتبّع، لا إعلانات
- ✅ الخطوط مدمجة محليًا — لا تحميل من CDN
- ✅ الكود مفتوح ومقروء بالكامل للمراجعة

[**اقرأ سياسة الخصوصية الكاملة ←**](https://shuounislamiya.github.io/nasaq/privacy.html)

### الصلاحيات المطلوبة

| الصلاحية | الغرض |
|---|---|
| `sidePanel` | عرض اللوحة الجانبية |
| `storage` | حفظ تفضيلاتك محليًا |
| `scripting` | حقن CSS وأداة الاختيار في الصفحات |
| `activeTab` · `tabs` | معرفة الموقع الحالي |
| `contextMenus` | إضافة خيارات للقائمة اليمنى |
| `host_permissions: <all_urls>` | تطبيق CSS تلقائيًا على المواقع التي عدّلتها |

---

## 🛠️ التطوير

### إعادة تحميل الخطوط
```bash
pip install requests
python download-fonts.py
```

### إعادة توليد الأيقونات
```bash
pip install pillow
python build-icons.py
```

### تخصيص الألوان
كل الألوان معرّفة في `:root` بأعلى:
- `extension/sidepanel/sidepanel.css`
- `extension/options/options.css`
- `website/styles.css`

غيّر `--primary` و `--gradient` وستتغير الهوية كليًا.

---

## 🌐 صفحات الموقع

| الصفحة | الرابط |
|---|---|
| 🏠 الرئيسية | https://shuounislamiya.github.io/nasaq/ |
| 📖 دليل الاستخدام | https://shuounislamiya.github.io/nasaq/guide.html |
| 🔒 سياسة الخصوصية | https://shuounislamiya.github.io/nasaq/privacy.html |
| 💬 تواصل ودعم | https://shuounislamiya.github.io/nasaq/contact.html |

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

## 🙏 شكر خاص

- خوارزمية اختيار العنصر مستوحاة من [@medv/finder](https://github.com/antonmedv/finder)
- الخطوط من [Google Fonts](https://fonts.google.com)
- استلهام: [Stylebot](https://github.com/ankit/stylebot) و [Stylus](https://github.com/openstyles/stylus)

---

<div align="center">

**صُنع بحبّ للمحتوى العربي 💙**

تطوير: [**شؤون إسلامية**](https://shuounislamiya.org)

</div>
