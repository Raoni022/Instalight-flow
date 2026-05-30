/**
 * memorial.ts — Template do Memorial Técnico-Descritivo (80% JS, 20% IA)
 *
 * Esta função gera o documento com seções fixas em JS e marcadores
 * [[[IA_NARRATIVA_SECx]]] que serão substituídos pela IA ou por
 * textos padrão no modo básico.
 *
 * Baseado em: NT.00020.EQTL-06 (CEEE Equatorial) + ABNT NBR 16690
 */

import type { FormData, Calculos } from '../types';
import { IRRAD, PR, TARIFA } from '../constants';

const num = (v: string | undefined, d = 0): number => parseFloat(v ?? '') || d;

export function buildMemorialTemplate(fd: FormData, calc: Calculos): string {
  const nf = fd.tipoLigacao === 'Trifásico' ? '√3 ≈ 1,732' : '1';
  const fases: Record<string, string> = {
    Monofásico: '2 (fase + neutro)',
    Bifásico: '3 (duas fases + neutro)',
    Trifásico: '4 (três fases + neutro + terra)',
  };
  const tensoes: Record<string, string> = {
    Monofásico: '220 V',
    Bifásico: '220 V',
    Trifásico: '380/220 V',
  };

  const hoje = fd.dataproject || new Date().toLocaleDateString('pt-BR');
  const nPaineis = fd.numeroPaineis || '[INSERIR]';
  const modPainel = fd.modeloPainel || '[INSERIR MODELO]';
  const wpPainel = fd.potenciaUnitariaWp || '[INSERIR]';
  const nSerie = fd.paineisSerie || '[INSERIR]';
  const nPar = fd.stringParalelo || '[INSERIR]';
  const modInv = fd.modeloInversor || '[INSERIR MODELO]';
  const potCAkW = fd.potenciaCAkW || '[INSERIR]';
  const nInv = fd.quantidadeInversores || '1';
  const VinCC = fd.tensaoEntradaCC || '[INSERIR]';
  const VoutCA = fd.tensaoSaidaCA || '220';
  const djCC = fd.disjuntorCC || String(calc.iDjCCMin || '[INSERIR]');
  const djCA = fd.disjuntorCA || String(calc.iDjCAMin || '[INSERIR]');

  return `MEMORIAL TÉCNICO-DESCRITIVO
SISTEMA DE ${calc.enq.toUpperCase()} FOTOVOLTAICA — ON GRID
Elaborado conforme NT.00020.EQTL-06 (CEEE Equatorial) e ABNT NBR 16690

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTA DE SIGLAS E ABREVIATURAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABNT  Associação Brasileira de Normas Técnicas
ANEEL Agência Nacional de Energia Elétrica
BT    Baixa Tensão
CA    Corrente Alternada
CC    Corrente Contínua
CEEE  Companhia Estadual de Distribuição de Energia Elétrica
DPS   Dispositivo de Proteção contra Surtos
FP    Fator de Potência
FV    Fotovoltaico
GD    Geração Distribuída
HSP   Horas de Sol Pleno
IDG   Corrente do Disjuntor Geral
Isc   Corrente de Curto-Circuito
kWh   Quilowatt-hora
kWp   Quilowatt-pico
MPPT  Maximum Power Point Tracker (Rastreador de Ponto de Máxima Potência)
NBR   Norma Brasileira
NF    Fator de Número de Fases
PE    Condutor de Proteção (Terra)
PR    Performance Ratio (Fator de Desempenho)
QDC   Quadro de Distribuição de Corrente
REN   Resolução Normativa
RT    Responsável Técnico
SFVCR Sistema Fotovoltaico Conectado à Rede
SFV   Sistema Fotovoltaico
SPDA  Sistema de Proteção contra Descargas Atmosféricas
UC    Unidade Consumidora
VN    Tensão Nominal
Voc   Tensão de Circuito Aberto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[[[IA_NARRATIVA_SEC1]]]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. REFERÊNCIAS NORMATIVAS E REGULATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Lei Federal n° 14.300/2022 — Marco Legal da Microgeração e Minigeração Distribuída
• REN ANEEL n° 1.000/2021 — Regras de prestação do serviço público de distribuição de energia
• NT.00020.EQTL-06 — Norma Técnica CEEE Equatorial para Conexão de Micro/Minigeração
• ABNT NBR 16690:2019 — Sistemas fotovoltaicos — Requisitos para documentação técnica
• ABNT NBR 5410:2004 — Instalações elétricas de baixa tensão
• ABNT NBR 5419:2015 — Proteção de estruturas contra descargas atmosféricas
• ABNT NBR IEC 62116 — Procedimento de ensaio de anti-ilhamento para inversores FV
• ABNT NBR 16149:2013 — Sistemas FV — Características da interface de conexão com a rede
• ABNT NBR 16150:2013 — Sistemas FV — Interface de conexão — Procedimento de ensaio
• PRODIST Módulo 3 — Acesso ao Sistema de Distribuição

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DADOS DA UNIDADE CONSUMIDORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Titular:            ${fd.nomeCliente || '[INSERIR NOME]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}:                ${fd.cpfCnpj || '[INSERIR]'}
Conta-Contrato:     ${fd.numContaContrato || '[INSERIR CONTA-CONTRATO]'}
Código da UC:       ${fd.codigoUC || '[INSERIR CÓDIGO UC]'}
Endereço:           ${fd.endereco || '[INSERIR ENDEREÇO COMPLETO]'}
Cidade / UF:        ${fd.cidade || 'Porto Alegre'} / RS
Coordenadas:        ${fd.coordenadas || '[INSERIR COORDENADAS UTM]'}
Consumo médio:      ${fd.consumoMensalKwh ? fd.consumoMensalKwh + ' kWh/mês' : '[INSERIR CONSUMO MÉDIO]'}
Fatura referência:  ${fd.numeroFatura || '[INSERIR Nº FATURA]'}
Distribuidora:      CEEE Equatorial (área de concessão Rio Grande do Sul)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PADRÃO DE ENTRADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4.1 Tipo de Ligação e Tensão de Atendimento
• Tipo:             ${fd.tipoLigacao}
• Número de fases:  ${fases[fd.tipoLigacao] || '[VERIFICAR]'}
• Tensão nominal:   ${tensoes[fd.tipoLigacao] || '220 V'} / 60 Hz

4.2 Disjuntor de Entrada
• Corrente nominal (IDG): ${djCA} A
• Número de pólos:        ${fd.tipoLigacao === 'Monofásico' ? '2 (bipolar)' : '3 (tripolar)'}
• Curva de atuação:       C
• Elemento de proteção:   Termomagnético

4.3 Potência Disponibilizada — Fórmula (NT.00020.EQTL-06 Seção 5.3)
  PD [kVA] = (VN × IDG × NF) / 1000
  PD [kVA] = (220 × ${djCA} × ${nf}) / 1000 = ${calc.potDispKVA} kVA
  PD [kW]  = PD [kVA] × FP = ${calc.potDispKVA} × 0,92 = ${calc.potDispKW} kW

A potência de injeção do gerador (${calc.kWtCA} kW CA) ${calc.kWtCA <= calc.potDispKW ? 'é inferior ou igual à' : 'supera a'} potência disponibilizada (${calc.potDispKW} kW), ${calc.kWtCA <= calc.potDispKW ? 'atendendo' : 'não atendendo'} ao requisito normativo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. DIMENSIONAMENTO DO GERADOR FOTOVOLTAICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5.1 Características Técnicas dos Módulos FV

| Parâmetro                          | Valor                    |
|------------------------------------|--------------------------|
| Fabricante / Modelo                | ${modPainel}             |
| Potência nominal (Pn)              | ${wpPainel} Wp           |
| Tensão de máxima potência (Vmp)    | ${fd.vmppUnitario || '[INSERIR]'} V |
| Corrente de máxima potência (Imp)  | ${fd.imppUnitario || '[INSERIR]'} A |
| Tensão de circuito aberto (Voc)    | ${fd.vocUnitario  || (calc.vocStr > 0 ? (calc.vocStr / Math.max(1, num(nSerie))).toFixed(1) : '[INSERIR]')} V (unitário) |
| Corrente de curto-circuito (Isc)   | ${fd.iscUnitario  || calc.iscStr} A (unitário) |
| Eficiência                         | ${fd.eficienciaPainel || '[INSERIR]'} % |
| Dimensões (C × L × E)             | [INSERIR] mm             |
| Peso                               | [INSERIR] kg             |
| Temperatura de operação nominal    | [INSERIR] °C             |
| Coef. temperatura Voc              | ${fd.coefTempVoc  || '[INSERIR]'} %/°C |
| Tensão máxima do sistema           | 1000 V                   |
| Quantidade total                   | ${nPaineis} módulos      |
| Potência total CC instalada        | ${calc.kWp} kWp          |

5.2 Topologia das Strings

Configuração: ${nSerie} módulos em série × ${nPar} strings em paralelo = ${nPaineis} módulos totais

| Parâmetro                                  | Valor por String         |
|--------------------------------------------|--------------------------|
| Tensão de circuito aberto Voc (string)     | ${calc.vocStr} V         |
| Voc máximo (fator segurança NBR 16690 ×1,25)| ${calc.vocMax} V        |
| Corrente de curto-circuito Isc (string)    | ${calc.iscStr} A         |
| Icc total (${nPar} strings paralelo)       | ${calc.iccTotal} A       |
| Corrente de dimensionamento (Icc × 1,25)   | ${calc.iccNorma} A       |
| Potência por string                        | ${nSerie && wpPainel ? (num(nSerie) * num(wpPainel) / 1000).toFixed(2) : '[CALCULAR]'} kWp |

Nota: Voc máximo de ${calc.vocMax} V inferior ao limite de 1000 V estabelecido pela NBR 16690 para instalações de baixa tensão.

5.3 Queda de Tensão em Corrente Contínua

Fórmula aplicada: ΔV = (2 × L × I × ρ) / S
Onde:
  L = ${fd.comprimentoCabosCC || '[L]'} m (comprimento do circuito CC)
  I = ${calc.iccNorma} A (corrente de dimensionamento)
  ρ = 0,01724 Ω·mm²/m (resistividade do cobre a 20°C)
  S = ${fd.secaoCaboCC || '6'} mm² (seção transversal do condutor)

  ΔV(CC) = (2 × ${fd.comprimentoCabosCC || '?'} × ${calc.iccNorma} × 0,01724) / ${fd.secaoCaboCC || '6'} = ${calc.dvccV} V
  ΔV(CC)% = ${calc.dvccV} / ${calc.vocStr} × 100 = ${calc.dvccP}%

${calc.dvccP <= 3 ? '✔ Queda de tensão CC (dimensionamento) dentro do limite de 3% (NBR 16690).' : '⚠ Verificar bitola do cabo CC — queda de dimensionamento superior a 3% (NBR 16690).'}
${calc.dvccOpP !== null
  ? `
ΔV CC Operacional (ponto de máxima potência — MPPT):
  I = ${calc.imppTotal} A (Impp total) | V_ref = ${calc.vmppString} V (Vmpp string)
  ΔV(CC_op) = (2 × ${fd.comprimentoCabosCC || '?'} × ${calc.imppTotal} × 0,01724) / ${fd.secaoCaboCC || '6'} = ${calc.dvccOpV} V
  ΔV(CC_op)% = ${calc.dvccOpP}% (referenciado a Vmpp = ${calc.vmppString} V)
${calc.dvccOpP <= 3 ? '✔ Queda operacional dentro do limite de 3%.' : '⚠ Queda operacional superior a 3% — avaliar aumento da bitola CC.'}`
  : '(Preencha Vmpp e Impp no formulário para calcular ΔV operacional)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. DIMENSIONAMENTO DO INVERSOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Parâmetro                             | Valor                    |
|---------------------------------------|--------------------------|
| Fabricante / Modelo                   | ${modInv}                |
| Quantidade                            | ${nInv} unidade(s)       |
| Potência nominal CA (Pca)             | ${potCAkW} kW            |
| Potência CA total                     | ${calc.kWtCA} kW         |
| Máxima tensão CC de entrada (Vcc-máx) | ${VinCC} V               |
| Tensão nominal de saída CA            | ${VoutCA} V              |
| Número de entradas MPPT               | ${fd.numMPPT        || '[INSERIR]'} |
| Faixa de tensão MPPT                  | ${fd.faixaMPPTMin && fd.faixaMPPTMax ? `${fd.faixaMPPTMin}–${fd.faixaMPPTMax} V` : '[INSERIR]'} |
| Tensão de partida CC                  | ${fd.tensaoPartidaCC || '[INSERIR]'} V |
| Corrente nominal saída CA             | ${calc.iNomCA} A         |
| Corrente máxima saída CA              | ${calc.iDimCA} A         |
| THD de corrente                       | < 3%                     |
| Fator de potência                     | 1,0                      |
| Eficiência máxima                     | ${fd.eficienciaInv  || '[INSERIR]'} % |
| Grau de proteção                      | IP65 (mínimo)            |
| Proteção anti-ilhamento               | Integrada (NBR IEC 62116)|

Relação CC/CA: ${calc.kWp > 0 && calc.kWtCA > 0 ? (calc.kWp / calc.kWtCA).toFixed(2) : '[CALCULAR]'} (faixa recomendada: 1,0 a 1,3)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. ESTRUTURA DE FIXAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tipo de cobertura: ${fd.tipoTelhado}
[[[IA_NARRATIVA_SEC7]]]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. DIMENSIONAMENTO DAS PROTEÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8.1 Disjuntor de Proteção CC (geral, antes do inversor)
• Corrente de dimensionamento — Icc_total × 1,25: ${calc.iDjCCMin} A
• Disjuntor CC selecionado: ${djCC} A (${num(djCC) >= calc.iDjCCMin ? '✔ atende' : '⚠ verificar'})
  Nota: proteção individual de string: ≥ 1,25 × Isc_string = ${parseFloat((calc.iscStr * 1.25).toFixed(2))} A por fusível.
• Número de pólos: 2 (bipolar, CC)
• Tensão nominal mínima: ${calc.vocMax} V CC

8.2 Disjuntor de Proteção CA
• Corrente nominal CA (In):                  ${calc.iNomCA} A
• Corrente de dimensionamento de cabo (In × 1,25): ${calc.iDimCA} A
• Disjuntor CA selecionado: ${djCA} A (${num(djCA) >= calc.iDjCAMin ? '✔ atende' : '⚠ verificar'})
  Nota: disjuntor selecionado ≥ In; condutor dimensionado para 1,25 × In. [NBR 5410 §6.2]
• Número de pólos: ${fd.tipoLigacao === 'Monofásico' ? '2 (bipolar)' : '3 (tripolar)'}
• Capacidade de interrupção: mínimo 5 kA

8.3 DPS — Proteção CC (String Box)
• Tipo: ${fd.dpsCCTipo || 'Tipo 2'}
• Tensão máxima de operação contínua (Uc): ${fd.dpsCCTensao || '1000'} V CC
• Corrente de descarga nominal (8/20 μs): mínimo 20 kA
• Nível de proteção (Up): ≤ 5 kV
• Tempo de resposta: < 25 ns
• Modos de proteção: L+/PE, L-/PE (modo comum) | L+/L- (diferencial)

8.4 DPS — Proteção CA (QDC CA)
• Tipo: ${fd.dpsCATipo || 'Tipo 2'}
• Tensão máxima de operação contínua (Uc): ${fd.dpsCATensao || '275'} V CA
• Corrente de descarga nominal (8/20 μs): mínimo 20 kA
• Nível de proteção (Up): ≤ 1,8 kV
• Certificação: IEC/EN 61643-1

8.5 Sistema de Aterramento
• Configuração: ${fd.aterramento || 'Haste de aterramento 5/8" × 2,40 m, com conector de bronze'}
• Condutor de aterramento: ${fd.secaoCaboAterr || '6'} mm² — isolação verde/amarela
• Resistência de aterramento: ≤ 10 Ω (conforme ABNT NBR 5419)
• Tensão de contato admissível: ≤ 25 V (situação 2, Tabela C.2 — NBR 5410:2004)
• Interligação: O sistema de aterramento do SFV deve ser interligado ao aterramento principal da instalação elétrica existente.
• Barramento de equipotencialização: cobre estanhado, seção mínima de ${fd.secaoCaboAterr || '6'} mm²

8.6 Tabela de Requisitos de Proteção do Inversor

| Requisito de Proteção                              | Indicação   |
|----------------------------------------------------|-------------|
| Proteção de subtensão (27)                         | Integrada   |
| Proteção de sobretensão (59)                       | Integrada   |
| Proteção de subfrequência (81U)                    | Integrada   |
| Proteção de sobrefrequência (81O)                  | Integrada   |
| Proteção contra reversão de tensão (47)            | Integrada   |
| Proteção de sobrecorrente (50/51)                  | Integrada   |
| Proteção anti-ilhamento (NBR IEC 62116)            | Integrada   |
| Check de sincronismo (25)                          | Integrada   |
| Temporizador de reconexão (62)                     | Integrada   |
| Monitoração de isolamento CC                       | Integrada   |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. DIMENSIONAMENTO DOS CABOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9.1 Condutores em Corrente Contínua (CC)
• Bitola: ${fd.secaoCaboCC || '6'} mm² (positivo e negativo)
• Tipo: Cabo solar flexível dupla isolação, 1,8 kV CC, 90°C
• Identificação: vermelho (positivo), preto (negativo)
• Comprimento estimado: ${fd.comprimentoCabosCC || '[INSERIR]'} m
• Conectores: tipo MC4 (IP67, adequados para uso externo)
• Condutor de aterramento (CC): ${fd.secaoCaboAterr || '6'} mm², verde/amarelo

9.2 Condutores em Corrente Alternada (CA)
• Bitola: ${fd.secaoCaboCA || '6'} mm²
• Tipo: Cabo de cobre flexível, isolação XLPE/EPR 0,6/1 kV, 70°C
• Identificação: preto/marrom/cinza (fases), azul (neutro), verde/amarelo (PE)
• Comprimento estimado: ${fd.comprimentoCabosCA || '[INSERIR]'} m

9.3 Queda de Tensão CA
  ΔV(CA) = (2 × ${fd.comprimentoCabosCA || '?'} × ${calc.iNomCA} × 0,01724) / ${fd.secaoCaboCA || '6'} = ${calc.dvcaV} V
  ΔV(CA)% = ${calc.dvcaV} / 220 × 100 = ${calc.dvcaP}%
${calc.dvcaP <= 4 ? '✔ Queda de tensão CA dentro do limite de 4% (ABNT NBR 5410).' : '⚠ Verificar bitola do cabo CA — queda superior a 4% (NBR 5410).'}

9.4 Infraestrutura de Dutos
• Dutos CC: eletroduto de PEAD corrugado dupla parede, cor vermelho, fixado a cada 1,0 m
• Dutos CA: eletroduto de PVC rígido (ou ferro galvanizado em área externa), fixado a cada 1,0 m
• Circuitos CC e CA em dutos separados (NBR 16690 seção 5.4)
• Identificação permanente a cada 3,0 m

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. ESTIMATIVA DE GERAÇÃO E IMPACTO AMBIENTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10.1 Geração Estimada

Fórmula: E(ano) = Pp × HSP × PR × 365
  Pp  = ${calc.kWp} kWp (potência de pico instalada)
  HSP = ${IRRAD} kWh/m²/dia (Horas de Sol Pleno — Porto Alegre/RS, CRESESB)
  PR  = ${PR} (Performance Ratio — fator de perdas globais do sistema)

  E(ano) = ${calc.kWp} × ${IRRAD} × ${PR} × 365 = ${calc.geracaoAnual.toLocaleString('pt-BR')} kWh/ano
  E(mês) ≈ ${Math.round(calc.geracaoAnual / 12).toLocaleString('pt-BR')} kWh/mês

${calc.percentualAtendimento ? `Atendimento estimado ao consumo da UC: ${calc.percentualAtendimento}% (consumo médio declarado: ${fd.consumoMensalKwh} kWh/mês)` : ''}
Economia financeira estimada: R$ ${calc.economiaAnual.toLocaleString('pt-BR')}/ano (tarifa média R$ ${TARIFA}/kWh)

10.2 Impacto Ambiental
[[[IA_NARRATIVA_SEC10]]]

Dados calculados para composição do texto ambiental:
  CO₂ evitado/ano: ${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg CO₂ (fator SIN: 0,10 kgCO₂/kWh)
  CO₂ evitado em 25 anos: ${calc.co2Em25Anos.toLocaleString('pt-BR')} kg CO₂
  Equivalente em árvores: ${calc.arvoresEquivalente.toLocaleString('pt-BR')} árvores/ano

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. PLACAS E IDENTIFICAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Conforme NT.00020.EQTL-06 (Seção 10), devem ser instaladas placas de advertência com as seguintes especificações:

• Material: Policarbonato com aditivos anti-raios UV
• Espessura mínima: 2 mm
• Cor de fundo: Amarela (masterização 2%)
• Tipo de letra: Arial Black
• Dimensões padrão: 25 cm (largura) × 18 cm (altura)

Texto obrigatório (todos os pontos de acesso ao sistema):
  ┌────────────────────────────────────────┐
  │ ⚠ CUIDADO — RISCO DE CHOQUE ELÉTRICO  │
  │         GERAÇÃO PRÓPRIA               │
  │   Este ponto possui energia fotovolt. │
  │   Desligue o inversor antes da manutenção│
  └────────────────────────────────────────┘

Posicionamento obrigatório:
  a) Junto ao medidor de energia / caixa de medição
  b) No Quadro de Distribuição CA-FV
  c) No String Box (proteção CC)
  d) Nas calhas e eletrodutos do sistema FV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. COMISSIONAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[[[IA_NARRATIVA_SEC12]]]

12.1 Inspeção Prévia — Sistema CC
□ Verificar conformidade dos equipamentos instalados com o projeto aprovado
□ Verificar ligações entre módulos, String Box e inversor
□ Confirmar Voc e Isc de cada string individualmente
□ Verificar classes de isolamento e dupla isolação dos cabos CC
□ Verificar instalação dos conectores MC4 (travamento e estanqueidade)
□ Verificar operacionalidade das chaves seccionadoras CC
□ Verificar continuidade do condutor de proteção (PE)
□ Verificar etiquetagem permanente e durável em todos os componentes CC

12.2 Inspeção Prévia — Sistema CA
□ Verificar aparelho de comando para isolamento dos inversores
□ Verificar compatibilidade dos inversores com a rede pública (tensão, frequência)
□ Verificar etiquetagem de todos os equipamentos CA
□ Verificar esquema elétrico afixado junto ao quadro de comando
□ Verificar instruções de desligamento de emergência afixadas

12.3 Testes e Ensaios

12.3.1 Continuidade do Condutor de Proteção
Procedimento: Medir resistência entre todas as partes metálicas não-ativas e o barramento de terra.
Critério de aceitação: Continuidade confirmada (≤ 0,5 Ω).

12.3.2 Verificação de Polaridade
Procedimento: Verificar polaridade de cada string antes da conexão ao inversor.
Critério de aceitação: Polaridade correta confirmada em 100% das strings.

12.3.3 Tensão de Circuito Aberto (Voc) das Strings
Procedimento: Medir Voc de cada string individualmente com multímetro adequado para CC.
Valor esperado de projeto: ${calc.vocStr} V (em STC: 1000 W/m², 25°C).
Critério de aceitação: Variação ≤ ±5% entre strings e em relação ao valor de projeto.

12.3.4 Corrente de Curto-Circuito (Isc) das Strings
Procedimento: Medir Isc utilizando equipamento apropriado (amperímetro de alicate).
Valor esperado de projeto: ${calc.iscStr} A por string.
Critério de aceitação: Variação ≤ ±5% entre strings.

12.3.5 Corrente Operacional das Strings
Procedimento: Medir corrente de cada string em operação normal (irradiação > 700 W/m²).
Critério de aceitação: Variação ≤ ±5% entre strings.

12.3.6 Ensaios Funcionais
□ Verificar operacionalidade de todos os aparelhos de comando e sinalização
□ Verificar indicadores e display dos inversores (sem alarmes ativos)
□ Testar função anti-ilhamento (conforme manual do inversor)
□ Confirmar injeção de energia na rede (medidor avançando no sentido correto)

12.3.7 Resistência de Isolamento das Strings
IMPORTANTE: Executar com no mínimo duas pessoas. Bloquear acesso à área.
Procedimento: Aplicar tensão de ensaio entre os condutores CC e a terra.
Curto-circuitar os terminais + e − para medição com megôhmetro.
Critério de aceitação: Resistência de isolamento ≥ 1 MΩ.
Após o ensaio: descarregar os cabos antes de reconectar.

12.3.8 Inspeção Termográfica (recomendada)
Equipamento: câmera de imagem térmica (resolução mínima 160×120 px).
Pontos de inspeção: frente dos módulos FV, diodos de bypass, String Box, conectores MC4.
Critério de aceitação: ausência de hotspots (pontos quentes > 10°C acima da média).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. EXPLORAÇÃO E MANUTENÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13.1 Periodicidade de Verificações
• Primeiros 5 anos de operação: ensaios e inspeções ANUAIS
• A partir do 6° ano: ensaios e inspeções A CADA 2 ANOS
• Inspeção visual dos módulos: SEMESTRAL (limpeza e verificação de danos)

Ensaios periódicos recomendados (mesmos do comissionamento):
• Continuidade do condutor de proteção
• Tensão de circuito aberto e corrente das strings
• Ensaios funcionais do inversor
• Resistência de isolamento dos condutores CC
• Inspeção termográfica

13.2 Operações em Caso de Falha
I.   Falha em módulo individual: acionar chave seccionadora da string correspondente
II.  Falha no inversor: desligar disjuntor CA + todas as chaves seccionadoras CC
III. Falha geral: desligar disjuntor geral CA + todas as seccionadoras + informar distribuidora

13.3 Procedimento de Desligamento de Emergência
1. Desligar o disjuntor geral do QGBT (interrompe CA)
2. Desligar o disjuntor CA-FV no Quadro CA
3. Desligar todas as chaves seccionadoras na String Box
4. Aguardar descarga dos capacitores do inversor (mínimo 5 minutos)
5. Afixar etiqueta de bloqueio: "SISTEMA EM MANUTENÇÃO — NÃO ENERGIZAR"

13.4 Manutenção dos Módulos FV
• Limpeza com água e esponja macia (evitar abrasivos e solventes)
• Não pisar sobre os módulos
• Verificar integridade do vidro frontal e junções de borracha
• Verificar fixação dos grampos e trilhos (torque conforme fabricante)

13.5 Manutenção do Inversor
• Seguir rigorosamente o manual do fabricante
• Limpar filtros de ventilação conforme periodicidade indicada
• Verificar DPS (indicador luminoso): substituir se ativado
• Aguardar descarga dos capacitores (≥ 5 min) antes de qualquer intervenção interna

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. NOTAS DE SEGURANÇA — NR-10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Todos os serviços elétricos devem ser executados por profissionais habilitados e autorizados conforme NR-10 (Portaria MTE 598/2004).
• Os módulos fotovoltaicos geram tensão CC assim que expostos à luz, mesmo em situações de emergência — não há forma de interromper a geração CC sem bloquear fisicamente a luz solar.
• A tensão CC do barramento pode atingir ${calc.vocMax} V. Utilizar EPI adequado (luvas isolantes, capacetes e óculos de proteção) durante manutenção.
• Sinalizar e isolar a área de trabalho antes de qualquer intervenção.
• Em caso de incêndio: NUNCA usar água no sistema — utilizar extintor de CO₂ ou pó químico. Notificar o Corpo de Bombeiros informando a presença de sistema fotovoltaico.
• Manter o Livro de Inspeção e os registros de ensaios disponíveis na instalação.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. NORMAS E ESPECIFICAÇÕES TÉCNICAS ADOTADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Lei Federal n° 14.300/2022 — Marco Legal da Geração Distribuída
• REN ANEEL n° 1.000/2021 — Condições gerais de fornecimento e distribuição
• NT.00020.EQTL-06 — Norma Técnica CEEE Equatorial (revisão dezembro/2025)
• ABNT NBR 16690:2019 — Requisitos para documentação e comissionamento
• ABNT NBR 5410:2004 — Instalações elétricas de baixa tensão
• ABNT NBR 5419:2015 — Proteção contra descargas atmosféricas
• ABNT NBR 10899:2013 — Energia solar fotovoltaica — Terminologia
• ABNT NBR 11704:2008 — Sistemas fotovoltaicos — Classificação
• ABNT NBR 16149:2013 — Interface de conexão com a rede elétrica
• ABNT NBR 16150:2013 — Interface de conexão — Procedimento de ensaio
• ABNT NBR IEC 62116 — Procedimento de ensaio de anti-ilhamento
• IEC 61727 — PV Systems — Characteristics of the Utility Interface
• PRODIST Módulo 3 — Acesso ao Sistema de Distribuição

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSÁVEL TÉCNICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome:       ${fd.nomeResponsavel || '_______________________________'}
CRT/CREA:   ${fd.numeroCRT || '_______________________________'}
Empresa:    ${fd.nomeEmpresa || 'Instalight Energia Solar'}
Data:       ${hoje}

Assinatura: _______________________________

${fd.cidade || 'Porto Alegre'}, ${hoje}.`;
}

/** Textos padrão para o modo básico (sem IA). */
export function aplicarTextosBasicos(template: string, fd: FormData, calc: Calculos): string {
  return template
    .replace(
      /\[\[\[IA_NARRATIVA_SEC1\]\]\]/g,
      `Este Memorial Técnico-Descritivo tem como objetivo apresentar as informações técnicas necessárias para a solicitação de acesso à rede de distribuição da CEEE Equatorial para o sistema de ${calc.enq} fotovoltaica de ${calc.kWp} kWp, a ser instalado na Unidade Consumidora de titularidade de ${fd.nomeCliente || '[INSERIR NOME]'}, conforme os requisitos estabelecidos pela Lei Federal n° 14.300/2022 e REN ANEEL n° 1.000/2021.

O projeto foi elaborado pela empresa ${fd.nomeEmpresa || 'Instalight Energia Solar'} e o Responsável Técnico é o(a) engenheiro(a) ${fd.nomeResponsavel || '[INSERIR RT]'}, inscrito(a) no CRT/CREA sob n° ${fd.numeroCRT || '[INSERIR]'}, que assume integral responsabilidade técnica pelo projeto e execução da instalação, conforme documentação de responsabilidade técnica junto ao conselho profissional competente.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC7\]\]\]/g,
      `Os módulos fotovoltaicos serão instalados sobre estrutura de suporte em alumínio anodizado com tratamento anti-corrosão, fixada sobre cobertura do tipo ${fd.tipoTelhado}. O sistema de fixação foi dimensionado para suportar cargas de vento de até 180 km/h conforme ABNT NBR 6118.

Serão utilizados perfis de alumínio anodizado de alta resistência com conectores e grampos em aço inoxidável AISI 304, garantindo durabilidade mínima de 25 anos sem necessidade de pintura ou tratamento superficial adicional.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC10\]\]\]/g,
      `A implantação do sistema fotovoltaico de ${calc.kWp} kWp contribuirá para a redução das emissões de gases de efeito estufa decorrentes da geração convencional de energia, estimando-se uma redução de ${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg de CO₂ por ano, equivalente ao plantio de ${calc.arvoresEquivalente.toLocaleString('pt-BR')} árvores anuais e a ${calc.co2Em25Anos.toLocaleString('pt-BR')} kg de CO₂ ao longo de 25 anos de vida útil do sistema.

O sistema conectado à rede (On Grid) permite ainda a injeção do excedente de energia na rede de distribuição, gerando créditos de energia conforme o sistema de compensação previsto na Lei Federal n° 14.300/2022, maximizando o aproveitamento da fonte solar e a eficiência energética da instalação.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC12\]\]\]/g,
      `O comissionamento do sistema fotovoltaico deve ser realizado por profissional habilitado e autorizado em instalações elétricas conforme NR-10, com o objetivo de verificar a conformidade da instalação com o projeto aprovado, identificar eventuais anomalias e garantir a segurança e o desempenho do sistema antes da energização definitiva.

Todos os resultados dos testes e ensaios deverão ser registrados em relatório técnico, assinado pelo responsável técnico, e arquivados na instalação para consulta durante a vida útil do sistema.`,
    );
}
