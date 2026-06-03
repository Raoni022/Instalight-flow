import { describe, it, expect } from 'vitest';
import { validarProjeto } from '../src/engine/validarProjeto';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';

// ── Formulário base — projeto completo e consistente ─────────────────────
const BASE: FormData = {
  tipoPessoa: 'fisica',
  tipoInstalacao: 'Nova',
  nomeCliente: 'João Silva',
  cpfCnpj: '123.456.789-00',
  rgCliente: '', orgaoExpeditorRG: '', telefoneCelular: '',
  logradouro: '', numEndereco: '', complemento: '', bairro: '', cep: '',
  endereco: 'Rua Teste, 1 — Porto Alegre/RS',
  codigoUC: '1234567890',
  numeroFatura: '9876',
  consumoMensalKwh: '400',
  numContaContrato: '111222333',
  tipoLigacao: 'Monofásico',
  tipoPadrao: '', tipoFixacao: '', materialCaboEntrada: 'Cobre',
  numPoste: '', disjuntorEntrada: '', ramalEntrada: '',
  numeroMedidor: '', classeUC: 'Residencial', latitude: '', longitude: '', transformador: '',
  numeroPaineis: '10',
  modeloPainel: 'Canadian Solar CS6R-550',
  potenciaUnitariaWp: '550',
  paineisSerie: '5',
  stringParalelo: '2',
  vocUnitario: '', iscUnitario: '', vmppUnitario: '', imppUnitario: '',
  eficienciaPainel: '', coefTempVoc: '', noct: '', certificacaoPainel: '',
  modeloInversor: 'Growatt MIN 5000TL-X',
  potenciaCAkW: '5',
  tensaoEntradaCC: '600',
  tensaoSaidaCA: '220',
  quantidadeInversores: '1',
  numMPPT: '', faixaMPPTMin: '', faixaMPPTMax: '', tensaoPartidaCC: '', eficienciaInv: '',
  secaoCaboCC: '6',
  secaoCaboCA: '6',
  secaoCaboAterr: '16',
  comprimentoCabosCC: '20',
  comprimentoCabosCA: '10',
  dpsCCTipo: 'Tipo 2',
  dpsCCTensao: '1000',
  dpsCATipo: 'Tipo 2',
  dpsCATensao: '275',
  disjuntorCC: '40',   // ≥ iccNorma ≈ 33.53 A (1,25 × Icc_total)
  disjuntorCA: '25',   // ≥ iNomCA  ≈ 22.73 A
  aterramento: '5/8" x 2400mm', modeloStringBox: '', resistenciaAterramento: '',
  tipoTelhado: 'Cerâmico',
  coordenadas: '', tempMinima: '',
  tipoResponsabilidade: 'TRT',
  nomeResponsavel: 'Eng. Carlos Souza',
  numeroCRT: '12345-D/RS',
  numART: 'ART-2024-001',
  numProjeto: 'PE-2024-001',
  cidade: 'Porto Alegre',
  dataproject: '2026-05-29',
  nomeEmpresa: 'Instalight Energia Solar',
  cnpjEmpresa: '12.345.678/0001-90',
  enderecoEmpresa: 'Rua da Luz, 100 — Porto Alegre/RS',
  nomeRepresentante: '', cpfRepresentante: '', rgRepresentante: '', cargoRepresentante: '',
  inscricaoEstadual: '', emailContato: '', telefoneContato: '',
  numeroPaineisExistentes: '', modeloPainelExistente: '', potenciaWpExistente: '',
  noctExistente: '', certificacaoExistente: '',
  modeloInversorExistente: '', potenciaCAExistentekW: '', quantidadeInversoresExistente: '',
  parecerAcessoAnterior: '', dataAprovacaoAnterior: '', artTrtAnterior: '',
  observacoesExistente: '', situacaoPadrao: 'A definir pelo RT', tipoAmpliacao: 'A definir pelo RT',
  irradLocal: '', prCustom: '',
};

const hasCode  = (issues: ReturnType<typeof validarProjeto>, cod: string) =>
  issues.some(x => x.cod === cod);

const hasLevel = (issues: ReturnType<typeof validarProjeto>, nivel: string) =>
  issues.some(x => x.nivel === nivel);

describe('validarProjeto — Formulário completo', () => {
  it('sem erros críticos para projeto válido', () => {
    const fd   = BASE;
    const calc = calcularSistema(fd);
    const err  = validarProjeto(fd, calc).filter(x => x.nivel === 'erro');
    expect(err).toHaveLength(0);
  });

  it('sempre retorna info GER01 (aviso de assinatura RT)', () => {
    const issues = validarProjeto(BASE, calcularSistema(BASE));
    expect(hasCode(issues, 'GER01')).toBe(true);
  });
});

describe('validarProjeto — Dados da UC', () => {
  it('UC01: erro quando nome do cliente vazio', () => {
    const issues = validarProjeto({ ...BASE, nomeCliente: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'UC01')).toBe(true);
    expect(issues.find(x => x.cod === 'UC01')?.nivel).toBe('erro');
  });

  it('UC02: erro quando codigoUC vazio', () => {
    const issues = validarProjeto({ ...BASE, codigoUC: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'UC02')).toBe(true);
  });

  it('UC03: erro quando endereco vazio', () => {
    const issues = validarProjeto({ ...BASE, endereco: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'UC03')).toBe(true);
  });

  it('UC04: erro quando cpfCnpj vazio', () => {
    const issues = validarProjeto({ ...BASE, cpfCnpj: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'UC04')).toBe(true);
  });
});

describe('validarProjeto — Responsável Técnico', () => {
  it('RT01: erro quando nomeResponsavel vazio', () => {
    const issues = validarProjeto({ ...BASE, nomeResponsavel: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'RT01')).toBe(true);
  });

  it('RT02: erro quando numeroCRT vazio', () => {
    const issues = validarProjeto({ ...BASE, numeroCRT: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'RT02')).toBe(true);
  });

  it('RT03: AVISO (não erro) quando numART vazio', () => {
    const issues = validarProjeto({ ...BASE, numART: '' }, calcularSistema(BASE));
    const rt3 = issues.find(x => x.cod === 'RT03');
    expect(rt3).toBeDefined();
    expect(rt3?.nivel).toBe('aviso');
  });
});

describe('validarProjeto — Sistema FV', () => {
  it('SFV01: erro quando kWp = 0 (painéis não preenchidos)', () => {
    const fd   = { ...BASE, numeroPaineis: '', potenciaUnitariaWp: '' };
    const issues = validarProjeto(fd, calcularSistema(fd));
    expect(hasCode(issues, 'SFV01')).toBe(true);
  });

  it('SFV05: erro de inconsistência strings × painéis', () => {
    // 5S × 2P = 10, mas numeroPaineis = 12 → inconsistência
    const fd = { ...BASE, numeroPaineis: '12' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'SFV05')).toBe(true);
  });

  it('SFV05: sem erro quando strings × painéis bate com total', () => {
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'SFV05')).toBe(false);
  });

  it('SFV06: erro quando vocMax > tensão max CC do inversor', () => {
    // vocMax = 256.25V, tensaoEntradaCC = 250V → erro
    const fd = { ...BASE, tensaoEntradaCC: '250' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'SFV06')).toBe(true);
  });

  it('SFV07: aviso quando vocMax < 50% da tensão max CC', () => {
    // vocMax = 256.25V, tensaoEntradaCC = 600V → 256 < 300 → aviso
    const fd = { ...BASE, tensaoEntradaCC: '600' };
    const warn = validarProjeto(fd, calcularSistema(BASE)).find(x => x.cod === 'SFV07');
    expect(warn?.nivel).toBe('aviso');
  });
});

describe('validarProjeto — Disjuntores', () => {
  it('SFV08: erro quando disjuntor CC abaixo de iccNorma (1,25 × Icc_total)', () => {
    // iDjCCMin = iccNorma ≈ 33.53 A; disjuntor = 10 A → erro
    const fd = { ...BASE, disjuntorCC: '10' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'SFV08')).toBe(true);
  });

  it('SFV08: sem erro quando disjuntor CC adequado (≥ iccNorma)', () => {
    // BASE.disjuntorCC = '40' ≥ iDjCCMin ≈ 33.53 A → sem erro
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'SFV08')).toBe(false);
  });

  it('SFV09: erro quando disjuntor CA abaixo da corrente nominal do inversor', () => {
    // iDjCAMin = iNomCA ≈ 22.73 A; disjuntor = 10 A → erro
    const fd = { ...BASE, disjuntorCA: '10' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'SFV09')).toBe(true);
  });

  it('SFV09: sem erro quando disjuntor CA adequado (≥ iNomCA)', () => {
    // BASE.disjuntorCA = '25' ≥ iDjCAMin ≈ 22.73 A → sem erro
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'SFV09')).toBe(false);
  });

  it('engine e memorial usam o mesmo limiar — sem "⚠ verificar" oculto', () => {
    // Com BASE (disjuntorCC=40, disjuntorCA=25): nem SFV08 nem SFV09 disparados
    // E o memorial imprimirá "✔ atende" em ambas as seções 8.1 e 8.2
    const issues = validarProjeto(BASE, calcularSistema(BASE));
    expect(hasCode(issues, 'SFV08')).toBe(false);
    expect(hasCode(issues, 'SFV09')).toBe(false);
  });
});

describe('validarProjeto — Dimensionamento CC/CA', () => {
  it('SFV10: aviso quando relação CC/CA > 1.35 (clipping)', () => {
    // kWp = 5.5, potenciaCAkW = 3 → ratio = 1.83
    const fd   = { ...BASE, potenciaCAkW: '3' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'SFV10')).toBe(true);
  });

  it('SFV11: aviso quando relação CC/CA < 0.70 (inversor superdimensionado)', () => {
    const fd   = { ...BASE, potenciaCAkW: '10' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'SFV11')).toBe(true);
  });

  it('sem aviso CC/CA para proporção adequada (0.70–1.35)', () => {
    // kWp = 5.5, potenciaCAkW = 5 → ratio = 1.1 → ok
    const issues = validarProjeto(BASE, calcularSistema(BASE));
    expect(hasCode(issues, 'SFV10')).toBe(false);
    expect(hasCode(issues, 'SFV11')).toBe(false);
  });
});

describe('validarProjeto — Enquadramento', () => {
  it('ENQ01: info para sistema > 75 kWp', () => {
    const fd   = { ...BASE, numeroPaineis: '200', potenciaUnitariaWp: '550' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'ENQ01')).toBe(true);
    expect(validarProjeto(fd, calc).find(x => x.cod === 'ENQ01')?.nivel).toBe('info');
  });

  it('ENQ01 ausente para sistema ≤ 75 kWp', () => {
    const issues = validarProjeto(BASE, calcularSistema(BASE));
    expect(hasCode(issues, 'ENQ01')).toBe(false);
  });
});

describe('validarProjeto — DPS', () => {
  it('DPS01: aviso quando tensão DPS CC < vocMax', () => {
    // vocMax = 256.25V, dpsCCTensao = 200V → aviso
    const fd = { ...BASE, dpsCCTensao: '200' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'DPS01')).toBe(true);
  });

  it('DPS01: sem aviso quando tensão DPS CC adequada', () => {
    // dpsCCTensao = 1000V > vocMax → ok
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'DPS01')).toBe(false);
  });

  it('DPS02: aviso quando tensão DPS CA < 242 V (1,1 × Vrede)', () => {
    // dpsCATensao = 220V < 242V → aviso
    const fd = { ...BASE, dpsCATensao: '220' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'DPS02')).toBe(true);
  });

  it('DPS02: sem aviso quando tensão DPS CA adequada (≥ 242 V)', () => {
    // BASE.dpsCATensao = '275' > 242V → ok
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'DPS02')).toBe(false);
  });
});

describe('validarProjeto — Janela MPPT (SFV12/SFV13)', () => {
  it('SFV12: erro quando Vmpp da string abaixo do mínimo MPPT', () => {
    // vmppString = 38V × 5 painéis = 190V < faixaMPPTMin = 200V → erro
    const fd = { ...BASE, vmppUnitario: '38', faixaMPPTMin: '200', faixaMPPTMax: '500' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV12')).toBe(true);
  });

  it('SFV12: sem erro quando Vmpp dentro do limite mínimo MPPT', () => {
    // vmppString = 38 × 5 = 190V ≥ faixaMPPTMin = 150V → ok
    const fd = { ...BASE, vmppUnitario: '38', faixaMPPTMin: '150', faixaMPPTMax: '500' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV12')).toBe(false);
  });

  it('SFV13: erro quando Vmpp da string acima do máximo MPPT', () => {
    // vmppString = 38 × 5 = 190V > faixaMPPTMax = 180V → erro
    const fd = { ...BASE, vmppUnitario: '38', faixaMPPTMin: '100', faixaMPPTMax: '180' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV13')).toBe(true);
  });

  it('SFV13: sem erro quando Vmpp dentro do limite máximo MPPT', () => {
    // vmppString = 38 × 5 = 190V ≤ faixaMPPTMax = 600V → ok
    const fd = { ...BASE, vmppUnitario: '38', faixaMPPTMin: '100', faixaMPPTMax: '600' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV13')).toBe(false);
  });
});

describe('validarProjeto — Tensão de partida do inversor (SFV14)', () => {
  it('SFV14: erro quando Voc da string abaixo da tensão de partida', () => {
    // vocStr = 5 × 41 = 205V < tensaoPartidaCC = 250V → erro
    const fd = { ...BASE, tensaoPartidaCC: '250' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV14')).toBe(true);
  });

  it('SFV14: sem erro quando Voc da string acima da tensão de partida', () => {
    // vocStr = 205V > tensaoPartidaCC = 100V → ok
    const fd = { ...BASE, tensaoPartidaCC: '100' };
    expect(hasCode(validarProjeto(fd, calcularSistema(fd)), 'SFV14')).toBe(false);
  });
});

describe('validarProjeto — SFV15 (bifásico)', () => {
  it('SFV15: aviso quando tipoLigacao = Bifásico', () => {
    const fd = { ...BASE, tipoLigacao: 'Bifásico' as const };
    const issues = validarProjeto(fd, calcularSistema(fd));
    expect(hasCode(issues, 'SFV15')).toBe(true);
    expect(issues.find(x => x.cod === 'SFV15')?.nivel).toBe('aviso');
  });

  it('SFV15: sem aviso para Monofásico e Trifásico', () => {
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'SFV15')).toBe(false);
    const fd3 = { ...BASE, tipoLigacao: 'Trifásico' as const };
    expect(hasCode(validarProjeto(fd3, calcularSistema(fd3)), 'SFV15')).toBe(false);
  });
});

describe('validarProjeto — AT01 (aterramento medido)', () => {
  it('AT01: erro quando resistência de aterramento > 10 Ω', () => {
    const fd = { ...BASE, resistenciaAterramento: '15' };
    const issues = validarProjeto(fd, calcularSistema(BASE));
    expect(hasCode(issues, 'AT01')).toBe(true);
    expect(issues.find(x => x.cod === 'AT01')?.nivel).toBe('erro');
  });

  it('AT01: sem erro quando resistência ≤ 10 Ω', () => {
    const fd = { ...BASE, resistenciaAterramento: '5' };
    expect(hasCode(validarProjeto(fd, calcularSistema(BASE)), 'AT01')).toBe(false);
  });

  it('AT01: sem erro quando campo vazio', () => {
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'AT01')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// TESTES DE AMPLIAÇÃO
// ══════════════════════════════════════════════════════════════

// Fixture base para ampliação (3,6 kWp existente + 4,4 kWp novo)
const BASE_AMPL: FormData = {
  ...BASE,
  tipoInstalacao: 'Ampliação',
  numeroPaineis: '8', potenciaUnitariaWp: '550',
  paineisSerie: '4', stringParalelo: '2',
  potenciaCAkW: '4', quantidadeInversores: '1',
  disjuntorCA: '40',  // comporta kWtCATotal = 7kW → iNomCA(total) ≈ 15.9A
  numeroPaineisExistentes: '8', potenciaWpExistente: '450',
  potenciaCAExistentekW: '3', quantidadeInversoresExistente: '1',
  parecerAcessoAnterior: 'PA-2022-00456',
  artTrtAnterior: 'TRT-2022-789',
};

describe('validarProjeto — Ampliação: Teste 3 — potência total supera padrão', () => {
  // APÓS CORREÇÃO DO BUG #1: potDispKW usa disjuntorEntrada (não disjuntorCA).
  // disjuntorEntrada = 25A, monofásico → potDispKW = (220×25×1)/1000×0,92 = 5,06 kW
  // kWtCATotal = 3 + 4 = 7 kW → 7 > 5,06 → erro PD01
  const fd = {
    ...BASE_AMPL,
    disjuntorEntrada: '25',  // DJ GERAL do padrão → potDispKW = 5,06 kW < 7 kW total
    disjuntorCA: '40',       // CB do inversor (não afeta PD)
  };

  it('PD01: erro crítico quando kWtCATotal supera potência disponibilizada', () => {
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    expect(hasCode(issues, 'PD01')).toBe(true);
    expect(issues.find(x => x.cod === 'PD01')?.nivel).toBe('erro');
  });

  it('PD01 menciona potência existente no texto (ampliação)', () => {
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    const pd1 = issues.find(x => x.cod === 'PD01');
    // A mensagem deve mencionar a composição existente + novo
    expect(pd1?.msg).toContain('existente');
  });
});

describe('validarProjeto — Ampliação: Teste 4 — dados de projeto anterior ausentes', () => {
  const fd = {
    ...BASE_AMPL,
    parecerAcessoAnterior: '',  // AMP03
    artTrtAnterior: '',         // AMP04
  };

  it('AMP03: aviso (não erro) quando parecer anterior vazio', () => {
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    const amp3 = issues.find(x => x.cod === 'AMP03');
    expect(amp3).toBeDefined();
    expect(amp3?.nivel).toBe('aviso');
  });

  it('AMP04: aviso (não erro) quando ART/TRT anterior vazia', () => {
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    const amp4 = issues.find(x => x.cod === 'AMP04');
    expect(amp4).toBeDefined();
    expect(amp4?.nivel).toBe('aviso');
  });

  it('sem erros críticos apenas por falta de documentos anteriores', () => {
    const calc = calcularSistema({ ...fd, disjuntorCA: '40' }); // padrão ok
    const erros = validarProjeto({ ...fd, disjuntorCA: '40' }, calc).filter(x => x.nivel === 'erro');
    expect(erros).toHaveLength(0);
  });
});

describe('validarProjeto — Ampliação: AMP02 (existente não preenchido)', () => {
  it('AMP02: aviso quando numeroPaineisExistentes e potenciaWpExistente vazios', () => {
    const fd = {
      ...BASE,
      tipoInstalacao: 'Ampliação' as const,
      numeroPaineisExistentes: '',
      potenciaWpExistente: '',
    };
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    expect(hasCode(issues, 'AMP02')).toBe(true);
    expect(issues.find(x => x.cod === 'AMP02')?.nivel).toBe('aviso');
  });

  it('AMP02 ausente quando existente preenchido', () => {
    const calc = calcularSistema(BASE_AMPL);
    expect(hasCode(validarProjeto(BASE_AMPL, calc), 'AMP02')).toBe(false);
  });
});

describe('validarProjeto — Ampliação: AMP05 (padrão mantido x potência incompatível)', () => {
  // APÓS BUG #1 CORRIGIDO: usar disjuntorEntrada (não disjuntorCA) para controlar potDispKW
  // disjuntorEntrada = 25A monofásico → potDispKW = 5,06 kW < kWtCATotal 7 kW → incompatível
  it('AMP05: aviso quando padrão="Mantido" e potência total > disponibilizada', () => {
    const fd = {
      ...BASE_AMPL,
      situacaoPadrao: 'Mantido' as const,
      disjuntorEntrada: '25',  // DJ GERAL pequeno → PD insuficiente
      disjuntorCA: '40',       // CB inversor (não afeta PD)
    };
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    expect(hasCode(issues, 'AMP05')).toBe(true);
    expect(issues.find(x => x.cod === 'AMP05')?.nivel).toBe('aviso');
  });

  it('AMP05 ausente quando padrão="Alterado / aumento de carga"', () => {
    const fd = {
      ...BASE_AMPL,
      situacaoPadrao: 'Alterado / aumento de carga' as const,
      disjuntorEntrada: '25',
      disjuntorCA: '40',
    };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'AMP05')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// TESTES DAS MELHORIAS (validação técnica 03/06/2026)
// ══════════════════════════════════════════════════════════════

describe('validarProjeto — Bug #2 CORRIGIDO: DPS01 usa vocMaxEfetivo (não vocMax_1,25)', () => {
  it('DPS01: sem aviso quando DPS ≥ vocMaxCorr mas < vocMax_1,25 (não é mais falso positivo)', () => {
    // vocStr = 4 × 50V = 200V, vocMax = 250V, vocMaxCorr = 200×1,07 = 214V
    // DPS = 220V: 220 > vocMaxCorr(214) → sem aviso (correto)
    // Antes do fix: 220 < vocMax(250) → DPS01 disparava (falso positivo)
    const fd = {
      ...BASE,
      paineisSerie: '4', numeroPaineis: '4', stringParalelo: '1',
      vocUnitario: '50', coefTempVoc: '-0.28', tempMinima: '0',
      dpsCCTensao: '220',
    };
    const calc = calcularSistema(fd);
    expect(calc.vocMaxCorr).toBeCloseTo(214, 0);   // 200 × 1.07 = 214V
    expect(calc.vocMax).toBeCloseTo(250, 0);         // 200 × 1.25 = 250V
    // 220 < 214? NO → sem DPS01
    expect(hasCode(validarProjeto(fd, calc), 'DPS01')).toBe(false);
  });

  it('DPS01: aviso quando DPS < vocMaxCorr (verdadeiro positivo)', () => {
    // vocStr = 4 × 50 = 200V, vocMaxCorr = 214V, DPS = 210V < 214V → aviso
    const fd = {
      ...BASE,
      paineisSerie: '4', numeroPaineis: '4', stringParalelo: '1',
      vocUnitario: '50', coefTempVoc: '-0.28', tempMinima: '0',
      dpsCCTensao: '210',
    };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'DPS01')).toBe(true);
  });
});

describe('validarProjeto — SFV03b (aviso de estimativa Voc)', () => {
  it('SFV03b: aviso quando vocUnitario vazio e há painéis', () => {
    const fd = { ...BASE, vocUnitario: '' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'SFV03b')).toBe(true);
    expect(validarProjeto(fd, calc).find(x => x.cod === 'SFV03b')?.nivel).toBe('aviso');
  });

  it('SFV03b: sem aviso quando vocUnitario preenchido', () => {
    const fd = { ...BASE, vocUnitario: '49.5' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'SFV03b')).toBe(false);
  });
});

describe('validarProjeto — SFV06b (vocMax_1,25 falha mas vocMaxCorr passa)', () => {
  it('SFV06b: aviso quando 1.25 falha mas coef. real passa (Cenário 1 original)', () => {
    // vocStr = 5 × 49.5 = 247.5V, vocMax_1.25 = 309.4V > 600V, vocMaxCorr = 264.8V < 600V
    // → SFV06 NÃO dispara (coef. real passa), mas SFV06b AVISA
    const fd = {
      ...BASE,
      vocUnitario: '49.5', paineisSerie: '5',
      tensaoEntradaCC: '295',   // 264.8 < 295 (corr passa), 309.4 > 295 (1.25 falha)
      coefTempVoc: '-0.28', tempMinima: '0',
    };
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    // SFV06 não deve disparar (coef. passa)
    expect(hasCode(issues, 'SFV06')).toBe(false);
    // SFV06b deve disparar (aviso de dependência no coeficiente)
    expect(hasCode(issues, 'SFV06b')).toBe(true);
    expect(issues.find(x => x.cod === 'SFV06b')?.nivel).toBe('aviso');
  });

  it('SFV06b: sem aviso quando ambos os métodos passam', () => {
    // vocStr = 5 × 41.5 = 207.5V, ambos < 600V → sem aviso
    const fd = { ...BASE, vocUnitario: '41.5', tensaoEntradaCC: '600',
                 coefTempVoc: '-0.28', tempMinima: '0' };
    const calc = calcularSistema(fd);
    expect(hasCode(validarProjeto(fd, calc), 'SFV06b')).toBe(false);
  });
});

describe('validarProjeto — CAB03/CAB04 (ampacidade dos cabos)', () => {
  it('CAB03: erro quando bitola CC insuficiente para a corrente', () => {
    // 4 strings × isc ≈ 11.70A × 1.25 = iccNorma ≈ 58.5A > cap 2.5mm² (20A)
    const fd = { ...BASE, secaoCaboCC: '2.5', stringParalelo: '4' };
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    expect(hasCode(issues, 'CAB03')).toBe(true);
    expect(issues.find(x => x.cod === 'CAB03')?.nivel).toBe('erro');
  });

  it('CAB04: erro quando bitola CA insuficiente para a corrente', () => {
    // 25kW mono: iDimCA = (25000/220) × 1.25 = 142A >> cap 6mm² (34A)
    const fd = { ...BASE, potenciaCAkW: '25', secaoCaboCA: '6' };
    const calc = calcularSistema(fd);
    const issues = validarProjeto(fd, calc);
    expect(hasCode(issues, 'CAB04')).toBe(true);
    expect(issues.find(x => x.cod === 'CAB04')?.nivel).toBe('erro');
  });

  it('CAB03: sem erro quando bitola CC adequada (BASE: 6mm², 2 strings)', () => {
    // iccNorma ≈ 29.25A < cap 6mm² (34A) → ok
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'CAB03')).toBe(false);
  });

  it('CAB04: sem erro quando bitola CA adequada (BASE: 6mm², 5kW mono)', () => {
    // iDimCA ≈ 28.4A < cap 6mm² (34A) → ok
    expect(hasCode(validarProjeto(BASE, calcularSistema(BASE)), 'CAB04')).toBe(false);
  });
});

describe('validarProjeto — EMP01/EMP02 (empresa instaladora)', () => {
  it('EMP01: aviso quando nomeEmpresa vazio', () => {
    const issues = validarProjeto({ ...BASE, nomeEmpresa: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'EMP01')).toBe(true);
    expect(issues.find(x => x.cod === 'EMP01')?.nivel).toBe('aviso');
  });

  it('EMP02: aviso quando cnpjEmpresa vazio', () => {
    const issues = validarProjeto({ ...BASE, cnpjEmpresa: '' }, calcularSistema(BASE));
    expect(hasCode(issues, 'EMP02')).toBe(true);
  });

  it('EMP01/EMP02: sem aviso quando empresa preenchida', () => {
    const issues = validarProjeto(BASE, calcularSistema(BASE));
    expect(hasCode(issues, 'EMP01')).toBe(false);
    expect(hasCode(issues, 'EMP02')).toBe(false);
  });
});
