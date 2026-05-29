# GD Docs — Instalight Flow

> Plataforma web **single-file** para geração automatizada de toda a documentação técnica necessária ao protocolo de micro e minigeração distribuída solar fotovoltaica junto à **CEEE Equatorial** (Rio Grande do Sul).

---

## Índice

1. [Objetivo](#objetivo)
2. [Contexto do Problema](#contexto-do-problema)
3. [Decisão Arquitetural: Single-File HTML](#decisão-arquitetural-single-file-html)
4. [Stack Técnica](#stack-técnica)
5. [Motor de Cálculos (JS puro — sem IA)](#motor-de-cálculos-js-puro--sem-ia)
6. [Sistema de Diagramas SVG](#sistema-de-diagramas-svg)
7. [Geração de Documentos](#geração-de-documentos)
8. [Módulo de IA (Anthropic Claude)](#módulo-de-ia-anthropic-claude)
9. [Formulário e Estado Central](#formulário-e-estado-central)
10. [Abas da Aplicação](#abas-da-aplicação)
11. [Exportações](#exportações)
12. [Identidade Visual](#identidade-visual)
13. [Regulamentação Aplicada](#regulamentação-aplicada)
14. [Deploy e Desenvolvimento Local](#deploy-e-desenvolvimento-local)

---

## Objetivo

A **Instalight Energia Solar** precisa gerar, para cada projeto de instalação fotovoltaica, um conjunto de documentos técnicos e legais exigidos pela distribuidora para protocolo de acesso à rede. Esse processo era manual, demorado e sujeito a inconsistências.

O **GD Docs** automatiza a geração de **todos os documentos do protocolo CEEE** a partir de um único formulário, produzindo em segundos o que levava horas:

| Grupo | Documento | Status no App |
|-------|-----------|---------------|
| **A1** | Procuração Específica (Art. 9° REN 1.000/21) | ✅ Gera + refina com IA |
| **A2** | Formulário de Solicitação de Acesso CEEE | ✅ Gera automaticamente |
| **A3** | Documentos pessoais (RG/CPF ou CNPJ) | ⏳ Rastreia no checklist |
| **A4** | Fatura de energia recente | ⏳ Aceita upload para extração por IA |
| **B1** | Diagrama Unifilar (padrão CEEE) | ✅ SVG paramétrico em tempo real |
| **B2** | Diagrama Multifilar (Bi/Trifilar) | ✅ SVG paramétrico em tempo real |
| **B3** | Planta de Situação / Locação | ⏳ Rastreia (foto/satélite) |
| **B4** | Memorial Técnico-Descritivo | ✅ 15 seções (80% JS + 20% IA) |
| **B5** | TRT/ART (Responsabilidade Técnica) | ⏳ Rastreia (assinatura do RT) |
| **B6** | Data Sheets dos equipamentos | ⏳ Aceita upload + extração IA |

---

## Contexto do Problema

O protocolo de micro/minigeração distribuída (lei federal [14.300/2022](https://www.planalto.gov.br/ccivil_03/_ato2022-2025/2022/lei/l14300.htm) e [REN ANEEL 1.000/2021](https://www.aneel.gov.br/documents/656877/17791661/REN1000.pdf)) exige:

- Diagrama unifilar **no padrão da distribuidora** com todos os componentes elétricos, proteções e cabos dimensionados
- Memorial técnico que cite explicitamente normas ABNT (NBR 16690, 5410, 5419) e as resoluções vigentes  
- Procuração com poderes específicos citando o artigo correto da REN
- Formulário padrão da CEEE com dados cruzados do projeto

Cada projeto tem parâmetros únicos (potência, strings, cabos, proteções, tipo de telhado, tipo de ligação). Erros de cálculo ou inconsistências entre documentos causam reprovação e retrabalho.

**Solução:** O app usa JS puro para todos os cálculos elétricos e IA apenas para texto narrativo — garantindo precisão técnica e fluência formal ao mesmo tempo.

---

## Decisão Arquitetural: Single-File HTML

### Por que um único arquivo `.html`?

A escolha de **zero dependências de build** foi intencional e baseada nas necessidades da Instalight:

- **Portabilidade:** o arquivo funciona offline (exceto chamadas à API), pode ser enviado por e-mail ou WhatsApp para um engenheiro usar no campo
- **Sem infraestrutura:** não há servidor, banco de dados, login ou backend — tudo roda no browser do usuário
- **Manutenção simples:** uma única pessoa pode editar o arquivo sem setup de ambiente
- **Deploy instantâneo:** qualquer push no GitHub atualiza o Vercel em ~30s
- **API Key do usuário:** cada profissional usa sua própria chave Anthropic — sem custos de backend de proxy

### Contrapartidas aceitas

- Babel compilado em runtime no browser (lento no primeiro carregamento, ~2-3s)
- Bundle não minificado — não é problema para uso interno
- Sem TypeScript / sem checagem estática de tipos

---

## Stack Técnica

| Tecnologia | Uso | CDN |
|-----------|-----|-----|
| **React 18** | UI reativa, estado, hooks | `unpkg.com/react@18/umd/react.production.min.js` |
| **ReactDOM 18** | Renderização no DOM | `unpkg.com/react-dom@18/umd/react-dom.production.min.js` |
| **Babel Standalone** | Transpila JSX no browser em runtime | `unpkg.com/@babel/standalone/babel.min.js` |
| **Tailwind CSS** | Estilização via classes utilitárias | `cdn.tailwindcss.com` |
| **jsPDF 2.5** | Geração de PDFs no browser | `cdnjs.cloudflare.com/…/jspdf/2.5.1/jspdf.umd.min.js` |
| **html2canvas 1.4** | Captura SVG como imagem para PDF A3 | `cdnjs.cloudflare.com/…/html2canvas/1.4.1/html2canvas.min.js` |
| **Anthropic API** | Modelo `claude-sonnet-4-6` | Chamado diretamente do browser com header `anthropic-dangerous-direct-browser-access: true` |

---

## Motor de Cálculos (JS puro — sem IA)

**Princípio fundamental:** *a IA nunca faz cálculos elétricos*. Todos os valores numéricos são calculados em JavaScript com fórmulas determinísticas baseadas nas normas técnicas.

### Constantes técnicas fixas

```js
const VOC_PP  = 41;      // V — Tensão de circuito aberto típica por painel (Voc)
const RHO     = 0.01724; // Ω·mm²/m — Resistividade do cobre a 20°C
const IRRAD   = 4.8;     // kWh/m²/dia — HSP média anual (Porto Alegre, RS)
const PR      = 0.75;    // Performance Ratio (perdas térmicas, cabos, inversores)
const TARIFA  = 0.85;    // R$/kWh — Tarifa média RS para estimativa de economia
```

### Cálculos executados em `calcularSistema(fd)`

| Grandeza | Fórmula | Norma |
|---------|---------|-------|
| Potência CC instalada | `kWp = (N_paineis × Wp) / 1000` | — |
| Tensão de string (Voc) | `Voc_str = N_série × VOC_PP` | NBR 16690 |
| Tensão máxima CC | `Voc_max = Voc_str × 1,25` | NBR 16690 item 7.3 |
| Corrente de curto-circuito | `Isc_str = Wp / VOC_PP` | — |
| Corrente total CC | `Icc = Isc_str × N_paralelo` | — |
| Corrente de dimensionamento CC | `Icc_N = Icc × 1,25` | NBR 16690 |
| Corrente nominal CA | `In_CA = (kW_CA × 1000) / (V × F_fase)` | NBR 5410 |
| Corrente de dimensionamento CA | `Id_CA = In_CA × 1,25` | NBR 5410 |
| Queda de tensão CC | `ΔV_CC = (2 × L × Icc_N × ρ) / S` | NBR 5410 |
| Queda de tensão CA | `ΔV_CA = (2 × L × In_CA × ρ) / S` | NBR 5410 |
| Potência disponibilizada | `Pd_kVA = (V × IDG × NF) / 1000` | NT.00020.EQTL-06 §5.3 |
| Geração anual | `G = kWp × HSP × PR × 365` | — |
| CO₂ evitado | `CO₂ = G × 0,10 kg/kWh` | Fator SIN ANEEL |
| Árvores equivalentes | `Arv = CO₂ / 25 kg/árvore/ano` | — |
| Enquadramento | `kWp ≤ 75 → Micro / kWp ≤ 5000 → Mini` | REN 1.000/2021 |

---

## Sistema de Diagramas SVG

### Arquitetura geral

Os diagramas são componentes React que retornam JSX de SVG puro — sem biblioteca de diagramas. Isso garante:
- Atualização em tempo real a cada campo editado
- SVG limpo e exportável
- Controle total sobre o visual profissional

### Viewport da prancha: `1600 × 980 px`

```
┌──────────────────────────── 1600 px ─────────────────────────────────────┐ y=0
│  HEADER (1600×65)  Logo · Título · Dados UC · Mini-carimbo RT           │
├──────────────────────┬───────────────────────────────────────────────────┤ y=65
│                      │  DIAGRAMA MULTIFILAR (1045×330)                   │
│  DIAGRAMA UNIFILAR   ├──────────────────────┬────────────────────────────┤ y=395
│  VERTICAL            │  PADRÃO DE ENTRADA   │  DETALHE ATERRAMENTO      │
│  (540 × 775)         │  (520×220)           │  (520×220)                │
│                      ├──────────────────────┼────────────────────────────┤ y=615
│                      │  SIMBOLOGIA          │  DADOS DO PROJETO         │
│                      │  (520×225)           │  (520×225)                │
├──────────────────────┴──────────────────────┴────────────────────────────┤ y=840
│  CARIMBO COMPLETO 4 colunas (1600×90)                                   │
├──────────────────────────────────────────────────────────────────────────┤ y=930
│  FOOTER NORMAS (1600×50)                                                 │
└──────────────────────────────────────────────────────────────────────────┘ y=980
```

### Componentes SVG implementados

#### `DiagramaUnifilarVertical` — fluxo top-down (padrão CEEE)

Representa o circuito completo de cima para baixo, mostrando:

```
REDE CEEE (poste + 3 fios)
      │
MEDIDOR BIDIRECIONAL (círculo verde, M⇄)  ← kWp injetado
      │
PADRÃO DE ENTRADA (DJ + cabo + → CARGAS)
      │
QUADRO DISTRIBUIÇÃO CA (DJ + DPS + GND)
      │
INVERSOR STRING (borda laranja, ⚡DC→AC, proteções 59·27·25·81)
      │
STRING BOX CC (fusíveis por string + DPS CC)
      │
╔═══════════════╗  fan-out automático por nº de strings (1–4)
║ Str1 ║ Str2 ║  ...
║MPPT1 ║MPPT2 ║
║ +/−  ║ +/−  ║
║ ████ ║ ████ ║  PanelCell × showPanels (+ ⋯ se mais)
║N×Wp  ║N×Wp  ║
╚═══════════════╝
```

Fan-out X automático por número de strings:
- 1 string: `[CX]`
- 2 strings: `[CX-90, CX+90]`
- 3 strings: `[CX-135, CX, CX+135]`
- 4 strings: `[CX-160, CX-53, CX+53, CX+160]`

#### `DiagramaMultifilarMelhorado` — seção CC + seção CA

Mostra cada condutor individualmente com cores normativas:

| Condutor | Cor |
|---------|-----|
| CC (+) | `#dc2626` vermelho |
| CC (−) | `#1a1a2e` preto |
| L1 / Fase única | `#1a1a2e` preto |
| L2 | `#92400e` marrom |
| L3 | `#6b7280` cinza |
| Neutro (N) | `#3b82f6` azul |
| PE / Aterramento | `#16a34a` verde tracejado |

Especificação de cabo em cada segmento: `#6mm² PVC 70° 750V`

Adaptação automática ao tipo de ligação:
- **Monofásico:** L1 + N + PE = 3 condutores
- **Bifásico:** L1 + L2 + N + PE = 4 condutores
- **Trifásico:** L1 + L2 + L3 + N + PE = 5 condutores

#### Símbolos IEC reutilizáveis

```jsx
GndSym    // Terra — triângulo graduado (PE/aterramento)
CBSym     // Circuit Breaker — disjuntor termomagnético
DPSSym    // DPS — Dispositivo de Proteção contra Surtos (V invertido)
PanelCell // Módulo FV — retângulo com grid de células
```

#### Seções inline na prancha

| Seção | Conteúdo |
|-------|----------|
| **Padrão de Entrada** | Poste + ramal + medidor bidirecional + DJ geral + cabo + QDC |
| **Detalhe Aterramento** | 3 hastes 5/8"×2400mm + cabo Cu nu #16mm² + caixa de inspeção + nota NBR 5419 ≤10Ω |
| **Simbologia** | Grid com todos os símbolos usados e suas descrições |
| **Dados do Projeto** | 13 linhas: módulo, inversor, configuração, potências, geração, CO₂, cabos, proteções |
| **Carimbo 4 colunas** | Empresa · UC · RT+ART · PE/Data/Rev/Fl |

---

## Geração de Documentos

### A1 — Procuração Específica

Template jurídico gerado em JS com:
- Qualificação completa do **outorgante** (cliente: nome, CPF/CNPJ, endereço)
- Qualificação do **outorgado** (empresa instaladora: nome, CNPJ)
- Poderes específicos referenciando o **Art. 9° da REN ANEEL 1.000/2021**
- Espaço para assinatura + reconhecimento de firma

Botão opcional **"Refinar com IA"** → Claude reescreve o texto em linguagem jurídica mais formal sem alterar os dados.

### A2 — Formulário de Solicitação CEEE

Reproduz o layout do formulário padrão CEEE Equatorial. Todos os campos mapeados automaticamente do formulário do app (nome, UC, potência CC, potência CA, tipo de ligação, modelos de equipamentos, RT).

### B1+B2 — Prancha Elétrica (Unifilar + Multifilar)

SVG paramétrico que atualiza em tempo real. Exportado como:
- **SVG** (arquivo vetorial para o projeto elétrico)
- **PDF A3 landscape** (via html2canvas + jsPDF)

### B4 — Memorial Técnico-Descritivo (15 seções)

Baseado no template oficial **NT.00020.EQTL-06 CEEE Equatorial v06/2025** e em 6 projetos reais aprovados.

**Princípio 80/20:**

```
JS gera (80%):          IA gera apenas (20%):
├── Lista de siglas      ├── §1 Objetivo (2 parágrafos)
├── Referências norm.    ├── §7 Estrutura de Fixação
├── Dados da UC          ├── §10 Impacto Ambiental (narrativa)
├── Padrão de entrada    └── §12 Comissionamento
├── Tabelas técnicas
├── Topologia de strings
├── Cálculo ΔV CC e CA
├── Dimensionamento DJ
├── Dimensionamento DPS
├── Aterramento
├── Tabela de cabos
├── Placas e IDs
├── NR-10 / segurança
└── Normas aplicáveis
```

Os valores numéricos vêm **sempre** de `calcularSistema()`. A IA recebe placeholders `[[[IA_NARRATIVA_SECx]]]` e preenche apenas o texto descritivo.

**System prompt restritivo:**
> "Complete APENAS os marcadores [[[IA_NARRATIVA_SECx]]]. NUNCA cite REN 482, REN 687 ou resoluções obsoletas. Cite exclusivamente Lei 14.300/2022 e REN ANEEL 1.000/2021. Todos os números já estão no documento — não recalcule nada."

### Pendências para o Cliente

PDF gerado para o cliente com:
- Lista de documentos pendentes (Grupos A e B)
- Instrução sobre como obter cada um
- Status visual (✅ / ⏳)
- Dados de contato da Instalight no rodapé

---

## Módulo de IA (Anthropic Claude)

### Modelo

`claude-sonnet-4-6` — balanceamento ideal entre capacidade técnica e custo.

### Casos de uso no app

| Função | Modo | O que a IA faz |
|--------|------|----------------|
| **Extração de dados** | Upload de PDF/imagem | Lê faturas, datasheets, fichas técnicas e retorna JSON estruturado com os campos do projeto |
| **Memorial técnico** | Template + placeholders | Preenche 4 seções narrativas (§1, §7, §10, §12) sem alterar os cálculos |
| **Procuração** | Texto base gerado em JS | Reescreve em linguagem jurídica mais formal (opcional) |

### O que a IA **nunca** faz

- Cálculos elétricos (ΔV, Icc, dimensionamento de disjuntores, etc.)
- Escolha de normas ou regulações
- Decisões de projeto (topologia de strings, seção de cabos)
- Dados do carimbo (datas, números de projetos, nomes)

### Segurança da API Key

- Armazenada em `localStorage` com chave `instalight_api_key`
- Nunca sai do browser (não há backend intermediário)
- O usuário pode limpar a qualquer momento

### Extração de dados por IA

**Fluxo técnico:**
1. `FileReader.readAsDataURL()` → strip prefix → base64
2. PDF → `{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }`
3. Imagem → `{ type: 'image', source: { type: 'base64', media_type: file.type, data } }`
4. Todos os arquivos enviados simultaneamente em uma única chamada
5. IA retorna JSON → campos preenchidos no form com borda laranja e ícone ✨
6. Toast de aviso se `confiancaExtracao === 'baixa'`

---

## Formulário e Estado Central

### Seções do sidebar (colapsáveis)

| Seção | Campos |
|-------|--------|
| **Cliente** | Tipo de pessoa, nome, CPF/CNPJ, endereço, UC, fatura, conta-contrato, consumo mensal |
| **Sistema FV** | Nº de painéis, modelo, potência (Wp), painéis em série, strings em paralelo, tipo de telhado |
| **Inversor** | Modelo, potência CA, tensão entrada CC, tensão saída CA, quantidade |
| **Cabos e Dimensionamento** | Seção CC, CA, aterramento (mm²), comprimentos (m) |
| **Proteções** | DPS CC (tipo/tensão), DPS CA (tipo/tensão), disjuntor CC e CA, aterramento |
| **Instalação** | Tipo de telhado, coordenadas GPS |
| **Empresa Instaladora** | Nome, CNPJ, endereço (para procuração e carimbo) |
| **Responsável Técnico** | Nome, CRT/CREA, Nº ART, Nº Projeto (PE), cidade, data |

### Campos especiais calculados automaticamente

- `kWp` calculado assim que `numeroPaineis × potenciaUnitariaWp` são preenchidos
- `disjuntorCC` e `disjuntorCA` sugeridos pelos cálculos (editáveis)
- `enquadramento` e `prazo` definidos pelo kWp

---

## Abas da Aplicação

### Aba 1 — Diagramas

- Prancha SVG 1600×980 atualizada em tempo real
- Botão **Exportar SVG** (XMLSerializer → Blob)
- Botão **Exportar PDF Prancha** (html2canvas → jsPDF A3 landscape)

### Aba 2 — Memorial Técnico-Descritivo

- Botão **Gerar Memorial Profissional** → chama API com template 15 seções
- Preview do documento com scroll
- Botão **Exportar Memorial PDF** (jsPDF, A4 portrait)
- Indicadores visuais: seções JS vs. seções IA

### Aba 3 — Documentos do Cliente

**Procuração Específica:**
- Template preenchido em tempo real
- Botão **Refinar com IA** (opcional)
- Botão **Exportar PDF**

**Formulário CEEE:**
- Dados mapeados automaticamente
- Aviso sobre atualização do modelo CEEE
- Botão **Exportar PDF**

### Aba 4 — Resumo e Protocolo

**8 cards de resumo:**
1. ☀️ Potência CC (kWp)
2. ⚡ Potência CA total (kW)
3. 📋 Enquadramento (Micro/Mini)
4. 📊 Geração anual estimada (kWh)
5. ⏱️ Prazo de análise CEEE
6. 💰 Economia anual estimada (R$)
7. 🌿 CO₂ evitado/ano (kg) — fator SIN 0,10 kgCO₂/kWh
8. 🌳 Árvores equivalentes/ano

**Checklist de documentos:**
- Grupos A e B com status em tempo real
- Botão **Gerar Relatório de Pendências** → PDF para entregar ao cliente

---

## Exportações

| Exportação | Método | Formato |
|-----------|--------|---------|
| Prancha SVG | XMLSerializer | `.svg` |
| Prancha PDF | html2canvas + jsPDF | A3 landscape |
| Memorial PDF | jsPDF (texto formatado) | A4 portrait |
| Procuração PDF | jsPDF (template) | A4 portrait |
| Formulário CEEE PDF | jsPDF (layout) | A4 portrait |
| Pendências PDF | jsPDF (checklist) | A4 portrait |
| **Exportar Tudo** | Downloads sequenciais | SVG + 4 PDFs |

O botão **⬇ Exportar Tudo** no header executa todos os 5 downloads em sequência com 400ms de intervalo para não bloquear o browser.

---

## Identidade Visual

| Elemento | Valor |
|---------|-------|
| Cor primária | `#f97316` (orange-500 Tailwind) |
| Header da app | `#111827` (gray-900) |
| Texto principal | `#1a1a2e` (azul-escuro customizado) |
| Sidebar | `#f8fafc` (slate-50) |
| Campos preenchidos por IA | `border-orange-400 bg-orange-50` + ✨ |
| Botão primário | `bg-orange-500 hover:bg-orange-600` |
| Tab ativa | `border-b-2 border-orange-500 text-orange-500` |
| Header SVG prancha | `#1a1a2e` com faixa `#f97316` |
| Medidor bidirecional | `#16a34a` (green) |
| Inversor | `#f97316` (orange) |

---

## Regulamentação Aplicada

O app é construído sobre o arcabouço regulatório vigente em 2024/2025:

- **Lei Federal 14.300/2022** — Marco Legal da Microgeração e Minigeração Distribuída
- **REN ANEEL 1.000/2021** — Procedimentos de Distribuição (substituiu REN 482 e REN 687)
- **ABNT NBR 16690:2019** — Sistemas fotovoltaicos — Requisitos de projeto
- **ABNT NBR 5410:2004** — Instalações elétricas de baixa tensão
- **ABNT NBR 5419:2015** — Proteção contra descargas atmosféricas
- **ABNT NBR IEC 62116** — Requisitos de antiilhamento para inversores
- **NT.00020.EQTL-06** — Nota Técnica CEEE Equatorial (template oficial memorial técnico, v06/2025)

> ⚠️ O sistema **nunca cita** REN 482, REN 687 ou outras resoluções obsoletas. O prompt da IA inclui restrição explícita a respeito.

---

## Deploy e Desenvolvimento Local

### Desenvolvimento local

O projeto usa `npx serve` para servir a pasta estática localmente:

```bash
npx serve -p 3333 .
```

Acesse `http://localhost:3333/gd-docs-instalight.html`

A configuração de launch está em `.claude/launch.json`.

### Deploy no Vercel

O `vercel.json` configura:
- Rewrite de `/` → `/gd-docs-instalight.html`
- Headers `Cache-Control: no-store` (garante sempre a versão mais recente)

**Repositório GitHub:** [Raoni022/Instalight-flow](https://github.com/Raoni022/Instalight-flow)

Cada push na branch `main` aciona deploy automático no Vercel.

### Fluxo de atualização

```bash
# Editar o arquivo
code "gd-docs-instalight.html"

# Testar localmente
npx serve -p 3333 .

# Deploy
git add gd-docs-instalight.html
git commit -m "feat: descrição da mudança"
git push
# Vercel faz o deploy em ~30 segundos
```

---

## Estrutura do Arquivo

O app inteiro vive em `gd-docs-instalight.html` (~2.200 linhas), organizado na seguinte ordem:

```
HEAD
  CDN scripts (React, Babel, Tailwind, jsPDF, html2canvas)
  CSS customizado (spinner, toast, doc-preview)

BODY > script[type="text/babel"]
  │
  ├── Constants (VOC_PP, RHO, IRRAD, PR, TARIFA, API_URL, MODEL)
  ├── INITIAL_FORM (todos os campos do projeto)
  ├── calcularSistema(fd) → motor de cálculos JS puro
  ├── buildMemorialTemplate(fd, calc) → 15 seções do memorial
  │
  ├── callAPI(key, sys, msgs, maxTokens) → helper Anthropic
  ├── fileToBase64(file) → helper upload
  ├── makePDF(), pdfHeader(), pdfFooter(), addTextBlock() → helpers jsPDF
  │
  ├── Funções standalone de exportação
  │   ├── gerarTextoProcuracao(fd, calc)
  │   ├── exportarProcuracaoPDFStandalone(fd, calc)
  │   ├── exportarFormularioPDFStandalone(fd, calc)
  │   ├── exportarPendenciasPDFStandalone(fd, calc, docsGerados)
  │   └── exportarMemorialPDFStandalone(fd, calc, memorialIA)
  │
  ├── SVG Symbols (GndSym, CBSym, DPSSym, PanelCell)
  ├── DiagramaUnifilarVertical({fd, calc}) → diagrama top-down
  ├── DiagramaMultifilarMelhorado({fd, calc}) → condutores CC+CA
  ├── PranchaCompleta (React.forwardRef) → SVG 1600×980 completo
  │
  ├── UploadModule → drag-drop + extração IA
  ├── FormField, CollapsibleSection → componentes de formulário
  ├── Sidebar → 8 seções colapsáveis
  │
  ├── DiagramasTab → aba 1
  ├── MemorialTab → aba 2
  ├── DocumentosTab → aba 3
  ├── ResumoTab → aba 4
  │
  └── App → estado central, tabs, exportarTudo, render
```

---

*Desenvolvido por Instalight Energia Solar · Porto Alegre, RS*  
*Versão 5 — Prancha Profissional CEEE · 2025*
