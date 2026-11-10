/* Mobile menu for the Enva nav. The links are hidden on small screens; this opens them as a panel. */
(function(){
  var b=document.querySelector('.menu-btn'), m=document.getElementById('site-menu');
  if(!b||!m)return;
  function set(open){b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',open?'Close menu':'Menu');if(open)m.removeAttribute('hidden');else m.setAttribute('hidden','')}
  b.addEventListener('click',function(){set(b.getAttribute('aria-expanded')!=='true')});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  document.addEventListener('click',function(e){if(!m.contains(e.target)&&e.target!==b)set(false)});
  m.addEventListener('click',function(e){if(e.target.tagName==='A')set(false)});
})();
