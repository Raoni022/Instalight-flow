/**
 * Motor de validação técnica — GD Docs Instalight Flow
 *
 * Verifica consistência e conformidade normativa do projeto antes de
 * permitir exportação de documentos.
 *
 * Níveis de severidade:
 *   'erro'  — bloqueia exportação. Dado obrigatório ou risco elétrico real.
 *   'aviso' — não bloqueia, mas exige revisão do RT antes do protocolo.
 *   'info'  — informativo: enquadramento, prazos, lembretes.
 */

import { FormData, Calculos, ValidationIssue } from '../types';

const num = (v: string | undefined, fallback = 0): number => {
  const n = parseFloat(v ?? '');
  return isNaN(n) ? fallback : n;
};

export function validarProjeto(fd: FormData, calc: Calculos): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const e = (cod: string, msg: string) => issues.push({ nivel: 'erro',  cod, msg });
  const w = (cod: string, msg: string) => issues.push({ nivel: 'aviso', cod, msg });
  const i = (cod: string, msg: string) => issues.push({ nivel: 'info',  cod, msg });

  // ── Dados obrigatórios da UC ──────────────────────────────────
  if (!fd.nomeCliente?.trim())  e('UC01', 'Nome do cliente não preenchido.');
  if (!fd.codigoUC?.trim())     e('UC02', 'Código da UC não preenchido.');
  if (!fd.endereco?.trim())     e('UC03', 'Endereço da UC não preenchido.');
  if (!fd.cpfCnpj?.trim())      e('UC04', 'CPF/CNPJ do cliente não preenchido.');

  // ── Responsável Técnico ───────────────────────────────────────
  if (!fd.nomeResponsavel?.trim()) e('RT01', 'Nome do Responsável Técnico não preenchido.');
  if (!fd.numeroCRT?.trim())       e('RT02', 'Nº CRT/CREA não preenchido.');
  if (!fd.numART?.trim())          w('RT03', 'Nº da ART não preenchido. Obrigatório antes do protocolo CEEE.');

  // ── Sistema FV — dados básicos ────────────────────────────────
  if (calc.kWp <= 0)   e('SFV01', 'Potência CC calculada é zero. Preencha Nº painéis e Potência Wp.');
  if (calc.kWtCA <= 0) e('SFV02', 'Potência CA do inversor é zero. Preencha Potência CA (kW).');
  if (!fd.modeloPainel?.trim())   w('SFV03', 'Modelo do painel não preenchido. Necessário para o memorial.');
  if (!fd.modeloInversor?.trim()) w('SFV04', 'Modelo do inversor não preenchido. Necessário para o memorial.');

  // ── Consistência strings × painéis ────────────────────────────
  const npCalc = num(fd.paineisSerie) * num(fd.stringParalelo);
  const npForm = num(fd.numeroPaineis);
  if (npCalc > 0 && npForm > 0 && npCalc !== npForm) {
    e('SFV05',
      `Inconsistência: ${fd.paineisSerie}S × ${fd.stringParalelo}P = ${npCalc} painéis, ` +
      `mas "Nº de painéis" informa ${npForm}. Corrija antes de exportar.`
    );
  }

  // ── Voc_max vs tensão máxima CC do inversor ───────────────────
  const vInCC = num(fd.tensaoEntradaCC, 0);
  if (vInCC > 0) {
    if (calc.vocMax > vInCC) {
      e('SFV06',
        `Voc_max calculado (${calc.vocMax} V) supera a tensão máxima CC do inversor (${vInCC} V). ` +
        `Risco de dano permanente ao inversor. Reduza painéis em série. [NBR 16690 §6.3]`
      );
    }
    if (calc.vocMax < vInCC * 0.5) {
      w('SFV07',
        `Voc_max (${calc.vocMax} V) é inferior a 50% da tensão máxima do inversor (${vInCC} V). ` +
        `Verifique se a string está dentro da janela de MPPT do equipamento.`
      );
    }
  }

  // ── Dimensionamento de disjuntores ────────────────────────────
  const djCC = num(fd.disjuntorCC, 0);
  const djCA = num(fd.disjuntorCA, 0);

  if (djCC > 0 && djCC < calc.iDjCCMin) {
    e('SFV08',
      `Disjuntor CC (${djCC} A) abaixo da corrente de dimensionamento (${calc.iDjCCMin} A). ` +
      `[NBR 16690 §7.3 — mínimo: 1,25 × Icc]`
    );
  }
  if (djCA > 0 && djCA < calc.iDjCAMin) {
    e('SFV09',
      `Disjuntor CA (${djCA} A) abaixo da corrente de dimensionamento (${calc.iDjCAMin} A). ` +
      `[NBR 5410 §6.2 — mínimo: 1,25 × In]`
    );
  }

  // ── Queda de tensão ───────────────────────────────────────────
  if (calc.dvccP > 3) {
    w('CAB01',
      `Queda de tensão CC (${calc.dvccP}%) supera o limite de 3%. ` +
      `Aumente a seção do cabo CC ou reduza o comprimento.`
    );
  }
  if (calc.dvcaP > 2) {
    w('CAB02',
      `Queda de tensão CA (${calc.dvcaP}%) supera o limite de 2%. ` +
      `Aumente a seção do cabo CA ou reduza o comprimento.`
    );
  }

  // ── DPS CC — tensão de operação ───────────────────────────────
  const dpsCCTensao = num(fd.dpsCCTensao, 0);
  if (dpsCCTensao > 0 && calc.vocMax > 0 && dpsCCTensao < calc.vocMax) {
    w('DPS01',
      `Tensão nominal do DPS CC (${dpsCCTensao} V) < Voc_max (${calc.vocMax} V). ` +
      `O DPS pode não proteger adequadamente. Selecione DPS com Un > Voc_max.`
    );
  }

  // ── Relação de dimensionamento CC/CA (oversizing) ─────────────
  if (calc.kWp > 0 && calc.kWtCA > 0) {
    const ratio = calc.kWp / calc.kWtCA;
    if (ratio > 1.35) {
      w('SFV10',
        `Relação CC/CA (${ratio.toFixed(2)}) acima de 1,35. ` +
        `Risco de clipping de potência excessivo. Avalie adicionar um inversor.`
      );
    }
    if (ratio < 0.7) {
      w('SFV11',
        `Relação CC/CA (${ratio.toFixed(2)}) abaixo de 0,70. ` +
        `Inversor superdimensionado para a geração instalada.`
      );
    }
  }

  // ── Informações gerais ────────────────────────────────────────
  if (calc.kWp > 75) {
    i('ENQ01',
      `Sistema enquadrado como Minigeração Distribuída (${calc.kWp} kWp > 75 kWp). ` +
      `Prazo de análise CEEE: 60 dias corridos.`
    );
  }
  i('GER01',
    '⚠️ Todos os documentos devem ser revisados e assinados pelo RT antes do protocolo CEEE.'
  );

  return issues;
}
