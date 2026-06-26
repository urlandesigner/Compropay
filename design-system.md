<!-- # Design System

## Princípios
- Clareza visual acima de excesso decorativo
- Hierarquia forte entre hero, conteúdo e CTA
- Componentes consistentes e reutilizáveis

## Direção tipográfica
Definir uma fonte de destaque para títulos e uma fonte funcional para leitura contínua, respeitando o perfil de ComproPay.

## Direção de componentes
- Botão primário orientado a Entrar em contato
- Cards para serviços/ofertas
- Blocos de prova social ou autoridade
- Rodapé com informações de contato e contexto institucional

## Acessibilidade
- Contraste adequado
- Estados de foco visíveis
- Estrutura semântica para headings e navegação
- Botões e links com rótulos claros
 -->

# Design System Migration — Instruções para o Claude

## Contexto

Estou migrando meu frontend para um novo design system extraído do Figma.
Substitua todos os tokens de cor, tipografia, espaçamento e radius hardcoded ou desatualizados
pelos novos valores abaixo. Não altere lógica, estrutura de componentes, nem conteúdo — apenas tokens visuais.

---

## Tailwind Config

Substitua o conteúdo de `tailwind.config.ts` (ou `.js`) por:

\`\`\`ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        text: {
          primary:   '#0D0D12',
          secondary: '#52526B',
          disabled:  '#ABABC2',
          inverse:   '#FFFFFF',
        },
        background: {
          default: '#FFFFFF',
          subtle:  '#F5F5FA',
        },
        surface: {
          primary:   '#FFFFFF',
          secondary: '#EDEDF5',
          tertiary:  '#E4E4F0',
          overlay:   '#0D0D17',
        },
        border: {
          default: '#D1D1E0',
          subtle:  '#EBEBF5',
          strong:  '#9090A8',
          focus:   '#3D52F5',
        },
        brand: {
          primary:   '#3D52F5',
          secondary: '#EEF0FE',
          hover:     '#2E42D4',
          active:    '#1F30B0',
        },
        feedback: {
          success: '#1A9C5B',
          warning: '#D97706',
          error:   '#DC2626',
          info:    '#2563EB',
        },
      },
      fontSize: {
        'display':  ['56px', { lineHeight: '1.10', letterSpacing: '-2px',   fontWeight: '700' }],
        'h1':       ['40px', { lineHeight: '1.28', letterSpacing: '-1px',   fontWeight: '700' }],
        'h2':       ['32px', { lineHeight: '1.28', letterSpacing: '-0.5px', fontWeight: '700' }],
        'h3':       ['24px', { lineHeight: '1.28', letterSpacing: '0px',    fontWeight: '600' }],
        'h4':       ['20px', { lineHeight: '1.28', letterSpacing: '0px',    fontWeight: '600' }],
        'body-lg':  ['18px', { lineHeight: '1.60', letterSpacing: '0px',    fontWeight: '400' }],
        'body-md':  ['15px', { lineHeight: '1.60', letterSpacing: '0px',    fontWeight: '400' }],
        'body-sm':  ['13px', { lineHeight: '1.60', letterSpacing: '0px',    fontWeight: '400' }],
        'body-xs':  ['11px', { lineHeight: '1.60', letterSpacing: '0px',    fontWeight: '400' }],
        'button':   ['14px', { lineHeight: '1.30', letterSpacing: '2px',    fontWeight: '500' }],
        'label':    ['13px', { lineHeight: '1.30', letterSpacing: '2px',    fontWeight: '500' }],
        'overline': ['10px', { lineHeight: '1.30', letterSpacing: '3.5px',  fontWeight: '600' }],
        'caption':  ['11px', { lineHeight: '1.30', letterSpacing: '2px',    fontWeight: '400' }],
      },
      fontWeight: {
        regular:  '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
      },
      spacing: {
        '0':    '0px',
        '025':  '1px',
        '050':  '2px',
        '100':  '4px',
        '150':  '6px',
        '200':  '8px',
        '300':  '12px',
        '400':  '16px',
        '500':  '20px',
        '600':  '24px',
        '800':  '32px',
        '1000': '40px',
      },
      borderRadius: {
        none: '0px',
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
\`\`\`

---

## Mapeamento de classes — substitua no código

### Cores de texto
| Intenção                  | Classe Tailwind nova       |
|---------------------------|----------------------------|
| Texto principal           | `text-text-primary`        |
| Texto secundário          | `text-text-secondary`      |
| Texto desabilitado        | `text-text-disabled`       |
| Texto sobre fundo escuro  | `text-text-inverse`        |

### Cores de fundo
| Intenção            | Classe Tailwind nova       |
|---------------------|----------------------------|
| Fundo principal     | `bg-background-default`    |
| Fundo sutil         | `bg-background-subtle`     |
| Surface primária    | `bg-surface-primary`       |
| Surface secundária  | `bg-surface-secondary`     |
| Surface terciária   | `bg-surface-tertiary`      |
| Overlay/Modal       | `bg-surface-overlay`       |

### Cores de borda
| Intenção       | Classe Tailwind nova                        |
|----------------|---------------------------------------------|
| Borda padrão   | `border-border-default`                     |
| Borda sutil    | `border-border-subtle`                      |
| Borda forte    | `border-border-strong`                      |
| Borda de foco  | `border-border-focus` / `ring-border-focus` |

### Cores de marca
| Intenção             | Classe Tailwind nova                          |
|----------------------|-----------------------------------------------|
| Primária             | `bg-brand-primary` / `text-brand-primary`     |
| Hover                | `hover:bg-brand-hover`                        |
| Active/Pressed       | `active:bg-brand-active`                      |
| Fundo sutil de marca | `bg-brand-secondary`                          |

### Feedback
| Intenção | Classe Tailwind nova                                    |
|----------|---------------------------------------------------------|
| Sucesso  | `text-feedback-success` / `bg-feedback-success`         |
| Aviso    | `text-feedback-warning` / `bg-feedback-warning`         |
| Erro     | `text-feedback-error`   / `bg-feedback-error`           |
| Info     | `text-feedback-info`    / `bg-feedback-info`            |

### Tipografia
| Intenção            | Classe Tailwind nova |
|---------------------|----------------------|
| Display / Hero      | `text-display`       |
| Título H1           | `text-h1`            |
| Título H2           | `text-h2`            |
| Título H3           | `text-h3`            |
| Título H4           | `text-h4`            |
| Corpo grande        | `text-body-lg`       |
| Corpo médio         | `text-body-md`       |
| Corpo pequeno       | `text-body-sm`       |
| Corpo extra pequeno | `text-body-xs`       |
| Botão               | `text-button`        |
| Label de campo      | `text-label`         |
| Overline / Tag      | `text-overline`      |
| Caption / Legenda   | `text-caption`       |

### Espaçamento
| Token   | Valor | Exemplo de classe |
|---------|-------|-------------------|
| Space/025  | 1px  | `p-025`  |
| Space/050  | 2px  | `p-050`  |
| Space/100  | 4px  | `p-100`  |
| Space/150  | 6px  | `p-150`  |
| Space/200  | 8px  | `p-200`  |
| Space/300  | 12px | `p-300`  |
| Space/400  | 16px | `p-400`  |
| Space/500  | 20px | `p-500`  |
| Space/600  | 24px | `p-600`  |
| Space/800  | 32px | `p-800`  |
| Space/1000 | 40px | `p-1000` |

### Border Radius
| Token       | Valor  | Classe Tailwind  |
|-------------|--------|------------------|
| Radius/none | 0px    | `rounded-none`   |
| Radius/sm   | 4px    | `rounded-sm`     |
| Radius/md   | 8px    | `rounded-md`     |
| Radius/lg   | 12px   | `rounded-lg`     |
| Radius/xl   | 16px   | `rounded-xl`     |
| Radius/pill | 9999px | `rounded-pill`   |

---

## Regras para o Claude aplicar

1. Não invente novos tokens — use apenas os listados acima.
2. Substitua cores hardcoded pelos tokens semânticos correspondentes.
3. Substitua classes de fonte padrão do Tailwind (`text-sm`, `text-lg`, etc.) pelas semânticas novas quando o contexto for claro.
4. Substitua espaçamentos padrão (`p-4`, `gap-2`, etc.) pelos tokens quando houver equivalente exato.
5. Mantenha espaçamentos sem equivalente exato como estão.
6. Certifique-se de que a fonte Inter está importada. A font-family já está configurada como `font-sans`.
7. Não altere estrutura de componentes, lógica, acessibilidade (aria) nem conteúdo de texto.

---

## Exemplos de substituição

\`\`\`tsx
// ANTES
<button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2">
  Salvar
</button>

// DEPOIS
<button className="bg-brand-primary hover:bg-brand-hover text-text-inverse text-button rounded-md px-400 py-200">
  Salvar
</button>
\`\`\`

\`\`\`tsx
// ANTES
<p className="text-gray-500 text-base">Descrição do produto</p>

// DEPOIS
<p className="text-text-secondary text-body-md">Descrição do produto</p>
\`\`\`

\`\`\`tsx
// ANTES
<div className="border border-gray-200 rounded-xl bg-white p-6">

// DEPOIS
<div className="border border-border-default rounded-xl bg-surface-primary p-600">
\`\`\`
