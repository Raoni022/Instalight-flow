/** Testes do portão de qualidade da exportação (TAREFA 4). */
import { describe, it, expect } from 'vitest';
import { calcularSistema } from '../src/engine/calcularSistema';
import { validarProjeto } from '../src/engine/validarProjeto';
import { validateExportQuality } from '../src/helpers/validateExport';
import type { FormData, DocsGerados } from '../src/types';

const FD: FormData = {
  tipoPessoa: 'fisica', tipoInstalacao: 'Nova',
  nomeCliente: 'João Teste', cpfCnpj: '000.000.000-00',
  rgCliente: '', orgaoExpeditorRG: '', telefoneCelular: '',
  logradouro: '', numEndereco: '', complemento: '', bairro: '', cep: '',
  endereco: 'Rua X, 100, Porto Alegre/RS', codigoUC: '123456789',
  numeroFatura: '', consumoMensalKwh: '600', numContaContrato: '',
  tipoLigacao: 'Bifásico', tipoPadrao: '', tipoFixacao: '', materialCaboEntrada: 'Cobre',
  numPoste: '', disjuntorEntrada: '50', ramalEntrada: '10',
  numeroMedidor: '', classeUC: 'Residencial', latitude: '', longitude: '', transformador: '',
  numeroPaineis: '10', modeloPainel: 'Jinko 550', potenciaUnitariaWp: '550',
  paineisSerie: '10', stringParalelo: '1',
  vocUnitario: '49.5', iscUnitario: '14', vmppUnitario: '41.5', imppUnitario: '13.25',
  eficienciaPainel: '21', coefTempVoc: '-0.28', noct: '45', certificacaoPainel: 'INMETRO',
  modeloInversor: 'Growatt 5kW', potenciaCAkW: '5', tensaoEntradaCC: '600', tensaoSaidaCA: '220',
  quantidadeInversores: '1', numMPPT: '2', faixaMPPTMin: '80', faixaMPPTMax: '550', tensaoPartidaCC: '120', eficienciaInv: '98',
  secaoCaboCC: '6', secaoCaboCA: '6', secaoCaboAterr: '16', comprimentoCabosCC: '25', comprimentoCabosCA: '15',
  dpsCCTipo: 'Tipo 2', dpsCCTensao: '1000', dpsCATipo: 'Tipo 2', dpsCATensao: '275',
  disjuntorCC: '20', disjuntorCA: '32',
  aterramento: 'Haste', modeloStringBox: '', resistenciaAterramento: '8',
  tipoTelhado: 'Cerâmico', coordenadas: '', tempMinima: '0',
  tipoResponsabilidade: 'ART', nomeResponsavel: 'Eng. Teste', cpfResponsavel: '1', numeroCRT: 'CREA-RS 1',
  numART: 'ART 1', tipoProcuracao: 'Empresa', prazoProcuracaoDias: '60',
  numProjeto: '', cidade: 'Porto Alegre', dataproject: '2026-06-16',
  nomeEmpresa: 'Instalight', cnpjEmpresa: '1', enderecoEmpresa: 'Rua Luz',
  nomeRepresentante: '', cpfRepresentante: '', rgRepresentante: '', cargoRepresentante: '',
  inscricaoEstadual: '', emailContato: '', telefoneContato: '',
  numeroPaineisExistentes: '', modeloPainelExistente: '', potenciaWpExistente: '', noctExistente: '', certificacaoExistente: '',
  modeloInversorExistente: '', potenciaCAExistentekW: '', quantidadeInversoresExistente: '',
  parecerAcessoAnterior: '', dataAprovacaoAnterior: '', artTrtAnterior: '',
  observacoesExistente: '', situacaoPadrao: 'A definir pelo RT', tipoAmpliacao: 'A definir pelo RT',
  irradLocal: '', prCustom: '',
  tipoCaracterizacao: 'Autoconsumo Local', profissaoRT: 'Engenheiro Eletricista',
  comprimentoPainel: '2.2', larguraPainel: '1.1', pesoPainel: '27',
  tipoCaixaMedicao: 'Existente', localInstalacaoCaixa: 'Muro',
  temDSV: 'Não', caracteristicasDSV: '',
  potMaxCCInv: '7500', iMaxCCInv: '13', potMaxCAInv: '5', iMaxCAInv: '22', vCAmaxInv: '264', vCAminInv: '180',
};
const DOCS: DocsGerados = { diagramas: true, memorial: true, procuracao: true, formularioCEEE: true, listaRateio: false, instrumentoJuridico: false };
const calc = calcularSistema(FD);
const val = validarProjeto(FD, calc);

describe('validateExportQuality', () => {
  it('libera quando tudo pronto (memorial + prancha + dados + docs)', () => {
    const q = validateExportQuality(FD, calc, val, DOCS, 'memorial gerado', true);
    expect(q.canExport).toBe(true);
    expect(q.erros).toHaveLength(0);
  });

  it('BLOQUEIA sem memorial', () => {
    const q = validateExportQuality(FD, calc, val, { ...DOCS, memorial: false }, '', true);
    expect(q.canExport).toBe(false);
    expect(q.erros.join(' ')).toMatch(/Memorial/i);
  });

  it('BLOQUEIA sem prancha', () => {
    const q = validateExportQuality(FD, calc, val, DOCS, 'mem', false);
    expect(q.canExport).toBe(false);
    expect(q.erros.join(' ')).toMatch(/Prancha|diagrama/i);
  });

  it('BLOQUEIA com dados essenciais vazios', () => {
    const q = validateExportQuality({ ...FD, nomeCliente: '', codigoUC: '' }, calc, val, DOCS, 'mem', true);
    expect(q.canExport).toBe(false);
    expect(q.erros.join(' ')).toMatch(/Nome do cliente|Código da UC/);
  });

  it('BLOQUEIA com potência CC zero (sem módulos)', () => {
    const fd0 = { ...FD, numeroPaineis: '', potenciaUnitariaWp: '' };
    const c0 = calcularSistema(fd0);
    const q = validateExportQuality(fd0, c0, validarProjeto(fd0, c0), DOCS, 'mem', true);
    expect(q.canExport).toBe(false);
    expect(q.erros.join(' ')).toMatch(/Potência CC/i);
  });

  it('apenas avisos (sem procuração) NÃO bloqueia', () => {
    const q = validateExportQuality(FD, calc, val, { ...DOCS, procuracao: false }, 'mem', true);
    expect(q.canExport).toBe(true);
    expect(q.avisos.join(' ')).toMatch(/Procuração/i);
  });

  it('ampliação sem sistema existente BLOQUEIA', () => {
    const fd = { ...FD, tipoInstalacao: 'Ampliação' } as FormData;
    const c = calcularSistema(fd);
    const q = validateExportQuality(fd, c, validarProjeto(fd, c), DOCS, 'mem', true);
    expect(q.canExport).toBe(false);
    expect(q.erros.join(' ')).toMatch(/Ampliação/i);
  });
});
