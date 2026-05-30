/**
 * symbols.tsx — Símbolos SVG normalizados IEC para diagramas elétricos FV
 */

import React from 'react';

interface SymProps {
  x?: number;
  y?: number;
  c?: string;
}

interface PanelProps {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/** Símbolo de aterramento / terra (PE) */
export const GndSym: React.FC<SymProps> = ({ x = 0, y = 0, c = '#16a34a' }) => (
  <g transform={`translate(${x},${y})`}>
    <line x1="0" y1="0" x2="0" y2="10" stroke={c} strokeWidth="1.8" />
    <line x1="-13" y1="10" x2="13" y2="10" stroke={c} strokeWidth="2.2" />
    <line x1="-8" y1="15" x2="8" y2="15" stroke={c} strokeWidth="1.8" />
    <line x1="-3" y1="20" x2="3" y2="20" stroke={c} strokeWidth="1.4" />
  </g>
);

/** Símbolo de disjuntor termomagnético */
export const CBSym: React.FC<SymProps> = ({ x = 0, y = 0, c = '#1a1a2e' }) => (
  <g transform={`translate(${x},${y})`}>
    <line x1="0" y1="-16" x2="0" y2="-6" stroke={c} strokeWidth="2" />
    <circle cx="0" cy="-3" r="4" fill="white" stroke={c} strokeWidth="1.5" />
    <line x1="-3.5" y1="-6" x2="3.5" y2="-0.5" stroke={c} strokeWidth="1.5" />
    <line x1="0" y1="2" x2="0" y2="16" stroke={c} strokeWidth="2" />
  </g>
);

/** Símbolo de DPS — Dispositivo de Proteção contra Surtos */
export const DPSSym: React.FC<SymProps> = ({ x = 0, y = 0, c = '#1a1a2e' }) => (
  <g transform={`translate(${x},${y})`}>
    <line x1="0" y1="-18" x2="0" y2="-8" stroke={c} strokeWidth="2" />
    <rect x="-7" y="-8" width="14" height="12" rx="1" fill="white" stroke="#dc2626" strokeWidth="1.2" />
    <text
      x="0"
      y="2"
      fontSize="10"
      fill="#dc2626"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontWeight="700"
    >
      ↯
    </text>
    <line x1="0" y1="4" x2="0" y2="14" stroke={c} strokeWidth="2" />
    <line x1="-10" y1="14" x2="10" y2="14" stroke={c} strokeWidth="2" />
    <line x1="-6" y1="18" x2="6" y2="18" stroke={c} strokeWidth="1.5" />
    <line x1="-2" y1="22" x2="2" y2="22" stroke={c} strokeWidth="1" />
  </g>
);

/** Célula de módulo fotovoltaico */
export const PanelCell: React.FC<PanelProps> = ({ x = 0, y = 0, w = 36, h = 24 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="2" fill="#dbeafe" stroke="#1e40af" strokeWidth="1.2" />
    <line x1={x + w * 0.33} y1={y} x2={x + w * 0.33} y2={y + h} stroke="#1e40af" strokeWidth="0.6" />
    <line x1={x + w * 0.66} y1={y} x2={x + w * 0.66} y2={y + h} stroke="#1e40af" strokeWidth="0.6" />
    <line x1={x} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#1e40af" strokeWidth="0.6" />
  </g>
);
