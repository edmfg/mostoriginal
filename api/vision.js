// POST /api/vision  → real "See your vision" render via Gemini image generation.
// Body: { items: ["Firebird Track Top", ...], restyle: "Make it more streetwear" }
// Returns: { image: "data:image/png;base64,..." }  (or an error the client falls back from)

const MODEL = 'gemini-3.1-flash-image'; // Nano Banana 2 — speed-optimized
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: 'no_key', message: 'GEMINI_KEY is not set on this project.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const items = Array.isArray(body.items) ? body.items.filter(Boolean) : [];
    const restyle = (body.restyle || '').toString().slice(0, 120);

    const list = items.length ? items.join(', ') : 'a head-to-toe adidas Originals look';
    const prompt =
      `Full-body editorial fashion photograph of one model wearing a head-to-toe adidas Originals ` +
      `outfit composed of: ${list}. ${restyle ? restyle + '. ' : ''}` +
      `Young, premium, hip-hop street-style energy; confident pose; clean minimal background; ` +
      `hard directional light; shot on 35mm; vertical 4:5 full-length framing; photorealistic, high detail.`;

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'gemini_error', status: r.status, detail: data });

    const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const inline = parts.map((p) => p.inline_data || p.inlineData).find((d) => d && d.data);
    if (!inline) return res.status(502).json({ error: 'no_image', detail: data });

    const mime = inline.mime_type || inline.mimeType || 'image/png';
    return res.status(200).json({ image: `data:${mime};base64,${inline.data}` });
  } catch (e) {
    return res.status(500).json({ error: 'exception', message: String(e) });
  }
}
