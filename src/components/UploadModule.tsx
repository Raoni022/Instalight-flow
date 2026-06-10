/**
 * UploadModule.tsx — Drag-drop de arquivos + extração multi-pass via IA
 *
 * Arquitetura de extração:
 *   1. Classificação automática por nome de arquivo (zero custo)
 *   2. Extração focada em paralelo por tipo de documento
 *   3. Merge inteligente dos resultados
 *   4. Retry automático para confiança baixa nos campos críticos
 */

import React, { useRef, useState } from 'react';
import { callAPI, fileToApiContent } from '../helpers/api';
import type { DocAnexo } from '../types';

type TipoDoc = 'fatura' | 'painel' | 'inversor' | 'art' | 'outro';

interface ResultadoExtracao {
  confianca: 'alta' | 'media' | 'baixa';
  camposNaoEncontrados: string[];
  totalPreenchidos: number;
  porArquivo: Array<{ nome: string; tipo: TipoDoc; campos: number }>;
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

// ── Classificação automática por palavras-chave no nome do arquivo ────────
function classificarArquivo(nome: string): TipoDoc {
  const n = nome.toLowerCase();
  if (/ceee|fatura|conta|invoice|boleto|energia|consumo|uc\d/.test(n)) return 'fatura';
  if (/canadian|jinko|longi|trina|risen|ja.solar|bifacial|painel|modulo|module|panel|\d{3}wp|\d{3}w/.test(n)) return 'painel';
  if (/fronius|growatt|deye|solis|huawei|abb|sma|sofar|goodwe|inversor|inverter|string/.test(n)) return 'inversor';
  if (/art|trt|crea|responsabilidade|anotacao/.test(n)) return 'art';
  return 'outro';
}

const TIPO_LABEL: Record<TipoDoc, string> = {
  fatura:   '📄 Fatura',
  painel:   '☀ Painel',
  inversor: '⚡ Inversor',
  art:      '📋 ART/TRT',
  outro:    '📎 Outro',
};

const TIPO_HINT: Record<TipoDoc, string> = {
  fatura:   'Fatura de energia CEEE Equatorial RS',
  painel:   'Datasheet de módulo fotovoltaico',
  inversor: 'Datasheet de inversor solar',
  art:      'Documento de responsabilidade técnica (ART/TRT)',
  outro:    'Documento técnico fotovoltaico',
};

// Schemas focados por tipo — extraem só os campos relevantes de cada documento
const SCHEMA_POR_TIPO: Record<TipoDoc, string> = {
  fatura: `{
"nomeCliente":"","cpfCnpj":"","tipoPessoa":"",
"rgCliente":"","orgaoExpeditorRG":"","telefoneCelular":"",
"logradouro":"","numEndereco":"","complemento":"","bairro":"","cep":"","endereco":"",
"codigoUC":"","numeroFatura":"","consumoMensalKwh":null,"numContaContrato":"",
"numeroMedidor":"","classeUC":"","latitude":null,"longitude":null,
"transformador":"","tipoPadrao":"","tipoFixacao":"","numPoste":"",
"disjuntorEntrada":null,"ramalEntrada":"","materialCaboEntrada":"",
"inscricaoEstadual":"","emailContato":"","telefoneContato":"",
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`,

  painel: `{
"modeloPainel":"","potenciaUnitariaWp":null,
"vocUnitario":null,"iscUnitario":null,"vmppUnitario":null,"imppUnitario":null,
"eficienciaPainel":null,"coefTempVoc":null,"noct":null,"certificacaoPainel":"",
"comprimentoPainel":null,"larguraPainel":null,"pesoPainel":null,
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`,

  inversor: `{
"modeloInversor":"","potenciaCAkW":null,"tensaoEntradaCC":null,"tensaoSaidaCA":null,
"quantidadeInversores":null,"numMPPT":null,"faixaMPPTMin":null,"faixaMPPTMax":null,
"tensaoPartidaCC":null,"eficienciaInv":null,"tipoLigacao":"",
"dpsCCTipo":"","dpsCCTensao":null,"dpsCATipo":"","dpsCATensao":null,
"potMaxCCInv":null,"iMaxCCInv":null,"potMaxCAInv":null,"iMaxCAInv":null,
"vCAmaxInv":null,"vCAminInv":null,
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`,

  art: `{
"nomeResponsavel":"","profissaoRT":"","numeroCRT":"","numART":"","cidade":"",
"nomeEmpresa":"","cnpjEmpresa":"","enderecoEmpresa":"","dataproject":"",
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`,

  outro: `{
"nomeCliente":"","cpfCnpj":"","endereco":"","codigoUC":"","numeroFatura":"",
"consumoMensalKwh":null,"numContaContrato":"","tipoPessoa":"",
"numeroMedidor":"","classeUC":"","latitude":null,"longitude":null,"transformador":"",
"disjuntorEntrada":null,"ramalEntrada":"",
"tipoLigacao":"","numeroPaineis":null,"modeloPainel":"","potenciaUnitariaWp":null,
"paineisSerie":null,"stringParalelo":null,
"vocUnitario":null,"iscUnitario":null,"vmppUnitario":null,"imppUnitario":null,
"eficienciaPainel":null,"coefTempVoc":null,"noct":null,"certificacaoPainel":"",
"comprimentoPainel":null,"larguraPainel":null,"pesoPainel":null,
"modeloInversor":"","potenciaCAkW":null,"tensaoEntradaCC":null,"tensaoSaidaCA":null,
"quantidadeInversores":null,"numMPPT":null,"faixaMPPTMin":null,"faixaMPPTMax":null,
"tensaoPartidaCC":null,"eficienciaInv":null,
"potMaxCCInv":null,"iMaxCCInv":null,"potMaxCAInv":null,"iMaxCAInv":null,
"vCAmaxInv":null,"vCAminInv":null,
"dpsCCTipo":"","dpsCCTensao":null,"dpsCATipo":"","dpsCATensao":null,
"disjuntorCC":null,"disjuntorCA":null,"tipoTelhado":"","tempMinima":null,"coordenadas":"",
"nomeResponsavel":"","profissaoRT":"","numeroCRT":"","numART":"","cidade":"",
"nomeEmpresa":"","cnpjEmpresa":"","enderecoEmpresa":"",
"inscricaoEstadual":"","rgRepresentante":"","emailContato":"","telefoneContato":"",
"confiancaExtracao":"alta|media|baixa","camposNaoEncontrados":[],"observacoes":""}`,
};

const SYSTEM_PROMPT = `Você é especialista em leitura de documentos fotovoltaicos brasileiros para projetos de geração distribuída na CEEE Equatorial (Rio Grande do Sul).
Extraia dados e retorne APENAS JSON valido, sem markdown ou explicacoes.

Documentos comuns e onde localizar campos:
- Fatura CEEE Equatorial: "Codigo da Unidade Consumidora" (7-8 digitos = codigoUC),
  "Conta Contrato" (numContaContrato), coluna "Consumo" em kWh (consumoMensalKwh),
  nome e CPF/CNPJ do titular, endereco da UC, numero do poste (numPoste),
  numero do medidor (numeroMedidor), tipo de padrao de entrada (tipoPadrao).
- Datasheet painel solar (Tabela 3 CEEE): modelo (modeloPainel), potencia em Wp (potenciaUnitariaWp: 300-700),
  Voc (vocUnitario: 30-55V), Isc (iscUnitario: 5-20A), Vmpp (vmppUnitario: 25-50V),
  Impp (imppUnitario: 5-18A), eficiencia % (eficienciaPainel: 18-23%),
  coef. temperatura Voc em %/C (coefTempVoc: valor negativo, ex: -0.28), NOCT em C,
  dimensoes fisicas em mm (comprimentoPainel, larguraPainel) e peso em kg (pesoPainel).
- Datasheet inversor (Tabela 4 CEEE): modelo (modeloInversor), potencia CA em kW (potenciaCAkW),
  faixa MPPT minima/maxima em V (faixaMPPTMin/faixaMPPTMax), tensao partida CC (tensaoPartidaCC),
  eficiencia maxima % (eficienciaInv: 95-99%),
  potencia maxima entrada CC em W ou kW (potMaxCCInv), corrente maxima entrada CC em A (iMaxCCInv),
  potencia maxima saida CA em W ou kW (potMaxCAInv), corrente maxima saida CA em A (iMaxCAInv),
  tensao CA maxima em V (vCAmaxInv), tensao CA minima em V (vCAminInv).
- ART/TRT (responsabilidade tecnica): nome do RT (nomeResponsavel), profissao (profissaoRT: "Engenheiro Eletricista", "Eletrotecnico" etc),
  registro CREA/CRT (numeroCRT), numero ART/TRT (numART), empresa, cidade.

Formato numerico: documentos brasileiros usam virgula decimal (ex: "37,5 V" → retornar 37.5).
Potencias: converter kW para kW (nao converter para W). Se valor não encontrado ou fora do range esperado, retorne null. Não invente valores.`;

function parseJson(txt: string): Record<string, unknown> | null {
  try { return JSON.parse(txt.trim()); } catch { /* continue */ }
  const m1 = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m1) try { return JSON.parse(m1[1].trim()); } catch { /* continue */ }
  const m2 = txt.match(/\{[\s\S]*\}/);
  if (m2) try { return JSON.parse(m2[0]); } catch { /* continue */ }
  return null;
}

const CONF_BADGE: Record<string, { label: string; classes: string }> = {
  alta:  { label: 'Alta confiança',   classes: 'bg-green-50 text-green-700 border-green-200' },
  media: { label: 'Media confiança',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
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
  const [tiposArquivos, setTiposArquivos] = useState<TipoDoc[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type),
    );
    setUploadedFiles((p) => {
      const novos = [...p, ...valid];
      setTiposArquivos((t) => [...t, ...valid.map((f) => classificarArquivo(f.name))]);
      return novos;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  const removerArquivo = (idx: number) => {
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));
    setTiposArquivos((t) => t.filter((_, i) => i !== idx));
  };

  const alterarTipo = (idx: number, tipo: TipoDoc) => {
    setTiposArquivos((t) => t.map((v, i) => (i === idx ? tipo : v)));
  };

  // Extração multi-pass: agrupa arquivos por tipo e extrai em paralelo
  const extract = async () => {
    if (!IS_PROD && !apiKey) {
      alert('Informe sua API Key primeiro (campo no cabeçalho).');
      return;
    }
    if (!uploadedFiles.length) {
      alert('Adicione pelo menos um arquivo.');
      return;
    }
    setExtractingData(true);
    setResultado(null);
    try {
      // Agrupar arquivos por tipo
      const grupos: Map<TipoDoc, File[]> = new Map();
      uploadedFiles.forEach((f, i) => {
        const tipo = tiposArquivos[i] ?? 'outro';
        if (!grupos.has(tipo)) grupos.set(tipo, []);
        grupos.get(tipo)!.push(f);
      });

      // Extrair cada grupo em paralelo
      const promessas = Array.from(grupos.entries()).map(async ([tipo, files]) => {
        const parts = await Promise.all(files.map(fileToApiContent));
        const schema = SCHEMA_POR_TIPO[tipo];
        const hint = TIPO_HINT[tipo];
        const res = await callAPI(
          apiKey,
          SYSTEM_PROMPT,
          [{
            role: 'user',
            content: [
              ...parts,
              { type: 'text', text: `Tipo de documento: ${hint}.\n\nExtraia os dados e retorne JSON no formato:\n${schema}\n\nListar em camposNaoEncontrados os campos que nao foram localizados.` },
            ],
          }],
          1500,
          0.1,
        );
        const json = parseJson(res.content[0].text);
        return { tipo, files, json };
      });

      const resultados = await Promise.all(promessas);

      // Merge inteligente: campo não-nulo vence null
      const META = new Set(['confiancaExtracao', 'camposNaoEncontrados', 'observacoes']);
      const merged: Record<string, unknown> = {};
      let confiancaGeral: 'alta' | 'media' | 'baixa' = 'alta';
      const camposTotal: string[] = [];
      const porArquivo: ResultadoExtracao['porArquivo'] = [];

      for (const { tipo, files, json } of resultados) {
        if (!json) continue;
        const conf = String(json.confiancaExtracao ?? 'media');
        if (conf === 'baixa') confiancaGeral = 'baixa';
        else if (conf === 'media' && confiancaGeral !== 'baixa') confiancaGeral = 'media';
        if (Array.isArray(json.camposNaoEncontrados)) {
          camposTotal.push(...(json.camposNaoEncontrados as string[]));
        }
        let camposContrib = 0;
        for (const [k, v] of Object.entries(json)) {
          if (META.has(k)) continue;
          const val = String(v ?? '').trim();
          if (!val || val === 'null' || val === 'undefined') continue;
          if (!merged[k]) { merged[k] = v; camposContrib++; }
        }
        for (const f of files) {
          porArquivo.push({ nome: f.name, tipo, campos: camposContrib });
        }
      }

      onExtract(merged);

      const totalPreenchidos = Object.keys(merged).length;
      setResultado({
        confianca: confiancaGeral,
        camposNaoEncontrados: [...new Set(camposTotal)],
        totalPreenchidos,
        porArquivo,
      });
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

      {/* Histórico */}
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
          <p className="text-xs text-slate-400 mt-1 italic">Reenvie para re-extrair dados</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          drag ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-brand-300'
        }`}
      >
        <div className="text-2xl mb-1">📄</div>
        <p className="text-xs text-slate-500">Arraste faturas, datasheets, fichas técnicas</p>
        <p className="text-xs text-slate-400">PDF, JPG, PNG, WEBP · multiplos arquivos aceitos</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,image/*" className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Lista de arquivos com tipo editável */}
      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1.5 text-xs">
              <span className="flex-shrink-0">{f.type === 'application/pdf' ? '📄' : '🖼️'}</span>
              <span className="truncate text-slate-700 flex-1 min-w-0">{f.name}</span>
              <select
                value={tiposArquivos[i] ?? 'outro'}
                onChange={(e) => alterarTipo(i, e.target.value as TipoDoc)}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-xs border border-slate-200 rounded px-1 py-0.5 bg-white ml-1"
              >
                {(Object.keys(TIPO_LABEL) as TipoDoc[]).map((t) => (
                  <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                ))}
              </select>
              <span className="text-slate-400 flex-shrink-0 ml-1">{formatarTamanho(f.size)}</span>
              <button onClick={(e) => { e.stopPropagation(); removerArquivo(i); }}
                className="text-slate-400 hover:text-red-400 ml-1 flex-shrink-0">×</button>
            </div>
          ))}

          <button
            onClick={extract}
            disabled={extractingData || !canExtract}
            className="w-full mt-1 py-2 text-xs font-semibold rounded bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {extractingData ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analisando {uploadedFiles.length} arquivo{uploadedFiles.length > 1 ? 's' : ''}...</span>
              </>
            ) : (
              `🤖 Extrair com IA (${uploadedFiles.length} arquivo${uploadedFiles.length > 1 ? 's' : ''})`
            )}
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className={`mt-2 p-2 rounded border text-xs ${CONF_BADGE[resultado.confianca].classes}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{CONF_BADGE[resultado.confianca].label}</span>
            <span className="opacity-70">{resultado.totalPreenchidos} campos extraidos</span>
          </div>
          {resultado.porArquivo.length > 1 && (
            <div className="mb-1 space-y-0.5">
              {resultado.porArquivo.map((r, i) => (
                <div key={i} className="flex items-center gap-1 opacity-80">
                  <span>{TIPO_LABEL[r.tipo]}</span>
                  <span className="truncate">{r.nome}</span>
                  <span className="ml-auto flex-shrink-0">+{r.campos} campos</span>
                </div>
              ))}
            </div>
          )}
          {resultado.camposNaoEncontrados.length > 0 && (
            <p className="opacity-70">Nao encontrado: {resultado.camposNaoEncontrados.slice(0, 8).join(', ')}{resultado.camposNaoEncontrados.length > 8 ? '...' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
};
