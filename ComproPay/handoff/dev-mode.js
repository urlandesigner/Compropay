/* Dev mode: clicar numa peça da tela e ver de onde vem cada valor.
   Lê as folhas do documento do iframe (mesma origem), monta o mapa de
   tokens a partir do :root, e para cada propriedade da peça busca a
   ÚLTIMA declaração que a alcança — ignorando pseudo-classe de estado —
   e extrai o var() dali. Sem adivinhar pelo valor calculado. */
(function () {
  "use strict";

  var PROPS = [
    { key: "color", label: "Cor do texto" },
    { key: "background-color", label: "Fundo" },
    { key: "border-color", label: "Borda" },
    { key: "border-radius", label: "Raio" },
    { key: "box-shadow", label: "Sombra" },
    { key: "font-size", label: "Tamanho da fonte" },
    { key: "font-weight", label: "Peso da fonte" }
  ];

  var STATE_PSEUDO = [":hover", ":active", ":focus", ":focus-visible", ":focus-within", "::before", "::after", "::marker", "::placeholder", "::selection"];

  var mode = "navegar"; // 'navegar' | 'inspecionar'
  var tokenMap = {};
  var sheetsInfo = [];
  var selectedEl = null;
  var deepestClicked = null;

  var frame = document.getElementById("fFrame");
  var highlight = document.createElement("div");
  highlight.className = "f-highlight";
  document.querySelector(".f-mesa").appendChild(highlight);

  var ficha = document.getElementById("fFicha");
  var fichaEmpty = document.getElementById("fColunaEmpty");

  document.getElementById("fInspectToggle").addEventListener("change", function (e) {
    if (e.target.name === "modo") mode = e.target.value;
  });

  document.addEventListener("f:devmode", function () {
    if (!highlight) return;
    highlight.classList.remove("is-on");
  });

  frame.addEventListener("load", function () {
    selectedEl = null; deepestClicked = null;
    highlight.classList.remove("is-on");
    fichaEmpty.hidden = false; ficha.hidden = true;
    try { setupFrameDoc(); } catch (e) { /* cross-origin ou tela sem conteúdo ainda */ }
  });

  function setupFrameDoc() {
    var doc = frame.contentDocument;
    if (!doc || !doc.documentElement) return;
    buildTokenMap(doc);
    buildSheetsInfo(doc);
    bindFrameEvents(doc);
  }

  // ---------- tokens ----------

  function buildTokenMap(doc) {
    tokenMap = {};
    eachAccessibleSheet(doc, function (sheet) {
      eachRule(sheet.cssRules, function (rule) {
        if (rule.selectorText === ":root" && rule.style) {
          for (var i = 0; i < rule.style.length; i++) {
            var prop = rule.style[i];
            if (prop.indexOf("--") === 0) tokenMap[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
      });
    });
  }

  function resolveVarChain(value, depth) {
    depth = depth || 0;
    if (depth > 8 || !value) return value;
    var m = /var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/i.exec(value);
    if (!m) return value;
    var tokenName = m[1];
    var resolved = tokenMap[tokenName] != null ? tokenMap[tokenName] : m[2];
    if (resolved == null) return value;
    return resolveVarChain(value.replace(m[0], resolved), depth + 1);
  }

  // ---------- folhas ----------

  function eachAccessibleSheet(doc, fn) {
    for (var i = 0; i < doc.styleSheets.length; i++) {
      var sheet = doc.styleSheets[i];
      try { if (!sheet.cssRules) continue; } catch (e) { continue; } // cross-origin
      fn(sheet);
    }
  }

  function eachRule(rules, fn) {
    if (!rules) return;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 3 /* @import */) {
        // css/base.css importa tokens.css: sem isso, o :root de lá nunca é
        // visto e o mapa de tokens fica sempre vazio.
        try { if (r.styleSheet && r.styleSheet.cssRules) eachRule(r.styleSheet.cssRules, fn); } catch (e) {}
      } else if (r.type === 4 /* @media */ || (r.media && r.cssRules)) {
        eachRule(r.cssRules, fn);
      } else if (r.selectorText) {
        fn(r);
      }
    }
  }

  function labelForHref(href) {
    if (!href) return { label: "local desta tela", kind: "local" };
    if (/css\/base\.css|css\/tokens\.css/.test(href)) return { label: "sistema (ui-kit)", kind: "sistema" };
    return { label: "externo", kind: "externo" };
  }

  function buildSheetsInfo(doc) {
    sheetsInfo = [];
    eachAccessibleSheet(doc, function (sheet) {
      var origin = labelForHref(sheet.href);
      var rules = [];
      eachRule(sheet.cssRules, function (rule) { rules.push(rule); });
      if (rules.length) sheetsInfo.push({ href: sheet.href, origin: origin, rules: rules });
    });
  }

  function hasStatePseudo(selectorPart) {
    return STATE_PSEUDO.some(function (p) { return selectorPart.indexOf(p) !== -1; });
  }

  // regras (de qualquer folha) cujo seletor alcança o elemento, em repouso
  function matchingRules(el) {
    var out = [];
    sheetsInfo.forEach(function (sheetInfo) {
      sheetInfo.rules.forEach(function (rule) {
        var parts = rule.selectorText.split(",");
        var matched = parts.some(function (part) {
          part = part.trim();
          if (hasStatePseudo(part)) return false;
          try { return el.matches(part); } catch (e) { return false; }
        });
        if (matched) out.push({ rule: rule, sheetInfo: sheetInfo });
      });
    });
    return out;
  }

  // última declaração de cada propriedade, nas regras que alcançam + inline por cima
  function winningValues(el, matches) {
    var out = {};
    matches.forEach(function (m) {
      var style = m.rule.style;
      PROPS.forEach(function (p) {
        var v = style.getPropertyValue(p.key);
        if (v) out[p.key] = { raw: v.trim(), sheetInfo: m.sheetInfo, rule: m.rule };
      });
    });
    PROPS.forEach(function (p) {
      var inline = el.style.getPropertyValue(p.key);
      if (inline) out[p.key] = { raw: inline.trim(), sheetInfo: null, rule: null, inline: true };
    });
    return out;
  }

  // ---------- seleção ----------

  function bindFrameEvents(doc) {
    doc.addEventListener("pointerdown", function (e) {
      if (!e.isTrusted) return; // nunca intercepta clique sintético do painel
      if (mode !== "inspecionar") return;
      var el = e.target;
      if (!el || el === doc.documentElement || el === doc.body) return;
      deepestClicked = el;
      select(el);
      e.preventDefault();
    }, true);

    doc.addEventListener("click", function (e) {
      if (!e.isTrusted) return;
      if (mode === "inspecionar") { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  function nameFor(el) {
    if (el.dataset && el.dataset.component) return { name: el.dataset.component, via: "data-component" };
    // classe escrita à mão: qualquer classe que não seja utilitária óbvia já serve aqui,
    // porque este projeto não usa framework utilitário
    if (el.classList.length) return { name: "." + el.classList[0], via: "classe" };
    if (el.id) return { name: "#" + el.id, via: "id" };
    return { name: "<" + el.tagName.toLowerCase() + ">", via: "tag" };
  }

  function originFor(matches) {
    if (!matches.length) return { label: "sem regra própria (herdado)", kind: "herdado" };
    var kinds = {};
    matches.forEach(function (m) { kinds[m.sheetInfo.origin.kind] = true; });
    if (kinds.sistema && kinds.local) return { label: "sistema + ajuste local", kind: "sistema" };
    if (kinds.sistema) return { label: "sistema (ui-kit)", kind: "sistema" };
    if (kinds.local) return { label: "local desta tela", kind: "local" };
    return { label: "externo", kind: "herdado" };
  }

  function select(el) {
    selectedEl = el;
    fichaEmpty.hidden = true;
    ficha.hidden = false;
    renderHighlight(el);
    renderFicha(el);
  }

  // ---------- destaque posicionado sobre o iframe ----------

  function currentScale() {
    var wrap = document.getElementById("fMolduraWrap");
    var t = wrap.style.transform;
    var m = /scale\(([\d.]+)\)/.exec(t || "");
    return m ? parseFloat(m[1]) : 1;
  }

  function renderHighlight(el) {
    var rect = el.getBoundingClientRect();
    var frameRect = frame.getBoundingClientRect();
    var scale = currentScale();
    var mesa = document.querySelector(".f-mesa");
    var mesaRect = mesa.getBoundingClientRect();

    var left = (frameRect.left - mesaRect.left) + mesa.scrollLeft + rect.left * scale;
    var top = (frameRect.top - mesaRect.top) + mesa.scrollTop + rect.top * scale;

    highlight.style.left = left + "px";
    highlight.style.top = top + "px";
    highlight.style.width = (rect.width * scale) + "px";
    highlight.style.height = (rect.height * scale) + "px";
    highlight.classList.add("is-on");
  }

  // ---------- contraste ----------

  function parseRGB(str) {
    var m = /rgba?\(([^)]+)\)/.exec(str || "");
    if (!m) return null;
    // aceita tanto "r, g, b, a" (legado) quanto "r g b / a" (CSS Color 4,
    // usado em css/tokens.css) — troca a barra por vírgula e tokeniza por
    // vírgula OU espaço.
    var parts = m[1].replace("/", ",").trim().split(/[\s,]+/).map(function (x) { return parseFloat(x); });
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
  }

  function luminance(c) {
    function ch(v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }

  function contrastRatio(c1, c2) {
    var l1 = luminance(c1) + 0.05, l2 = luminance(c2) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  // compõe uma cor (possivelmente translúcida) sobre um fundo já opaco
  function compositeOver(top, bottom) {
    var a = top.a == null ? 1 : top.a;
    return {
      r: top.r * a + bottom.r * (1 - a),
      g: top.g * a + bottom.g * (1 - a),
      b: top.b * a + bottom.b * (1 - a),
      a: 1
    };
  }

  // o fundo de verdade atrás da peça: compõe, do ancestral mais distante até
  // ela mesma, cada camada translúcida sobre a anterior — nunca pega a
  // primeira cor não transparente isolada, porque duas camadas translúcidas
  // da MESMA cor (texto a 55% sobre fundo a 5%, por exemplo) têm o mesmo
  // matiz e dariam contraste 1:1 se comparadas sem compor com o que está
  // atrás de cada uma.
  function effectiveBackground(el, doc) {
    var node = el, chain = [];
    while (node && node !== doc.documentElement) {
      var cs = doc.defaultView.getComputedStyle(node);
      var rgb = parseRGB(cs.backgroundColor);
      if (rgb && rgb.a > 0) chain.push(rgb);
      node = node.parentElement;
    }
    chain.reverse(); // mais distante primeiro
    var acc = { r: 255, g: 255, b: 255, a: 1 };
    chain.forEach(function (c) { acc = compositeOver(c, acc); });
    return acc;
  }

  // ---------- render da ficha ----------

  function renderFicha(el) {
    var doc = el.ownerDocument;
    var cs = doc.defaultView.getComputedStyle(el);
    var matches = matchingRules(el);
    var winning = winningValues(el, matches);
    var info = nameFor(el);
    var origin = originFor(matches);

    ficha.innerHTML = "";

    // cabeçalho
    var head = document.createElement("div");
    head.className = "f-ficha__head";
    head.innerHTML =
      '<span class="f-ficha__nome">' + escapeHtml(info.name) + "</span>" +
      '<span class="f-ficha__origem f-ficha__origem--' + origin.kind + '">' + origin.label + "</span>";
    ficha.appendChild(head);

    // caminho
    ficha.appendChild(renderCaminho(el, doc));

    // aviso de design system
    var dsEl = el.closest("[data-ds]");
    if (dsEl) {
      var aviso = document.createElement("div");
      aviso.className = "f-ds-aviso";
      aviso.innerHTML = "Já existe no sistema: <code>" + escapeHtml(dsEl.dataset.ds) +
        '</code>. Use o componente do UI Kit em vez de reimplementar.' +
        (dsEl !== el ? " (herdado de " + escapeHtml(nameFor(dsEl).name) + ")" : "");
      ficha.appendChild(aviso);
    }

    // propriedades / estados (anotação)
    ficha.appendChild(renderAnotacao(el));

    // tokens
    ficha.appendChild(renderTokens(winning));

    // contraste
    var corWin = winning["color"];
    if (corWin) {
      var corRGB = parseRGB(resolveToRGBString(corWin.raw, cs.color));
      var bgRGB = effectiveBackground(el, doc);
      if (corRGB) {
        var fgOpaque = compositeOver(corRGB, bgRGB);
        ficha.appendChild(renderContraste(fgOpaque, bgRGB, cs));
      }
    }

    // CSS real agrupado por origem
    ficha.appendChild(renderCSS(matches, el));
  }

  function resolveToRGBString(raw, computedFallback) {
    var resolved = resolveVarChain(raw);
    if (/^#|rgb/.test(resolved.trim())) return toRGBString(resolved);
    return computedFallback; // já é a cor calculada pelo navegador
  }

  function toRGBString(v) {
    var probe = document.createElement("span");
    probe.style.color = v;
    document.body.appendChild(probe);
    var out = getComputedStyle(probe).color;
    probe.remove();
    return out;
  }

  function renderCaminho(deepest, doc) {
    var wrap = document.createElement("div");
    wrap.className = "f-ficha__caminho";
    var chain = [];
    var node = deepest;
    while (node && node !== doc.documentElement && node.tagName !== "BODY") {
      chain.unshift(node);
      node = node.parentElement;
    }
    chain.forEach(function (n, i) {
      if (i > 0) { var sep = document.createElement("span"); sep.className = "f-sep"; sep.textContent = "›"; wrap.appendChild(sep); }
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = nameFor(n).name;
      if (n === selectedEl) b.className = "is-current";
      b.addEventListener("click", function () { select(n); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function renderAnotacao(el) {
    var sec = document.createElement("div");
    sec.className = "f-sec";
    var carrier = el.closest("[data-component]");
    if (!carrier) {
      sec.innerHTML = '<h3 class="f-sec__title">Propriedades e estados</h3><p class="f-sec__vazia">sem anotação</p>';
      return sec;
    }
    var props = (carrier.dataset.props || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var states = (carrier.dataset.states || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var current = carrier.dataset.state;

    var html = '<h3 class="f-sec__title">Propriedades</h3>';
    html += props.length
      ? '<dl class="f-kv">' + props.map(function (p) { return "<dt>Recebe</dt><dd>" + escapeHtml(p) + "</dd>"; }).join("") + "</dl>"
      : '<p class="f-sec__vazia">sem props declaradas</p>';

    html += '<h3 class="f-sec__title" style="margin-top:10px">Estados declarados</h3>';
    html += states.length
      ? '<div class="f-states">' + states.map(function (s) {
          return '<span class="f-state-chip' + (s === current ? " is-current" : "") + '">' + escapeHtml(s) + "</span>";
        }).join("") + "</div>"
      : '<p class="f-sec__vazia">sem estados declarados</p>';

    sec.innerHTML = html;
    return sec;
  }

  function renderTokens(winning) {
    var sec = document.createElement("div");
    sec.className = "f-sec";
    var title = document.createElement("h3");
    title.className = "f-sec__title";
    title.textContent = "Tokens";
    sec.appendChild(title);

    var dl = document.createElement("dl");
    dl.className = "f-kv";
    var any = false;
    PROPS.forEach(function (p) {
      var w = winning[p.key];
      if (!w) return;
      any = true;
      var dt = document.createElement("dt"); dt.textContent = p.label;
      var dd = document.createElement("dd");
      var tokenMatch = /var\(\s*(--[a-z0-9-]+)/i.exec(w.raw);
      var display = tokenMatch ? tokenMatch[1] : w.raw;
      var btn = document.createElement("button");
      btn.className = "f-copy-val";
      btn.type = "button";
      btn.textContent = display + (w.inline ? " (inline)" : "");
      btn.title = p.key + ": " + w.raw;
      btn.addEventListener("click", function () {
        copyText(p.key + ": " + w.raw + ";");
        dd.classList.add("is-copied");
        setTimeout(function () { dd.classList.remove("is-copied"); }, 1200);
      });
      dd.appendChild(btn);
      dl.appendChild(dt); dl.appendChild(dd);
    });
    if (!any) {
      var p2 = document.createElement("p");
      p2.className = "f-sec__vazia";
      p2.textContent = "nenhuma regra própria declara cor, raio, sombra ou tipografia aqui";
      sec.appendChild(p2);
    } else {
      sec.appendChild(dl);
    }
    return sec;
  }

  function renderContraste(fg, bg, cs) {
    var sec = document.createElement("div");
    sec.className = "f-sec";
    var ratio = contrastRatio(fg, bg);
    var size = parseFloat(cs.fontSize);
    var weight = parseInt(cs.fontWeight, 10) || 400;
    var isLarge = size >= 24 || (size >= 19 && weight >= 700);
    var min = isLarge ? 3 : 4.5;
    var pass = ratio >= min;
    sec.innerHTML =
      '<h3 class="f-sec__title">Contraste</h3>' +
      '<div class="f-contrast">' +
      '<span class="f-contrast__swatches">' +
      '<span class="f-contrast__sw" style="background:rgb(' + [fg.r, fg.g, fg.b].map(Math.round).join(",") + ')"></span>' +
      '<span class="f-contrast__sw" style="background:rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(",") + ')"></span>' +
      "</span>" +
      '<span class="f-contrast__ratio">' + ratio.toFixed(2) + ":1</span>" +
      '<span class="f-contrast__badge f-contrast__badge--' + (pass ? "pass" : "fail") + '">' +
      (pass ? "AA" : "abaixo de AA · mín. " + min) + "</span>" +
      "</div>";
    return sec;
  }

  function renderCSS(matches, el) {
    var sec = document.createElement("div");
    sec.className = "f-sec";
    var title = document.createElement("h3");
    title.className = "f-sec__title";
    title.innerHTML = "CSS que alcança esta peça";
    sec.appendChild(title);

    if (!matches.length) {
      var p = document.createElement("p");
      p.className = "f-sec__vazia";
      p.textContent = "nenhuma regra própria; o que aparece vem herdado do pai";
      sec.appendChild(p);
      return sec;
    }

    // agrupa por folha vizinha (ordem do documento), sem juntar folhas distantes
    var groups = [];
    matches.forEach(function (m) {
      var last = groups[groups.length - 1];
      if (last && last.sheetInfo === m.sheetInfo) last.rules.push(m.rule);
      else groups.push({ sheetInfo: m.sheetInfo, rules: [m.rule] });
    });

    var shown = 0;
    groups.forEach(function (g) {
      var card = document.createElement("div");
      card.className = "f-css-card";
      var fileName = (g.sheetInfo.href || "inline").split("/").pop();
      var text = g.rules.slice(0, 12 - shown).map(function (r) { return r.cssText; }).join("\n");
      shown += g.rules.length;
      card.innerHTML =
        '<div class="f-css-card__head"><span>' + escapeHtml(fileName) + " · " + g.sheetInfo.origin.label + '</span>' +
        '<button class="f-sec__copy" type="button" title="Copiar">⧉</button></div>' +
        "<pre></pre>";
      card.querySelector("pre").textContent = text;
      card.querySelector(".f-sec__copy").addEventListener("click", function () { copyText(text); });
      sec.appendChild(card);
    });

    if (shown > 12) {
      var more = document.createElement("p");
      more.className = "f-css-more";
      more.textContent = "mais " + (shown - 12) + " regra(s) não mostrada(s)";
      sec.appendChild(more);
    }
    return sec;
  }

  function copyText(t) {
    try { navigator.clipboard.writeText(t); } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.addEventListener("resize", function () { if (selectedEl) renderHighlight(selectedEl); });
  // largura do dispositivo muda a moldura sem disparar resize da janela nem
  // recarregar o iframe (de propósito: largura é da moldura, não da tela)
  document.addEventListener("f:resized", function () { if (selectedEl) renderHighlight(selectedEl); });
})();
