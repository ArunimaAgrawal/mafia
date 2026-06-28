from PIL import Image, ImageDraw, ImageFont
import os

CARD_W, CARD_H = 1080, 1920  # 9:16

FONT_TITLE = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf", 64)
FONT_BOTTOM = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf", 56)

ROLES = {
    'villager': 'THE VILLAGER', 'doctor': 'THE DOCTOR', 'detective': 'THE DETECTIVE',
    'vigilante': 'THE VIGILANTE', 'escort': 'THE ESCORT', 'bodyguard': 'THE BODYGUARD',
    'mayor': 'THE MAYOR', 'spy': 'THE SPY', 'watcher': 'THE WATCHER',
    'drunk detective': 'THE DRUNK DETECTIVE', 'paranoid doctor': 'THE PARANOID DOCTOR',
    'trapper': 'THE TRAPPER', 'journalist': 'THE JOURNALIST', 'herbalist': 'THE HERBALIST',
    'twin': 'THE TWIN', 'mafia': 'THE MAFIA', 'godfather': 'THE GODFATHER',
    'framer': 'THE FRAMER', 'consigliere': 'THE CONSIGLIERE', 'blackmailer': 'THE BLACKMAILER',
    'identity thief': 'THE IDENTITY THIEF', 'stalker': 'THE STALKER',
    'jester': 'THE JESTER', 'witch': 'THE WITCH', 'serial killer': 'THE SERIAL KILLER',
    'executioner': 'THE EXECUTIONER', 'surviour': 'THE SURVIVOR',
    'guardian angel': 'THE GUARDIAN ANGEL', 'saboteur': 'THE SABOTEUR',
    'phantom': 'THE PHANTOM', 'arsonist': 'THE ARSONIST', 'plague doctor': 'THE PLAGUE DOCTOR',
    'prophet': 'THE PROPHET', 'gravedigger': 'THE GRAVEDIGGER', 'cursed': 'THE CURSED',
    'amnesiac': 'THE AMNESIAC', 'demon': 'THE DEMON'
}

os.makedirs('images/tarot', exist_ok=True)

PADDING = 60
BORDER = 6
TOP_TEXT_H = 120
BOTTOM_BANNER_H = 100
IMG_TOP = TOP_TEXT_H + PADDING
IMG_BOTTOM = CARD_H - BOTTOM_BANNER_H - PADDING

for filename, title in ROLES.items():
    src = f'images/{filename}.png'
    if not os.path.exists(src):
        print(f'Missing: {src}')
        continue

    # White card background
    card = Image.new('RGB', (CARD_W, CARD_H), (255, 255, 255))
    draw = ImageDraw.Draw(card)

    # Top title text
    bbox = draw.textbbox((0, 0), title, font=FONT_TITLE)
    tw = bbox[2] - bbox[0]
    tx = (CARD_W - tw) // 2
    draw.text((tx, 30), title, font=FONT_TITLE, fill=(0, 0, 0))

    # Image area
    img_area_w = CARD_W - PADDING * 2
    img_area_h = IMG_BOTTOM - IMG_TOP

    # Load and fit image
    img = Image.open(src).convert('RGBA')
    scale = min(img_area_w / img.width, img_area_h / img.height)
    new_w, new_h = int(img.width * scale), int(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Black border around image
    border_x = PADDING + (img_area_w - new_w) // 2
    border_y = IMG_TOP + (img_area_h - new_h) // 2
    draw.rectangle(
        [border_x - BORDER, border_y - BORDER, border_x + new_w + BORDER, border_y + new_h + BORDER],
        fill=(0, 0, 0)
    )

    # Paste image
    bg = Image.new('RGB', (new_w, new_h), (0, 0, 0))
    bg.paste(img, (0, 0), img)
    card.paste(bg, (border_x, border_y))

    # Bottom banner (grey background with role name)
    banner_y = CARD_H - BOTTOM_BANNER_H - 30
    draw.rectangle([PADDING + 40, banner_y, CARD_W - PADDING - 40, banner_y + BOTTOM_BANNER_H], fill=(180, 180, 180))
    bbox2 = draw.textbbox((0, 0), title, font=FONT_BOTTOM)
    bw = bbox2[2] - bbox2[0]
    bh = bbox2[3] - bbox2[1]
    bx = (CARD_W - bw) // 2
    by = banner_y + (BOTTOM_BANNER_H - bh) // 2
    draw.text((bx, by), title, font=FONT_BOTTOM, fill=(0, 0, 0))

    out_path = f'images/tarot/{filename}.png'
    card.save(out_path, quality=95)
    print(f'Created: {out_path}')

print('\nDone!')
