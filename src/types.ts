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
  tipoInstalacao: 'Nova' | 'Ampliação';
  nomeCliente: string;
  cpfCnpj: string;

  // PF específico
  rgCliente:        string;   // RG do titular (PF)
  orgaoExpeditorRG: string;   // Órgão expedidor, ex: SSP/RS
  telefoneCelular:  string;   // Celular do titular

  // Endereço dividido (compõe fd.endereco automaticamente)
  logradouro:  string;
  numEndereco: string;
  complemento: string;
  bairro:      string;
  cep:         string;

  // Endereço legado (auto-composto ou preenchido manualmente)
  endereco: string;

  codigoUC: string;

  // Mantidos mas ocultos no sidebar (usados no memorial/formulário)
  numeroFatura:    string;
  consumoMensalKwh: string;
  numContaContrato: string;

  // PADRÃO DE ENTRADA / MEDIÇÃO
  tipoLigacao: TipoLigacao;  // Movido de SISTEMA FV — pertence ao padrão de entrada
  tipoPadrao:          string;  // Tipo de caixa: Tipo E, Tipo H, Painel agrupado
  tipoFixacao:         string;  // Muro | Poste de concreto | Fachada | Poste de madeira
  materialCaboEntrada: string;  // Cobre | Alumínio
  numPoste:            string;  // Número do poste da concessionária CEEE
  disjuntorEntrada:    string;  // Disjuntor geral do padrão de entrada (A)
  ramalEntrada:        string;  // Seção do cabo do ramal de entrada (ex: #25mm²)
  numeroMedidor:       string;  // Número de série do medidor
  classeUC:            string;  // Residencial | Comercial | Industrial | Rural | Poder Público
  latitude:            string;  // Coordenada GPS — latitude
  longitude:           string;  // Coordenada GPS — longitude
  transformador:       string;  // ID/número do transformador da distribuidora

  // SISTEMA FV
  numeroPaineis: string;
  modeloPainel: string;
  potenciaUnitariaWp: string;
  paineisSerie: string;
  stringParalelo: string;

  // MÓDULO FV — dados elétricos do datasheet (opcionais; usados pelo motor de cálculo)
  vocUnitario:        string; // Voc por módulo (V)
  iscUnitario:        string; // Isc por módulo (A)
  vmppUnitario:       string; // Vmpp por módulo (V)
  imppUnitario:       string; // Impp por módulo (A)
  eficienciaPainel:   string; // Eficiência (%)
  coefTempVoc:        string; // Coef. temperatura Voc (%/°C)
  noct:               string; // Temperatura de Operação Nominal (°C)
  certificacaoPainel: string; // Ex: INMETRO, IEC 61215

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
  tipoResponsabilidade: 'ART' | 'TRT';  // ART para engenheiros, TRT para técnicos
  nomeResponsavel: string;
  numeroCRT: string;
  numART: string;     // número da ART ou TRT (campo unificado)
  numProjeto: string; // mantido para o carimbo da prancha (campo PE) — oculto no sidebar
  cidade: string;
  dataproject: string;

  // EMPRESA INSTALADORA
  nomeEmpresa: string;
  cnpjEmpresa: string;
  enderecoEmpresa: string;

  // REPRESENTANTE LEGAL (somente para Pessoa Jurídica — titular da UC)
  nomeRepresentante:  string;
  cpfRepresentante:   string;
  rgRepresentante:    string;  // RG / identidade
  cargoRepresentante: string;
  inscricaoEstadual:  string;  // IE da empresa (Isento para prestadores de serviço)
  emailContato:       string;  // E-mail corporativo de acompanhamento
  telefoneContato:    string;  // Telefone de contato

  // SISTEMA EXISTENTE (somente para tipoInstalacao === 'Ampliação')
  numeroPaineisExistentes:    string;
  modeloPainelExistente:      string;
  potenciaWpExistente:        string;
  noctExistente:              string;  // NOCT dos painéis existentes
  certificacaoExistente:      string;  // Certificação dos painéis existentes
  modeloInversorExistente:    string;
  potenciaCAExistentekW:      string;
  quantidadeInversoresExistente: string;

  // GERAÇÃO / DESEMPENHO — valores locais (opcional, sobrepõe constantes padrão)
  irradLocal: string;  // HSP local (kWh/m²/dia); vazio = usa IRRAD padrão (Porto Alegre 4,8)
  prCustom:   string;  // Performance Ratio personalizado; vazio = usa PR padrão (0,75)

  // AMPLIAÇÃO — metadados do projeto homologado anterior
  parecerAcessoAnterior:  string;  // Protocolo/Nº parecer de acesso anterior
  dataAprovacaoAnterior:  string;  // Data da aprovação anterior
  artTrtAnterior:         string;  // Nº ART ou TRT da instalação anterior
  observacoesExistente:   string;  // Observações livres sobre o sistema existente
  situacaoPadrao:         'Mantido' | 'Alterado / aumento de carga' | 'A definir pelo RT';
  tipoAmpliacao:          'Mesmo inversor existente' | 'Novo inversor adicional' | 'Substituição de inversor' | 'A definir pelo RT';

  // CEEE — Tipo de Caracterização (Lei 14.300/2022 Art. 2°)
  tipoCaracterizacao: 'Autoconsumo Local' | 'Autoconsumo Remoto' | 'Geração Compartilhada' | 'EMUC';

  // RESPONSÁVEL TÉCNICO — profissão para capa do memorial CEEE
  profissaoRT: string;

  // MÓDULO FV — dimensões físicas (Tabela 3 Anexo III CEEE)
  comprimentoPainel: string;
  larguraPainel:     string;
  pesoPainel:        string;

  // CAIXA DE MEDIÇÃO (Seção 5.4 Anexo III CEEE)
  tipoCaixaMedicao:    'Existente' | 'Nova';
  localInstalacaoCaixa: 'Poste auxiliar' | 'Muro' | 'Fachada';

  // DSV — Dispositivo de Seccionamento Visível (Seção 9.3 Anexo III CEEE)
  temDSV:           'Sim' | 'Não';
  caracteristicasDSV: string;

  // INVERSOR — campos adicionais Tabela 4 Anexo III CEEE
  potMaxCCInv: string;  // Máxima potência entrada CC (kW)
  iMaxCCInv:   string;  // Máxima corrente CC (A)
  potMaxCAInv: string;  // Máxima potência saída CA (kW)
  iMaxCAInv:   string;  // Máxima corrente saída CA (A)
  vCAmaxInv:   string;  // Máxima tensão CA (V)
  vCAminInv:   string;  // Mínima tensão CA (V)
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

  // ── Ampliação ─────────────────────────────────────────────────────────────
  /** Potência CC do sistema existente (0 quando Nova instalação) */
  kWpExistente: number;
  /** Potência CA do sistema existente (0 quando Nova instalação) */
  kWtCAExistente: number;
  /** Potência CC total = nova + existente */
  kWpTotal: number;
  /** Potência CA total = nova + existente */
  kWtCATotal: number;
  /** Enquadramento regulatório pelo kWpTotal (sistema consolidado após ampliação) */
  enqTotal: string;
  /** Enquadramento regulatório somente do sistema novo (sem o existente) */
  enqNovo: string;

  /** HSP efetivo utilizado no cálculo (irradLocal se informado, senão IRRAD padrão) */
  irradEfetivo: number;
  /** PR efetivo utilizado no cálculo (prCustom se informado, senão PR padrão) */
  prEfetivo: number;

  /**
   * Geração anual do sistema TOTAL (kWh/ano).
   * Para nova instalação: igual a geracaoAnual.
   * Para ampliação: inclui o sistema existente + o novo.
   */
  geracaoAnualTotal: number;
  /** Economia anual estimada baseada no sistema total (R$/ano). */
  economiaAnualTotal: number;
  /**
   * Percentual de aumento da potência CC em relação ao sistema existente.
   * null quando não é ampliação ou kWpExistente = 0.
   */
  percentualAumentokWp: number | null;
  /**
   * Percentual de aumento da potência CA em relação ao sistema existente.
   * null quando não é ampliação ou kWtCAExistente = 0.
   */
  percentualAumentokWtCA: number | null;

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

// ── Gestão de projetos salvos ─────────────────────────────────────────────

export interface DocAnexo {
  nome: string;
  tipo: string;
  tamanho: number;
}

export type StatusProjeto = 'rascunho' | 'em_andamento' | 'concluido';

export interface ProjetoSalvo {
  id: string;
  nomeProjeto: string;   // nome customizado pelo usuário (editável no editor)
  label: string;         // auto-gerado: "Cliente — UC XXXX"
  status: StatusProjeto;
  formData: FormData;
  docsGerados: DocsGerados;
  documentos: DocAnexo[];
  criadoEm: string;
  atualizadoEm: string;
}
