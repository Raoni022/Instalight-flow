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
  const ns     = num(fd.paineisSerie);
  const vocStr = ns * VOC_PP;
  /** Voc_max com fator de temperatura 1,25 — NBR 16690 §6.3 */
  const vocMax = parseFloat((vocStr * 1.25).toFixed(1));

  // ══════════════════════════════════════════════════════════════
  // CORRENTES CC
  // ══════════════════════════════════════════════════════════════
  const sp       = num(fd.stringParalelo, 1);
  const iscStr   = wp > 0 ? parseFloat((wp / VOC_PP).toFixed(2)) : 0;
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
  const ccS = num(fd.secaoCaboCC, 6);         // mm²
  const caL = num(fd.comprimentoCabosCA, 10); // m
  const caS = num(fd.secaoCaboCA, 6);         // mm²

  /** ΔV_CC = (2 × L × I × ρ) / S — circuito completo ida+volta */
  const dvccV = ccS > 0 ? parseFloat(((2 * ccL * iccNorma * RHO) / ccS).toFixed(3)) : 0;
  const vCC   = vocStr > 0 ? vocStr : 1;
  const dvccP = parseFloat(((dvccV / vCC) * 100).toFixed(2));

  /** ΔV_CA = (2 × L × I × ρ) / S */
  const dvcaV = caS > 0 ? parseFloat(((2 * caL * iNomCA * RHO) / caS).toFixed(3)) : 0;
  const dvcaP = parseFloat(((dvcaV / tensaoCA) * 100).toFixed(2));

  // ══════════════════════════════════════════════════════════════
  // DISJUNTORES (mínimos normativos)
  // ══════════════════════════════════════════════════════════════
  const iDjCCMin = iccNorma; // ≥ 1,25 × Icc (já incluído em iccNorma)
  const iDjCAMin = iDimCA;   // ≥ 1,25 × In  (já incluído em iDimCA)

  // ══════════════════════════════════════════════════════════════
  // GERAÇÃO E ECONOMIA
  // ══════════════════════════════════════════════════════════════
  const geracaoAnual  = Math.round(kWp * IRRAD * PR * 365);
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
  const potDispKVA = parseFloat(((tensaoCA * num(fd.disjuntorCA, 50) * numFases) / 1000).toFixed(2));
  const potDispKW  = parseFloat((potDispKVA * 0.92).toFixed(2)); // FP = 0,92

  // ══════════════════════════════════════════════════════════════
  // ENQUADRAMENTO REGULATÓRIO — REN ANEEL 1.000/2021 + Lei 14.300/2022
  // ══════════════════════════════════════════════════════════════
  const enq   = kWp <= 75 ? 'Microgeração Distribuída' : 'Minigeração Distribuída';
  const prazo = kWp <= 75 ? '15 dias (sem obra) / 30 dias (com obra)' : '60 dias';

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
  };
}
