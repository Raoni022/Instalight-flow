import { describe, it, expect } from 'vitest';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';

// ── Formulário base para todos os testes ─────────────────────────────────
// Sistema: 10 painéis 550Wp, 5S×2P, monofásico, inversor 5kW
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
  disjuntorCC: '20',
  disjuntorCA: '25',
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
  // Com potenciaUnitariaWp=550 ≥ 500 Wp, VOC_PP_DIN = 47 V (atualizado para módulos modernos)
  it('vocStr = 5 painéis × 47V (estimativa 550Wp) = 235V', () => {
    expect(calcularSistema(BASE).vocStr).toBe(235);
  });

  it('vocMax = 235V × 1,25 = 293,75V (NBR 16690)', () => {
    expect(calcularSistema(BASE).vocMax).toBeCloseTo(293.75, 1);
  });

  it('vocStr usa Voc real do datasheet quando informado', () => {
    const c = calcularSistema({ ...BASE, vocUnitario: '49.5' });
    expect(c.vocStr).toBeCloseTo(5 * 49.5, 1); // 247.5 V
  });

  it('vocStr usa 41V (VOC_PP legado) para módulos < 350 Wp', () => {
    const c = calcularSistema({ ...BASE, potenciaUnitariaWp: '300', vocUnitario: '' });
    expect(c.vocStr).toBeCloseTo(5 * 41, 0); // 205 V
  });

  it('vocStr = 0 quando paineisSerie não preenchido', () => {
    const c = calcularSistema({ ...BASE, paineisSerie: '' });
    expect(c.vocStr).toBe(0);
  });
});

describe('calcularSistema — Correntes CC', () => {
  // Com potenciaUnitariaWp=550 e iscUnitario='', iscStr = Wp / VOC_PP_DIN = 550/47 ≈ 11.70A
  it('iscStr estimado como Wp/Voc quando iscUnitario não informado (550Wp: 550/47 ≈ 11.70A)', () => {
    expect(calcularSistema(BASE).iscStr).toBeCloseTo(550 / 47, 2);
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
    // vocStr = 5 × 47V (VOC_PP_DIN para 550Wp) = 235V
    // γ = -0.29%/°C; Tmin = -5°C → fator = 1 + 0.0029 × (25+5) = 1 + 0.087 = 1.087
    // vocMaxCorr = 235 × 1.087 ≈ 255.45V
    const c = calcularSistema({ ...BASE, coefTempVoc: '-0.29', tempMinima: '-5' });
    expect(c.vocMaxCorr).not.toBeNull();
    expect(c.vocMaxCorr!).toBeCloseTo(235 * 1.087, 0);
  });

  it('vocMaxCorr null quando coefTempVoc não informado', () => {
    const c = calcularSistema({ ...BASE, coefTempVoc: '', tempMinima: '-5' });
    expect(c.vocMaxCorr).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// TESTES DE AMPLIAÇÃO
// ══════════════════════════════════════════════════════════════

describe('calcularSistema — Ampliação: Teste 1 — instalação nova', () => {
  it('kWpTotal = kWp para nova instalação (sem existente)', () => {
    const c = calcularSistema(BASE);
    expect(c.kWpTotal).toBe(c.kWp);
  });

  it('kWtCATotal = kWtCA para nova instalação', () => {
    const c = calcularSistema(BASE);
    expect(c.kWtCATotal).toBe(c.kWtCA);
  });

  it('enqTotal bate com potência nova quando não há existente', () => {
    const c = calcularSistema(BASE);
    // kWp = 5.5 kWp → Microgeração
    expect(c.enqTotal).toBe('Microgeração Distribuída');
    expect(c.enqNovo).toBe('Microgeração Distribuída');
  });

  it('kWpExistente = 0 e percentualAumentokWp = null para nova instalação', () => {
    const c = calcularSistema(BASE);
    expect(c.kWpExistente).toBe(0);
    expect(c.percentualAumentokWp).toBeNull();
  });
});

describe('calcularSistema — Ampliação: Teste 2 — sistema existente 3,6kWp + novo 4,4kWp', () => {
  // Existente: 8 módulos × 450 Wp = 3,6 kWp | Inversor existente 3 kW
  // Novo:     8 módulos × 550 Wp = 4,4 kWp | Inversor novo 4 kW
  const AMPL: FormData = {
    ...BASE,
    tipoInstalacao: 'Ampliação',
    numeroPaineis: '8', potenciaUnitariaWp: '550',
    paineisSerie: '4', stringParalelo: '2',
    potenciaCAkW: '4', quantidadeInversores: '1',
    numeroPaineisExistentes: '8', potenciaWpExistente: '450',
    potenciaCAExistentekW: '3', quantidadeInversoresExistente: '1',
  };

  it('kWpExistente = 8 × 450Wp / 1000 = 3,6 kWp', () => {
    expect(calcularSistema(AMPL).kWpExistente).toBe(3.6);
  });

  it('kWp novo = 8 × 550Wp / 1000 = 4,4 kWp', () => {
    expect(calcularSistema(AMPL).kWp).toBe(4.4);
  });

  it('kWpTotal = 3,6 + 4,4 = 8,0 kWp', () => {
    expect(calcularSistema(AMPL).kWpTotal).toBe(8.0);
  });

  it('kWtCAExistente = 3,0 kW', () => {
    expect(calcularSistema(AMPL).kWtCAExistente).toBe(3.0);
  });

  it('kWtCA novo = 4,0 kW', () => {
    expect(calcularSistema(AMPL).kWtCA).toBe(4.0);
  });

  it('kWtCATotal = 3,0 + 4,0 = 7,0 kW', () => {
    expect(calcularSistema(AMPL).kWtCATotal).toBe(7.0);
  });

  it('enqTotal = Microgeração Distribuída (8,0 kWp ≤ 75)', () => {
    expect(calcularSistema(AMPL).enqTotal).toBe('Microgeração Distribuída');
  });

  it('percentualAumentokWp = (4,4 / 3,6) × 100 ≈ 122,2%', () => {
    const c = calcularSistema(AMPL);
    expect(c.percentualAumentokWp).not.toBeNull();
    expect(c.percentualAumentokWp!).toBeCloseTo(122.2, 0);
  });
});

// ══════════════════════════════════════════════════════════════
// TESTES DAS MELHORIAS (validação técnica 03/06/2026)
// ══════════════════════════════════════════════════════════════

describe('calcularSistema — Bug #1 CORRIGIDO: potDispKW usa disjuntorEntrada', () => {
  it('potDispKW calculado com disjuntorEntrada (não disjuntorCA)', () => {
    // djEntrada=50A, djCA=25A, monofásico → potDispKW = (220×50×1)/1000×0,92 = 10,12 kW
    const c = calcularSistema({ ...BASE, disjuntorEntrada: '50', disjuntorCA: '25' });
    expect(c.potDispKW).toBeCloseTo(10.12, 1);
  });

  it('cálculo antigo (errado) com djCA=25A daria 5,06 kW — agora correto 10,12 kW', () => {
    const c = calcularSistema({ ...BASE, disjuntorEntrada: '50', disjuntorCA: '25' });
    const valorErrado = parseFloat(((220 * 25 * 1) / 1000 * 0.92).toFixed(2)); // 5.06
    const valorCorreto = parseFloat(((220 * 50 * 1) / 1000 * 0.92).toFixed(2)); // 10.12
    expect(c.potDispKW).toBeCloseTo(valorCorreto, 1);
    expect(c.potDispKW).not.toBeCloseTo(valorErrado, 1);
  });

  it('potDispKW trifásico usa disjuntorEntrada corretamente', () => {
    // djEntrada=63A, trifásico: potDispKVA = (220×63×√3)/1000 = 24,01 kVA → kW = 22,09
    const c = calcularSistema({ ...BASE, tipoLigacao: 'Trifásico', disjuntorEntrada: '63' });
    expect(c.potDispKW).toBeCloseTo(22.09, 0);
  });
});

describe('calcularSistema — geracaoAnualTotal para ampliação', () => {
  const AMPL2 = {
    ...BASE,
    tipoInstalacao: 'Ampliação' as const,
    numeroPaineis: '8', potenciaUnitariaWp: '550',
    paineisSerie: '4', stringParalelo: '2',
    potenciaCAkW: '4', quantidadeInversores: '1',
    numeroPaineisExistentes: '8', potenciaWpExistente: '450',
    potenciaCAExistentekW: '3', quantidadeInversoresExistente: '1',
  };

  it('geracaoAnualTotal inclui sistema existente (maior que geracaoAnual)', () => {
    const c = calcularSistema(AMPL2);
    expect(c.geracaoAnualTotal).toBeGreaterThan(c.geracaoAnual);
  });

  it('geracaoAnualTotal = kWpTotal × IRRAD × PR × 365', () => {
    const c = calcularSistema(AMPL2);
    // kWpTotal = 4.4 + 3.6 = 8.0 kWp
    expect(c.geracaoAnualTotal).toBe(Math.round(8.0 * 4.8 * 0.75 * 365));
  });

  it('geracaoAnualTotal = geracaoAnual para nova instalação', () => {
    const c = calcularSistema(BASE);
    expect(c.geracaoAnualTotal).toBe(c.geracaoAnual);
  });

  it('economiaAnualTotal > economiaAnual para ampliação', () => {
    const c = calcularSistema(AMPL2);
    expect(c.economiaAnualTotal).toBeGreaterThan(c.economiaAnual);
  });
});

describe('calcularSistema — irradLocal e prCustom', () => {
  it('irradEfetivo = irradLocal quando preenchido', () => {
    const c = calcularSistema({ ...BASE, irradLocal: '5.2' });
    expect(c.irradEfetivo).toBe(5.2);
  });

  it('irradEfetivo = IRRAD padrão (4.8) quando irradLocal vazio', () => {
    const c = calcularSistema({ ...BASE, irradLocal: '' });
    expect(c.irradEfetivo).toBe(4.8);
  });

  it('prEfetivo = prCustom quando preenchido', () => {
    const c = calcularSistema({ ...BASE, prCustom: '0.80' });
    expect(c.prEfetivo).toBe(0.80);
  });

  it('prEfetivo = PR padrão (0.75) quando prCustom vazio', () => {
    const c = calcularSistema({ ...BASE, prCustom: '' });
    expect(c.prEfetivo).toBe(0.75);
  });

  it('irradLocal afeta geracaoAnual', () => {
    const c1 = calcularSistema({ ...BASE, irradLocal: '5.5' });
    const c2 = calcularSistema({ ...BASE, irradLocal: '' });
    expect(c1.geracaoAnual).toBeGreaterThan(c2.geracaoAnual);
  });
});

describe('calcularSistema — VOC_PP dinâmico por faixa de potência', () => {
  it('módulo 550Wp usa VOC_PP_DIN = 47V quando vocUnitario vazio', () => {
    const c = calcularSistema({ ...BASE, vocUnitario: '', potenciaUnitariaWp: '550', paineisSerie: '1' });
    expect(c.vocStr).toBe(47);
  });

  it('módulo 400Wp (350–499W) usa VOC_PP_DIN = 44V', () => {
    const c = calcularSistema({ ...BASE, vocUnitario: '', potenciaUnitariaWp: '400', paineisSerie: '1' });
    expect(c.vocStr).toBe(44);
  });

  it('módulo 300Wp (< 350W) usa VOC_PP legado = 41V', () => {
    const c = calcularSistema({ ...BASE, vocUnitario: '', potenciaUnitariaWp: '300', paineisSerie: '1' });
    expect(c.vocStr).toBe(41);
  });

  it('vocUnitario real do datasheet tem prioridade sobre VOC_PP_DIN', () => {
    const c = calcularSistema({ ...BASE, vocUnitario: '49.5', potenciaUnitariaWp: '550', paineisSerie: '1' });
    expect(c.vocStr).toBeCloseTo(49.5, 1);
  });
});
