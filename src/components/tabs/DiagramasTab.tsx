/**
 * DiagramasTab.tsx — Aba de visualização e exportação da prancha elétrica
 */

import React, { useState, useRef } from 'react';
import type { FormData, Calculos } from '../../types';
import { PranchaCompleta } from '../../svg/PranchaCompleta';
import type { TipoDiagrama } from '../../svg/PranchaCompleta';
import { makeFilename } from '../../helpers/filename';
import { pranchaSvgToPdfBlob } from '../../helpers/pdf';

interface DiagramasTabProps {
  fd: FormData;
  calc: Calculos;
}

const OPCOES: { id: TipoDiagrama; label: string }[] = [
  { id: 'ambos',      label: '⚡ Ambos'     },
  { id: 'unifilar',   label: '📐 Unifilar'  },
  { id: 'multifilar', label: '〰 Multifilar' },
];

export const DiagramasTab: React.FC<DiagramasTabProps> = ({ fd, calc }) => {
  const [tipoDiagrama, setTipoDiagrama] = useState<TipoDiagrama>('ambos');
  const svgRef = useRef<SVGSVGElement>(null);

  const exportSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const b = new Blob([s], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = makeFilename(`prancha_${tipoDiagrama}`, fd, 'svg');
    a.click();
  };

  const exportPDF = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const blob = await pranchaSvgToPdfBlob(svg);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = makeFilename(`prancha_${tipoDiagrama}`, fd, 'pdf');
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e: unknown) {
      alert('Erro ao gerar PDF: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const labelTitulo: Record<TipoDiagrama, string> = {
    ambos:      'Unifilar + Multifilar',
    unifilar:   'Diagrama Unifilar',
    multifilar: 'Diagrama Multifilar',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-800">Prancha Elétrica — {labelTitulo[tipoDiagrama]}</h2>
          <p className="text-xs text-slate-500">Atualiza em tempo real conforme o formulário</p>
        </div>

        {/* Toggle de seleção de diagrama */}
        <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {OPCOES.map((op) => (
            <button
              key={op.id}
              onClick={() => setTipoDiagrama(op.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                tipoDiagrama === op.id
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportSVG}
            className="px-3 py-1.5 text-xs font-medium rounded border border-brand-300 text-brand-600 hover:bg-brand-50"
          >
            Exportar SVG
          </button>
          <button
            onClick={exportPDF}
            className="px-3 py-1.5 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600"
          >
            Exportar PDF (A3)
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-slate-100">
        <div className="shadow-lg rounded-lg overflow-hidden">
          <PranchaCompleta ref={svgRef} fd={fd} calc={calc} tipoDiagrama={tipoDiagrama} />
        </div>
      </div>
    </div>
  );
};
