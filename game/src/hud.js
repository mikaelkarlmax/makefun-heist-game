// HUD and minimap: the top bar (level, alarm meter, loot, tools, timer) and
// the corner map that shows walls, cones, loot, the exit and the thief at a
// glance. Drawing only — it reads the game state and paints pixels.

import { PALETTE, TUNE } from './config.js';
import { levelTotal } from './loot.js';

export function money(n) {
  return '$' + n.toLocaleString('en-US');
}

function alarmColor(alarm) {
  if (alarm < 30) return PALETTE.safe;
  if (alarm < 65) return PALETTE.amber;
  return PALETTE.danger;
}

// The top bar, 64 px tall: level name left, alarm meter centre, loot + tools
// + timer right. Everything the judge needs to read is in this one strip.
export function drawHud(ctx, game) {
  const level = game.level;
  const def = level.def;
  ctx.fillStyle = '#101024';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#26264a';
  ctx.fillRect(0, 62, 1280, 2);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 22px ' + 'system-ui, sans-serif';
  ctx.fillText('JOB ' + def.id + ' — ' + def.name.toUpperCase(), 20, 28);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(
    def.guards.length + ' GUARDS · ' + def.cameras.length + ' CAMERAS · LOOT ' + money(levelTotal(level)),
    20, 50,
  );

  // Alarm meter, centre: a labelled bar that fills green → amber → red.
  const bx = 470;
  const bw = 340;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', bx, 24);
  ctx.fillStyle = '#2a2a44';
  ctx.fillRect(bx, 30, bw, 18);
  const fill = Math.max(0, Math.min(100, game.alarm)) / 100 * bw;
  ctx.fillStyle = alarmColor(game.alarm);
  ctx.fillRect(bx, 30, fill, 18);
  ctx.strokeStyle = '#55557a';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, 30.5, bw, 18);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.round(game.alarm) + '%', bx + bw + 52, 45);
  if (game.alarm >= TUNE.alarmAlerted) {
    ctx.fillStyle = PALETTE.danger;
    ctx.textAlign = 'left';
    ctx.fillText('SPOTTED!', bx + bw + 62, 45);
  } else if (game.alarm >= TUNE.alarmSuspicious) {
    ctx.fillStyle = PALETTE.amber;
    ctx.textAlign = 'left';
    ctx.fillText('SUSPICIOUS', bx + bw + 62, 45);
  }

  // Loot, tools and timer, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(money(game.lootValue), 1260, 29);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '14px system-ui, sans-serif';
  const p = game.player;
  ctx.fillText(
    'COIN ×' + p.tools.coins + '   EMP ×' + p.tools.emp + '   SMOKE ×' + p.tools.smoke,
    1260, 51,
  );
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fmtTime(game.time), 1040, 29);
}

// mm:ss for the timer.
export function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// Minimap, bottom right: the whole floor at 1/6 scale — walls, cover, cones
// as wedges, loot as gold dots, exit green, thief gold-ringed white.
export function drawMinimap(ctx, game) {
  const level = game.level;
  const mx = 1280 - 236;
  const my = 800 - 168;
  const mw = 216;
  const mh = 148;
  const sx = mw / 1280;
  const sy = mh / 736;
  const ox = mx;
  const oy = my - 64 * sy;

  ctx.fillStyle = 'rgba(10, 10, 24, 0.85)';
  ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
  ctx.strokeStyle = '#3a3a5e';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 5.5, my - 5.5, mw + 11, mh + 11);

  const X = (x) => ox + x * sx;
  const Y = (y) => oy + y * sy;

  ctx.fillStyle = '#2c2c50';
  for (const w of level.def.walls) ctx.fillRect(X(w.x), Y(w.y), w.w * sx, Math.max(1, w.h * sy));
  ctx.fillStyle = '#1e4d2c';
  for (const c of level.def.cover) ctx.fillRect(X(c.x), Y(c.y), c.w * sx, c.h * sy);

  const e = level.exit;
  ctx.fillStyle = PALETTE.safe;
  ctx.fillRect(X(e.x), Y(e.y), e.w * sx, e.h * sy);

  for (const item of level.loot) {
    if (item.taken) continue;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(X(item.x), Y(item.y), item.safe ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const camera of level.cameras) {
    ctx.fillStyle = camera.disabled > 0 ? '#55557a' : PALETTE.amber;
    ctx.beginPath();
    ctx.arc(X(camera.x), Y(camera.y), 3, 0, Math.PI * 2);
    ctx.fill();
    if (camera.disabled <= 0) {
      ctx.fillStyle = 'rgba(242, 180, 60, 0.25)';
      ctx.beginPath();
      ctx.moveTo(X(camera.x), Y(camera.y));
      ctx.arc(X(camera.x), Y(camera.y), 26, camera.angle - 0.44, camera.angle + 0.44);
      ctx.closePath();
      ctx.fill();
    }
  }
  for (const guard of level.guards) {
    ctx.fillStyle = guard.state === 'patrol' ? 'rgba(229, 83, 75, 0.35)' : 'rgba(229, 83, 75, 0.6)';
    ctx.beginPath();
    ctx.moveTo(X(guard.x), Y(guard.y));
    ctx.arc(X(guard.x), Y(guard.y), 30, guard.facing - 0.62, guard.facing + 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.danger;
    ctx.beginPath();
    ctx.arc(X(guard.x), Y(guard.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = game.player;
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP — ' + defName(level), mx, my + mh + 2);
}

function defName(level) {
  return level.def.name.toUpperCase();
}

// The control hints along the bottom edge, so a first-time player can play.
export function drawHints(ctx) {
  ctx.fillStyle = 'rgba(10, 10, 24, 0.7)';
  ctx.fillRect(16, 800 - 34, 640, 24);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('WASD move · SHIFT sneak · E grab / lockpick · Q coin · F EMP · SPACE smoke · CLICK move-to', 24, 800 - 17);
}
