// The Meridian Job — level data: three original heists, one crew, one night.
// Every room is a hand-placed rectangle layout: walls block sight and movement,
// cover (crates, planters, display cases) breaks line of sight, loot pays,
// cameras sweep, guards walk their beats. Coordinates are canvas pixels (1280x800).
// The playfield is the inner room; the outer border is always a wall.

export const TILE = 40;
export const WORLD = { w: 1280, h: 800, hudH: 64 };

// A wall is {x, y, w, h}. A cover object is {x, y, w, h, kind} and also blocks sight.
// Loot is {x, y, value, name, safe} — safe loot needs a 3s lockpick hold.
// A guard is {wp: [[x,y],...], speed}. A camera is {x, y, a0, a1, speed} (sweep arc).
export const LEVELS = [
  {
    id: 1,
    name: 'The Gallery',
    sub: 'Meridian Museum of Art — midnight wing',
    par: 150,
    start: { x: 90, y: 700 },
    exit: { x: 1180, y: 90, w: 70, h: 70 },
    exitLabel: 'GETAWAY VAN',
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 }, { x: 0, y: 784, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 736 }, { x: 1264, y: 64, w: 16, h: 736 },
      { x: 300, y: 64, w: 20, h: 220 }, { x: 300, y: 420, w: 20, h: 200 },
      { x: 620, y: 180, w: 20, h: 260 }, { x: 620, y: 560, w: 20, h: 224 },
      { x: 940, y: 64, w: 20, h: 200 }, { x: 940, y: 400, w: 20, h: 220 },
      { x: 420, y: 300, w: 200, h: 20 }, { x: 760, y: 520, w: 200, h: 20 },
    ],
    cover: [
      { x: 150, y: 180, w: 90, h: 60, kind: 'crate' },
      { x: 420, y: 140, w: 110, h: 70, kind: 'case' },
      { x: 700, y: 120, w: 90, h: 60, kind: 'planter' },
      { x: 180, y: 480, w: 90, h: 60, kind: 'planter' },
      { x: 470, y: 620, w: 110, h: 70, kind: 'case' },
      { x: 800, y: 660, w: 90, h: 60, kind: 'crate' },
      { x: 1060, y: 480, w: 90, h: 60, kind: 'planter' },
      { x: 1060, y: 180, w: 90, h: 60, kind: 'case' },
    ],
    loot: [
      { x: 200, y: 130, value: 1200, name: 'Jade Idol' },
      { x: 480, y: 110, value: 900, name: 'Gold Mask' },
      { x: 820, y: 150, value: 1500, name: 'Star Sapphire' },
      { x: 1120, y: 300, value: 800, name: 'Silver Chalice' },
      { x: 380, y: 700, value: 600, name: 'Coin Hoard' },
      { x: 1120, y: 640, value: 2200, name: 'The Meridian Diamond', safe: true },
    ],
    guards: [
      { wp: [[420, 250], [900, 250], [900, 470], [420, 470]], speed: 62 },
      { wp: [[180, 620], [560, 620], [560, 380], [180, 380]], speed: 58 },
      { wp: [[1050, 600], [1050, 250], [760, 250], [760, 600]], speed: 66 },
    ],
    cameras: [
      { x: 640, y: 80, a0: -0.4, a1: 1.1, speed: 0.45 },
      { x: 320, y: 780, a0: -1.2, a1: 0.3, speed: 0.5 },
    ],
    tools: { coins: 3, emp: 2, smoke: 2 },
  },
  {
    id: 2,
    name: 'The Vault',
    sub: 'First Meridian Bank — sub-basement',
    par: 180,
    start: { x: 90, y: 700 },
    exit: { x: 90, y: 120, w: 70, h: 70 },
    exitLabel: 'SERVICE TUNNEL',
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 }, { x: 0, y: 784, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 736 }, { x: 1264, y: 64, w: 16, h: 736 },
      { x: 260, y: 64, w: 20, h: 300 }, { x: 260, y: 500, w: 20, h: 284 },
      { x: 560, y: 200, w: 20, h: 280 }, { x: 560, y: 600, w: 20, h: 184 },
      { x: 860, y: 64, w: 20, h: 260 }, { x: 860, y: 460, w: 20, h: 324 },
      { x: 1080, y: 300, w: 184, h: 20 },
      { x: 380, y: 480, w: 180, h: 20 }, { x: 680, y: 280, w: 180, h: 20 },
    ],
    cover: [
      { x: 120, y: 220, w: 90, h: 60, kind: 'crate' },
      { x: 380, y: 120, w: 110, h: 70, kind: 'case' },
      { x: 640, y: 120, w: 90, h: 60, kind: 'planter' },
      { x: 140, y: 560, w: 90, h: 60, kind: 'crate' },
      { x: 400, y: 600, w: 110, h: 70, kind: 'case' },
      { x: 960, y: 620, w: 90, h: 60, kind: 'crate' },
      { x: 980, y: 160, w: 90, h: 60, kind: 'planter' },
      { x: 700, y: 420, w: 90, h: 60, kind: 'case' },
    ],
    loot: [
      { x: 150, y: 130, value: 1500, name: 'Bearer Bonds' },
      { x: 430, y: 340, value: 1100, name: 'Gold Bars' },
      { x: 700, y: 180, value: 1800, name: 'Vault Cash' },
      { x: 1150, y: 200, value: 900, name: 'Deposit Box' },
      { x: 1150, y: 700, value: 2600, name: 'The Crown Jewels', safe: true },
      { x: 650, y: 700, value: 700, name: 'Coin Rolls' },
      { x: 180, y: 420, value: 1000, name: 'Silver Ingots' },
    ],
    guards: [
      { wp: [[340, 200], [800, 200], [800, 420], [340, 420]], speed: 66 },
      { wp: [[120, 650], [480, 650], [480, 420], [120, 420]], speed: 62 },
      { wp: [[980, 700], [980, 380], [1180, 380], [1180, 700]], speed: 70 },
      { wp: [[640, 560], [1040, 560], [1040, 700], [640, 700]], speed: 60 },
      { wp: [[200, 130], [500, 130], [500, 300], [200, 300]], speed: 64 },
    ],
    cameras: [
      { x: 640, y: 80, a0: -0.5, a1: 1.2, speed: 0.55 },
      { x: 880, y: 780, a0: -1.3, a1: 0.2, speed: 0.5 },
      { x: 1200, y: 380, a0: 1.6, a1: 3.0, speed: 0.45 },
    ],
    tools: { coins: 3, emp: 2, smoke: 2 },
  },
  {
    id: 3,
    name: 'The Penthouse',
    sub: 'Meridian Tower, floor 88 — the collector’s flat',
    par: 200,
    start: { x: 640, y: 720 },
    exit: { x: 1180, y: 700, w: 70, h: 70 },
    exitLabel: 'ROOFTOP HELIPAD',
    walls: [
      { x: 0, y: 64, w: 1280, h: 16 }, { x: 0, y: 784, w: 1280, h: 16 },
      { x: 0, y: 64, w: 16, h: 736 }, { x: 1264, y: 64, w: 16, h: 736 },
      { x: 320, y: 64, w: 20, h: 240 }, { x: 320, y: 440, w: 20, h: 200 },
      { x: 640, y: 220, w: 20, h: 240 }, { x: 640, y: 580, w: 20, h: 204 },
      { x: 960, y: 64, w: 20, h: 220 }, { x: 960, y: 420, w: 20, h: 200 },
      { x: 160, y: 380, w: 160, h: 20 }, { x: 760, y: 380, w: 200, h: 20 },
      { x: 480, y: 580, w: 160, h: 20 },
    ],
    cover: [
      { x: 120, y: 140, w: 100, h: 70, kind: 'case' },
      { x: 420, y: 120, w: 90, h: 60, kind: 'planter' },
      { x: 760, y: 120, w: 100, h: 70, kind: 'case' },
      { x: 1080, y: 140, w: 90, h: 60, kind: 'planter' },
      { x: 140, y: 560, w: 90, h: 60, kind: 'crate' },
      { x: 420, y: 660, w: 110, h: 70, kind: 'case' },
      { x: 760, y: 640, w: 90, h: 60, kind: 'crate' },
      { x: 1080, y: 480, w: 90, h: 60, kind: 'planter' },
      { x: 480, y: 300, w: 90, h: 60, kind: 'case' },
    ],
    loot: [
      { x: 180, y: 120, value: 2000, name: 'Ming Vase' },
      { x: 520, y: 140, value: 1400, name: 'First Edition' },
      { x: 820, y: 150, value: 2400, name: 'Blue Diamond' },
      { x: 1140, y: 280, value: 1100, name: 'Gold Watch' },
      { x: 200, y: 680, value: 900, name: 'Rare Coins' },
      { x: 520, y: 480, value: 1600, name: 'Emerald Necklace' },
      { x: 840, y: 500, value: 3200, name: 'The Meridian Crown', safe: true },
      { x: 1140, y: 600, value: 1300, name: 'Platinum Bars' },
    ],
    guards: [
      { wp: [[200, 220], [560, 220], [560, 500], [200, 500]], speed: 70 },
      { wp: [[720, 200], [1120, 200], [1120, 480], [720, 480]], speed: 72 },
      { wp: [[120, 650], [560, 650], [560, 300], [120, 300]], speed: 66 },
      { wp: [[700, 650], [1120, 650], [1120, 300], [700, 300]], speed: 68 },
      { wp: [[340, 140], [940, 140], [940, 320], [340, 320]], speed: 64 },
      { wp: [[180, 480], [600, 480], [600, 720], [180, 720]], speed: 62 },
      { wp: [[700, 560], [1180, 560], [1180, 700], [700, 700]], speed: 66 },
    ],
    cameras: [
      { x: 640, y: 80, a0: -0.6, a1: 1.3, speed: 0.6 },
      { x: 340, y: 780, a0: -1.2, a1: 0.4, speed: 0.55 },
      { x: 980, y: 780, a0: -1.4, a1: 0.2, speed: 0.5 },
      { x: 1260, y: 400, a0: 1.7, a1: 3.1, speed: 0.45 },
    ],
    tools: { coins: 4, emp: 2, smoke: 3 },
  },
];

// Totals the HUD and the title screen quote.
export function levelLootTotal(level) {
  return level.loot.reduce((s, l) => s + l.value, 0);
}
export function totalGuards() {
  return LEVELS.reduce((s, l) => s + l.guards.length, 0);
}
export function totalCameras() {
  return LEVELS.reduce((s, l) => s + l.cameras.length, 0);
}
export function totalLootValue() {
  return LEVELS.reduce((s, l) => s + levelLootTotal(l), 0);
}

// Shared tuning + palette, so render and rules never disagree on a number.
export const TUNE = {
  walkSpeed: 175,
  sneakSpeed: 95,
  guardChaseSpeed: 150,
  coneRange: 265,
  coneHalfAngle: 0.62,
  cameraRange: 300,
  cameraHalfAngle: 0.44,
  alarmRiseGuard: 46,
  alarmRiseCamera: 62,
  alarmDecay: 9,
  alarmSuspicious: 30,
  alarmAlerted: 65,
  graceSeconds: 1.2,
  lockpickSeconds: 3,
  empSeconds: 6,
  smokeSeconds: 4,
  coinLureRadius: 330,
};

export const PALETTE = {
  backdrop: '#0b0b18',
  floorA: '#191932',
  floorB: '#15152b',
  wall: '#33335c',
  wallTop: '#4a4a7d',
  coverCrate: '#1e4d2c',
  coverPlanter: '#1d4a33',
  coverCase: '#243a5e',
  gold: '#f2c94c',
  goldDim: '#a8842a',
  coneGuard: 'rgba(229, 83, 75, 0.20)',
  coneCamera: 'rgba(242, 180, 60, 0.16)',
  danger: '#e5534b',
  amber: '#f2b43c',
  safe: '#3cc878',
  player: '#e8e6f0',
  playerTrim: '#f2c94c',
  guard: '#d64545',
  guardDark: '#7e2626',
  text: '#eef1f5',
  muted: '#9a9ab8',
  panel: '#1c1c30',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'meridian-job.best';
