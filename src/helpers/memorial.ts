/**
 * memorial.ts — Template do Memorial Técnico-Descritivo
 *
 * Estrutura conforme NT.00020.EQTL-06 Anexo III REV 06 (12/2025):
 *   Seções  1–12: obrigatórias CEEE
 *   Seções 13–16: complementares (comissionamento, manutenção, segurança, normas)
 *
 * Marcadores IA (substituídos pela IA ou pelo modo básico):
 *   [[[IA_NARRATIVA_SEC1]]]  — seção 1 Objetivo
 *   [[[IA_NARRATIVA_SEC7]]]  — seção 9 Estrutura de Fixação
 *   [[[IA_NARRATIVA_SEC10]]] — seção 6 Impacto Ambiental
 *   [[[IA_NARRATIVA_SEC12]]] — seção 13 Comissionamento (introdução)
 */

import type { FormData, Calculos } from '../types';
import { IRRAD, PR, TARIFA, CO2_FACTOR } from '../constants';

const num = (v: string | undefined, d = 0): number => parseFloat(v ?? '') || d;

export function buildMemorialTemplate(fd: FormData, calc: Calculos): string {
  // ── Derivadas de layout ───────────────────────────────────────────────────
  const fases: Record<string, string> = {
    Monofásico: '2 (fase + neutro)',
    Bifásico:   '3 (duas fases + neutro)',
    Trifásico:  '4 (três fases + neutro + terra)',
  };
  const tensoes: Record<string, string> = {
    Monofásico: '220 V',
    Bifásico:   '220 V',
    Trifásico:  '380/220 V',
  };
  const condutoresFase: Record<string, string> = {
    Monofásico: '1 condutor FASE',
    Bifásico:   '2 condutores FASE',
    Trifásico:  '3 condutores FASE',
  };
  const tensaoNominal = tensoes[fd.tipoLigacao] || '220 V';

  const dataObj = fd.dataproject ? new Date(fd.dataproject + 'T12:00:00') : new Date();
  const dataCompleta = dataObj.toLocaleDateString('pt-BR');
  const mesCover = dataObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const anoCover = dataObj.getFullYear();

  // ── Atalhos de formulário ─────────────────────────────────────────────────
  const nPaineis    = fd.numeroPaineis       || '[INSERIR]';
  const modPainel   = fd.modeloPainel        || '[INSERIR MODELO]';
  const wpPainel    = fd.potenciaUnitariaWp  || '[INSERIR]';
  const nSerie      = fd.paineisSerie        || '[INSERIR]';
  const nPar        = fd.stringParalelo      || '[INSERIR]';
  const modInv      = fd.modeloInversor      || '[INSERIR MODELO]';
  const potCAkW     = fd.potenciaCAkW        || '[INSERIR]';
  const nInv        = fd.quantidadeInversores || '1';
  const VinCC       = fd.tensaoEntradaCC     || '[INSERIR]';
  const VoutCA      = fd.tensaoSaidaCA       || '220';
  const djCC        = fd.disjuntorCC         || String(calc.iDjCCMin || '[INSERIR]');
  const djCA        = fd.disjuntorCA         || String(calc.iDjCAMin || '[INSERIR]');
  const idg         = fd.disjuntorEntrada    || '[INSERIR — DJ GERAL DO PADRÃO DE ENTRADA]';

  // Novos campos CEEE
  const tipoCaract  = fd.tipoCaracterizacao  || 'Autoconsumo Local';
  const profRT      = fd.profissaoRT         || '[PROFISSÃO]';

  const comprPainel  = fd.comprimentoPainel  || '[INSERIR]';
  const largPainel   = fd.larguraPainel      || '[INSERIR]';
  const areaPainel   = (fd.comprimentoPainel && fd.larguraPainel)
    ? (parseFloat(fd.comprimentoPainel) * parseFloat(fd.larguraPainel)).toFixed(3)
    : '[CALCULAR: C×L]';
  const pesoPainelVal = fd.pesoPainel        || '[INSERIR]';

  const tipoCaixa   = fd.tipoCaixaMedicao    || 'Existente';
  const localCaixa  = fd.localInstalacaoCaixa || 'Muro';

  const temDSV      = fd.temDSV              || 'Não';
  const descDSV     = fd.caracteristicasDSV  || '—';

  const potMaxCCInv = fd.potMaxCCInv         || '[INSERIR]';
  const iMaxCCInv   = fd.iMaxCCInv           || '[INSERIR]';
  const potMaxCAInv = fd.potMaxCAInv         || potCAkW;
  const iMaxCAInv   = fd.iMaxCAInv           || String(calc.iDimCA || '[INSERIR]');
  const vCAmaxInv   = fd.vCAmaxInv           || '[INSERIR]';
  const vCAminInv   = fd.vCAminInv           || '[INSERIR]';

  // Identificação do cliente na capa
  const idCapa = fd.tipoPessoa === 'fisica'
    ? `RG: ${fd.rgCliente || '[INSERIR RG]'}`
    : `CNPJ: ${fd.cpfCnpj || '[INSERIR CNPJ]'}`;

  // ── Seção 0: Ampliação (condicional) ─────────────────────────────────────
  const secaoAmpliacao = fd.tipoInstalacao === 'Ampliação' ? `
------------------------------------------------------------
0. CARACTERIZAÇÃO DA AMPLIAÇÃO — SISTEMA EXISTENTE + NOVO
------------------------------------------------------------
Este memorial refere-se a projeto de AMPLIAÇÃO de sistema fotovoltaico conectado à rede
(microgeração/minigeração distribuída) existente e previamente homologado junto à CEEE Equatorial.

A análise técnica e o parecer de acesso da distribuidora devem considerar a usina fotovoltaica
de forma CONSOLIDADA, ou seja, o sistema existente + a nova ampliação como uma única unidade
geradora instalada na Unidade Consumidora ${fd.codigoUC || '[INSERIR UC]'}.

Dados da aprovação anterior:
  Protocolo/Parecer anterior: ${fd.parecerAcessoAnterior || '[INFORMAR]'}
  Data de aprovação anterior: ${fd.dataAprovacaoAnterior || '[INFORMAR]'}
  ART/TRT anterior:           ${fd.artTrtAnterior || '[INFORMAR]'}

Escopo desta ampliação:
  Tipo de ampliação (inversor): ${fd.tipoAmpliacao}
  Situação do padrão de entrada: ${fd.situacaoPadrao}
${fd.observacoesExistente ? `  Observações: ${fd.observacoesExistente}` : ''}

Balanço de potências — Sistema Consolidado:

| Item                | Sistema Existente     | Ampliação Proposta    | Total após Ampliação  |
|---------------------|-----------------------|-----------------------|-----------------------|
| Potência CC (kWp)   | ${String(calc.kWpExistente).padEnd(21)} | ${String(calc.kWp).padEnd(21)} | ${String(calc.kWpTotal).padEnd(21)} |
| Potência CA (kW)    | ${String(calc.kWtCAExistente).padEnd(21)} | ${String(calc.kWtCA).padEnd(21)} | ${String(calc.kWtCATotal).padEnd(21)} |
| Nº módulos          | ${String(fd.numeroPaineisExistentes || '—').padEnd(21)} | ${String(fd.numeroPaineis || '—').padEnd(21)} | ${String((num(fd.numeroPaineisExistentes) + num(fd.numeroPaineis)) || '—').padEnd(21)} |
| Nº inversores       | ${String(fd.quantidadeInversoresExistente || '1').padEnd(21)} | ${String(fd.quantidadeInversores || '1').padEnd(21)} | ${String((num(fd.quantidadeInversoresExistente, 1) + num(fd.quantidadeInversores, 1))).padEnd(21)} |
| Enquadramento       | ${String(calc.enqNovo.replace(' Distribuída','')).padEnd(21)} | ${String(calc.enqNovo.replace(' Distribuída','')).padEnd(21)} | ${String(calc.enqTotal).padEnd(21)} |

${calc.percentualAumentokWp !== null
  ? `Acréscimo de potência CC: ${calc.percentualAumentokWp}% do sistema existente (+${calc.kWp} kWp)`
  : ''}
${calc.percentualAumentokWtCA !== null
  ? `Acréscimo de potência CA: ${calc.percentualAumentokWtCA}% do sistema existente (+${calc.kWtCA} kW)`
  : ''}

Equipamentos existentes:
  Módulos FV:  ${fd.numeroPaineisExistentes || '—'} módulos ${fd.modeloPainelExistente || '—'} — ${fd.potenciaWpExistente || '—'} Wp/unidade
  Inversor:    ${fd.modeloInversorExistente || '—'} — ${fd.potenciaCAExistentekW || '—'} kW CA × ${fd.quantidadeInversoresExistente || '1'} unidade(s)
  Potência CC existente: ${calc.kWpExistente} kWp | Potência CA existente: ${calc.kWtCAExistente} kW

` : '';

  // ── TEMPLATE PRINCIPAL ────────────────────────────────────────────────────
  return `MEMORIAL TÉCNICO DESCRITIVO
REV — ${mesCover}/${anoCover}

${fd.tipoInstalacao === 'Ampliação' ? 'AMPLIAÇÃO DE ' : ''}${calc.enq.toUpperCase()} UTILIZANDO UM SISTEMA FOTOVOLTAICO DE ${calc.kWp} kWp
CONECTADO À REDE DE ENERGIA ELÉTRICA DE BAIXA TENSÃO EM ${tensaoNominal}
CARACTERIZADO COMO ${tipoCaract.toUpperCase()}

${fd.nomeCliente || '[NOME DO CLIENTE]'}
${idCapa}

${fd.nomeResponsavel || '[NOME DO RESPONSÁVEL TÉCNICO]'}
${profRT}
REGISTRO: ${fd.numeroCRT || 'XXXXXXXXXX'}

${fd.cidade || 'Porto Alegre'} — RS
${mesCover} — ${anoCover}

${secaoAmpliacao}
------------------------------------------------------------
LISTA DE SIGLAS E ABREVIATURAS
------------------------------------------------------------
ABNT:    Associação Brasileira de Normas Técnicas
ANEEL:   Agência Nacional de Energia Elétrica
BT:      Baixa Tensão (220/127 V, 380/220 V)
C.A:     Corrente Alternada
C.C:     Corrente Contínua
CD:      Custo de Disponibilidade (30/50/100 kWh — mono/bi/trifásico)
CI:      Carga Instalada
DPS:     Dispositivo de Proteção contra Surtos
DSP:     Dispositivo Supressor de Surto
DSV:     Dispositivo de Seccionamento Visível
FP:      Fator de Potência
FV:      Fotovoltaico
GD:      Geração Distribuída
HSP:     Horas de Sol Pleno
IEC:     International Electrotechnical Commission
IDG:     Corrente nominal do disjuntor de entrada da UC em ampéres (A)
IN:      Corrente Nominal
Ist:     Corrente de curto-circuito de módulo fotovoltaico (A)
kW:      Quilowatt
kWh:     Quilowatt-hora
kWp:     Quilowatt-pico
MicroGD: Microgeração Distribuída
MT:      Média Tensão (13,8 kV, 34,5 kV)
NF:      Fator referente ao número de fases — 1 para mono/bifásico; √3 para trifásico
PD:      Potência disponibilizada para a UC onde será instalada a GD
PR:      Performance Ratio (Fator de Desempenho do Sistema)
PRODIST: Procedimentos de Distribuição
QGD:     Quadro Geral de Distribuição
QGBT:    Quadro Geral de Baixa Tensão
REN:     Resolução Normativa
SFV:     Sistema Fotovoltaico
SFVCR:   Sistema Fotovoltaico Conectado à Rede
SPDA:    Sistema de Proteção contra Descargas Atmosféricas
TC:      Transformador de Corrente
TP:      Transformador de Potencial
UC:      Unidade Consumidora
UTM:     Universal Transversa de Mercator
VN:      Tensão nominal de atendimento em volts (V)
Voc:     Tensão de circuito aberto de módulo fotovoltaico (V)

------------------------------------------------------------
SUMÁRIO
------------------------------------------------------------
1.  OBJETIVO
2.  REFERÊNCIAS NORMATIVAS E REGULATÓRIAS
3.  DADOS DA UNIDADE CONSUMIDORA
4.  LEVANTAMENTO DE CARGA
5.  PADRÃO DE ENTRADA
    5.1  Tipo de Ligação e Tensão de Atendimento
    5.2  Disjuntor de Entrada
    5.3  Potência Disponibilizada
    5.4  Caixa de Medição
    5.5  Ramal de Entrada
6.  ESTIMATIVA DE GERAÇÃO
7.  DIMENSIONAMENTO DO GERADOR
    7.1  Características Técnicas dos Módulos FV
    7.2  Topologia das Strings
    7.3  Queda de Tensão em Corrente Contínua
8.  DIMENSIONAMENTO DO INVERSOR
9.  ESTRUTURA DE FIXAÇÃO
10. DIMENSIONAMENTO DA PROTEÇÃO
    10.1 Fusíveis CC
    10.2 Disjuntores
    10.3 Dispositivo de Seccionamento Visível
    10.4 DPS
    10.5 Aterramento
    10.6 Requisitos de Proteção
11. DIMENSIONAMENTO DOS CABOS
12. PLACA DE ADVERTÊNCIA
13. COMISSIONAMENTO
14. EXPLORAÇÃO E MANUTENÇÃO
15. NOTAS DE SEGURANÇA — NR-10
16. NORMAS E ESPECIFICAÇÕES TÉCNICAS ADOTADAS
    RESPONSÁVEL TÉCNICO

------------------------------------------------------------
1. OBJETIVO
------------------------------------------------------------
[[[IA_NARRATIVA_SEC1]]]

------------------------------------------------------------
2. REFERÊNCIAS NORMATIVAS E REGULATÓRIAS
------------------------------------------------------------
Para elaboração deste memorial técnico descritivo, no âmbito da área de concessão do
estado do Rio Grande do Sul, foram utilizadas as normas e resoluções vigentes:

a) ABNT NBR 5410: Instalações Elétricas de Baixa Tensão.
b) ABNT NBR 10899: Energia Solar Fotovoltaica — Terminologia.
c) ABNT NBR 11704: Sistemas Fotovoltaicos — Classificação.
d) ABNT NBR 16149: Sistemas FV — Características da interface de conexão com a rede.
e) ABNT NBR 16150: Sistemas FV — Interface de conexão — Procedimentos de ensaio.
f) ABNT NBR IEC 62116: Procedimento de Ensaio de Anti-ilhamento para Inversores FV.
g) ABNT NBR 16690:2019 — Sistemas fotovoltaicos — Requisitos para documentação técnica.
h) ABNT NBR 5419:2015 — Proteção de estruturas contra descargas atmosféricas.
i) EQUATORIAL ENERGIA NT.00020.EQTL — Conexão de Micro/Minigeração Distribuída ao Sistema de BT.
j) EQUATORIAL ENERGIA NT.00001.EQTL — Fornecimento de Energia Elétrica em Baixa Tensão.
k) EQUATORIAL ENERGIA NT.00030.EQTL — Padrões Construtivos de Caixas de Medição e Proteção.
l) ANEEL PRODIST Módulo 3 — Conexão ao Sistema de Distribuição de Energia Elétrica.
m) ANEEL REN n° 1.000/2021 — Regras de prestação do serviço público de distribuição.
n) ANEEL REH n° 3.171/2023 — Homologa o formulário de Orçamento de Conexão de GD.
o) Lei Federal n° 14.300/2022 — Marco Legal da Microgeração e Minigeração Distribuída.
p) IEC 61727 — Photovoltaic (PV) Systems — Characteristics of the Utility Interface.
q) IEC 62116:2014 — Utility-interconnected PV inverters — Test procedure anti-islanding.

------------------------------------------------------------
3. DADOS DA UNIDADE CONSUMIDORA
------------------------------------------------------------
Número da Conta-Contrato: ${fd.numContaContrato || '[INSERIR CONTA-CONTRATO]'}
Classe:                   ${fd.classeUC || 'Residencial'}
Nome do Titular:          ${fd.nomeCliente || '[INSERIR NOME]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}:                      ${fd.cpfCnpj || '[INSERIR]'}
${fd.tipoPessoa === 'fisica' ? `RG:                       ${fd.rgCliente || '[INSERIR RG]'}` : ''}
Tipo de Instalação:       ${fd.tipoInstalacao || 'Nova'}
Enquadramento:            ${fd.tipoInstalacao === 'Ampliação' ? calc.enqTotal : calc.enq}
Endereço Completo:        ${fd.endereco || '[INSERIR ENDEREÇO COMPLETO]'}
Cidade / UF:              ${fd.cidade || 'Porto Alegre'} / RS
CEP:                      ${fd.cep || '[INSERIR CEP]'}
Nº Poste / Transformador: ${fd.numPoste || '[INSERIR Nº DO POSTE]'} / ${fd.transformador || '[CONSULTAR CEEE]'}
Coordenadas (Graus Dec.): Lat ${fd.latitude || '[INSERIR]'} / Long ${fd.longitude || '[INSERIR]'}
Consumo médio mensal:     ${fd.consumoMensalKwh ? fd.consumoMensalKwh + ' kWh/mês' : '[INSERIR CONSUMO MÉDIO]'}
Fatura de referência:     ${fd.numeroFatura || '[INSERIR Nº FATURA]'}
Distribuidora:            CEEE Equatorial (concessão Rio Grande do Sul)
Nº do Medidor:            ${fd.numeroMedidor || '[a instalar pela CEEE]'}
${fd.tipoPessoa === 'juridica' && fd.nomeRepresentante ? `
Representante Legal:      ${fd.nomeRepresentante}
CPF Representante:        ${fd.cpfRepresentante || '[INSERIR]'}
RG Representante:         ${fd.rgRepresentante || '[INSERIR]'}
Cargo:                    ${fd.cargoRepresentante || '[INSERIR]'}
E-mail:                   ${fd.emailContato || '[INSERIR]'}
Telefone:                 ${fd.telefoneContato || '[INSERIR]'}
` : ''}
[INSERIR AQUI A PLANTA DE SITUAÇÃO indicando a localização da Unidade Consumidora.
 São aceitas imagens de fundo de mapas da internet, desde que contenham escala e norte
 indicados — conforme Nota 2 da NT.00020.EQTL-06.]
${fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0 ? `
3.1 SISTEMA FOTOVOLTAICO EXISTENTE (antes da ampliação)
Módulos FV:          ${fd.numeroPaineisExistentes || '—'} módulos ${fd.modeloPainelExistente || '—'} — ${fd.potenciaWpExistente || '—'} Wp/unidade
Inversor:            ${fd.modeloInversorExistente || '—'} — ${fd.potenciaCAExistentekW || '—'} kW CA × ${fd.quantidadeInversoresExistente || '1'} unidade(s)
Potência CC (exist): ${calc.kWpExistente} kWp | Potência CA (exist): ${calc.kWtCAExistente} kW

3.2 SISTEMA TOTAL APÓS AMPLIAÇÃO
Potência CC total:   ${calc.kWpTotal} kWp
Potência CA total:   ${calc.kWtCATotal} kW CA
Enquadramento:       ${calc.enqTotal}
` : ''}

------------------------------------------------------------
4. LEVANTAMENTO DE CARGA
------------------------------------------------------------
Tabela 1 — Levantamento de Carga da UC

| ITEM | DESCRIÇÃO               | P(W) | QTD | CI(kW) | FP   | CI(kVA) | FD  | D(kW) | D(kVA) |
|------|-------------------------|------|-----|--------|------|---------|-----|-------|--------|
| 1    | [INSERIR]               |      |     |        |      |         |     |       |        |
| 2    | [INSERIR]               |      |     |        |      |         |     |       |        |
| 3    | [INSERIR]               |      |     |        |      |         |     |       |        |
| 4    | [INSERIR]               |      |     |        |      |         |     |       |        |
| 5    | [INSERIR]               |      |     |        |      |         |     |       |        |
| 6    | [INSERIR]               |      |     |        |      |         |     |       |        |
| TOTAL|                         |      |     |        |      |         |     |       |        |

Fórmulas: CI(kW) = P×Qtd/1000 | CI(kVA) = CI(kW)/FP | D(kW) = CI(kW)×FD | D(kVA) = CI(kVA)×FD

Nota: O levantamento de carga é obrigatório para solicitação de ligação nova ou ligação
existente com aumento de carga (conforme NT.00020.EQTL-06).
${fd.consumoMensalKwh ? `Consumo médio declarado: ${fd.consumoMensalKwh} kWh/mês` : ''}

------------------------------------------------------------
5. PADRÃO DE ENTRADA
------------------------------------------------------------
5.1. Tipo de Ligação e Tensão de Atendimento

A unidade consumidora é ligada em ramal de ligação em baixa tensão, através de um circuito
${fd.tipoLigacao.toLowerCase()} à ${fases[fd.tipoLigacao] || '[VERIFICAR]'} condutores, sendo ${condutoresFase[fd.tipoLigacao] || '[INSERIR]'}
de seção nominal ${fd.ramalEntrada || '[INSERIR]'} mm² e um condutor NEUTRO de seção nominal [INSERIR] mm²,
com tensão de atendimento em ${tensaoNominal} / 60 Hz, derivado de uma rede
aérea/subterrânea de distribuição secundária da CEEE Equatorial no estado do Rio Grande do Sul.

5.2. Disjuntor de Entrada

No ponto de entrega/conexão é instalado um disjuntor termomagnético, em conformidade com a
norma NT.00001.EQTL da Equatorial Energia, com as seguintes características:

NÚMERO DE POLOS:                ${fd.tipoLigacao === 'Monofásico' ? '2 (bipolar)' : fd.tipoLigacao === 'Trifásico' ? '4 (quadripolar)' : '3 (tripolar)'}
TENSÃO NOMINAL:                 ${tensaoNominal}
CORRENTE NOMINAL (IDG):         ${idg} A
FREQUÊNCIA NOMINAL:             60 Hz
ELEMENTO DE PROTEÇÃO:           TERMOMAGNÉTICO
CAPACIDADE MÁXIMA DE INTERRUPÇÃO: mínimo 5 kA
ACIONAMENTO:                    MANUAL / AUTOMÁTICO
CURVA DE ATUAÇÃO (DISPARO):     C

5.3. Potência Disponibilizada

A potência disponibilizada para a UC onde será instalada a microGD é:

  PD [kVA] = (VN × IDG × NF) / 1000
  PD [kW]  = PD [kVA] × FP

  VN  = ${tensaoNominal.replace(' V', '')} V (tensão nominal entre fase e neutro — mono/bifásico; entre fases — trifásico)
  IDG = ${idg} A
  NF  = ${fd.tipoLigacao === 'Trifásico' ? '√3 ≈ 1,732' : '1'} (${fd.tipoLigacao})
  FP  = 0,92
  PD (kVA) = ${calc.potDispKVA} kVA
  PD (kW)  = ${calc.potDispKW} kW

${fd.tipoInstalacao === 'Ampliação'
  ? `A potência CA total após ampliação (${calc.kWtCATotal} kW) ${calc.kWtCATotal <= calc.potDispKW ? 'é inferior ou igual à' : 'SUPERA A'} potência disponibilizada (${calc.potDispKW} kW), ${calc.kWtCATotal <= calc.potDispKW ? 'atendendo' : 'NÃO atendendo'} ao requisito normativo (sistema consolidado).`
  : `A potência de injeção do gerador (${calc.kWtCA} kW CA) ${calc.kWtCA <= calc.potDispKW ? 'é inferior ou igual à' : 'SUPERA A'} potência disponibilizada (${calc.potDispKW} kW), ${calc.kWtCA <= calc.potDispKW ? 'atendendo' : 'NÃO atendendo'} ao requisito normativo.`
}
Nota: A potência de geração deve ser menor ou igual à PD em kW (NT.00020.EQTL-06 §5.3).

5.4. Caixa de Medição

A caixa de medição [${tipoCaixa.toUpperCase()}] em material polimérico está (será) instalada
em ${localCaixa}, no ponto de entrega caracterizado como o limite da via pública com a
propriedade, em conformidade com as normas NT.00001.EQTL e NT.00030.EQTL da CEEE Equatorial.

[INSERIR AQUI O DESENHO DIMENSIONAL DETALHADO DA CAIXA DE MEDIÇÃO com suas
 dimensões (comprimento × altura × largura em mm) e detalhes internos/externos — conforme
 Figura 2 do Anexo III NT.00020.EQTL-06.]

O aterramento da caixa de medição é (será) com ${fd.aterramento || '[INSERIR] hastes de aterramento'},
condutor de ${fd.secaoCaboAterr || '16'} mm² com conexão em [solda exotérmica ou conector tipo XXXXXXX].

5.5. Ramal de Entrada

O ramal de entrada da unidade consumidora é, através de um circuito ${fd.tipoLigacao.toLowerCase()}
à ${fases[fd.tipoLigacao] || '[VERIFICAR]'} condutores, sendo ${condutoresFase[fd.tipoLigacao] || '[INSERIR]'}
de diâmetro nominal ${fd.ramalEntrada || '[INSERIR]'} mm² e um condutor NEUTRO de diâmetro nominal
[INSERIR] mm², em ${tensaoNominal}.
Material do cabo: ${fd.materialCaboEntrada || 'Cobre'}.

------------------------------------------------------------
6. ESTIMATIVA DE GERAÇÃO
------------------------------------------------------------
6.1 Geração Estimada

Fórmula: E(ano) = Pp × HSP × PR × 365
  Pp  = ${calc.kWp} kWp (potência de pico do sistema${fd.tipoInstalacao === 'Ampliação' ? ' — SOMENTE novo' : ''})
  HSP = ${calc.irradEfetivo} kWh/m²/dia${calc.irradEfetivo === IRRAD ? ' (Porto Alegre/RS — CRESESB)' : ' (valor local personalizado)'}
  PR  = ${calc.prEfetivo}${calc.prEfetivo === PR ? ' (Performance Ratio padrão)' : ' (PR personalizado)'}

  E_novo(ano) = ${calc.kWp} × ${calc.irradEfetivo} × ${calc.prEfetivo} × 365 = ${calc.geracaoAnual.toLocaleString('pt-BR')} kWh/ano
  E_novo(mês) ≈ ${Math.round(calc.geracaoAnual / 12).toLocaleString('pt-BR')} kWh/mês
${fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0 ? `
  Sistema total após ampliação (${calc.kWpTotal} kWp):
  E_total(ano) = ${calc.kWpTotal} × ${calc.irradEfetivo} × ${calc.prEfetivo} × 365 = ${calc.geracaoAnualTotal.toLocaleString('pt-BR')} kWh/ano
  E_total(mês) ≈ ${Math.round(calc.geracaoAnualTotal / 12).toLocaleString('pt-BR')} kWh/mês
` : ''}
${calc.percentualAtendimento ? `Atendimento estimado ao consumo da UC: ${calc.percentualAtendimento}% (consumo médio: ${fd.consumoMensalKwh} kWh/mês)` : ''}
Economia financeira estimada: R$ ${calc.economiaAnualTotal.toLocaleString('pt-BR')}/ano (tarifa média CEEE: R$ ${TARIFA}/kWh)

6.2 Impacto Ambiental
[[[IA_NARRATIVA_SEC10]]]

Dados calculados:
  Fator de emissão SIN (ANEEL): ${CO2_FACTOR} kgCO₂/kWh
  CO₂ evitado/ano: ${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg CO₂
  CO₂ evitado em 25 anos: ${calc.co2Em25Anos.toLocaleString('pt-BR')} kg CO₂
  Equivalente em árvores: ${calc.arvoresEquivalente.toLocaleString('pt-BR')} árvores/ano

------------------------------------------------------------
7. DIMENSIONAMENTO DO GERADOR
------------------------------------------------------------
7.1 Características Técnicas dos Módulos FV

Tabela 3 — Características técnicas do gerador (STC: 1000 W/m², AM 1,5, 25°C)

| Parâmetro                              | Valor                    |
|----------------------------------------|--------------------------|
| Fabricante / Modelo                    | ${modPainel}             |
| Potência nominal — Pn [W]              | ${wpPainel} Wp           |
| Tensão de circuito aberto — Voc [V]    | ${fd.vocUnitario || (calc.vocStr > 0 ? (calc.vocStr / Math.max(1, num(nSerie))).toFixed(1) : '[INSERIR]')} V |
| Corrente de curto-circuito — Isc [A]   | ${fd.iscUnitario || calc.iscStr} A |
| Tensão de máxima potência — Vpmp [V]   | ${fd.vmppUnitario || '[INSERIR]'} V |
| Corrente de máxima potência — Ipmp [A] | ${fd.imppUnitario || '[INSERIR]'} A |
| Eficiência [%]                         | ${fd.eficienciaPainel || '[INSERIR]'} % |
| Comprimento [m]                        | ${comprPainel} m         |
| Largura [m]                            | ${largPainel} m          |
| Área [m²]                              | ${areaPainel} m²         |
| Peso [kg]                              | ${pesoPainelVal} kg      |
| Temperatura de operação — NOCT [°C]    | ${fd.noct || '[INSERIR]'} °C |
| Coef. temperatura Voc [%/°C]           | ${fd.coefTempVoc || '[INSERIR]'} %/°C |
| Tensão máxima do sistema               | 1000 V                   |
| Certificação                           | ${fd.certificacaoPainel || '[INSERIR — ex: INMETRO/IEC 61215]'} |
| Quantidade total                       | ${nPaineis} módulos      |
| Potência do gerador [kWp]              | ${calc.kWp} kWp          |

7.2 Topologia das Strings

Configuração: ${nSerie} módulos em série × ${nPar} strings em paralelo = ${nPaineis} módulos totais

| Parâmetro                                  | Valor por String         |
|--------------------------------------------|--------------------------|
| Tensão de circuito aberto Voc (string)     | ${calc.vocStr} V         |
| Voc máximo — fator 1,25 (NBR 16690)        | ${calc.vocMax} V         |
${calc.vocMaxCorr !== null
  ? `| Voc máximo — coef. real γ=${fd.coefTempVoc}%/°C @ ${fd.tempMinima}°C | ${calc.vocMaxCorr} V (NBR 16690 §6.3) |`
  : `| Voc máximo — método preciso (§6.3)         | Preencha Coef.Temp.Voc + Temp.mín. |`}
| Corrente de curto-circuito Isc (string)    | ${calc.iscStr} A         |
| Icc total (${nPar} strings paralelo)       | ${calc.iccTotal} A       |
| Corrente de dimensionamento (Icc × 1,25)   | ${calc.iccNorma} A       |
| Potência por string                        | ${nSerie && wpPainel ? (num(nSerie) * num(wpPainel) / 1000).toFixed(2) : '[CALCULAR]'} kWp |

Nota: Voc máximo de ${calc.vocMaxCorr ?? calc.vocMax} V inferior ao limite de 1000 V (NBR 16690 — sistemas BT).

7.3 Queda de Tensão em Corrente Contínua

Fórmula: ΔV = (2 × L × I × ρ) / S
  L = ${fd.comprimentoCabosCC || '[L]'} m | I = ${calc.iccNorma} A | ρ = 0,01724 Ω·mm²/m | S = ${fd.secaoCaboCC || '6'} mm²

  ΔV(CC) = (2 × ${fd.comprimentoCabosCC || '?'} × ${calc.iccNorma} × 0,01724) / ${fd.secaoCaboCC || '6'} = ${calc.dvccV} V
  ΔV(CC)% = ${calc.dvccV} / ${calc.vocStr} × 100 = ${calc.dvccP}%

${calc.dvccOpP !== null
  ? `ΔV CC Operacional (MPPT):
  I = ${calc.imppTotal} A (Impp total) | V_ref = ${calc.vmppString} V (Vmpp string)
  ΔV(CC_op) = ${calc.dvccOpV} V | ΔV(CC_op)% = ${calc.dvccOpP}%
${calc.dvccOpP <= 3 ? '✔ Queda operacional dentro do limite de 3% (NBR 16690).' : '⚠ Queda operacional superior a 3% — avaliar aumento da bitola CC.'}`
  : `${calc.dvccP <= 3 ? '✔ Queda de tensão CC dentro do limite de 3% (NBR 16690 — método conservador).' : '⚠ Verificar bitola do cabo CC — queda de dimensionamento superior a 3%.'}
(Preencha Vmpp e Impp no formulário para calcular ΔV operacional — grandeza normativa preferida.)`}

------------------------------------------------------------
8. DIMENSIONAMENTO DO INVERSOR (SE HOUVER)
------------------------------------------------------------
Tabela 4 — Características técnicas do inversor

| Parâmetro                                    | Valor                    |
|----------------------------------------------|--------------------------|
| Fabricante / Modelo                          | ${modInv}                |
| Quantidade                                   | ${nInv} unidade(s)       |
|                            ENTRADA (CC)      |                          |
| Potência nominal — Pn [kW]                   | ${potCAkW} kW            |
| Máxima potência entrada CC — Pmax-cc [kW]    | ${potMaxCCInv}           |
| Máxima tensão CC — Vcc-máx [V]               | ${VinCC} V               |
| Máxima corrente CC — Icc-máx [A]             | ${iMaxCCInv}             |
| Máxima tensão MPPT — Vpmp-máx [V]            | ${fd.faixaMPPTMax || '[INSERIR]'} V |
| Mínima tensão MPPT — Vpmp-min [V]            | ${fd.faixaMPPTMin || '[INSERIR]'} V |
| Tensão CC de partida — Vcc-part [V]          | ${fd.tensaoPartidaCC || '[INSERIR]'} V |
| Quantidade de Strings                        | ${nPar}                  |
| Quantidade de entradas MPPT                  | ${fd.numMPPT || '[INSERIR]'} |
|                            SAÍDA (CA)        |                          |
| Potência nominal CA — Pca [kW]               | ${potCAkW} kW            |
| Máxima potência saída CA — Pca-máx [kW]      | ${potMaxCAInv}           |
| Máxima corrente saída CA — Imáx-ca [A]       | ${iMaxCAInv}             |
| Tensão nominal CA — Vnon-ca [V]              | ${VoutCA} V              |
| Frequência nominal — Fn [Hz]                 | 60 Hz                    |
| Máxima tensão CA — Vca-máx [V]               | ${vCAmaxInv}             |
| Mínima tensão CA — Vca-min [V]               | ${vCAminInv}             |
| THD de corrente [%]                          | < 3%                     |
| Fator de potência                            | 1,0                      |
| Tipo de conexão                              | ${fases[fd.tipoLigacao] || '[VERIFICAR]'} |
| Eficiência máxima [%]                        | ${fd.eficienciaInv || '[INSERIR]'} % |
| Grau de proteção                             | IP65 (mínimo)            |
| Proteção anti-ilhamento                      | Integrada (NBR IEC 62116)|

Relação CC/CA: ${calc.kWp > 0 && calc.kWtCA > 0 ? (calc.kWp / calc.kWtCA).toFixed(2) : '[CALCULAR]'} (faixa recomendada 1,0–1,35)
Potência CA total (${nInv} inv.): ${calc.kWtCA} kW

------------------------------------------------------------
9. ESTRUTURA DE FIXAÇÃO
------------------------------------------------------------
Tipo de cobertura: ${fd.tipoTelhado}
[[[IA_NARRATIVA_SEC7]]]

------------------------------------------------------------
10. DIMENSIONAMENTO DA PROTEÇÃO
------------------------------------------------------------
String Box CC: ${fd.modeloStringBox || '(modelo a confirmar com o instalador)'}

10.1 Fusíveis CC

Dimensionamento dos fusíveis CC dos arranjos fotovoltaicos:
• Corrente de curto-circuito por string (Isc_string): ${calc.iscStr} A
• Corrente mínima do fusível: ≥ 1,25 × Isc = ${parseFloat((calc.iscStr * 1.25).toFixed(2))} A
• Tensão nominal mínima do fusível: ≥ ${calc.vocMax} V CC
• Tipo: fusível gPV (IEC 60269-6), adequado para CC

10.2 Disjuntores

Disjuntor de Proteção CC (antes do inversor):
• Número de pólos: 2 (bipolar CC)
• Tensão nominal CC: ${calc.vocMax} V
• Corrente nominal selecionada: ${djCC} A (dimensionamento: ${calc.iDjCCMin} A = Icc × 1,25)
  ${num(djCC) >= calc.iDjCCMin ? '✔ atende' : '⚠ verificar — disjuntor subdimencionado'}
• Capacidade máxima de interrupção: mínimo 5 kA
• Curva de atuação: C

Disjuntor de Proteção CA:
• Número de pólos: ${fd.tipoLigacao === 'Monofásico' ? '2 (bipolar)' : fd.tipoLigacao === 'Trifásico' ? '4 (quadripolar)' : '3 (tripolar)'}
• Tensão nominal CA: ${tensaoNominal} / 60 Hz
• Corrente nominal selecionada: ${djCA} A (In inversor: ${calc.iNomCA} A | cabo: ${calc.iDimCA} A = 1,25×In)
  ${num(djCA) >= calc.iDjCAMin ? '✔ atende' : '⚠ verificar — disjuntor subdimensionado'}
• Capacidade máxima de interrupção: mínimo 5 kA
• Curva de atuação: C

10.3 Dispositivo de Seccionamento Visível (DSV)

${temDSV === 'Sim'
  ? `DSV instalado: SIM
Características: ${descDSV}
Posicionamento: entre o inversor e o ponto de conexão com a rede, de fácil acesso
e operação, conforme NT.00020.EQTL-06.`
  : `DSV: ${temDSV === 'Não' ? 'Não aplicável para este projeto' : '[VERIFICAR COM O RT]'}
O responsável técnico deve verificar a necessidade de DSV conforme a topologia
do sistema e os requisitos da NT.00020.EQTL-06.`}

10.4 DPS — Proteção CC (String Box)

• Tipo: ${fd.dpsCCTipo || 'Tipo 2'}
• Classe: ${fd.dpsCCTipo?.includes('1') ? 'Classe I' : 'Classe II'}
• Tensão CC de operação contínua (Uc): ${fd.dpsCCTensao || '1000'} V CC
• Corrente nominal (8/20 μs): mínimo 20 kA
• Corrente máxima: conforme datasheet do fabricante
• Nível de proteção (Up): ≤ 5 kV
• Modos de proteção: L+/PE, L-/PE (modo comum) | L+/L- (diferencial)

DPS — Proteção CA (QDC CA):
• Tipo: ${fd.dpsCATipo || 'Tipo 2'}
• Classe: ${fd.dpsCATipo?.includes('1') ? 'Classe I' : 'Classe II'}
• Tensão CA de operação contínua (Uc): ${fd.dpsCATensao || '275'} V CA
• Corrente nominal (8/20 μs): mínimo 20 kA
• Nível de proteção (Up): ≤ 1,8 kV
• Certificação: IEC/EN 61643-1

10.5 Aterramento

• Geometria: haste(s) vertical(is) — distância entre hastes ≥ 2× comprimento
• Descrição das hastes: ${fd.aterramento || 'Haste 5/8" × 2,40 m, aço cobreado'}
• Quantidade de hastes: [INSERIR]
• Condutor da malha: ${fd.secaoCaboAterr || '16'} mm² — isolação verde/amarela
• Condutor de equipotencialização: cobre estanhado, seção mínima ${fd.secaoCaboAterr || '16'} mm²
• Conexões: conector de bronze ou solda exotérmica
• Valor da resistência de aterramento: ${fd.resistenciaAterramento
    ? `${fd.resistenciaAterramento} Ω — ${parseFloat(fd.resistenciaAterramento) <= 10 ? '✔ conforme NBR 5419 (≤ 10 Ω)' : '⚠ ACIMA DO LIMITE — verificar instalação'}`
    : '≤ 10 Ω (NBR 5419) — [INSERIR valor medido após instalação]'}
• Tensão de contato admissível: ≤ 25 V (Tabela C.2 — NBR 5410:2004)
• O SFV deve ser interligado ao aterramento principal da instalação elétrica existente.

10.6 Requisitos de Proteção

Tabela 5 — Proteções do inversor/sistema de geração

| REQUISITO DE PROTEÇÃO                                    | INDICAÇÃO   |
|----------------------------------------------------------|-------------|
| Proteção de subtensão (27)                               | Integrada   |
| Proteção de sobretensão (59)                             | Integrada   |
| Proteção de subfrequência (81U)                          | Integrada   |
| Proteção de sobrefrequência (81O)                        | Integrada   |
| Proteção contra desequilíbrio de corrente (46)           | Integrada   |
| Proteção contra reversão e desbalanço de tensão (47)     | Integrada   |
| Proteção de sobrecorrente (50/51 e 50N/51N)              | Integrada   |
| Proteção contra perda de rede (anti-ilhamento)           | Integrada   |
| Check de sincronismo (25)                                | Integrada   |
| Tempo de reconexão — temporizador (62)                   | Integrada   |
| Proteção de Sobrecorrente com restrição de tensão (51V)  | Integrada   |
| Proteção de Sobrecorrente direcional (67-67N)            | Integrada   |
| Proteção direcional de potência (32)                     | Integrada   |
| Proteção contra falha de disjuntor (50BF)                | Integrada   |
| Proteção LINHA VIVA / BARRA MORTA                        | Integrada   |
| Monitoração de isolamento CC                             | Integrada   |

PENDENTE: confirmar os valores reais de ajuste no datasheet do inversor selecionado.
Referência: PRODIST Módulo 3 — Acesso ao Sistema de Distribuição (vigente).

------------------------------------------------------------
11. DIMENSIONAMENTO DOS CABOS
------------------------------------------------------------
11.1 Condutores CC

• Bitola: ${fd.secaoCaboCC || '6'} mm² (positivo e negativo)
• Isolação: XLPE dupla isolação, 1,8 kV CC, 90°C
• Isolamento: cabo solar flexível (conforme IEC 62930 / EN 50618)
• Capacidade de condução de corrente: ${calc.iccNorma} A (dimensionamento)
• Identificação: vermelho (positivo), preto (negativo)
• Comprimento estimado: ${fd.comprimentoCabosCC || '[INSERIR]'} m
• Conectores: tipo MC4 (IP67, adequados para uso externo)
• Condutor de aterramento (CC): ${fd.secaoCaboAterr || '16'} mm², verde/amarelo

11.2 Condutores CA

• Bitola: ${fd.secaoCaboCA || '6'} mm²
• Isolação: XLPE/EPR
• Isolamento: 0,6/1 kV, 70°C (conforme ABNT NBR 7286 ou equivalente)
• Capacidade de condução de corrente: ${calc.iDimCA} A (dimensionamento = 1,25×In)
• Identificação: preto/marrom/cinza (fases), azul (neutro), verde/amarelo (PE)
• Comprimento estimado: ${fd.comprimentoCabosCA || '[INSERIR]'} m

11.3 Queda de Tensão CA

  ΔV(CA) = (2 × ${fd.comprimentoCabosCA || '?'} × ${calc.iNomCA} × 0,01724) / ${fd.secaoCaboCA || '6'} = ${calc.dvcaV} V
  ΔV(CA)% = ${calc.dvcaV} / 220 × 100 = ${calc.dvcaP}%
${calc.dvcaP <= 4 ? '✔ Queda de tensão CA dentro do limite de 4% (ABNT NBR 5410).' : '⚠ Verificar bitola do cabo CA — queda superior a 4% (NBR 5410).'}

11.4 Infraestrutura de Dutos

• Dutos CC: eletroduto PEAD corrugado dupla parede, cor vermelho, fixado a cada 1,0 m
• Dutos CA: eletroduto PVC rígido (ou ferro galvanizado em área externa), fixado a cada 1,0 m
• Circuitos CC e CA em dutos separados (NBR 16690 §5.4)
• Identificação permanente a cada 3,0 m

------------------------------------------------------------
12. PLACA DE ADVERTÊNCIA
------------------------------------------------------------
Conforme NT.00020.EQTL-06 e ABNT NBR 16690, devem ser instaladas placas de advertência
em todos os pontos de acesso ao sistema fotovoltaico, com as seguintes características:

Características da Placa:
• Espessura: 2 mm
• Material: Policarbonato com aditivos anti-raios UV (ultravioleta)
• Gravação: letras em Arial Black
• Acabamento: cor amarela, obtida por processo de masterização com 2%, assegurando
  opacidade que permita adequada visualização das marcações pintadas na superfície
• Dimensões: 25 cm (largura) × 18 cm (altura)

Modelo de placa (Figura 3 — Anexo III NT.00020.EQTL-06):
  ┌─────────────────────────────────┐
  │          CUIDADO                │
  │     RISCO DE CHOQUE             │
  │          ELÉTRICO               │
  │       GERAÇÃO PRÓPRIA           │
  └─────────────────────────────────┘

Posicionamento obrigatório:
  a) Junto ao medidor de energia / caixa de medição
  b) No Quadro de Distribuição CA-FV
  c) Na String Box (proteção CC)
  d) Nas calhas e eletrodutos do sistema FV

------------------------------------------------------------
13. COMISSIONAMENTO
------------------------------------------------------------
[[[IA_NARRATIVA_SEC12]]]

13.1 Inspeção Prévia — Sistema CC
□ Verificar conformidade dos equipamentos com o projeto aprovado
□ Verificar ligações entre módulos, String Box e inversor
□ Confirmar Voc e Isc de cada string individualmente
□ Verificar classes de isolamento e dupla isolação dos cabos CC
□ Verificar instalação dos conectores MC4 (travamento e estanqueidade IP67)
□ Verificar operacionalidade das chaves seccionadoras CC
□ Verificar continuidade do condutor de proteção (PE)
□ Verificar etiquetagem permanente em todos os componentes CC

13.2 Inspeção Prévia — Sistema CA
□ Verificar aparelho de comando para isolamento dos inversores
□ Verificar compatibilidade dos inversores com a rede pública
□ Verificar etiquetagem de todos os equipamentos CA
□ Verificar esquema elétrico afixado junto ao quadro de comando
□ Verificar instruções de desligamento de emergência afixadas

13.3 Testes e Ensaios

13.3.1 Continuidade do Condutor de Proteção
Critério: Continuidade confirmada (≤ 0,5 Ω).

13.3.2 Tensão de Circuito Aberto (Voc) das Strings
Valor esperado de projeto: ${calc.vocStr} V (em STC).
Critério: Variação ≤ ±5% entre strings e em relação ao projeto.

13.3.3 Corrente de Curto-Circuito (Isc) das Strings
Valor esperado de projeto: ${calc.iscStr} A por string.
Critério: Variação ≤ ±5% entre strings.

13.3.4 Ensaios Funcionais
□ Operacionalidade de todos os aparelhos de comando e sinalização
□ Display dos inversores sem alarmes ativos
□ Testar função anti-ilhamento (conforme manual do inversor)
□ Confirmar injeção de energia na rede

13.3.5 Resistência de Isolamento das Strings
IMPORTANTE: Executar com no mínimo duas pessoas. Bloquear acesso à área.
Procedimento: aplicar tensão de ensaio com megôhmetro entre condutores CC e terra.
Critério: Resistência de isolamento ≥ 1 MΩ.

13.3.6 Inspeção Termográfica (recomendada)
Equipamento: câmera térmica (mínimo 160×120 px).
Critério: ausência de hotspots (> 10°C acima da média).

------------------------------------------------------------
14. EXPLORAÇÃO E MANUTENÇÃO
------------------------------------------------------------
14.1 Periodicidade de Verificações
• Primeiros 5 anos: ensaios e inspeções ANUAIS
• A partir do 6° ano: ensaios e inspeções A CADA 2 ANOS
• Inspeção visual dos módulos: SEMESTRAL

14.2 Operações em Caso de Falha
I.   Falha em módulo: acionar chave seccionadora da string correspondente
II.  Falha no inversor: desligar disjuntor CA + todas as chaves seccionadoras CC
III. Falha geral: desligar DJ geral CA + todas as seccionadoras + informar distribuidora

14.3 Procedimento de Desligamento de Emergência
1. Desligar o disjuntor geral do QGBT (interrompe CA)
2. Desligar o disjuntor CA-FV no Quadro CA
3. Desligar todas as chaves seccionadoras na String Box
4. Aguardar descarga dos capacitores do inversor (mínimo 5 minutos)
5. Afixar etiqueta de bloqueio: "SISTEMA EM MANUTENÇÃO — NÃO ENERGIZAR"

14.4 Manutenção dos Módulos FV
• Limpeza com água e esponja macia (evitar abrasivos e solventes)
• Não pisar sobre os módulos
• Verificar integridade do vidro frontal e borrachas de vedação
• Verificar fixação dos grampos e trilhos (torque conforme fabricante)

14.5 Manutenção do Inversor
• Seguir rigorosamente o manual do fabricante
• Limpar filtros de ventilação conforme periodicidade indicada
• Verificar DPS (indicador luminoso): substituir se ativado
• Aguardar descarga dos capacitores (≥ 5 min) antes de qualquer intervenção interna

------------------------------------------------------------
15. NOTAS DE SEGURANÇA — NR-10
------------------------------------------------------------
• Todos os serviços elétricos devem ser executados por profissionais habilitados
  e autorizados conforme NR-10 (Portaria MTE 598/2004).
• Os módulos FV geram tensão CC assim que expostos à luz — não há forma de
  interromper a geração CC sem bloquear fisicamente a luz solar.
• A tensão CC do barramento pode atingir ${calc.vocMaxCorr ?? calc.vocMax} V. Utilizar EPI adequado
  (luvas isolantes, capacetes e óculos de proteção) durante manutenção.
• Sinalizar e isolar a área de trabalho antes de qualquer intervenção.
• Em caso de incêndio: NUNCA usar água no sistema — utilizar extintor CO₂ ou pó
  químico. Notificar o Corpo de Bombeiros informando a presença do sistema FV.
• Manter Livro de Inspeção e registros de ensaios disponíveis na instalação.

------------------------------------------------------------
16. NORMAS E ESPECIFICAÇÕES TÉCNICAS ADOTADAS
------------------------------------------------------------
• Lei Federal n° 14.300/2022 — Marco Legal da Geração Distribuída
• ANEEL REN n° 1.000/2021 — Condições gerais de fornecimento e distribuição
• ANEEL REH n° 3.171/2023 — Formulário de Orçamento de Conexão de GD
• NT.00020.EQTL-06 — Conexão de Micro/Minigeração (CEEE Equatorial, revisão 12/2025)
• NT.00001.EQTL — Fornecimento de Energia Elétrica em Baixa Tensão (CEEE Equatorial)
• NT.00030.EQTL — Padrões Construtivos de Caixas de Medição (CEEE Equatorial)
• ABNT NBR 16690:2019 — Requisitos para documentação e comissionamento
• ABNT NBR 5410:2004 — Instalações elétricas de baixa tensão
• ABNT NBR 5419:2015 — Proteção contra descargas atmosféricas
• ABNT NBR 10899:2013 — Energia solar fotovoltaica — Terminologia
• ABNT NBR 11704:2008 — Sistemas fotovoltaicos — Classificação
• ABNT NBR 16149:2013 — Interface de conexão com a rede elétrica
• ABNT NBR 16150:2013 — Interface de conexão — Procedimento de ensaio
• ABNT NBR IEC 62116 — Procedimento de ensaio de anti-ilhamento
• IEC 61727 — PV Systems — Characteristics of the Utility Interface
• IEC 62116:2014 — Anti-islanding test procedure for PV inverters
• PRODIST Módulo 3 — Acesso ao Sistema de Distribuição

------------------------------------------------------------
RESPONSÁVEL TÉCNICO
------------------------------------------------------------
Nome:       ${fd.nomeResponsavel || '_______________________________'}
Profissão:  ${profRT}
CRT/CREA:   ${fd.numeroCRT || '_______________________________'}
${fd.tipoResponsabilidade || 'TRT'}:        ${fd.numART || '_______________________________'}
Empresa:    ${fd.nomeEmpresa || 'Instalight Energia Solar'}
Data:       ${dataCompleta}

OBSERVAÇÕES DO RESPONSÁVEL TÉCNICO:
_______________________________________________
_______________________________________________

Assinatura: _______________________________

${fd.cidade || 'Porto Alegre'}, ${dataCompleta}.`;
}

/** Textos padrão para o modo básico (sem IA). */
export function aplicarTextosBasicos(template: string, fd: FormData, calc: Calculos): string {
  const co2FatorFmt = CO2_FACTOR.toString().replace('.', ',');
  return template
    .replace(
      /\[\[\[IA_NARRATIVA_SEC1\]\]\]/g,
      `O presente memorial técnico descritivo tem como objetivo apresentar a metodologia utilizada para elaboração e apresentação à CEEE Equatorial dos documentos mínimos necessários, em conformidade com a REN 1.000/2021, com o PRODIST Módulo 3, com a REH 3.171/2023, com a NT.00020.EQTL-06 e com as normas técnicas nacionais (ABNT) e internacionais (IEC), para SOLICITAÇÃO DO ORÇAMENTO DE CONEXÃO de uma ${calc.enq.toLowerCase()} fotovoltaica de ${calc.kWp} kWp, composta por ${fd.numeroPaineis || '[INSERIR]'} módulos e ${fd.quantidadeInversores || '1'} inversor(es), caracterizada como ${fd.tipoCaracterizacao || 'Autoconsumo Local'}, a ser instalada na Unidade Consumidora de titularidade de ${fd.nomeCliente || '[INSERIR NOME]'}.

O projeto foi elaborado pela empresa ${fd.nomeEmpresa || 'Instalight Energia Solar'} e o Responsável Técnico é ${fd.nomeResponsavel || '[INSERIR RT]'}, ${fd.profissaoRT || '[PROFISSÃO]'}, inscrito(a) no CRT/CREA sob n° ${fd.numeroCRT || '[INSERIR]'}, que assume integral responsabilidade técnica pelo projeto e execução, conforme documentação de responsabilidade técnica junto ao conselho profissional competente.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC7\]\]\]/g,
      `Os módulos fotovoltaicos serão instalados sobre estrutura de suporte em alumínio anodizado com tratamento anti-corrosão, fixada sobre cobertura do tipo ${fd.tipoTelhado}. As cargas de vento foram consideradas conforme ABNT NBR 6123. A verificação estrutural detalhada é de responsabilidade do fabricante da estrutura, mediante laudo técnico específico.

Serão utilizados perfis de alumínio anodizado de alta resistência com conectores e grampos em aço inoxidável AISI 304, garantindo durabilidade mínima de 25 anos.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC10\]\]\]/g,
      `A implantação do sistema fotovoltaico de ${calc.kWp} kWp contribuirá para a redução das emissões de gases de efeito estufa, estimando-se uma redução de ${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg de CO₂ por ano, equivalente ao plantio de ${calc.arvoresEquivalente.toLocaleString('pt-BR')} árvores anuais e a ${calc.co2Em25Anos.toLocaleString('pt-BR')} kg de CO₂ ao longo de 25 anos. Fator de emissão utilizado: ${co2FatorFmt} kgCO₂/kWh (ANEEL — Sistema Interligado Nacional).

O sistema On Grid permite ainda a injeção do excedente de energia na rede, gerando créditos conforme o sistema de compensação previsto na Lei Federal n° 14.300/2022.`,
    )
    .replace(
      /\[\[\[IA_NARRATIVA_SEC12\]\]\]/g,
      `O comissionamento do sistema fotovoltaico deve ser realizado por profissional habilitado e autorizado em instalações elétricas conforme NR-10, com o objetivo de verificar a conformidade da instalação com o projeto aprovado, identificar eventuais anomalias e garantir a segurança e o desempenho do sistema antes da energização definitiva.

Todos os resultados dos testes e ensaios deverão ser registrados em relatório técnico, assinado pelo responsável técnico, e arquivados na instalação para consulta durante a vida útil do sistema.`,
    );
}
