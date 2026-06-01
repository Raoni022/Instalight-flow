import React, { useState } from 'react';
import type { ProjetoSalvo, StatusProjeto } from '../types';

interface HomeScreenProps {
  projetos: ProjetoSalvo[];
  onNovoProjeto: () => void;
  onAbrirProjeto: (proj: ProjetoSalvo) => void;
  onExcluirProjeto: (id: string) => void;
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

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projetos,
  onNovoProjeto,
  onAbrirProjeto,
  onExcluirProjeto,
}) => {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroStatus>('todos');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const projetosFiltrados = projetos.filter((p) => {
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    const termoBusca = busca.toLowerCase();
    const matchBusca =
      !termoBusca ||
      p.label.toLowerCase().includes(termoBusca) ||
      p.formData.codigoUC.toLowerCase().includes(termoBusca) ||
      p.formData.nomeCliente.toLowerCase().includes(termoBusca);
    return matchFiltro && matchBusca;
  });

  const contadores: Record<FiltroStatus, number> = {
    todos:        projetos.length,
    rascunho:     projetos.filter((p) => p.status === 'rascunho').length,
    em_andamento: projetos.filter((p) => p.status === 'em_andamento').length,
    concluido:    projetos.filter((p) => p.status === 'concluido').length,
  };

  const handleExcluir = (id: string) => {
    if (confirmandoId === id) {
      onExcluirProjeto(id);
      setConfirmandoId(null);
    } else {
      setConfirmandoId(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Header */}
      <header className="h-14 bg-gray-900 flex items-center px-6 gap-4 flex-shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm select-none">
            ☀
          </div>
          <div className="leading-none">
            <div className="text-white font-bold text-sm">GD Docs</div>
            <div className="text-orange-400 text-xs">Instalight</div>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onNovoProjeto}
          className="px-4 py-1.5 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-1.5"
        >
          + Novo Projeto
        </button>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* Título + busca */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projetos</h1>
            <p className="text-sm text-gray-500">
              {projetos.length === 0
                ? 'Nenhum projeto salvo ainda'
                : `${projetos.length} projeto${projetos.length > 1 ? 's' : ''} salvos`}
            </p>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente ou UC…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['todos', 'rascunho', 'em_andamento', 'concluido'] as FiltroStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                filtro === s
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s as StatusProjeto]}
              <span className="ml-1 opacity-70">({contadores[s]})</span>
            </button>
          ))}
        </div>

        {/* Estado vazio */}
        {projetos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-20">☀</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhum projeto ainda</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Crie o primeiro projeto para começar a gerar documentação fotovoltaica.
            </p>
            <button
              onClick={onNovoProjeto}
              className="px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
            >
              + Criar Primeiro Projeto
            </button>
          </div>
        )}

        {/* Resultado vazio após busca/filtro */}
        {projetos.length > 0 && projetosFiltrados.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhum projeto encontrado com os filtros atuais.
          </div>
        )}

        {/* Grid de cards */}
        {projetosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projetosFiltrados
              .slice()
              .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
              .map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Cabeçalho do card */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                        {proj.formData.nomeCliente || 'Cliente não informado'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[proj.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[proj.status]}`} />
                        {STATUS_LABEL[proj.status]}
                      </span>
                    </div>

                    {/* Infos rápidas */}
                    <div className="space-y-1">
                      {proj.formData.codigoUC && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="opacity-60">UC</span>
                          <span className="font-mono text-gray-700">{proj.formData.codigoUC}</span>
                        </div>
                      )}
                      {proj.formData.numProjeto && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="opacity-60">Proj.</span>
                          <span className="text-gray-700">{proj.formData.numProjeto}</span>
                        </div>
                      )}
                      {proj.formData.potenciaCAkW && proj.formData.numeroPaineis && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="opacity-60">Sistema</span>
                          <span className="text-gray-700">
                            {proj.formData.numeroPaineis} painéis · {proj.formData.potenciaCAkW} kW
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Docs gerados */}
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {proj.docsGerados.memorial && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">Memorial</span>
                      )}
                      {proj.docsGerados.procuracao && (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">Procuração</span>
                      )}
                      {proj.docsGerados.formularioCEEE && (
                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-600 text-xs rounded">Form. CEEE</span>
                      )}
                    </div>

                    {/* Documentos anexados */}
                    {proj.documentos.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-400 font-medium">Documentos</p>
                        {proj.documentos.map((doc, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{doc.tipo === 'application/pdf' ? '📄' : '🖼️'}</span>
                            <span className="truncate">{doc.nome}</span>
                            <span className="text-gray-300 flex-shrink-0">· {formatarTamanho(doc.tamanho)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rodapé do card */}
                  <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatarData(proj.atualizadoEm)}
                    </span>
                    <div className="flex items-center gap-2">
                      {confirmandoId === proj.id ? (
                        <>
                          <span className="text-xs text-red-500">Confirmar?</span>
                          <button
                            onClick={() => handleExcluir(proj.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Não
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleExcluir(proj.id)}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                          title="Excluir projeto"
                        >
                          🗑
                        </button>
                      )}
                      <button
                        onClick={() => onAbrirProjeto(proj)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
