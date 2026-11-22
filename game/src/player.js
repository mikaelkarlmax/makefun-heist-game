// The thief: one small figure in a dark coat and a gold mask stripe. WASD or
// arrows to walk, Shift to sneak (slow, harder to spot), click to set a move
// target, Q to toss a distracting coin, F to fire the EMP, Space for smoke.
// The player object carries position, facing, sneaking and tool counts.

import { TUNE } from './config.js';
import { dist, moveCircle } from './world.js';

export function createPlayer(x, y, tools) {
  return {
    x, y, r: 12,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    hidden: false,
    moveTarget: null,
    tools: { coins: tools.coins, emp: tools.emp, smoke: tools.smoke },
    coinCooldown: 0,
    empCooldown: 0,
    smokeCooldown: 0,
  };
}

// Step the thief. `keys` is the input state; `level` gives the walls.
// Returns nothing — the caller reads player.moveTarget / tools after.
export function updatePlayer(player, dt, keys, level) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  if (dx !== 0 || dy !== 0) {
    // Keyboard steering beats a click target.
    player.moveTarget = null;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
  } else if (player.moveTarget) {
    const d = dist(player.x, player.y, player.moveTarget.x, player.moveTarget.y);
    if (d < 6) {
      player.moveTarget = null;
    } else {
      dx = (player.moveTarget.x - player.x) / d;
      dy = (player.moveTarget.y - player.y) / d;
    }
  }

  player.sneaking = keys.sneak;
  const speed = player.sneaking ? TUNE.sneakSpeed : TUNE.walkSpeed;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    player.facing = Math.atan2(dy, dx);
    moveCircle(player, dx * speed * dt, dy * speed * dt, level.blockers);
  }
  if (player.coinCooldown > 0) player.coinCooldown -= dt;
  if (player.empCooldown > 0) player.empCooldown -= dt;
  if (player.smokeCooldown > 0) player.smokeCooldown -= dt;
}

// Toss a coin ahead of the thief: it lands, rings, and pulls nearby guards
// off their beats to investigate the sound. Returns the coin or null.
export function throwCoin(player, coins, mouse) {
  if (player.tools.coins <= 0 || player.coinCooldown > 0) return null;
  player.tools.coins -= 1;
  player.coinCooldown = 0.6;
  let tx;
  let ty;
  if (mouse) {
    tx = mouse.x;
    ty = mouse.y;
  } else {
    tx = player.x + Math.cos(player.facing) * 190;
    ty = player.y + Math.sin(player.facing) * 190;
  }
  const coin = { x: tx, y: ty, t: 5, ring: 0 };
  coins.push(coin);
  return coin;
}

// Drop a smoke cloud at the thief's feet: 4 seconds of invisibility inside it.
export function dropSmoke(player, smokes) {
  if (player.tools.smoke <= 0 || player.smokeCooldown > 0) return null;
  player.tools.smoke -= 1;
  player.smokeCooldown = 0.8;
  const cloud = { x: player.x, y: player.y, r: 72, t: TUNE.smokeSeconds };
  smokes.push(cloud);
  return cloud;
}

// Fire the EMP: needs a charge left. Returns true when it fired.
export function fireEmp(player) {
  if (player.tools.emp <= 0 || player.empCooldown > 0) return false;
  player.tools.emp -= 1;
  player.empCooldown = 1;
  return true;
}
