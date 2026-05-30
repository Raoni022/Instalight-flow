/**
 * API helpers — GD Docs Instalight Flow
 *
 * Roteamento de ambiente:
 *   IS_PROD = https + não-localhost → chama /api/claude (proxy Vercel)
 *   Caso contrário                  → chama Anthropic diretamente (dev local)
 *
 * A chave de API nunca é enviada ao browser em produção.
 */

import { MODEL, PROXY_URL } from '../constants';

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

const DIRECT_URL = 'https://api.anthropic.com/v1/messages';

export type ApiMessage = {
  role: 'user' | 'assistant';
  content: string | ApiContent[];
};

export type ApiContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

export interface ApiResponse {
  content: Array<{ type: string; text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

/**
 * Chama o modelo Anthropic (via proxy em produção, diretamente em dev).
 *
 * @param apiKey - Necessário apenas em desenvolvimento local.
 * @param system - System prompt.
 * @param messages - Array de mensagens.
 * @param maxTokens - Limite de tokens na resposta (padrão 4000).
 */
export async function callAPI(
  apiKey: string,
  system: string,
  messages: ApiMessage[],
  maxTokens = 4000,
): Promise<ApiResponse> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };

  if (!IS_PROD) {
    if (!apiKey) throw new Error('Informe sua Anthropic API Key no cabeçalho do app.');
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else {
    // Em produção: inclui o token de acesso interno (armazenado no sessionStorage pelo modal de senha)
    const appToken = sessionStorage.getItem('app_token') ?? '';
    if (appToken) headers['x-app-token'] = appToken;
  }

  const url = IS_PROD ? PROXY_URL : DIRECT_URL;
  const body = JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages });

  const r = await fetch(url, { method: 'POST', headers, body });

  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as Record<string, unknown>;
    const msg = (err as { error?: { message?: string } }).error?.message ?? `Erro HTTP ${r.status}`;
    throw new Error(msg);
  }

  return r.json() as Promise<ApiResponse>;
}

/**
 * Lê um File e retorna os dados em Base64 (sem prefixo data:...).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Constrói o objeto de conteúdo da API a partir de um File.
 * Suporta PDF (document) e imagens (image).
 */
export async function fileToApiContent(file: File): Promise<ApiContent> {
  const data = await fileToBase64(file);
  const isPdf = file.type === 'application/pdf';

  if (isPdf) {
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data },
    };
  }

  return {
    type: 'image',
    source: { type: 'base64', media_type: file.type, data },
  };
}

/**
 * Extrai JSON da resposta da IA usando 3 estratégias de fallback.
 * Lida com variações como raw JSON, blocos ```json, ou JSON embedded em texto.
 */
export function parseJsonResponse<T>(text: string): T {
  // Tentativa 1: JSON puro
  try { return JSON.parse(text.trim()) as T; } catch { /* continua */ }

  // Tentativa 2: bloco ```json ... ``` (ou ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()) as T; } catch { /* continua */ }
  }

  // Tentativa 3: primeiro objeto JSON encontrado no texto
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) as T; } catch { /* continua */ }
  }

  throw new Error('IA retornou formato inválido. Verifique a chave e tente novamente.');
}
