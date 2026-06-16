/**
 * pdfKit.ts — Toolkit de PDF profissional compartilhado
 *
 * Fonte única de primitivos visuais para TODOS os documentos exportados.
 * Substitui o despejo de texto monoespaçado (addTextBlock) por blocos
 * estruturados: capa, barras de seção, parágrafos, listas, tabelas reais
 * (células multilinha + colunas auto-ajustadas), blocos de assinatura.
 *
 * Arquitetura:
 *   PdfFlow      — gerencia cursor Y + quebra automática de página (header/footer)
 *   coverPage()  — capa profissional parametrizável
 *   table()      — tabela com células multilinha e largura de coluna auto-ajustada
 *   <primitivos> — sectionBar, paragraph, bullet, checkbox, kvLine, infoBox, etc.
 */

import jsPDF from 'jspdf';

// ── Paleta (fonte única) ──────────────────────────────────────────────────────
export type RGB = [number, number, number];

export const C = {
  green:      [120, 184,  58] as RGB,  // verde marca
  greenDark:  [ 70, 140,  20] as RGB,  // verde escuro (subseções)
  greenBg:    [240, 248, 230] as RGB,  // verde claro (fundo)
  slate:      [ 71,  85, 105] as RGB,  // slate (rótulos)
  black:      [ 30,  30,  30] as RGB,  // preto suave (corpo)
  white:      [255, 255, 255] as RGB,
  grayBg:     [248, 250, 252] as RGB,  // cinza claro (linha par)
  grayBg2:    [240, 243, 246] as RGB,  // cinza médio (info-box)
  grayBorder: [200, 210, 215] as RGB,  // cinza borda
  amber:      [180, 120,   0] as RGB,  // âmbar (aviso)
  ok:         [ 20, 120,  20] as RGB,  // verde ok
  red:        [200,  30,  30] as RGB,  // vermelho (warning RT)
};

export const setFill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
export const setDraw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
export const setText = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

// ── Margens padrão ────────────────────────────────────────────────────────────
export interface Margins { l: number; r: number; t: number; b: number; }
const DEFAULT_MARGINS: Margins = { l: 18, r: 18, t: 26, b: 22 };

// ── Gerenciador de fluxo (cursor + quebra de página) ──────────────────────────
export interface FlowChrome {
  /** Desenha o cabeçalho da página e retorna o Y inicial do conteúdo. */
  header?: (doc: jsPDF, pageNum: number) => number;
  /** Desenha o rodapé da página. */
  footer?: (doc: jsPDF, pageNum: number) => void;
}

export class PdfFlow {
  doc: jsPDF;
  y: number;
  pageNum: number;
  readonly W: number;
  readonly H: number;
  readonly m: Margins;
  private chrome: FlowChrome;

  constructor(doc: jsPDF, chrome: FlowChrome = {}, margins: Partial<Margins> = {}) {
    this.doc = doc;
    this.m = { ...DEFAULT_MARGINS, ...margins };
    this.W = doc.internal.pageSize.getWidth();
    this.H = doc.internal.pageSize.getHeight();
    this.chrome = chrome;
    this.pageNum = 1;
    this.y = chrome.header ? chrome.header(doc, 1) : this.m.t;
  }

  /** Largura útil do conteúdo. */
  get cw(): number { return this.W - this.m.l - this.m.r; }

  /** Limite inferior do conteúdo (acima do rodapé). */
  get bottom(): number { return this.H - this.m.b - 4; }

  /** Avança o cursor. */
  gap(n: number): void { this.y += n; }

  /** Garante espaço; quebra a página se necessário. */
  ensure(need: number): void {
    if (this.y + need > this.bottom) this.newPage();
  }

  /** Quebra para nova página (aplica rodapé atual + cabeçalho novo). */
  newPage(): void {
    if (this.chrome.footer) this.chrome.footer(this.doc, this.pageNum);
    this.doc.addPage();
    this.pageNum += 1;
    this.y = this.chrome.header ? this.chrome.header(this.doc, this.pageNum) : this.m.t;
  }

  /** Finaliza: aplica o rodapé na última página. */
  finish(): void {
    if (this.chrome.footer) this.chrome.footer(this.doc, this.pageNum);
  }
}

// ── Chrome de página (cabeçalho/rodapé verde padrão) ──────────────────────────
export interface ChromeOpts {
  title: string;            // título no cabeçalho da página
  subtitle?: string;        // subtítulo centralizado
  company?: string;         // empresa no rodapé
}

export function greenChrome(opts: ChromeOpts, margins: Partial<Margins> = {}): FlowChrome {
  const m = { ...DEFAULT_MARGINS, ...margins };
  return {
    header: (doc, pageNum) => {
      const W = doc.internal.pageSize.getWidth();
      setFill(doc, C.green); doc.rect(0, 0, W, 16, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      setText(doc, C.white);
      doc.text(opts.title, m.l, 6);
      doc.text(`Pág. ${pageNum}`, W - m.r, 6, { align: 'right' });
      if (opts.subtitle) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(opts.subtitle, W / 2, 12, { align: 'center' });
      }
      setText(doc, C.black);
      return m.t;
    },
    footer: (doc, pageNum) => {
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const y = H - m.b + 4;
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.3);
      doc.line(m.l, y, W - m.r, y);
      doc.setLineWidth(0.1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      setText(doc, C.slate);
      doc.text(opts.company || 'Instalight Energia Solar', m.l, y + 5);
      doc.text(`Página ${pageNum}`, W - m.r, y + 5, { align: 'right' });
      setText(doc, C.black);
    },
  };
}

/** Banner vermelho de aviso de assinatura RT (última página). */
export function rtWarningBanner(doc: jsPDF, flow: PdfFlow): void {
  const W = flow.W, H = flow.H;
  const warY = H - flow.m.b - 6;
  setFill(doc, C.red);
  doc.rect(flow.m.l, warY, flow.cw, 7, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  setText(doc, C.white);
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA',
    W / 2, warY + 4.5, { align: 'center' },
  );
  setText(doc, C.black);
}

// ── Capa profissional ─────────────────────────────────────────────────────────
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

const COVER_ROW_H = 6.5;

function coverInfoBox(doc: jsPDF, box: CoverInfoBox, BX: number, BW: number, W: number, y: number): number {
  setFill(doc, C.green);
  doc.rect(BX, y, BW, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  setText(doc, C.white);
  doc.text(box.title, W / 2, y + 5, { align: 'center' });
  setText(doc, C.black);
  y += 7.5;

  const bodyH = box.rows.length * COVER_ROW_H;
  setDraw(doc, C.grayBorder); setFill(doc, C.grayBg);
  doc.rect(BX, y, BW, bodyH, 'FD');
  box.rows.forEach((row, i) => {
    if (i % 2 === 0) { setFill(doc, C.grayBg2); doc.rect(BX, y + i * COVER_ROW_H, BW, COVER_ROW_H, 'F'); }
    if (i > 0) {
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.1);
      doc.line(BX, y + i * COVER_ROW_H, BX + BW, y + i * COVER_ROW_H);
      doc.setLineWidth(0.2);
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    setText(doc, C.slate); doc.text(row[0] + ':', BX + 3, y + i * COVER_ROW_H + 4.5);
    doc.setFont('helvetica', 'normal');
    setText(doc, C.black);
    doc.text(doc.splitTextToSize(row[1], BW - 45)[0] ?? '', BX + 42, y + i * COVER_ROW_H + 4.5);
  });
  return y + bodyH;
}

/** Desenha a capa (página 1). Não adiciona página — usa a atual. */
export function coverPage(doc: jsPDF, spec: CoverSpec): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Faixa de marca (topo)
  setFill(doc, C.green); doc.rect(0, 0, W, 16, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  setText(doc, C.white);
  doc.text(spec.brandTitle || 'INSTALIGHT ENERGIA SOLAR', W / 2, 7, { align: 'center' });
  if (spec.brandSubtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(spec.brandSubtitle, W / 2, 12.5, { align: 'center' });
  }
  setText(doc, C.black);

  // Faixa de aviso (base)
  setFill(doc, C.green); doc.rect(0, H - 12, W, 12, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  setText(doc, C.white);
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RT HABILITADO OBRIGATÓRIA',
    W / 2, H - 4.5, { align: 'center' },
  );
  setText(doc, C.black);

  // Bordas laterais verdes
  setFill(doc, C.green);
  doc.rect(0, 16, 5, H - 28, 'F');
  doc.rect(W - 5, 16, 5, H - 28, 'F');

  const BX = 12, BW = W - 24;
  let y = 32;

  // Título
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  setText(doc, C.greenDark);
  doc.text(doc.splitTextToSize(spec.docTitle, BW), W / 2, y, { align: 'center' });
  y += 7;
  if (spec.docSubtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    setText(doc, C.slate);
    doc.text(spec.docSubtitle, W / 2, y, { align: 'center' });
    setText(doc, C.black);
    y += 6;
  }

  // Box de destaque
  if (spec.highlight) {
    y += 6;
    setFill(doc, C.green);
    doc.rect(BX, y, BW, 7.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    setText(doc, C.white);
    doc.text(spec.highlight.bannerTitle, W / 2, y + 5, { align: 'center' });
    setText(doc, C.black);
    y += 7.5;

    const boxH = 30;
    setFill(doc, C.greenBg); setDraw(doc, C.green);
    doc.rect(BX, y, BW, boxH, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    setText(doc, C.greenDark);
    doc.text(spec.highlight.bigLine, W / 2, y + 10, { align: 'center' });
    if (spec.highlight.midLine) {
      doc.setFontSize(10); setText(doc, C.black);
      doc.text(spec.highlight.midLine, W / 2, y + 19, { align: 'center' });
    }
    if (spec.highlight.smallLine) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      setText(doc, C.slate);
      doc.text(spec.highlight.smallLine, W / 2, y + 27, { align: 'center' });
      setText(doc, C.black);
    }
    y += boxH;
  }

  // Info-boxes
  for (const box of spec.infoBoxes || []) {
    y += 8;
    y = coverInfoBox(doc, box, BX, BW, W, y);
  }

  // Nota de rodapé (data/local)
  if (spec.footerNote) {
    y += 12;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    setText(doc, C.slate);
    doc.text(spec.footerNote, W / 2, y, { align: 'center' });
    setText(doc, C.black);
  }
}

// ── Bloco de título compacto (para documentos sem capa cheia) ─────────────────
export function docTitle(flow: PdfFlow, title: string, subtitle?: string): void {
  const doc = flow.doc;
  flow.gap(2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  setText(doc, C.greenDark);
  const lines = doc.splitTextToSize(title, flow.cw) as string[];
  lines.forEach((l) => { doc.text(l, flow.W / 2, flow.y, { align: 'center' }); flow.y += 6.5; });
  if (subtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    setText(doc, C.slate);
    doc.text(subtitle, flow.W / 2, flow.y, { align: 'center' });
    flow.y += 5;
  }
  setText(doc, C.black);
  setDraw(doc, C.green); doc.setLineWidth(0.4);
  doc.line(flow.m.l, flow.y, flow.W - flow.m.r, flow.y);
  doc.setLineWidth(0.2);
  flow.gap(5);
}

// ── Barras de seção ───────────────────────────────────────────────────────────
export function sectionBar(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(13);
  flow.gap(2);
  setFill(doc, C.green); setDraw(doc, C.green);
  doc.rect(flow.m.l, flow.y - 5, flow.cw, 8.5, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  setText(doc, C.white);
  doc.text(title, flow.m.l + 2, flow.y);
  setText(doc, C.black);
  flow.gap(8);
}

export function subSection(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(10);
  flow.gap(1);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
  setText(doc, C.greenDark);
  doc.text(title, flow.m.l, flow.y);
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  flow.gap(6);
}

export function capsHeader(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(12);
  flow.gap(2);
  setFill(doc, C.grayBg); setDraw(doc, C.grayBorder);
  doc.rect(flow.m.l, flow.y - 4.5, flow.cw, 7.5, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  setText(doc, C.slate);
  doc.text(title, flow.m.l + 2, flow.y);
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  flow.gap(7);
}

export function divider(flow: PdfFlow): void {
  const doc = flow.doc;
  flow.ensure(4);
  setDraw(doc, C.green); doc.setLineWidth(0.25);
  doc.line(flow.m.l, flow.y, flow.W - flow.m.r, flow.y);
  doc.setLineWidth(0.2); setDraw(doc, C.grayBorder);
  flow.gap(4);
}

// ── Parágrafos e listas ───────────────────────────────────────────────────────
export function paragraph(flow: PdfFlow, text: string, fontSize = 9, lineH = 5.5): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
  setText(doc, C.black);
  const wrapped = doc.splitTextToSize(text, flow.cw) as string[];
  wrapped.forEach((line) => {
    flow.ensure(lineH);
    doc.text(line, flow.m.l, flow.y);
    flow.y += lineH;
  });
}

export function bullet(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  setText(doc, C.black);
  const wrapped = doc.splitTextToSize(text, flow.cw - 6) as string[];
  wrapped.forEach((line, i) => {
    flow.ensure(5.5);
    if (i === 0) doc.text('•', flow.m.l + 1, flow.y);
    doc.text(line, flow.m.l + 5, flow.y);
    flow.y += 5.5;
  });
}

export function checkbox(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  setText(doc, C.black);
  const wrapped = doc.splitTextToSize(text, flow.cw - 7) as string[];
  wrapped.forEach((line, i) => {
    flow.ensure(5);
    if (i === 0) {
      setDraw(doc, [110, 110, 110]); doc.setLineWidth(0.3);
      doc.rect(flow.m.l, flow.y - 3.5, 3.5, 3.5);
      doc.setLineWidth(0.2); setDraw(doc, C.grayBorder);
    }
    doc.text(line, flow.m.l + 5.5, flow.y);
    flow.y += 5;
  });
}

export function statusLine(flow: PdfFlow, text: string, ok: boolean): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8.5);
  setText(doc, ok ? C.ok : C.amber);
  const wrapped = doc.splitTextToSize((ok ? '[OK] ' : '[!] ') + text, flow.cw) as string[];
  wrapped.forEach((line) => {
    flow.ensure(5);
    doc.text(line, flow.m.l, flow.y);
    flow.y += 5;
  });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
}

export function formula(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('courier', 'normal'); doc.setFontSize(8);
  setText(doc, C.slate);
  const wrapped = doc.splitTextToSize(text, flow.cw - 8) as string[];
  wrapped.forEach((line) => {
    flow.ensure(5);
    doc.text(line, flow.m.l + 6, flow.y);
    flow.y += 5;
  });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
}

export function monoCentered(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  flow.ensure(5);
  doc.setFont('courier', 'normal'); doc.setFontSize(8);
  setText(doc, C.slate);
  doc.text(text, flow.W / 2, flow.y, { align: 'center' });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  flow.y += 5;
}

// ── Par rótulo:valor ──────────────────────────────────────────────────────────
export function kvLine(flow: PdfFlow, label: string, value: string | undefined, labelW = 62): void {
  const doc = flow.doc;
  flow.ensure(9);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  setText(doc, C.slate);
  doc.text(label + ':', flow.m.l, flow.y);
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  const val = doc.splitTextToSize(value || '—', flow.cw - labelW) as string[];
  doc.text(val[0] ?? '—', flow.m.l + labelW, flow.y);
  setDraw(doc, C.grayBorder); doc.setLineWidth(0.1);
  doc.line(flow.m.l, flow.y + 2, flow.W - flow.m.r, flow.y + 2);
  doc.setLineWidth(0.2);
  flow.gap(7.5);
}

// ── Info-box (tabela rotulada com 2 colunas) ─────────────────────────────────
export function infoBox(flow: PdfFlow, title: string, rows: [string, string][]): void {
  const doc = flow.doc;
  flow.ensure(7.5 + rows.length * COVER_ROW_H);
  setFill(doc, C.green);
  doc.rect(flow.m.l, flow.y, flow.cw, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  setText(doc, C.white);
  doc.text(title, flow.W / 2, flow.y + 5, { align: 'center' });
  setText(doc, C.black);
  flow.y += 7.5;

  const bodyH = rows.length * COVER_ROW_H;
  setDraw(doc, C.grayBorder); setFill(doc, C.grayBg);
  doc.rect(flow.m.l, flow.y, flow.cw, bodyH, 'FD');
  rows.forEach((row, i) => {
    const ry = flow.y + i * COVER_ROW_H;
    if (i % 2 === 0) { setFill(doc, C.grayBg2); doc.rect(flow.m.l, ry, flow.cw, COVER_ROW_H, 'F'); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    setText(doc, C.slate); doc.text(row[0] + ':', flow.m.l + 3, ry + 4.5);
    doc.setFont('helvetica', 'normal'); setText(doc, C.black);
    doc.text(doc.splitTextToSize(row[1], flow.cw - 48)[0] ?? '', flow.m.l + 45, ry + 4.5);
  });
  flow.y += bodyH + 3;
}

// ── Bloco de assinatura ───────────────────────────────────────────────────────
export interface SignOpts { role?: string; nome: string; docLabel?: string; docValue?: string; extraLine?: string; }
export function signatureBlock(flow: PdfFlow, opts: SignOpts): void {
  const doc = flow.doc;
  flow.ensure(28);
  flow.gap(4);
  if (opts.role) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    setText(doc, C.slate);
    doc.text(opts.role, flow.m.l, flow.y);
    setText(doc, C.black);
    flow.gap(8);
  } else {
    flow.gap(4);
  }
  setDraw(doc, C.black); doc.setLineWidth(0.3);
  doc.line(flow.m.l, flow.y, flow.m.l + 80, flow.y);
  doc.setLineWidth(0.2);
  flow.gap(4);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  setText(doc, C.black);
  doc.text(opts.nome, flow.m.l, flow.y);
  flow.gap(5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  setText(doc, C.slate);
  if (opts.docLabel) { doc.text(`${opts.docLabel}: ${opts.docValue || '___'}`, flow.m.l, flow.y); flow.gap(4.5); }
  if (opts.extraLine) { doc.text(opts.extraLine, flow.m.l, flow.y); flow.gap(4.5); }
  setText(doc, C.black);
  flow.gap(2);
}

// ── Item de checklist (relatório de pendências) ──────────────────────────────
export function checklistItem(flow: PdfFlow, id: string, nome: string, feito: boolean, como: string): void {
  const doc = flow.doc;
  flow.ensure(16);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  setText(doc, C.black);
  const titulo = doc.splitTextToSize(`${id} — ${nome}`, flow.cw) as string[];
  titulo.forEach((l) => { doc.text(l, flow.m.l, flow.y); flow.y += 5; });
  doc.setFont('helvetica', 'normal');
  setText(doc, feito ? C.ok : C.amber);
  doc.text(feito ? '✔ GERADO' : '○ PENDENTE', flow.m.l, flow.y);
  setText(doc, C.black);
  if (!feito) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    setText(doc, C.slate);
    const comoW = doc.splitTextToSize(`Como obter: ${como}`, flow.cw - 4) as string[];
    let yy = flow.y;
    comoW.forEach((l, i) => { doc.text(l, flow.m.l + 4, yy + 5 + i * 4.5); });
    flow.y = yy + 5 + comoW.length * 4.5;
    setText(doc, C.black);
  }
  flow.gap(7);
}

// ── Tabela com células multilinha + colunas auto-ajustadas ────────────────────
export interface TableOpts {
  fontSize?: number;
  /** Alinhamento por coluna: 'left' (padrão) | 'center' | 'right'. */
  align?: ('left' | 'center' | 'right')[];
  /** Pesos relativos de largura por coluna; sobrepõe o auto-ajuste. */
  weights?: number[];
}

const PAD_X = 1.6;

/**
 * Renderiza uma tabela markdown (matriz de strings, 1ª linha = cabeçalho).
 * Células com texto longo quebram em múltiplas linhas (altura variável).
 * Larguras de coluna auto-ajustadas pelo conteúdo, normalizadas à largura útil.
 * Cabeçalho é repetido após quebra de página.
 */
export function table(flow: PdfFlow, rows: string[][], opts: TableOpts = {}): void {
  const doc = flow.doc;
  if (rows.length === 0) return;
  const nCols = Math.max(...rows.map((r) => r.length));
  if (nCols === 0) return;

  const fontSize = opts.fontSize ?? (nCols >= 9 ? 6 : nCols >= 7 ? 6.5 : 7.5);
  const lineH = fontSize * 0.42 + 0.6;
  const CW = flow.cw;

  // 1. Medir largura de conteúdo por coluna
  let colW: number[];
  if (opts.weights && opts.weights.length === nCols) {
    const sum = opts.weights.reduce((a, b) => a + b, 0);
    colW = opts.weights.map((w) => (w / sum) * CW);
  } else {
    const colMax = new Array<number>(nCols).fill(0);
    rows.forEach((r, ri) => {
      doc.setFont('helvetica', ri === 0 ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      for (let c = 0; c < nCols; c++) {
        const w = doc.getTextWidth((r[c] ?? '').trim());
        if (w > colMax[c]) colMax[c] = w;
      }
    });
    const needed = colMax.map((m) => m + PAD_X * 2);
    const totalNeeded = needed.reduce((a, b) => a + b, 0);
    if (totalNeeded <= CW) {
      // Expandir proporcionalmente para preencher a largura
      const extra = CW - totalNeeded;
      colW = needed.map((n) => n + extra * (n / totalNeeded));
    } else {
      // Encolher proporcionalmente, com piso mínimo
      const minCol = Math.max(10, CW / (nCols * 2.2));
      let prelim = needed.map((n) => Math.max(minCol, (n / totalNeeded) * CW));
      const sum = prelim.reduce((a, b) => a + b, 0);
      colW = prelim.map((w) => (w / sum) * CW);
    }
  }

  const align = opts.align ?? [];

  const drawRow = (cells: string[], isHeader: boolean): void => {
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    // Wrap de cada célula
    const wrapped = colW.map((cw, ci) =>
      doc.splitTextToSize((cells[ci] ?? '').trim(), cw - PAD_X * 2) as string[],
    );
    const nLines = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = nLines * lineH + 2.2;

    // Quebra de página — repete o cabeçalho
    if (flow.y + rowH > flow.bottom) {
      flow.newPage();
      if (!isHeader) drawRow(rows[0], true);
    }

    // Fundo da linha
    if (isHeader) setFill(doc, C.green);
    else setFill(doc, C.grayBg);
    setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
    const totalW = colW.reduce((a, b) => a + b, 0);
    doc.rect(flow.m.l, flow.y, totalW, rowH, isHeader ? 'F' : 'FD');

    // Células
    let x = flow.m.l;
    wrapped.forEach((lines, ci) => {
      const cw = colW[ci];
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.12);
      doc.rect(x, flow.y, cw, rowH, 'S');
      setText(doc, isHeader ? C.white : C.black);
      const a = align[ci] ?? 'left';
      const tx = a === 'center' ? x + cw / 2 : a === 'right' ? x + cw - PAD_X : x + PAD_X;
      lines.forEach((ln, li) => {
        doc.text(ln, tx, flow.y + 3 + li * lineH, a === 'left' ? undefined : { align: a });
      });
      x += cw;
    });
    setText(doc, C.black); doc.setLineWidth(0.2);
    flow.y += rowH;
  };

  rows.forEach((r, ri) => drawRow(r, ri === 0));
  flow.gap(3);
}

/** Título de tabela (itálico, antes da tabela). */
export function tableTitle(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(8);
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8.5);
  setText(doc, C.slate);
  doc.text(title, flow.m.l, flow.y);
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  flow.gap(5);
}
