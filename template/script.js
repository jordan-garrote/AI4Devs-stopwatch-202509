
// =====================
// Utilidades de formato
// =====================
const pad = (n, size = 2) => String(n).padStart(size, '0');

function formatStopwatch(ms) {
  const hundredths = Math.floor((ms % 1000) / 10);
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
}

function formatCountdown(ms) {
  // ms es un número no negativo
  const totalSeconds = Math.ceil(ms / 1000); // redondear hacia arriba para UX
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Pequeño beep al terminar la cuenta regresiva
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {}
}

// =====================
// Elementos
// =====================
const modeSelector = document.getElementById('modeSelector');

const stopwatchPanel = document.getElementById('stopwatchPanel');
const countdownPanel = document.getElementById('countdownPanel');

const backFromStopwatch = document.getElementById('backFromStopwatch');
const backFromCountdown = document.getElementById('backFromCountdown');

// Cronómetro
const swDisplay = document.getElementById('stopwatchDisplay');
const swStartBtn = document.getElementById('swStartBtn');
const swPauseBtn = document.getElementById('swPauseBtn');
const swResumeBtn = document.getElementById('swResumeBtn');
const swResetBtn = document.getElementById('swResetBtn');

// Cuenta atrás
const cdDisplay = document.getElementById('countdownDisplay');
const cdSetup = document.getElementById('countdownSetup');
const cdControls = document.getElementById('countdownControls');

const cdHours = document.getElementById('cdHours');
const cdMinutes = document.getElementById('cdMinutes');
const cdSeconds = document.getElementById('cdSeconds');

const cdConfirmBtn = document.getElementById('cdConfirmBtn');
const cdClearSetupBtn = document.getElementById('cdClearSetupBtn');

const cdStartBtn = document.getElementById('cdStartBtn');
const cdPauseBtn = document.getElementById('cdPauseBtn');
const cdResumeBtn = document.getElementById('cdResumeBtn');
const cdResetBtn = document.getElementById('cdResetBtn');

// =====================
// Navegación
// =====================
modeSelector.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const mode = card.dataset.mode;
  if (mode === 'stopwatch') {
    modeSelector.classList.add('hidden');
    stopwatchPanel.classList.remove('hidden');
  } else if (mode === 'countdown') {
    modeSelector.classList.add('hidden');
    countdownPanel.classList.remove('hidden');
  }
});

function goHome() {
  // Reset visual y lógicos en ambos modos
  resetStopwatch(true);
  resetCountdown(true);
  stopwatchPanel.classList.add('hidden');
  countdownPanel.classList.add('hidden');
  modeSelector.classList.remove('hidden');
}

backFromStopwatch.addEventListener('click', goHome);
backFromCountdown.addEventListener('click', goHome);

// =====================
// Lógica Cronómetro
// =====================
let swInterval = null;
let swAccumulated = 0;
let swStartTime = null;
let swRunning = false;

function updateStopwatch() {
  const now = Date.now();
  const elapsed = swAccumulated + (swRunning ? now - swStartTime : 0);
  swDisplay.textContent = formatStopwatch(elapsed);
}

function startStopwatch() {
  if (swRunning) return;
  swRunning = true;
  swStartTime = Date.now();
  swInterval = setInterval(updateStopwatch, 10);

  swStartBtn.disabled = true;
  swPauseBtn.disabled = false;
  swResumeBtn.disabled = true;
  swResetBtn.disabled = false;
}

function pauseStopwatch() {
  if (!swRunning) return;
  swRunning = false;
  clearInterval(swInterval);
  swInterval = null;
  swAccumulated += Date.now() - swStartTime;

  swStartBtn.disabled = true;
  swPauseBtn.disabled = true;
  swResumeBtn.disabled = false;
  swResetBtn.disabled = false;
  updateStopwatch();
}

function resumeStopwatch() {
  if (swRunning) return;
  swRunning = true;
  swStartTime = Date.now();
  swInterval = setInterval(updateStopwatch, 10);

  swStartBtn.disabled = true;
  swPauseBtn.disabled = false;
  swResumeBtn.disabled = true;
  swResetBtn.disabled = false;
}

function resetStopwatch(silent = false) {
  swRunning = false;
  swAccumulated = 0;
  swStartTime = null;
  if (swInterval) clearInterval(swInterval);
  swInterval = null;
  swDisplay.textContent = '00:00:00.00';

  swStartBtn.disabled = false;
  swPauseBtn.disabled = true;
  swResumeBtn.disabled = true;
  swResetBtn.disabled = true;

  if (!silent) {
    // vibración ligera en dispositivos compatibles
    if (navigator.vibrate) navigator.vibrate(12);
  }
}

// Bind
swStartBtn.addEventListener('click', startStopwatch);
swPauseBtn.addEventListener('click', pauseStopwatch);
swResumeBtn.addEventListener('click', resumeStopwatch);
swResetBtn.addEventListener('click', () => resetStopwatch());

// =====================
// Lógica Cuenta atrás
// =====================
let cdInterval = null;
let cdTotalMs = 0;
let cdRemainingMs = 0;
let cdStartTime = null;
let cdRunning = false;
let cdConfirmed = false;

function sanitizeNumberInput(input, min, max) {
  let v = parseInt(input.value, 10);
  if (isNaN(v)) v = 0;
  v = Math.max(min, Math.min(max, v));
  input.value = v;
}

function readSetupToMs() {
  sanitizeNumberInput(cdHours, 0, 99);
  sanitizeNumberInput(cdMinutes, 0, 59);
  sanitizeNumberInput(cdSeconds, 0, 59);
  const h = parseInt(cdHours.value, 10) || 0;
  const m = parseInt(cdMinutes.value, 10) || 0;
  const s = parseInt(cdSeconds.value, 10) || 0;
  return ((h * 3600) + (m * 60) + s) * 1000;
}

function updateCountdownDisplay() {
  cdDisplay.textContent = formatCountdown(Math.max(cdRemainingMs, 0));
}

function tickCountdown() {
  const now = Date.now();
  const elapsed = now - cdStartTime;
  cdRemainingMs = Math.max(0, cdTotalMs - elapsed);
  updateCountdownDisplay();

  if (cdRemainingMs <= 0) {
    clearInterval(cdInterval);
    cdInterval = null;
    cdRunning = false;
    cdStartBtn.disabled = true;
    cdPauseBtn.disabled = true;
    cdResumeBtn.disabled = true;
    cdResetBtn.disabled = false;
    beep();
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  }
}

function confirmCountdown() {
  cdTotalMs = readSetupToMs();
  if (cdTotalMs <= 0) {
    alert('Configura un tiempo mayor a 0.');
    return;
  }
  cdConfirmed = true;
  cdRemainingMs = cdTotalMs;
  updateCountdownDisplay();

  // Mostrar controles de ejecución
  cdControls.classList.remove('hidden');
  cdStartBtn.disabled = false;
  cdPauseBtn.disabled = true;
  cdResumeBtn.disabled = true;
  cdResetBtn.disabled = false;

  // Bloquear setup mientras esté confirmado
  cdSetup.querySelectorAll('input, button.spin-btn').forEach(el => el.disabled = true);
}

function startCountdown() {
  if (!cdConfirmed || cdRunning) return;
  cdRunning = true;
  cdStartTime = Date.now() - (cdTotalMs - cdRemainingMs); // para soportar reanudación precisa
  cdInterval = setInterval(tickCountdown, 100);

  cdStartBtn.disabled = true;
  cdPauseBtn.disabled = false;
  cdResumeBtn.disabled = true;
  cdResetBtn.disabled = false;
}

function pauseCountdown() {
  if (!cdRunning) return;
  cdRunning = false;
  clearInterval(cdInterval);
  cdInterval = null;
  // cdRemainingMs ya se actualiza en tick; forzamos una actualización
  tickCountdown();

  cdStartBtn.disabled = true;
  cdPauseBtn.disabled = true;
  cdResumeBtn.disabled = false;
  cdResetBtn.disabled = false;
}

function resumeCountdown() {
  if (cdRunning || !cdConfirmed || cdRemainingMs <= 0) return;
  cdRunning = true;
  cdStartTime = Date.now() - (cdTotalMs - cdRemainingMs);
  cdInterval = setInterval(tickCountdown, 100);

  cdStartBtn.disabled = true;
  cdPauseBtn.disabled = false;
  cdResumeBtn.disabled = true;
  cdResetBtn.disabled = false;
}

function resetCountdown(silent = false) {
  cdRunning = false;
  cdConfirmed = false;
  clearInterval(cdInterval);
  cdInterval = null;

  cdTotalMs = 0;
  cdRemainingMs = 0;
  cdStartTime = null;
  cdDisplay.textContent = '00:00:00';

  // Reset de la UI
  cdSetup.querySelectorAll('input').forEach(inp => { inp.value = 0; });
  cdSetup.querySelectorAll('input, button.spin-btn').forEach(el => el.disabled = false);

  cdControls.classList.add('hidden');
  cdStartBtn.disabled = true;
  cdPauseBtn.disabled = true;
  cdResumeBtn.disabled = true;
  cdResetBtn.disabled = true;

  if (!silent && navigator.vibrate) navigator.vibrate(12);
}

// Eventos setup
cdConfirmBtn.addEventListener('click', confirmCountdown);
cdClearSetupBtn.addEventListener('click', () => {
  cdSetup.querySelectorAll('input').forEach(inp => inp.value = 0);
});

// Eventos controles
cdStartBtn.addEventListener('click', startCountdown);
cdPauseBtn.addEventListener('click', pauseCountdown);
cdResumeBtn.addEventListener('click', resumeCountdown);
cdResetBtn.addEventListener('click', () => resetCountdown());

// Spin buttons
document.querySelectorAll('.spin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.target;
    const target = document.getElementById(id);
    const dir = btn.dataset.spin;
    const max = parseInt(target.max, 10);
    const min = parseInt(target.min, 10);
    let val = parseInt(target.value || '0', 10);
    if (isNaN(val)) val = 0;
    val = dir === 'up' ? val + 1 : val - 1;
    if (val > max) val = max;
    if (val < min) val = min;
    target.value = val;
  });
});

// Accesibilidad: teclado para confirmar con Enter si está en inputs
[cdHours, cdMinutes, cdSeconds].forEach(inp => {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmCountdown();
    }
  });
});
