import { describe, it, expect } from 'vitest';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';

// ── Formulário base para todos os testes ─────────────────────────────────
// Sistema: 10 painéis 550Wp, 5S×2P, monofásico, inversor 5kW
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
  vocUnitario: '', iscUnitario: '', vmppUnitario: '', imppUnitario: '',
  eficienciaPainel: '', coefTempVoc: '', tempMinima: '',
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
  disjuntorCC: '20',
  disjuntorCA: '25',
  aterramento: '5/8" x 2400mm', modeloStringBox: '',
  tipoTelhado: 'Cerâmico',
  coordenadas: '', tempMinima: '',
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

describe('calcularSistema — Potências', () => {
  it('kWp = 10 × 550Wp / 1000 = 5.5 kWp', () => {
    expect(calcularSistema(BASE).kWp).toBe(5.5);
  });

  it('kWtCA = 1 inversor × 5 kW = 5 kW', () => {
    expect(calcularSistema(BASE).kWtCA).toBe(5);
  });

  it('kWp = 0 quando painéis não preenchidos', () => {
    const c = calcularSistema({ ...BASE, numeroPaineis: '', potenciaUnitariaWp: '' });
    expect(c.kWp).toBe(0);
  });

  it('kWtCA multiplica por quantidadeInversores', () => {
    const c = calcularSistema({ ...BASE, quantidadeInversores: '2' });
    expect(c.kWtCA).toBe(10);
  });
});

describe('calcularSistema — Tensões', () => {
  it('vocStr = 5 painéis × 41V = 205V', () => {
    expect(calcularSistema(BASE).vocStr).toBe(205);
  });

  it('vocMax = 205V × 1,25 = 256,25V (NBR 16690)', () => {
    expect(calcularSistema(BASE).vocMax).toBeCloseTo(256.25, 1);
  });

  it('vocStr = 0 quando paineisSerie não preenchido', () => {
    const c = calcularSistema({ ...BASE, paineisSerie: '' });
    expect(c.vocStr).toBe(0);
  });
});

describe('calcularSistema — Correntes CC', () => {
  it('iscStr = 550Wp / 41V ≈ 13.41A', () => {
    expect(calcularSistema(BASE).iscStr).toBeCloseTo(550 / 41, 2);
  });

  it('iccTotal = iscStr × 2 strings', () => {
    const c = calcularSistema(BASE);
    expect(c.iccTotal).toBeCloseTo(c.iscStr * 2, 2);
  });

  it('iccNorma = iccTotal × 1,25 (NBR 16690)', () => {
    const c = calcularSistema(BASE);
    expect(c.iccNorma).toBeCloseTo(c.iccTotal * 1.25, 2);
  });
});

describe('calcularSistema — Correntes CA', () => {
  it('monofásico: iNomCA = 5000W / 220V ≈ 22.73A', () => {
    const c = calcularSistema({ ...BASE, tipoLigacao: 'Monofásico' });
    expect(c.iNomCA).toBeCloseTo(5000 / 220, 1);
  });

  it('trifásico: iNomCA = 5000W / (220V × √3) ≈ 13.12A', () => {
    const c = calcularSistema({ ...BASE, tipoLigacao: 'Trifásico' });
    expect(c.iNomCA).toBeCloseTo(5000 / (220 * Math.sqrt(3)), 1);
  });

  it('bifásico: iNomCA = 5000W / (220V × 2) ≈ 11.36A', () => {
    const c = calcularSistema({ ...BASE, tipoLigacao: 'Bifásico' });
    expect(c.iNomCA).toBeCloseTo(5000 / (220 * 2), 1);
  });

  it('iDimCA = iNomCA × 1,25 (NBR 5410)', () => {
    const c = calcularSistema(BASE);
    expect(c.iDimCA).toBeCloseTo(c.iNomCA * 1.25, 2);
  });
});

describe('calcularSistema — Queda de Tensão', () => {
  it('dvccP calculado com fórmula ΔV = 2LIρ/S', () => {
    const c = calcularSistema(BASE);
    // ΔV = 2 × 20m × iccNorma × 0.01724 / 6mm²
    const expected = (2 * 20 * c.iccNorma * 0.01724) / 6;
    expect(c.dvccV).toBeCloseTo(expected, 2);
  });

  it('dvccV = 0 quando seção do cabo não preenchida', () => {
    const c = calcularSistema({ ...BASE, secaoCaboCC: '' });
    expect(c.dvccV).toBe(0);
  });
});

describe('calcularSistema — Geração e Economia', () => {
  it('geracaoAnual ≈ 7227 kWh para 5.5 kWp (IRRAD=4.8, PR=0.75)', () => {
    const c = calcularSistema(BASE);
    // 5.5 × 4.8 × 0.75 × 365 = 7227
    expect(c.geracaoAnual).toBeGreaterThan(7000);
    expect(c.geracaoAnual).toBeLessThan(7500);
  });

  it('economiaAnual = geracaoAnual × 0.85 (TARIFA RS)', () => {
    const c = calcularSistema(BASE);
    expect(c.economiaAnual).toBeCloseTo(c.geracaoAnual * 0.85, -2); // aprox centenas
  });

  it('geracaoAnual = 0 quando kWp = 0', () => {
    const c = calcularSistema({ ...BASE, numeroPaineis: '' });
    expect(c.geracaoAnual).toBe(0);
  });
});

describe('calcularSistema — CO₂ e Impacto Ambiental', () => {
  it('co2EvitadoAnual = round(geracaoAnual × 0.0783) — ANEEL 2023', () => {
    const c = calcularSistema(BASE);
    expect(c.co2EvitadoAnual).toBe(Math.round(c.geracaoAnual * 0.0783));
  });

  it('arvoresEquivalente = round(co2EvitadoAnual / 25)', () => {
    const c = calcularSistema(BASE);
    expect(c.arvoresEquivalente).toBe(Math.round(c.co2EvitadoAnual / 25));
  });

  it('co2Em25Anos = co2EvitadoAnual × 25', () => {
    const c = calcularSistema(BASE);
    expect(c.co2Em25Anos).toBe(c.co2EvitadoAnual * 25);
  });
});

describe('calcularSistema — Enquadramento', () => {
  it('5.5 kWp → Microgeração Distribuída', () => {
    expect(calcularSistema(BASE).enq).toBe('Microgeração Distribuída');
  });

  it('75 kWp exato → Microgeração Distribuída (limite inclusivo)', () => {
    const c = calcularSistema({ ...BASE, numeroPaineis: '136', potenciaUnitariaWp: '551' });
    // 136 × 551 = 74.936 kWp ≤ 75
    expect(c.enq).toBe('Microgeração Distribuída');
  });

  it('> 75 kWp → Minigeração Distribuída', () => {
    const c = calcularSistema({ ...BASE, numeroPaineis: '200', potenciaUnitariaWp: '550' });
    expect(c.enq).toBe('Minigeração Distribuída');
    expect(c.prazo).toBe('60 dias');
  });

  it('≤ 75 kWp → prazo 15/30 dias', () => {
    expect(calcularSistema(BASE).prazo).toBe('15 dias (sem obra) / 30 dias (com obra)');
  });
});

describe('calcularSistema — percentualAtendimento', () => {
  it('null quando consumo não informado', () => {
    const c = calcularSistema({ ...BASE, consumoMensalKwh: '' });
    expect(c.percentualAtendimento).toBeNull();
  });

  it('clampado a 100% quando geração excede consumo', () => {
    // 400 kWh/mês × 12 = 4800 kWh/ano; geração ≈ 7227 → 150% → clampa a 100
    const c = calcularSistema({ ...BASE, consumoMensalKwh: '400' });
    expect(c.percentualAtendimento).toBe(100);
  });

  it('abaixo de 100 quando consumo supera geração', () => {
    // 2000 kWh/mês × 12 = 24000 kWh/ano; geração ≈ 7227 → ~30%
    const c = calcularSistema({ ...BASE, consumoMensalKwh: '2000' });
    expect(c.percentualAtendimento).toBeGreaterThan(0);
    expect(c.percentualAtendimento!).toBeLessThan(100);
  });
});

describe('calcularSistema — vocMaxCorr (coeficiente real de temperatura)', () => {
  it('vocMaxCorr calculado quando coefTempVoc e tempMinima preenchidos', () => {
    // γ = -0.29%/°C; Tmin = -5°C → fator = 1 + 0.0029 × (25-(-5)) = 1 + 0.087 = 1.087
    // vocStr = 5 × 41 = 205V → vocMaxCorr = 205 × 1.087 ≈ 222.84V
    const c = calcularSistema({ ...BASE, coefTempVoc: '-0.29', tempMinima: '-5' });
    expect(c.vocMaxCorr).not.toBeNull();
    expect(c.vocMaxCorr!).toBeCloseTo(205 * 1.087, 0);
  });

  it('vocMaxCorr null quando coefTempVoc não informado', () => {
    const c = calcularSistema({ ...BASE, coefTempVoc: '', tempMinima: '-5' });
    expect(c.vocMaxCorr).toBeNull();
  });
});
