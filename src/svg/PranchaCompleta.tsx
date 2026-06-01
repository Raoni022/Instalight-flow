/**
 * PranchaCompleta.tsx — Prancha Elétrica Profissional 1600×980
 *
 * Layout padrão CEEE:
 *   Header (65px) → Coluna esquerda Unifilar (540px) + Coluna direita (1060px)
 *   Carimbo completo 4 colunas (90px) → Footer normas (50px)
 */

import { forwardRef } from 'react';
import type { FormData, Calculos } from '../types';
import { DiagramaUnifilarVertical } from './DiagramaUnifilarVertical';
import { DiagramaMultifilarMelhorado } from './DiagramaMultifilarMelhorado';
import { GndSym, CBSym, DPSSym, PanelCell } from './symbols';

export type TipoDiagrama = 'ambos' | 'unifilar' | 'multifilar';

interface Props {
  fd: FormData;
  calc: Calculos;
  tipoDiagrama?: TipoDiagrama;
}

const num = (v: string | undefined, d = 0): number => parseFloat(v ?? '') || d;

export const PranchaCompleta = forwardRef<SVGSVGElement, Props>(({ fd, calc, tipoDiagrama = 'ambos' }, ref) => {
  const W = 1600;
  const H = 980;

  const org = '#78B83A';
  const blk = '#1a1a2e';
  const gry = '#64748b';
  const sl  = '#cbd5e1';
  const grn = '#16a34a';

  const polosCA = fd.tipoLigacao === 'Trifásico' ? '3P' : '2P';
  const fmtDPS = (t: string | undefined) => { const m = (t ?? '').match(/\d/); return m ? `T${m[0]}` : 'T2'; };
  const dpsTipoCC = fmtDPS(fd.dpsCCTipo);
  const dpsTipoCA = fmtDPS(fd.dpsCATipo);

  const HD    = 65;
  const UNI_W = 540;
  const RIG_X = 540;

  const MF_Y = HD;
  const MF_H = 330;
  const D1_Y = 395;
  const D1_H = 220;
  const D2_Y = 615;
  const D2_H = 225;
  const CB_Y = 840;
  const CB_H = 90;
  const FT_Y = 930;
  const FT_H = 50;

  const sunRays = [0, 60, 120, 180, 240, 300].map((a, i) => {
    const r  = (a * Math.PI) / 180;
    const x1 = 40 + 14 * Math.sin(r);
    const y1 = 32 - 14 * Math.cos(r);
    const x2 = 40 + 20 * Math.sin(r);
    const y2 = 32 - 20 * Math.cos(r);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={org} strokeWidth="2" />;
  });

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', background: 'white' }}
    >
      {/* ══════ HEADER ══════ */}
      <rect x={0} y={0} width={W} height={HD} fill={blk} />
      <rect x={0} y={HD - 2} width={W} height={2} fill={org} />

      {/* Logo */}
      <circle cx={40} cy={32} r={18} fill={org} opacity="0.18" />
      {sunRays}
      <text x={68} y={28} fontSize="16" fill="white" fontWeight="800" fontFamily="sans-serif">
        Instalight
      </text>
      <text x={68} y={44} fontSize="9" fill={org} fontFamily="sans-serif">
        Energia Solar
      </text>

      {/* Título central */}
      <text x={W / 2} y={24} fontSize="14" fill="white" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        {tipoDiagrama === 'unifilar'
          ? 'DIAGRAMA UNIFILAR — SISTEMA FOTOVOLTAICO ON-GRID'
          : tipoDiagrama === 'multifilar'
            ? 'DIAGRAMA MULTIFILAR — SISTEMA FOTOVOLTAICO ON-GRID'
            : 'PRANCHA ELÉTRICA — SISTEMA FOTOVOLTAICO ON-GRID'}
      </text>
      <text x={W / 2} y={40} fontSize="10" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
        {fd.nomeCliente || 'Cliente'} | UC: {fd.codigoUC || '—'} | {fd.endereco || 'Endereço'}
      </text>
      <text x={W / 2} y={56} fontSize="9" fill={org} textAnchor="middle" fontFamily="sans-serif">
        {calc.enqTotal} | {fd.tipoInstalacao === 'Ampliação' && calc.kWpExistente > 0
          ? `+${calc.kWp} kWp (total: ${calc.kWpTotal} kWp)`
          : `${calc.kWp} kWp CC / ${calc.kWtCA} kW CA`} | {fd.tipoLigacao} | CEEE Equatorial
      </text>

      {/* Mini carimbo direita */}
      <rect x={W - 290} y={4} width={285} height={57} rx="3" fill="#0f172a" stroke={org} strokeWidth="1" />
      <text x={W - 147} y={17} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
        RESPONSÁVEL TÉCNICO
      </text>
      <text x={W - 147} y={30} fontSize="9" fill="white" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        {fd.nomeResponsavel || '—'}
      </text>
      <text x={W - 147} y={42} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
        CRT: {fd.numeroCRT || '—'} | {fd.tipoResponsabilidade || 'TRT'}: {fd.numART || '—'}
      </text>
      <line x1={W - 290} y1={48} x2={W - 5} y2={48} stroke="#334155" strokeWidth="1" />
      <text x={W - 240} y={58} fontSize="7" fill={gry} fontFamily="sans-serif">
        PE: {fd.numProjeto || '—'}
      </text>
      <text x={W - 147} y={58} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Rev.0 | Fl.1/1 | S/E
      </text>
      <text x={W - 60} y={58} fontSize="7" fill={gry} fontFamily="sans-serif">
        {fd.dataproject || '—'}
      </text>

      {/* ══════ COLUNA ESQUERDA — UNIFILAR VERTICAL ══════ */}
      <rect x={0} y={HD} width={UNI_W} height={H - HD - CB_H - FT_H} fill="white" />
      {tipoDiagrama !== 'multifilar' && (
        <line x1={UNI_W} y1={HD} x2={UNI_W} y2={CB_Y} stroke={sl} strokeWidth="1" />
      )}
      {(tipoDiagrama === 'ambos' || tipoDiagrama === 'unifilar') && (
        <g transform={`translate(0,${HD + 10})`}>
          <DiagramaUnifilarVertical fd={fd} calc={calc} />
        </g>
      )}

      {/* ══════ COLUNA DIREITA — MULTIFILAR ══════ */}
      <rect x={RIG_X} y={MF_Y} width={W - RIG_X} height={MF_H} fill="white" />
      <line x1={RIG_X} y1={MF_Y + MF_H} x2={W} y2={MF_Y + MF_H} stroke={sl} strokeWidth="1" />
      {(tipoDiagrama === 'ambos' || tipoDiagrama === 'multifilar') && (
        <g transform={`translate(${RIG_X + 12},${MF_Y + 14})`}>
          <DiagramaMultifilarMelhorado fd={fd} calc={calc} />
        </g>
      )}

      {/* ══════ PADRÃO DE ENTRADA (520×220) ══════ */}
      <rect x={RIG_X} y={D1_Y} width={520} height={D1_H} fill="white" />
      <line x1={RIG_X + 520} y1={D1_Y} x2={RIG_X + 520} y2={D1_Y + D1_H} stroke={sl} strokeWidth="1" />
      <line x1={RIG_X} y1={D1_Y + D1_H} x2={W} y2={D1_Y + D1_H} stroke={sl} strokeWidth="1" />

      <text x={RIG_X + 260} y={D1_Y + 16} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DETALHE — PADRÃO DE ENTRADA
      </text>
      <text x={RIG_X + 260} y={D1_Y + 28} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        SEM ESCALA
      </text>

      {/* Poste */}
      <rect x={RIG_X + 40} y={D1_Y + 40} width={8} height={140} rx="2" fill={gry} />
      <line x1={RIG_X + 44} y1={D1_Y + 40} x2={RIG_X + 120} y2={D1_Y + 48} stroke={blk} strokeWidth="1.5" />
      <line x1={RIG_X + 44} y1={D1_Y + 58} x2={RIG_X + 120} y2={D1_Y + 64} stroke={blk} strokeWidth="1.5" />

      {/* Caixa medidor */}
      <rect x={RIG_X + 120} y={D1_Y + 50} width={80} height={60} rx="4" fill="white" stroke={grn} strokeWidth="1.8" />
      <text x={RIG_X + 160} y={D1_Y + 68} fontSize="8" fill={grn} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        M ⇄
      </text>
      <text x={RIG_X + 160} y={D1_Y + 80} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Bidirecional
      </text>
      <text x={RIG_X + 160} y={D1_Y + 92} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        CEEE instala
      </text>

      {/* Cabo entrada */}
      <line x1={RIG_X + 200} y1={D1_Y + 80} x2={RIG_X + 280} y2={D1_Y + 80} stroke={blk} strokeWidth="2" />
      <text x={RIG_X + 240} y={D1_Y + 74} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        #{fd.secaoCaboCA || '16'}mm²
      </text>

      {/* Disjuntor geral */}
      <CBSym x={RIG_X + 290} y={D1_Y + 80} c={blk} />
      <text x={RIG_X + 290} y={D1_Y + 100} fontSize="7" fill={blk} textAnchor="middle" fontFamily="sans-serif">
        DJ {polosCA} {fd.disjuntorCA || '—'}A
      </text>

      {/* QDC */}
      <rect x={RIG_X + 330} y={D1_Y + 60} width={80} height={40} rx="4" fill="white" stroke={blk} strokeWidth="1.5" />
      <text x={RIG_X + 370} y={D1_Y + 76} fontSize="8" fill={blk} textAnchor="middle" fontWeight="600" fontFamily="sans-serif">
        QDC CA
      </text>
      <text x={RIG_X + 370} y={D1_Y + 88} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        → QDC
      </text>
      <line x1={RIG_X + 310} y1={D1_Y + 80} x2={RIG_X + 330} y2={D1_Y + 80} stroke={blk} strokeWidth="2" />

      {/* GND */}
      <GndSym x={RIG_X + 44} y={D1_Y + 175} c={grn} />
      <text x={RIG_X + 100} y={D1_Y + 195} fontSize="7" fill={gry} fontFamily="sans-serif">
        * Medidor bidirecional instalado pela CEEE Equatorial
      </text>
      <text x={RIG_X + 100} y={D1_Y + 206} fontSize="7" fill={gry} fontFamily="sans-serif">
        {'  '}Ramal de entrada conforme padrão CEEE vigente
      </text>

      {/* ══════ DETALHE ATERRAMENTO (520×220) ══════ */}
      <rect x={RIG_X + 520} y={D1_Y} width={520} height={D1_H} fill="white" />
      <text x={RIG_X + 780} y={D1_Y + 16} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DETALHE — SISTEMA DE ATERRAMENTO
      </text>
      <text x={RIG_X + 780} y={D1_Y + 28} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        SEM ESCALA
      </text>

      {/* 3 hastes */}
      {[80, 200, 320].map((hx, i) => (
        <g key={i}>
          <rect x={RIG_X + 520 + hx - 4} y={D1_Y + 70} width={8} height={80} rx="1" fill={gry} />
          <GndSym x={RIG_X + 520 + hx} y={D1_Y + 65} c={grn} />
          <text x={RIG_X + 520 + hx} y={D1_Y + 160} fontSize="6" fill={gry} textAnchor="middle" fontFamily="sans-serif">
            5/8″×2400mm
          </text>
        </g>
      ))}

      {/* Cabo nu ligando hastes */}
      <line
        x1={RIG_X + 520 + 80}
        y1={D1_Y + 85}
        x2={RIG_X + 520 + 320}
        y2={D1_Y + 85}
        stroke="#ca8a04"
        strokeWidth="2.5"
      />
      <text x={RIG_X + 780} y={D1_Y + 80} fontSize="7" fill="#ca8a04" textAnchor="middle" fontFamily="sans-serif">
        Cu nu #16mm²
      </text>

      {/* Caixa inspeção */}
      <rect x={RIG_X + 520 + 180} y={D1_Y + 100} width={40} height={40} rx="2" fill="white" stroke={gry} strokeWidth="1.5" />
      <line x1={RIG_X + 520 + 180} y1={D1_Y + 100} x2={RIG_X + 520 + 220} y2={D1_Y + 140} stroke={gry} strokeWidth="1" />
      <line x1={RIG_X + 520 + 220} y1={D1_Y + 100} x2={RIG_X + 520 + 180} y2={D1_Y + 140} stroke={gry} strokeWidth="1" />
      <text x={RIG_X + 780} y={D1_Y + 155} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Caixa de inspeção
      </text>
      <text x={RIG_X + 780} y={D1_Y + 170} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Espaçamento: 3,0m entre hastes
      </text>
      <text x={RIG_X + 780} y={D1_Y + 185} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {fd.resistenciaAterramento
          ? `R_med = ${fd.resistenciaAterramento} Ω ✓ (NBR 5419 ≤ 10 Ω)`
          : 'Resistência ≤ 10 Ω conforme NBR 5419'}
      </text>

      {/* ══════ SIMBOLOGIA (520×225) ══════ */}
      <rect x={RIG_X} y={D2_Y} width={520} height={D2_H} fill="white" />
      <line x1={RIG_X + 520} y1={D2_Y} x2={RIG_X + 520} y2={D2_Y + D2_H} stroke={sl} strokeWidth="1" />
      <text x={RIG_X + 260} y={D2_Y + 16} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        SIMBOLOGIA / LEGENDA
      </text>
      <line x1={RIG_X + 10} y1={D2_Y + 22} x2={RIG_X + 510} y2={D2_Y + 22} stroke={sl} strokeWidth="1" />

      <CBSym x={RIG_X + 30} y={D2_Y + 42} c={blk} />
      <text x={RIG_X + 60} y={D2_Y + 38} fontSize="8" fill={blk} fontFamily="sans-serif">Disjuntor termomagnético</text>

      <DPSSym x={RIG_X + 30} y={D2_Y + 76} c={blk} />
      <text x={RIG_X + 60} y={D2_Y + 72} fontSize="8" fill={blk} fontFamily="sans-serif">DPS — Prot. contra surtos</text>

      <GndSym x={RIG_X + 30} y={D2_Y + 108} c={grn} />
      <text x={RIG_X + 60} y={D2_Y + 106} fontSize="8" fill={blk} fontFamily="sans-serif">Aterramento / Terra (PE)</text>

      <PanelCell x={RIG_X + 12} y={D2_Y + 128} w={36} h={22} />
      <text x={RIG_X + 60} y={D2_Y + 140} fontSize="8" fill={blk} fontFamily="sans-serif">Módulo fotovoltaico</text>

      {/* Condutores legenda */}
      {([
        { y: D2_Y + 170, c: '#dc2626', label: 'Condutor CC (+) positivo' },
        { y: D2_Y + 186, c: blk,       label: 'Condutor CC (−) negativo' },
        { y: D2_Y + 202, c: blk,       label: 'Condutor CA fase (L1)' },
        { y: D2_Y + 218, c: '#3b82f6', label: 'Condutor neutro (N)' },
      ] as const).map((row, i) => (
        <g key={i}>
          <line x1={RIG_X + 12} y1={row.y} x2={RIG_X + 50} y2={row.y} stroke={row.c} strokeWidth="2" />
          <text x={RIG_X + 58} y={row.y + 4} fontSize="8" fill={blk} fontFamily="sans-serif">
            {row.label}
          </text>
        </g>
      ))}
      <line x1={RIG_X + 12} y1={D2_Y + 234} x2={RIG_X + 50} y2={D2_Y + 234} stroke={grn} strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={RIG_X + 58} y={D2_Y + 238} fontSize="8" fill={blk} fontFamily="sans-serif">
        Condutor PE / aterramento
      </text>
      <text x={RIG_X + 12} y={D2_Y + 254} fontSize="7" fill={gry} fontFamily="sans-serif" fontStyle="italic">
        Símbolos conforme ABNT NBR 6148 / IEC 60617 (versão simplificada)
      </text>

      {/* ══════ DADOS DO PROJETO (520×225) ══════ */}
      <rect x={RIG_X + 520} y={D2_Y} width={520} height={D2_H} fill="white" />
      <text x={RIG_X + 780} y={D2_Y + 16} fontSize="9" fill={blk} textAnchor="middle" fontWeight="700" fontFamily="sans-serif">
        DADOS DO PROJETO
      </text>
      <line x1={RIG_X + 530} y1={D2_Y + 22} x2={W - 10} y2={D2_Y + 22} stroke={sl} strokeWidth="1" />

      {([
        ['Módulo FV:',      `${fd.modeloPainel || '—'} — ${fd.potenciaUnitariaWp || '—'} Wp`],
        ['Inversor:',       `${fd.modeloInversor || '—'} — ${num(fd.potenciaCAkW) * num(fd.quantidadeInversores, 1) || '—'} kW`],
        ['Configuração:',   `${fd.paineisSerie || '—'}S × ${fd.stringParalelo || '—'}P (${num(fd.numeroPaineis)} módulos)`],
        ['Potência CC:',    `${calc.kWp} kWp`],
        ['Potência CA:',    `${calc.kWtCA} kW`],
        ['Tensão/Ligação:', `${fd.tipoLigacao || '—'} — 220V`],
        ['Enquadramento:',  calc.enq],
        ['Geração estimada:', `${calc.geracaoAnual.toLocaleString('pt-BR')} kWh/ano`],
        ['CO₂ evitado:',    `${calc.co2EvitadoAnual.toLocaleString('pt-BR')} kg/ano`],
        ['Cabo CC:',        `#${fd.secaoCaboCC || '6'}mm² PVC 70° 750V`],
        ['Cabo CA:',        `#${fd.secaoCaboCA || '6'}mm² PVC 70° 750V`],
        ['Proteção CC:',    `DPS ${dpsTipoCC} ${fd.dpsCCTensao || '1000'}V CC`],
        ['Proteção CA:',    `DJ ${polosCA} ${fd.disjuntorCA || '—'}A | DPS ${dpsTipoCA} ${fd.dpsCATensao || '275'}V CA`],
      ] as [string, string][]).map(([k, v], i) => (
        <g key={i}>
          <text x={RIG_X + 535} y={D2_Y + 36 + i * 15} fontSize="8" fill={gry} fontFamily="sans-serif" fontWeight="600">
            {k}
          </text>
          <text x={RIG_X + 650} y={D2_Y + 36 + i * 15} fontSize="8" fill={blk} fontFamily="sans-serif">
            {v}
          </text>
        </g>
      ))}

      {/* ══════ CARIMBO COMPLETO 4 COLUNAS ══════ */}
      <rect x={0} y={CB_Y} width={W} height={CB_H} fill="#f8fafc" />
      <line x1={0} y1={CB_Y} x2={W} y2={CB_Y} stroke={blk} strokeWidth="2" />
      {[400, 800, 1200].map((x) => (
        <line key={x} x1={x} y1={CB_Y} x2={x} y2={CB_Y + CB_H} stroke={sl} strokeWidth="1" />
      ))}

      {/* Col 1 — Empresa */}
      <text x={10} y={CB_Y + 16} fontSize="8" fill={gry} fontFamily="sans-serif" fontWeight="700">EMPRESA INSTALADORA</text>
      <text x={10} y={CB_Y + 30} fontSize="9" fill={blk} fontFamily="sans-serif" fontWeight="700">{fd.nomeEmpresa || 'Instalight Energia Solar'}</text>
      <text x={10} y={CB_Y + 44} fontSize="8" fill={gry} fontFamily="sans-serif">CNPJ: {fd.cnpjEmpresa || '—'}</text>
      <text x={10} y={CB_Y + 58} fontSize="8" fill={gry} fontFamily="sans-serif">{fd.enderecoEmpresa || '—'}</text>

      {/* Col 2 — UC */}
      <text x={410} y={CB_Y + 16} fontSize="8" fill={gry} fontFamily="sans-serif" fontWeight="700">UNIDADE CONSUMIDORA</text>
      <text x={410} y={CB_Y + 30} fontSize="9" fill={blk} fontFamily="sans-serif" fontWeight="700">{fd.nomeCliente || '—'}</text>
      <text x={410} y={CB_Y + 44} fontSize="8" fill={gry} fontFamily="sans-serif">UC: {fd.codigoUC || '—'} | CPF/CNPJ: {fd.cpfCnpj || '—'}</text>
      <text x={410} y={CB_Y + 58} fontSize="8" fill={gry} fontFamily="sans-serif">{fd.endereco || '—'}</text>

      {/* Col 3 — RT */}
      <text x={810} y={CB_Y + 16} fontSize="8" fill={gry} fontFamily="sans-serif" fontWeight="700">RESPONSÁVEL TÉCNICO</text>
      <text x={810} y={CB_Y + 30} fontSize="9" fill={blk} fontFamily="sans-serif" fontWeight="700">{fd.nomeResponsavel || '—'}</text>
      <text x={810} y={CB_Y + 44} fontSize="8" fill={gry} fontFamily="sans-serif">CRT: {fd.numeroCRT || '—'}</text>
      <text x={810} y={CB_Y + 58} fontSize="8" fill={gry} fontFamily="sans-serif">{fd.tipoResponsabilidade || 'TRT'}: {fd.numART || '—'}</text>

      {/* Col 4 — Projeto */}
      <text x={1210} y={CB_Y + 16} fontSize="8" fill={gry} fontFamily="sans-serif" fontWeight="700">IDENTIFICAÇÃO DO PROJETO</text>
      <text x={1210} y={CB_Y + 30} fontSize="8" fill={blk} fontFamily="sans-serif">Nº PE: {fd.numProjeto || '—'}</text>
      <text x={1210} y={CB_Y + 44} fontSize="8" fill={blk} fontFamily="sans-serif">Data: {fd.dataproject || '—'} | Rev.: 0</text>
      <text x={1210} y={CB_Y + 58} fontSize="8" fill={blk} fontFamily="sans-serif">Folha: 1/1 | Escala: S/E</text>

      {/* Linha inferior carimbo */}
      <line x1={0} y1={CB_Y + CB_H - 18} x2={W} y2={CB_Y + CB_H - 18} stroke={sl} strokeWidth="1" />
      <text x={W / 2} y={CB_Y + CB_H - 6} fontSize="7" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        Elaborado conforme ABNT NBR 16690, NBR 5410, NBR 5419, REN ANEEL 1.000/2021 e Lei Federal 14.300/2022
      </text>

      {/* ══════ FOOTER NORMAS ══════ */}
      <rect x={0} y={FT_Y} width={W} height={FT_H} fill="#f1f5f9" />
      <line x1={0} y1={FT_Y} x2={W} y2={FT_Y} stroke={sl} strokeWidth="1" />
      <text x={W / 2} y={FT_Y + 18} fontSize="9" fill={gry} textAnchor="middle" fontFamily="sans-serif">
        {calc.enq} | Prazo análise CEEE: {calc.prazo} | {fd.cidade || 'Porto Alegre'}/{fd.dataproject || ''}
      </text>
      <text x={W / 2} y={FT_Y + 34} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">
        Microgeração/Minigeração Distribuída Solar Fotovoltaica — Conexão à rede CEEE Equatorial
      </text>
    </svg>
  );
});

PranchaCompleta.displayName = 'PranchaCompleta';
