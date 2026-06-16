/**
 * export.ts — Builders de documentos (DocSpec) + exportação PDF e Word
 *
 * Cada documento é descrito como um DocSpec (docModel) e renderizado para
 * PDF (pdfKit) ou DOCX (docxRender), garantindo que ambos os formatos saiam
 * idênticos. As funções gerarTexto* permanecem como fonte do texto (também
 * usadas no preview da UI e no refino por IA).
 */

import type { FormData, Calculos, DocsGerados } from '../types';
import { makePDF } from './pdf';
import { makeFilename } from './filename';
import { renderSpecToPdf } from './pdfKit';
import { docxBlob } from './docxRender';
import {
  parseRichText, buildFormularioBlocks, buildPendenciasBlocks,
  type DocSpec, type Block,
} from './docModel';
import { buildMemorialSpec } from './memorialPDF';

/** Remove o bloco de título (linhas até a primeira em branco, inclusive). */
function dropTitleBlock(txt: string): string {
  const ls = txt.split('\n');
  let i = 0;
  while (i < ls.length && ls[i].trim() !== '') i++;
  while (i < ls.length && ls[i].trim() === '') i++;
  return ls.slice(i).join('\n');
}

const chromeFor = (fd: FormData, title: string): DocSpec['chrome'] => ({
  title,
  subtitle: `${(fd.nomeCliente || '—').substring(0, 40)}  ·  UC ${fd.codigoUC || '—'}`,
  company: fd.nomeEmpresa || 'Instalight Energia Solar',
});

// ── Texto: Procuração ─────────────────────────────────────────────────────────

/** Gera o texto completo da Procuração Específica.
 *  Duas modalidades (fd.tipoProcuracao):
 *   - 'Responsável Técnico': nomeia o RT/engenheiro como procurador, com prazo (modelo CEEE enviado)
 *   - 'Empresa' (padrão): nomeia a empresa instaladora como outorgada (formato jurídico completo)
 */
export function gerarTextoProcuracao(fd: FormData, calc: Calculos): string {
  if (fd.tipoProcuracao === 'Responsável Técnico') {
    return gerarProcuracaoRT(fd, calc);
  }
  const hoje = fd.dataproject || new Date().toLocaleDateString('pt-BR');
  const repBlock = fd.tipoPessoa === 'juridica' && fd.nomeRepresentante
    ? `, neste ato representada por ${fd.nomeRepresentante}, ` +
      `portador(a) do CPF nº ${fd.cpfRepresentante || '___'}, ` +
      `na qualidade de ${fd.cargoRepresentante || 'representante legal'}, ` +
      `nos termos do contrato/estatuto social`
    : '';

  const tipoPessoa =
    fd.tipoPessoa === 'fisica'
      ? `${fd.nomeCliente || '___'}, CPF nº ${fd.cpfCnpj || '___'}, residente e domiciliado(a) em ${fd.endereco || '___'}`
      : `${fd.nomeCliente || '___'}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${fd.cpfCnpj || '___'}, com sede em ${fd.endereco || '___'}${repBlock}`;

  const np = parseFloat(fd.numeroPaineis) || 0;

  return `PROCURAÇÃO ESPECÍFICA

${fd.cidade || 'Porto Alegre'}, ${hoje}.

OUTORGANTE: ${tipoPessoa}, titular da Unidade Consumidora (UC) de código ${fd.codigoUC || '___'}, área de concessão da CEEE Equatorial.

OUTORGADO: ${fd.nomeEmpresa || 'Instalight Energia Solar'}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${fd.cnpjEmpresa || '___'}, com endereço em ${fd.enderecoEmpresa || 'Porto Alegre, RS'}.

Por meio deste instrumento particular, o OUTORGANTE nomeia e constitui o OUTORGADO como seu bastante procurador, conferindo-lhe poderes específicos para:

I. Protocolar, instruir, assinar e acompanhar junto à CEEE Equatorial o processo de solicitação de acesso à rede de distribuição para implantação de sistema de ${calc.enq} fotovoltaica, nos termos do Art. 9° da Resolução Normativa ANEEL n° 1.000/2021 e da Lei Federal n° 14.300/2022;

II. Assinar formulários, declarações e demais documentos necessários à aprovação do sistema fotovoltaico de ${calc.kWp} kWp (${np || '—'} módulos de ${fd.potenciaUnitariaWp || '—'} Wp, inversor ${fd.modeloInversor || '—'}) na referida Unidade Consumidora;

III. Retirar protocolos, acompanhar o andamento do processo e praticar todos os atos necessários ao pleno cumprimento do objeto desta procuração.

Esta procuração é outorgada com poderes para um único ato e somente para os fins acima especificados, vedado o substabelecimento.

_______________________________
${fd.nomeCliente || 'OUTORGANTE'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${fd.cpfCnpj || '___'}

Reconhecimento de firma: _______________________________ (Cartório)

NOTA: Conforme Art. 9° da REN ANEEL 1.000/2021, a procuração deve ter firma reconhecida em cartório.`;
}

/** Procuração nomeando o Responsável Técnico como procurador (modelo CEEE simplificado). */
function gerarProcuracaoRT(fd: FormData, calc: Calculos): string {
  const dataObj = fd.dataproject ? new Date(fd.dataproject + 'T12:00:00') : new Date();
  const dataExtenso = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const dataCurta = dataObj.toLocaleDateString('pt-BR');
  const prazo = fd.prazoProcuracaoDias || '60';
  const registroLabel = fd.tipoResponsabilidade === 'TRT' ? 'CFT/CRT' : 'CREA';

  const outorgante = fd.tipoPessoa === 'fisica'
    ? `${fd.nomeCliente || '[NOME DO CLIENTE]'}, portador(a) do CPF nº ${fd.cpfCnpj || '___'}`
    : `${fd.nomeCliente || '[RAZÃO SOCIAL]'}, inscrita no CNPJ sob nº ${fd.cpfCnpj || '___'}${fd.nomeRepresentante ? `, neste ato representada por ${fd.nomeRepresentante} (CPF ${fd.cpfRepresentante || '___'}), na qualidade de ${fd.cargoRepresentante || 'representante legal'}` : ''}`;

  return `PROCURAÇÃO

À CEEE EQUATORIAL

Por meio deste instrumento particular de procuração, ${outorgante}, titular da Unidade Consumidora nº ${fd.codigoUC || '___'} (UC), responsável pelo imóvel localizado em ${fd.endereco || '[ENDEREÇO COMPLETO]'}, a fim de tratar exclusivamente de assuntos referentes ao projeto de energia solar fotovoltaica de ${calc.kWp} kWp (${fd.numeroPaineis || '—'} módulos / inversor ${fd.modeloInversor || '—'}), nomeia e constitui seu bastante procurador o(a) ${fd.profissaoRT || 'Engenheiro(a) Eletricista'} ${fd.nomeResponsavel || '[NOME DO RT]'}, ${registroLabel}: ${fd.numeroCRT || '___'}, CPF nº ${fd.cpfResponsavel || '___'}, pelo prazo de ${prazo} (${prazo === '60' ? 'sessenta' : prazo}) dias, a partir de ${dataCurta}.

Ao procurador são conferidos poderes para protocolar, instruir, assinar e acompanhar, junto à CEEE Equatorial, a solicitação de orçamento e o acesso à rede de distribuição para a microgeração/minigeração distribuída da referida UC, nos termos do Art. 9° da REN ANEEL n° 1.000/2021 e da Lei Federal n° 14.300/2022.

Endereço para contato com o Procurador:
${fd.enderecoEmpresa || '[ENDEREÇO DO PROCURADOR]'}
${fd.cidade || 'Porto Alegre'} — RS

${fd.cidade || 'Porto Alegre'}, ${dataExtenso}.

_______________________________________________
${fd.nomeCliente || '[OUTORGANTE]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${fd.cpfCnpj || '___'}
Unidade Consumidora CEEE Equatorial: ${fd.codigoUC || '___'}

NOTA: Conforme Art. 9° da REN ANEEL 1.000/2021, a procuração deve ter firma reconhecida em cartório.`;
}

// ── Texto: Lista de Rateio (D1) ───────────────────────────────────────────────
export function gerarTextoListaRateio(fd: FormData, calc: Calculos): string {
  const hoje = fd.dataproject || new Date().toLocaleDateString('pt-BR');
  const caract = fd.tipoCaracterizacao || 'Geração Compartilhada';
  return `LISTA DE RATEIO DOS CRÉDITOS DE ENERGIA ELÉTRICA
Conforme Lei Federal n° 14.300/2022 — Art. 2°, IX e Art. 27

${fd.cidade || 'Porto Alegre'}, ${hoje}.

UNIDADE GERADORA (UC TITULAR DA GERAÇÃO)
UC Número:       ${fd.codigoUC || '[INSERIR CÓDIGO DA UC GERADORA]'}
Titular:         ${fd.nomeCliente || '[INSERIR NOME DO TITULAR]'}
CPF/CNPJ:        ${fd.cpfCnpj || '[INSERIR]'}
Endereço:        ${fd.endereco || '[INSERIR ENDEREÇO]'}
Cidade/UF:       ${fd.cidade || 'Porto Alegre'} / RS
Distribuidora:   CEEE Equatorial — Rio Grande do Sul
Enquadramento:   ${caract} — ${calc.enq} de ${calc.kWp} kWp

GERAÇÃO ESTIMADA DO SISTEMA FOTOVOLTAICO
Geração estimada anual:  ${calc.geracaoAnual.toLocaleString('pt-BR')} kWh/ano
Geração estimada mensal: ${Math.round(calc.geracaoAnual / 12).toLocaleString('pt-BR')} kWh/mês

RELAÇÃO DE UNIDADES CONSUMIDORAS BENEFICIÁRIAS
(Preencher todos os campos — percentuais devem somar 100%)

| Nº | UC Beneficiária | Titular da UC Beneficiária | CPF/CNPJ | % Créditos | kWh/mês estimado |
|----|-----------------|----------------------------|----------|------------|------------------|
| 01 | [INSERIR UC]    | [INSERIR NOME]             | [INSERIR]| ___,__ %   | _______ kWh      |
| 02 | [INSERIR UC]    | [INSERIR NOME]             | [INSERIR]| ___,__ %   | _______ kWh      |
| 03 | [INSERIR UC]    | [INSERIR NOME]             | [INSERIR]| ___,__ %   | _______ kWh      |
| 04 | [INSERIR UC]    | [INSERIR NOME]             | [INSERIR]| ___,__ %   | _______ kWh      |
| TOTAL |             |                            |          | 100,00 %   |                  |

Observações:
• Os percentuais de rateio são definidos pelo titular da UC geradora e podem ser alterados mediante nova solicitação à distribuidora (CEEE Equatorial).
• As UCs beneficiárias devem estar na mesma área de concessão da UC geradora.
• Para Autoconsumo Remoto: as UCs devem pertencer ao mesmo titular (CPF/CNPJ).
• Para Geração Compartilhada / EMUC: as UCs podem ter titulares distintos.
• O rateio é realizado mensalmente sobre os créditos gerados, conforme Art. 27 da Lei 14.300/2022.

BASE LEGAL
• Lei Federal n° 14.300/2022 — Marco Legal da Micro e Minigeração Distribuída
• ANEEL REN n° 1.000/2021 — Módulo 3 — Seção 3.8
• NT.00020.EQTL-06 (CEEE Equatorial) — Revisão 12/2025

DECLARAÇÃO DO TITULAR
O(a) abaixo assinado(a), titular da unidade geradora identificada acima, declara que os percentuais de rateio indicados neste documento refletem sua vontade e estão em conformidade com a legislação vigente.

_______________________________
${fd.nomeCliente || '[NOME DO TITULAR]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${fd.cpfCnpj || '[CPF/CNPJ]'}

${fd.cidade || 'Porto Alegre'}, ${hoje}.

NOTA: Este documento deve ser apresentado junto ao Formulário de Solicitação de Orçamento de Conexão à CEEE Equatorial. O reconhecimento de firma pode ser exigido pela distribuidora.`;
}

// ── Texto: Instrumento Jurídico (D2) ──────────────────────────────────────────
export function gerarTextoInstrumentoJuridico(fd: FormData, calc: Calculos): string {
  const hoje = fd.dataproject || new Date().toLocaleDateString('pt-BR');
  const caract = fd.tipoCaracterizacao || 'Geração Compartilhada';

  const cedente = fd.tipoPessoa === 'fisica'
    ? `${fd.nomeCliente || '[NOME]'}, CPF nº ${fd.cpfCnpj || '[CPF]'}, residente em ${fd.endereco || '[ENDEREÇO]'}`
    : `${fd.nomeCliente || '[NOME]'}, CNPJ nº ${fd.cpfCnpj || '[CNPJ]'}, com sede em ${fd.endereco || '[ENDEREÇO]'}`;

  return `INSTRUMENTO PARTICULAR DE SOLIDARIEDADE E CESSÃO DE CRÉDITOS DE ENERGIA ELÉTRICA — GERAÇÃO DISTRIBUÍDA

${fd.cidade || 'Porto Alegre'}, ${hoje}.

BASE LEGAL: Lei Federal n° 14.300/2022 (Art. 27) e ANEEL REN n° 1.000/2021

PARTES

CEDENTE (Titular da UC Geradora):
${cedente}
UC Geradora nº: ${fd.codigoUC || '[INSERIR UC GERADORA]'}

CESSIONÁRIO(S) (Titular(es) das UC(s) Beneficiária(s)):
Nome/Razão Social: [INSERIR NOME DO CESSIONÁRIO 1]
CPF/CNPJ: [INSERIR CPF/CNPJ]
UC Beneficiária: [INSERIR NÚMERO DA UC]

OBJETO

O presente instrumento tem por objeto a formalização da solidariedade entre as partes acima identificadas para fins de participação no sistema de ${caract.toLowerCase()}, nos termos da Lei Federal n° 14.300/2022 e da Resolução Normativa ANEEL n° 1.000/2021.

O CEDENTE, titular do sistema de geração fotovoltaica de ${calc.kWp} kWp instalado na UC nº ${fd.codigoUC || '[UC GERADORA]'}, na área de concessão da CEEE Equatorial (RS), CEDE E TRANSFERE aos CESSIONÁRIOS os créditos de energia elétrica gerados pelo sistema fotovoltaico, nas proporções definidas na Lista de Rateio em vigor.

CLÁUSULAS

Cláusula 1ª — SOLIDARIEDADE
As partes são solidariamente responsáveis pelas obrigações perante a CEEE Equatorial decorrentes do sistema de ${caract.toLowerCase()}, nos termos do Art. 27, §2° da Lei Federal n° 14.300/2022.

Cláusula 2ª — PROPORCIONALIDADE DOS CRÉDITOS
A distribuição dos créditos de energia elétrica entre as UCs participantes será realizada conforme a Lista de Rateio apresentada à CEEE Equatorial, a qual integra este instrumento como Anexo I.

Cláusula 3ª — VIGÊNCIA
Este instrumento tem vigência por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante comunicação formal à distribuidora com antecedência mínima de 30 dias.

Cláusula 4ª — ALTERAÇÕES
Qualquer alteração nos percentuais de rateio ou nas UCs participantes deve ser comunicada à CEEE Equatorial mediante nova solicitação formal, acompanhada de Lista de Rateio atualizada.

Cláusula 5ª — FORO
As partes elegem o foro da comarca de ${fd.cidade || 'Porto Alegre'} — RS para dirimir eventuais litígios decorrentes deste instrumento.

ASSINATURAS

CEDENTE:
_______________________________
${fd.nomeCliente || '[NOME]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${fd.cpfCnpj || '[CPF/CNPJ]'}

CESSIONÁRIO 1:
_______________________________
Nome: [INSERIR NOME]
CPF/CNPJ: [INSERIR]

TESTEMUNHAS:
1. Nome: _______________________  CPF: _______________
2. Nome: _______________________  CPF: _______________

NOTA: Este instrumento deve ter as firmas reconhecidas em cartório conforme exigência da CEEE Equatorial. Verificar se a distribuidora aceita instrumento particular ou se exige escritura pública conforme o valor e as partes envolvidas.`;
}

// ── Specs (fonte única PDF + DOCX) ────────────────────────────────────────────
export function buildProcuracaoSpec(fd: FormData, calc: Calculos, overrideText?: string): DocSpec {
  const texto = overrideText && overrideText.trim() ? overrideText : gerarTextoProcuracao(fd, calc);
  return {
    title: { title: 'PROCURAÇÃO ESPECÍFICA', subtitle: 'Art. 9° — REN ANEEL n° 1.000/2021' },
    chrome: chromeFor(fd, 'Procuração'),
    blocks: parseRichText(dropTitleBlock(texto)),
    filenameKey: 'procuracao',
  };
}
export function buildFormularioSpec(fd: FormData, calc: Calculos): DocSpec {
  return {
    title: { title: 'FORMULÁRIO DE SOLICITAÇÃO DE ACESSO', subtitle: 'Micro/Minigeração Distribuída — CEEE Equatorial' },
    chrome: chromeFor(fd, 'Formulário CEEE'),
    blocks: buildFormularioBlocks(fd, calc),
    filenameKey: 'formulario_ceee',
  };
}
export function buildPendenciasSpec(fd: FormData, calc: Calculos, docs: DocsGerados): DocSpec {
  return {
    title: { title: 'RELATÓRIO DE PENDÊNCIAS', subtitle: 'Protocolo CEEE — Anexo III NT.00020.EQTL-06 REV 06' },
    chrome: chromeFor(fd, 'Pendências'),
    blocks: buildPendenciasBlocks(fd, calc, docs),
    filenameKey: 'pendencias',
  };
}
export function buildListaRateioSpec(fd: FormData, calc: Calculos): DocSpec {
  const caract = fd.tipoCaracterizacao || 'Geração Compartilhada';
  const aplicavel = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC'].includes(caract);
  const blocks: Block[] = [];
  if (!aplicavel) {
    blocks.push({
      t: 'noteBox',
      title: `ATENÇÃO: Projeto caracterizado como "${caract}"`,
      lines: ['Lista de rateio aplicável apenas a Autoconsumo Remoto, Geração Compartilhada e EMUC.'],
    });
  }
  blocks.push(...parseRichText(dropTitleBlock(gerarTextoListaRateio(fd, calc))));
  return {
    title: { title: 'LISTA DE RATEIO DOS CRÉDITOS DE ENERGIA', subtitle: 'Lei Federal n° 14.300/2022 — Art. 2°, IX e Art. 27' },
    chrome: chromeFor(fd, 'Lista de Rateio'),
    blocks,
    filenameKey: 'lista_rateio',
  };
}
export function buildInstrumentoSpec(fd: FormData, calc: Calculos): DocSpec {
  return {
    title: { title: 'INSTRUMENTO JURÍDICO DE SOLIDARIEDADE', subtitle: 'Cessão de Créditos de GD — Lei Federal n° 14.300/2022 (Art. 27)' },
    chrome: chromeFor(fd, 'Instrumento Jurídico'),
    blocks: parseRichText(dropTitleBlock(gerarTextoInstrumentoJuridico(fd, calc))),
    filenameKey: 'instrumento_juridico',
  };
}

// ── Helpers de render ─────────────────────────────────────────────────────────
function pdfFromSpec(spec: DocSpec, fd: FormData): { doc: ReturnType<typeof makePDF>; filename: string } {
  const doc = makePDF('p', 'a4');
  renderSpecToPdf(doc, spec);
  return { doc, filename: makeFilename(spec.filenameKey, fd) };
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function wordDownload(spec: DocSpec, fd: FormData): Promise<void> {
  triggerDownload(await docxBlob(spec), makeFilename(spec.filenameKey, fd, 'docx'));
}

// ── API pública — PDF (download) ──────────────────────────────────────────────
export function exportarProcuracaoPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = pdfFromSpec(buildProcuracaoSpec(fd, calc), fd); doc.save(filename);
}
export function exportarFormularioPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = pdfFromSpec(buildFormularioSpec(fd, calc), fd); doc.save(filename);
}
export function exportarPendenciasPDFStandalone(fd: FormData, calc: Calculos, docs: DocsGerados): void {
  const { doc, filename } = pdfFromSpec(buildPendenciasSpec(fd, calc, docs), fd); doc.save(filename);
}
export function exportarMemorialPDFStandalone(fd: FormData, calc: Calculos, memorialIA: string): void {
  const { doc, filename } = pdfFromSpec(buildMemorialSpec(fd, calc, memorialIA), fd); doc.save(filename);
}
export function exportarListaRateioPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = pdfFromSpec(buildListaRateioSpec(fd, calc), fd); doc.save(filename);
}
export function exportarInstrumentoJuridicoPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = pdfFromSpec(buildInstrumentoSpec(fd, calc), fd); doc.save(filename);
}

// ── API pública — Word (download) ─────────────────────────────────────────────
export const exportarProcuracaoWord = (fd: FormData, calc: Calculos) => wordDownload(buildProcuracaoSpec(fd, calc), fd);
/** Exporta a procuração a partir do texto exibido na UI (preserva refino por IA). */
export function exportarProcuracaoTextoPDF(fd: FormData, calc: Calculos, texto: string): void {
  const { doc, filename } = pdfFromSpec(buildProcuracaoSpec(fd, calc, texto), fd); doc.save(filename);
}
export const exportarProcuracaoTextoWord = (fd: FormData, calc: Calculos, texto: string) =>
  wordDownload(buildProcuracaoSpec(fd, calc, texto), fd);
export const exportarFormularioWord = (fd: FormData, calc: Calculos) => wordDownload(buildFormularioSpec(fd, calc), fd);
export const exportarPendenciasWord = (fd: FormData, calc: Calculos, docs: DocsGerados) => wordDownload(buildPendenciasSpec(fd, calc, docs), fd);
export const exportarMemorialWord = (fd: FormData, calc: Calculos, memorialIA: string) => wordDownload(buildMemorialSpec(fd, calc, memorialIA), fd);
export const exportarListaRateioWord = (fd: FormData, calc: Calculos) => wordDownload(buildListaRateioSpec(fd, calc), fd);
export const exportarInstrumentoJuridicoWord = (fd: FormData, calc: Calculos) => wordDownload(buildInstrumentoSpec(fd, calc), fd);

// ── API pública — Blob PDF (dossiê ZIP) ───────────────────────────────────────
type BlobOut = { blob: Blob; filename: string };
const pdfBlob = (spec: DocSpec, fd: FormData): BlobOut => {
  const { doc, filename } = pdfFromSpec(spec, fd);
  return { blob: doc.output('blob') as Blob, filename };
};
export const getBlobProcuracao = (fd: FormData, calc: Calculos): BlobOut => pdfBlob(buildProcuracaoSpec(fd, calc), fd);
export const getBlobFormulario = (fd: FormData, calc: Calculos): BlobOut => pdfBlob(buildFormularioSpec(fd, calc), fd);
export const getBlobPendencias = (fd: FormData, calc: Calculos, docs: DocsGerados): BlobOut => pdfBlob(buildPendenciasSpec(fd, calc, docs), fd);
export const getBlobMemorial = (fd: FormData, calc: Calculos, memorialIA: string): BlobOut => pdfBlob(buildMemorialSpec(fd, calc, memorialIA), fd);
export const getBlobListaRateio = (fd: FormData, calc: Calculos): BlobOut => pdfBlob(buildListaRateioSpec(fd, calc), fd);
export const getBlobInstrumento = (fd: FormData, calc: Calculos): BlobOut => pdfBlob(buildInstrumentoSpec(fd, calc), fd);

// ── API pública — Blob DOCX (dossiê ZIP) ──────────────────────────────────────
const docxOut = async (spec: DocSpec, fd: FormData): Promise<BlobOut> =>
  ({ blob: await docxBlob(spec), filename: makeFilename(spec.filenameKey, fd, 'docx') });
export const getDocxProcuracao = (fd: FormData, calc: Calculos) => docxOut(buildProcuracaoSpec(fd, calc), fd);
export const getDocxFormulario = (fd: FormData, calc: Calculos) => docxOut(buildFormularioSpec(fd, calc), fd);
export const getDocxPendencias = (fd: FormData, calc: Calculos, docs: DocsGerados) => docxOut(buildPendenciasSpec(fd, calc, docs), fd);
export const getDocxMemorial = (fd: FormData, calc: Calculos, memorialIA: string) => docxOut(buildMemorialSpec(fd, calc, memorialIA), fd);
export const getDocxListaRateio = (fd: FormData, calc: Calculos) => docxOut(buildListaRateioSpec(fd, calc), fd);
export const getDocxInstrumento = (fd: FormData, calc: Calculos) => docxOut(buildInstrumentoSpec(fd, calc), fd);
