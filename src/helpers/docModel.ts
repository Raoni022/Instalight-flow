/**
 * docModel.ts — Representação intermediária de documentos (fonte única PDF + DOCX)
 *
 * Um documento é descrito como uma lista de Blocks. Dois renderizadores consomem
 * a mesma lista: pdfKit (renderSpecToPdf) e docxRender (renderSpecToDocx), de modo
 * que PDF e Word nunca divergem.
 *
 * parseRichText() converte os templates de texto (memorial.ts, gerarTexto* de
 * export.ts) em Block[], classificando cada linha (seção, tabela, bullet, etc.).
 */

import type { FormData, Calculos, DocsGerados } from '../types';

// ── Blocos ──────────────────────────────────────────────────────────────────
export type Block =
  | { t: 'section'; text: string }                 // "6. DIMENSIONAMENTO DO GERADOR"
  | { t: 'subsection'; text: string }              // "6.1 ..." ou "Cláusula 1ª"
  | { t: 'caps'; text: string }                    // cabeçalho ALL-CAPS standalone
  | { t: 'para'; text: string }
  | { t: 'bullet'; text: string }
  | { t: 'check'; text: string }                   // checkbox de comissionamento
  | { t: 'status'; text: string; ok: boolean }     // ✔ / ⚠
  | { t: 'formula'; text: string }
  | { t: 'mono'; text: string }                    // box-drawing (placa)
  | { t: 'table'; rows: string[][] }
  | { t: 'tableTitle'; text: string }
  | { t: 'kv'; label: string; value: string }
  | { t: 'checkitem'; id: string; name: string; done: boolean; como: string }
  | { t: 'noteBox'; title?: string; lines: string[] }
  | { t: 'sigrule' }
  | { t: 'divider' }
  | { t: 'gap' };

// ── Capa ────────────────────────────────────────────────────────────────────
export interface CoverInfoBox { title: string; rows: [string, string][]; }
export interface CoverSpec {
  brandTitle?: string;
  brandSubtitle?: string;
  docTitle: string;
  docSubtitle?: string;
  highlight?: { bannerTitle: string; bigLine: string; midLine?: string; smallLine?: string };
  infoBoxes?: CoverInfoBox[];
  footerNote?: string;
}

// ── Especificação de documento ───────────────────────────────────────────────
export interface DocChrome { title: string; subtitle?: string; company?: string; }
export interface DocSpec {
  cover?: CoverSpec;                       // capa cheia (memorial)
  title?: { title: string; subtitle?: string }; // título compacto (docs legais/formulário)
  chrome: DocChrome;
  blocks: Block[];
  filenameKey: string;                     // p/ makeFilename
}

// ── Parser de texto → blocos ─────────────────────────────────────────────────
const isCapsHeader = (t: string): boolean =>
  t === t.toUpperCase() && t.length > 4 && t.length < 60 &&
  /[A-ZÁÉÍÓÚ]/.test(t) && !t.includes(':') && !/[•|_]/.test(t) &&
  !/\d/.test(t) && !/\s{3,}/.test(t) && t.split(/\s+/).length <= 6;

export function parseRichText(text: string): Block[] {
  const out: Block[] = [];
  let tbl: string[][] = [];
  const flush = (): void => { if (tbl.length) { out.push({ t: 'table', rows: tbl }); tbl = []; } };

  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const t = line.trim();

    // Tabela markdown
    if (/^\|/.test(t)) {
      const parts = t.split('|').slice(1, -1);
      const isSep = parts.every((p) => /^[-: ]+$/.test(p));
      if (!isSep && parts.some((p) => p.trim().length > 0)) tbl.push(parts.map((p) => p.trim()));
      continue;
    }
    if (tbl.length) flush();

    // Título de tabela
    if (/^Tabela\s+\d+/i.test(t)) { out.push({ t: 'tableTitle', text: t }); continue; }

    // Divisores
    if (/^-{10,}$/.test(t) || /^={10,}$/.test(t) || /^═{10,}$/.test(t)) { out.push({ t: 'divider' }); continue; }

    // Régua de assinatura
    if (/^_{5,}/.test(t)) { out.push({ t: 'sigrule' }); continue; }

    // Seção principal "N. TÍTULO"
    if (/^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(t) && !t.includes('INSERIR')) { out.push({ t: 'section', text: t }); continue; }

    // Subseção "N.N" / "N.N.N" / "Cláusula"
    if (/^\d+\.\d+(\.\d+)?\.?\s+\S/.test(t) || /^Cláusula\s/i.test(t)) { out.push({ t: 'subsection', text: t }); continue; }

    // Checkbox
    if (/^□\s/.test(t)) { out.push({ t: 'check', text: t.replace(/^□\s*/, '') }); continue; }

    // Bullet
    if (/^[•●]\s/.test(t)) { out.push({ t: 'bullet', text: t.replace(/^[•●]\s*/, '') }); continue; }

    // Status
    if (/^[✔✓]/.test(t)) { out.push({ t: 'status', text: t.replace(/^[✔✓]\s*/, ''), ok: true }); continue; }
    if (/^⚠/.test(t)) { out.push({ t: 'status', text: t.replace(/^⚠\s*/, ''), ok: false }); continue; }

    // Box-drawing (placa)
    if (/^[┌└├┤┬┴┼│─╔╗╚╝╠╣╦╩╬═]/.test(t)) { out.push({ t: 'mono', text: t }); continue; }

    // Cabeçalho ALL-CAPS
    if (isCapsHeader(t)) { out.push({ t: 'caps', text: t }); continue; }

    // Fórmula (indentada com = ou ×)
    if (/^\s{2,}/.test(line) && t.length > 0 && (t.includes(' = ') || t.includes('×'))) { out.push({ t: 'formula', text: t }); continue; }

    // Vazio
    if (t === '') { out.push({ t: 'gap' }); continue; }

    out.push({ t: 'para', text: t });
  }
  flush();
  return cleanupBlocks(out);
}

/**
 * Pós-processo do parser:
 *  - remove divisores (`----`) adjacentes a títulos de seção/caps — eles já têm
 *    estilo próprio, e a régua dupla deixava o layout "grudado";
 *  - colapsa gaps consecutivos e remove gap logo após um título.
 */
function cleanupBlocks(blocks: Block[]): Block[] {
  const isHeading = (b?: Block) => !!b && (b.t === 'section' || b.t === 'caps');
  const r: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === 'divider') {
      const prev = [...r].reverse().find((x) => x.t !== 'gap');
      let j = i + 1;
      while (j < blocks.length && blocks[j].t === 'gap') j++;
      if (isHeading(prev) || isHeading(blocks[j])) continue; // régua redundante
    }
    if (b.t === 'gap') {
      const last = r[r.length - 1];
      if (!last || last.t === 'gap' || isHeading(last)) continue; // evita gap duplo / após título
    }
    r.push(b);
  }
  return r;
}

// ── Blocos imperativos: Formulário CEEE ──────────────────────────────────────
export function buildFormularioBlocks(fd: FormData, calc: Calculos): Block[] {
  const b: Block[] = [];
  b.push({ t: 'section', text: 'DADOS DO TITULAR' });
  const kv = (label: string, value: string | undefined) => b.push({ t: 'kv', label, value: value || '—' });
  kv('Nome/Razão Social', fd.nomeCliente);
  kv('CPF/CNPJ', fd.cpfCnpj);
  kv('Endereço da UC', fd.endereco);
  kv('Código UC', fd.codigoUC);
  kv('Nº Conta-Contrato', fd.numContaContrato);
  kv('Nº Fatura', fd.numeroFatura);
  if (fd.numeroMedidor) kv('Nº do Medidor', fd.numeroMedidor);
  if (fd.classeUC) kv('Classe da UC', fd.classeUC);

  b.push({ t: 'section', text: 'DADOS DO SISTEMA' });
  kv('Tipo de Instalação', fd.tipoInstalacao || 'Nova');
  kv('Caracterização (Lei 14.300/2022)', fd.tipoCaracterizacao);
  kv('Tipo de Geração / Enquadramento', calc.enqTotal);
  if (fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0) {
    kv('Potência CC — nova instalação', `${calc.kWp} kWp`);
    kv('Potência CC — existente', `${calc.kWpExistente} kWp`);
    kv('Potência CC — TOTAL', `${calc.kWpTotal} kWp`);
    kv('Potência CA — nova instalação', `${calc.kWtCA} kW`);
    kv('Potência CA — existente', `${calc.kWtCAExistente} kW`);
    kv('Potência CA — TOTAL', `${calc.kWtCATotal} kW`);
  } else {
    kv('Potência CC instalada', `${calc.kWp} kWp`);
    kv('Potência CA nominal', `${calc.kWtCA} kW`);
  }
  kv('Tipo de Ligação', fd.tipoLigacao);
  if (fd.latitude || fd.longitude) kv('Coordenadas GPS', `Lat ${fd.latitude || '—'} / Long ${fd.longitude || '—'}`);
  if (fd.transformador) kv('Transformador', fd.transformador);
  if (fd.disjuntorEntrada) kv('DJ Geral Entrada', `${fd.disjuntorEntrada} A`);
  if (fd.ramalEntrada) kv('Ramal de Entrada', fd.ramalEntrada);
  kv('Módulos FV', `${fd.numeroPaineis || '—'}× ${fd.modeloPainel || '—'} ${fd.potenciaUnitariaWp || '—'}Wp`);
  kv('Inversor', fd.modeloInversor || '—');
  kv('Responsável Técnico', fd.nomeResponsavel);
  kv('CRT/CREA', fd.numeroCRT);

  b.push({
    t: 'noteBox',
    title: 'ATENÇÃO — DOCUMENTO INTERNO DE APOIO',
    lines: [
      'Este pré-formulário é gerado pelo Instalight Flow para conferência interna dos dados.',
      'O protocolo oficial deve ser feito pelo PORTAL ELETRÔNICO da CEEE Equatorial (SolicitaNet).',
    ],
  });
  return b;
}

// ── Blocos imperativos: Relatório de Pendências ──────────────────────────────
export function buildPendenciasBlocks(fd: FormData, _calc: Calculos, docs: DocsGerados): Block[] {
  const b: Block[] = [];
  const item = (id: string, name: string, done: boolean, como: string) =>
    b.push({ t: 'checkitem', id, name, done, como });

  b.push({ t: 'section', text: 'GRUPO A — DOCUMENTOS DO CLIENTE' });
  item('A1', 'Procuração Específica', docs.procuracao,
    'Gere na aba "Documentos" e peça ao cliente assinar com firma reconhecida');
  item('A2', 'Formulário de Acesso CEEE', docs.formularioCEEE,
    'Gere na aba "Documentos" e leve ao protocolo CEEE');
  item('A3', 'Documentos pessoais (RG+CPF / CNPJ+Contrato Social)', false,
    fd.tipoPessoa === 'fisica' ? 'Solicitar cópia do RG e CPF do titular'
      : 'Solicitar CNPJ, Contrato Social e documento do representante');
  item('A4', 'Fatura de energia recente', false, 'Solicitar fatura dos últimos 3 meses');

  b.push({ t: 'section', text: 'GRUPO B — DOCUMENTOS TÉCNICOS (obrigatórios CEEE Anexo III REV 06)' });
  item('B1', 'Diagrama Unifilar', true, 'Disponível na aba "Diagramas" — exportar SVG ou PDF');
  item('B2', 'Diagrama de Blocos (Bi/Trifilar)', true, 'Incluído na mesma prancha da aba "Diagramas"');
  item('B3', 'Planta de Situação / Locação', false,
    fd.endereco ? `Abrir maps.google.com/?q=${encodeURIComponent(fd.endereco)} — capturar print com escala e norte`
      : 'Preencha o endereço da UC para gerar o link do Google Maps');
  item('B4', 'Memorial Técnico-Descritivo', docs.memorial, 'Gere na aba "Memorial" e valide com o RT');
  item('B5', 'TRT/ART — Responsabilidade Técnica (projeto e execução)', false,
    'RT deve registrar a ART/TRT no sistema do CREA/CFT competente');
  item('B6', 'Datasheets dos equipamentos (módulos e inversor)', false,
    `Módulo: ${fd.modeloPainel || '—'} | Inversor: ${fd.modeloInversor || '—'} — baixar do site do fabricante`);
  item('B7', 'Relatório de ensaio dos conversores de potência (em PT)', false,
    `Relatório em PT atestando conformidade do inversor ${fd.modeloInversor || '—'} para ${fd.tensaoSaidaCA || '220'} V. Obter com fabricante/importador.`);
  item('B8', 'Dados de registro (formulário CEEE)', docs.formularioCEEE,
    'Gere na aba "Documentos" — formulário de solicitação de orçamento de conexão (REH 3.171/2023)');

  // Grupo D — condicionais
  const exigeRateio = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC'].includes(fd.tipoCaracterizacao);
  b.push({ t: 'section', text: 'GRUPO D — DOCUMENTOS CONDICIONAIS (verificar aplicabilidade)' });
  item('D1', 'Lista de rateio dos créditos de energia', docs.listaRateio,
    'Gere na aba "Documentos" → D1. Aplicável para Geração Compartilhada, EMUC ou Autoconsumo Remoto.');
  item('D2', 'Instrumento jurídico de solidariedade', docs.instrumentoJuridico,
    'Gere na aba "Documentos" → D2. Firmas reconhecidas em cartório. Verificar se instrumento particular é aceito.');
  item('D3', 'Reconhecimento pela ANEEL (cogeração)', false,
    'Aplicável somente para cogeração qualificada. Apresentar documento emitido pela ANEEL.');
  void exigeRateio;

  // Grupo C — somente ampliação
  if (fd.tipoInstalacao === 'Ampliação') {
    b.push({ t: 'section', text: 'GRUPO C — DOCUMENTOS ESPECÍFICOS DE AMPLIAÇÃO' });
    item('C1', 'Projeto anterior aprovado / homologado', false,
      fd.parecerAcessoAnterior ? `Protocolo/Parecer informado: ${fd.parecerAcessoAnterior}`
        : 'Localizar o projeto aprovado na homologação anterior junto à CEEE');
    item('C2', 'Parecer de acesso anterior (CEEE)', !!fd.parecerAcessoAnterior,
      fd.parecerAcessoAnterior ? `Nº ${fd.parecerAcessoAnterior} — verificar validade e escopo`
        : 'Solicitar cópia do parecer de acesso original à CEEE');
    item('C3', 'ART/TRT da instalação anterior', !!fd.artTrtAnterior,
      fd.artTrtAnterior ? `ART/TRT informada: ${fd.artTrtAnterior}` : 'Solicitar ao RT anterior a ART/TRT original');
    item('C4', 'Fotos do padrão de entrada atual', false,
      'Fotografar caixa de medição, disjuntor geral, ramal e número do poste');
    item('C5', 'Fatura atual da UC', false, 'Confirmar medidor bidirecional instalado pela CEEE');
    item('C6', 'Datasheet dos equipamentos existentes', false,
      `Módulos: ${fd.modeloPainelExistente || '—'} | Inversor: ${fd.modeloInversorExistente || '—'}`);
    item('C7', 'Datasheet dos equipamentos novos', false,
      `Módulos: ${fd.modeloPainel || '—'} | Inversor: ${fd.modeloInversor || '—'}`);
    item('C8', 'ART/TRT específica da ampliação', !!fd.numART,
      fd.numART ? `ART/TRT informada: ${fd.numART}` : 'RT deve registrar nova ART/TRT para a ampliação');
    item('C9', 'Confirmação do padrão de entrada', fd.situacaoPadrao !== 'A definir pelo RT',
      `Situação declarada: ${fd.situacaoPadrao} — confirmar compatibilidade com a nova potência total`);
  }

  b.push({ t: 'gap' });
  b.push({ t: 'para', text: 'Dúvidas? Entre em contato com a Instalight.' });
  return b;
}
