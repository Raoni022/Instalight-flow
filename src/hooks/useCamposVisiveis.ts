import { useState, useCallback } from 'react';

export interface CampoConfig {
  label: string;
  secao: string;
}

export const CAMPOS_OPCIONAIS: Record<string, CampoConfig> = {
  // Cliente
  rgCliente:              { label: 'RG',                          secao: 'Cliente' },
  orgaoExpeditorRG:       { label: 'Órgão Expedidor',              secao: 'Cliente' },
  telefoneCelular:        { label: 'Celular',                      secao: 'Cliente' },
  emailContato:           { label: 'E-mail',                       secao: 'Cliente' },
  complemento:            { label: 'Complemento',                  secao: 'Cliente' },
  // Padrão de Entrada
  tipoPadrao:             { label: 'Tipo de Padrão / Caixa',      secao: 'Padrão de Entrada' },
  tipoFixacao:            { label: 'Tipo de Fixação',              secao: 'Padrão de Entrada' },
  materialCaboEntrada:    { label: 'Material do Cabo',             secao: 'Padrão de Entrada' },
  numPoste:               { label: 'Nº Poste CEEE',               secao: 'Padrão de Entrada' },
  transformador:          { label: 'Transformador',                secao: 'Padrão de Entrada' },
  numeroMedidor:          { label: 'Nº do Medidor',               secao: 'Padrão de Entrada' },
  classeUC:               { label: 'Classe da UC',                 secao: 'Padrão de Entrada' },
  latitude:               { label: 'Latitude GPS',                 secao: 'Padrão de Entrada' },
  longitude:              { label: 'Longitude GPS',                secao: 'Padrão de Entrada' },
  // Datasheet Módulo
  vocUnitario:            { label: 'Voc unitário',                 secao: 'Datasheet Módulo' },
  iscUnitario:            { label: 'Isc unitário',                 secao: 'Datasheet Módulo' },
  vmppUnitario:           { label: 'Vmpp unitário',               secao: 'Datasheet Módulo' },
  imppUnitario:           { label: 'Impp unitário',               secao: 'Datasheet Módulo' },
  eficienciaPainel:       { label: 'Eficiência (%)',               secao: 'Datasheet Módulo' },
  coefTempVoc:            { label: 'Coef. Temp. Voc',             secao: 'Datasheet Módulo' },
  noct:                   { label: 'NOCT (°C)',                    secao: 'Datasheet Módulo' },
  certificacaoPainel:     { label: 'Certificação',                 secao: 'Datasheet Módulo' },
  // Datasheet Inversor
  numMPPT:                { label: 'Nº Entradas MPPT',            secao: 'Datasheet Inversor' },
  faixaMPPTMin:           { label: 'Vmpp mínimo',                 secao: 'Datasheet Inversor' },
  faixaMPPTMax:           { label: 'Vmpp máximo',                 secao: 'Datasheet Inversor' },
  tensaoPartidaCC:        { label: 'Tensão partida CC',           secao: 'Datasheet Inversor' },
  eficienciaInv:          { label: 'Eficiência máx.',             secao: 'Datasheet Inversor' },
  // Cabos
  comprimentoCabosCC:     { label: 'Comprimento CC (m)',          secao: 'Cabos' },
  comprimentoCabosCA:     { label: 'Comprimento CA (m)',          secao: 'Cabos' },
  // Proteções
  modeloStringBox:        { label: 'Modelo String Box',           secao: 'Proteções' },
  resistenciaAterramento: { label: 'Resistência de Aterramento',  secao: 'Proteções' },
  // Instalação
  tipoTelhado:            { label: 'Tipo de Telhado',             secao: 'Instalação' },
  coordenadas:            { label: 'Coordenadas GPS (legado)',     secao: 'Instalação' },
  tempMinima:             { label: 'Temp. mínima local',          secao: 'Instalação' },
  irradLocal:             { label: 'HSP local (kWh/m²/dia)',      secao: 'Instalação' },
  prCustom:               { label: 'Performance Ratio (PR)',      secao: 'Instalação' },
  // PJ
  inscricaoEstadual:      { label: 'Inscrição Estadual',          secao: 'PJ' },
  rgRepresentante:        { label: 'RG do Representante',         secao: 'PJ' },
  // Responsável Técnico
  numProjeto:             { label: 'Nº do Projeto (PE carimbo)',  secao: 'Responsável Técnico' },
};

const LS_KEY = 'instalight_campos_ocultos';

function loadOcultos(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveOcultos(ocultos: Set<string>): void {
  localStorage.setItem(LS_KEY, JSON.stringify([...ocultos]));
}

export function useCamposVisiveis() {
  const [ocultos, setOcultos] = useState<Set<string>>(loadOcultos);

  const visivel = useCallback(
    (campo: string): boolean => !ocultos.has(campo),
    [ocultos],
  );

  const toggle = useCallback((campo: string) => {
    setOcultos(prev => {
      const next = new Set(prev);
      if (next.has(campo)) next.delete(campo);
      else next.add(campo);
      saveOcultos(next);
      return next;
    });
  }, []);

  return { visivel, toggle };
}
