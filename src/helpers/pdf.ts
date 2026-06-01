/**
 * pdf.ts — Helpers para geração de PDFs com jsPDF
 *
 * Funções reutilizadas por todas as abas e pela exportação em massa.
 * A IA nunca chama estas funções diretamente — apenas os componentes React.
 */

import jsPDF from 'jspdf';
import type { FormData } from '../types';

/** Cria um novo documento jsPDF. */
export const makePDF = (
  orient: 'p' | 'l' = 'p',
  fmt: string | number[] = 'a4',
): jsPDF => new jsPDF({ orientation: orient, unit: 'mm', format: fmt });

/** Cabeçalho padrão Instalight (fundo escuro + faixa laranja). */
export const pdfHeader = (doc: jsPDF, fd: FormData): void => {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFillColor(120, 184, 58);
  doc.rect(0, 20, W, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GD Docs — Instalight', 14, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const peTag = fd.numProjeto ? ` | PE: ${fd.numProjeto}` : '';
  const sub = fd.nomeCliente
    ? `Cliente: ${fd.nomeCliente} | UC: ${fd.codigoUC || '—'}${peTag}`
    : 'Sistema de Geração Distribuída';
  doc.text(sub, 14, 18);
  doc.setTextColor(30, 30, 30);
};

/**
 * Converte o SVGSVGElement da prancha em Blob PDF A3 landscape.
 * Usa serialização nativa SVG→Canvas, SEM html2canvas
 * (evita o erro "unable to find element in cloned iframe").
 */
export async function pranchaSvgToPdfBlob(svgEl: SVGSVGElement): Promise<Blob> {
  const W = 1600, H = 980, scale = 1.5;

  // Serializar SVG garantindo namespace (necessário para Image.src funcionar)
  const raw = new XMLSerializer().serializeToString(svgEl);
  const svgStr = raw.includes('xmlns=')
    ? raw
    : raw.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas context unavailable')); return; }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const doc  = makePDF('l', 'a3');
      const pW   = doc.internal.pageSize.getWidth();
      const pH   = doc.internal.pageSize.getHeight();
      doc.addImage(imgData, 'JPEG', 5, 5, pW - 10, pH - 10);
      resolve(doc.output('blob'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao renderizar SVG para PDF')); };
    img.src = url;
  });
}

/** Rodapé padrão com normas, RT, cidade e paginação. */
export const pdfFooter = (
  doc: jsPDF,
  fd: FormData,
  page: number,
  total: number,
): void => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(
    'Elaborado conforme ABNT NBR 16690, REN ANEEL 1.000/2021 e Lei Federal 14.300/2022',
    14,
    H - 6,
  );
  doc.text(
    `${fd.cidade || 'Porto Alegre'} | ${fd.dataproject || ''} | RT: ${fd.nomeResponsavel || '—'} | Página ${page}/${total}`,
    W - 14,
    H - 6,
    { align: 'right' },
  );
};

/**
 * Faixa vermelha de aviso de assinatura RT.
 * Chamar imediatamente antes de pdfFooter em cada exportação.
 * Garante que nenhum documento saia sem o lembrete visível.
 */
export const pdfRTWarning = (doc: jsPDF): void => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(220, 38, 38);                         // red-600
  doc.rect(14, H - 31, W - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA',
    W / 2,
    H - 26.5,
    { align: 'center' },
  );
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
};

/**
 * Renderiza um bloco de texto multi-linha no PDF,
 * com suporte a negrito (linha envolta em `**...**`)
 * e quebra de página automática.
 *
 * @returns Y final após renderizar todo o bloco.
 */
export const addTextBlock = (
  doc: jsPDF,
  text: string,
  marginL: number,
  marginR: number,
  startY: number,
  lineH = 5.5,
): number => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const maxW = W - marginL - marginR;
  let y = startY;

  // Mapeamento de caracteres especiais não suportados pelos fontes jsPDF padrão
  const sanitize = (s: string) => s
    .replace(/━/g, '-').replace(/─/g, '-').replace(/═/g, '=')
    .replace(/°/g, 'o').replace(/²/g, '2').replace(/³/g, '3')
    .replace(/√/g, 'sqrt').replace(/×/g, 'x').replace(/÷/g, '/')
    .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=')
    .replace(/Ω/g, 'Ohm').replace(/µ/g, 'u').replace(/π/g, 'pi')
    .replace(/→/g, '->').replace(/←/g, '<-').replace(/↔/g, '<->')
    .replace(/✓/g, '[OK]').replace(/✔/g, '[OK]').replace(/✗/g, '[X]')
    .replace(/⚠/g, '[!]').replace(/⋯/g, '...');

  text.split('\n').forEach((raw) => {
    const bold = raw.startsWith('**') && raw.endsWith('**');
    const clean = sanitize(bold ? raw.slice(2, -2) : raw);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const wrapped = doc.splitTextToSize(clean, maxW) as string[];
    wrapped.forEach((line: string) => {
      if (y > H - 20) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, marginL, y);
      y += lineH;
    });
    if (bold) doc.setFont('helvetica', 'normal');
  });

  return y;
};
