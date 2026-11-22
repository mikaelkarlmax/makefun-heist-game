// Screenshot staging behind ?shot=cover|tools|alarm|escape. Each scene sets
// the real game state to a fixed, readable moment — a guard mid-patrol, a
// coin ringing, the alarm nearly topped out, the getaway tally — then freezes
// the loop so the frame is stable for the screenshot. Nothing here is drawn
// by hand: the renderer paints the live game.

import { SCREEN_GAME_DONE, SCREEN_LEVEL_DONE, SCREEN_PLAYING } from './render.js';
import { levelTotal } from './loot.js';

function freeze(game) {
  game.frozen = true;
  game.screen = SCREEN_PLAYING;
}

// The cover: the Gallery at its tensest readable second — thief in the open
// lane, a guard's cone sweeping toward them, a camera on the wall, gold
// loot on both sides, the alarm already a third full.
export function stageCover(game) {
  game.loadLevel(0);
  const p = game.player;
  p.x = 600;
  p.y = 690;
  p.facing = -Math.PI / 2;
  const g0 = game.level.guards[0];
  g0.x = 700;
  g0.y = 480;
  g0.facing = Math.PI / 2;
  g0.state = 'suspicious';
  const g1 = game.level.guards[1];
  g1.x = 330;
  g1.y = 560;
  g1.facing = 0.5;
  const g2 = game.level.guards[2];
  g2.x = 1010;
  g2.y = 300;
  g2.facing = Math.PI;
  game.level.cameras[0].angle = 0.9;
  game.level.cameras[1].angle = -0.6;
  game.level.loot[0].taken = true;
  game.level.loot[1].taken = true;
  game.lootValue = 2100;
  game.alarm = 32;
  game.alarmPeak = 32;
  game.time = 47;
  freeze(game);
}

// Tools in play: a coin ringing on the Vault floor pulls a guard off its
// beat while the EMP has every camera dark.
export function stageTools(game) {
  game.loadLevel(1);
  const p = game.player;
  p.x = 500;
  p.y = 450;
  p.facing = 0.3;
  game.coins.push({ x: 640, y: 380, t: 4.2, ring: 0.6, lured: true });
  const g0 = game.level.guards[0];
  g0.x = 560;
  g0.y = 320;
  g0.facing = Math.atan2(380 - 320, 640 - 560);
  g0.state = 'suspicious';
  g0.investigate = { x: 640, y: 380 };
  for (const cam of game.level.cameras) cam.disabled = 4.2;
  game.level.loot[0].taken = true;
  game.level.loot[1].taken = true;
  game.lootValue = 2600;
  game.alarm = 18;
  game.alarmPeak = 18;
  game.time = 74;
  freeze(game);
}

// The alarm nearly topped out: a guard is alerted and closing in, a camera
// cone sits on the thief, the red vignette is up, the grace warning shows.
export function stageAlarm(game) {
  game.loadLevel(1);
  const p = game.player;
  p.x = 700;
  p.y = 500;
  p.facing = Math.PI;
  const g3 = game.level.guards[3];
  g3.x = 780;
  g3.y = 560;
  g3.facing = Math.atan2(500 - 560, 700 - 780);
  g3.state = 'alerted';
  g3.lastSeen = { x: 700, y: 500 };
  const g0 = game.level.guards[0];
  g0.x = 620;
  g0.y = 380;
  g0.facing = Math.atan2(500 - 380, 700 - 620);
  g0.state = 'alerted';
  g0.lastSeen = { x: 700, y: 500 };
  game.level.cameras[1].angle = -0.9;
  game.level.loot[0].taken = true;
  game.level.loot[1].taken = true;
  game.alarm = 87;
  game.alarmPeak = 87;
  game.grace = 0.8;
  game.lootValue = 2600;
  game.time = 96;
  freeze(game);
}

// The getaway: the Penthouse done, the tally and the S rating on screen,
// the running total beside it.
export function stageEscape(game) {
  game.loadLevel(2);
  game.lootValue = 30700;
  game.lastStats = {
    value: 13900,
    total: levelTotal(game.level),
    time: 178,
    alarmPeak: 22,
    rating: 'S',
  };
  game.ratings = [
    { name: 'The Gallery', rating: 'S', value: 7200 },
    { name: 'The Vault', rating: 'A', value: 9600 },
    { name: 'The Penthouse', rating: 'S', value: 13900 },
  ];
  game.levelIndex = 2;
  game.frozen = true;
  game.screen = SCREEN_LEVEL_DONE;
}

export function stageShot(name, game) {
  if (name === 'tools') stageTools(game);
  else if (name === 'alarm') stageAlarm(game);
  else if (name === 'escape') stageEscape(game);
  else stageCover(game);
  void SCREEN_GAME_DONE;
}
