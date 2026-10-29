/* O STEPPER DA CAPA DE CADA PROJETO.

   Um arquivo, e nao um trecho copiado em onze capas: as capas tem peles
   diferentes — cada projeto escolheu a sua — mas o fluxo e o mesmo, e fluxo
   copiado onze vezes diverge na primeira vez que alguem mexe numa so.

   Quem usa poe UMA linha na capa, no fim do <body>:

       <script src="../scripts/etapa.js" data-pasta="Login OTP Club"></script>

   O `data-pasta` e o nome da pasta na raiz, igual a chave do etapas.json.
   Sem ele o script tenta adivinhar pelo endereco, que funciona quando a capa
   e o index.html da propria pasta.

   O BLOCO NASCE E MORRE COM O DADO: projeto sem linha no etapas.json nao
   ganha stepper nenhum. Capa com um fluxo vazio desenhado seria pior do que
   capa sem fluxo — ela promete um estado que ninguem declarou.

   Ele herda a cor do texto em volta, entao serve na capa clara e na escura
   sem saber qual e qual. */
(function () {
  const tag = document.currentScript;
  const pasta = tag.dataset.pasta
    || decodeURIComponent(location.pathname.replace(/\/[^/]*$/, "").split("/").pop() || "");
  if (!pasta) return;

  const raiz = tag.src.replace(/scripts\/etapa\.js.*$/, "");

  fetch(raiz + "etapas.json")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      const reg = d.projetos[pasta];
      if (!reg) return;
      const aqui = d.fluxo.findIndex((e) => e.id === reg.etapa);
      if (aqui < 0) return;

      /* O SEGMENTO ATUAL USA O ACENTO DA CASA, e nao a cor do texto. Com
         currentColor ele saía branco na capa escura, enquanto o mesmo segmento
         no cartao do catalogo sai rosa — a mesma informacao em duas cores, e
         quem passa de uma tela para a outra nao reconhece que e a mesma coisa.

         Primeiro tenta o token da propria pagina; so quatro capas o definem.
         Nas outras, escolhe pelo fundo: o acento claro no papel claro, o
         escuro no papel escuro, que sao exatamente os dois valores dos dois
         indices. */
      const acento = (function () {
        const daPagina = getComputedStyle(document.body).getPropertyValue("--acento").trim();
        if (daPagina) return daPagina;
        const fundo = getComputedStyle(document.body).backgroundColor
          || getComputedStyle(document.documentElement).backgroundColor;
        const n = (fundo.match(/\d+(\.\d+)?/g) || []).map(Number);
        // transparente ou ilegivel: trata como papel claro, que e o caso comum
        const claro = n.length < 3 || (n.length > 3 && n[3] === 0)
          ? true
          : (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) > 128;
        return claro ? "#7120D1" : "#A255FD";
      })();

      const titulo = document.querySelector("h1, h2");
      const esc = (t) => String(t).replace(/[&<>"]/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

      const css = document.createElement("style");
      css.textContent = `
        .fluxo{
          box-sizing:border-box; inline-size:min(260px, 100%);
          float:inline-end; margin:4px 0 20px 28px; padding:14px 16px 13px;
          border:1px solid currentColor; border-radius:10px;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
          /* A borda e o fundo saem da COR DO TEXTO em volta: a capa clara e a
             escura pedem contraste oposto, e nenhuma das duas precisa saber
             disso. color-mix com transparent da um fio discreto nas duas. */
          border-color:color-mix(in srgb, currentColor 18%, transparent);
          background:color-mix(in srgb, currentColor 4%, transparent);
        }
        .fluxo__tit{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
          opacity:.55;margin:0 0 9px}
        .fluxo__regua{display:flex;gap:3px;margin-bottom:10px}
        .fluxo__regua i{flex:1;height:3px;border-radius:999px;
          background:color-mix(in srgb, currentColor 16%, transparent)}
        .fluxo__regua i[data-feita]{background:color-mix(in srgb, currentColor 45%, transparent)}
        .fluxo__regua i[data-aqui]{background:var(--fluxo-acento, currentColor)}
        .fluxo__nome{display:block;font-size:13px;line-height:1.3}
        .fluxo__sai{display:block;font-size:10.5px;line-height:1.5;opacity:.6;margin-top:5px}
        .fluxo__desde{font-size:10.5px;opacity:.6;margin:9px 0 0}
        /* Em tela estreita nao ha espaco vazio ao lado para ocupar: o bloco
           deixa de flutuar e vira uma faixa antes do texto. */
        @media (max-width:720px){
          .fluxo{float:none;inline-size:auto;margin:16px 0 22px}
        }
      `;
      document.head.appendChild(css);

      const bloco = document.createElement("aside");
      bloco.className = "fluxo";
      bloco.setAttribute("aria-label", "Etapa do trabalho");
      bloco.style.setProperty("--fluxo-acento", acento);
      bloco.innerHTML =
        `<p class="fluxo__tit">Etapa ${aqui + 1} de ${d.fluxo.length}</p>`
        + `<span class="fluxo__regua" role="img" aria-label="${aqui} de ${d.fluxo.length} concluidas">`
        + d.fluxo.map((_, i) =>
            `<i${i < aqui ? " data-feita" : ""}${i === aqui ? " data-aqui" : ""}></i>`).join("")
        + `</span>`
        + `<b class="fluxo__nome">${esc(d.fluxo[aqui].rotulo)}</b>`
        + `<span class="fluxo__sai">Sai: ${esc(d.fluxo[aqui].sai)}</span>`
        /* A data e a razao de o bloco existir: sem ela "Prototipar" parado
           desde agosto le igualzinho a "Prototipar" de ontem. */
        + `<p class="fluxo__desde">Nesta etapa desde ${esc(reg.desde)}.</p>`;

      /* ONDE O BLOCO ENTRA, e por que nao e no fim da pagina. No fim ele ficava
         escondido: o leitor rola a capa inteira para descobrir em que pe esta o
         trabalho, que e a primeira coisa que ele quer saber.

         No topo, mas sem empurrar a pagina: `float` o encaixa na faixa vazia a
         direita do texto de abertura — que e espaco que ja estava sobrando — e
         a abertura passa a contornar o bloco. Zero rolagem a mais.

         O ancoradouro e o titulo, e so quando ele e filho direto do invólucro.
         Em capa que e o proprio prototipo o <h1> mora dentro de um painel de
         194px, e flutuar ali dentro seria pior do que nao flutuar. */
      const dono = (function () {
        let alvo = document.querySelector("main");
        if (titulo) {
          let sobe = titulo;
          while (sobe.parentElement && sobe.parentElement !== document.body) sobe = sobe.parentElement;
          if (sobe !== document.body) alvo = sobe;
        }
        return alvo || document.body;
      })();

      if (titulo && titulo.parentElement === dono) titulo.after(bloco);
      else dono.prepend(bloco);
    })
    .catch(() => {});
})();
