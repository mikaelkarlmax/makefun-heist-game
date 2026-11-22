// Loot, lockpicks and the getaway: what the thief steals, what it is worth,
// and how a job ends. Small loot is grabbed with E; a safe needs E held for
// three seconds while the lockpick ring fills. Reaching the exit with at
// least one piece of loot ends the level with a tally and a rating.

import { TUNE, levelLootTotal } from './config.js';
import { dist } from './world.js';

export const GRAB_RANGE = 42;

// Nearest loot the thief can reach right now (null when nothing is close).
export function nearestLoot(level, player) {
  let best = null;
  let bestD = GRAB_RANGE;
  for (const item of level.loot) {
    if (item.taken) continue;
    const d = dist(player.x, player.y, item.x, item.y);
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}

// One step of grabbing. Holding E near a safe fills its pick ring; a tap of E
// near ordinary loot pockets it at once. Returns the item just taken, or null.
export function updateLoot(level, player, interactHeld, dt) {
  const item = nearestLoot(level, player);
  if (!item) {
    for (const l of level.loot) l.pick = 0;
    return null;
  }
  if (!item.safe) {
    if (interactHeld && !item._grabbed) {
      item.taken = true;
      item._grabbed = true;
      return item;
    }
    return null;
  }
  if (interactHeld) {
    item.pick += dt / TUNE.lockpickSeconds;
    if (item.pick >= 1) {
      item.taken = true;
      return item;
    }
  } else {
    item.pick = Math.max(0, item.pick - dt * 2);
  }
  return null;
}

// Is the thief standing in the exit zone?
export function atExit(level, player) {
  const e = level.exit;
  return player.x > e.x && player.x < e.x + e.w && player.y > e.y && player.y < e.y + e.h;
}

// Rating for a finished level: S for fast, quiet and thorough; C for loud
// and slow. `stats` is { time, alarmPeak, value, total }.
export function rateLevel(stats, par) {
  const full = stats.value >= stats.total;
  if (stats.time <= par && stats.alarmPeak <= 30 && full) return 'S';
  if (stats.time <= par * 1.3 && stats.alarmPeak <= 55) return 'A';
  if (stats.time <= par * 2 && stats.alarmPeak <= 80) return 'B';
  return 'C';
}

// A coin's ring expands and fades; when it rings, guards in earshot turn
// toward it. Returns true while the coin still rings.
export function updateCoins(coins, guards, dt) {
  for (let i = coins.length - 1; i >= 0; i -= 1) {
    const coin = coins[i];
    coin.t -= dt;
    coin.ring += dt;
    if (coin.ring > 0.4 && !coin.lured) {
      coin.lured = true;
      for (const guard of guards) {
        if (dist(guard.x, guard.y, coin.x, coin.y) < TUNE.coinLureRadius) {
          guard.investigate = { x: coin.x, y: coin.y };
          guard.lookTimer = 0;
          guard.state = 'suspicious';
        }
      }
    }
    if (coin.t <= 0) coins.splice(i, 1);
  }
}

// Smoke clouds thin out over four seconds.
export function updateSmokes(smokes, dt) {
  for (let i = smokes.length - 1; i >= 0; i -= 1) {
    smokes[i].t -= dt;
    if (smokes[i].t <= 0) smokes.splice(i, 1);
  }
}

// How much loot is still on the floor of this level, in dollars.
export function remainingValue(level) {
  return level.loot.reduce((s, l) => s + (l.taken ? 0 : l.value), 0);
}

export function levelTotal(level) {
  return levelLootTotal(level.def);
}
