import React, { useState } from 'react';
import type { ProjetoSalvo, StatusProjeto } from '../types';

interface HomeScreenProps {
  projetos: ProjetoSalvo[];
  onNovoProjeto: () => void;
  onAbrirProjeto: (proj: ProjetoSalvo) => void;
  onExcluirProjeto: (id: string) => void;
  onDuplicarProjeto: (proj: ProjetoSalvo) => void;
}

const STATUS_LABEL: Record<StatusProjeto, string> = {
  rascunho:     'Rascunho',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
};

const STATUS_COLORS: Record<StatusProjeto, string> = {
  rascunho:     'bg-slate-100 text-slate-600',
  em_andamento: 'bg-amber-100 text-amber-700',
  concluido:    'bg-green-100 text-green-700',
};

const STATUS_DOT: Record<StatusProjeto, string> = {
  rascunho:     'bg-slate-400',
  em_andamento: 'bg-amber-400',
  concluido:    'bg-green-500',
};

type FiltroStatus = 'todos' | StatusProjeto;
type ModoVista = 'cliente' | 'todos';

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CardProps {
  proj: ProjetoSalvo;
  onAbrir: () => void;
  onExcluir: () => void;
  onDuplicar: () => void;
  confirmandoId: string | null;
  setConfirmandoId: (id: string | null) => void;
}

const ProjectCard: React.FC<CardProps> = ({ proj, onAbrir, onExcluir, onDuplicar, confirmandoId, setConfirmandoId }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
    <div className="p-4 flex-1">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          {proj.nomeProjeto && (
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{proj.nomeProjeto}</p>
          )}
          <p className={`text-gray-600 leading-tight truncate ${proj.nomeProjeto ? 'text-xs mt-0.5' : 'font-semibold text-sm'}`}>
            {proj.formData.nomeCliente || 'Cliente não informado'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[proj.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[proj.status]}`} />
          {STATUS_LABEL[proj.status]}
        </span>
      </div>

      <div className="space-y-0.5 text-xs text-gray-500">
        {proj.formData.codigoUC && (
          <div className="flex gap-1.5">
            <span className="opacity-60">UC</span>
            <span className="font-mono text-gray-700">{proj.formData.codigoUC}</span>
          </div>
        )}
        {proj.formData.numProjeto && (
          <div className="flex gap-1.5">
            <span className="opacity-60">PE</span>
            <span>{proj.formData.numProjeto}</span>
          </div>
        )}
        {proj.formData.potenciaCAkW && proj.formData.numeroPaineis && (
          <div className="flex gap-1.5">
            <span className="opacity-60">Sistema</span>
            <span>{proj.formData.numeroPaineis} painéis · {proj.formData.potenciaCAkW} kW</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-1 flex-wrap">
        {proj.docsGerados.memorial && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">Memorial</span>}
        {proj.docsGerados.procuracao && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">Procuração</span>}
        {proj.docsGerados.formularioCEEE && <span className="px-1.5 py-0.5 bg-teal-50 text-teal-600 text-xs rounded">Form. CEEE</span>}
      </div>

      {proj.documentos.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <p className="text-xs text-gray-400 font-medium">Documentos</p>
          {proj.documentos.slice(0, 3).map((doc, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
              <span>{doc.tipo === 'application/pdf' ? '📄' : '🖼️'}</span>
              <span className="truncate">{doc.nome}</span>
              <span className="text-gray-300 flex-shrink-0">· {formatarTamanho(doc.tamanho)}</span>
            </div>
          ))}
          {proj.documentos.length > 3 && <p className="text-xs text-gray-400">+{proj.documentos.length - 3} mais</p>}
        </div>
      )}
    </div>

    <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
      <span className="text-xs text-gray-400">{formatarData(proj.atualizadoEm)}</span>
      <div className="flex items-center gap-1.5">
        {confirmandoId === proj.id ? (
          <>
            <span className="text-xs text-red-500">Confirmar?</span>
            <button onClick={onExcluir} className="text-xs text-red-500 hover:text-red-700 font-medium">Sim</button>
            <button onClick={() => setConfirmandoId(null)} className="text-xs text-gray-400 hover:text-gray-600">Não</button>
          </>
        ) : (
          <>
            <button onClick={() => setConfirmandoId(proj.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors" title="Excluir">🗑</button>
            <button onClick={onDuplicar} className="text-xs text-gray-400 hover:text-brand-600 transition-colors" title="Duplicar projeto">⧉</button>
          </>
        )}
        <button onClick={onAbrir} className="px-3 py-1 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors">
          Abrir
        </button>
      </div>
    </div>
  </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projetos,
  onNovoProjeto,
  onAbrirProjeto,
  onExcluirProjeto,
  onDuplicarProjeto,
}) => {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroStatus>('todos');
  const [modoVista, setModoVista] = useState<ModoVista>('cliente');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [clientesColapsados, setClientesColapsados] = useState<Set<string>>(new Set());

  const projetosFiltrados = projetos
    .filter((p) => {
      const matchFiltro = filtro === 'todos' || p.status === filtro;
      const tb = busca.toLowerCase();
      const matchBusca = !tb ||
        (p.nomeProjeto ?? '').toLowerCase().includes(tb) ||
        p.label.toLowerCase().includes(tb) ||
        p.formData.codigoUC.toLowerCase().includes(tb) ||
        p.formData.nomeCliente.toLowerCase().includes(tb);
      return matchFiltro && matchBusca;
    })
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));

  const contadores: Record<FiltroStatus, number> = {
    todos:        projetos.length,
    rascunho:     projetos.filter((p) => p.status === 'rascunho').length,
    em_andamento: projetos.filter((p) => p.status === 'em_andamento').length,
    concluido:    projetos.filter((p) => p.status === 'concluido').length,
  };

  // Agrupar por cliente
  const porCliente = projetosFiltrados.reduce<Record<string, ProjetoSalvo[]>>((acc, p) => {
    const c = p.formData.nomeCliente?.trim() || 'Sem cliente';
    if (!acc[c]) acc[c] = [];
    acc[c].push(p);
    return acc;
  }, {});

  const toggleCliente = (nome: string) => {
    setClientesColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome); else next.add(nome);
      return next;
    });
  };

  const renderGrid = (lista: ProjetoSalvo[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lista.map((proj) => (
        <ProjectCard
          key={proj.id}
          proj={proj}
          onAbrir={() => onAbrirProjeto(proj)}
          onExcluir={() => { onExcluirProjeto(proj.id); setConfirmandoId(null); }}
          onDuplicar={() => onDuplicarProjeto(proj)}
          confirmandoId={confirmandoId}
          setConfirmandoId={setConfirmandoId}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="h-14 bg-gray-900 flex items-center px-6 gap-4 flex-shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
              <path d="M1 2 Q9 0 17 2"       stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M3 6.5 Q9 4.5 15 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M5 11 Q9 9 13 11"     stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-white font-bold text-sm">GD Docs</div>
            <div className="text-brand-400 text-xs">Instalight</div>
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={onNovoProjeto} className="px-4 py-1.5 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center gap-1.5">
          + Novo Projeto
        </button>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Título + busca + toggle vista */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projetos</h1>
            <p className="text-sm text-gray-500">
              {projetos.length === 0 ? 'Nenhum projeto salvo ainda' : `${projetos.length} projeto${projetos.length > 1 ? 's' : ''} salvos`}
            </p>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cliente ou UC…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          {/* Toggle modo de vista */}
          <div className="flex gap-0.5 rounded-lg bg-gray-200 p-0.5">
            <button onClick={() => setModoVista('cliente')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${modoVista === 'cliente' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              👤 Por cliente
            </button>
            <button onClick={() => setModoVista('todos')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${modoVista === 'todos' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              ⊞ Todos
            </button>
          </div>
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['todos', 'rascunho', 'em_andamento', 'concluido'] as FiltroStatus[]).map((s) => (
            <button key={s} onClick={() => setFiltro(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                filtro === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}>
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s as StatusProjeto]}
              <span className="ml-1 opacity-70">({contadores[s]})</span>
            </button>
          ))}
        </div>

        {projetos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center mb-4 opacity-30">
              <svg width="32" height="24" viewBox="0 0 18 13" fill="none">
                <path d="M1 2 Q9 0 17 2"       stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M3 6.5 Q9 4.5 15 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M5 11 Q9 9 13 11"     stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhum projeto ainda</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">Crie o primeiro projeto para começar a gerar documentação fotovoltaica.</p>
            <button onClick={onNovoProjeto} className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors">
              + Criar Primeiro Projeto
            </button>
          </div>
        )}

        {projetos.length > 0 && projetosFiltrados.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum projeto encontrado com os filtros atuais.</div>
        )}

        {/* Vista: por cliente */}
        {projetosFiltrados.length > 0 && modoVista === 'cliente' && (
          <div className="space-y-6">
            {Object.entries(porCliente).map(([cliente, lista]) => (
              <div key={cliente}>
                <button
                  onClick={() => toggleCliente(cliente)}
                  className="flex items-center gap-2 mb-3 w-full text-left group"
                >
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
                    👤 {cliente}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{lista.length}</span>
                  <span className="text-xs text-gray-400 ml-auto">{clientesColapsados.has(cliente) ? '▶' : '▼'}</span>
                </button>
                {!clientesColapsados.has(cliente) && renderGrid(lista)}
              </div>
            ))}
          </div>
        )}

        {/* Vista: todos flat */}
        {projetosFiltrados.length > 0 && modoVista === 'todos' && renderGrid(projetosFiltrados)}
      </div>
    </div>
  );
};
