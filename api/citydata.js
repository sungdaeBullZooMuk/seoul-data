// Vercel Serverless Function: /api/citydata
// This endpoint proxies requests to the Seoul OpenData citydata API using
// a server-side API key stored in the Vercel environment variable `SEOUL_API_KEY`.

export default async function handler(req, res) {
  const place = req.query.place || '';
  if (!place) {
    return res.status(400).json({ error: 'Missing required `place` query parameter.' });
  }

  const API_KEY = process.env.SEOUL_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server missing SEOUL_API_KEY environment variable.' });
  }

  const apiBase = 'http://openapi.seoul.go.kr:8088';
  const endpoint = `${apiBase}/${encodeURIComponent(API_KEY)}/json/citydata/1/5/${encodeURIComponent(place)}?_=${Date.now()}`;

  try {
    const r = await fetch(endpoint);
    const text = await r.text();
    // Allow browser access from deployed frontends
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: String(err) });
  }
}
