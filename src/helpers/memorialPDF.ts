/**
 * memorialPDF.ts — Renderizador do Memorial Técnico-Descritivo
 *
 * Converte o template de texto (memorial.ts) em um PDF profissional usando
 * os primitivos compartilhados de pdfKit.ts. O parser classifica cada linha
 * (seção, subseção, tabela, checkbox, bullet, fórmula…) e despacha para o
 * primitivo correspondente. As tabelas usam o renderizador de pdfKit, que
 * trata células multilinha e colunas largas (Levantamento de Carga, Tabela 4).
 */

import jsPDF from 'jspdf';
import type { FormData, Calculos } from '../types';
import {
  PdfFlow, greenChrome, coverPage, rtWarningBanner,
  sectionBar, subSection, capsHeader, divider, paragraph,
  bullet, checkbox, statusLine, formula, monoCentered,
  table, tableTitle, type CoverSpec,
} from './pdfKit';

// ── Capa ──────────────────────────────────────────────────────────────────────
function buildCoverSpec(fd: FormData, calc: Calculos): CoverSpec {
  const dataObj = fd.dataproject ? new Date(fd.dataproject + 'T12:00:00') : new Date();
  const mes = dataObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const ano = dataObj.getFullYear();
  const tensao = fd.tipoLigacao === 'Trifásico' ? '380/220 V' : '220 V';
  const tipoUp = fd.tipoInstalacao === 'Ampliação' ? 'AMPLIAÇÃO — ' : '';

  const ucRows: [string, string][] = [
    ['Titular', fd.nomeCliente || '[INSERIR]'],
    [fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ', fd.cpfCnpj || '[INSERIR]'],
    ...(fd.tipoPessoa === 'fisica' && fd.rgCliente ? [['RG', fd.rgCliente] as [string, string]] : []),
    ['Código UC', fd.codigoUC || '[INSERIR]'],
    ['Endereço', (fd.endereco || '[INSERIR]').substring(0, 60)],
    ['Cidade / UF', `${fd.cidade || 'Porto Alegre'} / RS`],
  ];
  const rtRows: [string, string][] = [
    ['Nome', fd.nomeResponsavel || '[INSERIR]'],
    ['Profissão', fd.profissaoRT || '[INSERIR PROFISSÃO]'],
    ['CRT/CREA', fd.numeroCRT || '[INSERIR]'],
    [(fd.tipoResponsabilidade || 'TRT') + '/ART', fd.numART || '[INSERIR NÚMERO]'],
    ['Empresa', fd.nomeEmpresa || 'Instalight Energia Solar'],
  ];

  return {
    brandTitle: 'INSTALIGHT ENERGIA SOLAR',
    brandSubtitle: 'Documentação Técnica para Geração Distribuída Fotovoltaica',
    docTitle: 'MEMORIAL TÉCNICO-DESCRITIVO',
    docSubtitle: `REV — ${mes}/${ano}  |  Conforme NT.00020.EQTL-06 REV 06 (12/2025)`,
    highlight: {
      bannerTitle: 'SISTEMA FOTOVOLTAICO CONECTADO À REDE',
      bigLine: `${tipoUp}${calc.enq.toUpperCase()} DE ${calc.kWp} kWp`,
      midLine: `Conectado à Rede em ${tensao}  |  ${fd.tipoLigacao}  |  ${calc.kWtCA} kW (CA)`,
      smallLine: `Caracterizado como: ${fd.tipoCaracterizacao || 'Autoconsumo Local'}  (Lei Federal 14.300/2022)`,
    },
    infoBoxes: [
      { title: 'UNIDADE CONSUMIDORA', rows: ucRows },
      { title: 'RESPONSÁVEL TÉCNICO', rows: rtRows },
    ],
    footerNote: `${fd.cidade || 'Porto Alegre'} — RS, ${dataObj.toLocaleDateString('pt-BR')}`,
  };
}

// ── Renderer principal ────────────────────────────────────────────────────────
export function buildMemorialPDFPro(
  doc: jsPDF,
  fd: FormData,
  calc: Calculos,
  text: string,
): void {
  // Página 1: capa
  coverPage(doc, buildCoverSpec(fd, calc));

  // Páginas 2+: corpo
  doc.addPage();
  const chrome = greenChrome({
    title: 'MEMORIAL TÉCNICO-DESCRITIVO',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 30)}  |  UC: ${fd.codigoUC || '—'}  |  ${calc.kWp} kWp  |  NT.00020.EQTL-06 REV 06`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  });
  const flow = new PdfFlow(doc, chrome);

  // Descartar a seção de capa do texto (até LISTA DE SIGLAS ou 1. OBJETIVO)
  const lines = text.split('\n');
  const bodyIdx = lines.findIndex((l) =>
    /^LISTA DE SIGLAS/i.test(l.trim()) || /^1\.\s+OBJETIVO/i.test(l.trim()),
  );
  const bodyLines = bodyIdx >= 0 ? lines.slice(bodyIdx) : lines;

  // Buffer de tabela
  let tblRows: string[][] = [];
  let pendingTableTitle = '';

  const flushTable = (): void => {
    if (tblRows.length === 0) return;
    if (pendingTableTitle) { tableTitle(flow, pendingTableTitle); pendingTableTitle = ''; }
    table(flow, tblRows);
    tblRows = [];
  };

  for (const rawLine of bodyLines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // Linha de tabela markdown
    if (/^\|/.test(trimmed)) {
      const parts = trimmed.split('|').slice(1, -1);
      const isSep = parts.every((p) => /^[-: ]+$/.test(p));
      if (!isSep && parts.some((p) => p.trim().length > 0)) {
        tblRows.push(parts.map((p) => p.trim()));
      }
      continue;
    }
    if (tblRows.length > 0) flushTable();

    // Título de tabela
    if (/^Tabela\s+\d+/i.test(trimmed)) { pendingTableTitle = trimmed; continue; }

    // Divisor de seção
    if (/^-{10,}/.test(trimmed) || /^═{10,}/.test(trimmed)) { divider(flow); continue; }

    // Seção principal "N. TÍTULO"
    if (/^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(trimmed) && !trimmed.includes('INSERIR')) {
      sectionBar(flow, trimmed); continue;
    }

    // Subseções "N.N" e "N.N.N" (com ou sem ponto final)
    if (/^\d+\.\d+(\.\d+)?\.?\s+\S/.test(trimmed)) { subSection(flow, trimmed); continue; }

    // Checkbox
    if (/^□\s/.test(trimmed)) { checkbox(flow, trimmed.replace(/^□\s*/, '')); continue; }

    // Bullet
    if (/^[•●]\s/.test(trimmed)) { bullet(flow, trimmed.replace(/^[•●]\s*/, '')); continue; }

    // Status ✔ / ⚠
    if (/^[✔✓]/.test(trimmed)) { statusLine(flow, trimmed.replace(/^[✔✓]\s*/, ''), true); continue; }
    if (/^⚠/.test(trimmed)) { statusLine(flow, trimmed.replace(/^⚠\s*/, ''), false); continue; }

    // Caracteres de caixa (placa de advertência)
    if (/^[┌└├┤┬┴┼│─╔╗╚╝╠╣╦╩╬═]/.test(trimmed)) { monoCentered(flow, trimmed); continue; }

    // Cabeçalho ALL-CAPS (LISTA DE SIGLAS, SUMÁRIO, RESPONSÁVEL TÉCNICO…)
    if (
      trimmed === trimmed.toUpperCase() && trimmed.length > 8 &&
      /[A-ZÁÉÍÓÚ]/.test(trimmed) && !/\d/.test(trimmed) &&
      !trimmed.includes(':') && !/\s{3,}/.test(trimmed) && !/[|_=─]/.test(trimmed)
    ) {
      capsHeader(flow, trimmed); continue;
    }

    // Fórmula (indentada com = ou ×)
    if (/^\s{2,}/.test(line) && trimmed.length > 0 && (trimmed.includes(' = ') || trimmed.includes('×'))) {
      formula(flow, trimmed); continue;
    }

    // Linha vazia
    if (trimmed === '') { flow.gap(2.5); continue; }

    // Corpo
    paragraph(flow, trimmed);
  }

  flushTable();
  flow.finish();
  rtWarningBanner(doc, flow);
}
