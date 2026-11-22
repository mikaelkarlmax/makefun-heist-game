// Sound: every effect is a synthesised WebAudio tone — no audio files, no
// network. A low drone hums under play, the alarm ticks faster as it climbs,
// and pickups, coins, EMP and the getaway each have their own little phrase.

let ctx = null;
let master = null;
let drone = null;
let alarmTimer = 0;

function ensure() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  } catch {
    return false;
  }
  return true;
}

// Start the audio world (called on the first gesture, so browsers allow it).
export function initAudio() {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!drone) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.05;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = 110.5;
    gain2.gain.value = 0.015;
    osc.connect(gain);
    gain.connect(master);
    osc2.connect(gain2);
    gain2.connect(master);
    osc.start();
    osc2.start();
    drone = osc;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ensure() || !ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxPickup() {
  tone(880, 0.12, 'sine', 0.5);
  tone(1318, 0.18, 'sine', 0.4, 0.07);
}

export function sfxSafe() {
  tone(660, 0.1, 'square', 0.25);
  tone(880, 0.1, 'square', 0.25, 0.09);
  tone(1108, 0.22, 'square', 0.3, 0.18);
}

export function sfxCoin() {
  tone(1568, 0.3, 'sine', 0.4, 0, 1900);
}

export function sfxEmp() {
  tone(1200, 0.35, 'sawtooth', 0.3, 0, 120);
  tone(300, 0.2, 'square', 0.2, 0.05, 90);
}

export function sfxSmoke() {
  tone(220, 0.4, 'sine', 0.25, 0, 60);
}

export function sfxBusted() {
  tone(220, 0.5, 'sawtooth', 0.4, 0, 55);
  tone(110, 0.7, 'sawtooth', 0.35, 0.15, 40);
}

export function sfxGetaway() {
  tone(523, 0.14, 'sine', 0.45);
  tone(659, 0.14, 'sine', 0.45, 0.12);
  tone(784, 0.14, 'sine', 0.45, 0.24);
  tone(1046, 0.3, 'sine', 0.5, 0.36);
}

export function sfxClick() {
  tone(700, 0.06, 'sine', 0.3);
}

// Called every frame while playing: the alarm's heartbeat ticks faster and
// higher as the meter climbs toward a bust.
export function alarmHeartbeat(dt, alarm) {
  if (!ctx || alarm < 55) return;
  alarmTimer -= dt;
  if (alarmTimer <= 0) {
    const urgency = (alarm - 55) / 45;
    alarmTimer = 0.9 - urgency * 0.55;
    tone(980 + urgency * 320, 0.09, 'square', 0.16);
  }
}
