# Logo

The roof tile from the site header, exported square for the Telegram bot and
flat for everything else. The wordmark is Fraunces Medium at the same tracking
the header uses.

| File | What it is for |
| --- | --- |
| `daon-avatar-navy.png` | 512×512, cream roof on navy. The one to put on the bot. |
| `daon-avatar-navy-gold.png` | The same with a gold ring inside the crop. |
| `daon-avatar-cream.png` | Navy roof on cream, for a light background. |
| `daon-avatar-wordmark.png` | Roof over DAON — reads on a profile page, not in a chat list. |
| `daon-logo.png` | Full logo, navy on transparent, 1049 px wide. |
| `daon-logo-mark.png` | The roof alone, navy on transparent. |
| `preview-circles.png` | The four avatars cropped and shrunk the way a chat list shows them. |

Telegram crops a profile picture to a circle and draws it about 40 px wide in
the chat list, so everything sits inside the inscribed circle and the mark
carries it alone. Check `preview-circles.png` before choosing — at that size the
wordmark version is a grey smudge under the roof.

To set it: message [@BotFather](https://t.me/BotFather), send `/setuserpic`,
pick the bot, then send the PNG **as a photo**, not as a file.

Regenerate:

```bash
python scripts/make-avatar.py
```

The source is `public/images/logo-mark.png`, the same file the site masks in the
header. The script drops the scanner specks around the traced roof — harmless at
header size, plainly visible at 512 px.
