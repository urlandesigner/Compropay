/* Shell do UI Kit: sidebar com grupos que expandem/recolhem, breadcrumb,
   anterior/próximo e busca. Cada página define `KIT_BASE` (caminho até a
   raiz do ui-kit/) e `<html data-kit-page="...">` com o id da página antes
   de carregar este script. */
(function () {
  var ICON_HOME = '<svg viewBox="0 0 18 18" fill="none"><path d="M3 8.5 9 3l6 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 7.5V15h9V7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_FOUNDATION = '<svg viewBox="0 0 18 18" fill="none"><path d="M9 2.5 15.5 6 9 9.5 2.5 6 9 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M2.5 9.5 9 13l6.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 12.5 9 16l6.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_COMPONENTS = '<svg viewBox="0 0 18 18" fill="none"><rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="2.5" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/></svg>';
  var ICON_CHEVRON = '<svg viewBox="0 0 18 18" fill="none" class="kit-navgroup__chev"><path d="M6 7.5 9 10.5 12 7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var NAV = [
    { id: 'foundation', group: 'Foundation', icon: ICON_FOUNDATION, items: [
      { id: 'color', label: 'Color', href: 'foundation/color.html' },
      { id: 'typography', label: 'Typography', href: 'foundation/typography.html' },
      { id: 'space', label: 'Space', href: 'foundation/space.html' },
      { id: 'shape', label: 'Shape', href: 'foundation/shape.html' },
      { id: 'elevation', label: 'Elevation', href: 'foundation/elevation.html' }
    ]},
    { id: 'components', group: 'Components', icon: ICON_COMPONENTS, items: [
      { id: 'cmp-index', label: 'Visão geral', href: 'components/index.html' },
      { id: 'button', label: 'Button', href: 'components/button.html', kind: 'Átomo' },
      { id: 'badge', label: 'Badge', href: 'components/badge.html', kind: 'Átomo' },
      { id: 'switch', label: 'Switch', href: 'components/switch.html', kind: 'Átomo' },
      { id: 'search', label: 'Search field', href: 'components/search.html', kind: 'Átomo' },
      { id: 'favorite', label: 'Favorite', href: 'components/favorite.html', kind: 'Átomo' },
      { id: 'service', label: 'Service tile', href: 'components/service.html', kind: 'Átomo' },
      { id: 'card', label: 'Card', href: 'components/card.html', kind: 'Molécula' },
      { id: 'tx', label: 'Transaction row', href: 'components/tx.html', kind: 'Molécula' },
      { id: 'tabbar', label: 'Tabbar', href: 'components/tabbar.html', kind: 'Molécula' }
    ]}
  ];

  var DESC = {
    button: 'Ações da tela: do botão cheio ao contorno pontilhado de adicionar.',
    badge: 'Selos curtos sobre cartões e itens — "Novo", categoria do cartão.',
    switch: 'Liga/desliga dentro de um banner, com rótulo acessível.',
    search: 'Campo de busca usado em Ajuda e Pagar.',
    favorite: 'Atalho circular com foto ou ícone — favoritos e "novo".',
    service: 'Tile quadrado de serviço na Home, com selo opcional.',
    card: 'Cartão ComproPay, compacto (home) ou grande (Meus cartões).',
    tx: 'Linha de transação do extrato, com link pra o detalhe.',
    tabbar: 'Barra inferior fixa com 4 itens + botão de pagar em destaque.'
  };

  var FLAT = [];
  NAV.forEach(function (g) { g.items.forEach(function (it) { FLAT.push(it); }); });

  function findItem(id) {
    for (var i = 0; i < FLAT.length; i++) if (FLAT[i].id === id) return FLAT[i];
    return null;
  }
  function groupOf(id) {
    for (var i = 0; i < NAV.length; i++) for (var j = 0; j < NAV[i].items.length; j++) if (NAV[i].items[j].id === id) return NAV[i].group;
    return '';
  }
  function groupIdOf(id) {
    for (var i = 0; i < NAV.length; i++) for (var j = 0; j < NAV[i].items.length; j++) if (NAV[i].items[j].id === id) return NAV[i].id;
    return '';
  }

  function renderSidebar(base, current) {
    var nav = document.getElementById('kit-nav');
    if (!nav) return;
    var openGroup = groupIdOf(current);
    NAV.forEach(function (g) {
      var isOpen = g.id === openGroup;
      var wrap = document.createElement('div'); wrap.className = 'kit-navgroup';

      var head = document.createElement('button');
      head.type = 'button'; head.className = 'kit-navgroup__head';
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      head.innerHTML = '<span class="kit-navgroup__icon">' + g.icon + '</span><span class="kit-navgroup__label">' + g.group + '</span>' + ICON_CHEVRON;
      wrap.appendChild(head);

      var ul = document.createElement('ul'); ul.className = 'kit-navgroup__list';
      ul.hidden = !isOpen;
      g.items.forEach(function (it) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = base + it.href; a.textContent = it.label; a.dataset.label = it.label.toLowerCase();
        if (it.id === current) a.setAttribute('aria-current', 'page');
        li.appendChild(a); ul.appendChild(li);
      });
      wrap.appendChild(ul);

      head.addEventListener('click', function () {
        var nowOpen = head.getAttribute('aria-expanded') !== 'true';
        head.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        ul.hidden = !nowOpen;
      });

      nav.appendChild(wrap);
    });
  }

  function renderCrumb(base, current) {
    var el = document.getElementById('kit-crumb');
    var item = findItem(current);
    if (!el || !item) return;
    var group = groupOf(current);
    el.innerHTML =
      '<a href="' + base + 'index.html">UI Kit</a> <span>/</span> ' +
      (group ? group + ' <span>/</span> ' : '') +
      '<strong>' + item.label + '</strong>';
  }

  function renderPrevNext(base, current) {
    var el = document.getElementById('kit-prevnext');
    var i = -1;
    for (var k = 0; k < FLAT.length; k++) if (FLAT[k].id === current) i = k;
    if (!el || i < 0) return;
    var prev = FLAT[i - 1], next = FLAT[i + 1];
    var html = '';
    if (prev) html += '<a class="kit-prevnext__link" href="' + base + prev.href + '">← ' + prev.label + '</a>';
    else html += '<span></span>';
    if (next) html += '<a class="kit-prevnext__link" href="' + base + next.href + '">' + next.label + ' →</a>';
    el.innerHTML = html;
  }

  function initSearch(base, current) {
    var input = document.getElementById('kit-search');
    if (!input) return;
    var openGroup = groupIdOf(current);
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      document.querySelectorAll('.kit-navgroup').forEach(function (wrap, gi) {
        var head = wrap.querySelector('.kit-navgroup__head');
        var list = wrap.querySelector('.kit-navgroup__list');
        var items = [].slice.call(list.querySelectorAll('li'));
        var anyMatch = false;
        items.forEach(function (li) {
          var a = li.querySelector('a');
          var hit = !q || a.dataset.label.indexOf(q) > -1;
          li.style.display = hit ? '' : 'none';
          if (hit) anyMatch = true;
        });
        wrap.style.display = anyMatch ? '' : 'none';
        if (q) { head.setAttribute('aria-expanded', 'true'); list.hidden = false; }
        else { var isDefault = NAV[gi].id === openGroup; head.setAttribute('aria-expanded', isDefault ? 'true' : 'false'); list.hidden = !isDefault; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var base = window.KIT_BASE || './';
    var current = document.documentElement.dataset.kitPage || '';
    var homeLink = document.getElementById('kit-home-link-row');
    if (homeLink) homeLink.innerHTML = '<span class="kit-navgroup__icon">' + ICON_HOME + '</span><span class="kit-navgroup__label">Home</span>';
    renderSidebar(base, current);
    renderCrumb(base, current);
    renderPrevNext(base, current);
    initSearch(base, current);
    var home = document.getElementById('kit-home-link');
    if (home) home.href = base + 'index.html';
  });

  window.KIT_NAV = NAV;
  window.KIT_DESC = DESC;
})();
