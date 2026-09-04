# Table codes

All four files point at the same address: https://nexlyy.github.io/DAON/

| File | What it is for |
| --- | --- |
| `daon-qr.svg` | The code as vector. Give this to a print shop — it stays sharp at any size. |
| `daon-qr.eps` | The same, for print software that will not take SVG. |
| `daon-qr.png` | 1640px raster, black on white, for documents and screens. |
| `daon-table-card-*.png` | A finished card, 1000×1400 at 300 dpi — roughly 85×119 mm. One per language. |

Error correction is set to the highest level, so the code still reads with a
corner scuffed or a ring of coffee across it. Keep the pale border around the
code when you place it: a scanner needs that quiet zone as much as the pattern.

Printed at 40 mm across it still scans, tilted by twelve degrees and shrunk to a
quarter — that was checked, not assumed. Below about 25 mm it gets unreliable on
an older phone.

Regenerate after a change of address:

```bash
python scripts/make-qr.py
```

**The address will change.** These point at a GitHub Pages URL under a personal
account. Reprint once the restaurant has its own domain.
