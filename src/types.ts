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
  tipoInstalacao: 'Nova' | 'Ampliação'; // Para o formulário CEEE
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

  // MÓDULO FV — dados elétricos do datasheet (opcionais; usados pelo motor de cálculo)
  vocUnitario:      string; // Voc por módulo (V)
  iscUnitario:      string; // Isc por módulo (A)
  vmppUnitario:     string; // Vmpp por módulo (V)
  imppUnitario:     string; // Impp por módulo (A)
  eficienciaPainel: string; // Eficiência (%)
  coefTempVoc:      string; // Coef. temperatura Voc (%/°C)

  // INVERSOR
  modeloInversor: string;
  potenciaCAkW: string;
  tensaoEntradaCC: string;
  tensaoSaidaCA: string;
  quantidadeInversores: string;

  // INVERSOR — dados extras do datasheet (opcionais)
  numMPPT:         string; // Número de entradas MPPT
  faixaMPPTMin:    string; // Tensão mínima MPPT (V)
  faixaMPPTMax:    string; // Tensão máxima MPPT (V)
  tensaoPartidaCC: string; // Tensão de partida CC (V)
  eficienciaInv:   string; // Eficiência máxima (%)

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
  modeloStringBox: string;        // Modelo da string box CC (opcional)
  resistenciaAterramento: string; // Resistência medida após instalação (Ω) — laudo do RT

  // INSTALAÇÃO
  tipoTelhado: TipoTelhado;
  coordenadas: string;
  tempMinima: string; // Temperatura mínima local (°C) — para Voc_max real NBR 16690 §6.3

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

  /** Vmpp da string completa (V) — 0 se vmppUnitario não informado */
  vmppString: number;
  /** Impp total de todas as strings (A) — 0 se imppUnitario não informado */
  imppTotal: number;
  /** ΔV CC operacional em V (usa Impp) — null se Impp não informado */
  dvccOpV: number | null;
  /** ΔV CC operacional em % referenciado a Vmpp — null se Vmpp/Impp não informados */
  dvccOpP: number | null;
  /**
   * Voc_max calculado com coeficiente real de temperatura (NBR 16690 §6.3, método preciso).
   * null quando coefTempVoc ou tempMinima não estão preenchidos — usa vocMax (fator 1,25) nesse caso.
   */
  vocMaxCorr: number | null;
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
