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

  const efInv = num(fd.eficienciaInv, 0);
  if (efInv > 0 && (efInv < 90 || efInv > 99.5)) {
    w('SFV04b',
      `Eficiência do inversor declarada (${efInv}%) fora da faixa típica (90–99,5%). ` +
      `Confirme o valor no datasheet do equipamento.`
    );
  }

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
  // Usa o método preciso (coeficiente real) quando disponível; fallback para fator 1,25
  const vocMaxEfetivo = calc.vocMaxCorr ?? calc.vocMax;
  if (vInCC > 0) {
    if (vocMaxEfetivo > vInCC) {
      e('SFV06',
        `Voc_max calculado (${vocMaxEfetivo} V${calc.vocMaxCorr !== null ? ' — coef. real' : ' — fator 1,25'}) ` +
        `supera a tensão máxima CC do inversor (${vInCC} V). ` +
        `Risco de dano permanente ao inversor. Reduza painéis em série. [NBR 16690 §6.3]`
      );
    }
    if (vocMaxEfetivo < vInCC * 0.5) {
      w('SFV07',
        `Voc_max (${vocMaxEfetivo} V) é inferior a 50% da tensão máxima do inversor (${vInCC} V). ` +
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

  if (calc.iscStr > 0 && djCC > 0 && djCC < calc.iscStr * 1.25) {
    w('PRT01',
      `Proteção CC (${djCC} A) pode estar subdimensionada para a corrente individual de string ` +
      `(mínimo ${(calc.iscStr * 1.25).toFixed(1)} A = 1,25 × Isc_string ${calc.iscStr.toFixed(1)} A). ` +
      `Verifique o fusível por string na String Box. [NBR 16690 §7.3]`
    );
  }
  if (djCA > 0 && djCA < calc.iDjCAMin) {
    e('SFV09',
      `Disjuntor CA (${djCA} A) abaixo da corrente nominal do inversor (${calc.iDjCAMin} A). ` +
      `[NBR 5410 §6.2 — disjuntor selecionado ≥ In]`
    );
  }

  // ── Queda de tensão ───────────────────────────────────────────
  // Usa dvccOpP (Impp/Vmpp) quando disponível — grandeza normativa NBR 16690.
  // Fallback para dvccP (Icc×1,25/Voc) — método conservador de dimensionamento.
  const dvccCheck = calc.dvccOpP !== null ? calc.dvccOpP : calc.dvccP;
  const dvccLabel = calc.dvccOpP !== null
    ? `ΔV operacional ${calc.dvccOpP}% (Impp/Vmpp)`
    : `ΔV dimensionamento ${calc.dvccP}% (Icc×1,25/Voc)`;
  if (dvccCheck > 3) {
    w('CAB01',
      `Queda de tensão CC (${dvccLabel}) supera o limite de 3%. ` +
      `Aumente a seção do cabo CC ou reduza o comprimento. [NBR 16690]`
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

  // ── DPS CA — tensão mínima ≥ 1,1 × Vrede = 242 V ─────────────
  const dpsCATensao = num(fd.dpsCATensao, 0);
  if (dpsCATensao > 0 && dpsCATensao < 242) {
    w('DPS02',
      `Tensão nominal do DPS CA (${dpsCATensao} V) < 1,1 × Vrede = 242 V. ` +
      `Selecione DPS CA com Uc ≥ 242 V. [IEC/EN 61643-1]`
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

  // ── Janela MPPT do inversor (requer vmppString + faixas preenchidas) ─────
  const mpptMin = num(fd.faixaMPPTMin, 0);
  const mpptMax = num(fd.faixaMPPTMax, 0);
  if (calc.vmppString > 0 && mpptMin > 0 && calc.vmppString < mpptMin) {
    e('SFV12',
      `Vmpp da string (${calc.vmppString} V) abaixo do limite mínimo MPPT do inversor (${mpptMin} V). ` +
      `O inversor não conseguirá rastrear o ponto de máxima potência. Aumente os painéis em série.`
    );
  }
  if (calc.vmppString > 0 && mpptMax > 0 && calc.vmppString > mpptMax) {
    e('SFV13',
      `Vmpp da string (${calc.vmppString} V) acima do limite máximo MPPT do inversor (${mpptMax} V). ` +
      `O inversor não conseguirá rastrear o ponto de máxima potência. Reduza os painéis em série.`
    );
  }

  // ── Tensão de partida do inversor ─────────────────────────────
  const tPartida = num(fd.tensaoPartidaCC, 0);
  if (calc.vocStr > 0 && tPartida > 0 && calc.vocStr < tPartida) {
    e('SFV14',
      `Voc da string (${calc.vocStr} V) abaixo da tensão de partida do inversor (${tPartida} V). ` +
      `O inversor não conseguirá ligar. Aumente os painéis em série ou revise o modelo do inversor.`
    );
  }

  // ── Ligação bifásica — ambiguidade na corrente CA ────────────
  if (fd.tipoLigacao === 'Bifásico') {
    w('SFV15',
      'Ligação bifásica: o cálculo assume corrente distribuída em 2 fases (I = P / 2V). ' +
      'Confirme com o fabricante se o inversor usa saída bifásica real (2 fases independentes) ' +
      'ou saída monofásica (apenas L+N). [NBR 5410]'
    );
  }

  // ── Aterramento — resistência medida ─────────────────────────
  const resAt = parseFloat(fd.resistenciaAterramento || '');
  if (!isNaN(resAt) && resAt > 10) {
    e('AT01',
      `Resistência de aterramento medida (${resAt} Ω) acima do limite de 10 Ω. ` +
      `Verificar instalação das hastes, conexões e solo. [NBR 5419]`
    );
  }

  // ── Potência injetada vs. disponibilizada ────────────────────
  // Para Ampliação: usa kWtCATotal (nova + existente) pois ambos injetam na rede
  const potInjetada = calc.kWtCATotal > 0 ? calc.kWtCATotal : calc.kWtCA;
  if (calc.potDispKW > 0 && potInjetada > calc.potDispKW) {
    e('PD01',
      `Potência total injetada (${potInjetada} kW CA${calc.kWtCAExistente > 0 ? ` = ${calc.kWtCA} kW novo + ${calc.kWtCAExistente} kW existente` : ''}) ` +
      `supera a potência disponibilizada no padrão de entrada (${calc.potDispKW} kW). ` +
      `Reduza a potência CA ou solicite aumento de carga à distribuidora. [NT.00020.EQTL-06 §5.3]`
    );
  }

  // ── Ampliação — informativo de potência total ─────────────────
  if (fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0) {
    i('AMP01',
      `Ampliação: ${calc.kWpExistente} kWp existentes + ${calc.kWp} kWp novos = ` +
      `${calc.kWpTotal} kWp total. Enquadramento pelo total: ${calc.enqTotal}.`
    );
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
