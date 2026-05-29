// ── Constantes técnicas do sistema fotovoltaico ───────────────────────────
// ATENÇÃO: Validar anualmente com normas ABNT/ANEEL vigentes.

/** Resistividade elétrica do cobre a 20°C (Ω·mm²/m) */
export const RHO = 0.01724;

/**
 * Tensão de circuito aberto típica por painel (V).
 * Valor conservador médio usado quando o datasheet não está disponível.
 * Prefira usar o Voc real do datasheet.
 */
export const VOC_PP = 41;

/**
 * Irradiação solar média diária — Porto Alegre / RS (kWh/m²/dia).
 * Fonte: Atlas Solarimétrico do Brasil / CRESESB.
 * Ajustar conforme coordenadas da instalação para outros municípios.
 */
export const IRRAD = 4.8;

/**
 * Performance Ratio — eficiência sistêmica típica (adimensional).
 * Inclui perdas por temperatura, cabeamento, inversão e sujeira.
 */
export const PR = 0.75;

/**
 * Tarifa média de energia elétrica — CEEE Equatorial / RS (R$/kWh).
 * Atualizar conforme homologação ANEEL vigente.
 */
export const TARIFA = 0.85;

/**
 * Fator de emissão de CO₂ do SIN (kgCO₂eq/kWh).
 * Valor conservador ajustado. Fator oficial ANEEL 2023 ≈ 0,0783 kgCO₂eq/kWh.
 * Validar anualmente com publicação oficial (Inventário GHG ANEEL).
 */
export const CO2_FACTOR = 0.09;

// ── API / App ─────────────────────────────────────────────────────────────

export const MODEL = 'claude-sonnet-4-6';
export const LS_KEY = 'instalight_api_key';

/** Rota do proxy Vercel Serverless (api/claude.js) */
export const PROXY_URL = '/api/claude';
