/**
 * exportContent.test.ts — QA de CONTEÚDO dos documentos (não-layout).
 *
 * Garante que os textos/blocos gerados não contêm lixo (undefined/null/NaN/
 * [object Object]), que a ampliação expõe existente+novo+total, e que campos
 * longos não derrubam a geração.
 */

import { describe, it, expect } from 'vitest';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';
import { buildMemorialTemplate, aplicarTextosBasicos } from '../src/helpers/memorial';
import {
  gerarTextoProcuracao, gerarTextoListaRateio, gerarTextoInstrumentoJuridico,
  buildFormularioSpec, buildPendenciasSpec,
} from '../src/helpers/export';
import { buildMemorialSpec } from '../src/helpers/memorialPDF';
import { parseRichText, type Block } from '../src/helpers/docModel';

const base = (over: Partial<FormData>): FormData => ({
  tipoPessoa: 'fisica', tipoInstalacao: 'Nova',
  nomeCliente: 'João da Silva Teste', cpfCnpj: '000.000.000-00',
  rgCliente: '1234567', orgaoExpeditorRG: 'SSP/RS', telefoneCelular: '(51) 90000-0000',
  logradouro: 'Rua Solar Teste', numEndereco: '100', complemento: '', bairro: 'Centro', cep: '90000-000',
  endereco: 'Rua Solar Teste, 100, Porto Alegre/RS', codigoUC: '123456789',
  numeroFatura: '111', consumoMensalKwh: '600', numContaContrato: '99887766',
  tipoLigacao: 'Bifásico', tipoPadrao: '', tipoFixacao: '', materialCaboEntrada: 'Cobre',
  numPoste: 'P-1', disjuntorEntrada: '50', ramalEntrada: '10',
  numeroMedidor: 'MED-1', classeUC: 'Residencial', latitude: '-30', longitude: '-51', transformador: 'TR-1',
  numeroPaineis: '10', modeloPainel: 'Jinko Tiger Neo 550 Wp', potenciaUnitariaWp: '550',
  paineisSerie: '10', stringParalelo: '1',
  vocUnitario: '49.5', iscUnitario: '14', vmppUnitario: '41.5', imppUnitario: '13.25',
  eficienciaPainel: '21.5', coefTempVoc: '-0.28', noct: '45', certificacaoPainel: 'INMETRO',
  modeloInversor: 'Growatt MIN 5000TL-X', potenciaCAkW: '5', tensaoEntradaCC: '600', tensaoSaidaCA: '220',
  quantidadeInversores: '1', numMPPT: '2', faixaMPPTMin: '80', faixaMPPTMax: '550', tensaoPartidaCC: '120', eficienciaInv: '98',
  secaoCaboCC: '6', secaoCaboCA: '6', secaoCaboAterr: '16', comprimentoCabosCC: '25', comprimentoCabosCA: '15',
  dpsCCTipo: 'Tipo 2', dpsCCTensao: '1000', dpsCATipo: 'Tipo 2', dpsCATensao: '275',
  disjuntorCC: '20', disjuntorCA: '32',
  aterramento: 'Haste 5/8" x 2,4 m', modeloStringBox: 'SB-1', resistenciaAterramento: '8',
  tipoTelhado: 'Cerâmico', coordenadas: '', tempMinima: '0',
  tipoResponsabilidade: 'ART', nomeResponsavel: 'Engenheiro Teste', cpfResponsavel: '222.333.444-55',
  numeroCRT: 'CREA-RS 000000', numART: 'ART 000000', tipoProcuracao: 'Empresa', prazoProcuracaoDias: '60',
  numProjeto: 'PE-1', cidade: 'Porto Alegre', dataproject: '2026-06-16',
  nomeEmpresa: 'Instalight Energia Solar', cnpjEmpresa: '12.345.678/0001-90', enderecoEmpresa: 'Rua da Luz, 100',
  nomeRepresentante: '', cpfRepresentante: '', rgRepresentante: '', cargoRepresentante: '',
  inscricaoEstadual: '', emailContato: '', telefoneContato: '',
  numeroPaineisExistentes: '', modeloPainelExistente: '', potenciaWpExistente: '',
  noctExistente: '', certificacaoExistente: '',
  modeloInversorExistente: '', potenciaCAExistentekW: '', quantidadeInversoresExistente: '',
  parecerAcessoAnterior: '', dataAprovacaoAnterior: '', artTrtAnterior: '',
  observacoesExistente: '', situacaoPadrao: 'A definir pelo RT', tipoAmpliacao: 'A definir pelo RT',
  irradLocal: '', prCustom: '',
  tipoCaracterizacao: 'Autoconsumo Local', profissaoRT: 'Engenheiro Eletricista',
  comprimentoPainel: '2.278', larguraPainel: '1.134', pesoPainel: '27.2',
  tipoCaixaMedicao: 'Existente', localInstalacaoCaixa: 'Muro',
  temDSV: 'Não', caracteristicasDSV: '',
  potMaxCCInv: '7500', iMaxCCInv: '13', potMaxCAInv: '5', iMaxCAInv: '22', vCAmaxInv: '264', vCAminInv: '180',
  ...over,
});

const LIXO = /\b(undefined|NaN)\b|\[object Object\]|:\s*null\b/;
const blocksText = (bs: Block[]): string =>
  bs.map((b) => ('text' in b ? b.text : '') +
    (b.t === 'table' ? b.rows.flat().join(' ') : '') +
    (b.t === 'kv' ? `${b.label} ${b.value}` : '') +
    (b.t === 'checkitem' ? `${b.id} ${b.name} ${b.como}` : '') +
    (b.t === 'noteBox' ? `${b.title ?? ''} ${b.lines.join(' ')}` : '')).join('\n');

describe('Conteúdo — Cenário 1 (residencial novo)', () => {
  const fd = base({});
  const calc = calcularSistema(fd);
  const memText = aplicarTextosBasicos(buildMemorialTemplate(fd, calc), fd, calc);

  it('memorial não contém lixo (undefined/NaN/null/[object Object])', () => {
    expect(LIXO.test(memText)).toBe(false);
  });
  it('procuração/rateio/instrumento não contêm lixo', () => {
    expect(LIXO.test(gerarTextoProcuracao(fd, calc))).toBe(false);
    expect(LIXO.test(gerarTextoListaRateio(fd, calc))).toBe(false);
    expect(LIXO.test(gerarTextoInstrumentoJuridico(fd, calc))).toBe(false);
  });
  it('formulário e pendências (blocos) não contêm lixo', () => {
    expect(LIXO.test(blocksText(buildFormularioSpec(fd, calc).blocks))).toBe(false);
    expect(LIXO.test(blocksText(buildPendenciasSpec(fd, calc, {
      diagramas: true, memorial: true, procuracao: true, formularioCEEE: true, listaRateio: false, instrumentoJuridico: false,
    }).blocks))).toBe(false);
  });
  it('memorial tem potências CC e CA preenchidas (não zero)', () => {
    expect(calc.kWp).toBeGreaterThan(0);
    expect(calc.kWtCA).toBeGreaterThan(0);
    expect(memText).toContain('5.5 kWp');
  });
});

describe('Conteúdo — Cenário 2 (ampliação: existente + novo + total)', () => {
  const fd = base({
    tipoPessoa: 'fisica', nomeCliente: 'Maria Ampliação Teste', cpfCnpj: '111.111.111-11',
    codigoUC: '987654321', endereco: 'Avenida Energia Solar, 200, Canoas/RS', cidade: 'Canoas',
    tipoInstalacao: 'Ampliação',
    numeroPaineis: '8', potenciaUnitariaWp: '550', paineisSerie: '8', stringParalelo: '1',
    quantidadeInversores: '1', potenciaCAkW: '4',
    numeroPaineisExistentes: '8', modeloPainelExistente: 'Canadian 450', potenciaWpExistente: '450',
    modeloInversorExistente: 'Growatt 3kW', potenciaCAExistentekW: '3', quantidadeInversoresExistente: '1',
    parecerAcessoAnterior: 'PA-2023-001', artTrtAnterior: 'ART-ANT-001', dataAprovacaoAnterior: '2023-01-10',
  });
  const calc = calcularSistema(fd);
  const memText = aplicarTextosBasicos(buildMemorialTemplate(fd, calc), fd, calc);

  it('totais batem (existente 3,6 + novo 4,4 = 8,0 kWp / 3+4=7 kW)', () => {
    expect(calc.kWpExistente).toBeCloseTo(3.6, 1);
    expect(calc.kWp).toBeCloseTo(4.4, 1);
    expect(calc.kWpTotal).toBeCloseTo(8.0, 1);
    expect(calc.kWtCATotal).toBeCloseTo(7, 1);
  });
  it('memorial expõe existente, total e balanço de ampliação', () => {
    expect(memText).toContain('SISTEMA FOTOVOLTAICO EXISTENTE');
    expect(memText).toContain('TOTAL APÓS AMPLIAÇÃO');
    expect(memText).toContain('Balanço de potências');
  });
  it('formulário usa potência TOTAL na ampliação', () => {
    const t = blocksText(buildFormularioSpec(fd, calc).blocks);
    expect(t).toContain('TOTAL');
    expect(t).toContain(`${calc.kWpTotal} kWp`);
  });
  it('pendências de ampliação incluem grupo C (projeto/parecer/ART anteriores)', () => {
    const t = blocksText(buildPendenciasSpec(fd, calc, {
      diagramas: true, memorial: true, procuracao: false, formularioCEEE: false, listaRateio: false, instrumentoJuridico: false,
    }).blocks);
    expect(t).toContain('AMPLIAÇÃO');
    expect(t).toMatch(/Parecer de acesso anterior/i);
  });
  it('sem lixo na ampliação', () => {
    expect(LIXO.test(memText)).toBe(false);
  });
});

describe('Conteúdo — Cenário 3 (campos longos não quebram geração)', () => {
  const fd = base({
    tipoPessoa: 'juridica',
    nomeCliente: 'Associação Comunitária de Geração Fotovoltaica Sustentável do Bairro São João Batista',
    endereco: 'Estrada Municipal Professor Antônio Carlos de Oliveira Filho, número 1500, Bloco B, Fundos, Zona Rural, Porto Alegre/RS',
    nomeResponsavel: 'Engenheiro Eletricista Responsável Técnico Pela Elaboração e Execução de Projetos Fotovoltaicos de Geração Distribuída',
    tipoCaracterizacao: 'Geração Compartilhada',
  });
  const calc = calcularSistema(fd);

  it('geração não lança e produz blocos válidos', () => {
    const memText = aplicarTextosBasicos(buildMemorialTemplate(fd, calc), fd, calc);
    expect(() => parseRichText(memText)).not.toThrow();
    expect(buildMemorialSpec(fd, calc, memText).blocks.length).toBeGreaterThan(10);
    expect(LIXO.test(memText)).toBe(false);
  });
});
