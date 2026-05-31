// api/debug.js — Rota temporária de diagnóstico (remover após resolver o problema)
// Acesse: POST https://instalight-flow.vercel.app/api/debug

export default function handler(req, res) {
  const hasApiKey  = !!process.env.ANTHROPIC_API_KEY;
  const hasToken   = !!process.env.APP_TOKEN;
  const keyPrefix  = process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'ausente';

  return res.status(200).json({
    ANTHROPIC_API_KEY_presente: hasApiKey,
    ANTHROPIC_API_KEY_prefixo:  keyPrefix,
    APP_TOKEN_presente:          hasToken,
    node_version:                process.version,
  });
}
