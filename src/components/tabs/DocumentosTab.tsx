/**
 * DocumentosTab.tsx — Aba de documentos do cliente
 *
 * A1 — Procuração Específica (Art. 9° REN 1.000/2021)
 * A2 — Formulário de Solicitação de Acesso CEEE
 */

import React, { useState } from 'react';
import type { FormData, Calculos, Toast, DocsGerados } from '../../types';
import { callAPI } from '../../helpers/api';
import { makePDF, pdfHeader, pdfFooter, pdfRTWarning, addTextBlock } from '../../helpers/pdf';
import { makeFilename } from '../../helpers/filename';
import { gerarTextoProcuracao, exportarFormularioPDFStandalone } from '../../helpers/export';

interface DocumentosTabProps {
  fd: FormData;
  calc: Calculos;
  apiKey: string;
  setToast: (t: Toast) => void;
  docsGerados: DocsGerados;
  setDocsGerados: React.Dispatch<React.SetStateAction<DocsGerados>>;
}

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

export const DocumentosTab: React.FC<DocumentosTabProps> = ({
  fd, calc, apiKey, setToast, setDocsGerados,
}) => {
  const [procuracao, setProcuracao]       = useState('');
  const [refiningProc, setRefiningProc]   = useState(false);
  const [activeDoc, setActiveDoc]         = useState<'procuracao' | 'formulario'>('procuracao');

  const gerarProcuracao = () => {
    setProcuracao(gerarTextoProcuracao(fd, calc));
    setDocsGerados((p) => ({ ...p, procuracao: true }));
  };

  const refinarProcuracao = async () => {
    if (!IS_PROD && !apiKey) {
      setToast({ message: 'Informe a API Key (🔑 no cabeçalho).', type: 'error' });
      return;
    }
    if (!procuracao) {
      setToast({ message: 'Gere a procuração primeiro.', type: 'error' });
      return;
    }
    setRefiningProc(true);
    try {
      const res = await callAPI(
        apiKey,
        'Você é um advogado especialista em direito energético e documentos jurídicos. Refine a linguagem do texto mantendo todas as informações, tornando-o mais formal e juridicamente adequado.',
        [{ role: 'user', content: `Refine a linguagem jurídica desta procuração, mantendo todos os dados e informações:\n\n${procuracao}` }],
        2000,
      );
      setProcuracao(res.content[0].text);
      setToast({ message: 'Linguagem refinada com sucesso!', type: 'success' });
    } catch (e: unknown) {
      setToast({ message: 'Erro ao refinar: ' + (e instanceof Error ? e.message : String(e)), type: 'error' });
    } finally {
      setRefiningProc(false);
    }
  };

  const exportProcuracaoPDF = () => {
    const doc = makePDF('p', 'a4');
    pdfHeader(doc, fd);
    const W = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCURAÇÃO ESPECÍFICA', W / 2, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Art. 9° — REN ANEEL n° 1.000/2021', W / 2, 42, { align: 'center' });
    addTextBlock(doc, procuracao, 14, 14, 52, 5.5);
    pdfRTWarning(doc);
    pdfFooter(doc, fd, 1, 1);
    doc.save(makeFilename('procuracao', fd));
  };

  // Usa a função standalone de export.ts — fonte única de verdade, sempre atualizada.
  // (A função local anterior estava desatualizada: faltavam numContaContrato, tipoInstalacao.)
  const exportFormularioPDF = () => {
    exportarFormularioPDFStandalone(fd, calc);
    setDocsGerados((p) => ({ ...p, formularioCEEE: true }));
  };

  const formCEEEPreview = `DADOS DO TITULAR
Nome/Razão Social: ${fd.nomeCliente || '—'}
CPF/CNPJ: ${fd.cpfCnpj || '—'}
Endereço da UC: ${fd.endereco || '—'}
Código UC: ${fd.codigoUC || '—'}
Nº Fatura: ${fd.numeroFatura || '—'}

DADOS DO SISTEMA
Tipo de Geração: ${calc.enq}
Potência CC instalada: ${calc.kWp} kWp
Potência CA nominal: ${calc.kWtCA} kW
Tipo de Ligação: ${fd.tipoLigacao}
Módulos FV: ${fd.numeroPaineis || '—'}× ${fd.modeloPainel || '—'} ${fd.potenciaUnitariaWp || '—'}Wp
Inversor: ${fd.modeloInversor || '—'} (${fd.quantidadeInversores || 1}× ${fd.potenciaCAkW || '—'}kW)
Configuração: ${fd.paineisSerie || '—'} série × ${fd.stringParalelo || '—'} paralelo
Responsável Técnico: ${fd.nomeResponsavel || '—'}
CRT/CREA: ${fd.numeroCRT || '—'}`;

  const canRefine = IS_PROD || !!apiKey;

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="border-b border-slate-200 bg-white px-3 pt-3">
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setActiveDoc('procuracao')}
            className={`px-3 py-1 text-xs font-semibold rounded-t ${
              activeDoc === 'procuracao'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            A1 — Procuração Específica
          </button>
          <button
            onClick={() => setActiveDoc('formulario')}
            className={`px-3 py-1 text-xs font-semibold rounded-t ${
              activeDoc === 'formulario'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            A2 — Formulário CEEE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* ── Procuração ── */}
        {activeDoc === 'procuracao' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">Procuração Específica</h3>
                <p className="text-xs text-slate-500">Art. 9° da REN ANEEL n° 1.000/2021</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={gerarProcuracao}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600"
                >
                  Gerar / Atualizar
                </button>
                {procuracao && (
                  <>
                    <button
                      onClick={refinarProcuracao}
                      disabled={refiningProc || !canRefine}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50 flex items-center gap-1"
                    >
                      {refiningProc ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span>Refinando…</span>
                        </>
                      ) : (
                        '✨ Refinar com IA'
                      )}
                    </button>
                    <button
                      onClick={exportProcuracaoPDF}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Exportar PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {procuracao ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
                {procuracao}
              </pre>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">📜</div>
                <p className="text-sm">Clique em &quot;Gerar / Atualizar&quot; para criar a procuração</p>
              </div>
            )}
          </div>
        )}

        {/* ── Formulário CEEE ── */}
        {activeDoc === 'formulario' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">Formulário de Solicitação de Acesso CEEE</h3>
                <p className="text-xs text-slate-500">Preenchido automaticamente com os dados do formulário</p>
              </div>
              <button
                onClick={exportFormularioPDF}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600"
              >
                Exportar PDF
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
              ⚠️ Modelo baseado na <strong>NT.00020.EQTL-06 (rev. dez/2025)</strong>.
              {' '}Verifique se há versão mais recente no{' '}
              <a
                href="https://www.ceeeequatorial.com.br/para-voce/energia-solar"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >portal da CEEE Equatorial</a>{' '}
              antes de protocolar.
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
              {formCEEEPreview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
