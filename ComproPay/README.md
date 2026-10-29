# ComproPay

Protótipo navegável de um app de pagamento no celular. 30 telas em HTML
estático, com CSS próprio e tokens em `css/tokens.css`. Sem framework, sem
build, sem dependência.

Nada conversa com servidor: saldo, transações, favoritos e ofertas são fixos
no HTML, e os botões navegam entre telas em vez de executar ação. Existe para
percorrer os estados da interface e comparar as variações lado a lado.

## As peças

| Peça | O que é |
|---|---|
| [`detalhes/`](detalhes/index.html) | A capa do projeto, que é o que o índice do repositório abre |
| [`app.html`](app.html) | As telas numa moldura de celular, com a lista ao lado para trocar sem sair da página |
| [`telas.html`](telas.html) | As 30 telas em lista, para abrir uma isolada |
| [`ui-kit/`](ui-kit/index.html) | Cor, tipografia, espaçamento e os componentes que as telas reaproveitam |
| [`handoff/`](handoff/index.html) | Painel de estados e Dev mode: navega os cenários e inspeciona token, CSS e contraste de 9 componentes anotados |

## As telas

| Área | Telas | O que varia |
|---|---|---|
| Login | 1 | Boas-vindas |
| Início | 6 | Zero, um ou dois cartões, cada um com saldo visível e oculto |
| Pagar | 6 | Destinatário, QR, próximos de mim, busca, valor e valor recorrente |
| Receber | 2 | Meu QR code e cobrar um valor específico |
| Extrato | 3 | Lista, detalhe da transação, detalhe com menu aberto |
| Cartões | 5 | Meus cartões, escolher arte, dados, confirmar e gerenciar um cartão |
| Favoritos | 2 | Favoritar um estabelecimento e ver os já favoritados |
| Vantagens | 3 | Até três, mais de três, e o detalhe de uma |
| Ajuda | 2 | Central de ajuda e a conversa com a assistente |

## Como está organizado

Cada tela é um arquivo HTML inteiro, sem include e sem montagem. O cabeçalho
e a barra de navegação se repetem de propósito: trocar uma tela nunca quebra
as outras, e abrir o arquivo mostra tudo o que aquela tela é.

- `css/tokens.css` — cor, tipografia, espaçamento, raio e sombra
- `css/base.css` — os componentes
- `css/device-frame.css` — a moldura de celular que embrulha qualquer tela aberta sozinha
- `assets/icons/` — SVG soltos
- `assets/img/` — imagens das telas
- `js/embed.js` — a troca de tela dentro da moldura do `app.html`
- `js/device-frame.js` — monta a moldura em volta de uma tela aberta direto

As telas abrem direto do arquivo, sem servidor. `app.html` e `handoff/`
precisam de um, porque usam iframe.

## O UI Kit

`ui-kit/` documenta o que sustenta as 30 telas: Foundation (cor, tipografia,
espaçamento, raio, sombra — cada token marcado como "em uso" ou "novo") e
Components (os 9 componentes reais, com o markup copiado das telas). Os
tokens vieram do Figma do projeto e ficam sincronizados com `css/tokens.css` —
mudou um, muda o outro, não é um documento à parte que descola com o tempo.

## O Handoff

`handoff/` tem duas ferramentas na mesma página: o Painel de estados navega
as 30 telas por cenário, com largura mobile (um número digitado também, pra
testar uma largura exata) e tema claro/escuro; o Dev mode, ligado por padrão,
mostra ao clicar numa peça o nome, se já existe no UI Kit, de qual token veio
cada valor, o CSS real e o contraste medido. 9 componentes estão anotados no
HTML das telas (tabbar, botão, badge, switch, busca, favoritar, cartão de
pagamento, transação e atalho de serviço); o resto aparece sem anotação.

Abas de código e o Manual de implementação não entraram nesta rodada.

Urlan Dipre
