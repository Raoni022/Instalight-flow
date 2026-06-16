/**
 * zip.ts — Empacotamento do dossiê completo em arquivo ZIP
 *
 * Coleta todos os documentos (prancha SVG + prancha PDF + 4 PDFs) e entrega
 * um único arquivo .zip ao usuário, em vez de downloads sequenciais.
 */

import JSZip from 'jszip';
import type { FormData, Calculos, DocsGerados } from '../types';
import { makeFilename } from './filename';
import {
  getBlobProcuracao,
  getBlobFormulario,
  getBlobPendencias,
  getBlobMemorial,
  getBlobListaRateio,
  getBlobInstrumento,
  getDocxProcuracao,
  getDocxFormulario,
  getDocxPendencias,
  getDocxMemorial,
  getDocxListaRateio,
  getDocxInstrumento,
} from './export';

/**
 * Gera e dispara o download do dossiê completo em formato ZIP.
 *
 * @param fd             - Dados do formulário
 * @param calc           - Cálculos técnicos do motor JS
 * @param memorialIA     - Texto do memorial (gerado pela IA ou modo básico)
 * @param docsGerados    - Estado de documentos gerados (para checklist de pendências)
 * @param svgString      - Prancha elétrica serializada como SVG (string XML)
 * @param pranchaPdfBlob - Prancha elétrica em PDF A3 (opcional, gerado externamente)
 */
export async function exportarDossieZip(
  fd: FormData,
  calc: Calculos,
  memorialIA: string,
  docsGerados: DocsGerados,
  svgString: string,
  pranchaPdfBlob?: Blob,
): Promise<void> {
  const zip = new JSZip();

  // ── Grupo B: Prancha elétrica (SVG) ──────────────────────────
  if (svgString) {
    zip.file(makeFilename('prancha', fd, 'svg'), svgString);
  }

  // ── Grupo B: Prancha elétrica (PDF A3) ───────────────────────
  if (pranchaPdfBlob) {
    zip.file(makeFilename('prancha', fd, 'pdf'), pranchaPdfBlob);
  }

  // ── Documentos em PDF (pasta) e Word editável (pasta) ────────
  // Cada documento entra como PDF (protocolo) e .docx (projetista editar).
  const pdfDir = zip.folder('PDF');
  const wordDir = zip.folder('Word (editavel)');
  const addDoc = (pdf: { blob: Blob; filename: string }, docx: { blob: Blob; filename: string }) => {
    (pdfDir ?? zip).file(pdf.filename, pdf.blob);
    (wordDir ?? zip).file(docx.filename, docx.blob);
  };

  addDoc(getBlobMemorial(fd, calc, memorialIA), await getDocxMemorial(fd, calc, memorialIA));
  addDoc(getBlobProcuracao(fd, calc), await getDocxProcuracao(fd, calc));
  addDoc(getBlobFormulario(fd, calc), await getDocxFormulario(fd, calc));

  // Grupo D — condicional (caracterização exige rateio ou já gerados)
  const exigeRateio = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC']
    .includes(fd.tipoCaracterizacao);
  if (exigeRateio || docsGerados.listaRateio) {
    addDoc(getBlobListaRateio(fd, calc), await getDocxListaRateio(fd, calc));
  }
  if (exigeRateio || docsGerados.instrumentoJuridico) {
    addDoc(getBlobInstrumento(fd, calc), await getDocxInstrumento(fd, calc));
  }

  addDoc(getBlobPendencias(fd, calc, docsGerados), await getDocxPendencias(fd, calc, docsGerados));

  // ── Gerar e disparar download do ZIP ─────────────────────────
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = makeFilename('dossie_instalight', fd, 'zip');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
