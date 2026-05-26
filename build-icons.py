#!/usr/bin/env python3
"""
Nasaq — Icon Builder

يولّد أيقونات الإضافة بكل المقاسات المطلوبة لـ Chrome Web Store:
  16, 32, 48, 128 (للـ manifest)
  + 440x280, 1400x560, 920x680 (promo tiles)

الفكرة: شعار حرف "ن" العربي على خلفية متدرّجة بالأزرق الملكي.

التشغيل:
    python build-icons.py

يتطلب: Pillow
    pip install pillow
"""

import sys
from pathlib import Path

# اضمن إخراج UTF-8 على Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print("Install Pillow first: pip install pillow")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent.resolve()
ICONS_DIR  = SCRIPT_DIR / "extension" / "icons"
STORE_DIR  = SCRIPT_DIR / "store-assets"

# الألوان (RGB)
PRIMARY       = (30, 64, 175)      # Royal Blue
PRIMARY_LIGHT = (59, 130, 246)
PRIMARY_DARK  = (23, 37, 84)
WHITE         = (255, 255, 255)
ACCENT        = (96, 165, 250)


def gradient_bg(size, c1=PRIMARY_LIGHT, c2=PRIMARY_DARK):
    """تكوين خلفية متدرّجة من زاوية لزاوية"""
    img = Image.new("RGB", (size, size), c1)
    draw = ImageDraw.Draw(img)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(c1[0] + (c2[0] - c1[0]) * t)
            g = int(c1[1] + (c2[1] - c1[1]) * t)
            b = int(c1[2] + (c2[2] - c1[2]) * t)
            draw.point((x, y), (r, g, b))
    return img


def gradient_bg_fast(size, c1=PRIMARY_LIGHT, c2=PRIMARY_DARK):
    """نسخة سريعة باستخدام Image.composite"""
    base = Image.new("RGB", (size, size), c1)
    overlay = Image.new("RGB", (size, size), c2)
    # mask قطري
    mask = Image.new("L", (size, size))
    md = ImageDraw.Draw(mask)
    for i in range(size * 2):
        v = int(255 * i / (2 * size))
        md.line([(i, 0), (0, i)], fill=v)
    return Image.composite(overlay, base, mask)


def rounded_mask(size, radius):
    """قناع زوايا دائرية"""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    return mask


def find_font(size, bold=True, arabic=False):
    """يحاول إيجاد خط جميل، يقع على الافتراضي عند الفشل"""
    if arabic:
        candidates = [
            "C:/Windows/Fonts/tahomabd.ttf",   # Tahoma Bold (يدعم العربية)
            "C:/Windows/Fonts/tahoma.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Geeza Pro.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    elif bold:
        candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    for path in candidates:
        try:
            if Path(path).exists():
                return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_arabic_text(draw, text, cx, cy, font_size, color, font=None):
    """يرسم نصًا عربيًا في وسط النقطة المحدّدة"""
    if font is None:
        font = find_font(font_size, bold=True, arabic=True)
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = cx - tw / 2 - bbox[0]
        ty = cy - th / 2 - bbox[1]
    except Exception:
        tw, th = font_size, font_size
        tx = cx - tw / 2
        ty = cy - th / 2
    draw.text((tx, ty), text, font=font, fill=color)


def make_icon(size, output_path):
    """يولّد أيقونة كاملة بحرف "ن" عربي أنيق"""
    scale = 4 if size <= 64 else 2
    big = size * scale
    radius = int(big * 0.22)

    # خلفية متدرجة
    bg = gradient_bg_fast(big, PRIMARY_LIGHT, PRIMARY_DARK)

    # تطبيق الزوايا الدائرية
    mask = rounded_mask(big, radius)
    rounded = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    rounded.paste(bg, (0, 0), mask)

    # ارسم حرف "ن" في المنتصف باستخدام Tahoma Bold
    draw = ImageDraw.Draw(rounded)
    font_size = int(big * 0.70)
    cx = big // 2
    cy = int(big * 0.52)  # محاذاة بصرية مع المنتصف
    draw_arabic_text(draw, "ن", cx, cy, font_size, WHITE)

    # تنعيم الحواف عبر التصغير
    final = rounded.resize((size, size), Image.LANCZOS)
    final.save(output_path, "PNG", optimize=True)
    print(f"  [ok] {output_path.name} ({size}x{size})")


def make_promo_tile(width, height, output_path, title="Nasaq", subtitle="Web Stylist"):
    """يولّد promo tile للـ store"""
    img = Image.new("RGB", (width, height), PRIMARY_DARK)

    # خلفية متدرّجة قطرية يدويًا
    px = img.load()
    for y in range(height):
        for x in range(width):
            t = (x + y) / (width + height)
            r = int(PRIMARY_LIGHT[0] + (PRIMARY_DARK[0] - PRIMARY_LIGHT[0]) * t)
            g = int(PRIMARY_LIGHT[1] + (PRIMARY_DARK[1] - PRIMARY_LIGHT[1]) * t)
            b = int(PRIMARY_LIGHT[2] + (PRIMARY_DARK[2] - PRIMARY_LIGHT[2]) * t)
            px[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)

    # شعار في اليسار
    logo_size = int(height * 0.55)
    logo_x = int(width * 0.08)
    logo_y = (height - logo_size) // 2

    # خلفية شعار بيضاء
    corner = int(logo_size * 0.22)
    draw.rounded_rectangle(
        [(logo_x, logo_y), (logo_x + logo_size, logo_y + logo_size)],
        radius=corner,
        fill=WHITE
    )

    # حرف "ن" داخل الشعار باللون الأزرق الداكن
    cx = logo_x + logo_size // 2
    cy = logo_y + int(logo_size * 0.52)
    n_font_size = int(logo_size * 0.70)
    draw_arabic_text(draw, "ن", cx, cy, n_font_size, PRIMARY_DARK)

    # العنوان والوصف
    title_size = int(height * 0.22)
    sub_size = int(height * 0.10)
    title_font = find_font(title_size, bold=True)
    sub_font = find_font(sub_size, bold=False)

    text_x = logo_x + logo_size + int(width * 0.05)
    bbox = draw.textbbox((0, 0), title, font=title_font)
    th_t = bbox[3] - bbox[1]
    sbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sh_t = sbox[3] - sbox[1]
    gap = int(height * 0.04)
    total = th_t + gap + sh_t
    title_y = (height - total) // 2 - bbox[1]
    sub_y   = title_y + bbox[1] + th_t + gap - sbox[1]

    draw.text((text_x, title_y), title, font=title_font, fill=WHITE)
    draw.text((text_x, sub_y), subtitle, font=sub_font, fill=(220, 234, 254))

    img.save(output_path, "PNG", optimize=True)
    print(f"  [ok] {output_path.name} ({width}x{height})")


def main():
    print(f"\n[DEST] {ICONS_DIR}\n")
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    STORE_DIR.mkdir(parents=True, exist_ok=True)

    print("Generating extension icons:")
    for size in (16, 32, 48, 128):
        make_icon(size, ICONS_DIR / f"icon{size}.png")

    print("\nGenerating store assets:")
    make_promo_tile(440, 280, STORE_DIR / "promo-small.png")
    make_promo_tile(1400, 560, STORE_DIR / "promo-marquee.png")
    make_promo_tile(920, 680, STORE_DIR / "promo-large.png")

    print("\nDone.\n")


if __name__ == "__main__":
    main()
