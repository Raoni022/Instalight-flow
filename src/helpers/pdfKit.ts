/**
 * pdfKit.ts — Renderizador PDF a partir do modelo de blocos (docModel)
 *
 * Estilo "memorial técnico": fundo branco, títulos pretos com acento verde
 * DISCRETO (linha fina), tabelas simples cinza-claro/branco, sem faixas ou
 * bordas verdes preenchidas. renderSpecToPdf(doc, spec) é o ponto de entrada.
 */

import jsPDF from 'jspdf';
import type { Block, DocSpec, CoverSpec, CoverInfoBox } from './docModel';

// ── Paleta (discreta) ─────────────────────────────────────────────────────────
export type RGB = [number, number, number];
export const C = {
  green:      [ 90, 150,  40] as RGB,  // acento (linhas/títulos discretos)
  greenDark:  [ 55, 100,  25] as RGB,
  slate:      [ 70,  80,  95] as RGB,
  black:      [ 25,  25,  25] as RGB,
  white:      [255, 255, 255] as RGB,
  headerGray: [238, 238, 238] as RGB,  // cabeçalho de tabela / faixa caps
  rowGray:    [248, 249, 250] as RGB,  // linha alternada
  grayBorder: [200, 205, 210] as RGB,
  amberDark:  [140,  90,   0] as RGB,
  ok:         [ 30, 110,  30] as RGB,
  redDark:    [170,  35,  35] as RGB,
};
export const setFill = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
export const setDraw = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
export const setText = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

export interface Margins { l: number; r: number; t: number; b: number; }
const M: Margins = { l: 18, r: 18, t: 24, b: 18 };

// ── Fluxo (cursor + quebra de página) ─────────────────────────────────────────
interface Chrome { header?: (d: jsPDF, p: number) => number; footer?: (d: jsPDF, p: number) => void; }

export class PdfFlow {
  doc: jsPDF; y: number; pageNum: number;
  readonly W: number; readonly H: number; readonly m = M;
  private chrome: Chrome;
  constructor(doc: jsPDF, chrome: Chrome = {}) {
    this.doc = doc;
    this.W = doc.internal.pageSize.getWidth();
    this.H = doc.internal.pageSize.getHeight();
    this.chrome = chrome;
    this.pageNum = 1;
    this.y = chrome.header ? chrome.header(doc, 1) : M.t;
  }
  get cw(): number { return this.W - M.l - M.r; }
  get bottom(): number { return this.H - M.b - 4; }
  gap(n: number): void { this.y += n; }
  ensure(need: number): void { if (this.y + need > this.bottom) this.newPage(); }
  newPage(): void {
    if (this.chrome.footer) this.chrome.footer(this.doc, this.pageNum);
    this.doc.addPage();
    this.pageNum += 1;
    this.y = this.chrome.header ? this.chrome.header(this.doc, this.pageNum) : M.t;
  }
  finish(): void { if (this.chrome.footer) this.chrome.footer(this.doc, this.pageNum); }
}

// ── Chrome minimalista (sem faixa colorida) ───────────────────────────────────
function minimalChrome(opts: { title: string; subtitle?: string; company?: string }): Chrome {
  return {
    header: (doc, pageNum) => {
      const W = doc.internal.pageSize.getWidth();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      setText(doc, C.slate);
      doc.text(opts.title.toUpperCase(), M.l, 12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pág. ${pageNum}`, W - M.r, 12, { align: 'right' });
      if (opts.subtitle) {
        doc.setFontSize(6.8); setText(doc, C.slate);
        doc.text(opts.subtitle, M.l, 16);
      }
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
      doc.line(M.l, 18, W - M.r, 18);
      // acento verde discreto à esquerda
      setDraw(doc, C.green); doc.setLineWidth(0.8);
      doc.line(M.l, 18, M.l + 16, 18);
      doc.setLineWidth(0.2);
      setText(doc, C.black);
      return M.t;
    },
    footer: (doc, pageNum) => {
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const y = H - M.b + 6;
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
      doc.line(M.l, y, W - M.r, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
      setText(doc, C.slate);
      doc.text(opts.company || 'Instalight Energia Solar', M.l, y + 4);
      doc.text(`Página ${pageNum}`, W - M.r, y + 4, { align: 'right' });
      setText(doc, C.black);
    },
  };
}

// ── Aviso RT (caixa de borda, sem preenchimento chapado) ──────────────────────
function rtWarning(doc: jsPDF, flow: PdfFlow): void {
  const W = flow.W, H = flow.H;
  const y = H - M.b - 7;
  setDraw(doc, C.redDark); doc.setLineWidth(0.4);
  doc.rect(M.l, y, flow.cw, 7);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8);
  setText(doc, C.redDark);
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA',
    W / 2, y + 4.6, { align: 'center' },
  );
  setText(doc, C.black);
}

// ── Capa clean ────────────────────────────────────────────────────────────────
const CRH = 6.5;
function coverInfoBox(doc: jsPDF, box: CoverInfoBox, BX: number, BW: number, y: number): number {
  // Cabeçalho (cinza-claro, texto preto)
  setFill(doc, C.headerGray); setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
  doc.rect(BX, y, BW, 7, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  setText(doc, C.black);
  doc.text(box.title, BX + 3, y + 4.8);
  y += 7;
  const bodyH = box.rows.length * CRH;
  setDraw(doc, C.grayBorder); doc.rect(BX, y, BW, bodyH);
  box.rows.forEach((row, i) => {
    const ry = y + i * CRH;
    if (i > 0) { setDraw(doc, C.grayBorder); doc.setLineWidth(0.1); doc.line(BX, ry, BX + BW, ry); doc.setLineWidth(0.2); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setText(doc, C.slate);
    doc.text(row[0] + ':', BX + 3, ry + 4.5);
    doc.setFont('helvetica', 'normal'); setText(doc, C.black);
    doc.text(doc.splitTextToSize(row[1], BW - 47)[0] ?? '', BX + 45, ry + 4.5);
  });
  return y + bodyH;
}

export function coverPage(doc: jsPDF, spec: CoverSpec): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const BX = M.l, BW = W - M.l - M.r;
  let y = 30;

  // Marca discreta
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  setText(doc, C.greenDark);
  doc.text(spec.brandTitle || 'INSTALIGHT ENERGIA SOLAR', W / 2, y, { align: 'center' });
  if (spec.brandSubtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); setText(doc, C.slate);
    doc.text(spec.brandSubtitle, W / 2, y + 5, { align: 'center' });
  }
  setText(doc, C.black);
  y += 26;

  // Título
  doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
  setText(doc, C.black);
  doc.splitTextToSize(spec.docTitle, BW).forEach((l: string) => { doc.text(l, W / 2, y, { align: 'center' }); y += 8.5; });
  // Acento verde discreto (uma linha curta centralizada)
  setDraw(doc, C.green); doc.setLineWidth(1);
  doc.line(W / 2 - 22, y - 1, W / 2 + 22, y - 1);
  doc.setLineWidth(0.2);
  y += 5;
  if (spec.docSubtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setText(doc, C.slate);
    doc.splitTextToSize(spec.docSubtitle, BW).forEach((l: string) => { doc.text(l, W / 2, y, { align: 'center' }); y += 5; });
    setText(doc, C.black);
  }
  y += 8;

  // Destaque (box bordado, sem preenchimento colorido)
  if (spec.highlight) {
    const boxH = 32;
    setDraw(doc, C.grayBorder); doc.setLineWidth(0.4); doc.rect(BX, y, BW, boxH); doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setText(doc, C.slate);
    doc.text(spec.highlight.bannerTitle, W / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setText(doc, C.black);
    doc.text(spec.highlight.bigLine, W / 2, y + 17, { align: 'center' });
    if (spec.highlight.midLine) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); setText(doc, C.black);
      doc.text(spec.highlight.midLine, W / 2, y + 24, { align: 'center' });
    }
    if (spec.highlight.smallLine) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setText(doc, C.slate);
      doc.text(spec.highlight.smallLine, W / 2, y + 29.5, { align: 'center' });
      setText(doc, C.black);
    }
    y += boxH + 10;
  }

  for (const box of spec.infoBoxes || []) { y = coverInfoBox(doc, box, BX, BW, y); y += 8; }

  if (spec.footerNote) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); setText(doc, C.slate);
    doc.text(spec.footerNote, W / 2, Math.max(y, H - 30), { align: 'center' });
    setText(doc, C.black);
  }
}

// ── Título compacto (docs sem capa) ───────────────────────────────────────────
function docTitle(flow: PdfFlow, title: string, subtitle?: string): void {
  const doc = flow.doc;
  flow.gap(2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); setText(doc, C.black);
  doc.splitTextToSize(title, flow.cw).forEach((l: string) => { doc.text(l, flow.W / 2, flow.y, { align: 'center' }); flow.y += 7; });
  if (subtitle) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setText(doc, C.slate);
    doc.text(subtitle, flow.W / 2, flow.y, { align: 'center' }); flow.y += 5;
  }
  setText(doc, C.black);
  setDraw(doc, C.green); doc.setLineWidth(0.8);
  doc.line(flow.W / 2 - 20, flow.y, flow.W / 2 + 20, flow.y);
  doc.setLineWidth(0.2);
  flow.gap(6);
}

// ── Primitivos de bloco ───────────────────────────────────────────────────────
function bSection(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(12); flow.gap(3);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); setText(doc, C.black);
  doc.text(title, M.l, flow.y);
  flow.gap(1.5);
  setDraw(doc, C.green); doc.setLineWidth(0.4); doc.line(M.l, flow.y, flow.W - M.r, flow.y); doc.setLineWidth(0.2);
  setText(doc, C.black); flow.gap(4.5);
}
function bSub(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(9); flow.gap(1.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setText(doc, C.greenDark);
  doc.splitTextToSize(title, flow.cw).forEach((l: string) => { doc.text(l, M.l, flow.y); flow.y += 5; });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
}
function bCaps(flow: PdfFlow, title: string): void {
  const doc = flow.doc;
  flow.ensure(11); flow.gap(2);
  setFill(doc, C.headerGray); setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
  doc.rect(M.l, flow.y - 4.5, flow.cw, 7, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(doc, C.black);
  doc.text(title, M.l + 2, flow.y);
  doc.setFont('helvetica', 'normal'); flow.gap(7);
}
function bPara(flow: PdfFlow, text: string, size = 9, lh = 5): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(size); setText(doc, C.black);
  doc.splitTextToSize(text, flow.cw).forEach((l: string) => { flow.ensure(lh); doc.text(l, M.l, flow.y); flow.y += lh; });
}
function bBullet(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setText(doc, C.black);
  doc.splitTextToSize(text, flow.cw - 6).forEach((l: string, i: number) => {
    flow.ensure(5); if (i === 0) doc.text('•', M.l + 1, flow.y); doc.text(l, M.l + 5, flow.y); flow.y += 5;
  });
}
function bCheck(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setText(doc, C.black);
  doc.splitTextToSize(text, flow.cw - 7).forEach((l: string, i: number) => {
    flow.ensure(5);
    if (i === 0) { setDraw(doc, C.slate); doc.setLineWidth(0.3); doc.rect(M.l, flow.y - 3.2, 3.2, 3.2); doc.setLineWidth(0.2); }
    doc.text(l, M.l + 5.5, flow.y); flow.y += 5;
  });
}
function bStatus(flow: PdfFlow, text: string, ok: boolean): void {
  const doc = flow.doc;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setText(doc, ok ? C.ok : C.amberDark);
  doc.splitTextToSize((ok ? '[OK] ' : '[!] ') + text, flow.cw).forEach((l: string) => { flow.ensure(5); doc.text(l, M.l, flow.y); flow.y += 5; });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
}
function bFormula(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  doc.setFont('courier', 'normal'); doc.setFontSize(8); setText(doc, C.slate);
  doc.splitTextToSize(text, flow.cw - 8).forEach((l: string) => { flow.ensure(5); doc.text(l, M.l + 6, flow.y); flow.y += 5; });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
}
function bMono(flow: PdfFlow, text: string): void {
  const doc = flow.doc;
  flow.ensure(5); doc.setFont('courier', 'normal'); doc.setFontSize(8); setText(doc, C.slate);
  doc.text(text, flow.W / 2, flow.y, { align: 'center' });
  doc.setFont('helvetica', 'normal'); setText(doc, C.black); flow.y += 5;
}
function bKv(flow: PdfFlow, label: string, value: string): void {
  const doc = flow.doc; const labelW = 62;
  flow.ensure(8.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(doc, C.slate);
  doc.text(label + ':', M.l, flow.y);
  doc.setFont('helvetica', 'normal'); setText(doc, C.black);
  doc.text((doc.splitTextToSize(value || '—', flow.cw - labelW)[0] ?? '—'), M.l + labelW, flow.y);
  setDraw(doc, C.grayBorder); doc.setLineWidth(0.1); doc.line(M.l, flow.y + 2, flow.W - M.r, flow.y + 2); doc.setLineWidth(0.2);
  flow.gap(7);
}
function bSigrule(flow: PdfFlow): void {
  const doc = flow.doc; flow.ensure(8); flow.gap(3);
  setDraw(doc, C.black); doc.setLineWidth(0.3); doc.line(M.l, flow.y, M.l + 85, flow.y); doc.setLineWidth(0.2);
  flow.gap(4);
}
function bDivider(flow: PdfFlow): void {
  const doc = flow.doc; flow.ensure(4);
  setDraw(doc, C.grayBorder); doc.setLineWidth(0.2); doc.line(M.l, flow.y, flow.W - M.r, flow.y);
  flow.gap(3);
}
function bNoteBox(flow: PdfFlow, title: string | undefined, lines: string[]): void {
  const doc = flow.doc;
  const h = 6 + lines.length * 4.5;
  flow.ensure(h + 4); flow.gap(3);
  setDraw(doc, C.amberDark); doc.setLineWidth(0.3); doc.rect(M.l, flow.y, flow.cw, h); doc.setLineWidth(0.2);
  let yy = flow.y + 5;
  if (title) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setText(doc, C.amberDark); doc.text(title, M.l + 2, yy); yy += 5; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); setText(doc, C.black);
  lines.forEach((l) => { doc.text(doc.splitTextToSize(l, flow.cw - 4)[0] ?? '', M.l + 2, yy); yy += 4.5; });
  setText(doc, C.black); flow.y += h + 3;
}
function bCheckitem(flow: PdfFlow, id: string, name: string, done: boolean, como: string): void {
  const doc = flow.doc;
  flow.ensure(15);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(doc, C.black);
  doc.splitTextToSize(`${id} — ${name}`, flow.cw).forEach((l: string) => { doc.text(l, M.l, flow.y); flow.y += 5; });
  doc.setFont('helvetica', 'normal');
  setText(doc, done ? C.ok : C.amberDark);
  doc.text(done ? '[x] GERADO' : '[ ] PENDENTE', M.l, flow.y);
  setText(doc, C.black);
  if (!done) {
    doc.setFontSize(8); setText(doc, C.slate);
    const w = doc.splitTextToSize(`Como obter: ${como}`, flow.cw - 4);
    let yy = flow.y;
    w.forEach((l: string, i: number) => doc.text(l, M.l + 4, yy + 5 + i * 4.3));
    flow.y = yy + 5 + w.length * 4.3;
    setText(doc, C.black);
  }
  flow.gap(6);
}

const PAD_X = 1.6;
function bTableTitle(flow: PdfFlow, title: string): void {
  const doc = flow.doc; flow.ensure(8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setText(doc, C.slate);
  doc.text(title, M.l, flow.y); doc.setFont('helvetica', 'normal'); setText(doc, C.black); flow.gap(5);
}
function bTable(flow: PdfFlow, rows: string[][]): void {
  const doc = flow.doc;
  if (rows.length === 0) return;
  const nCols = Math.max(...rows.map((r) => r.length));
  if (nCols === 0) return;
  const fontSize = nCols >= 9 ? 6 : nCols >= 7 ? 6.5 : 7.5;
  const lineH = fontSize * 0.42 + 0.6;
  const CW = flow.cw;

  // Larguras auto-ajustadas
  const colMax = new Array<number>(nCols).fill(0);
  rows.forEach((r, ri) => {
    doc.setFont('helvetica', ri === 0 ? 'bold' : 'normal'); doc.setFontSize(fontSize);
    for (let c = 0; c < nCols; c++) { const w = doc.getTextWidth((r[c] ?? '').trim()); if (w > colMax[c]) colMax[c] = w; }
  });
  const needed = colMax.map((m) => m + PAD_X * 2);
  const tot = needed.reduce((a, b) => a + b, 0);
  let colW: number[];
  if (tot <= CW) { const extra = CW - tot; colW = needed.map((n) => n + extra * (n / tot)); }
  else { const minC = Math.max(10, CW / (nCols * 2.2)); const pre = needed.map((n) => Math.max(minC, (n / tot) * CW)); const s = pre.reduce((a, b) => a + b, 0); colW = pre.map((w) => (w / s) * CW); }

  const drawRow = (cells: string[], header: boolean, idx: number): void => {
    doc.setFont('helvetica', header ? 'bold' : 'normal'); doc.setFontSize(fontSize);
    const wrapped = colW.map((cw, ci) => doc.splitTextToSize((cells[ci] ?? '').trim(), cw - PAD_X * 2) as string[]);
    const nLines = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = nLines * lineH + 2.2;
    if (flow.y + rowH > flow.bottom) { flow.newPage(); if (!header) drawRow(rows[0], true, 0); }
    // Fundo: cabeçalho cinza-claro; corpo alterna branco / cinza muito leve
    setFill(doc, header ? C.headerGray : (idx % 2 === 0 ? C.white : C.rowGray));
    setDraw(doc, C.grayBorder); doc.setLineWidth(0.2);
    const totalW = colW.reduce((a, b) => a + b, 0);
    doc.rect(M.l, flow.y, totalW, rowH, 'FD');
    let x = M.l;
    wrapped.forEach((lines, ci) => {
      const cw = colW[ci];
      setDraw(doc, C.grayBorder); doc.setLineWidth(0.12); doc.rect(x, flow.y, cw, rowH, 'S');
      setText(doc, C.black);
      lines.forEach((ln, li) => doc.text(ln, x + PAD_X, flow.y + 3 + li * lineH));
      x += cw;
    });
    setText(doc, C.black); doc.setLineWidth(0.2);
    flow.y += rowH;
  };
  rows.forEach((r, ri) => drawRow(r, ri === 0, ri));
  flow.gap(3);
}

// ── Render de blocos ──────────────────────────────────────────────────────────
function renderBlocks(flow: PdfFlow, blocks: Block[]): void {
  for (const blk of blocks) {
    switch (blk.t) {
      case 'section':    bSection(flow, blk.text); break;
      case 'subsection': bSub(flow, blk.text); break;
      case 'caps':       bCaps(flow, blk.text); break;
      case 'para':       bPara(flow, blk.text); break;
      case 'bullet':     bBullet(flow, blk.text); break;
      case 'check':      bCheck(flow, blk.text); break;
      case 'status':     bStatus(flow, blk.text, blk.ok); break;
      case 'formula':    bFormula(flow, blk.text); break;
      case 'mono':       bMono(flow, blk.text); break;
      case 'table':      bTable(flow, blk.rows); break;
      case 'tableTitle': bTableTitle(flow, blk.text); break;
      case 'kv':         bKv(flow, blk.label, blk.value); break;
      case 'checkitem':  bCheckitem(flow, blk.id, blk.name, blk.done, blk.como); break;
      case 'noteBox':    bNoteBox(flow, blk.title, blk.lines); break;
      case 'sigrule':    bSigrule(flow); break;
      case 'divider':    bDivider(flow); break;
      case 'gap':        flow.gap(2.5); break;
    }
  }
}

// ── Ponto de entrada ──────────────────────────────────────────────────────────
export function renderSpecToPdf(doc: jsPDF, spec: DocSpec): void {
  const chrome = minimalChrome(spec.chrome);
  let flow: PdfFlow;
  if (spec.cover) {
    coverPage(doc, spec.cover);
    doc.addPage();
    flow = new PdfFlow(doc, chrome);
  } else {
    flow = new PdfFlow(doc, chrome);
    if (spec.title) docTitle(flow, spec.title.title, spec.title.subtitle);
  }
  renderBlocks(flow, spec.blocks);
  flow.finish();
  rtWarning(doc, flow);
}
