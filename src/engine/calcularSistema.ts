/**
 * Motor de cálculo técnico — GD Docs Instalight Flow
 *
 * PRINCÍPIO ARQUITETURAL:
 *   A IA NUNCA faz cálculos elétricos.
 *   Todos os valores numéricos são calculados aqui, em JavaScript puro,
 *   e passados para a IA apenas como contexto para geração de texto.
 *
 * Normas de referência:
 *   ABNT NBR 16690:2019 — Sistemas fotovoltaicos — Requisitos de projeto
 *   ABNT NBR 5410:2004  — Instalações elétricas de baixa tensão
 *   ABNT NBR 5419:2015  — Proteção contra descargas atmosféricas
 */

import { FormData, Calculos } from '../types';
import { RHO, VOC_PP, IRRAD, PR, TARIFA, CO2_FACTOR } from '../constants';

/** Converte string para número, com fallback. */
const num = (v: string | undefined, fallback = 0): number => {
  const n = parseFloat(v ?? '');
  return isNaN(n) ? fallback : n;
};

export function calcularSistema(fd: FormData): Calculos {
  // ══════════════════════════════════════════════════════════════
  // POTÊNCIAS
  // ══════════════════════════════════════════════════════════════
  const np  = num(fd.numeroPaineis);
  const wp  = num(fd.potenciaUnitariaWp);
  const kWp = parseFloat(((np * wp) / 1000).toFixed(3));

  const pCAkW = num(fd.potenciaCAkW);
  const qInv  = num(fd.quantidadeInversores, 1);
  const kWtCA = parseFloat((pCAkW * qInv).toFixed(3));

  // ══════════════════════════════════════════════════════════════
  // TENSÕES DE STRING
  // ══════════════════════════════════════════════════════════════
  const ns  = num(fd.paineisSerie);
  /**
   * VOC_PP dinâmico por faixa de potência nominal do módulo.
   * Módulos modernos ≥ 500 Wp têm Voc real típico de 45–52 V (M10/G12 half-cell).
   * Usar estimativa conservadora atualizada quando o datasheet não está disponível.
   * ⚠ Sempre prefira preencher o Voc real do datasheet para precisão normativa.
   */
  const VOC_PP_DIN = wp >= 500 ? 47 : wp >= 350 ? 44 : VOC_PP;
  /**
   * Voc por painel: usa valor real do datasheet se informado;
   * caso contrário, usa a estimativa dinâmica por faixa de potência.
   */
  const vocPP  = num(fd.vocUnitario) > 0 ? num(fd.vocUnitario) : VOC_PP_DIN;
  const vocStr = ns * vocPP;
  /** Voc_max com fator de temperatura 1,25 — NBR 16690 §6.3 (método simplificado / fallback) */
  const vocMax = parseFloat((vocStr * 1.25).toFixed(2));

  /**
   * Voc_max com coeficiente real de temperatura — NBR 16690 §6.3, método preciso.
   * Fórmula: Voc_str × (1 + |γ| × (25 − T_min))
   * γ = coefTempVoc em %/°C (valor negativo, ex: −0,29); T_min = temperatura mínima local (°C).
   * null quando algum dos dois campos não estiver preenchido — validarProjeto usa (vocMaxCorr ?? vocMax).
   */
  const coefGamma  = num(fd.coefTempVoc);
  const tMinStr    = fd.tempMinima?.trim();
  const tMin       = tMinStr ? num(fd.tempMinima) : NaN;
  const vocMaxCorr: number | null =
    (coefGamma !== 0 && !isNaN(tMin) && vocStr > 0)
      ? parseFloat((vocStr * (1 + (Math.abs(coefGamma) / 100) * (25 - tMin))).toFixed(2))
      : null;

  // ══════════════════════════════════════════════════════════════
  // CORRENTES CC
  // ══════════════════════════════════════════════════════════════
  const sp = num(fd.stringParalelo, 1);
  /**
   * Isc por string: usa valor real do datasheet se informado;
   * caso contrário, estima como Wp / Voc (≈ Imp — conservador).
   */
  const iscStr   = num(fd.iscUnitario) > 0
    ? num(fd.iscUnitario)
    : (wp > 0 ? parseFloat((wp / vocPP).toFixed(2)) : 0);
  const iccTotal = parseFloat((iscStr * sp).toFixed(2));
  /** Corrente de dimensionamento CC = 1,25 × Isc — NBR 16690 §7.3 */
  const iccNorma = parseFloat((iccTotal * 1.25).toFixed(2));

  // ══════════════════════════════════════════════════════════════
  // CORRENTES CA
  // ══════════════════════════════════════════════════════════════
  /**
   * faseF (fator de fase para cálculo de corrente CA):
   *   Monofásico: P = V × I         → faseF = 1
   *   Bifásico:   P = 2 × V × I     → faseF = 2
   *   Trifásico:  P = √3 × V × I    → faseF = √3
   *
   * ATENÇÃO (bifásico): faseF=2 assume que a corrente se distribui entre as
   * 2 fases. Se o inversor bifásico usa apenas 1 saída CA, usar faseF=1.
   * Validar com o Responsável Técnico antes do dimensionamento.
   */
  const faseF =
    fd.tipoLigacao === 'Trifásico' ? Math.sqrt(3) :
    fd.tipoLigacao === 'Bifásico'  ? 2 :
    1;

  const tensaoCA = 220; // V (tensão de referência da rede CEEE RS)
  const iNomCA = kWtCA > 0
    ? parseFloat(((kWtCA * 1000) / (tensaoCA * faseF)).toFixed(2))
    : 0;
  /** Corrente de dimensionamento CA = 1,25 × In — NBR 5410 §6.2 */
  const iDimCA = parseFloat((iNomCA * 1.25).toFixed(2));

  // ══════════════════════════════════════════════════════════════
  // QUEDA DE TENSÃO
  // ══════════════════════════════════════════════════════════════
  const ccL = num(fd.comprimentoCabosCC, 10); // m
  const ccS = num(fd.secaoCaboCC);            // mm²  (0 se vazio — guarda dvccV=0)
  const caL = num(fd.comprimentoCabosCA, 10); // m
  const caS = num(fd.secaoCaboCA);            // mm²  (0 se vazio — guarda dvcaV=0)

  /** ΔV_CC = (2 × L × I × ρ) / S — circuito completo ida+volta (usa iccNorma para dimensionamento do cabo) */
  const dvccV = ccS > 0 ? parseFloat(((2 * ccL * iccNorma * RHO) / ccS).toFixed(3)) : 0;
  const vCC   = vocStr > 0 ? vocStr : 1;
  const dvccP = parseFloat(((dvccV / vCC) * 100).toFixed(2));

  /**
   * ΔV_CC operacional — usa Impp e Vmpp do datasheet quando disponíveis.
   * Representa a queda real em ponto de máxima potência (MPPT).
   * Uso no memorial: comparação com o ΔV de dimensionamento (iccNorma).
   */
  const vmppString = num(fd.vmppUnitario) > 0
    ? parseFloat((num(fd.vmppUnitario) * ns).toFixed(2))
    : 0;
  const imppTotal = num(fd.imppUnitario) > 0
    ? parseFloat((num(fd.imppUnitario) * sp).toFixed(2))
    : 0;
  const dvccOpV = (ccS > 0 && imppTotal > 0)
    ? parseFloat(((2 * ccL * imppTotal * RHO) / ccS).toFixed(3))
    : null;
  const dvccOpP = (dvccOpV !== null && vmppString > 0)
    ? parseFloat(((dvccOpV / vmppString) * 100).toFixed(2))
    : null;

  /** ΔV_CA = (2 × L × I × ρ) / S */
  const dvcaV = caS > 0 ? parseFloat(((2 * caL * iNomCA * RHO) / caS).toFixed(3)) : 0;
  const dvcaP = parseFloat(((dvcaV / tensaoCA) * 100).toFixed(2));

  // ══════════════════════════════════════════════════════════════
  // DISJUNTORES (mínimos normativos)
  // ══════════════════════════════════════════════════════════════
  /**
   * iDjCCMin — corrente mínima do disjuntor CC GERAL (antes do inversor).
   * O disjuntor geral CC deve ser dimensionado para a corrente total do
   * arranjo com o fator de segurança: ≥ 1,25 × Icc_total = iccNorma.
   * (Para proteção individual de string: ≥ 1,25 × Isc_string = iscStr × 1,25.)
   * [NBR 16690 §7.3]
   */
  const iDjCCMin = iccNorma;
  /**
   * iDjCAMin — corrente mínima do disjuntor CA = corrente nominal do inversor.
   * O disjuntor CA é selecionado ≥ In; a seção dos cabos é dimensionada
   * para 1,25 × In (iDimCA), que é uma grandeza de cabo, não de disjuntor.
   * [NBR 5410 §6.2]
   */
  const iDjCAMin = iNomCA;

  // ══════════════════════════════════════════════════════════════
  // IRRADIAÇÃO E PR EFETIVOS (local ou padrão Porto Alegre)
  // ══════════════════════════════════════════════════════════════
  /**
   * irradEfetivo: usa o valor local informado (fd.irradLocal) quando disponível,
   * caso contrário usa a constante IRRAD (Porto Alegre / RS, CRESESB).
   * prEfetivo: usa o PR personalizado (fd.prCustom) ou o PR padrão do sistema.
   */
  const irradEfetivo = num(fd.irradLocal) > 0 ? num(fd.irradLocal) : IRRAD;
  const prEfetivo    = num(fd.prCustom)   > 0 ? num(fd.prCustom)   : PR;

  // ══════════════════════════════════════════════════════════════
  // GERAÇÃO E ECONOMIA
  // ══════════════════════════════════════════════════════════════
  /** Geração do SISTEMA NOVO (kWp novo apenas) — usado nas seções técnicas do memorial. */
  const geracaoAnual  = Math.round(kWp * irradEfetivo * prEfetivo * 365);
  const economiaAnual = Math.round(geracaoAnual * TARIFA);

  // ══════════════════════════════════════════════════════════════
  // IMPACTO AMBIENTAL
  // ══════════════════════════════════════════════════════════════
  /** ATENÇÃO: validar CO2_FACTOR anualmente com publicação oficial ANEEL */
  const co2EvitadoAnual    = Math.round(geracaoAnual * CO2_FACTOR);
  const arvoresEquivalente = Math.round(co2EvitadoAnual / 25);
  const co2Em25Anos        = co2EvitadoAnual * 25;

  const consumoMensalKwh = num(fd.consumoMensalKwh, 0);
  const percentualAtendimento = consumoMensalKwh > 0
    ? Math.min(100, parseFloat(((geracaoAnual / (consumoMensalKwh * 12)) * 100).toFixed(1)))
    : null;

  // ══════════════════════════════════════════════════════════════
  // POTÊNCIA DISPONIBILIZADA NO PADRÃO DE ENTRADA
  // ══════════════════════════════════════════════════════════════
  const numFases = fd.tipoLigacao === 'Trifásico' ? Math.sqrt(3) :
                   fd.tipoLigacao === 'Bifásico'  ? 2 : 1;
  /**
   * NT.00020.EQTL-06 §5.3: PD = VN × IDG × NF / 1000
   * IDG = Intensidade do Disjuntor Geral do PADRÃO DE ENTRADA (fd.disjuntorEntrada),
   *       NÃO o disjuntor de proteção do inversor (fd.disjuntorCA).
   * Fallback 50 A quando disjuntorEntrada não informado.
   */
  const potDispKVA = parseFloat(((tensaoCA * num(fd.disjuntorEntrada, 50) * numFases) / 1000).toFixed(2));
  const potDispKW  = parseFloat((potDispKVA * 0.92).toFixed(2)); // FP = 0,92

  // ══════════════════════════════════════════════════════════════
  // ENQUADRAMENTO REGULATÓRIO — REN ANEEL 1.000/2021 + Lei 14.300/2022
  // ══════════════════════════════════════════════════════════════
  const enq   = kWp <= 75 ? 'Microgeração Distribuída' : 'Minigeração Distribuída';
  const prazo = kWp <= 75 ? '15 dias (sem obra) / 30 dias (com obra)' : '60 dias';

  // ══════════════════════════════════════════════════════════════
  // AMPLIAÇÃO — potência existente + total
  // ══════════════════════════════════════════════════════════════
  const isAmpl = fd.tipoInstalacao === 'Ampliação';
  const kWpExistente = isAmpl
    ? parseFloat(((num(fd.numeroPaineisExistentes) * num(fd.potenciaWpExistente)) / 1000).toFixed(3))
    : 0;
  const kWtCAExistente = isAmpl
    ? parseFloat((num(fd.potenciaCAExistentekW) * num(fd.quantidadeInversoresExistente, 1)).toFixed(3))
    : 0;
  const kWpTotal    = parseFloat((kWp + kWpExistente).toFixed(3));
  const kWtCATotal  = parseFloat((kWtCA + kWtCAExistente).toFixed(3));
  const enqTotal    = kWpTotal <= 75
    ? 'Microgeração Distribuída'
    : 'Minigeração Distribuída';

  /** Enquadramento somente do sistema novo (independente do existente). */
  const enqNovo = kWp <= 75 ? 'Microgeração Distribuída' : 'Minigeração Distribuída';

  /**
   * Geração TOTAL após ampliação (novo + existente).
   * Para nova instalação: igual a geracaoAnual (kWpTotal = kWp).
   * Para ampliação: reflete a capacidade real instalada total.
   */
  const kWpParaGeracao    = isAmpl ? kWpTotal : kWp;
  const geracaoAnualTotal = Math.round(kWpParaGeracao * irradEfetivo * prEfetivo * 365);
  const economiaAnualTotal= Math.round(geracaoAnualTotal * TARIFA);

  /**
   * Percentual de aumento de potência CC em relação ao existente.
   * Ex: existente = 3,6 kWp, novo = 4,4 kWp → percentualAumentokWp = 122,2%
   * (o novo representa 122% do existente, i.e. um acréscimo de 22%)
   */
  const percentualAumentokWp: number | null = (isAmpl && kWpExistente > 0)
    ? parseFloat(((kWp / kWpExistente) * 100).toFixed(1))
    : null;

  const percentualAumentokWtCA: number | null = (isAmpl && kWtCAExistente > 0)
    ? parseFloat(((kWtCA / kWtCAExistente) * 100).toFixed(1))
    : null;

  return {
    kWp, kWtCA,
    vocStr, vocMax,
    iscStr, iccTotal, iccNorma,
    iNomCA, iDimCA,
    dvccV, dvccP,
    dvcaV, dvcaP,
    iDjCCMin, iDjCAMin,
    geracaoAnual, economiaAnual,
    enq, prazo,
    potDispKVA, potDispKW,
    co2EvitadoAnual, arvoresEquivalente, co2Em25Anos,
    percentualAtendimento,
    vmppString, imppTotal, dvccOpV, dvccOpP,
    vocMaxCorr,
    kWpExistente, kWtCAExistente, kWpTotal, kWtCATotal, enqTotal,
    enqNovo, percentualAumentokWp, percentualAumentokWtCA,
    irradEfetivo, prEfetivo, geracaoAnualTotal, economiaAnualTotal,
  };
}
