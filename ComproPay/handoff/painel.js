/* Painel de estados do handoff do ComproPay.
   Dirige o protótipo pelos controles reais: trocar de cenário troca o src do
   iframe (recarrega do zero, de propósito — ver referencias/painel-de-estados.md).
   Não pinta o DOM da tela, não força classe. */
(function () {
  "use strict";

  var GROUPS = [
    { id: "login", name: "Login", items: [
      ["login.html", "Boas-vindas"]
    ]},
    { id: "home", name: "Home", items: [
      ["home-1-cartao.html", "1 cartão"],
      ["home-2-cartoes.html", "2 cartões"],
      ["home-sem-cartao.html", "Sem cartão"],
      ["home-1-cartao-oculto.html", "1 cartão · saldo oculto"],
      ["home-2-cartoes-oculto.html", "2 cartões · saldo oculto"],
      ["home-sem-cartao-oculto.html", "Sem cartão · saldo oculto"]
    ]},
    { id: "extrato", name: "Extrato", items: [
      ["extrato.html", "Lista de transações"],
      ["extrato-transacao.html", "Detalhe da transação"],
      ["extrato-transacao-menu.html", "Detalhe com menu de opções"]
    ]},
    { id: "cartoes", name: "Cartões", items: [
      ["cartoes.html", "Meus cartões"],
      ["cartao-arte.html", "Novo cartão · escolher arte"],
      ["cartao-dados.html", "Novo cartão · dados"],
      ["cartao-confirmar.html", "Novo cartão · pronto"],
      ["cartao-gerenciar.html", "Gerenciar cartão"]
    ]},
    { id: "ajuda", name: "Ajuda", items: [
      ["ajuda.html", "Central de ajuda"],
      ["ajuda-chat.html", "Chat com a Lia"]
    ]},
    { id: "pagar", name: "Pagar", items: [
      ["pagar.html", "Escolher destinatário"],
      ["pagar-qr.html", "Ler QR code"],
      ["pagar-proximos.html", "Próximos de mim"],
      ["pagar-busca.html", "Resultado da pesquisa"],
      ["pagar-valor.html", "Valor do pagamento"],
      ["pagar-valor-recorrente.html", "Pagamento recorrente"]
    ]},
    { id: "receber", name: "Receber", items: [
      ["receber-qr.html", "Meu QR code"],
      ["receber-valor.html", "Cobrar valor"]
    ]},
    { id: "favoritos", name: "Favoritos", items: [
      ["favoritar.html", "Favoritar estabelecimento"],
      ["meus-favoritos.html", "Meus favoritos"]
    ]},
    { id: "vantagens", name: "Vantagens", items: [
      ["vantagens.html", "Até 3 vantagens"],
      ["vantagens-mais.html", "Mais de 3 vantagens"],
      ["vantagens-detalhe.html", "Detalhe da vantagem"]
    ]}
  ];

  var SCREEN_BY_FILE = {};
  GROUPS.forEach(function (g) { g.items.forEach(function (it) { SCREEN_BY_FILE[it[0]] = it[1]; }); });

  // protótipo só tem layout mobile: um preset só, mas o campo de largura
  // digitada continua existindo pra testar um número exato (320, 360...)
  var PRESETS = { mobile: 390 };
  var DEFAULT_SCREEN = "home-1-cartao.html";

  var state = {
    cenario: DEFAULT_SCREEN,
    preset: "mobile",
    customWidth: null, // número ou null
    tema: null, // 'light' | 'dark' | null (segue o sistema)
    devMode: true
  };

  var reloadCounter = 0;

  // ---------- elementos ----------
  var els = {};
  ["fControles", "fColuna", "fNav", "fBusca", "fDevMode", "fWidthInput",
   "fWidthUsePreset", "fToggleControles", "fToggleColuna", "fThemeToggle",
   "fFrame", "fMolduraWrap", "fAplicando", "fWidthLabel", "fInspectToggle"
  ].forEach(function (id) { els[id] = document.getElementById(id); });

  // ---------- URL ----------
  function readURL() {
    var p = new URLSearchParams(location.search);
    if (p.get("cenario") && SCREEN_BY_FILE[p.get("cenario")]) state.cenario = p.get("cenario");
    if (p.get("largura")) {
      var w = parseInt(p.get("largura"), 10);
      if (w) {
        if (PRESETS.mobile === w) state.preset = "mobile";
        else { state.preset = "mobile"; state.customWidth = w; }
      }
    }
    if (p.get("tema") === "claro") state.tema = "light";
    if (p.get("tema") === "escuro") state.tema = "dark";
    if (p.get("dev") === "0") state.devMode = false;
  }

  function writeURL() {
    var p = new URLSearchParams();
    if (state.cenario !== DEFAULT_SCREEN) p.set("cenario", state.cenario);
    var w = state.customWidth || PRESETS[state.preset];
    if (w !== PRESETS.mobile) p.set("largura", w);
    if (state.tema) p.set("tema", state.tema === "light" ? "claro" : "escuro");
    if (!state.devMode) p.set("dev", "0");
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  // ---------- tema ----------
  function applyTheme() {
    var t = state.tema;
    if (!t) { document.documentElement.removeAttribute("data-theme"); return; }
    document.documentElement.setAttribute("data-theme", t);
  }
  (function initTheme() {
    try {
      var saved = localStorage.getItem("f-tema");
      if (saved) state.tema = saved;
    } catch (e) {}
  })();

  els.fThemeToggle.addEventListener("click", function () {
    state.tema = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme();
    try { localStorage.setItem("f-tema", state.tema); } catch (e) {}
    writeURL();
  });

  // ---------- navegação de cenário (grupos colapsáveis + busca) ----------
  function buildNav() {
    els.fNav.innerHTML = "";
    GROUPS.forEach(function (g) {
      var wrap = document.createElement("div");
      var head = document.createElement("button");
      head.type = "button";
      head.className = "f-nav-group__head";
      var hasActive = g.items.some(function (it) { return it[0] === state.cenario; });
      head.setAttribute("aria-expanded", hasActive ? "true" : "false");
      head.innerHTML = '<svg class="f-nav-group__chevron" width="10" height="10" viewBox="0 0 18 18" fill="none"><path d="M6 3l6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "<span>" + g.name + "</span>" +
        '<span class="f-nav-group__count">' + g.items.length + "</span>";
      wrap.appendChild(head);

      var ul = document.createElement("ul");
      ul.className = "f-nav-group__list";
      ul.hidden = !hasActive;
      g.items.forEach(function (it) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.className = "f-nav-item" + (it[0] === state.cenario ? " is-active" : "");
        b.textContent = it[1];
        b.dataset.file = it[0];
        b.addEventListener("click", function () { setCenario(it[0]); });
        li.appendChild(b);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);

      head.addEventListener("click", function () {
        var open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", String(!open));
        ul.hidden = open;
      });

      els.fNav.appendChild(wrap);
    });
  }

  els.fBusca.addEventListener("input", function () {
    var q = els.fBusca.value.trim().toLowerCase();
    var groups = els.fNav.querySelectorAll(":scope > div");
    groups.forEach(function (wrap) {
      var head = wrap.querySelector(".f-nav-group__head");
      var ul = wrap.querySelector(".f-nav-group__list");
      var items = ul.querySelectorAll("li");
      var anyVisible = false;
      items.forEach(function (li) {
        var match = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.hidden = !match;
        if (match) anyVisible = true;
      });
      wrap.hidden = !anyVisible;
      if (q && anyVisible) { ul.hidden = false; head.setAttribute("aria-expanded", "true"); }
    });
  });

  function setCenario(file) {
    if (!SCREEN_BY_FILE[file]) return;
    state.cenario = file;
    buildNav();
    loadFrame();
    writeURL();
  }

  // ---------- largura ----------
  function currentWidth() { return state.customWidth || PRESETS[state.preset]; }

  function updatePresetUI() {
    var seg = document.getElementById("fDevicePreset");
    seg.classList.toggle("is-custom", !!state.customWidth);
    var radios = seg.querySelectorAll("input");
    radios.forEach(function (r) { r.checked = r.value === state.preset; });
    els.fWidthInput.value = state.customWidth || "";
    els.fWidthLabel.textContent = currentWidth() + " px" + (state.customWidth ? " · largura digitada" : "");
  }

  document.getElementById("fDevicePreset").addEventListener("change", function (e) {
    if (e.target.name !== "device") return;
    state.preset = e.target.value;
    state.customWidth = null; // clicar num preset zera a digitada
    updatePresetUI();
    sizeFrame();
    writeURL();
  });

  els.fWidthInput.addEventListener("change", function () {
    var v = parseInt(els.fWidthInput.value, 10);
    if (!v) { state.customWidth = null; }
    else { state.customWidth = Math.max(240, Math.min(3840, v)); }
    updatePresetUI();
    sizeFrame();
    writeURL();
  });

  els.fWidthUsePreset.addEventListener("click", function () {
    state.customWidth = null;
    updatePresetUI();
    sizeFrame();
    writeURL();
  });

  // altura é sempre a do iPhone de referência que o device-frame já usa (844pt)
  var FRAME_H = 844;

  function sizeFrame() {
    var w = currentWidth();
    els.fFrame.style.width = w + "px";
    els.fFrame.style.height = FRAME_H + "px";
    els.fMolduraWrap.style.width = w + "px";
    els.fMolduraWrap.style.height = FRAME_H + "px";

    // encolhe por transform quando não cabe na mesa, nunca muda a largura real
    var mesa = els.fMolduraWrap.parentElement;
    var pad = 64;
    var availW = mesa.clientWidth - pad;
    var availH = mesa.clientHeight - pad;
    var scale = Math.min(1, availW / w, availH / FRAME_H);
    els.fMolduraWrap.style.transform = scale < 1 ? "scale(" + scale.toFixed(3) + ")" : "none";
    els.fMolduraWrap.style.overflow = "hidden";
    document.dispatchEvent(new Event("f:resized"));
  }
  window.addEventListener("resize", sizeFrame);

  // ---------- carregar a tela ----------
  function loadFrame() {
    reloadCounter++;
    els.fAplicando.hidden = false;
    els.fFrame.src = "../" + state.cenario + "?_=" + reloadCounter;
  }

  els.fFrame.addEventListener("load", function () {
    els.fAplicando.hidden = true;
    sizeFrame();
  });

  // sincroniza quando a navegação acontece por dentro da própria tela
  // (clique num link real, modo Navegar) — embed.js já avisa o parent disso
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "compropay:screen") return;
    if (!SCREEN_BY_FILE[e.data.name] || e.data.name === state.cenario) return;
    state.cenario = e.data.name;
    buildNav();
    writeURL();
  });

  // ---------- colunas (colapsar) ----------
  els.fToggleControles.addEventListener("click", function () {
    els.fControles.classList.toggle("is-collapsed");
    var collapsed = els.fControles.classList.contains("is-collapsed");
    document.documentElement.style.setProperty("--f-controles-w", collapsed ? "0px" : "320px");
    setTimeout(sizeFrame, 50);
  });

  function setColunaOpen(open) {
    els.fColuna.classList.toggle("is-collapsed", !open);
    document.documentElement.style.setProperty("--f-coluna-w", open ? "320px" : "0px");
    els.fToggleColuna.hidden = !state.devMode;
    setTimeout(sizeFrame, 50);
  }

  els.fToggleColuna.addEventListener("click", function () {
    setColunaOpen(els.fColuna.classList.contains("is-collapsed"));
  });

  // ---------- dev mode (liga a coluna; a lógica de inspeção está em dev-mode.js) ----------
  els.fDevMode.addEventListener("change", function () {
    state.devMode = els.fDevMode.checked;
    els.fInspectToggle.hidden = !state.devMode;
    els.fToggleColuna.hidden = !state.devMode;
    setColunaOpen(state.devMode);
    document.dispatchEvent(new CustomEvent("f:devmode", { detail: state.devMode }));
    writeURL();
  });

  // ---------- inicialização ----------
  readURL();
  buildNav();
  applyTheme();
  els.fDevMode.checked = state.devMode;
  els.fInspectToggle.hidden = !state.devMode;
  updatePresetUI();
  loadFrame();
  setColunaOpen(state.devMode);
  setTimeout(sizeFrame, 50);

  // expõe para o dev-mode.js
  window.FPainel = {
    state: state,
    els: els,
    sizeFrame: sizeFrame,
    frameHeight: FRAME_H
  };
})();
