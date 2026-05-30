// api/ping.js — Verificação de token de acesso interno
// Valida o APP_TOKEN sem chamar a API Anthropic.
// Usado pelo modal de senha para autenticar sem consumir cota.

module.exports = (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-app-token');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const appToken = process.env.APP_TOKEN;

  // Se APP_TOKEN não configurado → retorna ok (ambiente sem proteção)
  if (!appToken) return res.status(200).json({ ok: true, protected: false });

  const clientToken = req.headers['x-app-token'];
  if (!clientToken || clientToken !== appToken) {
    return res.status(401).json({ error: 'Chave de acesso incorreta.' });
  }

  return res.status(200).json({ ok: true, protected: true });
};
