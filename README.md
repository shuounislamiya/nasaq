<div align="center">

<img src="chrome/icons/icon128.png" alt="نَسَق" width="128" height="128">

# نَسَق — مُنسّق الويب

### إضافة متصفّح احترافية لتعديل خطوط أي موقع وألوانه ومظهره

[![License: MIT](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-116+-FBBC04?style=for-the-badge&logo=googlechrome&logoColor=white)](dist/nasaq-chrome-v1.0.0.zip)
[![Firefox](https://img.shields.io/badge/Firefox-115+-FF7139?style=for-the-badge&logo=firefox&logoColor=white)](dist/nasaq-firefox-v1.0.0.xpi)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-10B981?style=for-the-badge&logo=shield&logoColor=white)](chrome/PRIVACY.md)

**تطوير: [شؤون إسلامية](https://shuounislamiya.org)**

</div>

---

## 📦 تحميل مباشر

### 🌐 المتصفحات المدعومة

| المتصفح | الإصدار | التحميل المباشر |
|---|---|---|
| **Chrome** · Edge · Brave · Opera · Vivaldi · Arc | 116+ | [⬇ nasaq-chrome-v1.0.0.zip](https://github.com/shuounislamiya/nasaq/raw/main/dist/nasaq-chrome-v1.0.0.zip) |
| **Firefox** | 115+ | [⬇ nasaq-firefox-v1.0.0.xpi](https://github.com/shuounislamiya/nasaq/raw/main/dist/nasaq-firefox-v1.0.0.xpi) |

> 📘 **خطوات التثبيت التفصيلية**: راجع صفحة [التثبيت](https://shuounislamiya.github.io/nasaq/install.html)

---

## 📖 ما هي نَسَق؟

**نَسَق** كلمة عربية أصيلة تعني **التنظيم والتناسق والانسجام على نمط واحد**.
وهذا بالضبط ما تفعله الإضافة بمواقع الويب: تعطيك تحكّمًا كاملًا في خطوط أي موقع وألوانه ومظهره عبر **لوحة جانبية احترافية بالأزرق الملكي**.

> 🎯 صُمِّمت خصيصًا للمحتوى العربي مع دعم RTL متميّز، خطوط عربية مدمجة، وتجربة سلسة لا تحتاج لمعرفة CSS.

---

## ✨ المميزات

| | الميزة | الوصف |
|---|---|---|
| 🖼️ | **لوحة جانبية تبقى مفتوحة** | Side Panel API (Chrome) / Sidebar API (Firefox) |
| 🔤 | **3 خطوط عربية مدمجة محليًا** | Tajawal · IBM Plex Sans Arabic · Amiri |
| 🎯 | **اتجاه الصفحة بكبسة زر** | RTL · LTR · تلقائي |
| 🎨 | **محرّر مرئي (Basic)** | الخط، الحجم، الألوان، التخطيط، الإطار |
| 💻 | **محرّر كود (Code)** | اكتب CSS مخصّص مع تطبيق فوري |
| ⮾ | **أداة اختيار العنصر** | انقر على أي عنصر بالماوس |
| 💾 | **حفظ تلقائي بلا أزرار** | كل تعديل يُحفظ خلال 400ms |
| 🔒 | **خصوصية مطلقة** | تخزين محلي 100% — لا اتصال خارجي |

---

## 🏗️ بنية المستودع

```
nasaq/
├── chrome/                 ← نسخة Chrome / Edge / Brave / Opera / Vivaldi
│   ├── manifest.json         (Manifest V3 + sidePanel)
│   ├── background.js
│   ├── content/
│   ├── sidepanel/
│   ├── options/
│   ├── fonts/                (3 خطوط عربية)
│   ├── icons/
│   └── _locales/
│
├── firefox/                ← نسخة Firefox
│   ├── manifest.json         (Manifest V3 + sidebar_action)
│   ├── background.js
│   ├── browser-polyfill.js   (Mozilla polyfill)
│   ├── content/
│   ├── sidepanel/
│   ├── options/
│   ├── fonts/
│   ├── icons/
│   └── _locales/
│
├── dist/                   ← الملفات الجاهزة للتحميل
│   ├── nasaq-chrome-v1.0.0.zip
│   ├── nasaq-firefox-v1.0.0.xpi
│   └── nasaq-firefox-v1.0.0.zip
│
├── README.md · LICENSE
```

---

## 🚀 التثبيت السريع

### Chrome وكل المتصفحات Chromium

1. **حمّل** [nasaq-chrome-v1.0.0.zip](https://github.com/shuounislamiya/nasaq/raw/main/dist/nasaq-chrome-v1.0.0.zip) وفُكّ الضغط
2. افتح `chrome://extensions` (أو `edge://extensions` · `brave://extensions` · إلخ)
3. فعّل **"وضع المطوّر"** (أعلى يمين)
4. اضغط **"تحميل غير مُحزَّم"** واختر المجلد

### Firefox

1. **حمّل** [nasaq-firefox-v1.0.0.xpi](https://github.com/shuounislamiya/nasaq/raw/main/dist/nasaq-firefox-v1.0.0.xpi)
2. افتح `about:debugging#/runtime/this-firefox`
3. اضغط **"Load Temporary Add-on..."** واختر ملف `.xpi`

> ⚠️ Firefox يحتاج توقيع رسمي للتثبيت الدائم — قادم قريبًا على Firefox Add-ons.

---

## 🎬 الاستخدام

1. **اضغط أيقونة نَسَق** (ن) في شريط الأدوات
2. **فعّل المفتاح** "تفعيل على هذا الموقع"
3. **عدّل المظهر** — كل تغيير يُحفظ تلقائيًا

### الاختصارات

| الاختصار | الفعل |
|---|---|
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | فتح/إغلاق اللوحة |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | تفعيل/تعطيل الموقع الحالي |

---

## 🔐 الخصوصية

- ✅ **لا جمع بيانات** — كل شيء محليًا في `storage.local`
- ✅ **لا اتصال خارجي** — الخطوط مدمجة
- ✅ **لا تحليلات، لا تتبع، لا إعلانات**
- ✅ **مفتوح المصدر** — راجع الكود بنفسك

[📄 سياسة الخصوصية الكاملة](https://shuounislamiya.github.io/nasaq/privacy.html)

---

## 🌐 الموقع الرسمي

| الصفحة | الرابط |
|---|---|
| 🏠 الرئيسية | https://shuounislamiya.github.io/nasaq/ |
| 📥 التثبيت | https://shuounislamiya.github.io/nasaq/install.html |
| 📖 الدليل | https://shuounislamiya.github.io/nasaq/guide.html |
| 🔒 الخصوصية | https://shuounislamiya.github.io/nasaq/privacy.html |
| 💬 تواصل | https://shuounislamiya.github.io/nasaq/contact.html |

---

## ❤️ ادعم المشروع

[![Patreon](https://img.shields.io/badge/Patreon-اشتراك_شهري-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/shuounislamiya)
[![YouTube](https://img.shields.io/badge/YouTube-عضوية_القناة-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@shuounislamiya/join)

> تبدأ من **دولار واحد** فقط — كل مساهمة تصنع فرقًا.

---

## 💬 التواصل

| القناة | الرابط |
|---|---|
| 💬 واتساب | [+44 7537 189088](https://wa.me/447537189088) |
| ✈️ تليجرام مباشر | [@MoustafaJournalist](https://t.me/MoustafaJournalist) |
| 📺 يوتيوب | [قناة شؤون إسلامية](https://www.youtube.com/@shuounislamiya) |
| 𝕏 تويتر | [@Shuounislamiya](https://twitter.com/Shuounislamiya) |

---

## 📜 الترخيص

- **كود الإضافة**: [MIT License](LICENSE)
- **الخطوط المدمجة**: SIL Open Font License 1.1

---

<div align="center">

**صُنع بحبّ للمحتوى العربي 💙**

تطوير: [**شؤون إسلامية**](https://shuounislamiya.org)

</div>
