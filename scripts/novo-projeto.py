#!/usr/bin/env python3
"""
Ferramenta de manutencao do indice de projetos.

Tres coisas que davam errado quando feitas na mao, e por que cada uma esta aqui:

  registrar  Adicionar um projeto exige tocar em DOIS arquivos — o array
             PROJETOS do index.html e a tabela do README. Esquecer um deixa o
             projeto invisivel num dos dois, e nada acusa. Aqui os dois andam
             juntos ou nenhum anda.

  verificar  Um href errado nao quebra a pagina: ela abre, o link da 404 e
             ninguem descobre ate alguem clicar numa reuniao. Este comando
             clica em todos por voce.

  segredos   O repositorio e o site do Pages sao PUBLICOS. O README
             manda conferir antes de publicar; conferir na mao a gente pula.

O script edita os arquivos NO LUGAR e nao gera nada em build — de proposito.
"Nao ha configuracao, registro nem passo de build" e um valor declarado deste
repositorio: o index.html continua legivel e editavel a mao, e quem nao quiser
usar o script segue fazendo como sempre. Aqui ele e so um datilografo.

Uso:
    python3 scripts/novo-projeto.py registrar --pasta "ComproPay/site" \
        --nome "ComproPay" --desc "..." --designer Urlan
    python3 scripts/novo-projeto.py verificar [--site]
    python3 scripts/novo-projeto.py segredos "ComproPay"
"""

import argparse
import datetime as dt
import json
import html
import pathlib
import re
import sys
import urllib.parse
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
INDEX = RAIZ / "index.html"
README = RAIZ / "README.md"
ETAPAS = RAIZ / "etapas.json"
SITE = "https://urlandesigner.github.io/compropay"
# O Pages serve o site sob este prefixo, nao na raiz do dominio.
BASE_PATH = "/compropay/"

VERDE, VERM, AMAR, CINZA, FIM = "\033[32m", "\033[31m", "\033[33m", "\033[90m", "\033[0m"


def ok(m):    print(f"{VERDE}ok{FIM}    {m}")
def erro(m):  print(f"{VERM}erro{FIM}  {m}")
def aviso(m): print(f"{AMAR}aviso{FIM} {m}")


# ----------------------------------------------------------------- registrar

def opcoes_do_filtro(campo):
    """Le os <option> do filtro. designer PRECISA casar com um deles: um
    valor fora da lista some do filtro sem erro nenhum."""
    bloco = re.search(rf'id="f-{campo}".*?</select>', INDEX.read_text("utf8"), re.S)
    if not bloco:
        return []
    return [v for v in re.findall(r'<option value="([^"]*)"', bloco.group(0)) if v]


def registrar(args):
    pasta = args.pasta.strip("/")
    dir_projeto = RAIZ / pasta

    if not dir_projeto.is_dir():
        erro(f'pasta "{pasta}" nao existe na raiz do repositorio')
        return 1

    # index.html na pasta e a convencao de porta de entrada. Com ela o href do
    # registro deixa de ser decisao: e sempre "Pasta/". Sem ela o Pages serve
    # uma listagem de diretorio, ou 404.
    if not (dir_projeto / "index.html").is_file():
        erro(f'"{pasta}/index.html" nao existe — toda pasta precisa de uma capa')
        print(f"{CINZA}      e a porta de entrada do projeto e o alvo do link no indice{FIM}")
        return 1

    # QUEM ATUOU PODE SER MAIS DE UM. Com um campo so, projeto de duas maos
    # tinha de eleger um nome, e quem ficou de fora sumia do filtro. `--designer`
    # repete: --designer Urlan --designer Fulano.
    designers = args.designer
    if len(set(designers)) != len(designers):
        erro("o mesmo designer foi passado duas vezes")
        return 1
    validos = opcoes_do_filtro("designer")
    for d in designers:
        if d not in validos:
            erro(f'designer "{d}" nao casa com nenhum <option> do filtro')
            print(f"{CINZA}      validos: {', '.join(validos)}{FIM}")
            print(f"{CINZA}      um valor fora da lista some do filtro sem avisar{FIM}")
            return 1

    nome = args.nome or pasta
    quando = args.data or dt.date.today().strftime("%d/%m/%Y")
    href = urllib.parse.quote(pasta) + "/"

    texto = INDEX.read_text("utf8")
    if f'href: "{href}"' in texto:
        aviso(f'"{pasta}" ja esta registrado no index.html — nada a fazer')
        return 0

    entrada = (
        "  {\n"
        f'    nome: "{nome}",\n'
        f'    desc: "{args.desc}",\n'
        f'    designers: [{", ".join(chr(34) + d + chr(34) for d in designers)}],\n'
        f'    atualizado: "{quando}",\n'
        f'    href: "{href}",\n'
        "  },\n"
    )

    # Insere na posicao alfabetica SEM reordenar o que ja existe: o objetivo e
    # nao produzir diff em linha que ninguem pediu para mexer.
    corpo = re.search(r"(const PROJETOS = \[\n)(.*?)(\n\];)", texto, re.S)
    if not corpo:
        erro("nao encontrei o array PROJETOS no index.html")
        return 1

    blocos = re.findall(r"  \{\n(?:.*?\n)*?  \},\n", corpo.group(2) + "\n")
    destino = len(blocos)
    for i, b in enumerate(blocos):
        atual = re.search(r'nome: "([^"]*)"', b)
        if atual and atual.group(1) > nome:
            destino = i
            break
    blocos.insert(destino, entrada)

    # Fatia pela posicao do grupo 2, nao por texto.replace(): com o array
    # vazio (primeiro registro do repositorio) o grupo 2 casa como string
    # vazia, e replace() acharia o primeiro "\n" do arquivo inteiro — nem
    # perto do array. Posicao nao tem essa ambiguidade.
    inicio, fim = corpo.span(2)
    texto = texto[:inicio] + "".join(blocos).rstrip("\n") + "\n" + texto[fim + 1 :]
    INDEX.write_text(texto, "utf8")
    ok(f"index.html — objeto em PROJETOS (posicao {destino + 1} de {len(blocos)})")

    # ---- README: mesma regra alfabetica, mesma promessa de nao reordenar
    linhas = README.read_text("utf8").split("\n")
    nova = f"| [`{pasta}/`]({href}README.md) | {args.desc} |"
    if f"[`{pasta}/`]" in "\n".join(linhas):
        aviso("README ja cita a pasta — so o index.html foi atualizado")
    else:
        alvo = None
        for i, l in enumerate(linhas):
            m = re.match(r"\| \[`([^`]+)/`\]", l)
            if m:
                alvo = i + 1
                if m.group(1) > pasta:
                    alvo = i
                    break
        if alvo is None:
            # Tabela ainda sem nenhuma linha de dado (primeiro registro do
            # repositorio) — ancora logo apos o separador do cabecalho.
            for i, l in enumerate(linhas):
                if re.match(r"\|[\s:-]+\|[\s:-]+\|", l):
                    alvo = i + 1
                    break
        if alvo is None:
            erro("nao encontrei a tabela de projetos no README")
            return 1
        linhas.insert(alvo, nova)
        README.write_text("\n".join(linhas), "utf8")
        ok(f"README.md — linha na tabela (linha {alvo + 1})")

    print(f"\n{CINZA}confira antes de commitar:  git diff{FIM}")
    return 0


# ----------------------------------------------------------------- verificar

IGNORAR = ("mailto:", "data:", "tel:", "javascript:", "//")


def links_de(arquivo):
    """href/src locais de um HTML. Ignora ancora, protocolo e placeholder."""
    texto = arquivo.read_text("utf8", errors="replace")
    achados = re.findall(r'(?:href|src)="([^"]+)"', texto)
    # o index.html guarda os alvos no array PROJETOS, nao em href= do markup
    achados += re.findall(r'href: "([^"]+)"', texto)
    for a in achados:
        # Fora ancora e query: nenhuma das duas muda QUAL arquivo e servido, e
        # deixa-las quebra tanto o `?perfil=x` de estado da landing quanto o
        # `?hash` de cache-busting que o Next.js poe no favicon.
        a = html.unescape(a).split("#")[0].split("?")[0].strip()
        # `${...}` e template literal de JS, `{{...}}` e binding de template
        # (o `<x-dc>` dos .dc.html usa essa sintaxe): nos dois casos o link so
        # existe em tempo de execucao, e conferir o texto cru acusaria um
        # quebrado que nao ha
        if not a or "://" in a or "${" in a or "{{" in a or a.startswith(IGNORAR):
            continue
        yield a


def etapa(args):
    """Escreve a etapa de um projeto no etapas.json — o unico lugar onde ela mora."""
    pasta = args.pasta.strip("/")
    if not (RAIZ / pasta).is_dir():
        erro(f'pasta "{pasta}" nao existe na raiz do repositorio')
        return 1

    dados = json.loads(ETAPAS.read_text("utf8"))
    ids = [x["id"] for x in dados["fluxo"]]
    if args.etapa not in ids:
        erro(f'etapa "{args.etapa}" nao esta no fluxo')
        print(f"{CINZA}      validos: {', '.join(ids)}{FIM}")
        return 1

    # A DATA E DE ENTRADA NA ETAPA, nao de hoje: remarcar a mesma etapa nao
    # rejuvenesce o projeto. Parado em Prototipar desde agosto tem de continuar
    # dizendo agosto, senao o campo que existe para denunciar atraso o esconde.
    atual = dados["projetos"].get(pasta)
    if atual and atual.get("etapa") == args.etapa and not args.desde:
        aviso(f'"{pasta}" ja esta em {args.etapa} desde {atual["desde"]} — nada a fazer')
        return 0

    quando = args.desde or dt.date.today().strftime("%d/%m/%Y")
    dados["projetos"][pasta] = {"etapa": args.etapa, "desde": quando}
    dados["projetos"] = dict(sorted(dados["projetos"].items()))
    ETAPAS.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n", "utf8")
    de = f' (era {atual["etapa"]} desde {atual["desde"]})' if atual else ""
    ok(f"etapas.json — {pasta}: {args.etapa} desde {quando}{de}")
    return 0


def verificar(args):
    htmls = sorted(p for p in RAIZ.rglob("*.html") if ".git" not in p.parts)
    print(f"{len(htmls)} arquivos HTML\n")

    quebrados = total = 0
    absolutos = []
    for arq in htmls:
        rel = arq.relative_to(RAIZ)
        for link in links_de(arq):
            total += 1
            alvo = urllib.parse.unquote(link)

            # Link comecado em "/" aponta para a raiz do DOMINIO, nao do repo.
            # No Pages o site mora em /compropay/, entao:
            #
            #   /compropay/algo -> certo, e assim que export de Next.js
            #                              com basePath escreve. Confiro normal.
            #   /algo                   -> sai do site. Nao e link quebrado (o
            #                              arquivo pode existir), e link que
            #                              leva para fora. Aviso, nao erro.
            if alvo.startswith(BASE_PATH):
                caminho = RAIZ / alvo[len(BASE_PATH):]
            elif alvo.startswith("/"):
                absolutos.append(f"{rel} -> {link}")
                continue
            else:
                caminho = (arq.parent / alvo).resolve()
            existe = caminho.is_dir() and (caminho / "index.html").is_file() \
                if alvo.endswith("/") else caminho.exists()
            if not existe:
                quebrados += 1
                erro(f"{rel} -> {link}")

    print()
    for a in absolutos:
        aviso(f"{a}  (sai do site: no Pages, / e a raiz do dominio)")
    if absolutos:
        print()

    if quebrados:
        erro(f"{quebrados} de {total} links quebrados em disco")
        return 1
    ok(f"{total} links resolvem em disco")

    if args.site:
        print(f"\n{CINZA}conferindo no ar — {SITE}{FIM}")
        fora = 0
        for arq in htmls:
            base = f"{SITE}/{urllib.parse.quote(str(arq.parent.relative_to(RAIZ)))}/".replace("/./", "/")
            for link in links_de(arq):
                alvo = urllib.parse.unquote(link)
                # Mesma regra do modo em disco: link que sai do site ja virou
                # aviso la em cima. Repetir como erro aqui faria o comando
                # falhar para sempre por conta de pendencia alheia.
                if alvo.startswith("/") and not alvo.startswith(BASE_PATH):
                    continue
                url = urllib.parse.urljoin(base, link)
                try:
                    req = urllib.request.Request(url, method="HEAD")
                    codigo = urllib.request.urlopen(req, timeout=15).status
                except Exception as e:
                    codigo = getattr(e, "code", 0)
                if codigo != 200:
                    fora += 1
                    erro(f"HTTP {codigo}  {url}")
        if fora:
            erro(f"{fora} links fora do ar")
            print(f"{CINZA}      se acabou de subir, o Pages pode ainda estar compilando{FIM}")
            return 1
        ok("todos respondem 200 no ar")
    return 0


# ------------------------------------------------------------------ segredos

# Procura o formato do segredo, nao a palavra: "senha" aparece em copy de
# interface o tempo todo e so gera ruido.
PADROES = [
    ("chave de API",     r"""(?i)\b(?:api[_-]?key|apikey|secret|client[_-]?secret)\b\s*[:=]\s*["'][^"']{12,}"""),
    ("token",            r"""(?i)\b(?:token|bearer)\b\s*[:=]\s*["'][^"']{16,}"""),
    ("token do GitHub",  r"\bgh[pousr]_[A-Za-z0-9]{16,}"),
    ("chave AWS",        r"\bAKIA[0-9A-Z]{16}\b"),
    ("chave privada",    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ("chave Google",     r"\bAIza[0-9A-Za-z_-]{35}\b"),
    ("credencial na URL", r"://[^/\s:@]+:[^/\s@]+@"),
]


def segredos(args):
    alvo = RAIZ / args.pasta if args.pasta else RAIZ
    if not alvo.exists():
        erro(f'"{args.pasta}" nao existe')
        return 1

    achados = 0
    for arq in sorted(alvo.rglob("*")):
        if not arq.is_file() or ".git" in arq.parts:
            continue
        try:
            texto = arq.read_text("utf8")
        except (UnicodeDecodeError, OSError):
            continue  # binario (docx, png) — nao da para varrer assim
        for rotulo, padrao in PADROES:
            for m in re.finditer(padrao, texto):
                achados += 1
                linha = texto[: m.start()].count("\n") + 1
                erro(f"{arq.relative_to(RAIZ)}:{linha}  possivel {rotulo}")

    print()
    if achados:
        erro(f"{achados} achado(s) — confira antes de publicar")
        return 1
    ok("nenhum segredo em texto")
    aviso("binarios (.docx, .png) nao sao varridos — conferir a olho")
    print(f"{CINZA}      o repositorio e o site do Pages sao PUBLICOS{FIM}")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__,
                               formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("registrar", help="registra um projeto no index.html e no README")
    r.add_argument("--pasta", required=True, help='nome da pasta na raiz, ex: "ComproPay"')
    r.add_argument("--desc", required=True, help="uma linha, aparece no indice e no README")
    r.add_argument("--designer", required=True, action="append", metavar="NOME",
                   help="quem atuou; repita para mais de um. Cada nome casa com um <option>")
    r.add_argument("--nome", help="rotulo no indice (padrao: o nome da pasta)")
    r.add_argument("--data", help="dd/mm/aaaa (padrao: hoje)")
    r.set_defaults(func=registrar)

    v = sub.add_parser("verificar", help="confere se todo link resolve")
    v.add_argument("--site", action="store_true", help="confere tambem no ar, via HTTP")
    v.set_defaults(func=verificar)

    e = sub.add_parser("etapa", help="marca em que ponto do fluxo o projeto esta")
    e.add_argument("--pasta", required=True, help='nome da pasta na raiz')
    e.add_argument("--etapa", required=True, help="id do fluxo; sem valor valido ele lista os ids")
    e.add_argument("--desde", help="dd/mm/aaaa (padrao: hoje)")
    e.set_defaults(func=etapa)

    s = sub.add_parser("segredos", help="varre por credencial antes de publicar")
    s.add_argument("pasta", nargs="?", help="limita a uma pasta (padrao: repositorio todo)")
    s.set_defaults(func=segredos)

    args = p.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
