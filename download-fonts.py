#!/usr/bin/env python3
"""
Nasaq — Font Downloader

يحمّل كل خطوط الإضافة المدمجة من Google Fonts بصيغة woff2
ويضعها في extension/fonts/ بالأسماء التي يتوقّعها content/inject.js

الاستخدام:
    python download-fonts.py

يتطلب: requests (pip install requests)
"""

import os
import re
import sys
import time
from pathlib import Path

# اضمن إخراج UTF-8 على Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import requests
except ImportError:
    print("Install requests first:  pip install requests")
    sys.exit(1)

# ============================================================
# قائمة الخطوط: (font_id, family_name, [weights], preferred_subset)
# preferred_subset:
#   "arabic" — اختر woff2 لـ subset العربي
#   "latin"  — اختر woff2 لـ subset اللاتيني
# تطابق بالضبط BUNDLED_FONTS في content/inject.js
# ============================================================

FONTS = [
    # 3 خطوط عربية احترافية فقط
    ("tajawal",          "Tajawal",                [400, 500, 700], "arabic"),
    ("ibm-plex-arabic",  "IBM Plex Sans Arabic",   [400, 500, 700], "arabic"),
    ("amiri",            "Amiri",                  [400, 700],      "arabic"),
]

# ============================================================

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")

CSS_API = "https://fonts.googleapis.com/css2"

SCRIPT_DIR = Path(__file__).parent.resolve()
FONTS_DIR  = SCRIPT_DIR / "extension" / "fonts"


def google_css_url(family, weight):
    """يبني رابط Google Fonts CSS API v2"""
    fam = family.replace(" ", "+")
    return f"{CSS_API}?family={fam}:wght@{weight}&display=swap"


def fetch_css(family, weight):
    """يجلب CSS من Google Fonts ويستخرج روابط woff2"""
    url = google_css_url(family, weight)
    headers = {"User-Agent": UA}
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()
    return r.text


def extract_woff2_blocks(css_text):
    """يستخرج (subset_name, woff2_url) لكل @font-face block في CSS"""
    # كل block: /* subset */ @font-face { ... src: url(...) ... }
    blocks = []
    # نقسم بحسب التعليق /* xxx */
    pattern = re.compile(
        r"/\*\s*([a-z-]+)\s*\*/.*?url\((https?://[^)]+\.woff2)\)",
        re.DOTALL | re.IGNORECASE
    )
    for m in pattern.finditer(css_text):
        subset = m.group(1).strip().lower()
        url = m.group(2)
        blocks.append((subset, url))
    return blocks


def pick_url(blocks, preferred_subset):
    """يختار أنسب URL حسب subset المطلوب"""
    if not blocks:
        return None
    # ابحث عن مطابقة تامة
    for subset, url in blocks:
        if subset == preferred_subset:
            return url
    # لو لم نجد، جرّب أن يحوي اسم subset في الـ name
    for subset, url in blocks:
        if preferred_subset in subset:
            return url
    # افتراضيًا: أول URL
    return blocks[0][1]


def download_font(url, dest_path):
    """يحمل ملف woff2 إلى dest_path"""
    headers = {"User-Agent": UA}
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    dest_path.write_bytes(r.content)
    return len(r.content)


def main():
    print(f"\n[DEST] {FONTS_DIR}\n")
    FONTS_DIR.mkdir(parents=True, exist_ok=True)

    total_files = 0
    total_bytes = 0
    failed = []

    for entry in FONTS:
        # دعم تنسيق قديم (3 عناصر) وجديد (4 عناصر)
        if len(entry) == 4:
            font_id, family, weights, subset = entry
        else:
            font_id, family, weights = entry
            subset = "latin"

        print(f"-- {family}  [subset={subset}]")
        for weight in weights:
            dest = FONTS_DIR / f"{font_id}-{weight}.woff2"
            try:
                css = fetch_css(family, weight)
                blocks = extract_woff2_blocks(css)
                if not blocks:
                    print(f"  [skip]   {dest.name} - no woff2 URL in CSS")
                    failed.append(dest.name)
                    continue
                chosen = pick_url(blocks, subset)
                size = download_font(chosen, dest)
                # تحقق أن الحجم منطقي (>5 KB)
                quality = ""
                if subset == "arabic" and size < 12000:
                    quality = "  [WARN: small for arabic]"
                print(f"  [ok]     {dest.name} ({size//1024} KB){quality}")
                total_files += 1
                total_bytes += size
                time.sleep(0.15)  # احترام لخادم Google
            except Exception as e:
                print(f"  [fail]   {dest.name} - {e}")
                failed.append(dest.name)

    print(f"\n{'='*50}")
    print(f"DONE: {total_files} files ({total_bytes // 1024} KB total)")
    if failed:
        print(f"FAILED: {len(failed)} files:")
        for f in failed:
            print(f"   - {f}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
