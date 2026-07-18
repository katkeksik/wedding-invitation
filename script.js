(function () {
  const audio = new Audio('audio/wedding-theme.mp3');
  audio.loop = true;
  audio.volume = 0;

  const playBtn = document.getElementById('playBtn');
  const muteBtn = document.getElementById('muteBtn');
  const vinyls = document.querySelectorAll('.player-vinyl');
  const onAirDots = document.querySelectorAll('.player-onair');
  const expandBtn = document.getElementById('expandBtn');
  const collapseBtn = document.getElementById('collapseBtn');
  const playerFull = document.getElementById('playerFull');
  const playerCompact = document.getElementById('playerCompact');
  const progressRing = document.getElementById('progressRing');

  let playing = false;
  let muted = false;
  let volume = parseFloat(localStorage.getItem('festivalRadioVolume'));
  if (isNaN(volume)) volume = 0.7;

  const savedTime = parseFloat(localStorage.getItem('festivalRadioTime') || '0');
  audio.addEventListener('loadedmetadata', () => {
    if (savedTime && savedTime < audio.duration) audio.currentTime = savedTime;
  });
  audio.addEventListener('timeupdate', () => {
    localStorage.setItem('festivalRadioTime', String(audio.currentTime));
    if (progressRing && audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressRing.style.background = `conic-gradient(#E3C86B ${pct}%, rgba(60,52,38,0.2) 0)`;
    }
  });

  let fadeInterval = null;
  function fadeTo(target, duration, onDone) {
    if (fadeInterval) clearInterval(fadeInterval);
    const steps = 20;
    const stepTime = duration / steps;
    const start = audio.volume;
    const diff = target - start;
    let i = 0;
    fadeInterval = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, start + diff * (i / steps)));
      if (i >= steps) {
        clearInterval(fadeInterval);
        fadeInterval = null;
        if (onDone) onDone();
      }
    }, stepTime);
  }

  function updatePlayIcon() {
    if (playBtn) playBtn.textContent = playing ? '❚❚' : '▶';
    vinyls.forEach(v => v.classList.toggle('playing', playing));
    onAirDots.forEach(d => d.classList.toggle('playing', playing));
  }

  function togglePlay() {
    // play() must run synchronously in the click handler — audio only
    // starts after this explicit user tap, satisfying no-autoplay rules
    // and keeps playing through scroll since the element lives outside
    // any scrolling container.
    if (playing) {
      fadeTo(0, 500, () => audio.pause());
      playing = false;
    } else {
      audio.play().catch(() => {});
      fadeTo(muted ? 0 : volume, 500);
      playing = true;
    }
    updatePlayIcon();
  }

  function toggleMute() {
    muted = !muted;
    if (!fadeInterval) audio.volume = muted ? 0 : volume;
    if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊';
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);

  if (expandBtn) expandBtn.addEventListener('click', () => {
    playerFull.classList.add('expanded');
    playerCompact.classList.add('expanded');
  });
  if (collapseBtn) collapseBtn.addEventListener('click', () => {
    playerFull.classList.remove('expanded');
    playerCompact.classList.remove('expanded');
  });

  // on mobile the compact button expands the player instead of a duplicate play control
  if (playerCompact) playerCompact.addEventListener('click', (e) => {
    if (window.innerWidth < 640) {
      playerFull.classList.add('expanded');
      playerCompact.classList.add('expanded');
    }
  });
})();
