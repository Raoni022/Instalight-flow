/**
 * UploadModule.tsx — Drag-drop de arquivos + extração de dados via IA
 *
 * Aceita: PDF, JPG, PNG, WEBP
 * Extração: envia para callAPI e preenche formData via onExtract callback.
 * Usa 3-step JSON fallback idêntico ao HTML original.
 */

import React, { useRef, useState } from 'react';
import { callAPI, fileToApiContent } from '../helpers/api';

interface UploadModuleProps {
  apiKey: string;
  onExtract: (json: Record<string, unknown>) => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  extractingData: boolean;
  setExtractingData: React.Dispatch<React.SetStateAction<boolean>>;
}

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

const SCHEMA = `{
"nomeCliente":"","cpfCnpj":"","endereco":"","codigoUC":"","numeroFatura":"",
"tipoLigacao":"","numeroPaineis":null,"modeloPainel":"","potenciaUnitariaWp":null,
"paineisSerie":null,"stringParalelo":null,
"modeloInversor":"","potenciaCAkW":null,"tensaoEntradaCC":null,"tensaoSaidaCA":null,
"quantidadeInversores":null,"dpsCCTipo":"","dpsCCTensao":null,
"dpsCATipo":"","dpsCATensao":null,"disjuntorCC":null,"disjuntorCA":null,
"aterramento":"","nomeResponsavel":"","numeroCRT":"","cidade":"",
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`;

export const UploadModule: React.FC<UploadModuleProps> = ({
  apiKey,
  onExtract,
  uploadedFiles,
  setUploadedFiles,
  extractingData,
  setExtractingData,
}) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type),
    );
    setUploadedFiles((p) => [...p, ...valid]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  const extract = async () => {
    if (!IS_PROD && !apiKey) {
      alert('Informe sua API Key primeiro (campo 🔑 no cabeçalho).');
      return;
    }
    if (!uploadedFiles.length) {
      alert('Adicione pelo menos um arquivo.');
      return;
    }
    setExtractingData(true);
    try {
      const parts = await Promise.all(uploadedFiles.map(fileToApiContent));

      const res = await callAPI(
        apiKey,
        'Você é um assistente especializado em extração de dados de documentos de sistemas fotovoltaicos. Extraia exatamente os dados solicitados e retorne APENAS JSON válido, sem markdown.',
        [
          {
            role: 'user',
            content: [
              ...parts,
              {
                type: 'text',
                text: `Extraia os dados técnicos e do cliente destes documentos e retorne JSON no formato exato:\n${SCHEMA}\n\nSe um campo não for encontrado, deixe null ou "". Informe confiancaExtracao com base na qualidade dos dados encontrados.`,
              },
            ],
          },
        ],
        2000,
      );

      const txt: string = res.content[0].text;

      // 3-step JSON fallback
      let json: Record<string, unknown> | null = null;
      try { json = JSON.parse(txt.trim()); } catch { /* try next */ }
      if (!json) {
        const m = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (m) try { json = JSON.parse(m[1].trim()); } catch { /* try next */ }
      }
      if (!json) {
        const m = txt.match(/\{[\s\S]*\}/);
        if (m) try { json = JSON.parse(m[0]); } catch { /* fail */ }
      }
      if (!json) throw new Error('IA retornou formato inválido. Verifique a chave e tente novamente.');

      onExtract(json);
    } catch (e: unknown) {
      alert('Erro ao extrair dados: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExtractingData(false);
    }
  };

  const canExtract = IS_PROD || !!apiKey;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Extração de Dados por IA
        </span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          drag ? 'border-orange-400 bg-orange-50' : 'border-slate-300 hover:border-orange-300'
        }`}
      >
        <div className="text-2xl mb-1">📄</div>
        <p className="text-xs text-slate-500">Arraste faturas, datasheets, fichas técnicas</p>
        <p className="text-xs text-slate-400">PDF, JPG, PNG, WEBP</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1 text-xs">
              <span className="truncate text-slate-700">
                {f.type === 'application/pdf' ? '📄' : '🖼️'} {f.name}
              </span>
              <button
                onClick={() => setUploadedFiles((p) => p.filter((_, j) => j !== i))}
                className="text-slate-400 hover:text-red-400 ml-1"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={extract}
            disabled={extractingData || !canExtract}
            className="w-full mt-1 py-2 text-xs font-semibold rounded bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {extractingData ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analisando…</span>
              </>
            ) : (
              '🤖 Extrair dados com IA'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
