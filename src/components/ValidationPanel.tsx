import React, { useState } from 'react';
import type { ValidationIssue } from '../types';

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ issues }) => {
  const [expanded, setExpanded] = useState(false);

  const erros  = issues.filter((x) => x.nivel === 'erro');
  const avisos = issues.filter((x) => x.nivel === 'aviso');
  const infos  = issues.filter((x) => x.nivel === 'info');

  if (issues.length === 0) {
    return (
      <div className="mx-3 mt-2 mb-1 px-3 py-2 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-green-700">
        <span>✅</span>
        <span className="font-semibold">Projeto validado — sem inconsistências detectadas.</span>
      </div>
    );
  }

  const headerColor =
    erros.length > 0
      ? 'bg-red-50 border-red-300 text-red-800'
      : avisos.length > 0
        ? 'bg-amber-50 border-amber-300 text-amber-800'
        : 'bg-blue-50 border-blue-300 text-blue-700';

  const headerIcon  = erros.length > 0 ? '🚫' : avisos.length > 0 ? '⚠️' : 'ℹ️';
  const headerMsg   =
    erros.length > 0
      ? `${erros.length} erro${erros.length > 1 ? 's' : ''} crítico${erros.length > 1 ? 's' : ''} — exportação bloqueada`
      : avisos.length > 0
        ? `${avisos.length} aviso${avisos.length > 1 ? 's' : ''} — revise antes de exportar`
        : `${infos.length} informação${infos.length > 1 ? 'ões' : ''}`;

  return (
    <div className={`mx-3 mt-2 mb-1 rounded-lg border ${headerColor}`}>
      <button
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold"
      >
        <span>
          {headerIcon} {headerMsg}
        </span>
        <span className="text-slate-400">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-current border-opacity-20 px-3 pb-3 pt-2 space-y-1.5 max-h-52 overflow-y-auto">
          {erros.map((x, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="flex-shrink-0 text-red-600 font-bold">[{x.cod}]</span>
              <span className="text-red-700">{x.msg}</span>
            </div>
          ))}
          {avisos.map((x, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="flex-shrink-0 text-amber-600 font-bold">[{x.cod}]</span>
              <span className="text-amber-700">{x.msg}</span>
            </div>
          ))}
          {infos.map((x, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="flex-shrink-0 text-blue-600 font-bold">[{x.cod}]</span>
              <span className="text-blue-700">{x.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
