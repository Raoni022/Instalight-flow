/**
 * memorialPDF.ts — Renderizador profissional do Memorial Técnico-Descritivo em PDF
 *
 * Hierarquia visual:
 *   Capa       → buildCoverPage()     — página 1, dados de fd/calc direto
 *   Seção N.   → fundo verde, texto branco, 10pt bold
 *   Subseção   → verde escuro, 9.5pt bold
 *   Corpo      → preto, 9pt regular, quebra de linha automática
 *   Tabela     → bordas, cabeçalho verde, linhas alternadas
 *   Checkbox □ → retângulo + texto indentado
 *   Bullet •   → marcador + texto indentado
 *   Fórmula    → courier 8pt, indentado
 */

import jsPDF from 'jspdf';
import type { FormData, Calculos } from '../types';

// ── Layout ────────────────────────────────────────────────────────────────────
const ML = 18;   // margem esquerda
const MR = 18;   // margem direita
const MT = 26;   // topo do conteúdo (após header)
const MB = 22;   // área de rodapé

// ── Cores ─────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const CG:   RGB = [120, 184,  58];   // verde marca
const CGD:  RGB = [ 70, 140,  20];   // verde escuro
const CGB:  RGB = [240, 248, 230];   // verde claro (fundo)
const CSL:  RGB = [ 71,  85, 105];   // slate
const CBK:  RGB = [ 30,  30,  30];   // preto suave
const CWT:  RGB = [255, 255, 255];   // branco
const CGB2: RGB = [248, 250, 252];   // cinza claro (bg row par)
const CGR:  RGB = [200, 210, 215];   // cinza borda
const CAM:  RGB = [180, 120,   0];   // âmbar (aviso)
const COK:  RGB = [ 20, 120,  20];   // verde ok

const sf = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const sd = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const st = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

// ── Capa (Página 1) ───────────────────────────────────────────────────────────

function buildCoverPage(doc: jsPDF, fd: FormData, calc: Calculos): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Faixa verde no topo
  sf(doc, CG); doc.rect(0, 0, W, 16, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  st(doc, CWT);
  doc.text('INSTALIGHT ENERGIA SOLAR', W / 2, 7, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Documentação Técnica para Geração Distribuída Fotovoltaica', W / 2, 12.5, { align: 'center' });
  st(doc, CBK);

  // Faixa verde na base
  sf(doc, CG); doc.rect(0, H - 12, W, 12, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  st(doc, CWT);
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RT HABILITADO OBRIGATÓRIA',
    W / 2, H - 4.5, { align: 'center' },
  );
  st(doc, CBK);

  // Borda verde lateral
  sf(doc, CG);
  doc.rect(0, 16, 5, H - 28, 'F');
  doc.rect(W - 5, 16, 5, H - 28, 'F');

  const BX = 12, BW = W - 24;
  let y = 26;

  // Título do documento
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  st(doc, CGD);
  doc.text('MEMORIAL TÉCNICO-DESCRITIVO', W / 2, y, { align: 'center' });

  y += 7;
  const dataObj = fd.dataproject ? new Date(fd.dataproject + 'T12:00:00') : new Date();
  const mes = dataObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const ano = dataObj.getFullYear();
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  st(doc, CSL);
  doc.text(`REV — ${mes}/${ano}  |  Conforme NT.00020.EQTL-06 REV 06 (12/2025)`, W / 2, y, { align: 'center' });
  st(doc, CBK);

  // Box do sistema
  y += 10;
  sf(doc, CG); sd(doc, CG);
  doc.rect(BX, y, BW, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  st(doc, CWT);
  doc.text('SISTEMA FOTOVOLTAICO CONECTADO À REDE', W / 2, y + 5, { align: 'center' });
  st(doc, CBK);

  y += 7.5;
  sf(doc, CGB); sd(doc, CG);
  doc.rect(BX, y, BW, 30, 'FD');

  const tipoUp = fd.tipoInstalacao === 'Ampliação' ? 'AMPLIAÇÃO — ' : '';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  st(doc, CGD);
  doc.text(
    `${tipoUp}${calc.enq.toUpperCase()} DE ${calc.kWp} kWp`,
    W / 2, y + 10, { align: 'center' },
  );
  doc.setFontSize(10);
  st(doc, CBK);
  const tensao = fd.tipoLigacao === 'Trifásico' ? '380/220 V' : '220 V';
  doc.text(
    `Conectado à Rede em ${tensao}  |  ${fd.tipoLigacao}  |  ${calc.kWtCA} kW (CA)`,
    W / 2, y + 19, { align: 'center' },
  );
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  st(doc, CSL);
  doc.text(
    `Caracterizado como: ${fd.tipoCaracterizacao || 'Autoconsumo Local'}  (Lei Federal 14.300/2022)`,
    W / 2, y + 27, { align: 'center' },
  );
  st(doc, CBK);

  // Box dados da UC
  y += 40;
  _infoBox(doc, 'UNIDADE CONSUMIDORA', [
    ['Titular', fd.nomeCliente || '[INSERIR]'],
    [fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ', fd.cpfCnpj || '[INSERIR]'],
    ...(fd.tipoPessoa === 'fisica' && fd.rgCliente ? [['RG', fd.rgCliente] as [string, string]] : []),
    ['Código UC', fd.codigoUC || '[INSERIR]'],
    ['Endereço', (fd.endereco || '[INSERIR]').substring(0, 60)],
    ['Cidade / UF', `${fd.cidade || 'Porto Alegre'} / RS`],
  ], BX, BW, W, y);
  y += 7.5 + 6 * 6.5 + (fd.tipoPessoa === 'fisica' && fd.rgCliente ? 6.5 : 0);

  // Box responsável técnico
  y += 8;
  _infoBox(doc, 'RESPONSÁVEL TÉCNICO', [
    ['Nome', fd.nomeResponsavel || '[INSERIR]'],
    ['Profissão', fd.profissaoRT || '[INSERIR PROFISSÃO]'],
    ['CRT/CREA', fd.numeroCRT || '[INSERIR]'],
    [(fd.tipoResponsabilidade || 'TRT'), fd.numART || '[INSERIR NÚMERO]'],
    ['Empresa', fd.nomeEmpresa || 'Instalight Energia Solar'],
  ], BX, BW, W, y);
  y += 7.5 + 5 * 6.5;

  // Data e local
  y += 10;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
  st(doc, CSL);
  doc.text(
    `${fd.cidade || 'Porto Alegre'} — RS, ${dataObj.toLocaleDateString('pt-BR')}`,
    W / 2, y, { align: 'center' },
  );
  st(doc, CBK);
}

function _infoBox(
  doc: jsPDF, title: string, rows: [string, string][],
  BX: number, BW: number, W: number, y: number,
): void {
  const ROW_H = 6.5;
  sf(doc, CG); sd(doc, CG);
  doc.rect(BX, y, BW, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  st(doc, CWT);
  doc.text(title, W / 2, y + 5, { align: 'center' });
  st(doc, CBK);

  y += 7.5;
  sd(doc, CGR);
  sf(doc, CGB2);
  doc.rect(BX, y, BW, rows.length * ROW_H, 'FD');

  rows.forEach((row, i) => {
    if (i % 2 === 0) { sf(doc, [240, 243, 246]); doc.rect(BX, y + i * ROW_H, BW, ROW_H, 'F'); }
    if (i > 0) {
      sd(doc, CGR); doc.setLineWidth(0.1);
      doc.line(BX, y + i * ROW_H, BX + BW, y + i * ROW_H);
      doc.setLineWidth(0.2);
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    st(doc, CSL); doc.text(row[0] + ':', BX + 3, y + i * ROW_H + 4.5);
    doc.setFont('helvetica', 'normal');
    st(doc, CBK); doc.text(row[1], BX + 42, y + i * ROW_H + 4.5);
  });
}

// ── Cabeçalho das páginas internas ───────────────────────────────────────────

function addBodyHeader(doc: jsPDF, fd: FormData, calc: Calculos, W: number, pageNum: number): number {
  sf(doc, CG); doc.rect(0, 0, W, 16, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  st(doc, CWT);
  doc.text('MEMORIAL TÉCNICO-DESCRITIVO', ML, 6);
  doc.text(`Pág. ${pageNum}`, W - MR, 6, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(
    `${(fd.nomeCliente || '—').substring(0, 30)}  |  UC: ${fd.codigoUC || '—'}  |  ${calc.kWp} kWp  |  NT.00020.EQTL-06 REV 06`,
    W / 2, 12, { align: 'center' },
  );
  st(doc, CBK);
  return MT;
}

// ── Rodapé das páginas internas ───────────────────────────────────────────────

function addBodyFooter(doc: jsPDF, fd: FormData, W: number, H: number, pageNum: number): void {
  const y = H - MB + 4;
  sd(doc, CGR); doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y);
  doc.setLineWidth(0.1);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  st(doc, CSL);
  doc.text(`${fd.nomeEmpresa || 'Instalight Energia Solar'}`, ML, y + 5);
  doc.text(`Página ${pageNum}`, W - MR, y + 5, { align: 'right' });
  st(doc, CBK);
}

// ── Renderizador de tabela ────────────────────────────────────────────────────

function renderTable(
  doc: jsPDF,
  rows: string[][],
  CW: number,
  y: number,
  onPageBreak: () => number,
): number {
  if (rows.length === 0) return y;
  const nCols = Math.max(...rows.map(r => r.length));
  if (nCols === 0) return y;

  const ROW_H = 6.5;
  let colWidths: number[];

  if (nCols === 2) {
    colWidths = [CW * 0.60, CW * 0.40];
  } else if (nCols === 3) {
    colWidths = [CW * 0.45, CW * 0.30, CW * 0.25];
  } else if (nCols === 4) {
    colWidths = [CW * 0.32, CW * 0.24, CW * 0.24, CW * 0.20];
  } else {
    const w = CW / nCols;
    colWidths = Array<number>(nCols).fill(w);
  }

  for (let ri = 0; ri < rows.length; ri++) {
    const cells = rows[ri];
    const H = doc.internal.pageSize.getHeight();
    if (y + ROW_H > H - MB - 4) y = onPageBreak();

    const isHeader = ri === 0;
    if (isHeader) { sf(doc, CG); }
    else if (ri % 2 === 0) { sf(doc, CGB2); }
    else { sf(doc, CWT); }

    sd(doc, CGR); doc.setLineWidth(0.2);
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    doc.rect(ML, y, totalW, ROW_H, isHeader ? 'F' : 'FD');

    let x = ML;
    cells.forEach((cell, ci) => {
      const cw = colWidths[ci] ?? CW / nCols;
      sd(doc, CGR); doc.setLineWidth(0.15);
      doc.rect(x, y, cw, ROW_H, 'S');
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      st(doc, isHeader ? CWT : CBK);
      const maxW = cw - 3;
      const txt = doc.splitTextToSize(cell.trim(), maxW)[0] ?? '';
      doc.text(txt, x + 1.5, y + 4.5);
      x += cw;
    });
    y += ROW_H;
  }
  st(doc, CBK); doc.setLineWidth(0.2);
  return y + 3;
}

// ── Renderer principal ────────────────────────────────────────────────────────

export function buildMemorialPDFPro(
  doc: jsPDF,
  fd: FormData,
  calc: Calculos,
  text: string,
): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const CW = W - ML - MR;

  // ── Página 1: Capa ──────────────────────────────────────────────────────────
  buildCoverPage(doc, fd, calc);

  // ── Páginas 2+: Corpo ───────────────────────────────────────────────────────
  const lines = text.split('\n');

  // Descarta a seção de capa do texto (até LISTA DE SIGLAS ou 1. OBJETIVO)
  const bodyIdx = lines.findIndex(l =>
    /^LISTA DE SIGLAS/i.test(l.trim()) ||
    /^1\.\s+OBJETIVO/i.test(l.trim()),
  );
  const bodyLines = bodyIdx >= 0 ? lines.slice(bodyIdx) : lines;

  doc.addPage();
  let pageNum = 2;
  let y = addBodyHeader(doc, fd, calc, W, pageNum);

  const newPage = (): number => {
    addBodyFooter(doc, fd, W, H, pageNum++);
    doc.addPage();
    return addBodyHeader(doc, fd, calc, W, pageNum);
  };

  const ensureSpace = (need: number) => {
    if (y + need > H - MB - 4) y = newPage();
  };

  // Buffer de tabela
  let tableRows: string[][] = [];
  let tableTitle = '';

  const flushTable = () => {
    if (tableRows.length === 0) return;
    if (tableTitle) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8.5);
      st(doc, CSL); doc.text(tableTitle, ML, y); st(doc, CBK);
      doc.setFont('helvetica', 'normal');
      y += 5;
    }
    y = renderTable(doc, tableRows, CW, y, newPage);
    tableRows = []; tableTitle = '';
  };

  for (const rawLine of bodyLines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // ── Linha de tabela ────────────────────────────────────────────────────────
    if (/^\|/.test(trimmed)) {
      // Detectar separador |---|---|
      const parts = trimmed.split('|').slice(1, -1);
      const isSep = parts.every(p => /^[-: ]+$/.test(p));
      if (!isSep && parts.some(p => p.trim().length > 0)) {
        tableRows.push(parts.map(p => p.trim()));
      }
      continue;
    }

    // Linha não-tabela: flush
    if (tableRows.length > 0) flushTable();

    // ── Título de tabela ───────────────────────────────────────────────────────
    if (/^Tabela\s+\d+/i.test(trimmed)) {
      tableTitle = trimmed;
      continue;
    }

    // ── Divisor de seção `---...` ─────────────────────────────────────────────
    if (/^-{10,}/.test(trimmed) || /^═{10,}/.test(trimmed)) {
      sd(doc, CG); doc.setLineWidth(0.25);
      doc.line(ML, y, W - MR, y);
      doc.setLineWidth(0.2); sd(doc, CGR);
      y += 4;
      continue;
    }

    // ── Seção principal `N. TÍTULO` ──────────────────────────────────────────
    if (/^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(trimmed) && !trimmed.includes('INSERIR')) {
      ensureSpace(18);
      y += 2;
      sf(doc, CG); sd(doc, CG);
      doc.rect(ML, y - 5, CW, 8.5, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      st(doc, CWT);
      doc.text(trimmed, ML + 2, y);
      st(doc, CBK);
      y += 8;
      continue;
    }

    // ── Subseção `N.N.` ───────────────────────────────────────────────────────
    if (/^\d+\.\d+\.?\s+\w/.test(trimmed)) {
      ensureSpace(12);
      y += 1;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      st(doc, CGD);
      doc.text(trimmed, ML, y);
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += 6;
      continue;
    }

    // ── Sub-subseção `N.N.N.` ─────────────────────────────────────────────────
    if (/^\d+\.\d+\.\d+\.?\s+\w/.test(trimmed)) {
      ensureSpace(10);
      y += 0.5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      st(doc, CSL);
      doc.text(trimmed, ML, y);
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += 5.5;
      continue;
    }

    // ── Checkbox □ ────────────────────────────────────────────────────────────
    if (/^□\s/.test(trimmed)) {
      const content = trimmed.replace(/^□\s*/, '');
      ensureSpace(7);
      sd(doc, [110, 110, 110]); doc.setLineWidth(0.3);
      doc.rect(ML, y - 3.5, 3.5, 3.5);
      doc.setLineWidth(0.2); sd(doc, CGR);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      st(doc, CBK);
      const wrapped = doc.splitTextToSize(content, CW - 7);
      wrapped.forEach((wl: string, i: number) => {
        if (i > 0) ensureSpace(5);
        doc.text(wl, ML + 5.5, y + i * 5);
      });
      y += wrapped.length * 5;
      continue;
    }

    // ── Bullet • ──────────────────────────────────────────────────────────────
    if (/^[•●]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[•●]\s*/, '');
      ensureSpace(6);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      st(doc, CBK);
      const wrapped = doc.splitTextToSize(content, CW - 6);
      doc.text('•', ML + 1, y);
      wrapped.forEach((wl: string, i: number) => {
        if (i > 0) ensureSpace(5);
        doc.text(wl, ML + 5, y + i * 5.5);
      });
      y += wrapped.length * 5.5;
      continue;
    }

    // ── Status line ✔ / ⚠ ────────────────────────────────────────────────────
    if (/^[✔⚠]/.test(trimmed)) {
      const isOk = trimmed.startsWith('✔');
      const content = trimmed.replace(/^[✔⚠]\s*/, '');
      ensureSpace(6);
      doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8.5);
      st(doc, isOk ? COK : CAM);
      const wrapped = doc.splitTextToSize((isOk ? '[OK] ' : '[!] ') + content, CW);
      doc.text(wrapped, ML, y);
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += wrapped.length * 5;
      continue;
    }

    // ── Cabeçalho ALL-CAPS (RESPONSÁVEL TÉCNICO, LISTA DE SIGLAS, etc.) ──────
    if (
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 8 &&
      /[A-Z]/.test(trimmed) &&
      !/\d/.test(trimmed) &&
      !trimmed.includes(':') &&
      !/\s{3,}/.test(trimmed) &&
      !/[|_=─]/.test(trimmed)
    ) {
      ensureSpace(14);
      y += 2;
      sf(doc, CGB2); sd(doc, CGR);
      doc.rect(ML, y - 4.5, CW, 7.5, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      st(doc, CSL);
      doc.text(trimmed, ML + 2, y);
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += 7;
      continue;
    }

    // ── Caracteres de caixas (placa de advertência) ──────────────────────────
    if (/^[┌└├┤┬┴┼│─╔╗╚╝╠╣╦╩╬═]/.test(trimmed)) {
      ensureSpace(6);
      doc.setFont('courier', 'normal'); doc.setFontSize(8);
      st(doc, CSL);
      doc.text(trimmed, W / 2, y, { align: 'center' });
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += 5;
      continue;
    }

    // ── Linha de fórmula (indentada ou com = e ×) ─────────────────────────────
    if (/^\s{2,}/.test(line) && trimmed.length > 0 && (trimmed.includes(' = ') || trimmed.includes('×'))) {
      ensureSpace(6);
      doc.setFont('courier', 'normal'); doc.setFontSize(8);
      st(doc, CSL);
      const wrapped = doc.splitTextToSize(trimmed, CW - 8);
      doc.text(wrapped, ML + 6, y);
      doc.setFont('helvetica', 'normal'); st(doc, CBK);
      y += wrapped.length * 5;
      continue;
    }

    // ── Linha vazia ───────────────────────────────────────────────────────────
    if (trimmed === '') {
      y += 2.5;
      continue;
    }

    // ── Texto de corpo ────────────────────────────────────────────────────────
    ensureSpace(6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    st(doc, CBK);
    const wrapped = doc.splitTextToSize(trimmed, CW);
    wrapped.forEach((wl: string, i: number) => {
      if (i > 0) ensureSpace(5.5);
      doc.text(wl, ML, y + i * 5.5);
    });
    y += wrapped.length * 5.5;
  }

  // Flush tabela final
  if (tableRows.length > 0) flushTable();

  // Rodapé da última página + warning RT
  addBodyFooter(doc, fd, W, H, pageNum);

  const warY = H - MB - 6;
  sf(doc, [200, 30, 30]);
  doc.rect(ML, warY, CW, 7, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  st(doc, CWT);
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA',
    W / 2, warY + 4.5, { align: 'center' },
  );
  st(doc, CBK);
}
