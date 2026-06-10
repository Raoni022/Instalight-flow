/**
 * MemorialTab.tsx — Aba do Memorial Técnico-Descritivo Profissional
 *
 * Arquitetura 80% JS + 20% IA:
 *   - buildMemorialTemplate() gera o corpo com seções fixas e marcadores [[[IA_NARRATIVA_SECx]]]
 *   - callAPI() preenche apenas os marcadores com narrativa técnica formal
 *   - Modo básico: aplica textos padrão sem chamar a IA
 */

import React from 'react';
import type { FormData, Calculos, Toast, DocsGerados } from '../../types';
import { callAPI } from '../../helpers/api';
import { makePDF, pdfHeader, pdfFooter, pdfRTWarning, addTextBlock } from '../../helpers/pdf';
import { makeFilename } from '../../helpers/filename';
import { buildMemorialTemplate, aplicarTextosBasicos } from '../../helpers/memorial';

interface MemorialTabProps {
  fd: FormData;
  calc: Calculos;
  apiKey: string;
  memorialIA: string;
  setMemorialIA: (v: string) => void;
  generatingMemorial: boolean;
  setGeneratingMemorial: (v: boolean) => void;
  setToast: (t: Toast) => void;
  setDocsGerados: React.Dispatch<React.SetStateAction<DocsGerados>>;
}

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

const SYS_PROMPT = `Você é um engenheiro eletricista sênior da Instalight Energia Solar, especializado em projetos de geração distribuída fotovoltaica para aprovação na CEEE Equatorial (Rio Grande do Sul).
Redige memoriais técnicos no padrão dos projetos reais aprovados pela distribuidora, conforme a NT.00020.EQTL-06 e ABNT NBR 16690.

ESTILO: Linguagem técnica formal, objetiva, terceira pessoa, sem parágrafos introdutórios genéricos. Direto ao ponto.
REGULAÇÃO: Cite exclusivamente Lei Federal 14.300/2022 e REN ANEEL 1.000/2021. NUNCA cite REN 482, REN 687 ou resoluções obsoletas.
NORMAS: ABNT NBR 16690, NBR 5410, NBR 5419, NBR IEC 62116, PRODIST Módulo 3.
NÚMEROS: Todos os valores numéricos técnicos já estão calculados no documento. Não recalcule, não altere nenhum valor.
TAREFA: Complete APENAS os quatro marcadores [[[IA_NARRATIVA_SECx]]] com 2–4 parágrafos técnicos formais cada. Não altere nenhuma outra parte do documento. Retorne o documento completo com os marcadores substituídos.`;

const SECOES = [
  { id: 'Siglas', label: 'Siglas e Abreviaturas',       icon: '📑', tipo: 'js' },
  { id: '1',      label: '1. Objetivo',                 icon: '🎯', tipo: 'ia' },
  { id: '2',      label: '2. Referências Normativas',   icon: '📋', tipo: 'js' },
  { id: '3',      label: '3. Dados da UC',              icon: '🏠', tipo: 'js' },
  { id: '4',      label: '4. Levantamento de Carga',    icon: '📊', tipo: 'js' },
  { id: '5',      label: '5. Padrão de Entrada',        icon: '⚡', tipo: 'js' },
  { id: '6',      label: '6. Estimativa de Geração',    icon: '🌱', tipo: 'ia' },
  { id: '7',      label: '7. Dim. Gerador (Tabela 3)',  icon: '☀️', tipo: 'js' },
  { id: '8',      label: '8. Dim. Inversor (Tabela 4)', icon: '🔄', tipo: 'js' },
  { id: '9',      label: '9. Estrutura de Fixação',     icon: '🏗️', tipo: 'ia' },
  { id: '10',     label: '10. Proteções (Tabela 5)',    icon: '🛡️', tipo: 'js' },
  { id: '11',     label: '11. Cabos',                   icon: '🔌', tipo: 'js' },
  { id: '12',     label: '12. Placa de Advertência',    icon: '⚠️', tipo: 'js' },
  { id: '13',     label: '13. Comissionamento',         icon: '🔬', tipo: 'ia' },
  { id: '14',     label: '14. Exploração/Manutenção',   icon: '🔧', tipo: 'js' },
  { id: '15',     label: '15. Notas NR-10',             icon: '⛑️', tipo: 'js' },
  { id: '16',     label: '16. Normas Adotadas',         icon: '📖', tipo: 'js' },
] as const;

export const MemorialTab: React.FC<MemorialTabProps> = ({
  fd, calc, apiKey, memorialIA, setMemorialIA,
  generatingMemorial, setGeneratingMemorial, setToast, setDocsGerados,
}) => {
  const gerarMemorial = async () => {
    if (!IS_PROD && !apiKey) {
      setToast({ message: 'Informe a API Key no cabeçalho (🔑).', type: 'error' });
      return;
    }
    setGeneratingMemorial(true);
    try {
      const template = buildMemorialTemplate(fd, calc);
      const instrucoes = `O documento a seguir é um Memorial Técnico-Descritivo de sistema fotovoltaico gerado automaticamente. Ele contém 4 marcadores [[[IA_NARRATIVA_SECx]]] que você deve preencher com texto técnico formal.

Contexto do projeto:
- Cliente: ${fd.nomeCliente || '[não informado]'} | Endereço: ${fd.endereco || '[não informado]'}
- Sistema: ${calc.kWp} kWp / ${calc.kWtCA} kW CA | ${fd.tipoLigacao} | ${fd.numeroPaineis || '?'} módulos ${fd.modeloPainel || ''}
- Enquadramento: ${calc.enq} | Caracterização: ${fd.tipoCaracterizacao} | Telhado: ${fd.tipoTelhado}
- Geração estimada: ${calc.geracaoAnual.toLocaleString('pt-BR')} kWh/ano
- CO₂ evitado: ${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg/ano | Árvores equiv.: ${calc.arvoresEquivalente}

Instruções para cada marcador:
[[[IA_NARRATIVA_SEC1]]] — OBJETIVO: 2–3 parágrafos apresentando o propósito do documento, os dados do cliente/UC, a empresa instaladora e o responsável técnico. Mencionar Lei 14.300/2022 e REN 1.000/2021.
[[[IA_NARRATIVA_SEC7]]] — ESTRUTURA DE FIXAÇÃO: 2–3 parágrafos descrevendo tecnicamente a estrutura de suporte para telhado do tipo "${fd.tipoTelhado}", materiais (alumínio anodizado, inox), critérios de resistência ao vento e corrosão.
[[[IA_NARRATIVA_SEC10]]] — IMPACTO AMBIENTAL: 2–3 parágrafos sobre redução de emissões (use os valores de CO₂ e árvores já calculados), contribuição para a matriz energética renovável e benefícios para a UC.
[[[IA_NARRATIVA_SEC12]]] — COMISSIONAMENTO (parágrafo introdutório apenas): 1–2 parágrafos introdutórios sobre a necessidade e objetivos do comissionamento, os critérios de aceitação gerais e a obrigatoriedade de profissional habilitado NR-10. As sub-etapas já estão escritas — não as duplique.

Retorne o documento completo com os marcadores substituídos pelo texto técnico.

DOCUMENTO:
${template}`;

      const res = await callAPI(apiKey, SYS_PROMPT, [{ role: 'user', content: instrucoes }], 4000);
      const texto: string = res.content[0].text;
      setMemorialIA(texto);
      setDocsGerados((p) => ({ ...p, memorial: true }));
      setToast({ message: 'Memorial profissional gerado! 16 seções conforme NT.00020.EQTL-06 REV 06.', type: 'success' });
    } catch (e: unknown) {
      setToast({ message: 'Erro ao gerar memorial: ' + (e instanceof Error ? e.message : String(e)), type: 'error' });
    } finally {
      setGeneratingMemorial(false);
    }
  };

  const gerarSemIA = () => {
    const template = buildMemorialTemplate(fd, calc);
    const resultado = aplicarTextosBasicos(template, fd, calc);
    setMemorialIA(resultado);
    setDocsGerados((p) => ({ ...p, memorial: true }));
    setToast({ message: 'Memorial gerado (modo básico — sem IA). Use "Gerar com IA" para narrativas aprimoradas.', type: 'info' });
  };

  const exportPDF = () => {
    const doc = makePDF('p', 'a4');
    const W = doc.internal.pageSize.getWidth();
    pdfHeader(doc, fd);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMORIAL TÉCNICO-DESCRITIVO', W / 2, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${calc.enq} | ${calc.kWp} kWp | ${fd.tipoLigacao} | Conforme NT.00020.EQTL-06`, W / 2, 42, { align: 'center' });
    doc.setTextColor(30, 30, 30);
    if (memorialIA) {
      addTextBlock(doc, memorialIA, 12, 12, 50, 5);
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('Gere o memorial primeiro.', 14, 55);
    }
    pdfRTWarning(doc);
    pdfFooter(doc, fd, 1, 1);
    doc.save(makeFilename('memorial', fd));
  };

  const canGenerate = IS_PROD || !!apiKey;

  return (
    <div className="flex flex-col h-full">
      {/* Header da aba */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
        <div>
          <h2 className="font-semibold text-slate-800">Memorial Técnico-Descritivo Profissional</h2>
          <p className="text-xs text-slate-500">16 seções • NT.00020.EQTL-06 REV 06 (CEEE Equatorial) • 80% JS + 20% IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={gerarSemIA}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Modo Básico
          </button>
          <button
            onClick={gerarMemorial}
            disabled={generatingMemorial || !canGenerate}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
          >
            {generatingMemorial ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando…</span>
              </>
            ) : (
              '✍️ Gerar com IA'
            )}
          </button>
          {memorialIA && (
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 text-xs font-medium rounded border border-brand-300 text-brand-600 hover:bg-brand-50"
            >
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Índice lateral */}
        {memorialIA && (
          <div className="w-48 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto p-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Seções</p>
            {SECOES.map((s) => (
              <a
                key={s.id}
                href={`#sec-memorial-${s.id}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-600 hover:bg-brand-50 hover:text-brand-600 mb-0.5"
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
                <span className={`ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full ${s.tipo === 'ia' ? 'bg-brand-400' : 'bg-green-400'}`} />
              </a>
            ))}
            <div className="mt-3 px-2 space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span>Calculado (JS)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-400 inline-block" />
                <span>Gerado (IA)</span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4">
          {!memorialIA && !generatingMemorial && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">📐</div>
              <p className="font-medium text-slate-600 mb-1">Memorial Técnico-Descritivo Profissional</p>
              <p className="text-sm mb-2">16 seções • Baseado em projetos reais aprovados pela CEEE Equatorial</p>
              <p className="text-xs text-slate-400 mb-6">Estrutura conforme NT.00020.EQTL-06 + FUNREBOM + NBR 16690</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={gerarSemIA}
                  className="px-4 py-2 text-sm font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Modo Básico (sem IA)
                </button>
                <button
                  onClick={gerarMemorial}
                  disabled={!canGenerate}
                  className="px-4 py-2 text-sm font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  ✍️ Gerar com IA {!canGenerate && '(API Key necessária)'}
                </button>
              </div>
            </div>
          )}

          {generatingMemorial && (
            <div className="text-center py-16 text-slate-400">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium text-slate-600 mb-1">Gerando memorial profissional…</p>
              <p className="text-sm">A IA está redigindo as seções narrativas. Aguarde ~20s.</p>
            </div>
          )}

          {memorialIA && (
            <div className="max-w-3xl mx-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed" id="memorial-content">
                {memorialIA}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
