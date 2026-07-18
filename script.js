(function () {
  const audio = new Audio('audio/wedding-theme.mp3');
  audio.loop = true;
  audio.volume = 0;

  const playBtn = document.getElementById('playBtn');
  const vinyls = document.querySelectorAll('.player-vinyl');
  const onAirDots = document.querySelectorAll('.player-onair');
  const playerFull = document.getElementById('playerFull');
  const playerCompact = document.getElementById('playerCompact');
  const collapseBtn = document.getElementById('collapseBtn');
  const progressRing = document.getElementById('progressRing');

  let playing = false;
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
    // play() runs synchronously inside this click handler — audio only
    // starts after this explicit user tap (no autoplay), and keeps
    // playing through scroll since the player lives outside any
    // scrolling container.
    if (playing) {
      fadeTo(0, 500, () => audio.pause());
      playing = false;
    } else {
      audio.play().catch(() => {});
      fadeTo(volume, 500);
      playing = true;
    }
    updatePlayIcon();
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (collapseBtn) collapseBtn.addEventListener('click', () => {
    playerFull.classList.remove('expanded');
    playerCompact.classList.remove('expanded');
  });
  if (playerCompact) playerCompact.addEventListener('click', () => {
    if (window.innerWidth < 640) {
      playerFull.classList.add('expanded');
      playerCompact.classList.add('expanded');
    }
  });

  // ---- RSVP form ----
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzghs_xJZVXngIpQZZQY0mUBpX8XdnLx9rLd37CaCFwRULMnaJSmGbNEEBLAJwEqVI/exec';
  const form = document.getElementById('rsvpForm');
  const passCard = document.getElementById('rsvpPass');
  const errorBox = document.getElementById('rsvpError');
  const submitBtn = document.getElementById('rsvpSubmit');
  const nameInput = document.getElementById('rsvpName');
  const guestsSelect = document.getElementById('rsvpGuests');
  const commentInput = document.getElementById('rsvpComment');
  const attendYesLabel = document.getElementById('attendYesLabel');
  const attendNoLabel = document.getElementById('attendNoLabel');

  function styleAttendLabels() {
    const checked = form.querySelector('input[name="attending"]:checked');
    const val = checked ? checked.value : null;
    attendYesLabel.style.background = val === 'yes' ? '#EAD98C' : 'transparent';
    attendYesLabel.style.color = val === 'yes' ? '#1F1F1F' : '#332e26';
    attendNoLabel.style.background = val === 'no' ? '#EAD98C' : 'transparent';
    attendNoLabel.style.color = val === 'no' ? '#1F1F1F' : '#332e26';
  }
  form.querySelectorAll('input[name="attending"]').forEach(r => r.addEventListener('change', styleAttendLabels));

  function makePassId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'WED-' + s;
  }

  function showPass(data) {
    document.getElementById('passName').textContent = data.guestName;
    document.getElementById('passStatus').textContent = data.attending === 'yes' ? 'Да, буду' : 'Не смогу';
    document.getElementById('passGuests').textContent = data.guestCount;
    document.getElementById('passId').textContent = data.passId;
    document.getElementById('passQr').src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent(data.passId);
    form.style.display = 'none';
    passCard.style.display = 'block';
  }

  async function onSubmit() {
    errorBox.style.display = 'none';
    const guestName = nameInput.value.trim();
    const attendingEl = form.querySelector('input[name="attending"]:checked');
    if (!guestName) {
      errorBox.textContent = 'Пожалуйста, укажите ваше имя';
      errorBox.style.display = 'block';
      return;
    }
    if (!attendingEl) {
      errorBox.textContent = 'Пожалуйста, выберите, придёте ли вы';
      errorBox.style.display = 'block';
      return;
    }
    const attending = attendingEl.value;
    const guestCount = guestsSelect.value;
    const comment = commentInput.value;
    const passId = makePassId();

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.textContent = 'Отправляем…';

    try {
      const body = new URLSearchParams({ name: guestName, attending, guests: guestCount, comment, passId });
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const data = { passId, guestName, attending, guestCount };
      localStorage.setItem('weddingRsvp', JSON.stringify(data));
      showPass(data);
    } catch (e) {
      errorBox.textContent = 'Не удалось отправить, попробуйте ещё раз';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.textContent = 'Получить пропуск';
    }
  }

  submitBtn.addEventListener('click', onSubmit);

  document.getElementById('rsvpSave').addEventListener('click', () => window.print());

  // restore existing registration so a page refresh doesn't create a new one
  try {
    const saved = JSON.parse(localStorage.getItem('weddingRsvp') || 'null');
    if (saved && saved.passId) showPass(saved);
  } catch (e) {}
})();
