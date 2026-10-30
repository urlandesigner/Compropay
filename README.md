# ComproPay — projetos

Tudo o que foi feito para a ComproPay num lugar só: o app, o site
institucional e a central de ajuda. Cada projeto é uma **pasta autocontida na
raiz**, como no [`works`](https://github.com/urlandesigner/works) — o
andaime (índice, 404, portão, scripts) veio de lá.

Antes este repositório era só o site institucional, que agora mora em
`ComproPay Site/` com o histórico inteiro. As telas do app e a central de
ajuda vieram do `works`, sem o histórico, que continua lá.

O repositório é **público**, e o site do Pages também. O portão de senha
existe no andaime mas nasce desligado (ver abaixo).

**Link público:** <https://urlandesigner.github.io/compropay/>

**Dois deploys, um repositório.** O GitHub Pages serve a raiz (o índice e os
três projetos). A Vercel faz o preview só do site institucional, com o
**Root Directory** do projeto dela apontando para `ComproPay Site` — sem
isso ela tenta compilar a raiz, que não tem build, e o preview quebra.

## Projetos

| Pasta | Projeto |
|---|---|
| [`ComproPay/`](ComproPay/README.md) | Protótipo navegável do app de pagamento, com as telas mobile, o handoff e o UI kit que sustenta tudo |
| [`ComproPay Site/`](ComproPay%20Site/README.md) | Landing one-page da carteira digital, com as trilhas de lojista e de usuário final e formulário de qualificação |
| [`ComproPay Wiki/`](ComproPay%20Wiki/README.md) | Central de ajuda do app, com busca por palavra, filtro por categoria e uma página para cada pergunta |

## Como está organizado

Cada projeto é uma pasta na raiz, com um `index.html` dentro — isso faz o
link no índice ser sempre `Nome%20da%20Pasta/`, sem ninguém precisar decidir
para onde apontar. Quando o projeto tem mais de uma peça, esse `index.html` é
uma capa que lista as peças; quando tem só uma, é a própria peça. Em projeto
com build, é o `index.html` do export (`<Pasta>/site/`).

Na raiz ficam estas coisas, e todas precisam estar aí:

- `index.html` — índice dos projetos. É a página que o GitHub Pages serve na
  raiz; sem ela o site abre em 404. É também o que mantém o link curto, já
  que os caminhos das pastas têm espaços e a URL os codifica como `%20`.
- `.nojekyll` — desliga o Jekyll no Pages. Sem isso arquivos e pastas
  iniciados por `_` são ignorados — e um export do Next.js usa `_next/`.
- `scripts/novo-projeto.py` — registra, marca a etapa, verifica links e varre
  por segredo.
- `etapas.json` — em que ponto do fluxo cada projeto está. Fonte única: o
  cartão do índice e a capa de cada projeto leem daqui.
- `scripts/etapa.js` — desenha o fluxo na capa de um projeto. Uma linha por capa.
- `scripts/portao.js` — o portão de senha. Ver o aviso no fim.
- `.gitignore`

### Página de erro (404)

O GitHub Pages só usa o [`404.html`](404.html) da raiz, para qualquer endereço
errado em qualquer pasta. Ele leva quem errou o endereço para a 404 do próprio
projeto, quando existe — procura `<Pasta>/site/404.html` e depois
`<Pasta>/404.html` —, e senão mostra uma 404 geral com link para o índice.
Projeto novo com 404 própria entra sozinho, sem mexer nesse arquivo.

## Adicionar um projeto

Criar a pasta na raiz (com o `index.html` dela) e registrá-la:

```bash
python3 scripts/novo-projeto.py registrar \
  --pasta "Nome da Pasta" \
  --desc "uma linha, aparece no índice e aqui no README" \
  --designer Urlan
```

Registrar exige tocar em **dois** lugares — o array `PROJETOS` do
`index.html` e a tabela aqui em cima. Esquecer um deixa o projeto invisível
num dos dois e nada acusa; o comando faz os dois de uma vez. Ele também
recusa `--designer` que não case com um `<option>` do filtro, porque um valor
fora da lista some do filtro em silêncio.

Dá para editar os dois arquivos à mão, como sempre deu: **continua não
havendo passo de build**. O script edita no lugar e o `index.html` segue
legível — ele é só um datilógrafo que não esquece a segunda metade.

### Texto de apresentação não envelhece

Os textos que **apresentam** um projeto dizem o que ele é, para quem e o que
dá para fazer nele, e não como está hoje. Valem para:

- o `--desc` do registro (cartão do índice e tabela deste README);
- o `<meta name="description">` e os parágrafos de abertura da capa
  (`detalhes/`);
- a descrição de cada cartão dentro da capa.

Nesses textos não entra nada que muda quando o projeto anda: **quantidade**
(26 perguntas, 30 telas, 10 categorias), **lista de itens** (as categorias,
as telas, os componentes) ou **histórico do trabalho** (o que foi corrigido,
de onde veio, o que entrou nesta rodada). Se o número interessa, quem mostra
é o próprio projeto — a lista de perguntas, o kit — porque lá ele se
atualiza sozinho.

O teste: se amanhã entrar uma pergunta ou uma tela nova, o texto continua
certo? Se não continua, ele está descrevendo o estado, não o projeto.

Ruim: "São 26 perguntas e respostas sobre o app, em 10 categorias: adicionar
dinheiro, retirar dinheiro…"

Bom: "A central de ajuda do app: as dúvidas de quem usa o app, organizadas
por categoria."

Os READMEs de cada pasta são documentação técnica e podem ter número, porque
quem mexe no projeto atualiza junto.

**Projeto com mais de uma mão:** `--designer` repete (`--designer Urlan
--designer Fulano`). O campo é quem atuou, não quem registrou. Nome novo
precisa virar `<option>` no filtro do `index.html` antes, senão o script
recusa.

## Marcar a etapa

O fluxo tem seis etapas — Discover, Define, Ideate, Prototype, Test,
Deliver. Para dizer onde um projeto está:

```bash
python3 scripts/novo-projeto.py etapa --pasta "Nome da Pasta" --etapa prototipar
```

Os rótulos estão em inglês e os ids seguem em português (`entender`,
`definir`, `idear`, `prototipar`, `testar`, `entregar`) — id é interno e
trocá-lo invalidaria o que já está marcado.

A data de entrada na etapa é gravada junto, e **remarcar a mesma etapa não a
rejuvenesce**: projeto parado em Prototype desde agosto continua dizendo
agosto. É o ponto do campo — etapa não erra no dia em que se escreve, erra
sozinha com o tempo, e sem a data um projeto travado lê igual a um que andou
ontem. Para corrigir uma data, `--desde dd/mm/aaaa`.

**Projeto sem etapa não mostra etapa em lugar nenhum** — nem régua no cartão,
nem fluxo na capa, e o filtro de etapa só aparece quando há pelo menos um
projeto marcado. Vazio é melhor do que chute.

Para o fluxo aparecer na capa de um projeto, uma linha nela, antes do
`</body>` final — e **na página que o cartão abre**, que pode ser uma
subpasta (`site/`, `handoff/`), não o `index.html` da raiz da pasta:

```html
<script src="../scripts/etapa.js" data-pasta="Nome da Pasta"></script>
```

O bloco herda a cor do texto em volta, então serve na capa clara e na escura
sem saber qual é qual.

Antes de subir:

```bash
python3 scripts/novo-projeto.py segredos "Nome da Pasta"   # o site é público
python3 scripts/novo-projeto.py verificar                  # link quebrado não avisa sozinho
```

Depois que o Pages compilar, `verificar --site` confere tudo no ar.

## Aviso de visibilidade

**Este repositório é público, e o site do Pages também.** O código-fonte de
tudo está aberto no GitHub, além das páginas publicadas.

Então a conferência antes de publicar vale dobrado. `novo-projeto.py
segredos` varre texto, e só. **Binário — `.docx`, `.pdf`, imagem — ninguém
varre.** Se o projeto for de cliente, de trabalho ou tiver dado de alguém,
confira antes; publicado aqui é publicado para a internet inteira.

### Portão de senha

`scripts/portao.js` pede uma senha única antes de mostrar qualquer página.
**Ele nasce desligado neste repositório** (`HASH = ""` no arquivo), porque
num repo público ele não esconderia nada: o HTML está aberto no GitHub do
lado. Ligar só faz sentido se o repositório virar privado algum dia.

Para ligar, gerar o hash e colar em `HASH`:

```bash
python3 -c "import hashlib;print(hashlib.sha256(b'a-senha').hexdigest())"
```

Com o portão ligado, toda página `.html` nova precisa incluir
`<script src="{profundidade}scripts/portao.js"></script>` como o primeiro
item do `<head>`. Trocar a senha é trocar o `HASH`: quem já tinha entrado
perde acesso sozinho, sem precisar de lista de quem tinha.
