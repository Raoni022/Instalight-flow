import { describe, it, expect } from 'vitest';
import { validarProjeto } from '../src/engine/validarProjeto';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';

// ── Formulário base — projeto completo e consistente ─────────────────────
const BASE: FormData = {
  tipoPessoa: 'fisica',
  nomeCliente: 'João Silva',
  cpfCnpj: '123.456.789-00',
  endereco: 'Rua Teste, 1 — Porto Alegre/RS',
  codigoUC: '1234567890',
  numeroFatura: '9876',
  consumoMensalKwh: '400',
  numContaContrato: '111222333',
  tipoLigacao: 'Monofásico',
  numeroPaineis: '10',
  modeloPainel: 'Canadian Solar CS6R-550',
  potenciaUnitariaWp: '550',
  paineisSerie: '5',
  stringParalelo: '2',
  modeloInversor: 'Growatt MIN 5000TL-X',
  potenciaCAkW: '5',
  tensaoEntradaCC: '600',
  tensaoSaidaCA: '220',
  quantidadeInversores: '1',
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
  aterramento: '5/8" x 2400mm',
  tipoTelhado: 'Cerâmico',
  coordenadas: '',
  nomeResponsavel: 'Eng. Carlos Souza',
  numeroCRT: '12345-D/RS',
  numART: 'ART-2024-001',
  numProjeto: 'PE-2024-001',
  cidade: 'Porto Alegre',
  dataproject: '2026-05-29',
  nomeEmpresa: 'Instalight Energia Solar',
  cnpjEmpresa: '12.345.678/0001-90',
  enderecoEmpresa: 'Rua da Luz, 100 — Porto Alegre/RS',
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
});
