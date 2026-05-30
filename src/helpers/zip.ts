/**
 * zip.ts — Empacotamento do dossiê completo em arquivo ZIP
 *
 * Coleta todos os documentos (prancha SVG + 4 PDFs) e entrega
 * um único arquivo .zip ao usuário, em vez de 5 downloads sequenciais.
 */

import JSZip from 'jszip';
import type { FormData, Calculos, DocsGerados } from '../types';
import { makeFilename } from './filename';
import {
  getBlobProcuracao,
  getBlobFormulario,
  getBlobPendencias,
  getBlobMemorial,
} from './export';

/**
 * Gera e dispara o download do dossiê completo em formato ZIP.
 *
 * @param fd          - Dados do formulário
 * @param calc        - Cálculos técnicos do motor JS
 * @param memorialIA  - Texto do memorial (gerado pela IA ou modo básico)
 * @param docsGerados - Estado de documentos gerados (para checklist de pendências)
 * @param svgString   - Prancha elétrica serializada como SVG (string XML)
 */
export async function exportarDossieZip(
  fd: FormData,
  calc: Calculos,
  memorialIA: string,
  docsGerados: DocsGerados,
  svgString: string,
): Promise<void> {
  const zip = new JSZip();

  // ── Grupo B: Prancha elétrica (SVG) ──────────────────────────
  if (svgString) {
    zip.file(makeFilename('prancha', fd, 'svg'), svgString);
  }

  // ── Grupo B: Memorial técnico-descritivo ─────────────────────
  const { blob: memBlob, filename: memName } = getBlobMemorial(fd, calc, memorialIA);
  zip.file(memName, memBlob);

  // ── Grupo A: Procuração específica ───────────────────────────
  const { blob: procBlob, filename: procName } = getBlobProcuracao(fd, calc);
  zip.file(procName, procBlob);

  // ── Grupo A: Formulário de acesso CEEE ───────────────────────
  const { blob: formBlob, filename: formName } = getBlobFormulario(fd, calc);
  zip.file(formName, formBlob);

  // ── Relatório de pendências ───────────────────────────────────
  const { blob: pendBlob, filename: pendName } = getBlobPendencias(fd, calc, docsGerados);
  zip.file(pendName, pendBlob);

  // ── Gerar e disparar download do ZIP ─────────────────────────
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = makeFilename('dossie_instalight', fd, 'zip');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Pequeno atraso antes de revogar para garantir que o download iniciou
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
