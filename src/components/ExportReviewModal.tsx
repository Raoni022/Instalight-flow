/**
 * ExportReviewModal.tsx — Revisão final antes de gerar o dossiê.
 *
 * Erros críticos BLOQUEIAM a exportação (botão desabilitado). Apenas avisos
 * permitem exportar com confirmação explícita. Substitui o antigo toast no
 * canto por um modal visível.
 */

import React from 'react';
import type { ExportQuality } from '../helpers/validateExport';

interface Props {
  quality: ExportQuality;
  onConfirm: () => void;
  onCancel: () => void;
  onIrParaAba: (aba: string) => void;
}

export const ExportReviewModal: React.FC<Props> = ({ quality, onConfirm, onCancel, onIrParaAba }) => {
  const { canExport, erros, avisos, documentosProntos } = quality;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-5 py-3 border-b ${canExport ? 'border-slate-200' : 'border-red-200 bg-red-50'}`}>
          <h2 className="font-semibold text-slate-800">Revisão final do dossiê</h2>
          <p className="text-xs text-slate-500">
            {canExport
              ? 'Confira os itens abaixo antes de gerar o ZIP (PDF + Word).'
              : 'Há erros críticos que impedem a exportação do dossiê.'}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4 text-sm">
          {/* Erros críticos */}
          {erros.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="font-semibold text-red-700 mb-1.5">⛔ Erros críticos ({erros.length})</p>
              <ul className="list-disc pl-5 space-y-1 text-red-700">
                {erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Avisos */}
          {avisos.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="font-semibold text-amber-700 mb-1.5">⚠ Pendências (não bloqueiam) — {avisos.length}</p>
              <ul className="list-disc pl-5 space-y-1 text-amber-700">
                {avisos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {/* Prontos */}
          {documentosProntos.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="font-semibold text-green-700 mb-1.5">✔ Prontos ({documentosProntos.length})</p>
              <p className="text-green-700 text-xs">{documentosProntos.join(' · ')}</p>
            </div>
          )}

          {!canExport && (
            <button
              onClick={() => onIrParaAba('resumo')}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Ver painel "Status do Dossiê" →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canExport}
            title={canExport ? '' : 'Resolva os erros críticos para liberar a exportação'}
            className={`px-4 py-1.5 text-xs font-semibold rounded text-white ${
              canExport ? 'bg-brand-500 hover:bg-brand-600' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {avisos.length > 0 ? 'Exportar mesmo assim' : 'Exportar dossiê'}
          </button>
        </div>
      </div>
    </div>
  );
};
