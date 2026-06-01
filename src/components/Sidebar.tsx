/**
 * Sidebar.tsx — Painel lateral com formulário, validação e upload
 *
 * 8 seções colapsáveis:
 *   Cliente | Sistema FV | Inversor | Cabos | Proteções |
 *   Instalação | Empresa Instaladora | Responsável Técnico
 */

import React from 'react';
import type { FormData, Calculos, ValidationIssue, DocAnexo } from '../types';
import { ValidationPanel } from './ValidationPanel';
import { UploadModule } from './UploadModule';
import { CollapsibleSection } from './CollapsibleSection';
import { FormField } from './FormField';

interface SidebarProps {
  fd: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  calc: Calculos;
  validacoes: ValidationIssue[];
  apiKey: string;
  onExtract: (json: Record<string, unknown>) => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  extractingData: boolean;
  setExtractingData: React.Dispatch<React.SetStateAction<boolean>>;
  aiFilledFields: Set<string>;
  documentosHistorico?: DocAnexo[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  fd,
  onChange,
  calc,
  validacoes,
  apiKey,
  onExtract,
  uploadedFiles,
  setUploadedFiles,
  extractingData,
  setExtractingData,
  aiFilledFields,
  documentosHistorico = [],
}) => (
  <div className="w-96 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
    <ValidationPanel issues={validacoes} />

    <div className="p-3">
      <UploadModule
        apiKey={apiKey}
        onExtract={onExtract}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        extractingData={extractingData}
        setExtractingData={setExtractingData}
        documentosHistorico={documentosHistorico}
      />

      {/* ── CLIENTE ── */}
      <CollapsibleSection title="Cliente" icon="👤" defaultOpen>
        <FormField label="Tipo de Pessoa" name="tipoPessoa" value={fd.tipoPessoa} onChange={onChange}
          options={['fisica', 'juridica']} aiFields={aiFilledFields} />
        <FormField label="Tipo de Instalação" name="tipoInstalacao" value={fd.tipoInstalacao} onChange={onChange}
          options={['Nova', 'Ampliação']} aiFields={aiFilledFields} />
        <FormField label="Nome / Razão Social" name="nomeCliente" value={fd.nomeCliente} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label={fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} name="cpfCnpj" value={fd.cpfCnpj} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Endereço da UC" name="endereco" value={fd.endereco} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Código UC" name="codigoUC" value={fd.codigoUC} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Conta-Contrato UC" name="numContaContrato" value={fd.numContaContrato} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: 12345678" />
        <FormField label="Nº Fatura" name="numeroFatura" value={fd.numeroFatura} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Consumo médio mensal (kWh)" name="consumoMensalKwh" value={fd.consumoMensalKwh} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 350" />
        <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Medição e Entrada</div>
        <FormField label="Nº do Medidor" name="numeroMedidor" value={fd.numeroMedidor} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: 12345678" />
        <FormField label="Classe da UC" name="classeUC" value={fd.classeUC} onChange={onChange}
          options={['Residencial','Comercial','Industrial','Rural','Poder Público','Iluminação Pública']} aiFields={aiFilledFields} />
        <FormField label="Transformador (ID)" name="transformador" value={fd.transformador} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: TR-4521" />
        <FormField label="DJ Entrada (A)" name="disjuntorEntrada" value={fd.disjuntorEntrada} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 63" />
        <FormField label="Ramal de Entrada" name="ramalEntrada" value={fd.ramalEntrada} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: #25mm²" />
        <FormField label="Latitude" name="latitude" value={fd.latitude} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: -30.0368" />
        <FormField label="Longitude" name="longitude" value={fd.longitude} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: -51.2090" />
        {fd.tipoPessoa === 'juridica' && (
          <>
            <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Representante Legal</div>
            <FormField label="Nome do Representante" name="nomeRepresentante" value={fd.nomeRepresentante} onChange={onChange} aiFields={aiFilledFields} />
            <FormField label="CPF do Representante" name="cpfRepresentante" value={fd.cpfRepresentante} onChange={onChange} aiFields={aiFilledFields} placeholder="000.000.000-00" />
            <FormField label="RG do Representante" name="rgRepresentante" value={fd.rgRepresentante} onChange={onChange} aiFields={aiFilledFields} />
            <FormField label="Cargo / Função" name="cargoRepresentante" value={fd.cargoRepresentante} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Sócio-Administrador" />
            <FormField label="Inscrição Estadual" name="inscricaoEstadual" value={fd.inscricaoEstadual} onChange={onChange} aiFields={aiFilledFields} placeholder="Isento ou número" />
            <FormField label="E-mail de Contato" name="emailContato" value={fd.emailContato} onChange={onChange} aiFields={aiFilledFields} placeholder="contato@empresa.com" />
            <FormField label="Telefone de Contato" name="telefoneContato" value={fd.telefoneContato} onChange={onChange} aiFields={aiFilledFields} placeholder="(51) 9xxxx-xxxx" />
          </>
        )}
      </CollapsibleSection>

      {/* ── SISTEMA FV ── */}
      <CollapsibleSection title="Sistema Fotovoltaico" icon="☀️" defaultOpen>
        <FormField label="Tipo de Ligação" name="tipoLigacao" value={fd.tipoLigacao} onChange={onChange}
          options={['Monofásico', 'Bifásico', 'Trifásico']} aiFields={aiFilledFields} />
        <FormField label="Nº de Painéis (total)" name="numeroPaineis" value={fd.numeroPaineis} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Modelo do Painel" name="modeloPainel" value={fd.modeloPainel} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Potência Unit. (Wp)" name="potenciaUnitariaWp" value={fd.potenciaUnitariaWp} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Painéis em Série (por string)" name="paineisSerie" value={fd.paineisSerie} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Strings em Paralelo" name="stringParalelo" value={fd.stringParalelo} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <div className="flex items-center gap-2 bg-orange-50 rounded px-2 py-1 text-xs">
          <span className="text-slate-500">Potência CC:</span>
          <span className="font-bold text-orange-600">{calc.kWp} kWp</span>
          <span className="ml-2 text-slate-500">Enq.:</span>
          <span className="font-semibold text-orange-600 text-xs">{calc.enq}</span>
        </div>
        {/* Datasheet do módulo */}
        <p className="text-xs text-slate-400 mt-2 mb-1 font-medium uppercase tracking-wide">Datasheet do Módulo</p>
        <p className="text-xs text-slate-400 mb-1 italic">Valores do datasheet (STC). Se não preenchidos, o motor usa estimativas.</p>
        <FormField label="Voc unitário (V)" name="vocUnitario" value={fd.vocUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 46.0" />
        <FormField label="Isc unitário (A)" name="iscUnitario" value={fd.iscUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 13.93" />
        <FormField label="Vmpp unitário (V)" name="vmppUnitario" value={fd.vmppUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 38.2" />
        <FormField label="Impp unitário (A)" name="imppUnitario" value={fd.imppUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 13.05" />
        <FormField label="Eficiência (%)" name="eficienciaPainel" value={fd.eficienciaPainel} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 21.3" />
        <FormField label="Coef. Temp. Voc (%/°C)" name="coefTempVoc" value={fd.coefTempVoc} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: -0.27" />
        <FormField label="NOCT (°C)" name="noct" value={fd.noct} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 45" />
        <FormField label="Certificação" name="certificacaoPainel" value={fd.certificacaoPainel} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: INMETRO / IEC 61215" />
        {(calc.vmppString > 0 || calc.imppTotal > 0) && (
          <div className="text-xs text-slate-500 bg-slate-50 rounded p-2 space-y-0.5">
            {calc.vmppString > 0 && <div>Vmpp string: <strong>{calc.vmppString} V</strong></div>}
            {calc.imppTotal  > 0 && <div>Impp total:  <strong>{calc.imppTotal} A</strong></div>}
            {calc.dvccOpP !== null && <div>ΔV CC operacional: <strong>{calc.dvccOpP}%</strong></div>}
          </div>
        )}
      </CollapsibleSection>

      {/* ── SISTEMA EXISTENTE (só para Ampliação) ── */}
      {fd.tipoInstalacao === 'Ampliação' && (
        <CollapsibleSection title="Sistema Existente" icon="🔧" defaultOpen>
          <p className="text-xs text-slate-400 italic mb-2">Informe o que já está instalado antes desta ampliação.</p>
          <FormField label="Painéis existentes (qtd)" name="numeroPaineisExistentes" value={fd.numeroPaineisExistentes} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 8" />
          <FormField label="Modelo painel existente"  name="modeloPainelExistente"   value={fd.modeloPainelExistente}   onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Canadian Solar 400W" />
          <FormField label="Potência Wp (existente)"  name="potenciaWpExistente"     value={fd.potenciaWpExistente}     onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 400" />
          <FormField label="NOCT existente (°C)"     name="noctExistente"           value={fd.noctExistente}           onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 45" />
          <FormField label="Certificação (exist.)"   name="certificacaoExistente"   value={fd.certificacaoExistente}   onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: IEC 61215" />
          <FormField label="Inversor existente"       name="modeloInversorExistente" value={fd.modeloInversorExistente} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Growatt 3kW" />
          <FormField label="Potência CA kW (exist.)"  name="potenciaCAExistentekW"   value={fd.potenciaCAExistentekW}   onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 3" />
          <FormField label="Qtd inversores (exist.)"  name="quantidadeInversoresExistente" value={fd.quantidadeInversoresExistente} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 1" />
          <div className="flex flex-col gap-0.5 bg-blue-50 border border-blue-100 rounded px-2 py-1.5 text-xs mt-1">
            <div className="flex gap-2">
              <span className="text-slate-500">CC total após ampliação:</span>
              <span className="font-bold text-blue-700">{calc.kWpTotal} kWp</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">Enquadramento (total):</span>
              <span className="font-semibold text-blue-700">{calc.enqTotal}</span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── INVERSOR ── */}
      <CollapsibleSection title="Inversor" icon="⚡">
        <FormField label="Modelo do Inversor" name="modeloInversor" value={fd.modeloInversor} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Potência CA (kW)" name="potenciaCAkW" value={fd.potenciaCAkW} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Tensão Entrada CC (V)" name="tensaoEntradaCC" value={fd.tensaoEntradaCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Tensão Saída CA (V)" name="tensaoSaidaCA" value={fd.tensaoSaidaCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Qtd. Inversores" name="quantidadeInversores" value={fd.quantidadeInversores} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <div className="bg-orange-50 rounded px-2 py-1 text-xs text-orange-700">
          Potência CA total: <strong>{calc.kWtCA} kW</strong>
        </div>
        {/* Dados extras do inversor */}
        <p className="text-xs text-slate-400 mt-2 mb-1 font-medium uppercase tracking-wide">Dados Extras (Datasheet)</p>
        <FormField label="Nº Entradas MPPT" name="numMPPT" value={fd.numMPPT} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 2" />
        <FormField label="Vmpp mín. (V)" name="faixaMPPTMin" value={fd.faixaMPPTMin} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 80" />
        <FormField label="Vmpp máx. (V)" name="faixaMPPTMax" value={fd.faixaMPPTMax} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 550" />
        <FormField label="Tensão partida CC (V)" name="tensaoPartidaCC" value={fd.tensaoPartidaCC} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 90" />
        <FormField label="Eficiência máx. (%)" name="eficienciaInv" value={fd.eficienciaInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 97.6" />
      </CollapsibleSection>

      {/* ── CABOS ── */}
      <CollapsibleSection title="Cabos e Dimensionamento" icon="🔌">
        <FormField label="Seção Cabo CC (mm²)" name="secaoCaboCC" value={fd.secaoCaboCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Comprimento Cabos CC (m)" name="comprimentoCabosCC" value={fd.comprimentoCabosCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Seção Cabo CA (mm²)" name="secaoCaboCA" value={fd.secaoCaboCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Comprimento Cabos CA (m)" name="comprimentoCabosCA" value={fd.comprimentoCabosCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Seção Aterramento (mm²)" name="secaoCaboAterr" value={fd.secaoCaboAterr} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <div className="text-xs text-slate-500 bg-slate-50 rounded p-2 space-y-0.5">
          <div>ΔV CC: <strong>{calc.dvccV}V ({calc.dvccP}%)</strong></div>
          <div>ΔV CA: <strong>{calc.dvcaV}V ({calc.dvcaP}%)</strong></div>
        </div>
      </CollapsibleSection>

      {/* ── PROTEÇÕES ── */}
      <CollapsibleSection title="Proteções" icon="🛡️">
        <FormField label="DPS CC Tipo" name="dpsCCTipo" value={fd.dpsCCTipo} onChange={onChange}
          options={['Tipo 1', 'Tipo 2', 'Tipo 1+2']} aiFields={aiFilledFields} />
        <FormField label="DPS CC Tensão (V)" name="dpsCCTensao" value={fd.dpsCCTensao} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="DPS CA Tipo" name="dpsCATipo" value={fd.dpsCATipo} onChange={onChange}
          options={['Tipo 1', 'Tipo 2', 'Tipo 1+2']} aiFields={aiFilledFields} />
        <FormField label="DPS CA Tensão (V)" name="dpsCATensao" value={fd.dpsCATensao} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Disjuntor CC (A)" name="disjuntorCC" value={fd.disjuntorCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Disjuntor CA (A)" name="disjuntorCA" value={fd.disjuntorCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
        <FormField label="Aterramento" name="aterramento" value={fd.aterramento} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Modelo da String Box (opcional)" name="modeloStringBox" value={fd.modeloStringBox} onChange={onChange}
          placeholder="Ex: Solis PV-QB4-20-40" aiFields={aiFilledFields} />
        <FormField label="Resistência de aterramento medida (Ω)" name="resistenciaAterramento" type="number"
          value={fd.resistenciaAterramento} onChange={onChange}
          placeholder="Ex: 4,5 (deve ser ≤ 10 Ω — NBR 5419)" aiFields={aiFilledFields} />
      </CollapsibleSection>

      {/* ── INSTALAÇÃO ── */}
      <CollapsibleSection title="Instalação" icon="🏠">
        <FormField label="Tipo de Telhado" name="tipoTelhado" value={fd.tipoTelhado} onChange={onChange}
          options={['Cerâmico', 'Metálico', 'Fibrocimento', 'Laje', 'Solo']} aiFields={aiFilledFields} />
        <FormField label="Coordenadas GPS (opcional)" name="coordenadas" value={fd.coordenadas} onChange={onChange}
          placeholder="Ex: 30.0330°S, 51.2300°W" aiFields={aiFilledFields} />
        <FormField label="Temp. mínima local (°C)" name="tempMinima" type="number" value={fd.tempMinima} onChange={onChange}
          placeholder="Ex: -5 (RS), 5 (SP)" aiFields={aiFilledFields} />
        <p className="text-xs text-slate-400 italic px-1 pb-1">
          Permite calcular Voc_max com coeficiente real do datasheet (NBR 16690 §6.3).
          Se não preenchida, usa o fator conservador 1,25.
        </p>
      </CollapsibleSection>

      {/* ── EMPRESA INSTALADORA ── */}
      <CollapsibleSection title="Empresa Instaladora" icon="🏢">
        <FormField label="Nome da Empresa" name="nomeEmpresa" value={fd.nomeEmpresa} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="CNPJ" name="cnpjEmpresa" value={fd.cnpjEmpresa} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Endereço" name="enderecoEmpresa" value={fd.enderecoEmpresa} onChange={onChange} aiFields={aiFilledFields} />
      </CollapsibleSection>

      {/* ── RESPONSÁVEL TÉCNICO ── */}
      <CollapsibleSection title="Responsável Técnico" icon="👷">
        <FormField label="Nome do RT" name="nomeResponsavel" value={fd.nomeResponsavel} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Nº CRT/CREA" name="numeroCRT" value={fd.numeroCRT} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Nº ART" name="numART" value={fd.numART} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Nº Projeto (PE)" name="numProjeto" value={fd.numProjeto} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Cidade" name="cidade" value={fd.cidade} onChange={onChange} aiFields={aiFilledFields} />
        <FormField label="Data do Projeto" name="dataproject" value={fd.dataproject} onChange={onChange} aiFields={aiFilledFields} />
      </CollapsibleSection>
    </div>
  </div>
);
