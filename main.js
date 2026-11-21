(() => {
  const $ = (s) => document.querySelector(s);
  const gift = $('#openGift');
  const envelope = $('#openLetter');
  const paper = $('#letterPaper');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cinematic chapter slideshow: opening the gift replaces page scrolling with one full-screen chapter at a time.
  const slides = ['welcome', 'letter', 'memories', 'vault', 'finale'].map(id => document.getElementById(id));
  let activeSlide = -1;
  let touchStartX = 0;
  const slideNav = document.createElement('nav');
  slideNav.className = 'chapter-nav';
  slideNav.setAttribute('aria-label', 'Birthday story navigation');
  slideNav.innerHTML = `
    <button class="chapter-arrow chapter-prev" type="button" aria-label="Previous chapter">‹</button>
    <div class="chapter-progress" aria-label="Chapter progress"></div>
    <span class="chapter-count" aria-live="polite">01 / 05</span>
    <button class="chapter-arrow chapter-next" type="button" aria-label="Next chapter">›</button>`;
  document.body.appendChild(slideNav);
  const progress = slideNav.querySelector('.chapter-progress');
  slides.forEach((slide, i) => {
    slide.classList.add('story-slide');
    const dot = document.createElement('button');
    dot.type = 'button'; dot.className = 'chapter-dot';
    dot.setAttribute('aria-label', `Go to chapter ${i + 1}`);
    dot.addEventListener('click', () => showSlide(i, i > activeSlide ? 1 : -1));
    progress.appendChild(dot);
  });
  const dots = [...progress.children];
  const count = slideNav.querySelector('.chapter-count');
  const prev = slideNav.querySelector('.chapter-prev');
  const next = slideNav.querySelector('.chapter-next');

  function showSlide(index, direction = 1) {
    if (index < 0 || index >= slides.length || index === activeSlide) return;

    // The birthday-wish chapter is protected by the secret vault.
    // Every navigation route (arrows, dots, keyboard and swipe) passes through here.
    const finaleIndex = slides.length - 1;
    if (index === finaleIndex && !window.BIRTHDAY_VAULT_UNLOCKED) {
      const vaultIndex = slides.findIndex(slide => slide.id === 'vault');
      if (activeSlide !== vaultIndex) showSlide(vaultIndex, direction);
      const feedback = $('#vaultFeedback');
      if (feedback) feedback.textContent = 'Your wish is waiting behind the secret lock. Unlock the vault first. ✦';
      const card = $('.vault-card');
      if (card) {
        card.classList.remove('vault-locked-nudge');
        void card.offsetWidth;
        card.classList.add('vault-locked-nudge');
        setTimeout(() => card.classList.remove('vault-locked-nudge'), 650);
      }
      return;
    }
    const old = activeSlide;
    if (old >= 0) {
      slides[old].classList.remove('active', 'enter-forward', 'enter-backward');
      slides[old].classList.add(direction > 0 ? 'leave-backward' : 'leave-forward');
      setTimeout(() => slides[old]?.classList.remove('leave-backward', 'leave-forward'), 760);
    }
    activeSlide = index;
    slides[index].classList.remove('leave-backward', 'leave-forward');
    slides[index].classList.add('active', direction > 0 ? 'enter-forward' : 'enter-backward');
    slides[index].scrollTop = 0;
    dots.forEach((dot, i) => {
      dot.classList.toggle('current', i === index);
      dot.classList.toggle('completed', i < index);
      if (i === index) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
    });
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    next.innerHTML = index === slides.length - 2 ? '✦' : '›';
    // Re-trigger the entrance choreography for the newly revealed chapter.
    slides[index].querySelectorAll('.reveal').forEach((el, i) => {
      el.classList.remove('in-view');
      el.dataset.motion = ['left', 'right', 'zoom', 'up'][i % 4];
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in-view')));
    });
  }
  prev.addEventListener('click', () => showSlide(activeSlide - 1, -1));
  next.addEventListener('click', () => showSlide(activeSlide + 1, 1));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('slideshow')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); showSlide(activeSlide + 1, 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); showSlide(activeSlide - 1, -1); }
  });
  document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!document.body.classList.contains('slideshow')) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 65) showSlide(activeSlide + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });

  gift.addEventListener('click', () => {
    if (gift.classList.contains('opened')) return;
    gift.classList.add('opened');
    gift.querySelector('.gift-caption').textContent = 'Your universe is now open';
    gift.querySelector('.gift-subcaption').textContent = 'Let the memories take you home';
    window.birthdayMusic?.start().catch(() => {});
    giftBurst();
    setTimeout(() => {
      document.body.classList.add('slideshow');
      showSlide(0, 1);
    }, 1350);
  });

  // Envelope opens in 3D; the letter rises out before settling on the page.
  envelope.addEventListener('click', () => {
    envelope.classList.toggle('open');
    const opened = envelope.classList.contains('open');
    paper.classList.toggle('visible', opened);
    $('#letterHint').textContent = opened ? 'A little something, from the heart.' : 'Tap the envelope to unfold your letter';
    // The letter lives inside its own chapter; keep the slideshow position fixed.
  });

  // Reveal elements enter from alternating directions, not one repeated vertical motion.
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    observer.unobserve(entry.target);
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.motion = ['left', 'right', 'zoom', 'up'][i % 4];
    observer.observe(el);
  });

  // Constellation stars reveal a memory in place.
  const memoryCopy = {
    '2008': 'The beginning — one small chapter that quietly became a very long story.',
    '2012': 'Growing up together — more time, more laughter, and memories that stayed.',
    adventure: 'Bike rides, shared lunches, movies, holding hands — little adventures that became ours.',
    today: '24 November 2026 — today, this little universe celebrates you.'
  };
  document.querySelectorAll('.memory-star').forEach(star => star.addEventListener('click', () => {
    document.querySelectorAll('.memory-star').forEach(s => s.classList.remove('selected'));
    star.classList.add('selected');
    $('#constellationCaption').textContent = memoryCopy[star.dataset.memory];
  }));

  // Pointer parallax: the galaxy gently responds to movement, with touch-safe fallback.
  let pointerX = 0, pointerY = 0;
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => {
      pointerX = (e.clientX / innerWidth - .5) * 2;
      pointerY = (e.clientY / innerHeight - .5) * 2;
      document.documentElement.style.setProperty('--pointer-x', `${pointerX * 10}px`);
      document.documentElement.style.setProperty('--pointer-y', `${pointerY * 8}px`);
    }, { passive: true });
  }

  // Ambient stars plus occasional diagonal shooting stars.
  const canvas = $('#stars'), ctx = canvas.getContext('2d');
  let stars = [], shooting = [];
  function sizeStars() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(170, Math.floor(innerWidth / 6)) }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 1.45 + .2, phase: Math.random() * 6.28, speed: Math.random() * .018 + .004
    }));
  }
  function drawStars(t = 0) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      const alpha = .2 + (Math.sin(t * s.speed + s.phase) + 1) * .28;
      ctx.beginPath(); ctx.arc(s.x + pointerX * .7, s.y + pointerY * .5, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,229,255,${alpha})`; ctx.fill();
    }
    if (!reduceMotion && Math.random() < .012) shooting.push({ x: Math.random() * innerWidth * .8, y: Math.random() * innerHeight * .45, life: 1, vx: 7, vy: 3.8 });
    shooting = shooting.filter(s => s.life > 0);
    shooting.forEach(s => {
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 42, s.y - 23);
      ctx.strokeStyle = `rgba(255,226,174,${s.life})`; ctx.lineWidth = 1.4; ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life -= .025;
    });
    requestAnimationFrame(drawStars);
  }
  sizeStars(); addEventListener('resize', sizeStars); requestAnimationFrame(drawStars);

  // Gift burst: particles travel outward in a full radial field.
  function giftBurst() {
    const rect = gift.getBoundingClientRect();
    const layer = document.createElement('div'); layer.className = 'gift-particles';
    document.body.appendChild(layer);
    for (let i = 0; i < 46; i++) {
      const particle = document.createElement('i');
      const angle = Math.PI * 2 * i / 46 + Math.random() * .18;
      const distance = 80 + Math.random() * 210;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.animationDelay = `${Math.random() * .25}s`;
      layer.appendChild(particle);
    }
    setTimeout(() => layer.remove(), 1800);
  }

  // Fireworks: multi-colour radial bursts with trails, launched from changing positions.
  const fire = $('#fireworks'), fctx = fire.getContext('2d');
  let particles = [], fireActive = false, fireFrame = false;
  function fitFire() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fire.width = fire.clientWidth * dpr; fire.height = fire.clientHeight * dpr;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitFire(); addEventListener('resize', fitFire);
  function burst(x, y, hue) {
    const count = 82;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count;
      const speed = 1.2 + Math.random() * 4.8;
      particles.push({ x, y, px: x, py: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, hue: hue + Math.random() * 28, size: Math.random() * 2 + 1 });
    }
  }
  function animateFire() {
    fctx.clearRect(0, 0, fire.clientWidth, fire.clientHeight);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.px = p.x; p.py = p.y; p.x += p.vx; p.y += p.vy; p.vy += .035; p.vx *= .992; p.life -= .012;
      fctx.beginPath(); fctx.moveTo(p.px, p.py); fctx.lineTo(p.x, p.y);
      fctx.strokeStyle = `hsla(${p.hue},95%,75%,${p.life})`; fctx.lineWidth = p.size; fctx.stroke();
    });
    if (particles.length || fireActive) requestAnimationFrame(animateFire); else fireFrame = false;
  }
  $('#celebrate').addEventListener('click', () => {
    const w = fire.clientWidth, h = fire.clientHeight;
    const hues = [42, 285, 195, 345, 52, 265, 175];
    for (let i = 0; i < 11; i++) setTimeout(() => burst(w * (.08 + Math.random() * .84), h * (.12 + Math.random() * .55), hues[i % hues.length]), i * 260);
    fireActive = true;
    setTimeout(() => { fireActive = false; }, 3600);
    if (!fireFrame) { fireFrame = true; animateFire(); }
    window.birthdayMusic?.start().catch(() => {});
    $('#celebrate').textContent = 'Make another wish ✨';
  });
})();
