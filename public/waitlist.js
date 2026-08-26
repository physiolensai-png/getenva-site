/* Enva — waitlist and contact form handling.
 * Copyright © 2026 Olympus Hills Ventures LLC. All rights reserved.
 *
 * One integration point. To move off the Cloud Function, change ENDPOINT and
 * nothing else: every form on the site routes through submit() below.
 *
 * The rule this file exists to enforce: never show a success message unless
 * the server actually accepted the address. The original inline handler
 * console.logged the email and then displayed "You're on the list", so every
 * signup was discarded behind a confirmation that wasn't true.
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://us-central1-enva-ai-6afde.cloudfunctions.net/joinWaitlist';
  var CONTACT_EMAIL = 'hello@getenva.ai';

  // Deliberately permissive — rejects typos and junk, not unusual-but-valid
  // addresses. Anything stricter starts refusing real people.
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function flashInvalid(input) {
    var original = input.style.borderColor;
    input.style.borderColor = '#E4652A';
    input.setAttribute('aria-invalid', 'true');
    setTimeout(function () {
      input.style.borderColor = original;
      input.removeAttribute('aria-invalid');
    }, 1600);
  }

  function show(el, html, isError) {
    if (!el) return;
    el.innerHTML = html;
    el.style.display = 'block';
    el.style.color = isError ? 'var(--ink-2)' : 'var(--accent)';
  }

  function mailtoFallback(email) {
    var href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Enva waitlist') +
      '&body=' + encodeURIComponent('Please add me to the Enva waitlist: ' + email);
    return 'We could not reach the server. Email <a href="' + href +
      '" style="color:var(--accent)">' + CONTACT_EMAIL + '</a> and we will add you by hand.';
  }

  function submit(email, source) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, source: source, company: '' })
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || data.ok !== true) throw new Error('rejected');
      return true;
    });
  }

  // Called from the markup: handleWaitlist('hero-email', 'hero-success')
  window.handleWaitlist = function (inputId, successId) {
    var input = document.getElementById(inputId);
    var success = document.getElementById(successId);
    if (!input) return;

    var email = input.value.trim();
    if (!EMAIL.test(email)) {
      flashInvalid(input);
      show(success, 'That address does not look right. Mind checking it?', true);
      return;
    }

    var button = input.parentNode.querySelector('button');
    var label = button ? button.textContent : null;
    if (button) { button.disabled = true; button.textContent = 'Joining...'; }

    var source = document.body.getAttribute('data-page') || 'unknown';

    submit(email, source).then(function () {
      input.value = '';
      input.style.display = 'none';
      if (button) button.style.display = 'none';
      show(success, 'You are on the list. We will be in touch before launch.', false);
    }).catch(function () {
      if (button) { button.disabled = false; button.textContent = label; }
      show(success, mailtoFallback(email), true);
    });
  };

  // Support page contact form.
  window.handleContactForm = function () {
    var name = document.getElementById('form-name');
    var email = document.getElementById('form-email');
    var topic = document.getElementById('form-topic');
    var message = document.getElementById('form-message');
    var success = document.getElementById('form-success');
    if (!name || !email || !message) return;

    if (!name.value.trim() || !EMAIL.test(email.value.trim()) || !message.value.trim()) {
      if (!EMAIL.test(email.value.trim())) flashInvalid(email);
      show(success, 'Please fill in your name, a valid email, and a message.', true);
      return;
    }

    // No ticketing backend yet, so this hands off to the mail client rather
    // than pretending to file something. Honest beats seamless here.
    var subject = 'Enva support' + (topic && topic.value ? ' — ' + topic.value : '');
    var body = name.value.trim() + ' <' + email.value.trim() + '>\n\n' + message.value.trim();
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    show(success, 'Opening your email app. If nothing happens, write to ' +
      '<a href="mailto:' + CONTACT_EMAIL + '" style="color:var(--accent)">' +
      CONTACT_EMAIL + '</a>.', false);
  };
})();
