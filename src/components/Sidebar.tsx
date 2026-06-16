/**
 * Sidebar.tsx — Painel lateral com formulário, validação e upload
 *
 * 8 seções colapsáveis:
 *   Cliente | Sistema FV | Inversor | Cabos | Proteções |
 *   Instalação | Empresa Instaladora | Responsável Técnico
 */

import React, { useState } from 'react';
import type { FormData, Calculos, ValidationIssue, DocAnexo } from '../types';
import { ValidationPanel } from './ValidationPanel';
import { UploadModule } from './UploadModule';
import { CollapsibleSection } from './CollapsibleSection';
import { FormField } from './FormField';
import { PainelCampos } from './PainelCampos';
import { useCamposVisiveis } from '../hooks/useCamposVisiveis';

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
}) => {
  const [showPainel, setShowPainel] = useState(false);
  const { visivel, toggle } = useCamposVisiveis();

  return (
    <div className="relative w-96 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
      {showPainel && (
        <PainelCampos visivel={visivel} toggle={toggle} onClose={() => setShowPainel(false)} />
      )}

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

        {/* Botão de personalização de campos */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowPainel(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            title="Personalizar campos visíveis"
          >
            <span>⚙</span>
            <span>Campos</span>
          </button>
        </div>

        {/* ── CLIENTE ── */}
        <CollapsibleSection title="Cliente" icon="👤" defaultOpen>
          <FormField
            label="Tipo de Pessoa"
            name="tipoPessoa"
            value={fd.tipoPessoa}
            onChange={onChange}
            options={[
              { value: 'fisica',   label: 'Física' },
              { value: 'juridica', label: 'Jurídica' },
            ]}
            aiFields={aiFilledFields}
          />
          <FormField label="Tipo de Instalação" name="tipoInstalacao" value={fd.tipoInstalacao} onChange={onChange}
            options={['Nova', 'Ampliação']} aiFields={aiFilledFields} />

          {/* Identificação */}
          <FormField label="Nome / Razão Social" name="nomeCliente" value={fd.nomeCliente} onChange={onChange} aiFields={aiFilledFields}
            placeholder={fd.tipoPessoa === 'fisica' ? 'Nome completo (sem abreviações)' : 'Razão Social completa'} />
          <FormField label={fd.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} name="cpfCnpj" value={fd.cpfCnpj} onChange={onChange} aiFields={aiFilledFields} />

          {/* PF: RG + órgão expedidor */}
          {fd.tipoPessoa === 'fisica' && visivel('rgCliente') && (
            <FormField label="RG" name="rgCliente" value={fd.rgCliente} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: 1234567" />
          )}
          {fd.tipoPessoa === 'fisica' && visivel('orgaoExpeditorRG') && (
            <FormField label="Órgão Expedidor" name="orgaoExpeditorRG" value={fd.orgaoExpeditorRG} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: SSP/RS" />
          )}

          {/* Endereço dividido */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Endereço da Instalação</div>
          <p className="text-xs text-slate-400 italic mb-1">Idêntico ao da conta de luz.</p>
          <FormField label="Logradouro" name="logradouro" value={fd.logradouro} onChange={onChange} aiFields={aiFilledFields} placeholder="Rua, Avenida, etc." />
          <FormField label="Número" name="numEndereco" value={fd.numEndereco} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: 123" />
          {visivel('complemento') && (
            <FormField label="Complemento" name="complemento" value={fd.complemento} onChange={onChange} aiFields={aiFilledFields} placeholder="Apto, Bloco, Sala..." />
          )}
          <FormField label="Bairro" name="bairro" value={fd.bairro} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Cidade" name="cidade" value={fd.cidade} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="CEP" name="cep" value={fd.cep} onChange={onChange} aiFields={aiFilledFields} placeholder="00000-000" />

          {/* UC */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidade Consumidora</div>
          <FormField label="Código UC" name="codigoUC" value={fd.codigoUC} onChange={onChange} aiFields={aiFilledFields} placeholder="Código no topo da conta de luz" />

          {/* Tipo de Caracterização CEEE */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Caracterização CEEE</div>
          <FormField label="Tipo de Caracterização" name="tipoCaracterizacao" value={fd.tipoCaracterizacao} onChange={onChange}
            options={['Autoconsumo Local', 'Autoconsumo Remoto', 'Geração Compartilhada', 'EMUC']}
            aiFields={aiFilledFields} />

          {/* Contato */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contato</div>
          {visivel('telefoneCelular') && (
            <FormField label="Celular" name="telefoneCelular" value={fd.telefoneCelular} onChange={onChange} aiFields={aiFilledFields} placeholder="(51) 9xxxx-xxxx" />
          )}
          {visivel('emailContato') && (
            <FormField label="E-mail" name="emailContato" value={fd.emailContato} onChange={onChange} aiFields={aiFilledFields} placeholder="email@exemplo.com" />
          )}

          {/* PJ: representante legal + IE */}
          {fd.tipoPessoa === 'juridica' && (
            <>
              <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Representante Legal</div>
              <FormField label="Nome do Representante" name="nomeRepresentante" value={fd.nomeRepresentante} onChange={onChange} aiFields={aiFilledFields} />
              <FormField label="CPF" name="cpfRepresentante" value={fd.cpfRepresentante} onChange={onChange} aiFields={aiFilledFields} placeholder="000.000.000-00" />
              {visivel('rgRepresentante') && (
                <FormField label="RG" name="rgRepresentante" value={fd.rgRepresentante} onChange={onChange} aiFields={aiFilledFields} />
              )}
              <FormField label="Cargo / Função" name="cargoRepresentante" value={fd.cargoRepresentante} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Sócio-Administrador" />
              {visivel('inscricaoEstadual') && (
                <FormField label="Inscrição Estadual" name="inscricaoEstadual" value={fd.inscricaoEstadual} onChange={onChange} aiFields={aiFilledFields} placeholder="Isento ou número" />
              )}
              <FormField label="Telefone de Contato" name="telefoneContato" value={fd.telefoneContato} onChange={onChange} aiFields={aiFilledFields} placeholder="(51) xxxx-xxxx" />
            </>
          )}
        </CollapsibleSection>

        {/* ── PADRÃO DE ENTRADA ── */}
        <CollapsibleSection title="Padrão de Entrada" icon="🔌" defaultOpen>
          <FormField label="Tipo de Ligação" name="tipoLigacao" value={fd.tipoLigacao} onChange={onChange}
            options={['Monofásico', 'Bifásico', 'Trifásico']} aiFields={aiFilledFields} />
          {visivel('tipoPadrao') && (
            <FormField label="Tipo de Padrão / Caixa" name="tipoPadrao" value={fd.tipoPadrao} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: Caixa Tipo E, Tipo H, Painel agrupado" />
          )}
          {visivel('tipoFixacao') && (
            <FormField label="Tipo de Fixação" name="tipoFixacao" value={fd.tipoFixacao} onChange={onChange}
              options={['Muro', 'Poste de concreto', 'Fachada', 'Poste de madeira']} aiFields={aiFilledFields} />
          )}
          <FormField label="DJ Entrada (A)" name="disjuntorEntrada" value={fd.disjuntorEntrada} onChange={onChange} type="number" aiFields={aiFilledFields}
            placeholder="Ex: 50, 63, 100" />
          {visivel('materialCaboEntrada') && (
            <FormField label="Material do Cabo" name="materialCaboEntrada" value={fd.materialCaboEntrada} onChange={onChange}
              options={['Cobre', 'Alumínio']} aiFields={aiFilledFields} />
          )}
          <FormField label="Ramal de Entrada (mm²)" name="ramalEntrada" value={fd.ramalEntrada} onChange={onChange} aiFields={aiFilledFields}
            placeholder="Ex: #25mm²" />
          {visivel('numPoste') && (
            <FormField label="Nº do Poste CEEE" name="numPoste" value={fd.numPoste} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Número do poste de derivação" />
          )}
          {visivel('transformador') && (
            <FormField label="Transformador (ID)" name="transformador" value={fd.transformador} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: TR-4521" />
          )}
          {/* Caixa de Medição — Seção 5.4 CEEE */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Caixa de Medição (Seção 5.4 CEEE)</div>
          <FormField label="Caixa de Medição" name="tipoCaixaMedicao" value={fd.tipoCaixaMedicao} onChange={onChange}
            options={['Existente', 'Nova']} aiFields={aiFilledFields} />
          <FormField label="Local de Instalação" name="localInstalacaoCaixa" value={fd.localInstalacaoCaixa} onChange={onChange}
            options={['Muro', 'Fachada', 'Poste auxiliar']} aiFields={aiFilledFields} />
          {visivel('numeroMedidor') && (
            <FormField label="Nº do Medidor" name="numeroMedidor" value={fd.numeroMedidor} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: 12345678" />
          )}
          {visivel('classeUC') && (
            <FormField label="Classe da UC" name="classeUC" value={fd.classeUC} onChange={onChange}
              options={['Residencial','Comercial','Industrial','Rural','Poder Público','Iluminação Pública']} aiFields={aiFilledFields} />
          )}
          {visivel('latitude') && (
            <FormField label="Latitude" name="latitude" value={fd.latitude} onChange={onChange} aiFields={aiFilledFields} placeholder="-30.0368" />
          )}
          {visivel('longitude') && (
            <FormField label="Longitude" name="longitude" value={fd.longitude} onChange={onChange} aiFields={aiFilledFields} placeholder="-51.2090" />
          )}
        </CollapsibleSection>

        {/* ── SISTEMA FV ── */}
        <CollapsibleSection title="Sistema Fotovoltaico" icon="☀️" defaultOpen>
          <FormField label="Nº de Painéis (total)" name="numeroPaineis" value={fd.numeroPaineis} onChange={onChange} type="number" aiFields={aiFilledFields} />
          <FormField label="Modelo do Painel" name="modeloPainel" value={fd.modeloPainel} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Potência Unit. (Wp)" name="potenciaUnitariaWp" value={fd.potenciaUnitariaWp} onChange={onChange} type="number" aiFields={aiFilledFields} />
          <FormField label="Painéis em Série (por string)" name="paineisSerie" value={fd.paineisSerie} onChange={onChange} type="number" aiFields={aiFilledFields} />
          <FormField label="Strings em Paralelo" name="stringParalelo" value={fd.stringParalelo} onChange={onChange} type="number" aiFields={aiFilledFields} />
          <div className="flex items-center gap-2 bg-brand-50 rounded px-2 py-1 text-xs">
            <span className="text-slate-500">Potência CC:</span>
            <span className="font-bold text-brand-600">{calc.kWp} kWp</span>
            <span className="ml-2 text-slate-500">Enq.:</span>
            <span className="font-semibold text-brand-600 text-xs">{calc.enq}</span>
          </div>
          {/* Datasheet do módulo */}
          <p className="text-xs text-slate-400 mt-2 mb-1 font-medium uppercase tracking-wide">Datasheet do Módulo</p>
          <p className="text-xs text-slate-400 mb-1 italic">Valores do datasheet (STC). Se não preenchidos, o motor usa estimativas.</p>
          {visivel('comprimentoPainel') && (
            <FormField label="Comprimento do Módulo (m)" name="comprimentoPainel" value={fd.comprimentoPainel} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 2.094" />
          )}
          {visivel('larguraPainel') && (
            <FormField label="Largura do Módulo (m)" name="larguraPainel" value={fd.larguraPainel} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 1.134" />
          )}
          {visivel('pesoPainel') && (
            <FormField label="Peso do Módulo (kg)" name="pesoPainel" value={fd.pesoPainel} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 28.5" />
          )}
          {visivel('vocUnitario') && (
            <FormField label="Voc unitário (V)" name="vocUnitario" value={fd.vocUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 46.0" />
          )}
          {visivel('iscUnitario') && (
            <FormField label="Isc unitário (A)" name="iscUnitario" value={fd.iscUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 13.93" />
          )}
          {visivel('vmppUnitario') && (
            <FormField label="Vmpp unitário (V)" name="vmppUnitario" value={fd.vmppUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 38.2" />
          )}
          {visivel('imppUnitario') && (
            <FormField label="Impp unitário (A)" name="imppUnitario" value={fd.imppUnitario} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 13.05" />
          )}
          {visivel('eficienciaPainel') && (
            <FormField label="Eficiência (%)" name="eficienciaPainel" value={fd.eficienciaPainel} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 21.3" />
          )}
          {visivel('coefTempVoc') && (
            <FormField label="Coef. Temp. Voc (%/°C)" name="coefTempVoc" value={fd.coefTempVoc} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: -0.27" />
          )}
          {visivel('noct') && (
            <FormField label="NOCT (°C)" name="noct" value={fd.noct} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 45" />
          )}
          {visivel('certificacaoPainel') && (
            <FormField label="Certificação" name="certificacaoPainel" value={fd.certificacaoPainel} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: INMETRO / IEC 61215" />
          )}
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
          <CollapsibleSection title="Sistema Existente / Homologado" icon="🔧" defaultOpen>
            {/* Alerta informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs text-blue-800">
              ℹ️ <strong>Projeto de ampliação:</strong> informe os dados do sistema já homologado e da nova instalação.
              A CEEE avaliará a potência total final da UC.
            </div>

            {/* Alerta quando existente vazio */}
            {calc.kWpExistente <= 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2 text-xs text-amber-800">
                ⚠️ Dados do sistema existente ainda não preenchidos. Memorial e diagrama ficarão incompletos.
              </div>
            )}

            {/* Documentação anterior */}
            <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Documentação Anterior</div>
            <FormField label="Protocolo / Parecer de acesso anterior" name="parecerAcessoAnterior"
              value={fd.parecerAcessoAnterior} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: PA-2023-00123" />
            <FormField label="Data de aprovação anterior" name="dataAprovacaoAnterior"
              value={fd.dataAprovacaoAnterior} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: 15/08/2023" />
            <FormField label="Nº ART / TRT anterior" name="artTrtAnterior"
              value={fd.artTrtAnterior} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Nº da ART ou TRT da instalação anterior" />

            {/* Tipo de ampliação */}
            <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Escopo da Ampliação</div>
            <FormField label="Tipo de ampliação (inversor)" name="tipoAmpliacao"
              value={fd.tipoAmpliacao} onChange={onChange} aiFields={aiFilledFields}
              options={['Mesmo inversor existente','Novo inversor adicional','Substituição de inversor','A definir pelo RT']} />
            <FormField label="Padrão de entrada" name="situacaoPadrao"
              value={fd.situacaoPadrao} onChange={onChange} aiFields={aiFilledFields}
              options={['Mantido','Alterado / aumento de carga','A definir pelo RT']} />

            {/* Dados elétricos do sistema existente */}
            <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dados do Sistema Existente</div>
            <p className="text-xs text-slate-400 italic mb-1">Informe o que já está instalado e homologado.</p>
            <FormField label="Painéis existentes (qtd)" name="numeroPaineisExistentes" value={fd.numeroPaineisExistentes} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 8" />
            <FormField label="Modelo painel existente"  name="modeloPainelExistente"   value={fd.modeloPainelExistente}   onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Canadian Solar 400W" />
            <FormField label="Potência Wp (existente)"  name="potenciaWpExistente"     value={fd.potenciaWpExistente}     onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 400" />
            <FormField label="NOCT existente (°C)"     name="noctExistente"           value={fd.noctExistente}           onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 45" />
            <FormField label="Certificação (exist.)"   name="certificacaoExistente"   value={fd.certificacaoExistente}   onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: IEC 61215" />
            <FormField label="Inversor existente"       name="modeloInversorExistente" value={fd.modeloInversorExistente} onChange={onChange} aiFields={aiFilledFields} placeholder="Ex: Growatt 3kW" />
            <FormField label="Potência CA kW (exist.)"  name="potenciaCAExistentekW"   value={fd.potenciaCAExistentekW}   onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 3" />
            <FormField label="Qtd inversores (exist.)"  name="quantidadeInversoresExistente" value={fd.quantidadeInversoresExistente} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 1" />

            {/* Observações */}
            <FormField label="Observações do sistema existente" name="observacoesExistente"
              value={fd.observacoesExistente} onChange={onChange} aiFields={aiFilledFields}
              placeholder="Ex: sistema instalado em 2022, em operação normal" />

            {/* Resumo das potências */}
            <div className="flex flex-col gap-0.5 bg-blue-50 border border-blue-100 rounded px-2 py-1.5 text-xs mt-2">
              <div className="flex gap-2">
                <span className="text-slate-500">CC existente:</span>
                <span className="font-semibold text-blue-700">{calc.kWpExistente} kWp</span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-500">nova:</span>
                <span className="font-semibold text-blue-700">{calc.kWp} kWp</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500">CC total:</span>
                <span className="font-bold text-blue-800">{calc.kWpTotal} kWp</span>
                <span className="ml-1 text-slate-400">|</span>
                <span className="text-slate-500">CA total:</span>
                <span className="font-bold text-blue-800">{calc.kWtCATotal} kW</span>
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
          <div className="bg-brand-50 rounded px-2 py-1 text-xs text-brand-700">
            Potência CA total: <strong>{calc.kWtCA} kW</strong>
          </div>
          {/* Dados extras do inversor */}
          <p className="text-xs text-slate-400 mt-2 mb-1 font-medium uppercase tracking-wide">Dados Extras (Tabela 4 CEEE)</p>
          {visivel('numMPPT') && (
            <FormField label="Nº Entradas MPPT" name="numMPPT" value={fd.numMPPT} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 2" />
          )}
          {visivel('faixaMPPTMin') && (
            <FormField label="Vmpp mín. (V)" name="faixaMPPTMin" value={fd.faixaMPPTMin} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 80" />
          )}
          {visivel('faixaMPPTMax') && (
            <FormField label="Vmpp máx. (V)" name="faixaMPPTMax" value={fd.faixaMPPTMax} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 550" />
          )}
          {visivel('tensaoPartidaCC') && (
            <FormField label="Tensão partida CC (V)" name="tensaoPartidaCC" value={fd.tensaoPartidaCC} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 90" />
          )}
          {visivel('eficienciaInv') && (
            <FormField label="Eficiência máx. (%)" name="eficienciaInv" value={fd.eficienciaInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 97.6" />
          )}
          {visivel('potMaxCCInv') && (
            <FormField label="Pmax entrada CC (kW)" name="potMaxCCInv" value={fd.potMaxCCInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 6.6" />
          )}
          {visivel('iMaxCCInv') && (
            <FormField label="Icc-máx entrada CC (A)" name="iMaxCCInv" value={fd.iMaxCCInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 16.0" />
          )}
          {visivel('potMaxCAInv') && (
            <FormField label="Pca-máx saída CA (kW)" name="potMaxCAInv" value={fd.potMaxCAInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 6.0" />
          )}
          {visivel('iMaxCAInv') && (
            <FormField label="Imáx saída CA (A)" name="iMaxCAInv" value={fd.iMaxCAInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 27.3" />
          )}
          {visivel('vCAmaxInv') && (
            <FormField label="Vca-máx saída CA (V)" name="vCAmaxInv" value={fd.vCAmaxInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 264" />
          )}
          {visivel('vCAminInv') && (
            <FormField label="Vca-min saída CA (V)" name="vCAminInv" value={fd.vCAminInv} onChange={onChange} type="number" aiFields={aiFilledFields} placeholder="Ex: 176" />
          )}
        </CollapsibleSection>

        {/* ── CABOS ── */}
        <CollapsibleSection title="Cabos e Dimensionamento" icon="🔌">
          <FormField label="Seção Cabo CC (mm²)" name="secaoCaboCC" value={fd.secaoCaboCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
          {visivel('comprimentoCabosCC') && (
            <FormField label="Comprimento Cabos CC (m)" name="comprimentoCabosCC" value={fd.comprimentoCabosCC} onChange={onChange} type="number" aiFields={aiFilledFields} />
          )}
          <FormField label="Seção Cabo CA (mm²)" name="secaoCaboCA" value={fd.secaoCaboCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
          {visivel('comprimentoCabosCA') && (
            <FormField label="Comprimento Cabos CA (m)" name="comprimentoCabosCA" value={fd.comprimentoCabosCA} onChange={onChange} type="number" aiFields={aiFilledFields} />
          )}
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
          {visivel('modeloStringBox') && (
            <FormField label="Modelo da String Box (opcional)" name="modeloStringBox" value={fd.modeloStringBox} onChange={onChange}
              placeholder="Ex: Solis PV-QB4-20-40" aiFields={aiFilledFields} />
          )}
          {visivel('resistenciaAterramento') && (
            <FormField label="Resistência de aterramento medida (Ω)" name="resistenciaAterramento" type="number"
              value={fd.resistenciaAterramento} onChange={onChange}
              placeholder="Ex: 4,5 (deve ser ≤ 10 Ω — NBR 5419)" aiFields={aiFilledFields} />
          )}
          {/* DSV — Dispositivo de Seccionamento Visível (Seção 10.3 CEEE) */}
          <div className="mt-1 mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">DSV (Seção 10.3 CEEE)</div>
          <FormField label="Possui DSV?" name="temDSV" value={fd.temDSV} onChange={onChange}
            options={['Não', 'Sim']} aiFields={aiFilledFields} />
          {fd.temDSV === 'Sim' && (
            <FormField label="Características do DSV" name="caracteristicasDSV" value={fd.caracteristicasDSV} onChange={onChange}
              placeholder="Ex: Seccionador 32A, bipolar, IP65" aiFields={aiFilledFields} />
          )}
        </CollapsibleSection>

        {/* ── INSTALAÇÃO ── */}
        <CollapsibleSection title="Instalação" icon="🏠">
          {visivel('tipoTelhado') && (
            <FormField label="Tipo de Telhado" name="tipoTelhado" value={fd.tipoTelhado} onChange={onChange}
              options={['Cerâmico', 'Metálico', 'Fibrocimento', 'Laje', 'Solo']} aiFields={aiFilledFields} />
          )}
          {visivel('coordenadas') && (
            <FormField label="Coordenadas GPS (opcional)" name="coordenadas" value={fd.coordenadas} onChange={onChange}
              placeholder="Ex: 30.0330°S, 51.2300°W" aiFields={aiFilledFields} />
          )}
          {visivel('tempMinima') && (
            <>
              <FormField label="Temp. mínima local (°C)" name="tempMinima" type="number" value={fd.tempMinima} onChange={onChange}
                placeholder="Ex: -5 (RS), 5 (SP)" aiFields={aiFilledFields} />
              <p className="text-xs text-slate-400 italic px-1 pb-1">
                Permite calcular Voc_max com coeficiente real do datasheet (NBR 16690 §6.3).
                Se não preenchida, usa o fator conservador 1,25.
              </p>
            </>
          )}
          {visivel('irradLocal') && (
            <>
              <FormField label="HSP local (kWh/m²/dia)" name="irradLocal" type="number" value={fd.irradLocal} onChange={onChange}
                placeholder={`Padrão Porto Alegre: 4,8`} aiFields={aiFilledFields} />
              <p className="text-xs text-slate-400 italic px-1 pb-1">
                Ajuste para a cidade da instalação. Consulte o CRESESB / LABREN.
                Padrão: 4,8 (Porto Alegre/RS).
              </p>
            </>
          )}
          {visivel('prCustom') && (
            <>
              <FormField label="Performance Ratio — PR" name="prCustom" type="number" value={fd.prCustom} onChange={onChange}
                placeholder="Padrão: 0,75 (típico)" aiFields={aiFilledFields} />
              <p className="text-xs text-slate-400 italic px-1 pb-1">
                Fator de desempenho sistêmico (0,65–0,85). Aumentar para módulos
                bifaciais / premium; reduzir se houver sombreamento significativo.
              </p>
            </>
          )}
        </CollapsibleSection>

        {/* ── EMPRESA INSTALADORA ── */}
        <CollapsibleSection title="Empresa Instaladora" icon="🏢">
          <FormField label="Nome da Empresa" name="nomeEmpresa" value={fd.nomeEmpresa} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="CNPJ" name="cnpjEmpresa" value={fd.cnpjEmpresa} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Endereço" name="enderecoEmpresa" value={fd.enderecoEmpresa} onChange={onChange} aiFields={aiFilledFields} />
        </CollapsibleSection>

        {/* ── RESPONSÁVEL TÉCNICO ── */}
        <CollapsibleSection title="Responsável Técnico" icon="👷">
          <FormField label="Tipo de Responsabilidade" name="tipoResponsabilidade" value={fd.tipoResponsabilidade}
            onChange={onChange} options={['TRT', 'ART']} aiFields={aiFilledFields} />
          <FormField label="Nome do RT" name="nomeResponsavel" value={fd.nomeResponsavel} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Profissão (para capa)" name="profissaoRT" value={fd.profissaoRT} onChange={onChange} aiFields={aiFilledFields}
            placeholder="Ex: Engenheiro Eletricista, Técnico em Eletrotécnica" />
          <FormField label="CPF do RT (procuração)" name="cpfResponsavel" value={fd.cpfResponsavel} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Nº CRT/CREA" name="numeroCRT" value={fd.numeroCRT} onChange={onChange} aiFields={aiFilledFields} />
          <FormField
            label={`Nº ${fd.tipoResponsabilidade || 'TRT'}`}
            name="numART"
            value={fd.numART}
            onChange={onChange}
            aiFields={aiFilledFields}
            placeholder={`Número do ${fd.tipoResponsabilidade || 'TRT'}`}
          />
          <FormField label="Cidade" name="cidade" value={fd.cidade} onChange={onChange} aiFields={aiFilledFields} />
          <FormField label="Data do Projeto" name="dataproject" value={fd.dataproject} onChange={onChange} aiFields={aiFilledFields} />
          {visivel('numProjeto') && (
            <FormField label="Nº do Projeto (PE — carimbo)" name="numProjeto" value={fd.numProjeto} onChange={onChange}
              aiFields={aiFilledFields} placeholder="Ex: PE-2026-001" />
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};
