/**
 * App.tsx — Componente raiz do GD Docs Instalight Flow
 *
 * Mantém todo o estado central e orquestra as tabs e a sidebar.
 * O motor de cálculo (calcularSistema) e a validação (validarProjeto)
 * são executados em useMemo — nunca pela IA.
 *
 * Segurança: a API key NUNCA é exposta em produção (IS_PROD = true).
 * Em produção todas as chamadas roteiam para /api/claude (proxy Vercel).
 */

import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';

import { calcularSistema }   from './engine/calcularSistema';
import { validarProjeto }    from './engine/validarProjeto';
import { makeFilename }      from './helpers/filename';
import { LS_KEY }            from './constants';
import {
  exportarProcuracaoPDFStandalone,
  exportarFormularioPDFStandalone,
  exportarPendenciasPDFStandalone,
  exportarMemorialPDFStandalone,
} from './helpers/export';

import type { FormData, Toast, DocsGerados } from './types';

import { Sidebar }       from './components/Sidebar';
import { DiagramasTab }  from './components/tabs/DiagramasTab';
import { MemorialTab }   from './components/tabs/MemorialTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { ResumoTab }     from './components/tabs/ResumoTab';

// ── Formulário inicial ────────────────────────────────────────────────────
export const INITIAL_FORM: FormData = {
  tipoPessoa: 'fisica',
  nomeCliente: '', cpfCnpj: '', endereco: '', codigoUC: '',
  numeroFatura: '', consumoMensalKwh: '', numContaContrato: '',
  tipoLigacao: 'Monofásico',
  numeroPaineis: '', modeloPainel: '', potenciaUnitariaWp: '',
  paineisSerie: '', stringParalelo: '',
  vocUnitario: '', iscUnitario: '', vmppUnitario: '', imppUnitario: '',
  eficienciaPainel: '', coefTempVoc: '',
  modeloInversor: '', potenciaCAkW: '', tensaoEntradaCC: '',
  tensaoSaidaCA: '', quantidadeInversores: '1',
  numMPPT: '', faixaMPPTMin: '', faixaMPPTMax: '', tensaoPartidaCC: '', eficienciaInv: '',
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

// ── Toast styles ──────────────────────────────────────────────────────────
const TOAST_COLORS: Record<string, string> = {
  success: 'bg-green-700',
  error:   'bg-red-700',
  warning: 'bg-amber-600',
  info:    'bg-blue-700',
};

// ── Ambiente ──────────────────────────────────────────────────────────────
const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  // ── Estado central ──
  const [formData, setFormData]         = useState<FormData>(INITIAL_FORM);
  const [apiKey, setApiKey]             = useState<string>(() => localStorage.getItem(LS_KEY) ?? '');
  const [activeTab, setActiveTab]       = useState<TabId>('diagramas');
  const [toast, setToast]               = useState<Toast | null>(null);

  // Estados de geração de documentos
  const [memorialIA, setMemorialIA]               = useState('');
  const [generatingMemorial, setGeneratingMemorial] = useState(false);
  const [docsGerados, setDocsGerados]             = useState<DocsGerados>({
    diagramas: true,
    memorial: false,
    procuracao: false,
    formularioCEEE: false,
  });

  // Estados do módulo de upload
  const [uploadedFiles, setUploadedFiles]     = useState<File[]>([]);
  const [extractingData, setExtractingData]   = useState(false);
  const [aiFilledFields, setAiFilledFields]   = useState<Set<string>>(new Set());

  // Referência para o SVG da prancha (exportação)
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Motor de cálculo — JS puro, nunca IA ──
  const calc       = useMemo(() => calcularSistema(formData), [formData]);
  const validacoes = useMemo(() => validarProjeto(formData, calc), [formData, calc]);

  // ── Persistência da chave (somente dev local) ──
  useEffect(() => {
    if (!IS_PROD && apiKey) localStorage.setItem(LS_KEY, apiKey);
  }, [apiKey]);

  // ── Auto-dismiss do toast (4 s) ──
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── onChange centralizado para o formulário ──
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Se o campo foi alterado manualmente, remove o marcador de IA
      setAiFilledFields((prev) => {
        if (!prev.has(name)) return prev;
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    },
    [],
  );

  // ── onExtract: recebe JSON do UploadModule e preenche o formulário ──
  const onExtract = useCallback((json: Record<string, unknown>) => {
    const allowed = new Set(Object.keys(INITIAL_FORM));
    const filled: string[] = [];

    setFormData((prev) => {
      const next = { ...prev };
      for (const [key, raw] of Object.entries(json)) {
        if (!allowed.has(key)) continue;
        const val = String(raw ?? '').trim();
        if (!val || val === 'null' || val === 'undefined') continue;
        (next as Record<string, unknown>)[key] = val;
        filled.push(key);
      }
      return next;
    });

    if (filled.length > 0) {
      setAiFilledFields((prev) => new Set([...prev, ...filled]));
      setToast({
        message: `✨ ${filled.length} campo(s) preenchidos automaticamente pela IA`,
        type: 'success',
      });
    } else {
      setToast({ message: 'Nenhum campo identificado nos documentos enviados.', type: 'warning' });
    }
  }, []);

  // ── Exportação em massa ──
  const exportarTudo = useCallback(async () => {
    const errosCriticos = validacoes.filter((x) => x.nivel === 'erro');
    if (errosCriticos.length > 0) {
      setToast({
        message: `Exportação bloqueada: ${errosCriticos.length} erro(s) crítico(s). Corrija os itens em vermelho.`,
        type: 'error',
      });
      return;
    }

    setToast({ message: 'Exportando todos os documentos…', type: 'info' });
    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    // 1 — SVG da prancha elétrica
    if (svgRef.current) {
      const s = new XMLSerializer().serializeToString(svgRef.current);
      const b = new Blob([s], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = makeFilename('prancha', formData, 'svg');
      a.click();
      await delay(400);
    }

    // 2 — Memorial técnico
    exportarMemorialPDFStandalone(formData, calc, memorialIA);
    await delay(400);

    // 3 — Procuração específica
    exportarProcuracaoPDFStandalone(formData, calc);
    await delay(400);

    // 4 — Formulário de acesso CEEE
    exportarFormularioPDFStandalone(formData, calc);
    await delay(400);

    // 5 — Relatório de pendências
    exportarPendenciasPDFStandalone(formData, calc, docsGerados);

    setToast({ message: '✅ Todos os documentos exportados com sucesso!', type: 'success' });
  }, [formData, calc, memorialIA, docsGerados, validacoes]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-gray-900 flex items-center px-4 gap-4 flex-shrink-0 border-b border-gray-800">

        {/* Logo Instalight */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm select-none">
            ☀
          </div>
          <div className="leading-none">
            <div className="text-white font-bold text-sm">GD Docs</div>
            <div className="text-orange-400 text-xs">Instalight</div>
          </div>
        </div>

        {/* Tabs de navegação */}
        <nav className="flex gap-1 ml-4">
          {TABS.map((t) => (
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

        {/* Indicadores rápidos de validação */}
        {validacoes.filter((v) => v.nivel === 'erro').length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-900/50 rounded text-red-300 text-xs">
            <span>⚠</span>
            <span>{validacoes.filter((v) => v.nivel === 'erro').length} erro(s)</span>
          </div>
        )}

        <div className="flex-1" />

        {/* API Key — somente em dev/localhost */}
        {!IS_PROD && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">🔑</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Anthropic API Key"
              className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded border border-gray-700 outline-none focus:border-orange-500 w-56 placeholder-gray-500"
            />
          </div>
        )}

        {/* Exportar Tudo */}
        <button
          onClick={exportarTudo}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          ⬇ Exportar Tudo
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar com formulário */}
        <Sidebar
          fd={formData}
          onChange={onChange}
          calc={calc}
          validacoes={validacoes}
          apiKey={apiKey}
          onExtract={onExtract}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          extractingData={extractingData}
          setExtractingData={setExtractingData}
          aiFilledFields={aiFilledFields}
        />

        {/* Área principal — tabs */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'diagramas' && (
            <DiagramasTab fd={formData} calc={calc} svgRef={svgRef} />
          )}
          {activeTab === 'memorial' && (
            <MemorialTab
              fd={formData}
              calc={calc}
              apiKey={apiKey}
              memorialIA={memorialIA}
              setMemorialIA={setMemorialIA}
              generatingMemorial={generatingMemorial}
              setGeneratingMemorial={setGeneratingMemorial}
              setToast={setToast}
              setDocsGerados={setDocsGerados}
            />
          )}
          {activeTab === 'documentos' && (
            <DocumentosTab
              fd={formData}
              calc={calc}
              apiKey={apiKey}
              setToast={setToast}
              docsGerados={docsGerados}
              setDocsGerados={setDocsGerados}
            />
          )}
          {activeTab === 'resumo' && (
            <ResumoTab
              fd={formData}
              calc={calc}
              docsGerados={docsGerados}
              setToast={setToast}
            />
          )}
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 max-w-sm animate-fade-in ${
            TOAST_COLORS[toast.type] ?? 'bg-gray-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
