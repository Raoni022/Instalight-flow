/**
 * DiagramaMultifilarMelhorado.tsx — Diagrama Multifilar com condutores CC e CA
 *
 * Exibe cada condutor individualmente com cor normativa ABNT,
 * especificação técnica do cabo e representação do disjuntor por fase.
 */

import React from 'react';
import type { FormData, Calculos } from '../types';
import { DPSSym } from './symbols';

interface Props {
  fd: FormData;
  calc: Calculos;
}

interface Conductor {
  l: string;
  c: string;
  da?: string;
}

const num = (v: string | undefined, d = 0): number => parseFloat(v ?? '') || d;

export const DiagramaMultifilarMelhorado: React.FC<Props> = ({ fd }) => {
  const tipo = fd.tipoLigacao || 'Monofásico';
  const nStr = Math.min(Math.max(num(fd.stringParalelo, 1), 1), 4);

  const red = '#dc2626';
  const blk = '#1a1a2e';
  const org = '#78B83A';
  const grn = '#16a34a';
  const blu = '#3b82f6';
  const brn = '#92400e';
  const gry = '#64748b';

  const condCA: Record<string, Conductor[]> = {
    Monofásico: [
      { l: 'L1', c: blk },
      { l: 'N', c: blu },
      { l: 'PE', c: grn, da: '5,3' },
    ],
    Bifásico: [
      { l: 'L1', c: blk },
      { l: 'L2', c: brn },
      { l: 'N', c: blu },
      { l: 'PE', c: grn, da: '5,3' },
    ],
    Trifásico: [
      { l: 'L1', c: blk },
      { l: 'L2', c: brn },
      { l: 'L3', c: gry },
      { l: 'N', c: blu },
      { l: 'PE', c: grn, da: '5,3' },
    ],
  };

  const conds = condCA[tipo] ?? condCA['Monofásico'];

  const GFX = 55;
  const SBX = 210;
  const INX = 410;
  const QDX = 610;
  const MTX = 800;
  const RDX = 970;

  const strSp = 36;
  const ccY0 = 62;
  const strYs = Array.from({ length: nStr }, (_, i) => ccY0 + i * strSp);

  const caSp = 30;
  const caTH = (conds.length - 1) * caSp;
  const caY0 = Math.max(ccY0 + nStr * strSp + 14, 180) - caTH / 2;

  const SPEC_CC = `#${fd.secaoCaboCC || '6'}mm² PVC 70° 750V`;
  const SPEC_CA = `#${fd.secaoCaboCA || '6'}mm² PVC 70° 750V`;

  // DPS CC — posicionado entre STR.BOX e INVERSOR
  const fmtDPS = (t: string | undefined) => { const m = (t ?? '').match(/\d/); return m ? `T${m[0]}` : 'T2'; };
  const dpsTipoCC = fmtDPS(fd.dpsCCTipo);
  const DPS_X = Math.round((SBX + 28 + INX - 44) / 2); // ponto médio entre blocos
  const DPS_Y = ccY0 + Math.round((nStr * strSp) / 2);  // centro vertical da seção CC

  return (
    <g>
      {/* Título */}
      <text x={500} y={18} fontSize="11" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DIAGRAMA MULTIFILAR — {tipo.toUpperCase()}
      </text>
      <line x1={320} y1={22} x2={680} y2={22} stroke={org} strokeWidth="1.5" />

      {/* Separador CC / CA */}
      <line x1={INX} y1={28} x2={INX} y2={310} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,3" />
      <text x={(GFX + INX) / 2} y={48} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        SEÇÃO CC — {SPEC_CC}
      </text>
      <text x={(INX + RDX + 30) / 2} y={48} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        SEÇÃO CA — {SPEC_CA}
      </text>

      {/* Blocos */}
      <rect x={GFX - 30} y={ccY0 - 8} width={60} height={nStr * strSp + 4} rx="4" fill="white" stroke={blk} strokeWidth="1.5" />
      <text x={GFX} y={ccY0 + 2} fontSize="7" fill={blk} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        GER.FV
      </text>

      <rect x={SBX - 28} y={ccY0 - 8} width={56} height={nStr * strSp + 4} rx="4" fill="white" stroke={blk} strokeWidth="1.5" />
      <text x={SBX} y={ccY0 + 2} fontSize="7" fill={blk} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        STR.BOX
      </text>

      <rect
        x={INX - 44}
        y={ccY0 - 8}
        width={88}
        height={Math.max(nStr * strSp, caTH) + 34}
        rx="6"
        fill="white"
        stroke={org}
        strokeWidth="2"
      />
      <text x={INX} y={ccY0 + 4} fontSize="8" fill={org} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        INVERSOR
      </text>
      <text x={INX} y={ccY0 + 16} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.modeloInversor || '—'}
      </text>

      <rect x={QDX - 28} y={caY0 - 10} width={56} height={caTH + 20} rx="4" fill="white" stroke={blk} strokeWidth="1.5" />
      <text x={QDX} y={caY0} fontSize="7" fill={blk} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        QDC CA
      </text>

      <rect x={MTX - 26} y={caY0 - 10} width={52} height={caTH + 20} rx="4" fill="white" stroke={grn} strokeWidth="1.5" />
      <text x={MTX} y={caY0} fontSize="7" fill={grn} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        MEDIDOR
      </text>

      <rect x={RDX - 18} y={caY0 - 10} width={36} height={caTH + 20} rx="4" fill="white" stroke={gry} strokeWidth="1.5" />
      <text x={RDX} y={caY0} fontSize="7" fill={gry} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        REDE
      </text>

      {/* Condutores CC */}
      {strYs.map((sy, i) => (
        <g key={`cc${i}`}>
          <line x1={GFX + 30} y1={sy + 6} x2={SBX - 28} y2={sy + 6} stroke={red} strokeWidth="2" />
          <line x1={SBX + 28} y1={sy + 6} x2={INX - 44} y2={sy + 6} stroke={red} strokeWidth="2" />
          <line x1={GFX + 30} y1={sy + 18} x2={SBX - 28} y2={sy + 18} stroke={blk} strokeWidth="2" />
          <line x1={SBX + 28} y1={sy + 18} x2={INX - 44} y2={sy + 18} stroke={blk} strokeWidth="2" />
          <text x={(GFX + 30 + SBX - 28) / 2} y={sy + 2} fontSize="6" fill={red} textAnchor="middle" fontFamily="sans-serif">
            Str{i + 1}(+)
          </text>
          <text x={(GFX + 30 + SBX - 28) / 2} y={sy + 28} fontSize="6" fill={blk} textAnchor="middle" fontFamily="sans-serif">
            Str{i + 1}(−)
          </text>
          <circle cx={SBX} cy={sy + 6} r="4" fill="white" stroke={red} strokeWidth="1.2" />
          <circle cx={SBX} cy={sy + 18} r="4" fill="white" stroke={blk} strokeWidth="1.2" />
          <text x={GFX} y={sy + 16} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
            S{i + 1}
          </text>
        </g>
      ))}

      {/* DPS CC — proteção entre STR.BOX e INVERSOR (NBR 16690 §7.4) */}
      <DPSSym x={DPS_X} y={DPS_Y} c={red} />
      <text x={DPS_X} y={DPS_Y + 28} fontSize="6" fill={red} textAnchor="middle" fontFamily="sans-serif">
        DPS {dpsTipoCC} {fd.dpsCCTensao || '1000'}V CC
      </text>

      {/* Condutores CA */}
      {conds.map((c, i) => {
        const y = caY0 + i * caSp;
        const isPE = c.l === 'PE';
        const isN  = c.l === 'N';
        return (
          <g key={`ca${i}`}>
            <line x1={INX + 44} y1={y} x2={QDX - 28} y2={y} stroke={c.c} strokeWidth={isPE ? 1.5 : 2} strokeDasharray={c.da} />
            <line x1={QDX + 28} y1={y} x2={MTX - 26} y2={y} stroke={c.c} strokeWidth={isPE ? 1.5 : 2} strokeDasharray={c.da} />
            <line x1={MTX + 26} y1={y} x2={RDX + 24} y2={y} stroke={c.c} strokeWidth={isPE ? 1.5 : 2} strokeDasharray={c.da} />
            <circle cx={INX + 44} cy={y} r="7" fill={c.c} opacity="0.12" />
            <text x={INX + 44} y={y + 4} fontSize="7" fill={c.c} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
              {c.l}
            </text>
            <circle cx={RDX + 24} cy={y} r="7" fill={c.c} opacity="0.12" />
            <text x={RDX + 24} y={y + 4} fontSize="7" fill={c.c} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
              {c.l}
            </text>
            {!isPE && !isN && (
              <g>
                <circle cx={QDX} cy={y} r="6" fill="white" stroke={c.c} strokeWidth="1.5" />
                <line x1={QDX - 4} y1={y - 3} x2={QDX + 4} y2={y + 3} stroke={c.c} strokeWidth="1.5" />
                <text x={QDX} y={y + 15} fontSize="6" fill={c.c} textAnchor="middle" fontFamily="sans-serif">
                  {fd.disjuntorCA || '—'}A
                </text>
              </g>
            )}
            <text x={(INX + 44 + QDX - 28) / 2} y={y - 4} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
              {isPE ? fd.secaoCaboAterr || '6' : fd.secaoCaboCA || '6'}mm²
            </text>
          </g>
        );
      })}

      <text x={GFX} y={ccY0 + nStr * strSp + 18} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {num(fd.stringParalelo, 1)}×{num(fd.paineisSerie, 1)} painéis
      </text>
      <text x={GFX} y={ccY0 + nStr * strSp + 28} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.potenciaUnitariaWp || '—'}Wp ea.
      </text>
      <text x={MTX} y={caY0 + caTH + 18} fontSize="6" fill={grn} textAnchor="middle" fontFamily="sans-serif">
        Bidirecional CEEE
      </text>

      {/* ── Observação técnica para projetos de AMPLIAÇÃO ── */}
      {fd.tipoInstalacao === 'Ampliação' && (
        <g>
          {(() => {
            const noteY = Math.max(caY0 + caTH + 34, ccY0 + nStr * strSp + 44);
            return (
              <>
                <rect x={0} y={noteY} width={1020} height={38} rx="3"
                  fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                <text x={8} y={noteY + 12} fontSize="6.5" fill="#1d4ed8" fontWeight="700" fontFamily="sans-serif">
                  PROJETO DE AMPLIAÇÃO
                </text>
                <text x={8} y={noteY + 22} fontSize="6" fill="#1e40af" fontFamily="sans-serif">
                  Este diagrama representa o sistema NOVO a ser instalado. O sistema existente/homologado
                  ({fd.numeroPaineisExistentes || '—'} módulos {fd.potenciaWpExistente || '—'}Wp,
                </text>
                <text x={8} y={noteY + 31} fontSize="6" fill="#1e40af" fontFamily="sans-serif">
                  {' '}inv. {fd.modeloInversorExistente || '—'} — {fd.potenciaCAExistentekW || '—'} kW CA) deve ser conferido em campo pelo RT.
                  {' '}Potência total após ampliação: {(parseFloat(fd.potenciaCAExistentekW||'0') * parseFloat(fd.quantidadeInversoresExistente||'1') + parseFloat(fd.potenciaCAkW||'0') * parseFloat(fd.quantidadeInversores||'1')).toFixed(3)} kW CA.
                </text>
              </>
            );
          })()}
        </g>
      )}
    </g>
  );
};
