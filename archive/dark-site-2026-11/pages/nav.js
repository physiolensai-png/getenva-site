(function () {
  var nav = document.querySelector('nav');
  var toggle = nav && nav.querySelector('.nav-toggle');
  if (!toggle) return;

  var desktop = window.matchMedia('(min-width: 769px)');
  var sub = nav.querySelector('.has-sub');
  var subToggle = sub && sub.querySelector('.sub-toggle');

  function setOpen(open) {
    nav.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) setSub(false);
  }

  function setSub(open) {
    if (!sub) return;
    sub.classList.toggle('open', open);
    subToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  if (sub) {
    subToggle.addEventListener('click', function () {
      setSub(!sub.classList.contains('open'));
    });
    sub.addEventListener('mouseenter', function () { if (desktop.matches) setSub(true); });
    sub.addEventListener('mouseleave', function () { if (desktop.matches) setSub(false); });
    sub.addEventListener('focusout', function (e) {
      if (!sub.contains(e.relatedTarget)) setSub(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sub && sub.classList.contains('open')) {
      setSub(false);
      subToggle.focus();
    } else if (toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });

  desktop.addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
})();
