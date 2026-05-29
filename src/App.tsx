/**
 * App.tsx — Componente raiz do GD Docs Instalight Flow
 *
 * Mantém todo o estado central e orquestra as tabs e a sidebar.
 * O motor de cálculo (calcularSistema) e a validação (validarProjeto)
 * são executados em useMemo — nunca pela IA.
 */

import React, {
  useState, useEffect, useMemo, useRef,
} from 'react';

import { calcularSistema } from './engine/calcularSistema';
import { validarProjeto }   from './engine/validarProjeto';
import { makeFilename }      from './helpers/filename';
import { LS_KEY }            from './constants';

import type { FormData, Toast } from './types';

// TODO (migração de componentes):
// import { Sidebar }       from './components/Sidebar';
// import { DiagramasTab }  from './components/tabs/DiagramasTab';
// import { MemorialTab }   from './components/tabs/MemorialTab';
// import { DocumentosTab } from './components/tabs/DocumentosTab';
// import { ResumoTab }     from './components/tabs/ResumoTab';

// Lazy imports das tabs (serão criadas na migração dos componentes)
// import { DiagramasTab }  from './components/tabs/DiagramasTab';
// import { MemorialTab }   from './components/tabs/MemorialTab';
// import { DocumentosTab } from './components/tabs/DocumentosTab';
// import { ResumoTab }     from './components/tabs/ResumoTab';
// import { Sidebar }       from './components/Sidebar';

// ── Formulário inicial (todos os campos como string vazia ou default) ─────
export const INITIAL_FORM: FormData = {
  tipoPessoa: 'fisica',
  nomeCliente: '', cpfCnpj: '', endereco: '', codigoUC: '',
  numeroFatura: '', consumoMensalKwh: '', numContaContrato: '',
  tipoLigacao: 'Monofásico',
  numeroPaineis: '', modeloPainel: '', potenciaUnitariaWp: '',
  paineisSerie: '', stringParalelo: '',
  modeloInversor: '', potenciaCAkW: '', tensaoEntradaCC: '',
  tensaoSaidaCA: '', quantidadeInversores: '1',
  secaoCaboCC: '6', secaoCaboCA: '6', secaoCaboAterr: '16',
  comprimentoCabosCC: '', comprimentoCabosCA: '',
  dpsCCTipo: 'Tipo 2', dpsCCTensao: '1000',
  dpsCATipo: 'Tipo 2', dpsCATensao: '275',
  disjuntorCC: '', disjuntorCA: '', aterramento: '',
  tipoTelhado: 'Cerâmico', coordenadas: '',
  nomeResponsavel: '', numeroCRT: '', numART: '', numProjeto: '',
  cidade: 'Porto Alegre', dataproject: new Date().toISOString().slice(0, 10),
  nomeEmpresa: '', cnpjEmpresa: '', enderecoEmpresa: '',
};

// ── Tabs ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'diagramas',  label: 'Diagramas',  icon: '📐' },
  { id: 'memorial',   label: 'Memorial',    icon: '📋' },
  { id: 'documentos', label: 'Documentos',  icon: '📜' },
  { id: 'resumo',     label: 'Resumo',      icon: '✅' },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Cores de Toast ────────────────────────────────────────────────────────
const TOAST_COLORS: Record<string, string> = {
  success: 'bg-green-700',
  error:   'bg-red-700',
  warning: 'bg-amber-600',
  info:    'bg-blue-700',
};

// ── Ambiente: proxy Vercel em produção, direto em dev ─────────────────────
const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

// ── Componente App ────────────────────────────────────────────────────────
export default function App() {
  const [formData, setFormData]       = useState<FormData>(INITIAL_FORM);
  const [apiKey, setApiKey]       = useState<string>(() => localStorage.getItem(LS_KEY) ?? '');
  const [activeTab, setActiveTab] = useState<TabId>('diagramas');
  const [toast, setToast]         = useState<Toast | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Motor de cálculo — executa em JS puro, nunca pela IA
  const calc       = useMemo(() => calcularSistema(formData), [formData]);
  const validacoes = useMemo(() => validarProjeto(formData, calc), [formData, calc]);

  // Persistência da chave (somente dev local)
  useEffect(() => {
    if (apiKey) localStorage.setItem(LS_KEY, apiKey);
  }, [apiKey]);

  // Auto-dismiss do toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // onChange e onExtract serão definidos aqui quando Sidebar/UploadModule forem migrados
  // Ver: src/components/Sidebar.tsx, src/components/UploadModule.tsx

  // Exportação em massa (bloqueia se houver erros críticos)
  const exportarTudo = async () => {
    const errosCriticos = validacoes.filter(x => x.nivel === 'erro');
    if (errosCriticos.length > 0) {
      setToast({
        message: `Exportação bloqueada: ${errosCriticos.length} erro(s) crítico(s). Corrija os itens em vermelho.`,
        type: 'error',
      });
      return;
    }

    setToast({ message: 'Exportando todos os documentos…', type: 'info' });
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 1 — SVG da prancha
    if (svgRef.current) {
      const s = new XMLSerializer().serializeToString(svgRef.current);
      const b = new Blob([s], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = makeFilename('prancha', formData, 'svg');
      a.click();
      await delay(400);
    }

    // PDFs 2-5: migração em andamento — ver helpers/export.ts
    // exportarMemorialPDF, exportarProcuracaoPDF, exportarFormularioPDF,
    // exportarPendenciasPDF serão chamados aqui quando a migração estiver completa

    setToast({ message: '✅ Exportação concluída!', type: 'success' });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-gray-900 flex items-center px-4 gap-4 flex-shrink-0 border-b border-gray-800">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">☀</div>
          <div>
            <div className="text-white font-bold text-sm leading-none">GD Docs</div>
            <div className="text-orange-400 text-xs leading-none">Instalight</div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 ml-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === t.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* API Key — somente visível em dev local */}
        {!IS_PROD && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">🔑</span>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Anthropic API Key"
              className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded border border-gray-700 outline-none focus:border-orange-500 w-56"
            />
          </div>
        )}

        <button
          onClick={exportarTudo}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1"
        >
          ⬇ Exportar Tudo
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: migração em andamento — ver components/Sidebar.tsx */}
        <aside className="w-96 bg-slate-50 border-r border-slate-200 flex items-center justify-center text-slate-400 text-sm">
          Sidebar — migração em andamento
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col items-center justify-center text-slate-400">
          <div className="text-4xl mb-3">🚀</div>
          <p className="font-semibold text-slate-600">Migração Vite + TypeScript em andamento</p>
          <p className="text-sm mt-1">App funcional em: <code className="bg-slate-100 px-2 py-0.5 rounded">gd-docs-instalight.html</code></p>
          <p className="text-xs mt-4 text-slate-400">Tab ativa: <strong>{activeTab}</strong> | kWp calculado: <strong>{calc.kWp}</strong></p>
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${TOAST_COLORS[toast.type] ?? 'bg-gray-800'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
