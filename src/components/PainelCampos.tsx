import React from 'react';
import { CAMPOS_OPCIONAIS } from '../hooks/useCamposVisiveis';

interface PainelCamposProps {
  visivel: (campo: string) => boolean;
  toggle: (campo: string) => void;
  onClose: () => void;
}

export const PainelCampos: React.FC<PainelCamposProps> = ({ visivel, toggle, onClose }) => {
  const secoes = Object.entries(CAMPOS_OPCIONAIS).reduce<Record<string, string[]>>(
    (acc, [campo, cfg]) => {
      (acc[cfg.secao] ??= []).push(campo);
      return acc;
    },
    {},
  );

  return (
    <div className="absolute inset-0 z-20 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <span className="text-sm font-semibold text-slate-700">Campos visíveis</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          title="Fechar"
        >
          ✕
        </button>
      </div>

      <p className="px-4 pt-2 pb-1 text-xs text-slate-400 italic">
        Desmarque para ocultar campos desnecessários para o seu fluxo de trabalho.
        Campos obrigatórios pela CEEE não aparecem aqui.
      </p>

      <div className="overflow-y-auto flex-1 p-3 space-y-4">
        {Object.entries(secoes).map(([secao, campos]) => (
          <div key={secao}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
              {secao}
            </div>
            <div className="space-y-1.5">
              {campos.map(campo => (
                <label
                  key={campo}
                  className="flex items-center gap-2 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={visivel(campo)}
                    onChange={() => toggle(campo)}
                    className="accent-brand-500 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span className={`text-xs ${visivel(campo) ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {CAMPOS_OPCIONAIS[campo].label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
