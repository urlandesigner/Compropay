/* Portão de acesso compartilhado do repositório — uma senha única para
   todo o site, guardada como hash SHA-256 (não texto puro).

   Isto NÃO é controle de acesso de verdade: é tudo estático, sem servidor
   pra validar nada, então quem abre o DevTools de propósito ainda entra.
   O ganho real é não deixar nenhuma página correndo solta pra quem só
   clicou num link por acaso ou pra crawler de busca.

   Cada página do repositório inclui este arquivo como o PRIMEIRO item do
   <head>, sem defer/async/type=module — precisa ser bloqueante pra
   esconder a página antes dela pintar. O caminho de inclusão é relativo
   (tantos "../" quanto a profundidade do arquivo): em teste local
   (`python3 -m http.server` na raiz do repo) não existe o prefixo
   /compropay/ que existe em produção, e um caminho absoluto
   quebraria um dos dois ambientes.

   Sessão: o hash certo salvo no localStorage libera QUALQUER página do
   site (mesma origem, mesma chave) — entrar uma vez libera o resto, não
   é senha por página.

   Trocar a senha: gerar o hash novo —
     python3 -c "import hashlib;print(hashlib.sha256(b'nova-senha').hexdigest())"
   — e substituir HASH abaixo. Só precisa mudar aqui, porque todas as
   páginas usam este arquivo. Quem já tinha entrado perde acesso sozinho,
   já que o valor salvo no navegador para de bater com o hash novo. */
(function () {
  "use strict";

  // Chave própria, e não "works-portao": os dois sites dividem a mesma origem
  // (urlandesigner.github.io), então com a mesma chave entrar num liberava o
  // outro sempre que as senhas coincidissem.
  var CHAVE = "compropay-portao";
  var HASH = "";

  // HASH vazio = portao desligado. Este repositorio e PUBLICO no GitHub,
  // entao o portao aqui nao esconde nada de quem abre o repo — so evita que
  // uma pagina solta seja lida por quem caiu no link. Para ligar, gere o hash
  // (o comando esta no comentario do topo) e cole em HASH.
  if (!HASH) return;

  // Esconde a página inteira até confirmar a sessão — evita piscar
  // conteúdo antes da checagem terminar.
  var estiloEsconde = document.createElement("style");
  estiloEsconde.id = "portao-esconde";
  estiloEsconde.textContent = "html{visibility:hidden!important}";
  document.head.appendChild(estiloEsconde);

  function liberar() {
    var estilo = document.getElementById("portao-esconde");
    if (estilo) estilo.remove();
    var overlay = document.getElementById("portao-overlay");
    if (overlay) overlay.remove();
  }

  function sha256(texto) {
    var bytes = new TextEncoder().encode(texto);
    return crypto.subtle.digest("SHA-256", bytes).then(function (buffer) {
      return Array.prototype.map
        .call(new Uint8Array(buffer), function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
  }

  function mostrarPortao() {
    var overlay = document.createElement("div");
    overlay.id = "portao-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;visibility:visible;" +
      "display:flex;align-items:center;justify-content:center;" +
      "background:#0B0A0F;color:#F1EEF6;" +
      "font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;" +
      "padding:24px;box-sizing:border-box;";

    overlay.innerHTML =
      '<form id="portao-form" style="max-width:320px;width:100%;box-sizing:border-box;">' +
      '<p style="font:400 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;text-transform:uppercase;color:#948FA3;margin:0 0 16px;"><b style="font-weight:400;color:#A255FD">Urlan</b> · Dipre</p>' +
      '<h1 style="font-family:Georgia,serif;font-size:clamp(28px,4.6vw,38px);font-weight:600;letter-spacing:-.01em;margin:0 0 14px;line-height:1.1;">Acesso restrito</h1>' +
      '<p style="font-size:14px;line-height:1.6;color:#948FA3;margin:0 0 26px;">Peça a senha a quem já tem acesso.</p>' +
      '<label style="display:flex;flex-direction:column;gap:8px;">' +
      '<span style="font:400 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#948FA3;">Senha</span>' +
      '<input id="portao-senha" type="password" autocomplete="current-password" style="width:100%;font:400 16px/1.3 ui-sans-serif,system-ui,sans-serif;color:#F1EEF6;background:none;border:0;border-bottom:1px solid rgba(241,238,246,.10);padding:8px 0;outline:none;box-sizing:border-box;" />' +
      "</label>" +
      '<button type="submit" style="margin-top:18px;font:600 13.5px/1 ui-sans-serif,system-ui,sans-serif;color:#0B0A0F;background:#F1EEF6;border:0;border-radius:999px;padding:13px 28px;cursor:pointer;">Entrar</button>' +
      '<p id="portao-erro" role="alert" hidden style="font-size:12.5px;color:#A255FD;margin:14px 0 0;">Senha incorreta.</p>' +
      "</form>";

    document.body.appendChild(overlay);

    var form = document.getElementById("portao-form");
    var campo = document.getElementById("portao-senha");
    var erro = document.getElementById("portao-erro");
    var botao = form.querySelector("button");

    campo.focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      botao.disabled = true;
      erro.hidden = true;
      sha256(campo.value.trim()).then(function (hash) {
        botao.disabled = false;
        if (hash === HASH) {
          localStorage.setItem(CHAVE, hash);
          liberar();
        } else {
          erro.hidden = false;
          campo.select();
          campo.focus();
        }
      });
    });
  }

  function iniciar() {
    if (localStorage.getItem(CHAVE) === HASH) {
      liberar();
    } else {
      mostrarPortao();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
