(function () {
  var nav = document.querySelector('nav');
  var toggle = nav && nav.querySelector('.nav-toggle');
  if (!toggle) return;

  function setOpen(open) {
    nav.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });

  window.matchMedia('(min-width: 769px)').addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
})();
