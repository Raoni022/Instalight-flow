// api/claude.js — Vercel Serverless Function
// Proxy seguro para a API Anthropic.
// A chave de API fica no servidor (variável de ambiente) e nunca é exposta ao browser.
//
// Variável de ambiente requerida (configurar no painel Vercel):
//   ANTHROPIC_API_KEY=sk-ant-...
//
// Vercel auto-detecta este arquivo na pasta api/ e o expõe como POST /api/claude.
// Node.js 18+ (fetch nativo disponível — sem dependências externas).

module.exports = async (req, res) => {
  // CORS — permite chamadas do frontend hospedado no mesmo domínio Vercel
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Vary', 'Origin');

  // Pre-flight CORS
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada. '
        + 'Defina a variável de ambiente no painel do Vercel (Settings → Environment Variables).',
    });
  }

  // req.body já vem parseado pelo Vercel (bodyParser ativado por padrão para application/json)
  if (!req.body || !req.body.model) {
    return res.status(400).json({ error: 'Body inválido. Envie um objeto com "model" e "messages".' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: `Erro no proxy Anthropic: ${err.message}` });
  }
};
