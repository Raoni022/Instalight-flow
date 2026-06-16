/**
 * export.ts — Funções standalone de exportação de PDF
 *
 * Arquitetura em dois níveis:
 *   _build*PDF()       — builder interno: monta o jsPDF doc + retorna filename (sem salvar)
 *   exportar*PDFStandalone() — wrapper público: chama builder e aciona doc.save() (download)
 *   getBlob*()         — wrapper público: chama builder e retorna Blob (usado pelo ZIP)
 *
 * Isso garante que a lógica de geração vive em um único lugar e pode ser usada
 * tanto para downloads individuais quanto para empacotamento em ZIP.
 */

import type { FormData, Calculos, DocsGerados } from '../types';
import { makePDF, pdfHeader, pdfFooter, pdfRTWarning } from './pdf';
import { makeFilename } from './filename';
import { buildMemorialPDFPro } from './memorialPDF';
import {
  PdfFlow, greenChrome, rtWarningBanner, docTitle,
  sectionBar, capsHeader, paragraph, bullet, kvLine,
  table, checklistItem, setDraw, C,
} from './pdfKit';

// ── Renderizador de texto legal estruturado ──────────────────────────────────
// Converte o texto-fonte (gerarTexto*) em layout profissional via pdfKit,
// preservando o texto como fonte única (também usado no preview da UI).

/** Remove o bloco de título (linhas até a primeira em branco, inclusive). */
function dropTitleBlock(txt: string): string {
  const ls = txt.split('\n');
  let i = 0;
  while (i < ls.length && ls[i].trim() !== '') i++;   // pula linhas do título
  while (i < ls.length && ls[i].trim() === '') i++;    // pula as linhas em branco
  return ls.slice(i).join('\n');
}

/** Linha de assinatura (régua + rótulos abaixo renderizados como corpo). */
function signatureRule(flow: PdfFlow): void {
  flow.ensure(8);
  flow.gap(3);
  setDraw(flow.doc, C.black); flow.doc.setLineWidth(0.3);
  flow.doc.line(flow.m.l, flow.y, flow.m.l + 85, flow.y);
  flow.doc.setLineWidth(0.2);
  flow.gap(4);
}

function renderLegalText(flow: PdfFlow, text: string): void {
  const lines = text.split('\n');
  let tbl: string[][] = [];
  const flush = (): void => { if (tbl.length) { table(flow, tbl); tbl = []; } };

  for (const raw of lines) {
    const t = raw.trim();

    // Tabela markdown
    if (/^\|/.test(t)) {
      const parts = t.split('|').slice(1, -1);
      const isSep = parts.every((p) => /^[-: ]+$/.test(p));
      if (!isSep && parts.some((p) => p.trim().length > 0)) tbl.push(parts.map((p) => p.trim()));
      continue;
    }
    if (tbl.length) flush();

    if (t === '') { flow.gap(2.5); continue; }

    // Régua de assinatura
    if (/^_{5,}/.test(t)) { signatureRule(flow); continue; }

    // Bullet
    if (/^[•●]\s/.test(t)) { bullet(flow, t.replace(/^[•●]\s*/, '')); continue; }

    // Cláusula
    if (/^Cláusula\s/i.test(t)) {
      flow.ensure(8); flow.gap(1);
      flow.doc.setFont('helvetica', 'bold'); flow.doc.setFontSize(9.5);
      flow.doc.setTextColor(C.greenDark[0], C.greenDark[1], C.greenDark[2]);
      const wr = flow.doc.splitTextToSize(t, flow.cw) as string[];
      wr.forEach((l) => { flow.doc.text(l, flow.m.l, flow.y); flow.y += 5.5; });
      flow.doc.setFont('helvetica', 'normal'); flow.doc.setTextColor(C.black[0], C.black[1], C.black[2]);
      continue;
    }

    // Cabeçalho ALL-CAPS curto e standalone
    if (
      t === t.toUpperCase() && t.length > 4 && t.length < 60 &&
      /[A-ZÁÉÍÓÚ]/.test(t) && !t.includes(':') && !/[•|_]/.test(t) &&
      t.split(/\s+/).length <= 6
    ) {
      capsHeader(flow, t); continue;
    }

    // Corpo
    paragraph(flow, t);
  }
  flush();
}

// ── Helpers internos de build ──────────────────────────────────────────────

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

II. Assinar formulários, declarações e demais documentos necessários à aprovação do sistema fotovoltaico de ${calc.kWp}kWp (${np || '—'} módulos de ${fd.potenciaUnitariaWp || '—'}Wp, inversor ${fd.modeloInversor || '—'}) na referida Unidade Consumidora;

III. Retirar protocolos, acompanhar o andamento do processo e praticar todos os atos necessários ao pleno cumprimento do objeto desta procuração.

Esta procuração é outorgada com poderes para um único ato e somente para os fins acima especificados, vedada a substabelecimento.

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

function _buildProcuracaoPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  const flow = new PdfFlow(doc, greenChrome({
    title: 'PROCURAÇÃO ESPECÍFICA',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 40)}  |  UC: ${fd.codigoUC || '—'}`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  }));
  docTitle(flow, 'PROCURAÇÃO ESPECÍFICA', 'Art. 9° — REN ANEEL n° 1.000/2021');
  renderLegalText(flow, dropTitleBlock(gerarTextoProcuracao(fd, calc)));
  flow.finish();
  rtWarningBanner(doc, flow);
  return { doc, filename: makeFilename('procuracao', fd) };
}

function _buildFormularioPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  const flow = new PdfFlow(doc, greenChrome({
    title: 'FORMULÁRIO DE SOLICITAÇÃO DE ACESSO',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 40)}  |  UC: ${fd.codigoUC || '—'}`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  }));
  docTitle(flow, 'FORMULÁRIO DE SOLICITAÇÃO DE ACESSO', 'Micro/Minigeração Distribuída — CEEE Equatorial');

  sectionBar(flow, 'DADOS DO TITULAR');
  kvLine(flow, 'Nome/Razão Social', fd.nomeCliente);
  kvLine(flow, 'CPF/CNPJ', fd.cpfCnpj);
  kvLine(flow, 'Endereço da UC', fd.endereco);
  kvLine(flow, 'Código UC', fd.codigoUC);
  kvLine(flow, 'Nº Conta-Contrato', fd.numContaContrato);
  kvLine(flow, 'Nº Fatura', fd.numeroFatura);
  if (fd.numeroMedidor) kvLine(flow, 'Nº do Medidor', fd.numeroMedidor);
  if (fd.classeUC) kvLine(flow, 'Classe da UC', fd.classeUC);

  sectionBar(flow, 'DADOS DO SISTEMA');
  kvLine(flow, 'Tipo de Instalação', fd.tipoInstalacao || 'Nova');
  kvLine(flow, 'Caracterização (Lei 14.300/2022)', fd.tipoCaracterizacao);
  kvLine(flow, 'Tipo de Geração / Enquadramento', calc.enqTotal);
  if (fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0) {
    kvLine(flow, 'Potência CC — nova instalação', `${calc.kWp} kWp`);
    kvLine(flow, 'Potência CC — existente', `${calc.kWpExistente} kWp`);
    kvLine(flow, 'Potência CC — TOTAL', `${calc.kWpTotal} kWp`);
    kvLine(flow, 'Potência CA — nova instalação', `${calc.kWtCA} kW`);
    kvLine(flow, 'Potência CA — existente', `${calc.kWtCAExistente} kW`);
    kvLine(flow, 'Potência CA — TOTAL', `${calc.kWtCATotal} kW`);
  } else {
    kvLine(flow, 'Potência CC instalada', `${calc.kWp} kWp`);
    kvLine(flow, 'Potência CA nominal', `${calc.kWtCA} kW`);
  }
  kvLine(flow, 'Tipo de Ligação', fd.tipoLigacao);
  if (fd.latitude || fd.longitude) kvLine(flow, 'Coordenadas GPS', `Lat ${fd.latitude || '—'} / Long ${fd.longitude || '—'}`);
  if (fd.transformador) kvLine(flow, 'Transformador', fd.transformador);
  if (fd.disjuntorEntrada) kvLine(flow, 'DJ Geral Entrada', `${fd.disjuntorEntrada} A`);
  if (fd.ramalEntrada) kvLine(flow, 'Ramal de Entrada', fd.ramalEntrada);
  kvLine(flow, 'Módulos FV', `${fd.numeroPaineis || '—'}× ${fd.modeloPainel || '—'} ${fd.potenciaUnitariaWp || '—'}Wp`);
  kvLine(flow, 'Inversor', fd.modeloInversor || '—');
  kvLine(flow, 'Responsável Técnico', fd.nomeResponsavel);
  kvLine(flow, 'CRT/CREA', fd.numeroCRT);

  // Aviso de documento de apoio
  flow.ensure(26);
  flow.gap(4);
  const W = flow.W;
  doc.setFillColor(255, 243, 205);
  doc.rect(flow.m.l, flow.y - 5, flow.cw, 22, 'F');
  doc.setDrawColor(180, 130, 0);
  doc.rect(flow.m.l, flow.y - 5, flow.cw, 22);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setTextColor(120, 80, 0);
  doc.text('ATENÇÃO — DOCUMENTO INTERNO DE APOIO', flow.m.l + 2, flow.y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('Este pré-formulário é gerado pelo Instalight Flow para conferência interna dos dados.', flow.m.l + 2, flow.y + 6);
  doc.text('O protocolo oficial deve ser feito pelo PORTAL ELETRÔNICO da CEEE Equatorial (SolicitaNet).', flow.m.l + 2, flow.y + 12);
  doc.setTextColor(30, 30, 30);
  void W;

  flow.finish();
  rtWarningBanner(doc, flow);
  return { doc, filename: makeFilename('formulario_ceee', fd) };
}

function _buildPendenciasPDF(
  fd: FormData,
  calc: Calculos,
  docsGerados: DocsGerados,
) {
  const groupA = [
    {
      id: 'A1', doc: 'Procuração Específica', gerado: docsGerados.procuracao,
      como: 'Gere na aba "Documentos" e peça ao cliente assinar com firma reconhecida',
    },
    {
      id: 'A2', doc: 'Formulário de Acesso CEEE', gerado: docsGerados.formularioCEEE,
      como: 'Gere na aba "Documentos" e leve ao protocolo CEEE',
    },
    {
      id: 'A3', doc: 'Documentos pessoais (RG+CPF / CNPJ+Contrato Social)', gerado: false,
      como: fd.tipoPessoa === 'fisica'
        ? 'Solicitar cópia do RG e CPF do titular'
        : 'Solicitar CNPJ, Contrato Social e documento do representante',
    },
    {
      id: 'A4', doc: 'Fatura de energia recente', gerado: false,
      como: 'Solicitar fatura dos últimos 3 meses',
    },
  ];
  const groupB = [
    { id: 'B1', doc: 'Diagrama Unifilar',            gerado: true,                   como: 'Disponível na aba "Diagramas" — exportar SVG ou PDF' },
    { id: 'B2', doc: 'Diagrama de Blocos (Bi/Trifilar)', gerado: true,              como: 'Incluído na mesma prancha da aba "Diagramas"' },
    { id: 'B3', doc: 'Planta de Situação / Locação', gerado: false,
      como: fd.endereco
        ? `Abrir maps.google.com/?q=${encodeURIComponent(fd.endereco)} — capturar print com escala e norte indicados`
        : 'Preencha o endereço da UC para gerar o link do Google Maps' },
    { id: 'B4', doc: 'Memorial Técnico-Descritivo',  gerado: docsGerados.memorial,   como: 'Gere na aba "Memorial" e valide com o RT' },
    { id: 'B5', doc: 'TRT/ART — Responsabilidade Técnica (projeto e execução)', gerado: false, como: 'RT deve registrar a ART/TRT no sistema do CREA/CFT competente' },
    { id: 'B6', doc: 'Datasheets dos equipamentos (módulos e inversor)', gerado: false, como: `Módulo: ${fd.modeloPainel || '—'} | Inversor: ${fd.modeloInversor || '—'} — baixar do site do fabricante` },
    { id: 'B7', doc: 'Relatório de ensaio dos conversores de potência (em PT)', gerado: false,
      como: `Relatório em língua portuguesa atestando conformidade do inversor ${fd.modeloInversor || '—'} para a tensão nominal de conexão com a rede (${fd.tensaoSaidaCA || '220'} V). Obter junto ao fabricante ou importador.` },
    { id: 'B8', doc: 'Dados de registro (formulário CEEE)', gerado: docsGerados.formularioCEEE, como: 'Gere na aba "Documentos" — formulário de solicitação de orçamento de conexão (REH 3.171/2023)' },
  ];

  const doc = makePDF('p', 'a4');
  const flow = new PdfFlow(doc, greenChrome({
    title: 'RELATÓRIO DE PENDÊNCIAS — PROTOCOLO CEEE',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 30)} | UC: ${fd.codigoUC || '—'} | ${calc.kWp} kWp`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  }));
  docTitle(flow, 'RELATÓRIO DE PENDÊNCIAS', 'Protocolo CEEE — Anexo III NT.00020.EQTL-06 REV 06');

  const sect = (title: string) => sectionBar(flow, title);
  const item = (id: string, dname: string, done: boolean, como: string) =>
    checklistItem(flow, id, dname, done, como);

  sect('GRUPO A — DOCUMENTOS DO CLIENTE');
  groupA.forEach((g) => item(g.id, g.doc, g.gerado, g.como));
  sect('GRUPO B — DOCUMENTOS TÉCNICOS (obrigatórios CEEE Anexo III REV 06)');
  groupB.forEach((g) => item(g.id, g.doc, g.gerado, g.como));

  // Grupo D — documentos condicionais (aplicáveis conforme o tipo de projeto)
  const groupD = [
    {
      id: 'D1',
      doc: 'Lista de rateio dos créditos de energia',
      gerado: docsGerados.listaRateio,
      como: 'Gere na aba "Documentos" → D1. Aplicável para Geração Compartilhada, EMUC ou Autoconsumo Remoto. Preencha os dados das UCs beneficiárias.',
    },
    {
      id: 'D2',
      doc: 'Instrumento jurídico de solidariedade',
      gerado: docsGerados.instrumentoJuridico,
      como: 'Gere na aba "Documentos" → D2. Firmas devem ser reconhecidas em cartório. Verificar com a CEEE se instrumento particular é aceito.',
    },
    {
      id: 'D3',
      doc: 'Reconhecimento pela ANEEL (cogeração)',
      gerado: false,
      como: 'Aplicável somente para projetos de cogeração qualificada. Apresentar documento emitido pela ANEEL comprovando o reconhecimento.',
    },
  ];
  if (groupD.some(g => !g.gerado)) {
    sect('GRUPO D — DOCUMENTOS CONDICIONAIS (verificar aplicabilidade)');
    groupD.forEach((g) => item(g.id, g.doc, g.gerado, g.como));
  }

  // Grupo C — somente para projetos de Ampliação
  if (fd.tipoInstalacao === 'Ampliação') {
    const groupC = [
      {
        id: 'C1',
        doc: 'Projeto anterior aprovado / homologado',
        gerado: false,
        como: fd.parecerAcessoAnterior
          ? `Protocolo/Parecer informado: ${fd.parecerAcessoAnterior}`
          : 'Localizar o projeto aprovado na homologação anterior junto à CEEE',
      },
      {
        id: 'C2',
        doc: 'Parecer de acesso anterior (CEEE)',
        gerado: !!fd.parecerAcessoAnterior,
        como: fd.parecerAcessoAnterior
          ? `Nº ${fd.parecerAcessoAnterior} — verificar validade e escopo`
          : 'Solicitar cópia do parecer de acesso original à CEEE ou ao instalador anterior',
      },
      {
        id: 'C3',
        doc: 'ART/TRT da instalação anterior',
        gerado: !!fd.artTrtAnterior,
        como: fd.artTrtAnterior
          ? `ART/TRT informada: ${fd.artTrtAnterior}`
          : 'Solicitar ao RT anterior ou ao cliente a ART/TRT original',
      },
      {
        id: 'C4',
        doc: 'Fotos do padrão de entrada atual',
        gerado: false,
        como: 'Fotografar caixa de medição, disjuntor geral, ramal e número do poste',
      },
      {
        id: 'C5',
        doc: 'Fatura atual da UC',
        gerado: false,
        como: 'Confirmar que UC já está com medidor bidirecional instalado pela CEEE',
      },
      {
        id: 'C6',
        doc: 'Datasheet dos equipamentos existentes',
        gerado: false,
        como: `Módulos: ${fd.modeloPainelExistente || '—'} | Inversor: ${fd.modeloInversorExistente || '—'}`,
      },
      {
        id: 'C7',
        doc: 'Datasheet dos equipamentos novos',
        gerado: false,
        como: `Módulos: ${fd.modeloPainel || '—'} | Inversor: ${fd.modeloInversor || '—'}`,
      },
      {
        id: 'C8',
        doc: 'ART/TRT específica da ampliação',
        gerado: !!fd.numART,
        como: fd.numART ? `ART/TRT informada: ${fd.numART}` : 'RT deve registrar nova ART/TRT para a ampliação',
      },
      {
        id: 'C9',
        doc: 'Confirmação do padrão de entrada',
        gerado: fd.situacaoPadrao !== 'A definir pelo RT',
        como: `Situação declarada: ${fd.situacaoPadrao} — confirmar compatibilidade com a nova potência total`,
      },
    ];
    sect('GRUPO C — DOCUMENTOS ESPECÍFICOS DE AMPLIAÇÃO');
    groupC.forEach((g) => item(g.id, g.doc, g.gerado, g.como));
  }

  flow.gap(4);
  paragraph(flow, 'Dúvidas? Entre em contato com a Instalight.', 8);
  flow.finish();
  rtWarningBanner(doc, flow);
  return { doc, filename: makeFilename('pendencias', fd) };
}

function _buildMemorialPDF(
  fd: FormData,
  calc: Calculos,
  memorialIA: string,
) {
  const doc = makePDF('p', 'a4');
  if (memorialIA) {
    buildMemorialPDFPro(doc, fd, calc, memorialIA);
  } else {
    // Fallback: placeholder page
    const W = doc.internal.pageSize.getWidth();
    pdfHeader(doc, fd);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Memorial não gerado — acesse a aba Memorial para gerá-lo.', W / 2, 60, { align: 'center' });
    doc.setTextColor(30, 30, 30);
    pdfRTWarning(doc);
    pdfFooter(doc, fd, 1, 1);
  }
  return { doc, filename: makeFilename('memorial', fd) };
}

// ── API pública — download direto ─────────────────────────────────────────

/** Exporta a Procuração como PDF (download imediato). */
export function exportarProcuracaoPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = _buildProcuracaoPDF(fd, calc);
  doc.save(filename);
}

/** Exporta o Formulário de Acesso CEEE como PDF (download imediato). */
export function exportarFormularioPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = _buildFormularioPDF(fd, calc);
  doc.save(filename);
}

/** Exporta o Relatório de Pendências como PDF (download imediato). */
export function exportarPendenciasPDFStandalone(
  fd: FormData, calc: Calculos, docsGerados: DocsGerados,
): void {
  const { doc, filename } = _buildPendenciasPDF(fd, calc, docsGerados);
  doc.save(filename);
}

/** Exporta o Memorial Técnico como PDF (download imediato). */
export function exportarMemorialPDFStandalone(
  fd: FormData, calc: Calculos, memorialIA: string,
): void {
  const { doc, filename } = _buildMemorialPDF(fd, calc, memorialIA);
  doc.save(filename);
}

// ── D1: Lista de Rateio dos Créditos ─────────────────────────────────────

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

| Nº | UC Beneficiária | Titular da UC Beneficiária         | CPF/CNPJ         | % Créditos | kWh/mês estimado |
|----|-----------------|-------------------------------------|-----------------|------------|------------------|
| 01 | [INSERIR UC]    | [INSERIR NOME DO TITULAR]          | [INSERIR]        | ___,__ %   | _______ kWh      |
| 02 | [INSERIR UC]    | [INSERIR NOME DO TITULAR]          | [INSERIR]        | ___,__ %   | _______ kWh      |
| 03 | [INSERIR UC]    | [INSERIR NOME DO TITULAR]          | [INSERIR]        | ___,__ %   | _______ kWh      |
| 04 | [INSERIR UC]    | [INSERIR NOME DO TITULAR]          | [INSERIR]        | ___,__ %   | _______ kWh      |
|    |                 |                         TOTAL (%)   |                 | 100,00 %   |                  |

Observações:
• Os percentuais de rateio são definidos pelo titular da UC geradora e podem ser alterados
  mediante nova solicitação à distribuidora (CEEE Equatorial).
• As UCs beneficiárias devem estar na mesma área de concessão da UC geradora.
• Para Autoconsumo Remoto: as UCs devem pertencer ao mesmo titular (CPF/CNPJ).
• Para Geração Compartilhada / EMUC: as UCs podem ter titulares distintos.
• O rateio é realizado mensalmente sobre os créditos gerados, conforme Art. 27 da Lei 14.300/2022.

BASE LEGAL
• Lei Federal n° 14.300/2022 — Marco Legal da Micro e Minigeração Distribuída
• ANEEL REN n° 1.000/2021 — Módulo 3 — Seção 3.8
• NT.00020.EQTL-06 (CEEE Equatorial) — Revisão 12/2025

DECLARAÇÃO DO TITULAR
O(a) abaixo assinado(a), titular da unidade geradora identificada acima, declara que os percentuais
de rateio indicados neste documento refletem sua vontade e estão em conformidade com a legislação
vigente.

Assinatura: _______________________________
${fd.nomeCliente || '[NOME DO TITULAR]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}: ${fd.cpfCnpj || '[CPF/CNPJ]'}

${fd.cidade || 'Porto Alegre'}, ${hoje}.

NOTA: Este documento deve ser apresentado junto ao Formulário de Solicitação de Orçamento
de Conexão à CEEE Equatorial. O reconhecimento de firma pode ser exigido pela distribuidora.`;
}

function _buildListaRateioPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  const flow = new PdfFlow(doc, greenChrome({
    title: 'LISTA DE RATEIO DOS CRÉDITOS',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 40)}  |  UC: ${fd.codigoUC || '—'}`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  }));
  docTitle(flow, 'LISTA DE RATEIO DOS CRÉDITOS DE ENERGIA', 'Lei Federal n° 14.300/2022 — Art. 2°, IX e Art. 27  |  CEEE Equatorial');

  // Banner de aplicabilidade
  const caract = fd.tipoCaracterizacao || 'Geração Compartilhada';
  const aplicavel = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC'].includes(caract);
  if (!aplicavel) {
    flow.ensure(16);
    doc.setFillColor(255, 243, 205);
    doc.rect(flow.m.l, flow.y - 4, flow.cw, 13, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(120, 80, 0);
    doc.text(`ATENÇÃO: Projeto caracterizado como "${caract}"`, flow.m.l + 2, flow.y + 1);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Lista de rateio aplicável a Autoconsumo Remoto, Geração Compartilhada e EMUC.', flow.m.l + 2, flow.y + 6);
    doc.setTextColor(30, 30, 30);
    flow.gap(14);
  }

  renderLegalText(flow, dropTitleBlock(gerarTextoListaRateio(fd, calc)));
  flow.finish();
  rtWarningBanner(doc, flow);
  return { doc, filename: makeFilename('lista_rateio', fd) };
}

// ── D2: Instrumento Jurídico de Solidariedade ─────────────────────────────

export function gerarTextoInstrumentoJuridico(fd: FormData, calc: Calculos): string {
  const hoje = fd.dataproject || new Date().toLocaleDateString('pt-BR');
  const caract = fd.tipoCaracterizacao || 'Geração Compartilhada';

  const cedente = fd.tipoPessoa === 'fisica'
    ? `${fd.nomeCliente || '[NOME]'}, CPF nº ${fd.cpfCnpj || '[CPF]'}, residente em ${fd.endereco || '[ENDEREÇO]'}`
    : `${fd.nomeCliente || '[NOME]'}, CNPJ nº ${fd.cpfCnpj || '[CNPJ]'}, com sede em ${fd.endereco || '[ENDEREÇO]'}`;

  return `INSTRUMENTO PARTICULAR DE SOLIDARIEDADE E CESSÃO DE CRÉDITOS
DE ENERGIA ELÉTRICA — GERAÇÃO DISTRIBUÍDA

${fd.cidade || 'Porto Alegre'}, ${hoje}.

BASE LEGAL: Lei Federal n° 14.300/2022 (Art. 27) e ANEEL REN n° 1.000/2021

PARTES

CEDENTE (Titular da UC Geradora):
  ${cedente}
  UC Geradora nº: ${fd.codigoUC || '[INSERIR UC GERADORA]'}

CESSIONÁRIO(S) (Titular(es) das UC(s) Beneficiária(s)):
  Nome/Razão Social: [INSERIR NOME DO CESSIONÁRIO 1]
  CPF/CNPJ:          [INSERIR CPF/CNPJ]
  UC Beneficiária:   [INSERIR NÚMERO DA UC]

  Nome/Razão Social: [INSERIR NOME DO CESSIONÁRIO 2]  (se aplicável)
  CPF/CNPJ:          [INSERIR CPF/CNPJ]
  UC Beneficiária:   [INSERIR NÚMERO DA UC]

OBJETO

O presente instrumento tem por objeto a formalização da solidariedade entre as partes
acima identificadas para fins de participação no sistema de ${caract.toLowerCase()} nos
termos da Lei Federal n° 14.300/2022 e da Resolução Normativa ANEEL n° 1.000/2021.

O CEDENTE, titular do sistema de geração fotovoltaica de ${calc.kWp} kWp instalado na
UC nº ${fd.codigoUC || '[UC GERADORA]'}, na área de concessão da CEEE Equatorial (RS),
CEDE E TRANSFERE aos CESSIONÁRIOS os créditos de energia elétrica gerados pelo sistema
fotovoltaico, nas proporções definidas na Lista de Rateio em vigor.

CLÁUSULAS

Cláusula 1ª — SOLIDARIEDADE
As partes são solidariamente responsáveis pelas obrigações perante a CEEE Equatorial
decorrentes do sistema de ${caract.toLowerCase()}, nos termos do Art. 27, §2° da
Lei Federal n° 14.300/2022.

Cláusula 2ª — PROPORCIONALIDADE DOS CRÉDITOS
A distribuição dos créditos de energia elétrica entre as UCs participantes será realizada
conforme a Lista de Rateio apresentada à CEEE Equatorial, a qual integra este instrumento
como Anexo I.

Cláusula 3ª — VIGÊNCIA
Este instrumento tem vigência por prazo indeterminado, podendo ser rescindido por qualquer
das partes mediante comunicação formal à distribuidora com antecedência mínima de 30 dias.

Cláusula 4ª — ALTERAÇÕES
Qualquer alteração nos percentuais de rateio ou nas UCs participantes deve ser comunicada
à CEEE Equatorial mediante nova solicitação formal, acompanhada de Lista de Rateio atualizada.

Cláusula 5ª — FORO
As partes elegem o foro da comarca de ${fd.cidade || 'Porto Alegre'} — RS para dirimir
eventuais litígios decorrentes deste instrumento.

ASSINATURAS

CEDENTE:
Assinatura: _______________________________
Nome:       ${fd.nomeCliente || '[NOME]'}
${fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}:  ${fd.cpfCnpj || '[CPF/CNPJ]'}
Data:       ___/___/______

CESSIONÁRIO 1:
Assinatura: _______________________________
Nome:       [INSERIR NOME]
CPF/CNPJ:   [INSERIR]
Data:       ___/___/______

CESSIONÁRIO 2 (se aplicável):
Assinatura: _______________________________
Nome:       [INSERIR NOME]
CPF/CNPJ:   [INSERIR]
Data:       ___/___/______

TESTEMUNHAS:
1. Nome: _______________________________ CPF: _______________ Assinatura: _______________
2. Nome: _______________________________ CPF: _______________ Assinatura: _______________

NOTA: Este instrumento deve ter as firmas reconhecidas em cartório conforme exigência
da CEEE Equatorial. Verificar se a distribuidora aceita instrumento particular ou se exige
escritura pública conforme o valor e as partes envolvidas.`;
}

function _buildInstrumentoJuridicoPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  const flow = new PdfFlow(doc, greenChrome({
    title: 'INSTRUMENTO JURÍDICO DE SOLIDARIEDADE',
    subtitle: `${(fd.nomeCliente || '—').substring(0, 40)}  |  UC: ${fd.codigoUC || '—'}`,
    company: fd.nomeEmpresa || 'Instalight Energia Solar',
  }));
  docTitle(flow, 'INSTRUMENTO JURÍDICO DE SOLIDARIEDADE', 'Cessão de Créditos de GD — Lei Federal n° 14.300/2022 (Art. 27)');
  renderLegalText(flow, dropTitleBlock(gerarTextoInstrumentoJuridico(fd, calc)));
  flow.finish();
  rtWarningBanner(doc, flow);
  return { doc, filename: makeFilename('instrumento_juridico', fd) };
}

// ── API pública — retorno de Blob (para dossiê ZIP) ──────────────────────

/** Retorna a Procuração como Blob para uso no dossiê ZIP. */
export function getBlobProcuracao(fd: FormData, calc: Calculos): { blob: Blob; filename: string } {
  const { doc, filename } = _buildProcuracaoPDF(fd, calc);
  return { blob: doc.output('blob') as Blob, filename };
}

/** Retorna o Formulário CEEE como Blob para uso no dossiê ZIP. */
export function getBlobFormulario(fd: FormData, calc: Calculos): { blob: Blob; filename: string } {
  const { doc, filename } = _buildFormularioPDF(fd, calc);
  return { blob: doc.output('blob') as Blob, filename };
}

/** Retorna o Relatório de Pendências como Blob para uso no dossiê ZIP. */
export function getBlobPendencias(
  fd: FormData, calc: Calculos, docsGerados: DocsGerados,
): { blob: Blob; filename: string } {
  const { doc, filename } = _buildPendenciasPDF(fd, calc, docsGerados);
  return { blob: doc.output('blob') as Blob, filename };
}

/** Retorna o Memorial Técnico como Blob para uso no dossiê ZIP. */
export function getBlobMemorial(
  fd: FormData, calc: Calculos, memorialIA: string,
): { blob: Blob; filename: string } {
  const { doc, filename } = _buildMemorialPDF(fd, calc, memorialIA);
  return { blob: doc.output('blob') as Blob, filename };
}

/** Exporta a Lista de Rateio como PDF (download imediato). */
export function exportarListaRateioPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = _buildListaRateioPDF(fd, calc);
  doc.save(filename);
}

/** Exporta o Instrumento Jurídico como PDF (download imediato). */
export function exportarInstrumentoJuridicoPDFStandalone(fd: FormData, calc: Calculos): void {
  const { doc, filename } = _buildInstrumentoJuridicoPDF(fd, calc);
  doc.save(filename);
}

/** Retorna a Lista de Rateio como Blob para uso no dossiê ZIP. */
export function getBlobListaRateio(fd: FormData, calc: Calculos): { blob: Blob; filename: string } {
  const { doc, filename } = _buildListaRateioPDF(fd, calc);
  return { blob: doc.output('blob') as Blob, filename };
}

/** Retorna o Instrumento Jurídico como Blob para uso no dossiê ZIP. */
export function getBlobInstrumento(fd: FormData, calc: Calculos): { blob: Blob; filename: string } {
  const { doc, filename } = _buildInstrumentoJuridicoPDF(fd, calc);
  return { blob: doc.output('blob') as Blob, filename };
}
