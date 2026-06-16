/**
 * docxRender.ts — Renderiza um DocSpec (docModel) em .docx editável.
 *
 * Usa estilos nativos do Word (Heading 1/2, Normal, tabelas reais) para que o
 * projetista edite livremente. Visual alinhado ao PDF: preto + verde discreto,
 * tabelas cinza-claro, sem blocos coloridos.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType,
} from 'docx';
import type { Block, DocSpec, CoverSpec } from './docModel';

const GREEN = '5A9628';
const GREEN_DARK = '376419';
const BLACK = '1A1A1A';
const SLATE = '46505F';
const GRAY_HEADER = 'EEEEEE';
const GRAY_ROW = 'F8F9FA';
const GRAY_BORDER = 'C8CDD2';
const RED_DARK = 'AA2323';
const AMBER_DARK = '8C5A00';

const thin = (color = GRAY_BORDER) => ({ style: BorderStyle.SINGLE, size: 4, color });
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

// ── Tabela ────────────────────────────────────────────────────────────────────
function docxTable(rows: string[][]): Table {
  const nCols = Math.max(...rows.map((r) => r.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: thin(), bottom: thin(), left: thin(), right: thin(),
      insideHorizontal: thin(), insideVertical: thin(),
    },
    rows: rows.map((cells, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        children: Array.from({ length: nCols }, (_, ci) =>
          new TableCell({
            shading: ri === 0
              ? { type: ShadingType.SOLID, color: GRAY_HEADER, fill: GRAY_HEADER }
              : (ri % 2 === 0 ? { type: ShadingType.SOLID, color: GRAY_ROW, fill: GRAY_ROW } : undefined),
            margins: { top: 30, bottom: 30, left: 60, right: 60 },
            children: [new Paragraph({
              children: [new TextRun({ text: (cells[ci] ?? '').trim(), bold: ri === 0, size: 15, color: BLACK })],
            })],
          }),
        ),
      }),
    ),
  });
}

// ── Bloco → elementos docx ────────────────────────────────────────────────────
function blockToDocx(blk: Block): (Paragraph | Table)[] {
  switch (blk.t) {
    case 'section':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_1, spacing: { before: 180, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN } },
        children: [new TextRun({ text: blk.text, bold: true, size: 22, color: BLACK })],
      })];
    case 'subsection':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 40 },
        children: [new TextRun({ text: blk.text, bold: true, size: 19, color: GREEN_DARK })],
      })];
    case 'caps':
      return [new Paragraph({
        spacing: { before: 120, after: 40 },
        shading: { type: ShadingType.SOLID, color: GRAY_HEADER, fill: GRAY_HEADER },
        children: [new TextRun({ text: blk.text, bold: true, size: 18, color: BLACK })],
      })];
    case 'para':
      return [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: blk.text, size: 18, color: BLACK })] })];
    case 'bullet':
      return [new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [new TextRun({ text: blk.text, size: 18, color: BLACK })] })];
    case 'check':
      return [new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: '☐  ' + blk.text, size: 17, color: BLACK })] })];
    case 'status':
      return [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: (blk.ok ? '[OK] ' : '[!] ') + blk.text, bold: true, size: 17, color: blk.ok ? GREEN_DARK : AMBER_DARK })] })];
    case 'formula':
      return [new Paragraph({ spacing: { after: 20 }, indent: { left: 280 }, children: [new TextRun({ text: blk.text, font: 'Courier New', size: 16, color: SLATE })] })];
    case 'mono':
      return [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: blk.text, font: 'Courier New', size: 16, color: SLATE })] })];
    case 'tableTitle':
      return [new Paragraph({ spacing: { before: 80, after: 30 }, children: [new TextRun({ text: blk.text, bold: true, italics: true, size: 17, color: SLATE })] })];
    case 'table':
      return [docxTable(blk.rows), new Paragraph({ spacing: { after: 80 }, children: [] })];
    case 'kv':
      return [new Paragraph({
        spacing: { after: 30 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: GRAY_BORDER } },
        children: [
          new TextRun({ text: blk.label + ': ', bold: true, size: 18, color: SLATE }),
          new TextRun({ text: blk.value, size: 18, color: BLACK }),
        ],
      })];
    case 'checkitem':
      return [new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${blk.id} — ${blk.name}`, bold: true, size: 18, color: BLACK }),
          new TextRun({ text: blk.done ? '   [x] GERADO' : '   [ ] PENDENTE', bold: true, size: 16, color: blk.done ? GREEN_DARK : AMBER_DARK }),
          ...(blk.done ? [] : [new TextRun({ text: `\nComo obter: ${blk.como}`, italics: true, size: 15, color: SLATE, break: 1 })]),
        ],
      })];
    case 'noteBox':
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: thin(AMBER_DARK), bottom: thin(AMBER_DARK), left: thin(AMBER_DARK), right: thin(AMBER_DARK), insideHorizontal: noBorder, insideVertical: noBorder },
        rows: [new TableRow({
          children: [new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              ...(blk.title ? [new Paragraph({ children: [new TextRun({ text: blk.title, bold: true, size: 16, color: AMBER_DARK })] })] : []),
              ...blk.lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 15, color: BLACK })] })),
            ],
          })],
        })],
      }), new Paragraph({ spacing: { after: 80 }, children: [] })];
    case 'sigrule':
      return [new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: '_______________________________________', color: BLACK })] })];
    case 'divider':
      return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: GRAY_BORDER } }, spacing: { after: 40 }, children: [] })];
    case 'gap':
      return [new Paragraph({ spacing: { after: 40 }, children: [] })];
  }
}

// ── Capa ────────────────────────────────────────────────────────────────────
function coverToDocx(cover: CoverSpec): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const center = (runs: TextRun[], spacing = 80) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: spacing }, children: runs });

  out.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  out.push(center([new TextRun({ text: cover.brandTitle || 'INSTALIGHT ENERGIA SOLAR', bold: true, size: 22, color: GREEN_DARK })], 40));
  if (cover.brandSubtitle) out.push(center([new TextRun({ text: cover.brandSubtitle, size: 16, color: SLATE })], 240));
  out.push(center([new TextRun({ text: cover.docTitle, bold: true, size: 40, color: BLACK })], 60));
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GREEN } }, spacing: { after: 120 }, children: [] }));
  if (cover.docSubtitle) out.push(center([new TextRun({ text: cover.docSubtitle, size: 18, color: SLATE })], 240));

  if (cover.highlight) {
    const h = cover.highlight;
    out.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: thin(), bottom: thin(), left: thin(), right: thin(), insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({ children: [new TableCell({
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          center([new TextRun({ text: h.bannerTitle, bold: true, size: 16, color: SLATE })], 60),
          center([new TextRun({ text: h.bigLine, bold: true, size: 28, color: BLACK })], 40),
          ...(h.midLine ? [center([new TextRun({ text: h.midLine, size: 19, color: BLACK })], 30)] : []),
          ...(h.smallLine ? [center([new TextRun({ text: h.smallLine, size: 17, color: SLATE })], 0)] : []),
        ],
      })] })],
    }));
    out.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
  }

  for (const box of cover.infoBoxes || []) {
    out.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: thin(), bottom: thin(), left: thin(), right: thin(), insideHorizontal: thin(), insideVertical: thin() },
      rows: [
        new TableRow({ children: [new TableCell({
          columnSpan: 2, shading: { type: ShadingType.SOLID, color: GRAY_HEADER, fill: GRAY_HEADER },
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: box.title, bold: true, size: 17, color: BLACK })] })],
        })] }),
        ...box.rows.map((r) => new TableRow({ children: [
          new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, margins: { top: 30, bottom: 30, left: 80, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: r[0], bold: true, size: 16, color: SLATE })] })] }),
          new TableCell({ width: { size: 68, type: WidthType.PERCENTAGE }, margins: { top: 30, bottom: 30, left: 60, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: r[1], size: 16, color: BLACK })] })] }),
        ] })),
      ],
    }));
    out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }

  if (cover.footerNote) out.push(center([new TextRun({ text: cover.footerNote, italics: true, size: 18, color: SLATE })], 0));
  // Quebra de página após a capa
  out.push(new Paragraph({ children: [], pageBreakBefore: true }));
  return out;
}

// ── Documento ─────────────────────────────────────────────────────────────────
export function renderSpecToDocxDocument(spec: DocSpec): Document {
  const children: (Paragraph | Table)[] = [];

  if (spec.cover) {
    children.push(...coverToDocx(spec.cover));
  } else if (spec.title) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: spec.title.title, bold: true, size: 30, color: BLACK })] }));
    if (spec.title.subtitle) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: spec.title.subtitle, size: 17, color: SLATE })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: GREEN } }, spacing: { after: 160 }, children: [] }));
  }

  for (const blk of spec.blocks) children.push(...blockToDocx(blk));

  // Aviso RT no fim
  children.push(new Paragraph({
    spacing: { before: 200 },
    border: { top: thin(RED_DARK), bottom: thin(RED_DARK), left: thin(RED_DARK), right: thin(RED_DARK) },
    children: [new TextRun({ text: 'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA', bold: true, size: 14, color: RED_DARK })],
  }));

  return new Document({
    creator: 'Instalight Flow',
    title: spec.cover?.docTitle || spec.title?.title || 'Documento',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 18, color: BLACK } } },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children,
    }],
  });
}

/** Gera o Blob .docx (navegador). */
export async function docxBlob(spec: DocSpec): Promise<Blob> {
  return Packer.toBlob(renderSpecToDocxDocument(spec));
}
