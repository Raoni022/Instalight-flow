/**
 * pdf.ts — Helpers para geração de PDFs com jsPDF
 *
 * Funções reutilizadas por todas as abas e pela exportação em massa.
 * A IA nunca chama estas funções diretamente — apenas os componentes React.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  doc.setFillColor(249, 115, 22);
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
 * Reutilizado pelo ZIP e pelo botão "Exportar PDF" do DiagramasTab.
 */
export async function pranchaSvgToPdfBlob(svgEl: SVGSVGElement): Promise<Blob> {
  const canvas = await html2canvas(svgEl as unknown as HTMLElement, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: 'white',
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const doc = makePDF('l', 'a3');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.addImage(imgData, 'JPEG', 5, 5, W - 10, H - 10);
  return doc.output('blob');
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

  text.split('\n').forEach((raw) => {
    const bold = raw.startsWith('**') && raw.endsWith('**');
    const clean = bold ? raw.slice(2, -2) : raw;
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
