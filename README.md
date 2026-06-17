# MOST ORIGINAL — concept site

`#MostOriginal` · **adidas Originals × Googlebook · Magic Pointer**

Internal pitch/concept tool. Single scrolling page — vanilla HTML + Tailwind CDN + a small `app.js` (Magic Pointer cursor sim + marquee). No build step.

> **⚑ INTERNAL USE ONLY.** Not for public distribution. The brand assets (adidas footage + imagery) are used for illustrative pitch purposes only — do not distribute publicly with them embedded.

## Run locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Or open `index.html` directly (Tailwind/fonts load from CDN, so you need a network connection).

## Files

| File | Role |
|---|---|
| `index.html` | All sections A–H, copy baked in |
| `styles.css` | Design system (color tokens, Anton/Archivo, three-stripes, brutalist grid, hero, cursor, marquee) |
| `app.js` | Magic Pointer cursor sim + marquee builder |
| `assets/` | `hero-loop.mp4` / `.webm` / `hero-poster.jpg` + swap-in still imagery |

## Assets — swap placeholders for real adidas masters

Still imagery currently uses on-brand `placehold.co` placeholders labeled per slot. Drop real files into `assets/` and point the `<img src>` at them:

| Slot | Size | Where |
|---|---|---|
| `LOOK_01–03` | 1200×1600 | §C Magic Pointer sim |
| `MASTHEAD_MOCK` | 1600×900 | §B The Idea |
| `STUDIO_MOCK` | 1600×1000 | §E The Studio |
| `REWARD_MOCK` | 1600×900 | §F Crowned |

## Hero video (Beckett-style masthead)

Built from the adidas Originals *Gazelle / Samba / Spezial* spot, clipped locally with `yt-dlp` + `ffmpeg` (see `scripts/build-hero.sh`). The hero `<video>` is `muted` + `playsinline` + `poster`'d so it autoplays smoothly on iOS and never black-flashes. Pull the master from adidas account access where available; the YouTube copy is a fan re-upload — internal use only.

## Deploy

GitHub → Vercel (static; no config needed). Repo: `edmfg/mostoriginal`.
