/* Quando uma tela abre sozinha (fora do app.html), monta em volta dela a mesma
   moldura realista de iPhone usada no mockup. Dentro do app.html (iframe) não faz nada:
   o mockup já é desenhado lá em volta do iframe inteiro. */
(function () {
  if (window.self !== window.top) return;

  document.addEventListener('DOMContentLoaded', function () {
    var screen = document.body.firstElementChild;
    if (!screen) return;

    document.documentElement.classList.add('is-embedded', 'has-device-frame');

    var stage = document.createElement('div'); stage.className = 'stage';
    var sizer = document.createElement('div'); sizer.className = 'sizer';
    var phone = document.createElement('div'); phone.className = 'phone';
    phone.innerHTML =
      '<div class="phone__btn phone__btn--action"></div>' +
      '<div class="phone__btn phone__btn--vol-up"></div>' +
      '<div class="phone__btn phone__btn--vol-down"></div>' +
      '<div class="phone__btn phone__btn--power"></div>' +
      '<div class="phone__screen">' +
        '<div class="island"></div>' +
        '<div class="phone__glare"></div>' +
        '<div class="indicator"></div>' +
      '</div>';

    var phoneScreen = phone.querySelector('.phone__screen');
    phoneScreen.insertBefore(screen, phoneScreen.querySelector('.phone__glare'));
    sizer.appendChild(phone);
    stage.appendChild(sizer);
    document.body.appendChild(stage);

    function fit() {
      var s = Math.min(1, (stage.clientHeight - 32) / 948, (stage.clientWidth - 32) / 452);
      s = Math.max(s, 0.3);
      sizer.style.width = 452 * s + 'px'; sizer.style.height = 948 * s + 'px';
      phone.style.transform = 'scale(' + s + ')';
    }
    window.addEventListener('resize', fit); fit();
  });
})();
