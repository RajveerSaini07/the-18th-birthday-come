(() => {
  const audio = document.getElementById('birthdayTrack');
  const toggle = document.getElementById('soundToggle');
  const label = document.getElementById('soundLabel');
  if (!audio || !toggle || !label) return;
  audio.volume = 0;
  let isPlaying = false;
  let fadeTimer = null;
  const targetVolume = 0.68;

  function fadeTo(target, duration = 1400) {
    clearInterval(fadeTimer);
    const start = audio.volume;
    const steps = 28;
    let step = 0;
    fadeTimer = setInterval(() => {
      step++;
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * (step / steps)));
      if (step >= steps) clearInterval(fadeTimer);
    }, duration / steps);
  }

  async function start() {
    if (isPlaying) return;
    try {
      await audio.play();
      isPlaying = true;
      fadeTo(targetVolume);
      toggle.classList.add('active');
      toggle.setAttribute('aria-label', 'Pause music');
      label.textContent = 'A Thousand Years · playing';
    } catch (error) {
      label.textContent = 'Tap ♫ to play music';
      throw error;
    }
  }

  function stop() {
    if (!isPlaying) return;
    fadeTo(0, 650);
    isPlaying = false;
    toggle.classList.remove('active');
    toggle.setAttribute('aria-label', 'Play music');
    label.textContent = 'A Thousand Years · paused';
    setTimeout(() => { if (!isPlaying) audio.pause(); }, 700);
  }

  toggle.addEventListener('click', () => isPlaying ? stop() : start().catch(() => {}));
  window.birthdayMusic = { start, stop, get isPlaying() { return isPlaying; } };
})();
