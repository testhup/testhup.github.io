(function () {
  var d = document;
  var burger = d.querySelector('.burger');
  var nav = d.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var themeBtn = d.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = d.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      d.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ks-theme', next); } catch (e) {}
    });
  }
  var form = d.querySelector('form.contact');
  if (form && !form.getAttribute('action')) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = d.querySelector('.form-note');
      if (n) n.classList.add('show');
    });
  }
})();
