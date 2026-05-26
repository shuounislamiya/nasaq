# موقع نَسَق — صفحة الهبوط

صفحة ويب احترافية لإضافة **نَسَق — مُنسّق الويب**.

## التشغيل المحلي

افتح `index.html` مباشرة في المتصفح، أو شغّل خادمًا محليًا:

```bash
# Python 3
cd website
python -m http.server 8000

# ثم افتح http://localhost:8000
```

## النشر

### GitHub Pages
1. ادفع المستودع إلى GitHub
2. Settings → Pages → Source → اختر `main` و `/website`
3. سيكون الموقع متاحًا على: `https://shuounislamiya.github.io/nasaq/`

### Netlify / Vercel
- اربط المستودع
- اضبط publish directory إلى `website/`
- لا حاجة لـ build command

## البنية

```
website/
├── index.html      ← الصفحة الرئيسية
├── styles.css      ← التصميم بالأزرق الملكي
├── script.js       ← الأنيميشن والتفاعل
├── assets/         ← الصور واللقطات
└── README.md
```

## التقنيات
- HTML5 + CSS3 + Vanilla JS (لا أُطُر)
- Google Fonts: IBM Plex Sans Arabic, Tajawal, JetBrains Mono
- IntersectionObserver للأنيميشن عند التمرير
- متجاوبة بالكامل (mobile-first)
- دعم RTL أصيل
- يحترم `prefers-reduced-motion`

## التخصيص
كل الألوان معرّفة في `:root` بأعلى `styles.css`. غيّر `--primary` و `--gradient` لتغيير الهوية.
