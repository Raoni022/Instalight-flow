/**
 * DiagramaUnifilarVertical.tsx — Diagrama Unifilar padrão CEEE
 *
 * Modos de renderização:
 *   Nova instalação   — fluxo vertical padrão CEEE (top→bottom)
 *   Ampliação         — diagrama global: EXISTENTE + NOVO → PONTO DE CONEXÃO → REDE
 */

import React from 'react';
import type { FormData, Calculos } from '../types';
import { GndSym, CBSym, DPSSym, PanelCell } from './symbols';

interface Props {
  fd: FormData;
  calc: Calculos;
}

const num = (v: string | undefined, d = 0): number => parseFloat(v ?? '') || d;

// ── Diagrama global para projetos de Ampliação ──────────────────────────────
const DiagramaUnifilarAmpliacao: React.FC<Props> = ({ fd, calc }) => {
  const blk = '#1a1a2e';
  const grn = '#16a34a';
  const org = '#78B83A';
  const gry = '#64748b';
  const blu = '#1d4ed8';
  const slk = '#94a3b8';

  // Layout: dois sistemas alimentam o mesmo ponto de conexão
  const CX     = 268;   // centro horizontal geral
  const CX_EX  = 105;   // centro da coluna "existente" (esquerda)
  const CX_NV  = 430;   // centro da coluna "novo" (direita)

  const Y_TIT  = 14;
  const Y_REDE = 52;
  const Y_MED  = 120;
  const Y_PAD  = 215;
  const Y_BRAN = 285;   // ponto de bifurcação → duas colunas
  const Y_INV  = 380;   // inversores
  const Y_STR  = 470;   // strings / módulos (simplificado)
  const Y_PAN  = 505;
  const Y_SUM  = 580;   // tabela de resumo

  const nStrNovo = Math.min(Math.max(num(fd.stringParalelo, 1), 1), 4);
  const polosCA = fd.tipoLigacao === 'Trifásico' ? '3P' : '2P';

  return (
    <g>
      {/* ── Título ── */}
      <text x={CX} y={Y_TIT} fontSize="10" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DIAGRAMA UNIFILAR GLOBAL — AMPLIAÇÃO
      </text>
      <text x={CX} y={Y_TIT + 12} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Sistema Existente/Homologado + Nova Ampliação
      </text>
      <line x1={CX - 120} y1={Y_TIT + 15} x2={CX + 120} y2={Y_TIT + 15} stroke={org} strokeWidth="1.5" />

      {/* ── REDE CEEE (topo, centralizada) ── */}
      <rect x={CX - 4} y={Y_REDE} width={8} height={40} rx="2" fill={gry} />
      <line x1={CX - 4} y1={Y_REDE + 6}  x2={CX - 50} y2={Y_REDE + 2}  stroke={blk} strokeWidth="1.5" />
      <line x1={CX - 4} y1={Y_REDE + 18} x2={CX - 50} y2={Y_REDE + 14} stroke={blk} strokeWidth="1.5" />
      <line x1={CX - 4} y1={Y_REDE + 30} x2={CX - 50} y2={Y_REDE + 28} stroke={blk} strokeWidth="1.5" />
      <text x={CX + 18} y={Y_REDE + 14} fontSize="9" fill={blk} fontWeight="700" fontFamily="sans-serif">REDE</text>
      <text x={CX + 18} y={Y_REDE + 26} fontSize="7" fill={gry} fontFamily="sans-serif">CEEE Equatorial</text>
      <text x={CX + 18} y={Y_REDE + 38} fontSize="7" fill={gry} fontFamily="sans-serif">{fd.tipoLigacao}</text>

      {/* ── Backbone central: REDE → MEDIDOR → PADRÃO ── */}
      <line x1={CX} y1={Y_REDE + 40} x2={CX} y2={Y_MED - 28} stroke={blk} strokeWidth="2" />

      {/* ── MEDIDOR BIDIRECIONAL ── */}
      <circle cx={CX} cy={Y_MED} r={28} fill="white" stroke={grn} strokeWidth="2" />
      <text x={CX} y={Y_MED - 10} fontSize="9" fill={grn} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">M</text>
      <text x={CX} y={Y_MED + 4}  fontSize="13" fill={grn} textAnchor="middle">⇄</text>
      <text x={CX} y={Y_MED + 18} fontSize="7"  fill={grn} textAnchor="middle" fontFamily="sans-serif">kWh</text>
      <text x={CX - 40} y={Y_MED + 2}  fontSize="7" fill={gry} textAnchor="end" fontFamily="sans-serif">{calc.kWpTotal} kWp</text>
      <text x={CX - 40} y={Y_MED + 12} fontSize="7" fill={gry} textAnchor="end" fontFamily="sans-serif">total</text>

      {/* MEDIDOR → PADRÃO */}
      <line x1={CX} y1={Y_MED + 28} x2={CX} y2={Y_PAD - 26} stroke={blk} strokeWidth="2" />

      {/* ── PONTO DE CONEXÃO / PADRÃO DE ENTRADA ── */}
      <rect x={CX - 110} y={Y_PAD - 26} width={220} height={52} rx="6" fill="white" stroke={blk} strokeWidth="1.8" />
      <text x={CX} y={Y_PAD - 10} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        PONTO DE CONEXÃO
      </text>
      <text x={CX} y={Y_PAD + 4} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        DJ {polosCA} {fd.disjuntorCA || '—'}A | {fd.tipoLigacao}
      </text>
      <text x={CX} y={Y_PAD + 16} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Padrão: {fd.situacaoPadrao === 'A definir pelo RT' ? 'a definir pelo RT' : fd.situacaoPadrao}
      </text>
      {/* Seta para cargas */}
      <line x1={CX + 110} y1={Y_PAD - 4} x2={CX + 150} y2={Y_PAD - 4} stroke={blk} strokeWidth="1.5" />
      <polygon points={`${CX + 150},${Y_PAD - 8} ${CX + 158},${Y_PAD - 4} ${CX + 150},${Y_PAD}`} fill={blk} />
      <text x={CX + 162} y={Y_PAD} fontSize="7" fill={blk} fontFamily="sans-serif">CARGAS</text>

      {/* PADRÃO → BIFURCAÇÃO */}
      <line x1={CX} y1={Y_PAD + 26} x2={CX} y2={Y_BRAN} stroke={blk} strokeWidth="2" />

      {/* ── Barra horizontal de bifurcação ── */}
      <line x1={CX_EX} y1={Y_BRAN} x2={CX_NV} y2={Y_BRAN} stroke={blk} strokeWidth="2" />
      <line x1={CX_EX} y1={Y_BRAN} x2={CX_EX} y2={Y_BRAN + 10} stroke={blk} strokeWidth="2" />
      <line x1={CX_NV} y1={Y_BRAN} x2={CX_NV} y2={Y_BRAN + 10} stroke={blk} strokeWidth="2" />

      {/* ── COLUNA ESQUERDA — SISTEMA EXISTENTE ── */}
      {/* Badge EXISTENTE */}
      <rect x={CX_EX - 56} y={Y_BRAN + 10} width={112} height={14} rx="3" fill="#dbeafe" stroke={blu} strokeWidth="1" />
      <text x={CX_EX} y={Y_BRAN + 20} fontSize="7.5" fill={blu} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        SISTEMA EXISTENTE / HOMOLOGADO
      </text>

      {/* Inversor existente */}
      <line x1={CX_EX} y1={Y_BRAN + 24} x2={CX_EX} y2={Y_INV - 34} stroke={blk} strokeWidth="1.5" />
      <rect x={CX_EX - 70} y={Y_INV - 34} width={140} height={68} rx="6" fill="white" stroke={slk} strokeWidth="2" />
      <text x={CX_EX} y={Y_INV - 18} fontSize="8" fill={gry} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        INVERSOR EXISTENTE
      </text>
      <text x={CX_EX} y={Y_INV - 6} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.modeloInversorExistente || '[modelo existente]'}
      </text>
      <text x={CX_EX} y={Y_INV + 8} fontSize="8" fill={blu} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        {calc.kWtCAExistente > 0 ? `${calc.kWtCAExistente} kW CA` : '— kW CA'}
      </text>
      <text x={CX_EX} y={Y_INV + 22} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {calc.kWpExistente > 0 ? `${calc.kWpExistente} kWp CC` : '— kWp CC'}
      </text>
      <GndSym x={CX_EX + 62} y={Y_INV + 10} c={grn} />

      {/* Módulos existentes (simplificado) */}
      <line x1={CX_EX} y1={Y_INV + 34} x2={CX_EX} y2={Y_STR} stroke={blk} strokeWidth="1.5" />
      {[0].map((_, i) => (
        <g key={`ex${i}`}>
          <PanelCell x={CX_EX - 18} y={Y_STR + i * 28} w={36} h={22} />
        </g>
      ))}
      <text x={CX_EX} y={Y_STR + 32} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.numeroPaineisExistentes || '—'}× {fd.potenciaWpExistente || '—'}Wp
      </text>
      <text x={CX_EX} y={Y_STR + 43} fontSize="7" fill={slk} textAnchor="middle" fontFamily="sans-serif">
        {fd.modeloPainelExistente || '[modelo existente]'}
      </text>

      {/* ── COLUNA DIREITA — SISTEMA NOVO (A AMPLIAR) ── */}
      {/* Badge NOVO */}
      <rect x={CX_NV - 62} y={Y_BRAN + 10} width={124} height={14} rx="3" fill="#dcfce7" stroke={org} strokeWidth="1" />
      <text x={CX_NV} y={Y_BRAN + 20} fontSize="7.5" fill={grn} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        A AMPLIAR / SISTEMA NOVO
      </text>

      {/* Inversor novo */}
      <line x1={CX_NV} y1={Y_BRAN + 24} x2={CX_NV} y2={Y_INV - 34} stroke={blk} strokeWidth="1.5" />
      <rect x={CX_NV - 70} y={Y_INV - 34} width={140} height={68} rx="6" fill="white" stroke={org} strokeWidth="2" />
      <text x={CX_NV} y={Y_INV - 18} fontSize="8" fill={org} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        INVERSOR NOVO
      </text>
      <text x={CX_NV} y={Y_INV - 6} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.modeloInversor || '[modelo do inversor]'}
      </text>
      <text x={CX_NV} y={Y_INV + 8} fontSize="8" fill={org} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        {calc.kWtCA > 0 ? `${calc.kWtCA} kW CA` : '— kW CA'}
      </text>
      <text x={CX_NV} y={Y_INV + 22} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {calc.kWp > 0 ? `${calc.kWp} kWp CC` : '— kWp CC'}
      </text>
      <text x={CX_NV} y={Y_INV + 35} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.tipoAmpliacao !== 'A definir pelo RT' ? fd.tipoAmpliacao : ''}
      </text>
      <GndSym x={CX_NV + 62} y={Y_INV + 10} c={grn} />

      {/* Módulos novos */}
      <line x1={CX_NV} y1={Y_INV + 34} x2={CX_NV} y2={Y_STR} stroke={blk} strokeWidth="1.5" />
      {/* Barra de strings */}
      {nStrNovo > 1 && (
        <line x1={CX_NV - 40} y1={Y_STR} x2={CX_NV + 40} y2={Y_STR} stroke={blk} strokeWidth="1.5" />
      )}
      {Array.from({ length: Math.min(nStrNovo, 2) }).map((_, i) => {
        const sx = nStrNovo === 1 ? CX_NV : (i === 0 ? CX_NV - 30 : CX_NV + 30);
        return (
          <g key={`nv${i}`}>
            {nStrNovo > 1 && <line x1={sx} y1={Y_STR} x2={sx} y2={Y_PAN - 2} stroke={blk} strokeWidth="1.2" />}
            <PanelCell x={sx - 18} y={Y_PAN} w={36} h={22} />
            <text x={sx} y={Y_PAN + 32} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
              S{i + 1}
            </text>
          </g>
        );
      })}
      {nStrNovo > 2 && (
        <text x={CX_NV} y={Y_PAN + 44} fontSize="9" fill={gry} textAnchor="middle">⋯</text>
      )}
      <text x={CX_NV} y={Y_PAN + 54} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.numeroPaineis || '—'}× {fd.potenciaUnitariaWp || '—'}Wp
      </text>
      <text x={CX_NV} y={Y_PAN + 65} fontSize="7" fill={slk} textAnchor="middle" fontFamily="sans-serif">
        {fd.paineisSerie || '—'}S × {fd.stringParalelo || '—'}P | {fd.modeloPainel || '—'}
      </text>

      {/* ── TABELA DE RESUMO ── */}
      <rect x={10} y={Y_SUM} width={520} height={88} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <text x={270} y={Y_SUM + 14} fontSize="8" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        BALANÇO DE POTÊNCIAS — SISTEMA CONSOLIDADO APÓS AMPLIAÇÃO
      </text>
      <line x1={14} y1={Y_SUM + 18} x2={526} y2={Y_SUM + 18} stroke="#cbd5e1" strokeWidth="1" />

      {/* Cabeçalho tabela */}
      {(['Item', 'Existente', 'Ampliação', 'Total'] as const).map((h, i) => (
        <text key={h} x={14 + i * 128 + 64} y={Y_SUM + 28} fontSize="7.5" fill={gry}
          textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
          {h}
        </text>
      ))}
      <line x1={14} y1={Y_SUM + 32} x2={526} y2={Y_SUM + 32} stroke="#e2e8f0" strokeWidth="1" />

      {/* Linhas da tabela */}
      {([
        ['Potência CC', `${calc.kWpExistente} kWp`, `${calc.kWp} kWp`, `${calc.kWpTotal} kWp`],
        ['Potência CA', `${calc.kWtCAExistente} kW`,  `${calc.kWtCA} kW`,  `${calc.kWtCATotal} kW`],
        ['Módulos',
          fd.numeroPaineisExistentes || '—',
          fd.numeroPaineis || '—',
          String((num(fd.numeroPaineisExistentes) + num(fd.numeroPaineis)) || '—')],
        ['Enquadramento', calc.enqNovo.replace(' Distribuída',''), calc.enqNovo.replace(' Distribuída',''), calc.enqTotal.replace(' Distribuída','')],
      ] as [string,string,string,string][]).map(([item, ex, nv, tot], ri) => (
        <g key={ri}>
          <text x={76}  y={Y_SUM + 44 + ri * 13} fontSize="7.5" fill={blk} textAnchor="middle" fontFamily="sans-serif" fontWeight="600">{item}</text>
          <text x={204} y={Y_SUM + 44 + ri * 13} fontSize="7.5" fill={blu} textAnchor="middle" fontFamily="sans-serif">{ex}</text>
          <text x={332} y={Y_SUM + 44 + ri * 13} fontSize="7.5" fill={grn} textAnchor="middle" fontFamily="sans-serif">{nv}</text>
          <text x={460} y={Y_SUM + 44 + ri * 13} fontSize="7.5" fill={blk} textAnchor="middle" fontFamily="sans-serif" fontWeight="700">{tot}</text>
        </g>
      ))}

      {/* Nota de aterramento */}
      <GndSym x={CX} y={Y_SUM + 82} c={grn} />
      <text x={CX + 22} y={Y_SUM + 86} fontSize="7" fill={gry} fontFamily="sans-serif">
        Aterramento unificado — ambos sistemas interligados ao mesmo PE [NBR 5419]
      </text>
    </g>
  );
};

export const DiagramaUnifilarVertical: React.FC<Props> = ({ fd, calc }) => {
  // ── Modo Ampliação: diagrama global ───────────────────────────
  if (fd.tipoInstalacao === 'Ampliação') {
    return <DiagramaUnifilarAmpliacao fd={fd} calc={calc} />;
  }
  const nStr = Math.min(Math.max(num(fd.stringParalelo, 1), 1), 4);
  const np = num(fd.paineisSerie, 3);
  const showPanels = Math.min(np, 2);

  const polosCA = fd.tipoLigacao === 'Trifásico' ? '3P' : '2P';
  const fmtDPS = (t: string | undefined) => { const m = (t ?? '').match(/\d/); return m ? `T${m[0]}` : 'T2'; };
  const dpsTipoCC = fmtDPS(fd.dpsCCTipo);
  const dpsTipoCA = fmtDPS(fd.dpsCATipo);

  const red = '#dc2626';
  const blk = '#1a1a2e';
  const grn = '#16a34a';
  const org = '#78B83A';
  const gry = '#64748b';

  const CX = 268;
  const Y_METER = 136;
  const Y_PAD   = 228;
  const Y_QDC   = 320;
  const Y_INV   = 428;
  const Y_SB    = 538;
  const Y_FBAR  = 602;
  const Y_STR   = 628;
  const Y_PAN   = 652;

  const strXs: number[] =
    nStr === 1
      ? [CX]
      : nStr === 2
        ? [CX - 90, CX + 90]
        : nStr === 3
          ? [CX - 135, CX, CX + 135]
          : [CX - 160, CX - 53, CX + 53, CX + 160];

  return (
    <g>
      {/* ── Título ── */}
      <text x={CX} y={18} fontSize="11" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DIAGRAMA UNIFILAR
      </text>
      <line x1={CX - 80} y1={22} x2={CX + 80} y2={22} stroke={org} strokeWidth="2" />

      {/* ── Backbone vertical ── */}
      <line x1={CX} y1={30} x2={CX} y2={Y_SB - 42} stroke={blk} strokeWidth="2" />

      {/* ══ REDE CEEE (topo) ══ */}
      <rect x={CX - 4} y={30} width={8} height={52} rx="2" fill={gry} />
      <line x1={CX - 4} y1={38} x2={CX - 55} y2={32} stroke={blk} strokeWidth="1.5" />
      <line x1={CX - 4} y1={50} x2={CX - 55} y2={46} stroke={blk} strokeWidth="1.5" />
      <line x1={CX - 4} y1={62} x2={CX - 55} y2={60} stroke={blk} strokeWidth="1.5" />
      <text x={CX + 18} y={44} fontSize="10" fill={blk} fontWeight="700" fontFamily="sans-serif">
        REDE
      </text>
      <text x={CX + 18} y={56} fontSize="9" fill={gry} fontFamily="sans-serif">
        CEEE Equatorial
      </text>
      <text x={CX + 18} y={68} fontSize="8" fill={gry} fontFamily="sans-serif">
        {fd.tipoLigacao || 'Monofásico'}
      </text>

      {/* ══ MEDIDOR BIDIRECIONAL ══ */}
      <circle cx={CX} cy={Y_METER} r={38} fill="white" stroke={grn} strokeWidth="2" />
      <text x={CX} y={Y_METER - 14} fontSize="10" fill={grn} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        M
      </text>
      <text x={CX} y={Y_METER + 3} fontSize="16" fill={grn} textAnchor="middle">
        ⇄
      </text>
      <text x={CX} y={Y_METER + 17} fontSize="8" fill={grn} textAnchor="middle" fontFamily="sans-serif">
        kWh
      </text>
      <text x={CX - 50} y={Y_METER} fontSize="8" fill={gry} textAnchor="end" fontFamily="sans-serif">
        ← {calc.kWp}kWp
      </text>
      <text x={CX - 50} y={Y_METER + 11} fontSize="7" fill={gry} textAnchor="end" fontFamily="sans-serif">
        injetado
      </text>

      {/* ══ PADRÃO DE ENTRADA ══ */}
      <rect x={CX - 100} y={Y_PAD - 30} width={200} height={60} rx="6" fill="white" stroke={blk} strokeWidth="1.8" />
      <text x={CX} y={Y_PAD - 14} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        PADRÃO DE ENTRADA
      </text>
      <text x={CX} y={Y_PAD + 2} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        DJ {polosCA} {fd.disjuntorCA || '—'}A — {fd.tipoLigacao || 'Mono'}
      </text>
      <text x={CX} y={Y_PAD + 15} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        #{fd.secaoCaboCA || '6'}mm² PVC 70° 750V
      </text>
      <line x1={CX + 100} y1={Y_PAD} x2={CX + 150} y2={Y_PAD} stroke={blk} strokeWidth="1.5" />
      <polygon
        points={`${CX + 150},${Y_PAD - 4} ${CX + 158},${Y_PAD} ${CX + 150},${Y_PAD + 4}`}
        fill={blk}
      />
      <text x={CX + 162} y={Y_PAD + 4} fontSize="8" fill={blk} fontFamily="sans-serif">
        CARGAS
      </text>

      {/* ══ QDC CA ══ */}
      <rect x={CX - 112} y={Y_QDC - 38} width={224} height={76} rx="6" fill="white" stroke={blk} strokeWidth="1.8" />
      <text x={CX} y={Y_QDC - 22} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        QUADRO DISTRIBUIÇÃO CA
      </text>
      <CBSym x={CX - 36} y={Y_QDC} c={blk} />
      <text x={CX - 36} y={Y_QDC + 22} fontSize="7" fill={blk} textAnchor="middle" fontFamily="sans-serif">
        DJ {polosCA} {fd.disjuntorCA || '—'}A
      </text>
      <DPSSym x={CX + 36} y={Y_QDC} c={red} />
      <text x={CX + 36} y={Y_QDC + 22} fontSize="7" fill={red} textAnchor="middle" fontFamily="sans-serif">
        DPS {dpsTipoCA} {fd.dpsCATensao || '275'}V
      </text>
      <GndSym x={CX} y={Y_QDC + 30} c={grn} />

      {/* ══ INVERSOR ══ */}
      <rect x={CX - 120} y={Y_INV - 48} width={240} height={96} rx="8" fill="white" stroke={org} strokeWidth="2.5" />
      <text x={CX} y={Y_INV - 32} fontSize="10" fill={org} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        INVERSOR STRING
      </text>
      <text x={CX} y={Y_INV - 18} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.modeloInversor || 'Modelo do Inversor'}
      </text>
      <text x={CX} y={Y_INV - 6} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {(num(fd.potenciaCAkW) * num(fd.quantidadeInversores, 1)) || '—'} kW CA
      </text>
      <text x={CX} y={Y_INV + 12} fontSize="20" fill={org} textAnchor="middle">
        ⚡
      </text>
      <text x={CX - 30} y={Y_INV + 30} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        DC
      </text>
      <text x={CX + 30} y={Y_INV + 30} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        AC
      </text>
      <line x1={CX - 14} y1={Y_INV + 24} x2={CX + 14} y2={Y_INV + 24} stroke={gry} strokeWidth="1" />
      <text x={CX} y={Y_INV + 42} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        59·27·25·81 | ABNT NBR 16690
      </text>
      <GndSym x={CX + 110} y={Y_INV + 20} c={grn} />

      {/* ══ STRING BOX CC ══ */}
      <rect x={CX - 130} y={Y_SB - 42} width={260} height={84} rx="6" fill="white" stroke={blk} strokeWidth="1.8" />
      <text x={CX} y={Y_SB - 26} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        STRING BOX CC
      </text>
      <text x={CX} y={Y_SB - 12} fontSize="8" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {nStr}× Fus. 2P {fd.disjuntorCC || '—'}A | DPS {dpsTipoCC} {fd.dpsCCTensao || '1000'}V CC
      </text>
      <CBSym x={CX - 40} y={Y_SB + 10} c={blk} />
      <DPSSym x={CX + 20} y={Y_SB + 10} c={red} />
      <text x={CX - 40} y={Y_SB + 30} fontSize="7" fill={blk} textAnchor="middle" fontFamily="sans-serif">
        {fd.disjuntorCC || '—'}A
      </text>
      <text x={CX + 20} y={Y_SB + 30} fontSize="7" fill={red} textAnchor="middle" fontFamily="sans-serif">
        {fd.dpsCCTensao || '1000'}V
      </text>
      <text x={CX + 95} y={Y_SB - 18} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        #{fd.secaoCaboCC || '6'}mm²
      </text>

      {/* ══ FAN-OUT BAR ══ */}
      {nStr > 1 && (
        <line
          x1={strXs[0]}
          y1={Y_FBAR}
          x2={strXs[nStr - 1]}
          y2={Y_FBAR}
          stroke={blk}
          strokeWidth="2"
        />
      )}
      {strXs.map((sx, i) => (
        <line key={`vl${i}`} x1={sx} y1={Y_SB + 42} x2={sx} y2={Y_FBAR + 4} stroke={blk} strokeWidth="1.5" />
      ))}

      {/* ══ STRINGS + PAINÉIS ══ */}
      {strXs.map((sx, i) => (
        <g key={`str${i}`}>
          <line x1={sx} y1={Y_FBAR} x2={sx} y2={Y_STR - 2} stroke={blk} strokeWidth="1.5" />
          <text x={sx} y={Y_STR + 10} fontSize="7" fill={blk} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
            Str {i + 1}
          </text>
          <text x={sx} y={Y_STR + 21} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
            MPPT{i + 1}
          </text>
          <line x1={sx - 6} y1={Y_STR + 24} x2={sx - 6} y2={Y_PAN} stroke={red} strokeWidth="1.5" />
          <line x1={sx + 6} y1={Y_STR + 24} x2={sx + 6} y2={Y_PAN} stroke={blk} strokeWidth="1.5" />
          <text x={sx - 13} y={Y_PAN - 3} fontSize="8" fill={red} textAnchor="middle">
            +
          </text>
          <text x={sx + 13} y={Y_PAN - 3} fontSize="8" fill={blk} textAnchor="middle">
            −
          </text>
          {Array.from({ length: showPanels }).map((_, pi) => (
            <PanelCell key={pi} x={sx - 18} y={Y_PAN + pi * 30} w={36} h={24} />
          ))}
          {showPanels < np && (
            <text x={sx} y={Y_PAN + showPanels * 30 + 12} fontSize="11" fill={gry} textAnchor="middle">
              ⋯
            </text>
          )}
          <text
            x={sx}
            y={Y_PAN + showPanels * 30 + (showPanels < np ? 26 : 16)}
            fontSize="7"
            fill={gry}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {np}×{fd.potenciaUnitariaWp || '—'}Wp
          </text>
        </g>
      ))}
    </g>
  );
};
