// api/claude.js — Vercel Serverless Function
// Proxy seguro para a API Anthropic.
// A chave de API fica no servidor (variável de ambiente) e nunca é exposta ao browser.
//
// Variáveis de ambiente requeridas (configurar no painel Vercel):
//   ANTHROPIC_API_KEY=sk-ant-...    ← chave da API Anthropic
//   APP_TOKEN=<32 chars>            ← senha de acesso interno (opcional; se ausente, proxy aberto)
//
// Vercel auto-detecta este arquivo na pasta api/ e o expõe como POST /api/claude.
// Node.js 18+ (fetch nativo disponível — sem dependências externas).

// ── Rate limiting simples (memória por instância serverless) ─────────────
// Janela de 5 minutos, máximo 30 requisições por IP.
// O Map é resetado a cada cold start — comportamento adequado para uso interno.
const rateLimitMap = new Map(); // ip → { count, windowStart }
const RATE_LIMIT   = 30;
const WINDOW_MS    = 5 * 60 * 1000; // 5 minutos

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

module.exports = async (req, res) => {
  // CORS — permite chamadas do frontend hospedado no mesmo domínio Vercel
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-app-token');
  res.setHeader('Vary', 'Origin');

  // Pre-flight CORS
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── Rate limiting ─────────────────────────────────────────────
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.',
    });
  }

  // ── Autenticação por token interno ────────────────────────────
  // APP_TOKEN configurado → exige token válido em todas as requisições.
  // Se não configurado → proxy funciona sem autenticação (compatibilidade com dev local).
  const appToken = process.env.APP_TOKEN;
  if (appToken) {
    const clientToken = req.headers['x-app-token'];
    if (!clientToken || clientToken !== appToken) {
      return res.status(401).json({
        error: 'Acesso não autorizado. Chave de acesso inválida ou ausente.',
      });
    }
  }

  // ── Validação de API key Anthropic ───────────────────────────
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
