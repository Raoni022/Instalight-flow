/**
 * exportPDF.smoke.test.ts — Smoke tests dos renderizadores de PDF.
 *
 * Não valida o visual (isso é inspeção manual), mas garante que cada builder
 * roda de ponta a ponta sem lançar exceção e produz um Blob não-trivial —
 * exercitando o caminho crítico de pdfKit: auto-fit de colunas, células
 * multilinha, quebra de página com repetição de cabeçalho e o parser do
 * memorial (16 seções + tabelas largas).
 */

import { describe, it, expect } from 'vitest';
import { calcularSistema } from '../src/engine/calcularSistema';
import type { FormData } from '../src/types';
import {
  getBlobProcuracao, getBlobFormulario, getBlobPendencias,
  getBlobMemorial, getBlobListaRateio, getBlobInstrumento,
} from '../src/helpers/export';
import { buildMemorialTemplate, aplicarTextosBasicos } from '../src/helpers/memorial';

const FD: FormData = {
  tipoPessoa: 'fisica',
  tipoInstalacao: 'Nova',
  nomeCliente: 'João da Silva Pereira dos Santos',
  cpfCnpj: '123.456.789-00',
  rgCliente: '1234567890', orgaoExpeditorRG: 'SSP/RS', telefoneCelular: '(51) 99999-0000',
  logradouro: 'Rua Teste', numEndereco: '100', complemento: '', bairro: 'Centro', cep: '90000-000',
  endereco: 'Rua Teste, 100 — Centro — Porto Alegre/RS — CEP 90000-000',
  codigoUC: '1234567890',
  numeroFatura: '9876',
  consumoMensalKwh: '400',
  numContaContrato: '111222333',
  tipoLigacao: 'Trifásico',
  tipoPadrao: '', tipoFixacao: '', materialCaboEntrada: 'Cobre',
  numPoste: 'P-4521', disjuntorEntrada: '40', ramalEntrada: '10',
  numeroMedidor: 'MED-001', classeUC: 'Residencial', latitude: '-30.0331', longitude: '-51.2300', transformador: 'TR-15',
  numeroPaineis: '20',
  modeloPainel: 'Canadian Solar CS6R-550 MS HiKu6 Mono PERC',
  potenciaUnitariaWp: '550',
  paineisSerie: '10',
  stringParalelo: '2',
  vocUnitario: '49.5', iscUnitario: '13.95', vmppUnitario: '41.7', imppUnitario: '13.19',
  eficienciaPainel: '21.5', coefTempVoc: '-0.26', noct: '41', certificacaoPainel: 'INMETRO/IEC 61215',
  modeloInversor: 'Growatt MID 15KTL3-XH',
  potenciaCAkW: '15',
  tensaoEntradaCC: '1000',
  tensaoSaidaCA: '380',
  quantidadeInversores: '1',
  numMPPT: '2', faixaMPPTMin: '140', faixaMPPTMax: '850', tensaoPartidaCC: '120', eficienciaInv: '98.4',
  secaoCaboCC: '6',
  secaoCaboCA: '10',
  secaoCaboAterr: '16',
  comprimentoCabosCC: '30',
  comprimentoCabosCA: '15',
  dpsCCTipo: 'Tipo 2',
  dpsCCTensao: '1000',
  dpsCATipo: 'Tipo 2',
  dpsCATensao: '275',
  disjuntorCC: '25',
  disjuntorCA: '40',
  aterramento: '5/8" x 2400mm', modeloStringBox: 'SB-1000', resistenciaAterramento: '8',
  tipoTelhado: 'Cerâmico',
  coordenadas: '', tempMinima: '0',
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
  // Campos CEEE adicionados
  tipoCaracterizacao: 'Geração Compartilhada',
  profissaoRT: 'Engenheiro Eletricista',
  comprimentoPainel: '2.278', larguraPainel: '1.134', pesoPainel: '27.2',
  tipoCaixaMedicao: 'Nova', localInstalacaoCaixa: 'Muro',
  temDSV: 'Sim', caracteristicasDSV: 'Seccionadora tripolar 63A visível',
  potMaxCCInv: '22500', iMaxCCInv: '26', potMaxCAInv: '15', iMaxCAInv: '24', vCAmaxInv: '460', vCAminInv: '320',
} as FormData;

const calc = calcularSistema(FD);
const DOCS = {
  diagramas: true, memorial: true, procuracao: true, formularioCEEE: true,
  listaRateio: true, instrumentoJuridico: true,
};

const isBlob = (b: Blob) => b instanceof Blob && b.size > 1500;

describe('Renderizadores de PDF — smoke', () => {
  it('Procuração gera Blob válido', () => {
    expect(isBlob(getBlobProcuracao(FD, calc).blob)).toBe(true);
  });

  it('Formulário CEEE gera Blob válido', () => {
    expect(isBlob(getBlobFormulario(FD, calc).blob)).toBe(true);
  });

  it('Relatório de Pendências gera Blob válido', () => {
    expect(isBlob(getBlobPendencias(FD, calc, DOCS).blob)).toBe(true);
  });

  it('Lista de Rateio (com tabela) gera Blob válido', () => {
    expect(isBlob(getBlobListaRateio(FD, calc).blob)).toBe(true);
  });

  it('Instrumento Jurídico gera Blob válido', () => {
    expect(isBlob(getBlobInstrumento(FD, calc).blob)).toBe(true);
  });

  it('Memorial (modo básico, 16 seções + tabelas largas) gera Blob válido', () => {
    const texto = aplicarTextosBasicos(buildMemorialTemplate(FD, calc), FD, calc);
    expect(isBlob(getBlobMemorial(FD, calc, texto).blob)).toBe(true);
  });

  it('Memorial vazio (fallback) não lança', () => {
    expect(isBlob(getBlobMemorial(FD, calc, '').blob)).toBe(true);
  });

  it('Ampliação: builders rodam sem lançar', () => {
    const amp = { ...FD, tipoInstalacao: 'Ampliação', numeroPaineisExistentes: '10',
      modeloPainelExistente: 'Trina 545', potenciaWpExistente: '545',
      modeloInversorExistente: 'Growatt 5kW', potenciaCAExistentekW: '5',
      quantidadeInversoresExistente: '1' } as FormData;
    const ac = calcularSistema(amp);
    const texto = aplicarTextosBasicos(buildMemorialTemplate(amp, ac), amp, ac);
    expect(isBlob(getBlobMemorial(amp, ac, texto).blob)).toBe(true);
    expect(isBlob(getBlobPendencias(amp, ac, DOCS).blob)).toBe(true);
  });
});
