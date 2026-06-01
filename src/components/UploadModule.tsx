/**
 * UploadModule.tsx — Drag-drop de arquivos + extração de dados via IA
 *
 * Aceita: PDF, JPG, PNG, WEBP
 * Extração: envia para callAPI e preenche formData via onExtract callback.
 * Usa 3-step JSON fallback idêntico ao HTML original.
 */

import React, { useRef, useState } from 'react';
import { callAPI, fileToApiContent } from '../helpers/api';
import type { DocAnexo } from '../types';

interface ResultadoExtracao {
  confianca: 'alta' | 'media' | 'baixa';
  camposNaoEncontrados: string[];
  totalPreenchidos: number;
}

interface UploadModuleProps {
  apiKey: string;
  onExtract: (json: Record<string, unknown>) => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  extractingData: boolean;
  setExtractingData: React.Dispatch<React.SetStateAction<boolean>>;
  documentosHistorico?: DocAnexo[];
}

const IS_PROD =
  window.location.protocol === 'https:' &&
  !window.location.hostname.includes('localhost');

const SCHEMA = `{
"tipoPessoa":"","tipoInstalacao":"",
"nomeCliente":"","cpfCnpj":"","endereco":"","codigoUC":"","numeroFatura":"",
"consumoMensalKwh":null,"numContaContrato":"",
"tipoLigacao":"","numeroPaineis":null,"modeloPainel":"","potenciaUnitariaWp":null,
"paineisSerie":null,"stringParalelo":null,
"vocUnitario":null,"iscUnitario":null,"vmppUnitario":null,"imppUnitario":null,
"eficienciaPainel":null,"coefTempVoc":null,
"modeloInversor":"","potenciaCAkW":null,"tensaoEntradaCC":null,"tensaoSaidaCA":null,
"quantidadeInversores":null,"numMPPT":null,"faixaMPPTMin":null,"faixaMPPTMax":null,
"tensaoPartidaCC":null,"eficienciaInv":null,
"dpsCCTipo":"","dpsCCTensao":null,"dpsCATipo":"","dpsCATensao":null,
"disjuntorCC":null,"disjuntorCA":null,"tipoTelhado":"",
"tempMinima":null,"coordenadas":"",
"nomeResponsavel":"","numeroCRT":"","numART":"","numProjeto":"","cidade":"",
"nomeEmpresa":"","cnpjEmpresa":"","enderecoEmpresa":"",
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`;

const CONF_BADGE: Record<string, { label: string; classes: string }> = {
  alta:  { label: 'Alta confiança',   classes: 'bg-green-50 text-green-700 border-green-200' },
  media: { label: 'Média confiança',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  baixa: { label: 'Baixa confiança',  classes: 'bg-red-50 text-red-600 border-red-200' },
};

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const UploadModule: React.FC<UploadModuleProps> = ({
  apiKey,
  onExtract,
  uploadedFiles,
  setUploadedFiles,
  extractingData,
  setExtractingData,
  documentosHistorico = [],
}) => {
  const [drag, setDrag] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExtracao | null>(null);
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
    setResultado(null);
    try {
      const parts = await Promise.all(uploadedFiles.map(fileToApiContent));

      const systemPrompt = `Você é especialista em leitura de documentos fotovoltaicos brasileiros. \
Extraia dados e retorne APENAS JSON válido, sem markdown ou explicações.

Documentos comuns e onde localizar campos:
• Fatura CEEE Equatorial: "Código da Unidade Consumidora" (7-8 dígitos = codigoUC), \
"Conta Contrato" (numContaContrato), coluna "Consumo" em kWh (consumoMensalKwh), \
nome e CPF/CNPJ do titular, endereço da UC.
• Datasheet painel solar: modelo (modeloPainel), potência em Wp (potenciaUnitariaWp: 300-700), \
Voc (vocUnitario: 30-55V), Isc (iscUnitario: 5-20A), Vmpp (vmppUnitario: 25-50V), \
Impp (imppUnitario: 5-18A), eficiência % (eficienciaPainel: 18-23%), \
coef. temperatura Voc em %/°C (coefTempVoc: valor negativo, ex: -0.28).
• Datasheet inversor: modelo (modeloInversor), potência CA em kW (potenciaCAkW), \
faixa MPPT mínima/máxima em V (faixaMPPTMin/faixaMPPTMax), tensão partida CC (tensaoPartidaCC), \
eficiência máxima % (eficienciaInv: 95-99%).

Formato numérico: documentos brasileiros usam vírgula decimal (ex: "37,5 V" → retornar 37.5). \
Se valor não encontrado ou fora do range esperado, retorne null. Não invente valores.`;

      const userText = `Extraia os dados destes documentos e retorne JSON no formato exato:\n${SCHEMA}\n\n\
Informe confiancaExtracao com base na qualidade dos dados encontrados. \
Liste em camposNaoEncontrados os campos importantes que não foram localizados. \
Atenção: se encontrar potenciaUnitariaWp fora de 250-800W, vocUnitario fora de 25-60V, \
ou iscUnitario fora de 3-20A, liste esses campos em camposNaoEncontrados (valor suspeito).`;

      const res = await callAPI(
        apiKey,
        systemPrompt,
        [
          {
            role: 'user',
            content: [
              ...parts,
              { type: 'text', text: userText },
            ],
          },
        ],
        2000,
        0.1,
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

      const confianca = (['alta', 'media', 'baixa'].includes(String(json.confiancaExtracao))
        ? json.confiancaExtracao
        : 'media') as 'alta' | 'media' | 'baixa';

      const camposNaoEncontrados = Array.isArray(json.camposNaoEncontrados)
        ? (json.camposNaoEncontrados as string[])
        : [];

      onExtract(json);

      // Conta campos preenchidos (exclui metadados de extração)
      const metaCampos = new Set(['confiancaExtracao', 'camposNaoEncontrados', 'observacoes']);
      const totalPreenchidos = Object.entries(json).filter(
        ([k, v]) => !metaCampos.has(k) && v !== null && v !== '' && v !== undefined,
      ).length;

      setResultado({ confianca, camposNaoEncontrados, totalPreenchidos });
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

      {/* Documentos do histórico (salvos no projeto) */}
      {documentosHistorico.length > 0 && uploadedFiles.length === 0 && (
        <div className="mb-2 p-2 bg-slate-50 rounded border border-slate-200">
          <p className="text-xs text-slate-500 mb-1 font-medium">Documentos anteriores (histórico)</p>
          {documentosHistorico.map((doc, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-slate-500 py-0.5">
              <span>{doc.tipo === 'application/pdf' ? '📄' : '🖼️'}</span>
              <span className="truncate">{doc.nome}</span>
              <span className="text-slate-300">· {formatarTamanho(doc.tamanho)}</span>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-1 italic">Reenvie os arquivos para re-extrair dados</p>
        </div>
      )}

      {/* Drop zone */}
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
        <p className="text-xs text-slate-400">PDF, JPG, PNG, WEBP · múltiplos arquivos aceitos</p>
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
              <div className="flex items-center gap-2 ml-1 flex-shrink-0">
                <span className="text-slate-400">{formatarTamanho(f.size)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFiles((p) => p.filter((_, j) => j !== i)); }}
                  className="text-slate-400 hover:text-red-400"
                >
                  ×
                </button>
              </div>
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
                <span>Analisando {uploadedFiles.length} arquivo{uploadedFiles.length > 1 ? 's' : ''}…</span>
              </>
            ) : (
              `🤖 Extrair dados com IA (${uploadedFiles.length} arquivo${uploadedFiles.length > 1 ? 's' : ''})`
            )}
          </button>
        </div>
      )}

      {/* Resultado da extração */}
      {resultado && (
        <div className={`mt-2 p-2 rounded border text-xs ${CONF_BADGE[resultado.confianca].classes}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{CONF_BADGE[resultado.confianca].label}</span>
            <span className="opacity-70">{resultado.totalPreenchidos} campo{resultado.totalPreenchidos !== 1 ? 's' : ''} extraído{resultado.totalPreenchidos !== 1 ? 's' : ''}</span>
          </div>
          {resultado.camposNaoEncontrados.length > 0 && (
            <p className="opacity-70">
              Não encontrado: {resultado.camposNaoEncontrados.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
