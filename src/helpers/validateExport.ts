/**
 * validateExport.ts — Portão de qualidade da exportação do dossiê.
 *
 * Decide se o dossiê final pode ser gerado. Bloqueia (erro crítico) quando
 * dados essenciais faltam ou documentos obrigatórios não foram gerados; emite
 * avisos (não bloqueantes) para pendências recomendadas. Função pura — sem IA,
 * sem efeitos colaterais.
 */

import type { FormData, Calculos, ValidationIssue, DocsGerados } from '../types';

export type DossieStatus = 'pronto' | 'pendente' | 'bloqueado' | 'aviso';

export interface DocStatus {
  id: string;
  nome: string;
  status: DossieStatus;
  motivo?: string;
  /** Aba para onde o usuário deve ir para resolver. */
  aba?: 'cliente' | 'diagramas' | 'memorial' | 'documentos' | 'resumo';
}

export interface ExportQuality {
  canExport: boolean;
  erros: string[];
  avisos: string[];
  documentosProntos: string[];
  documentosPendentes: string[];
  /** Status por documento (para o painel "Status do Dossiê"). */
  itens: DocStatus[];
}

const isNum = (v: number | null | undefined): boolean =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

export function validateExportQuality(
  fd: FormData,
  calc: Calculos,
  validacoes: ValidationIssue[],
  docsGerados: DocsGerados,
  memorialIA: string,
  temPrancha: boolean,
): ExportQuality {
  const erros: string[] = [];
  const avisos: string[] = [];
  const itens: DocStatus[] = [];

  // ── Dados cadastrais essenciais ─────────────────────────────────────────
  const faltando: string[] = [];
  if (!fd.nomeCliente?.trim()) faltando.push('Nome do cliente');
  if (!fd.codigoUC?.trim()) faltando.push('Código da UC');
  if (!fd.cpfCnpj?.trim()) faltando.push('CPF/CNPJ');
  if (!fd.endereco?.trim()) faltando.push('Endereço da UC');
  if (!fd.nomeResponsavel?.trim()) faltando.push('Responsável Técnico');
  if (!fd.numeroCRT?.trim()) faltando.push('CRT/CREA do RT');
  if (faltando.length) erros.push(`Dados obrigatórios em falta: ${faltando.join(', ')}.`);

  itens.push({
    id: 'cliente', nome: 'Dados do Cliente / UC', aba: 'cliente',
    status: faltando.length ? 'bloqueado' : 'pronto',
    motivo: faltando.length ? `Faltam: ${faltando.join(', ')}.` : undefined,
  });

  // ── Potências ────────────────────────────────────────────────────────────
  const ccOk = isNum(calc.kWp);
  const caOk = isNum(calc.kWtCA);
  if (!ccOk) erros.push('Potência CC inválida ou zero — verifique módulos (quantidade × Wp).');
  if (!caOk) erros.push('Potência CA inválida ou zero — verifique o(s) inversor(es).');

  // ── Erros críticos do validador elétrico ──────────────────────────────────
  const errosEletricos = validacoes.filter((v) => v.nivel === 'erro');
  errosEletricos.forEach((v) => erros.push(`[${v.cod}] ${v.msg}`));
  const avisosEletricos = validacoes.filter((v) => v.nivel === 'aviso');
  avisosEletricos.forEach((v) => avisos.push(`[${v.cod}] ${v.msg}`));

  // ── Memorial ───────────────────────────────────────────────────────────────
  const memOk = !!memorialIA && memorialIA.trim().length > 0;
  if (!memOk) erros.push('Memorial técnico não foi gerado (aba Memorial).');
  itens.push({
    id: 'memorial', nome: 'Memorial Técnico', aba: 'memorial',
    status: memOk ? 'pronto' : 'bloqueado',
    motivo: memOk ? undefined : 'Memorial ainda não foi gerado.',
  });

  // ── Diagramas / prancha ────────────────────────────────────────────────────
  if (!temPrancha) erros.push('Prancha/diagramas indisponível — verifique a aba Diagramas.');
  itens.push({
    id: 'diagramas', nome: 'Diagramas / Prancha', aba: 'diagramas',
    status: temPrancha ? 'pronto' : 'bloqueado',
    motivo: temPrancha ? undefined : 'Prancha não pôde ser gerada (dados incompletos?).',
  });

  // ── Procuração / Formulário (recomendados, não bloqueiam) ──────────────────
  itens.push({
    id: 'procuracao', nome: 'Procuração', aba: 'documentos',
    status: docsGerados.procuracao ? 'pronto' : 'aviso',
    motivo: docsGerados.procuracao ? undefined : 'Recomendado gerar na aba Documentos.',
  });
  itens.push({
    id: 'formulario', nome: 'Formulário CEEE', aba: 'documentos',
    status: docsGerados.formularioCEEE ? 'pronto' : 'aviso',
    motivo: docsGerados.formularioCEEE ? undefined : 'Recomendado gerar na aba Documentos.',
  });
  if (!docsGerados.procuracao) avisos.push('Procuração ainda não gerada.');
  if (!docsGerados.formularioCEEE) avisos.push('Formulário CEEE ainda não gerado.');

  // ── Ampliação: dados mínimos do sistema existente ─────────────────────────
  if (fd.tipoInstalacao === 'Ampliação') {
    const faltaExist: string[] = [];
    if (!isNum(calc.kWpExistente)) faltaExist.push('potência/módulos existentes');
    if (!fd.parecerAcessoAnterior?.trim()) faltaExist.push('parecer de acesso anterior');
    if (!fd.artTrtAnterior?.trim()) faltaExist.push('ART/TRT anterior');
    if (!isNum(calc.kWpExistente)) {
      erros.push('Ampliação sem dados do sistema existente (módulos/potência).');
    } else if (faltaExist.length) {
      avisos.push(`Ampliação: confirmar ${faltaExist.join(', ')}.`);
    }
    itens.push({
      id: 'ampliacao', nome: 'Dados de Ampliação', aba: 'cliente',
      status: !isNum(calc.kWpExistente) ? 'bloqueado' : (faltaExist.length ? 'aviso' : 'pronto'),
      motivo: !isNum(calc.kWpExistente) ? 'Sistema existente não informado.'
        : (faltaExist.length ? `Confirmar: ${faltaExist.join(', ')}.` : undefined),
    });
  }

  // ── Condicionais D1/D2 ─────────────────────────────────────────────────────
  const exigeRateio = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC'].includes(fd.tipoCaracterizacao);
  if (exigeRateio) {
    if (!docsGerados.listaRateio) avisos.push('Caracterização exige Lista de Rateio (D1) — ainda não gerada.');
    if (!docsGerados.instrumentoJuridico) avisos.push('Caracterização pode exigir Instrumento Jurídico (D2).');
  }

  const documentosProntos = itens.filter((i) => i.status === 'pronto').map((i) => i.nome);
  const documentosPendentes = itens.filter((i) => i.status !== 'pronto').map((i) => i.nome);

  return {
    canExport: erros.length === 0,
    erros,
    avisos,
    documentosProntos,
    documentosPendentes,
    itens,
  };
}
