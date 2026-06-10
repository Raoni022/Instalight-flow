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
import { makePDF, pdfHeader, pdfFooter, pdfRTWarning, addTextBlock } from './pdf';
import { makeFilename } from './filename';
import { buildMemorialPDFPro } from './memorialPDF';

// ── Helpers internos de build ──────────────────────────────────────────────

/** Gera o texto completo da Procuração Específica. */
export function gerarTextoProcuracao(fd: FormData, calc: Calculos): string {
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

function _buildProcuracaoPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  pdfHeader(doc, fd);
  const W = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCURAÇÃO ESPECÍFICA', W / 2, 35, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Art. 9° — REN ANEEL n° 1.000/2021', W / 2, 42, { align: 'center' });
  addTextBlock(doc, gerarTextoProcuracao(fd, calc), 14, 14, 52, 5.5);
  pdfRTWarning(doc);
  pdfFooter(doc, fd, 1, 1);
  return { doc, filename: makeFilename('procuracao', fd) };
}

function _buildFormularioPDF(fd: FormData, calc: Calculos) {
  const doc = makePDF('p', 'a4');
  const W = doc.internal.pageSize.getWidth();
  pdfHeader(doc, fd);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMULÁRIO DE SOLICITAÇÃO DE ACESSO', W / 2, 35, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Micro/Minigeração Distribuída — CEEE Equatorial', W / 2, 42, { align: 'center' });

  let y = 52;
  const linha = (label: string, valor: string | undefined) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label + ':', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valor || '—', 80, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 2, W - 14, y + 2);
    y += 10;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO TITULAR', 14, y);
  y += 8;
  linha('Nome/Razão Social', fd.nomeCliente);
  linha('CPF/CNPJ', fd.cpfCnpj);
  linha('Endereço da UC', fd.endereco);
  linha('Código UC', fd.codigoUC);
  linha('Nº Conta-Contrato', fd.numContaContrato);
  linha('Nº Fatura', fd.numeroFatura);
  if (fd.numeroMedidor)  linha('No do Medidor', fd.numeroMedidor);
  if (fd.classeUC)       linha('Classe da UC',  fd.classeUC);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO SISTEMA', 14, y);
  y += 8;
  linha('Tipo de Instalação', fd.tipoInstalacao || 'Nova');
  linha('Caracterização (Lei 14.300/2022)', fd.tipoCaracterizacao);
  linha('Tipo de Geração / Enquadramento', calc.enqTotal);
  if (fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0) {
    linha('Potência CC — nova instalação', `${calc.kWp} kWp`);
    linha('Potência CC — existente', `${calc.kWpExistente} kWp`);
    linha('Potência CC — TOTAL', `${calc.kWpTotal} kWp`);
    linha('Potência CA — nova instalação', `${calc.kWtCA} kW`);
    linha('Potência CA — existente', `${calc.kWtCAExistente} kW`);
    linha('Potência CA — TOTAL', `${calc.kWtCATotal} kW`);
  } else {
    linha('Potência CC instalada', `${calc.kWp} kWp`);
    linha('Potência CA nominal', `${calc.kWtCA} kW`);
  }
  linha('Tipo de Ligação', fd.tipoLigacao);
  if (fd.latitude || fd.longitude) linha('Coordenadas GPS', `Lat ${fd.latitude || '—'} / Long ${fd.longitude || '—'}`);
  if (fd.transformador)  linha('Transformador',    fd.transformador);
  if (fd.disjuntorEntrada) linha('DJ Geral Entrada', `${fd.disjuntorEntrada} A`);
  if (fd.ramalEntrada)   linha('Ramal de Entrada', fd.ramalEntrada);
  linha(
    'Módulos FV',
    `${fd.numeroPaineis || '—'}× ${fd.modeloPainel || '—'} ${fd.potenciaUnitariaWp || '—'}Wp`,
  );
  linha('Inversor', fd.modeloInversor || '—');
  linha('Responsável Técnico', fd.nomeResponsavel);
  linha('CRT/CREA', fd.numeroCRT);

  y += 6;
  y += 4;
  doc.setFillColor(255, 243, 205);
  doc.rect(14, y - 5, W - 28, 22, 'F');
  doc.setDrawColor(180, 130, 0);
  doc.rect(14, y - 5, W - 28, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 80, 0);
  doc.text('⚠ ATENÇÃO — DOCUMENTO INTERNO DE APOIO', 16, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'Este pré-formulário é gerado pelo Instalight Flow para conferência interna dos dados.',
    16, y + 6,
  );
  doc.text(
    'O protocolo oficial deve ser realizado pelo PORTAL ELETRÔNICO da CEEE Equatorial (SolicitaNet).',
    16, y + 12,
  );
  doc.setTextColor(30, 30, 30);
  y += 26;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Baseado no modelo CEEE Equatorial vigente. Verifique atualizações no portal da distribuidora.',
    14, y,
  );
  doc.setTextColor(30, 30, 30);
  pdfRTWarning(doc);
  pdfFooter(doc, fd, 1, 1);
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
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  pdfHeader(doc, fd);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE PENDÊNCIAS — PROTOCOLO CEEE', W / 2, 35, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Cliente: ${fd.nomeCliente || '—'} | UC: ${fd.codigoUC || '—'} | Sistema: ${calc.kWp}kWp`,
    W / 2, 43, { align: 'center' },
  );

  let y = 54;
  const sect = (title: string) => {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(120, 184, 58);
    doc.rect(14, y - 5, W - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(title, 16, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += 8;
  };
  const item = (id: string, dname: string, done: boolean, como: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${id} — ${dname}`, 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    if (done) { doc.setTextColor(34, 139, 34); } else { doc.setTextColor(180, 100, 0); }
    doc.text(done ? 'GERADO' : 'PENDENTE', 14, y);
    doc.setTextColor(30, 30, 30);
    if (!done) { doc.setTextColor(80, 80, 80); doc.text(`  Como obter: ${como}`, 14, y + 5); y += 5; }
    y += 9;
    if (y > H - 20) { doc.addPage(); pdfHeader(doc, fd); y = 35; }
  };

  sect('GRUPO A — DOCUMENTOS DO CLIENTE');
  groupA.forEach((g) => item(g.id, g.doc, g.gerado, g.como));
  sect('GRUPO B — DOCUMENTOS TÉCNICOS (obrigatórios CEEE Anexo III REV 06)');
  groupB.forEach((g) => item(g.id, g.doc, g.gerado, g.como));

  // Grupo D — documentos condicionais (aplicáveis conforme o tipo de projeto)
  const groupD = [
    {
      id: 'D1',
      doc: 'Lista de rateio dos créditos de energia',
      gerado: false,
      como: 'Aplicável para Geração Compartilhada, EMUC ou Autoconsumo Remoto. Elaborar conforme Lei 14.300/2022 e REN 1.000/2021.',
    },
    {
      id: 'D2',
      doc: 'Instrumento jurídico de solidariedade',
      gerado: false,
      como: 'Aplicável quando a UC beneficiária é distinta da UC geradora. Elaborar conforme Art. 26 da REN 1.000/2021.',
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
    groupD.forEach((g) => item(g.id, g.doc, false, g.como));
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

  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Dúvidas? Entre em contato com a Instalight.', 14, y);
  pdfRTWarning(doc);
  pdfFooter(doc, fd, 1, 1);
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
