# ComproPay — Refinamento Seção "Para Cada Perfil"
Data: 2026-06-25 | Status: Aprovado para implementação

## Objetivo
Transformar a seção de apresentação de públicos em uma apresentação de ecossistema integrado, transmitindo mais valor e sofisticação (referências: Stripe, Linear, Mercury, Brex).

## Constraints
- Layout 2×2 preservado
- Nenhuma alteração em outras seções
- Sem adicionar informação nova
- CSS scoped (.for-who, .sol-*)
- Arquivos: src/content/landing.html (lines ~135-209) + src/styles/legacy.css

## 1. Título/Subtítulo
**Antes:** "ComproPay para cada perfil"
**Depois:** "Uma plataforma. Três experiências conectadas."
**Subtítulo:** "Empresa distribui. Colaborador usa. Lojista recebe. Tudo em tempo real, no mesmo ecossistema."
**Rationale:** Linguagem Stripe — frase curta, ponto intencional, comunica integração.

## 2. Paleta — Superfície Única com Variações Tonais
Toda a seção migra de fundo claro (#FDFCFF) para dark:
- Seção bg: #08060F
- Card 1 (lojista visual):  bg #0F0B1E, glow rgba(139,92,246,.18) roxo-frio
- Card 2 (lojista texto):   bg #0D0A1A, glow rgba(139,92,246,.08)
- Card 3 (usuário texto):   bg #0A0C1A, glow rgba(251,146,60,.07) âmbar sutil
- Card 4 (usuário visual):  bg #0D0B1C, glow rgba(251,146,60,.16) âmbar warm
- Bordas cards: 1px solid rgba(255,255,255,.07)

## 3. Card 1 — Dashboard Lojista (Visual)
- Redesign do .sol-dash: fundo dark (#14102A), textos claros
- Adicionar SVG área chart sobre as barras (path suave)
- Adicionar linha de métricas abaixo das barras: Ticket médio R$127 / 248 pagamentos
- Badge redesenhado: dark-glass com borda roxa, ícone âmbar

## 4. Card 2 — Lojista Texto
- Headline: "Mais clientes, sem burocracia"
- Lead (curto): "Aceite ticket alimentação e benefícios direto no seu estabelecimento."
- 2 bullets: "Credenciamento gratuito" · "Painel de vendas em tempo real"
- CTA: "Credenciar meu estabelecimento" (roxo, 48px)

## 5. Card 3 — Usuário Texto
- Eyebrow: "Para Colaboradores" (antes: Para Usuários)
- Headline: "Seus benefícios no bolso"
- Lead (curto): "Saldo, pagamentos e extrato no app. Sem cartão físico, sem complicação."
- 2 bullets: "Ticket alimentação integrado" · "Pagamentos na rede credenciada"
- CTA: "Baixar o app" (âmbar, 48px)

## 6. Card 4 — Aprovação em Tempo Real (Visual)
Narrativa: pagamento aprovado + transação em tempo real
- Remover imagem atual (men.png)
- Floating notification card (HTML/CSS glassmorphic):
  - Check verde · "Pagamento aprovado"
  - "Restaurante São Paulo"
  - R$ 47,90 em destaque · "Ticket Alimentação"
  - Timestamp: "Agora"
- Saldo badge: "Saldo disponível R$ 2.352,13"
- SVG inline do ícone de check premium
- Ambient glow âmbar ao centro

## 7. CTAs — Sistema Unificado
- height: 48px, padding: 0 26px, border-radius: 10px, font: 14px/600
- Card 2: bg roxo (#7C12C8), cor #fff
- Card 3: bg âmbar (#F99301), cor #111

## 8. Hierarquia Visual
Título (grande, centralizado) → Subtítulo (menor, cinza) → Cards visuais (atraem o olho) → Cards texto → CTAs

## 9. Direção de Arte
Princípio aplicado: "Esse componente ajuda a comunicar o ecossistema ou apenas preenche espaço?"
- Removida imagem genérica de pessoa com celular (Card 4) — substituída por transação real
- Removido 3o bullet em cada card texto
- Hover lift mantido mas mais sutil (translateY -3px vs -5px)
