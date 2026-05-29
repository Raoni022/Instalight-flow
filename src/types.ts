// ── Tipagem central do GD Docs — Instalight Flow ──────────────────────────

export type TipoLigacao = 'Monofásico' | 'Bifásico' | 'Trifásico';
export type TipoTelhado = 'Cerâmico' | 'Metálico' | 'Fibrocimento' | 'Laje' | 'Solo';
export type TipoPessoa  = 'fisica' | 'juridica';
export type NivelIssue  = 'erro' | 'aviso' | 'info';
export type ToastType   = 'success' | 'error' | 'warning' | 'info';

// ── Formulário principal ──────────────────────────────────────────────────

export interface FormData {
  // CLIENTE
  tipoPessoa: TipoPessoa;
  nomeCliente: string;
  cpfCnpj: string;
  endereco: string;
  codigoUC: string;
  numeroFatura: string;
  consumoMensalKwh: string;
  numContaContrato: string;

  // SISTEMA FV
  tipoLigacao: TipoLigacao;
  numeroPaineis: string;
  modeloPainel: string;
  potenciaUnitariaWp: string;
  paineisSerie: string;
  stringParalelo: string;

  // INVERSOR
  modeloInversor: string;
  potenciaCAkW: string;
  tensaoEntradaCC: string;
  tensaoSaidaCA: string;
  quantidadeInversores: string;

  // CABOS E DIMENSIONAMENTO
  secaoCaboCC: string;
  secaoCaboCA: string;
  secaoCaboAterr: string;
  comprimentoCabosCC: string;
  comprimentoCabosCA: string;

  // PROTEÇÕES
  dpsCCTipo: string;
  dpsCCTensao: string;
  dpsCATipo: string;
  dpsCATensao: string;
  disjuntorCC: string;
  disjuntorCA: string;
  aterramento: string;

  // INSTALAÇÃO
  tipoTelhado: TipoTelhado;
  coordenadas: string;

  // RESPONSÁVEL TÉCNICO
  nomeResponsavel: string;
  numeroCRT: string;
  numART: string;
  numProjeto: string;
  cidade: string;
  dataproject: string;

  // EMPRESA INSTALADORA
  nomeEmpresa: string;
  cnpjEmpresa: string;
  enderecoEmpresa: string;
}

// ── Resultados de cálculo (motor JS — IA nunca calcula) ──────────────────

export interface Calculos {
  /** Potência de pico CC instalada (kWp) */
  kWp: number;
  /** Potência CA total dos inversores (kW) */
  kWtCA: number;

  /** Tensão Voc por string (V) */
  vocStr: number;
  /** Voc_max com fator de segurança 1,25 para temperatura mínima (V) */
  vocMax: number;
  /** Corrente de curto-circuito por string (A) */
  iscStr: number;
  /** Corrente de curto-circuito total CC (A) */
  iccTotal: number;
  /** Corrente de dimensionamento CC (1,25 × Icc) — NBR 16690 (A) */
  iccNorma: number;

  /** Corrente nominal CA saída do inversor (A) */
  iNomCA: number;
  /** Corrente de dimensionamento CA (1,25 × In) — NBR 5410 (A) */
  iDimCA: number;

  /** Queda de tensão absoluta CC (V) */
  dvccV: number;
  /** Queda de tensão relativa CC (%) */
  dvccP: number;
  /** Queda de tensão absoluta CA (V) */
  dvcaV: number;
  /** Queda de tensão relativa CA (%) */
  dvcaP: number;

  /** Corrente mínima para disjuntor CC (A) */
  iDjCCMin: number;
  /** Corrente mínima para disjuntor CA (A) */
  iDjCAMin: number;

  /** Geração anual estimada (kWh) */
  geracaoAnual: number;
  /** Economia anual estimada (R$) */
  economiaAnual: number;

  /** Enquadramento regulatório */
  enq: string;
  /** Prazo de análise CEEE */
  prazo: string;

  /** Potência disponibilizada no padrão de entrada (kVA) */
  potDispKVA: number;
  /** Potência disponibilizada no padrão de entrada com FP=0,92 (kW) */
  potDispKW: number;

  /** CO₂ evitado por ano (kg) */
  co2EvitadoAnual: number;
  /** Equivalente em árvores por ano */
  arvoresEquivalente: number;
  /** CO₂ evitado em 25 anos (kg) */
  co2Em25Anos: number;
  /** Percentual do consumo anual atendido pela geração (null se consumo não informado) */
  percentualAtendimento: number | null;
}

// ── Validação ─────────────────────────────────────────────────────────────

export interface ValidationIssue {
  nivel: NivelIssue;
  /** Código único do problema — ex: UC01, SFV05, CAB01 */
  cod: string;
  msg: string;
}

// ── Estado dos documentos gerados ────────────────────────────────────────

export interface DocsGerados {
  diagramas: boolean;
  memorial: boolean;
  procuracao: boolean;
  formularioCEEE: boolean;
}

// ── Toast ─────────────────────────────────────────────────────────────────

export interface Toast {
  message: string;
  type: ToastType;
}
