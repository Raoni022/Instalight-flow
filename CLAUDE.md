# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc + vite build → dist/
npm run lint         # TypeScript type-check only (tsc --noEmit); no ESLint configured
npm run test         # Vitest run (single pass)
npm run test:watch   # Vitest watch mode

# Run a single test file
npx vitest run tests/calcularSistema.test.ts

# Deploy: push to main → Vercel auto-deploys in ~30s
```

> **Note:** The `README.md` describes an older single-file HTML architecture. The current codebase is a proper Vite + React + TypeScript app. Ignore the README's architectural descriptions.

## Architecture Overview

**GD Docs — Instalight Flow** is a stateless SPA that generates the complete documentation package for solar photovoltaic micro/mini-generation projects submitted to CEEE Equatorial (Rio Grande do Sul, Brazil). It has no database. All state is in-memory during the session; projects are persisted to `localStorage`.

### Data flow

```
FormData (60+ fields, typed in src/types.ts)
    │
    ├─→ calcularSistema(fd) → Calculos  [useMemo — pure JS, never AI]
    │       └─ drives all SVG diagrams and document templates
    │
    ├─→ validarProjeto(fd, calc) → ValidationIssue[]  [useMemo]
    │       └─ gates ZIP export on zero 'erro'-level issues
    │
    └─→ AI calls (callAPI in src/helpers/api.ts)
            └─ ONLY for: text extraction from uploaded docs, 4 narrative sections
               in the memorial, optional procuration refinement
```

### Central state (`src/App.tsx`)

All state lives in `App.tsx`. The main actors:
- `formData` / `onChange` — single source of truth for the 60-field project form
- `projetoAberto` — `null` = HomeScreen rendered; any object = editor rendered
- `docsGerados` — tracks which PDFs have been generated this session
- `calc` / `validacoes` — derived via `useMemo`; never stored, never passed to AI as mutable

`projetoAberto === null` renders `<HomeScreen>`; any truthy value renders the full editor layout (Header + Sidebar + Tab).

### The AI boundary — enforce strictly

**AI never does electrical calculations.** This is a hard architectural invariant:
- `src/engine/calcularSistema.ts` — pure JS only, no imports from `helpers/api.ts`
- `src/engine/validarProjeto.ts` — pure JS only, no imports from `helpers/api.ts`
- AI receives the already-calculated `calc` object as read-only context for generating prose

AI is used in exactly three places:
1. `UploadModule.tsx` — data extraction from PDFs/images with `temperature: 0.1`
2. `MemorialTab.tsx` — fills four `[[[IA_NARRATIVA_SECx]]]` placeholders in the 15-section memorial template
3. `DocumentosTab.tsx` — optional refinement of the pre-generated procuration text

### Production API routing

- **Dev:** `callAPI()` calls Anthropic directly with the user's API key in the request header
- **Production:** `callAPI()` calls `/api/claude` (Vercel serverless), which holds `ANTHROPIC_API_KEY` server-side and passes the entire request body to Anthropic unchanged — so new parameters added to `callAPI()` (e.g., `temperature`) work automatically without touching the proxy

### Constants that need annual review (`src/constants.ts`)

```ts
IRRAD = 4.8      // kWh/m²/day — Porto Alegre solar irradiation (CRESESB)
TARIFA = 0.85    // R$/kWh — average CEEE Equatorial tariff
CO2_FACTOR = 0.0783  // kgCO₂/kWh — SIN emission factor (ANEEL 2023)
```

`CO2_FACTOR` must match the value declared in the narrative text of `src/helpers/memorial.ts`. There is an existing bug where the memorial text says `0,10 kgCO₂/kWh` but the engine uses `0.0783` — fix by using the imported constant.

### SVG diagrams

All diagrams are pure React components returning SVG JSX — no diagram library. The prancha (`PranchaCompleta.tsx`) renders at 1600×980 and composes `DiagramaUnifilarVertical` and `DiagramaMultifilarMelhorado` as children. Both update in real time as `formData` changes.

Key parametric behaviors:
- `stringParalelo` (1–4): changes fan-out column layout in the unifilar
- `tipoLigacao`: drives conductor count in the multifilar (3/4/5 wires)
- `dpsCCTipo` / `dpsCATipo`: formatted as "T2" via `fmtDPS()` helper in both diagram files — keep this helper in sync between them

### Document generation pipeline

```
helpers/memorial.ts   → buildMemorialTemplate(fd, calc) → string with [[[markers]]]
helpers/export.ts     → gerarTextoProcuracao / _buildFormularioPDF / _buildPendenciasPDF
helpers/pdf.ts        → makePDF(), pdfHeader(), pdfFooter(), pdfRTWarning(), addTextBlock()
helpers/zip.ts        → exportarDossieZip() bundles SVG + 4 PDFs
helpers/filename.ts   → consistent naming: instalight_{tipo}_{UC}_{date}.{ext}
```

Every generated PDF must have the red `pdfRTWarning()` banner ("DOCUMENTO SEM VALIDADE JURÍDICA — ASSINATURA DO RESPONSÁVEL TÉCNICO HABILITADO OBRIGATÓRIA").

### Project persistence

Projects are stored in `localStorage` under the key `instalight_projects` as an array of `ProjetoSalvo` objects (defined in `src/types.ts`). Binary files cannot be stored — only file metadata (`DocAnexo`: name, type, size) is persisted alongside the project.

### Validation codes

Validation codes follow the pattern `[CATEGORY][NN]`:
- `UC01–04` — mandatory UC/client fields
- `RT01–03` — responsible technician fields
- `SFV01–15` — photovoltaic system checks (topology, voltages, currents, MPPT)
- `CAB01–02` — voltage drop limits (CC ≤ 3%, CA ≤ 2%)
- `DPS01–02` — surge protection ratings
- `AT01` — grounding resistance
- `ENQ01` — mini-generation classification info

### Tests

Tests cover `src/engine/calcularSistema.ts` only (Vitest). The base fixture is a 10-panel 550Wp 5S×2P monofásico 5kW system. When touching the calculation engine, run tests before and after. No tests exist for UI components or document generation.
