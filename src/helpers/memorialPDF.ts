/**
 * memorialPDF.ts — Monta o DocSpec do Memorial Técnico-Descritivo
 *
 * Constrói a capa + os blocos (via parseRichText do template) e delega a
 * renderização para pdfKit (PDF) ou docxRender (Word). buildMemorialPDFPro()
 * é mantido para compatibilidade com a aba Memorial.
 */

import jsPDF from 'jspdf';
import type { FormData, Calculos } from '../types';
import { parseRichText, type DocSpec, type CoverSpec, type Block } from './docModel';
import { renderSpecToPdf } from './pdfKit';

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
    [`Nº ${fd.tipoResponsabilidade || 'TRT'}`, fd.numART || '[INSERIR NÚMERO]'],
    ['Empresa', fd.nomeEmpresa || 'Instalight Energia Solar'],
  ];

  return {
    brandTitle: 'INSTALIGHT ENERGIA SOLAR',
    brandSubtitle: 'Documentação Técnica para Geração Distribuída Fotovoltaica',
    docTitle: 'MEMORIAL TÉCNICO-DESCRITIVO',
    docSubtitle: `REV 06 — ${mes}/${ano}  ·  Conforme NT.00020.EQTL-06 Anexo III`,
    highlight: {
      bannerTitle: 'SISTEMA FOTOVOLTAICO CONECTADO À REDE',
      bigLine: `${tipoUp}${calc.enq.toUpperCase()} DE ${calc.kWp} kWp`,
      midLine: `Conectado à rede em ${tensao}  ·  ${fd.tipoLigacao}  ·  ${calc.kWtCA} kW (CA)`,
      smallLine: `Caracterizado como: ${fd.tipoCaracterizacao || 'Autoconsumo Local'}  (Lei Federal 14.300/2022)`,
    },
    infoBoxes: [
      { title: 'UNIDADE CONSUMIDORA', rows: ucRows },
      { title: 'RESPONSÁVEL TÉCNICO', rows: rtRows },
    ],
    footerNote: `${fd.cidade || 'Porto Alegre'} — RS, ${dataObj.toLocaleDateString('pt-BR')}`,
  };
}

/** Monta o DocSpec do memorial (capa + corpo parseado). */
export function buildMemorialSpec(fd: FormData, calc: Calculos, text: string): DocSpec {
  let blocks: Block[];
  if (text && text.trim()) {
    const lines = text.split('\n');
    const bodyIdx = lines.findIndex((l) =>
      /^LISTA DE SIGLAS/i.test(l.trim()) || /^1\.\s+OBJETIVO/i.test(l.trim()),
    );
    blocks = parseRichText((bodyIdx >= 0 ? lines.slice(bodyIdx) : lines).join('\n'));
  } else {
    blocks = [{ t: 'para', text: 'Memorial não gerado — acesse a aba Memorial para gerá-lo.' }];
  }

  return {
    cover: buildCoverSpec(fd, calc),
    chrome: {
      title: 'Memorial Técnico-Descritivo',
      subtitle: `${(fd.nomeCliente || '—').substring(0, 30)}  ·  UC ${fd.codigoUC || '—'}  ·  ${calc.kWp} kWp`,
      company: fd.nomeEmpresa || 'Instalight Energia Solar',
    },
    blocks,
    filenameKey: 'memorial',
  };
}

/** Renderiza o memorial diretamente em um doc jsPDF (compat. aba Memorial). */
export function buildMemorialPDFPro(doc: jsPDF, fd: FormData, calc: Calculos, text: string): void {
  renderSpecToPdf(doc, buildMemorialSpec(fd, calc, text));
}
