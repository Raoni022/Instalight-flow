/**
 * DocumentosTab.tsx — Aba de documentos do cliente
 *
 * A1 — Procuração Específica (Art. 9° REN 1.000/2021)
 * A2 — Formulário de Solicitação de Acesso CEEE
 */

import React, { useState } from 'react';
import type { FormData, Calculos, Toast, DocsGerados } from '../../types';
import { callAPI } from '../../helpers/api';
import {
  gerarTextoProcuracao,
  exportarProcuracaoTextoPDF,
  exportarProcuracaoTextoWord,
  exportarFormularioPDFStandalone,
  exportarFormularioWord,
  gerarTextoListaRateio,
  exportarListaRateioPDFStandalone,
  exportarListaRateioWord,
  gerarTextoInstrumentoJuridico,
  exportarInstrumentoJuridicoPDFStandalone,
  exportarInstrumentoJuridicoWord,
} from '../../helpers/export';

interface DocumentosTabProps {
  fd: FormData;
  calc: Calculos;
  apiKey: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onUpdateBeneficiarios: (lista: FormData['beneficiarios']) => void;
  setToast: (t: Toast) => void;
  docsGerados: DocsGerados;
  setDocsGerados: React.Dispatch<React.SetStateAction<DocsGerados>>;
}

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

export const DocumentosTab: React.FC<DocumentosTabProps> = ({
  fd, calc, apiKey, onChange, onUpdateBeneficiarios, setToast, setDocsGerados,
}) => {
  const [procuracao, setProcuracao]       = useState('');
  const [refiningProc, setRefiningProc]   = useState(false);
  const [activeDoc, setActiveDoc]         = useState<'procuracao' | 'formulario' | 'rateio' | 'juridico'>('procuracao');

  const precisaRateio = ['Geração Compartilhada', 'Autoconsumo Remoto', 'EMUC'].includes(fd.tipoCaracterizacao);

  // ── Edição das UCs beneficiárias (rateio D1/D2) ──
  const bens = fd.beneficiarios ?? [];
  const addBen = () => onUpdateBeneficiarios([...bens, { uc: '', titular: '', cpfCnpj: '', percent: '' }]);
  const updBen = (i: number, field: 'uc' | 'titular' | 'cpfCnpj' | 'percent', val: string) =>
    onUpdateBeneficiarios(bens.map((b, idx) => (idx === i ? { ...b, [field]: val } : b)));
  const delBen = (i: number) => onUpdateBeneficiarios(bens.filter((_, idx) => idx !== i));
  const somaPct = bens.reduce((s, b) => s + (parseFloat((b.percent || '').replace(',', '.')) || 0), 0);
  const geracaoMensal = Math.round(calc.geracaoAnual / 12);

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

  const exportProcuracaoPDF = () => exportarProcuracaoTextoPDF(fd, calc, procuracao);
  const exportProcuracaoWord = () => exportarProcuracaoTextoWord(fd, calc, procuracao);

  // Usa a função standalone de export.ts — fonte única de verdade, sempre atualizada.
  // (A função local anterior estava desatualizada: faltavam numContaContrato, tipoInstalacao.)
  const exportFormularioPDF = () => {
    exportarFormularioPDFStandalone(fd, calc);
    setDocsGerados((p) => ({ ...p, formularioCEEE: true }));
  };

  // Preview exibido na UI — deve espelhar exatamente o PDF exportado por exportarFormularioPDFStandalone
  const formCEEEPreview = `DADOS DO TITULAR
Nome/Razão Social: ${fd.nomeCliente || '—'}
CPF/CNPJ: ${fd.cpfCnpj || '—'}
Endereço da UC: ${fd.endereco || '—'}
Código UC: ${fd.codigoUC || '—'}
Nº Conta-Contrato: ${fd.numContaContrato || '—'}
Nº Fatura: ${fd.numeroFatura || '—'}
${fd.numPoste ? `Nº do Poste: ${fd.numPoste}` : ''}
${fd.latitude || fd.longitude ? `Coordenadas GPS: Lat ${fd.latitude || '—'} / Long ${fd.longitude || '—'}` : ''}

DADOS DO SISTEMA
Tipo de Instalação: ${fd.tipoInstalacao || 'Nova'}
Caracterização (Lei 14.300/2022): ${fd.tipoCaracterizacao}
Tipo de Geração / Enquadramento: ${calc.enqTotal}
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
        <div className="flex flex-wrap gap-2 mb-3">
          {(['procuracao', 'formulario'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setActiveDoc(id)}
              className={`px-3 py-1 text-xs font-semibold rounded-t ${
                activeDoc === id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {id === 'procuracao' ? 'A1 — Procuração Específica' : 'A2 — Formulário CEEE'}
            </button>
          ))}
          <button
            onClick={() => setActiveDoc('rateio')}
            className={`px-3 py-1 text-xs font-semibold rounded-t ${
              activeDoc === 'rateio'
                ? 'bg-brand-500 text-white'
                : precisaRateio
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            title={precisaRateio ? 'Necessário para este tipo de projeto' : 'Aplicável para Geração Compartilhada, Autoconsumo Remoto e EMUC'}
          >
            D1 — Lista de Rateio {precisaRateio ? '⚠️' : ''}
          </button>
          <button
            onClick={() => setActiveDoc('juridico')}
            className={`px-3 py-1 text-xs font-semibold rounded-t ${
              activeDoc === 'juridico'
                ? 'bg-brand-500 text-white'
                : precisaRateio
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            title={precisaRateio ? 'Necessário para este tipo de projeto' : 'Aplicável para Geração Compartilhada, Autoconsumo Remoto e EMUC'}
          >
            D2 — Instrumento Jurídico {precisaRateio ? '⚠️' : ''}
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
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600"
                >
                  Gerar / Atualizar
                </button>
                {procuracao && (
                  <>
                    <button
                      onClick={refinarProcuracao}
                      disabled={refiningProc || !canRefine}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-brand-300 text-brand-600 hover:bg-brand-50 disabled:opacity-50 flex items-center gap-1"
                    >
                      {refiningProc ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
                    <button
                      onClick={exportProcuracaoWord}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Exportar Word
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Modalidade da procuração */}
            <div className="flex flex-wrap items-center gap-3 mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="text-xs font-semibold text-slate-600">Outorgar para:</label>
              <select
                name="tipoProcuracao"
                value={fd.tipoProcuracao}
                onChange={(e) => { onChange(e); if (procuracao) setProcuracao(gerarTextoProcuracao({ ...fd, tipoProcuracao: e.target.value as FormData['tipoProcuracao'] }, calc)); }}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
              >
                <option value="Empresa">Empresa instaladora ({fd.nomeEmpresa || 'Instalight'})</option>
                <option value="Responsável Técnico">Responsável Técnico ({fd.nomeResponsavel || 'engenheiro/técnico'})</option>
              </select>
              {fd.tipoProcuracao === 'Responsável Técnico' && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  Prazo:
                  <input
                    name="prazoProcuracaoDias"
                    value={fd.prazoProcuracaoDias}
                    onChange={(e) => { onChange(e); if (procuracao) setProcuracao(gerarTextoProcuracao({ ...fd, prazoProcuracaoDias: e.target.value }, calc)); }}
                    className="w-14 text-xs border border-slate-300 rounded px-1 py-1 bg-white"
                  />
                  dias
                </span>
              )}
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

        {/* ── Lista de Rateio ── */}
        {activeDoc === 'rateio' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">D1 — Lista de Rateio dos Créditos de Energia</h3>
                <p className="text-xs text-slate-500">Lei Federal n° 14.300/2022, Art. 27</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { exportarListaRateioPDFStandalone(fd, calc); setDocsGerados((p) => ({ ...p, listaRateio: true })); }}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => { exportarListaRateioWord(fd, calc); setDocsGerados((p) => ({ ...p, listaRateio: true })); }}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Word
                </button>
              </div>
            </div>
            {!precisaRateio ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3 text-xs text-slate-500">
                ℹ️ Projeto atual: <strong>{fd.tipoCaracterizacao}</strong> — Lista de Rateio <strong>não é obrigatória</strong> para este tipo.
                É exigida para: Geração Compartilhada, Autoconsumo Remoto e EMUC.
                Altere o Tipo de Caracterização no formulário (seção Cliente) se necessário.
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
                ⚠️ Projeto <strong>{fd.tipoCaracterizacao}</strong> — documento obrigatório.
                Preencha os campos <strong>[INSERIR...]</strong> com os dados das UCs beneficiárias. Percentuais devem somar 100%.
              </div>
            )}

            {/* Editor de UCs beneficiárias */}
            <div className="border border-slate-200 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700">UCs Beneficiárias</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  Math.abs(somaPct - 100) < 0.01
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  Soma: {somaPct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                </span>
              </div>

              {bens.length === 0 && (
                <p className="text-xs text-slate-400 mb-2">Nenhuma UC beneficiária. Adicione abaixo — os dados entram no D1 e no D2 automaticamente.</p>
              )}

              {bens.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  <div className="grid grid-cols-[1.4fr_2fr_1.6fr_0.8fr_1fr_auto] gap-1.5 text-[10px] font-semibold text-slate-400 uppercase px-1">
                    <span>UC</span><span>Titular</span><span>CPF/CNPJ</span><span>%</span><span>kWh/mês</span><span></span>
                  </div>
                  {bens.map((b, i) => {
                    const pct = parseFloat((b.percent || '').replace(',', '.')) || 0;
                    const kwh = geracaoMensal > 0 && pct > 0 ? Math.round(geracaoMensal * pct / 100).toLocaleString('pt-BR') : '—';
                    const inp = 'border border-slate-200 rounded px-1.5 py-1 text-xs w-full';
                    return (
                      <div key={i} className="grid grid-cols-[1.4fr_2fr_1.6fr_0.8fr_1fr_auto] gap-1.5 items-center">
                        <input className={inp} value={b.uc} placeholder="UC" onChange={(e) => updBen(i, 'uc', e.target.value)} />
                        <input className={inp} value={b.titular} placeholder="Titular" onChange={(e) => updBen(i, 'titular', e.target.value)} />
                        <input className={inp} value={b.cpfCnpj} placeholder="CPF/CNPJ" onChange={(e) => updBen(i, 'cpfCnpj', e.target.value)} />
                        <input className={inp} value={b.percent} placeholder="%" onChange={(e) => updBen(i, 'percent', e.target.value)} />
                        <span className="text-xs text-slate-500">{kwh}</span>
                        <button onClick={() => delBen(i)} className="text-slate-400 hover:text-red-500 text-sm px-1" title="Remover">×</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={addBen} className="text-xs font-medium text-brand-600 hover:underline">+ Adicionar UC beneficiária</button>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
              {gerarTextoListaRateio(fd, calc)}
            </pre>
          </div>
        )}

        {/* ── Instrumento Jurídico ── */}
        {activeDoc === 'juridico' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">D2 — Instrumento Jurídico de Solidariedade</h3>
                <p className="text-xs text-slate-500">Cessão de créditos GD — Lei 14.300/2022, Art. 27</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { exportarInstrumentoJuridicoPDFStandalone(fd, calc); setDocsGerados((p) => ({ ...p, instrumentoJuridico: true })); }}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => { exportarInstrumentoJuridicoWord(fd, calc); setDocsGerados((p) => ({ ...p, instrumentoJuridico: true })); }}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Word
                </button>
              </div>
            </div>
            {!precisaRateio ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3 text-xs text-slate-500">
                ℹ️ Projeto atual: <strong>{fd.tipoCaracterizacao}</strong> — Instrumento Jurídico <strong>não é obrigatório</strong> para este tipo.
                É exigido para: Geração Compartilhada, Autoconsumo Remoto e EMUC (quando há solidariedade entre UCs distintas).
                Altere o Tipo de Caracterização no formulário (seção Cliente) se necessário.
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
                ⚠️ Projeto <strong>{fd.tipoCaracterizacao}</strong> — documento obrigatório.
                Preencha os dados dos cessionários. <strong>Firmas devem ser reconhecidas em cartório.</strong>
                Verificar com a CEEE se instrumento particular é aceito.
              </div>
            )}
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
              {gerarTextoInstrumentoJuridico(fd, calc)}
            </pre>
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
              <div className="flex gap-2">
                <button
                  onClick={exportFormularioPDF}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => { exportarFormularioWord(fd, calc); setDocsGerados((p) => ({ ...p, formularioCEEE: true })); }}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Word
                </button>
              </div>
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
