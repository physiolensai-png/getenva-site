(function () {
  // Microsoft Clarity heat maps, loaded only after the visitor accepts.
  // Leave CLARITY_ID empty to disable everything (no banner, no tracking).
  var CLARITY_ID = '';
  var KEY = 'enva-clarity-consent';
  if (!CLARITY_ID) return;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Respect Global Privacy Control: no banner, no tracking.
  if (navigator.globalPrivacyControl === true) return;

  function load() {
    if (window.clarity) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function showBanner() {
    if (document.getElementById('consent-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'consent-bar';
    bar.className = 'consent-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Analytics choice');
    bar.innerHTML =
      '<p>Can we use anonymous heat maps to see which parts of this page people read? ' +
      'It sets cookies, only if you accept. <a href="/privacy#website-analytics">Details</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-decline">Decline</button>' +
      '<button type="button" class="consent-accept">Accept</button></div>';
    document.body.appendChild(bar);
    bar.querySelector('.consent-accept').addEventListener('click', function () {
      write('granted'); bar.remove(); load();
    });
    bar.querySelector('.consent-decline').addEventListener('click', function () {
      write('denied'); bar.remove();
    });
  }

  // Lets the privacy page reopen the choice.
  window.envaResetAnalyticsChoice = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    showBanner();
  };

  var choice = read();
  if (choice === 'granted') load();
  else if (choice !== 'denied') showBanner();
})();
