"""Table QR codes for DAON.

A code that goes on a table gets scanned in bad light, at an angle, by a phone
held in one hand — so: high error correction, generous quiet zone, real black on
real white, and no logo punched through the middle. Vector for the printer,
PNG for anyone who just wants to drop it into a document.
"""
import os

import segno
from PIL import Image, ImageDraw, ImageFont

URL = 'https://daon.pl/'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'qr')
os.makedirs(OUT, exist_ok=True)

# Error correction H survives a coffee ring over a corner of the sticker.
qr = segno.make(URL, error='h')
print('version', qr.version, 'error', qr.error, 'modules', qr.symbol_size(1)[0])

# For the print shop: scales to any size without a soft edge.
qr.save(os.path.join(OUT, 'daon-qr.svg'), scale=10, border=4, dark='#000000', light='#ffffff')
qr.save(os.path.join(OUT, 'daon-qr.eps'), scale=10, border=4)

# For everything else. 1200px is enough for a 60mm sticker at 500 dpi.
qr.save(os.path.join(OUT, 'daon-qr.png'), scale=40, border=4, dark='#000000', light='#ffffff')
# The card version sits on the paper colour, so the quiet zone stops reading as
# a white sticker stuck onto a cream card. Still nearly white: contrast is what
# a scanner needs, and #FBF8F3 against black has plenty.
qr.save(os.path.join(OUT, 'daon-qr-card.png'), scale=40, border=4, dark='#000000', light='#FBF8F3')

with Image.open(os.path.join(OUT, 'daon-qr.png')) as im:
    print('png', im.size)


def card(path, lines, width=1000, height=1400, qr_px=740):
    """A printable table card: the mark, a line of type, and the code."""
    canvas = Image.new('RGB', (width, height), '#FBF8F3')
    draw = ImageDraw.Draw(canvas)

    def font(size, bold=False):
        for name in (
            'georgiab.ttf' if bold else 'georgia.ttf',
            'seguisb.ttf' if bold else 'segoeui.ttf',
            'arialbd.ttf' if bold else 'arial.ttf',
        ):
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                continue
        return ImageFont.load_default()

    def centre(text, y, f, fill):
        box = draw.textbbox((0, 0), text, font=f)
        draw.text(((width - (box[2] - box[0])) / 2 - box[0], y), text, font=f, fill=fill)
        return box[3] - box[1]

    # A gold hairline frame, the same one the site uses around its cards.
    draw.rectangle([26, 26, width - 26, height - 26], outline='#D9C395', width=3)

    y = 96
    y += centre('DAON', y, font(96, bold=True), '#2F4256') + 34
    y += centre(lines[0], y, font(30), '#96792F') + 70

    with Image.open(os.path.join(OUT, 'daon-qr-card.png')) as code:
        code = code.convert('RGB').resize((qr_px, qr_px), Image.LANCZOS)
        canvas.paste(code, ((width - qr_px) // 2, y))
    y += qr_px + 44

    y += centre(lines[1], y, font(38, bold=True), '#33302B') + 18
    centre(lines[2], y, font(28), '#6B6357')

    canvas.save(path, dpi=(300, 300))
    return path


CARDS = {
    'daon-table-card-en.png': ['Menu · Reservations', 'Scan for the menu', 'Dworcowa 8, Katowice'],
    'daon-table-card-pl.png': ['Menu · Rezerwacje', 'Zeskanuj, aby zobaczyć menu', 'Dworcowa 8, Katowice'],
    'daon-table-card-ko.png': ['메뉴 · 예약', '메뉴 보기', 'Dworcowa 8, Katowice'],
}

for name, lines in CARDS.items():
    print('card:', card(os.path.join(OUT, name), lines))

print('\nfiles:')
for name in sorted(os.listdir(OUT)):
    print(' ', name, os.path.getsize(os.path.join(OUT, name)), 'bytes')
