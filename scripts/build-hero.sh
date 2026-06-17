#!/usr/bin/env bash
# Build the hero masthead loop from the adidas Originals spot. Internal use only.
# Requires: yt-dlp + ffmpeg on PATH.
set -euo pipefail

SRC_URL="https://www.youtube.com/watch?v=UDEZ6Tv2LJs"   # fan re-upload; prefer adidas master
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p assets

# 1. grab source (video only — we strip audio)
yt-dlp -f "bestvideo[height<=1080]" -o source.mp4 "$SRC_URL"

# 2. clip 8s from :10 → web-optimized MP4 (muted, faststart, broad-compat)
ffmpeg -y -ss 00:00:10 -t 8 -i source.mp4 \
  -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow \
  -pix_fmt yuv420p -movflags +faststart assets/hero-loop.mp4

# 3. smaller WebM fallback
ffmpeg -y -ss 00:00:10 -t 8 -i source.mp4 \
  -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -crf 34 -b:v 0 assets/hero-loop.webm

# 4. poster frame (no black flash on load)
ffmpeg -y -ss 00:00:10 -i source.mp4 -frames:v 1 -q:v 3 assets/hero-poster.jpg

echo "Done → assets/hero-loop.mp4, .webm, hero-poster.jpg"
ls -lh assets/hero-loop.* assets/hero-poster.jpg
