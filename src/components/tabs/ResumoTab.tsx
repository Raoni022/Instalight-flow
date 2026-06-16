/**
 * ResumoTab.tsx — Aba de resumo do projeto + checklist de protocolo CEEE
 *
 * 8 cards de cálculo + Grupos A/B de documentos + PDF de pendências
 */

import React from 'react';
import type { FormData, Calculos, DocsGerados, Toast } from '../../types';
import { exportarPendenciasPDFStandalone, exportarPendenciasWord } from '../../helpers/export';

interface ResumoTabProps {
  fd: FormData;
  calc: Calculos;
  docsGerados: DocsGerados;
  setToast: (t: Toast) => void;
}

const COLOR_MAP: Record<string, string> = {
  orange:  'bg-brand-50 border-brand-200 text-brand-700',
  blue:    'bg-blue-50 border-blue-200 text-blue-700',
  green:   'bg-green-50 border-green-200 text-green-700',
  purple:  'bg-purple-50 border-purple-200 text-purple-700',
  slate:   'bg-slate-50 border-slate-200 text-slate-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  teal:    'bg-teal-50 border-teal-200 text-teal-700',
  lime:    'bg-lime-50 border-lime-200 text-lime-700',
};

interface CheckItemProps {
  id: string;
  doc: string;
  gerado: boolean;
  como: string;
  link?: string; // URL opcional para abrir (ex: Google Maps)
}

const CheckItem: React.FC<CheckItemProps> = ({ id, doc, gerado, como, link }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg border ${gerado ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
    <span className="text-lg flex-shrink-0">{gerado ? '✅' : '⏳'}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500">{id}</span>
        <span className={`text-sm font-medium ${gerado ? 'text-green-700' : 'text-slate-700'}`}>{doc}</span>
      </div>
      {!gerado && <p className="text-xs text-slate-500 mt-0.5">{como}</p>}
      {!gerado && link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-xs text-brand-600 underline hover:text-brand-800 mt-0.5 inline-block">
          🗺 Abrir no Google Maps
        </a>
      )}
      {gerado  && <p className="text-xs text-green-600 mt-0.5">Gerado pelo app</p>}
    </div>
  </div>
);

export const ResumoTab: React.FC<ResumoTabProps> = ({ fd, calc, docsGerados, setToast }) => {
  const isAmpl   = fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0;
  const potCC    = isAmpl ? `${calc.kWpTotal} kWp (total)` : `${calc.kWp} kWp`;
  const potCA    = isAmpl ? `${calc.kWtCATotal} kW (total)` : `${calc.kWtCA} kW`;
  const enquadra = isAmpl ? calc.enqTotal : calc.enq;
  const gerLabel = isAmpl ? 'Geração anual (total)' : 'Geração anual est.';
  const geracao  = calc.geracaoAnualTotal;
  const ecoLabel = isAmpl ? 'Economia anual (total)' : 'Economia anual est.';
  const economia = calc.economiaAnualTotal;

  const cards = [
    { label: 'Potência CC',        value: potCC,                                                   icon: '☀️', color: 'orange'  },
    { label: 'Potência CA total',  value: potCA,                                                   icon: '⚡', color: 'blue'    },
    { label: 'Enquadramento',      value: enquadra,                                                icon: '📋', color: 'green'   },
    { label: gerLabel,             value: `${geracao.toLocaleString('pt-BR')} kWh`,               icon: '📊', color: 'purple'  },
    { label: 'Prazo análise CEEE', value: calc.prazo,                                              icon: '⏱️', color: 'slate'   },
    { label: ecoLabel,             value: `R$ ${economia.toLocaleString('pt-BR')}`,               icon: '💰', color: 'emerald' },
    { label: 'CO₂ evitado/ano',    value: `${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg`,   icon: '🌿', color: 'teal'    },
    { label: 'Árvores equiv./ano', value: `${calc.arvoresEquivalente} árvores`,                    icon: '🌳', color: 'lime'    },
    { label: 'DJ Geral Entrada',   value: fd.disjuntorEntrada ? `${fd.disjuntorEntrada} A` : '—', icon: '🔌', color: 'slate'   },
    { label: 'Ramal de Entrada',   value: fd.ramalEntrada || '—',                                  icon: '⚡', color: 'blue'    },
  ];

  const groupA = [
    { id: 'A1', doc: 'Procuração Específica',          gerado: docsGerados.procuracao,    como: 'Gere na aba "Documentos" e peça ao cliente assinar com firma reconhecida' },
    { id: 'A2', doc: 'Formulário de Acesso CEEE',      gerado: docsGerados.formularioCEEE,como: 'Gere na aba "Documentos" e leve ao protocolo CEEE' },
    { id: 'A3', doc: 'Documentos pessoais (RG+CPF / CNPJ+Contrato Social)', gerado: false,
      como: fd.tipoPessoa === 'fisica' ? 'Solicitar cópia do RG e CPF do titular' : 'Solicitar CNPJ, Contrato Social e documento do representante' },
    { id: 'A4', doc: 'Fatura de energia recente',      gerado: false,                     como: 'Solicitar fatura dos últimos 3 meses' },
  ];

  const diagramasOk = calc.kWp > 0 && !!fd.tipoLigacao && !!fd.nomeCliente;

  const groupB = [
    { id: 'B1', doc: 'Diagrama Unifilar',              gerado: diagramasOk,               como: 'Preencha os dados do projeto e exporte na aba "Diagramas"' },
    { id: 'B2', doc: 'Diagrama Pluri (Bi/Trifilar)',   gerado: diagramasOk,               como: 'Incluído na mesma prancha da aba "Diagramas"' },
    { id: 'B3', doc: 'Planta de Situação / Locação',   gerado: false,
      como: 'Capturar print do Google Maps com escala e norte indicados',
      link: fd.endereco ? `https://maps.google.com/?q=${encodeURIComponent(fd.endereco)}` : undefined },
    { id: 'B4', doc: 'Memorial Técnico-Descritivo',    gerado: docsGerados.memorial,      como: 'Gere na aba "Memorial" e valide com o RT' },
    { id: 'B5', doc: 'TRT/ART (Responsabilidade Técnica)', gerado: false,                 como: 'RT deve assinar a ART no sistema do CREA/CFT' },
    { id: 'B6', doc: 'Data Sheets dos equipamentos',   gerado: false,                     como: 'Baixar do site do fabricante e incluir no dossiê' },
    { id: 'B7', doc: 'Protocolo CEEE Equatorial (portal online)', gerado: false,
      como: 'Após reunir todos os documentos, protocolar pelo portal SolicitaNet da CEEE Equatorial',
      link: 'https://solicitanet.ceee.com.br/' },
  ];

  const exportPendencias = () => {
    exportarPendenciasPDFStandalone(fd, calc, docsGerados);
    setToast({ message: 'Relatório de pendências (PDF) exportado!', type: 'success' });
  };
  const exportPendenciasWordBtn = async () => {
    await exportarPendenciasWord(fd, calc, docsGerados);
    setToast({ message: 'Relatório de pendências (Word) exportado!', type: 'success' });
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Resumo do Projeto + Checklist de Protocolo</h2>
          <p className="text-xs text-slate-500">Acompanhe o status de todos os documentos necessários</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPendencias}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600"
          >
            📄 PDF de Pendências
          </button>
          <button
            onClick={exportPendenciasWordBtn}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Word
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Cards */}
        <div className="grid grid-cols-3 gap-3">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-lg border p-3 ${COLOR_MAP[c.color] ?? ''}`}>
              <div className="text-xl mb-1">{c.icon}</div>
              <div className="text-xs opacity-70 mb-0.5">{c.label}</div>
              <div className="font-bold text-sm">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Grupo A */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded">GRUPO A</span>
            Documentos do Cliente
          </h3>
          <div className="space-y-2">
            {groupA.map((g) => <CheckItem key={g.id} {...g} />)}
          </div>
        </div>

        {/* Grupo B */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">GRUPO B</span>
            Documentos Técnicos
          </h3>
          <div className="space-y-2">
            {groupB.map((g) => <CheckItem key={g.id} {...g} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
