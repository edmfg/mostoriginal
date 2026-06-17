// GET /api/gemini-check  → one-shot test that GEMINI_KEY works and can generate images.
// Open it in the browser (you're logged into edmfg) to get a plain JSON ok/❌.

const MODEL = 'gemini-3.1-flash-image';

export default async function handler(req, res) {
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return res.status(200).json({ ok: false, reason: 'GEMINI_KEY env var is not set on this project.' });
  }
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'A small solid blue circle centered on a white background.' }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const data = await r.json();
    const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const inline = parts.map((p) => p.inline_data || p.inlineData).find((d) => d && d.data);

    if (r.ok && inline && inline.data) {
      return res.status(200).json({ ok: true, model: MODEL, imageBytesBase64: inline.data.length, message: 'GEMINI_KEY works and can generate images. 🎉' });
    }
    return res.status(200).json({ ok: false, httpStatus: r.status, model: MODEL, detail: data });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
