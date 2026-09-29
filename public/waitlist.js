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

  var CONTACT_ENDPOINT = '/api/contact';

  // Support page contact form. POSTs to our own serverless function, which
  // emails the message to CONTACT_EMAIL and only reports success once that
  // delivery is confirmed. Falls back to mailto if the request itself fails,
  // so a down API doesn't strand the visitor with no way to reach us.
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

    var button = document.querySelector('#contact-form .btn-primary');
    var label = button ? button.textContent : null;
    if (button) { button.disabled = true; button.textContent = 'Sending...'; }

    var payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      topic: topic ? topic.value : '',
      message: message.value.trim(),
      company: ''
    };

    fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || data.ok !== true) throw new Error('rejected');
      name.value = '';
      email.value = '';
      message.value = '';
      if (topic) topic.value = '';
      if (button) { button.disabled = false; button.textContent = label; }
      show(success, 'Thanks — we will get back to you within one business day.', false);
    }).catch(function () {
      if (button) { button.disabled = false; button.textContent = label; }
      var subject = 'Enva support' + (topic && topic.value ? ' — ' + topic.value : '');
      var body = payload.name + ' <' + payload.email + '>\n\n' + payload.message;
      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      show(success, 'We could not reach the server, so we opened your email app instead. If nothing happens, write to ' +
        '<a href="mailto:' + CONTACT_EMAIL + '" style="color:var(--accent)">' +
        CONTACT_EMAIL + '</a>.', true);
    });
  };
})();
