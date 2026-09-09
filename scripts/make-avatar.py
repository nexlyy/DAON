"""Logo exports: a square avatar for the Telegram bot, plus transparent logos.

Telegram crops a profile picture to a circle and shows it at about 40 px wide in
a chat list, so everything has to sit inside the inscribed circle and still read
at thumbnail size. The wordmark is Fraunces Medium with the same 0.15em tracking
the site uses, so the exports and the header say DAON the same way.
"""
import os

from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARK = os.path.join(ROOT, 'public', 'images', 'logo-mark.png')
FONT = os.path.join(ROOT, 'scripts', 'fonts', 'Fraunces-Medium.ttf')
OUT = os.path.join(ROOT, 'brand')
os.makedirs(OUT, exist_ok=True)

SIZE = 512
NAVY = '#2F4256'
CREAM = '#FBF8F3'
GOLD = '#B8974F'
TRACKING = 0.15


def clean_mark():
    """The roof alone. The traced PNG carries eighteen specks of scanner dirt
    around it, invisible at header size and not at 512 px."""
    mark = Image.open(MARK).convert('RGBA')
    alpha = np.array(mark.getchannel('A'))

    labels, count = ndimage.label(alpha > 16)
    if count > 1:
        sizes = ndimage.sum(alpha > 16, labels, range(1, count + 1))
        alpha = np.where(labels == int(np.argmax(sizes)) + 1, alpha, 0).astype(np.uint8)

    mark.putalpha(Image.fromarray(alpha))
    return mark.crop(mark.getchannel('A').getbbox())


ROOF = clean_mark()


def roof(colour, width):
    height = round(ROOF.height * width / ROOF.width)
    shape = ROOF.resize((width, height), Image.LANCZOS)

    solid = Image.new('RGBA', shape.size, colour)
    solid.putalpha(shape.getchannel('A'))
    return solid


def wordmark(colour, size):
    """DAON on its own transparent strip, letter by letter for the tracking."""
    face = ImageFont.truetype(FONT, size)
    gap = round(size * TRACKING)
    letters = [(c, round(face.getlength(c))) for c in 'DAON']
    width = sum(w for _, w in letters) + gap * (len(letters) - 1)

    strip = Image.new('RGBA', (width, round(size * 1.6)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(strip)
    x = 0
    for char, advance in letters:
        draw.text((x, 0), char, font=face, fill=colour)
        x += advance + gap

    return strip.crop(strip.getchannel('A').getbbox())


def avatar(name, ground, ink, ring=None, word=False):
    canvas = Image.new('RGBA', (SIZE, SIZE), ground)

    if ring:
        ImageDraw.Draw(canvas).ellipse([16, 16, SIZE - 17, SIZE - 17], outline=ring, width=5)

    if not word:
        mark = roof(ink, round(SIZE * 0.68))
        canvas.alpha_composite(mark, ((SIZE - mark.width) // 2, (SIZE - mark.height) // 2))
    else:
        mark = roof(ink, round(SIZE * 0.56))
        text = wordmark(ink, round(SIZE * 0.17))
        gap = round(SIZE * 0.07)
        top = (SIZE - (mark.height + gap + text.height)) // 2

        canvas.alpha_composite(mark, ((SIZE - mark.width) // 2, top))
        canvas.alpha_composite(text, ((SIZE - text.width) // 2, top + mark.height + gap))

    path = os.path.join(OUT, name)
    canvas.convert('RGB').save(path)
    return path


def logo(name, height, word=True):
    """Transparent navy logo for slides, print and anything with its own ground."""
    mark = roof(NAVY, round(height * 3.3))
    if not word:
        mark.save(os.path.join(OUT, name))
        return os.path.join(OUT, name)

    text = wordmark(NAVY, round(height * 1.42))
    gap = round(height * 0.55)

    canvas = Image.new('RGBA', (mark.width + gap + text.width, max(mark.height, text.height)),
                       (0, 0, 0, 0))
    canvas.alpha_composite(mark, (0, (canvas.height - mark.height) // 2))
    canvas.alpha_composite(text, (mark.width + gap, (canvas.height - text.height) // 2))

    path = os.path.join(OUT, name)
    canvas.save(path)
    return path


avatars = [
    avatar('daon-avatar-navy.png', NAVY, CREAM),
    avatar('daon-avatar-navy-gold.png', NAVY, CREAM, ring=GOLD),
    avatar('daon-avatar-cream.png', CREAM, NAVY),
    avatar('daon-avatar-wordmark.png', CREAM, NAVY, word=True),
]
logos = [
    logo('daon-logo.png', 120),
    logo('daon-logo-mark.png', 160, word=False),
]

for path in avatars + logos:
    with Image.open(path) as im:
        print(f'  {os.path.basename(path):26s} {im.size[0]}x{im.size[1]}  {os.path.getsize(path):>6} B')

# The four side by side, cropped and shrunk exactly as a chat list would.
preview = Image.new('RGB', (len(avatars) * 116 + 12, 116), 'white')
for index, path in enumerate(avatars):
    with Image.open(path) as im:
        small = im.resize((96, 96), Image.LANCZOS)
    mask = Image.new('L', (96, 96), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, 95, 95], fill=255)
    preview.paste(small, (12 + index * 116, 10), mask)
preview.save(os.path.join(OUT, 'preview-circles.png'))
print('  preview-circles.png')
