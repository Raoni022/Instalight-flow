/**
 * ResumoTab.tsx — Aba de resumo do projeto + checklist de protocolo CEEE
 *
 * 8 cards de cálculo + Grupos A/B de documentos + PDF de pendências
 */

import React from 'react';
import type { FormData, Calculos, DocsGerados, Toast } from '../../types';
import { makePDF, pdfHeader, pdfFooter } from '../../helpers/pdf';
import { makeFilename } from '../../helpers/filename';

interface ResumoTabProps {
  fd: FormData;
  calc: Calculos;
  docsGerados: DocsGerados;
  setToast: (t: Toast) => void;
}

const COLOR_MAP: Record<string, string> = {
  orange:  'bg-orange-50 border-orange-200 text-orange-700',
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
          className="text-xs text-orange-600 underline hover:text-orange-800 mt-0.5 inline-block">
          🗺 Abrir no Google Maps
        </a>
      )}
      {gerado  && <p className="text-xs text-green-600 mt-0.5">Gerado pelo app</p>}
    </div>
  </div>
);

export const ResumoTab: React.FC<ResumoTabProps> = ({ fd, calc, docsGerados, setToast }) => {
  const cards = [
    { label: 'Potência CC',        value: `${calc.kWp} kWp`,                                    icon: '☀️', color: 'orange'  },
    { label: 'Potência CA total',  value: `${calc.kWtCA} kW`,                                   icon: '⚡', color: 'blue'    },
    { label: 'Enquadramento',      value: calc.enq,                                              icon: '📋', color: 'green'   },
    { label: 'Geração anual est.', value: `${calc.geracaoAnual.toLocaleString('pt-BR')} kWh`,   icon: '📊', color: 'purple'  },
    { label: 'Prazo análise CEEE', value: calc.prazo,                                            icon: '⏱️', color: 'slate'   },
    { label: 'Economia anual est.',value: `R$ ${calc.economiaAnual.toLocaleString('pt-BR')}`,   icon: '💰', color: 'emerald' },
    { label: 'CO₂ evitado/ano',    value: `${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg`, icon: '🌿', color: 'teal'    },
    { label: 'Árvores equiv./ano', value: `${calc.arvoresEquivalente} árvores`,                  icon: '🌳', color: 'lime'    },
    { label: 'DJ Geral Entrada',   value: fd.disjuntorEntrada ? `${fd.disjuntorEntrada} A` : '—', icon: '🔌', color: 'slate'  },
    { label: 'Ramal de Entrada',   value: fd.ramalEntrada || '—',                                icon: '⚡', color: 'blue'   },
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
  ];

  const exportPendencias = () => {
    const doc = makePDF('p', 'a4');
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    pdfHeader(doc, fd);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE PENDÊNCIAS — PROTOCOLO CEEE', W / 2, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${fd.nomeCliente || '—'} | UC: ${fd.codigoUC || '—'} | Sistema: ${calc.kWp}kWp`, W / 2, 43, { align: 'center' });

    let y = 54;
    const sect = (title: string) => {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(249, 115, 22);
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
      if (done) doc.setTextColor(34, 139, 34); else doc.setTextColor(180, 100, 0);
      doc.text(done ? 'GERADO' : 'PENDENTE', 14, y);
      doc.setTextColor(30, 30, 30);
      if (!done) { doc.setTextColor(80, 80, 80); doc.text(`  Como obter: ${como}`, 14, y + 5); y += 5; }
      y += 9;
      if (y > H - 20) { doc.addPage(); pdfHeader(doc, fd); y = 35; }
    };

    sect('GRUPO A — DOCUMENTOS DO CLIENTE');
    groupA.forEach((g) => item(g.id, g.doc, g.gerado, g.como));
    sect('GRUPO B — DOCUMENTOS TÉCNICOS');
    groupB.forEach((g) => item(g.id, g.doc, g.gerado, g.como));

    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Dúvidas? Entre em contato com a Instalight.', 14, y);
    pdfFooter(doc, fd, 1, 1);
    doc.save(makeFilename('pendencias', fd));
    setToast({ message: 'Relatório de pendências exportado!', type: 'success' });
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Resumo do Projeto + Checklist de Protocolo</h2>
          <p className="text-xs text-slate-500">Acompanhe o status de todos os documentos necessários</p>
        </div>
        <button
          onClick={exportPendencias}
          className="px-4 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600"
        >
          📄 Gerar PDF de Pendências
        </button>
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
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">GRUPO A</span>
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
