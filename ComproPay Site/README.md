# Site institucional da ComproPay

Landing one-page da ComproPay — carteira digital, maquininha e ticket
alimentação. O site antigo não dava conta de duas audiências que chegam pelo
mesmo link e querem coisas opostas: o **lojista**, que precisa saber quanto
custa receber, e o **usuário final**, que quer baixar o app e usar o cartão.
A página resolve isso separando as duas trilhas logo depois da dobra, em vez
de escolher uma e perder a outra.

Posicionamento: produto premium, não "mais uma carteira". Daí o peso no
hero, a maquininha Roxinha como prova de presença local no Espírito Santo, e
o formulário que qualifica o lojista por segmento e faturamento em vez de só
pedir e-mail.

## As peças

| Peça | O que é |
|---|---|
| [`site/`](site/) | Export estático publicado — é o que o cartão do índice abre |
| [`src/content/landing.html`](src/content/landing.html) | A página inteira, em HTML; é aqui que o conteúdo vive |
| [`src/App.tsx`](src/App.tsx) | Injeta o HTML e liga os comportamentos (nav, menu mobile, scroll spy, validação do formulário) |
| [`src/styles/`](src/styles/) | Design system, tipografia e tema |
| [`design-system.md`](design-system.md) | Tokens e regras visuais |
| [`project-context.md`](project-context.md) | Briefing: negócio, público, objetivos |
| [`legacy/landing-reference.html`](legacy/landing-reference.html) | Referência do site anterior, para comparação |

## Código-fonte e export publicado

A raiz da pasta é o **código-fonte** (Vite + React 19 + Tailwind 4), para a
página poder ser regerada. A pasta `site/` é o **export estático** — o que o
GitHub Pages serve, já que o Pages não roda build.

Para regerar:

```bash
npm install
EXPORT_BASE_PATH="./" npm run build
rm -rf site && mv dist site
```

`EXPORT_BASE_PATH="./"` faz o Vite escrever caminhos relativos no
`index.html`, que é o que permite servir a página de uma subpasta do Pages
sem saber o caminho dela de antemão. Sem a variável, o build é o normal,
servido na raiz.

## Autor

Urlan Dipre
