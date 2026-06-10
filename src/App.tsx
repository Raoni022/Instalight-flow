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
import { LS_KEY }            from './constants';
import { exportarDossieZip } from './helpers/zip';
import { pranchaSvgToPdfBlob } from './helpers/pdf';

import type { FormData, Toast, DocsGerados, ProjetoSalvo, StatusProjeto } from './types';

import { Sidebar }       from './components/Sidebar';
import { HomeScreen }    from './components/HomeScreen';
import { DiagramasTab }  from './components/tabs/DiagramasTab';
import { MemorialTab }   from './components/tabs/MemorialTab';
import { DocumentosTab } from './components/tabs/DocumentosTab';
import { ResumoTab }     from './components/tabs/ResumoTab';

// ── Formulário inicial ────────────────────────────────────────────────────
export const INITIAL_FORM: FormData = {
  tipoPessoa: 'fisica',
  tipoInstalacao: 'Nova',
  nomeCliente: '', cpfCnpj: '',
  // PF específico
  rgCliente: '', orgaoExpeditorRG: '', telefoneCelular: '',
  // Endereço dividido
  logradouro: '', numEndereco: '', complemento: '', bairro: '', cep: '',
  endereco: '', codigoUC: '',
  // Ocultos no sidebar mas mantidos para memorial/formulário
  numeroFatura: '', consumoMensalKwh: '', numContaContrato: '',
  // Padrão de entrada
  tipoLigacao: 'Monofásico',
  tipoPadrao: '', tipoFixacao: '', materialCaboEntrada: 'Cobre', numPoste: '',
  disjuntorEntrada: '', ramalEntrada: '',
  numeroMedidor: '', classeUC: 'Residencial', latitude: '', longitude: '',
  transformador: '',
  // Sistema FV
  numeroPaineis: '', modeloPainel: '', potenciaUnitariaWp: '',
  paineisSerie: '', stringParalelo: '',
  vocUnitario: '', iscUnitario: '', vmppUnitario: '', imppUnitario: '',
  eficienciaPainel: '', coefTempVoc: '', noct: '', certificacaoPainel: '',
  modeloInversor: '', potenciaCAkW: '', tensaoEntradaCC: '',
  tensaoSaidaCA: '', quantidadeInversores: '1',
  numMPPT: '', faixaMPPTMin: '', faixaMPPTMax: '', tensaoPartidaCC: '', eficienciaInv: '',
  secaoCaboCC: '6', secaoCaboCA: '6', secaoCaboAterr: '16',
  comprimentoCabosCC: '', comprimentoCabosCA: '',
  dpsCCTipo: 'Tipo 2', dpsCCTensao: '1000',
  dpsCATipo: 'Tipo 2', dpsCATensao: '275',
  disjuntorCC: '', disjuntorCA: '', aterramento: '', modeloStringBox: '', resistenciaAterramento: '',
  tipoTelhado: 'Cerâmico', coordenadas: '', tempMinima: '',
  // Responsável Técnico — numProjeto oculto no sidebar (usado apenas no carimbo da prancha)
  tipoResponsabilidade: 'TRT',
  nomeResponsavel: '', numeroCRT: '', numART: '', numProjeto: '',
  cidade: 'Porto Alegre', dataproject: new Date().toISOString().slice(0, 10),
  nomeEmpresa: '', cnpjEmpresa: '', enderecoEmpresa: '',
  nomeRepresentante: '', cpfRepresentante: '', rgRepresentante: '', cargoRepresentante: '',
  inscricaoEstadual: '', emailContato: '', telefoneContato: '',
  numeroPaineisExistentes: '', modeloPainelExistente: '', potenciaWpExistente: '',
  noctExistente: '', certificacaoExistente: '',
  modeloInversorExistente: '', potenciaCAExistentekW: '', quantidadeInversoresExistente: '',
  // Ampliação — metadados do projeto anterior
  parecerAcessoAnterior: '', dataAprovacaoAnterior: '', artTrtAnterior: '',
  observacoesExistente: '',
  situacaoPadrao: 'A definir pelo RT',
  tipoAmpliacao: 'A definir pelo RT',
  // Geração / desempenho local
  irradLocal: '', prCustom: '',
  // CEEE — Tipo de Caracterização
  tipoCaracterizacao: 'Autoconsumo Local',
  // RT — profissão para capa
  profissaoRT: '',
  // Módulo FV — dimensões físicas
  comprimentoPainel: '', larguraPainel: '', pesoPainel: '',
  // Caixa de medição
  tipoCaixaMedicao: 'Existente', localInstalacaoCaixa: 'Muro',
  // DSV
  temDSV: 'Não', caracteristicasDSV: '',
  // Inversor — campos extras Tabela 4 CEEE
  potMaxCCInv: '', iMaxCCInv: '', potMaxCAInv: '', iMaxCAInv: '', vCAmaxInv: '', vCAminInv: '',
};

const INITIAL_DOCS: DocsGerados = {
  diagramas: true,
  memorial: false,
  procuracao: false,
  formularioCEEE: false,
  listaRateio: false,
  instrumentoJuridico: false,
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

// ── Persistência de projetos ──────────────────────────────────────────────
const LS_PROJECTS = 'instalight_projects';

function carregarProjetos(): ProjetoSalvo[] {
  try {
    const raw = localStorage.getItem(LS_PROJECTS);
    return raw ? (JSON.parse(raw) as ProjetoSalvo[]) : [];
  } catch {
    return [];
  }
}

function persistirProjetos(projetos: ProjetoSalvo[]) {
  localStorage.setItem(LS_PROJECTS, JSON.stringify(projetos));
}

function calcularStatus(fd: FormData, docs: DocsGerados): StatusProjeto {
  if (docs.memorial && docs.procuracao && docs.formularioCEEE) return 'concluido';
  const algumCampo = fd.nomeCliente || fd.codigoUC || fd.modeloInversor || fd.modeloPainel;
  return algumCampo ? 'em_andamento' : 'rascunho';
}

function gerarLabel(fd: FormData): string {
  const nome = fd.nomeCliente?.trim() || 'Cliente não informado';
  const uc   = fd.codigoUC?.trim();
  return uc ? `${nome} — UC ${uc}` : nome;
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  // ── Autenticação interna (apenas em produção, quando APP_TOKEN configurado no proxy) ──
  const [autenticado, setAutenticado]   = useState<boolean>(
    !IS_PROD || !!sessionStorage.getItem('app_token'),
  );
  const [senhaInput, setSenhaInput]     = useState('');
  const [senhaErro, setSenhaErro]       = useState('');
  const [verificandoSenha, setVerificandoSenha] = useState(false);

  // ── Gestão de projetos ──
  const [projetos, setProjetos]           = useState<ProjetoSalvo[]>(carregarProjetos);
  const [projetoAberto, setProjetoAberto] = useState<ProjetoSalvo | null>(null);
  const [projetoIdAtual, setProjetoIdAtual]     = useState<string | null>(null);
  const [nomeProjetoAtual, setNomeProjetoAtual] = useState<string>('');

  // ── Estado central ──
  const [formData, setFormData]         = useState<FormData>(INITIAL_FORM);
  const [apiKey, setApiKey]             = useState<string>(() => localStorage.getItem(LS_KEY) ?? '');
  const [activeTab, setActiveTab]       = useState<TabId>('diagramas');
  const [toast, setToast]               = useState<Toast | null>(null);

  // Estados de geração de documentos
  const [memorialIA, setMemorialIA]               = useState('');
  const [generatingMemorial, setGeneratingMemorial] = useState(false);
  const [docsGerados, setDocsGerados]             = useState<DocsGerados>(INITIAL_DOCS);

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

  // ── Verificação da senha de acesso interno ──
  const verificarSenha = useCallback(async () => {
    if (!senhaInput.trim()) return;
    setVerificandoSenha(true);
    setSenhaErro('');
    const token = senhaInput.trim();
    try {
      const r = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-app-token': token },
        body: JSON.stringify({}),
      });
      if (r.ok) {
        sessionStorage.setItem('app_token', token);
        setAutenticado(true);
      } else {
        const data = await r.json().catch(() => ({})) as { error?: string };
        setSenhaErro(data.error ?? 'Chave de acesso incorreta.');
      }
    } catch {
      setSenhaErro('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setVerificandoSenha(false);
    }
  }, [senhaInput]);

  // ── Auto-composição do endereço a partir dos campos divididos ──
  useEffect(() => {
    if (!formData.logradouro) return; // só auto-compõe quando campos divididos estão em uso
    const partes = [
      formData.logradouro,
      formData.numEndereco,
      formData.complemento,
      formData.bairro ? `${formData.bairro}` : '',
      `${formData.cidade || 'Porto Alegre'}/RS`,
      formData.cep ? `CEP ${formData.cep}` : '',
    ].filter(Boolean);
    const composto = partes.join(', ');
    if (composto !== formData.endereco) {
      setFormData((prev) => ({ ...prev, endereco: composto }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.logradouro, formData.numEndereco, formData.complemento,
      formData.bairro, formData.cidade, formData.cep]);

  // ── Auto-salvar silenciosamente quando um documento é gerado ──
  useEffect(() => {
    if (!projetoIdAtual) return;
    const agora = new Date().toISOString();
    setProjetos((prev) => {
      const atualizado = prev.map((p) =>
        p.id === projetoIdAtual
          ? { ...p, docsGerados, atualizadoEm: agora }
          : p,
      );
      persistirProjetos(atualizado);
      return atualizado;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsGerados]);

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

  // ── Gestão de projetos ──────────────────────────────────────────────────

  const novoProjeto = useCallback(() => {
    setFormData({ ...INITIAL_FORM, dataproject: new Date().toISOString().slice(0, 10) });
    setDocsGerados(INITIAL_DOCS);
    setMemorialIA('');
    setAiFilledFields(new Set());
    setUploadedFiles([]);
    setActiveTab('diagramas');
    setProjetoIdAtual(null);
    setNomeProjetoAtual('');
    setProjetoAberto({} as ProjetoSalvo);
  }, []);

  const abrirProjeto = useCallback((proj: ProjetoSalvo) => {
    setFormData(proj.formData);
    setDocsGerados(proj.docsGerados);
    setMemorialIA('');
    setAiFilledFields(new Set());
    setUploadedFiles([]);
    setActiveTab('diagramas');
    setProjetoIdAtual(proj.id);
    setNomeProjetoAtual(proj.nomeProjeto ?? '');
    setProjetoAberto(proj);
  }, []);

  const voltarHome = useCallback(() => {
    setProjetoAberto(null);
    setProjetoIdAtual(null);
  }, []);

  const salvarProjeto = useCallback(() => {
    const agora = new Date().toISOString();
    const status = calcularStatus(formData, docsGerados);
    const label  = gerarLabel(formData);
    const documentos = uploadedFiles.map((f) => ({
      nome: f.name,
      tipo: f.type,
      tamanho: f.size,
    }));

    setProjetos((prev) => {
      let atualizado: ProjetoSalvo[];
      if (projetoIdAtual) {
        atualizado = prev.map((p) =>
          p.id === projetoIdAtual
            ? { ...p, nomeProjeto: nomeProjetoAtual, label, status, formData, docsGerados, documentos, atualizadoEm: agora }
            : p,
        );
      } else {
        const novo: ProjetoSalvo = {
          id: crypto.randomUUID(),
          nomeProjeto: nomeProjetoAtual,
          label,
          status,
          formData,
          docsGerados,
          documentos,
          criadoEm: agora,
          atualizadoEm: agora,
        };
        setProjetoIdAtual(novo.id);
        setProjetoAberto(novo);
        atualizado = [novo, ...prev];
      }
      persistirProjetos(atualizado);
      return atualizado;
    });

    setToast({ message: '💾 Projeto salvo com sucesso!', type: 'success' });
  }, [formData, docsGerados, uploadedFiles, projetoIdAtual, nomeProjetoAtual]);

  const duplicarProjeto = useCallback((proj: ProjetoSalvo) => {
    const agora = new Date().toISOString();
    const copia: ProjetoSalvo = {
      ...proj,
      id: crypto.randomUUID(),
      nomeProjeto: proj.nomeProjeto ? `${proj.nomeProjeto} (cópia)` : '',
      label: `${proj.label} (cópia)`,
      status: 'rascunho',
      docsGerados: { diagramas: true, memorial: false, procuracao: false, formularioCEEE: false, listaRateio: false, instrumentoJuridico: false },
      documentos: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    setProjetos((prev) => {
      const atualizado = [copia, ...prev];
      persistirProjetos(atualizado);
      return atualizado;
    });
    setToast({ message: '⧉ Projeto duplicado com sucesso!', type: 'success' });
  }, []);

  const excluirProjeto = useCallback((id: string) => {
    setProjetos((prev) => {
      const atualizado = prev.filter((p) => p.id !== id);
      persistirProjetos(atualizado);
      return atualizado;
    });
  }, []);

  // ── Exportação em massa (dossiê ZIP) ──
  const exportarTudo = useCallback(async () => {
    const errosCriticos = validacoes.filter((x) => x.nivel === 'erro');
    if (errosCriticos.length > 0) {
      // Avisa mas NÃO bloqueia — o usuário decide se quer exportar assim mesmo
      setToast({
        message: `⚠ Exportando com ${errosCriticos.length} pendência(s). Revise antes do protocolo CEEE.`,
        type: 'warning',
      });
    }

    setToast({
      message: 'Gerando dossiê ZIP… ⚠ Se refinaste a procuração com IA, use o botão "Exportar PDF" na aba Documentos — o ZIP usa o texto original.',
      type: 'info',
    });
    const svgString = svgRef.current
      ? new XMLSerializer().serializeToString(svgRef.current)
      : '';

    try {
      const pranchaPdfBlob = svgRef.current
        ? await pranchaSvgToPdfBlob(svgRef.current).catch(() => undefined)
        : undefined;
      await exportarDossieZip(formData, calc, memorialIA, docsGerados, svgString, pranchaPdfBlob);
      setToast({ message: '✅ Dossiê ZIP exportado com sucesso!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Erro ao gerar ZIP: ' + String(err), type: 'error' });
    }
  }, [formData, calc, memorialIA, docsGerados, validacoes]);

  // ── Documentos histórico do projeto aberto ──
  const documentosHistorico = projetoAberto && projetoIdAtual
    ? (projetos.find((p) => p.id === projetoIdAtual)?.documentos ?? [])
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  // Modal de acesso — exibido apenas em produção quando APP_TOKEN está configurado no proxy
  if (!autenticado) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">☀️</div>
            <h1 className="text-xl font-bold text-gray-900">GD Docs — Instalight Flow</h1>
            <p className="text-sm text-gray-500 mt-1">Uso interno • Acesso restrito</p>
          </div>
          <input
            type="password"
            value={senhaInput}
            onChange={(e) => setSenhaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verificarSenha()}
            placeholder="Chave de acesso"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 mb-3"
            autoFocus
          />
          {senhaErro && (
            <p className="text-xs text-red-600 mb-3">{senhaErro}</p>
          )}
          <button
            onClick={verificarSenha}
            disabled={verificandoSenha || !senhaInput.trim()}
            className="w-full bg-brand-500 text-white rounded-lg py-2.5 text-sm font-semibold
                       hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {verificandoSenha ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  // ── Home Screen ───────────────────────────────────────────────────────────
  if (!projetoAberto) {
    return (
      <>
        <HomeScreen
          projetos={projetos}
          onNovoProjeto={novoProjeto}
          onAbrirProjeto={abrirProjeto}
          onExcluirProjeto={excluirProjeto}
          onDuplicarProjeto={duplicarProjeto}
        />
        {toast && (
          <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 max-w-sm ${
              TOAST_COLORS[toast.type] ?? 'bg-gray-800'
            }`}
          >
            {toast.message}
          </div>
        )}
      </>
    );
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-gray-900 flex items-center px-4 gap-4 flex-shrink-0 border-b border-gray-800">

        {/* Botão voltar à home */}
        <button
          onClick={voltarHome}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors flex-shrink-0"
          title="Voltar para lista de projetos"
        >
          ← Projetos
        </button>

        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Nome do projeto — editável inline */}
        <input
          value={nomeProjetoAtual}
          onChange={(e) => setNomeProjetoAtual(e.target.value)}
          onBlur={salvarProjeto}
          placeholder="Nome do projeto…"
          className="bg-transparent text-white text-xs border-b border-gray-700 focus:border-brand-400 outline-none px-1 w-36 placeholder-gray-500 flex-shrink-0"
        />

        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Logo Instalight */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0"><svg width="18" height="13" viewBox="0 0 18 13" fill="none"><path d="M1 2 Q9 0 17 2" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><path d="M3 6.5 Q9 4.5 15 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><path d="M5 11 Q9 9 13 11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg></div>
          <div className="leading-none">
            <div className="text-white font-bold text-sm">GD Docs</div>
            <div className="text-brand-400 text-xs">Instalight</div>
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
                  ? 'bg-brand-500 text-white'
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
              className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded border border-gray-700 outline-none focus:border-brand-500 w-56 placeholder-gray-500"
            />
          </div>
        )}

        {/* Salvar projeto */}
        <button
          onClick={salvarProjeto}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          💾 Salvar
        </button>

        {/* Exportar Tudo */}
        <button
          onClick={exportarTudo}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 flex items-center gap-1 flex-shrink-0 transition-colors"
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
          documentosHistorico={documentosHistorico}
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
