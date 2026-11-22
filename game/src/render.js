// Render: drawing only. The floor is dark indigo with a faint checker, walls
// are slate with a lit top edge, cover is deep green, loot glows gold, guard
// cones are red, camera cones amber, the exit is a green getaway zone. The
// thief is a dark figure with a gold mask stripe; guards are crimson with a
// facing tick. Overlays paint the title, busted, getaway and final screens.

import { FONT, PALETTE, TUNE, WORLD } from './config.js';
import { drawHints, drawHud, drawMinimap, fmtTime, money } from './hud.js';
import { levelTotal } from './loot.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAYING = 'playing';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_LEVEL_DONE = 'levelDone';
export const SCREEN_GAME_DONE = 'gameDone';

const fonts = new Map();
function font(size, weight) {
  const key = weight + size;
  if (!fonts.has(key)) fonts.set(key, (weight ? weight + ' ' : '') + size + 'px ' + FONT);
  return fonts.get(key);
}

function text(ctx, value, x, y, size, color, align, weight) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.fillText(value, x, y);
}

// A vision cone as a raycast fan: sample the arc, clip each ray at the first
// wall or cover it hits, and fill the polygon. Cheap, and the cone visibly
// bends around corners — the core read of the game.
function conePolygon(cx, cy, angle, halfAngle, range, blockers) {
  const steps = 26;
  const pts = [[cx, cy]];
  for (let i = 0; i <= steps; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let len = range;
    // March the ray in steps; stop at the first blocker it enters.
    for (let d = 12; d <= range; d += 12) {
      const px = cx + dx * d;
      const py = cy + dy * d;
      let hit = false;
      for (let b = 0; b < blockers.length; b += 1) {
        const r = blockers[b];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) { hit = true; break; }
      }
      if (hit) { len = d; break; }
    }
    pts.push([cx + dx * len, cy + dy * len]);
  }
  return pts;
}

function fillPolygon(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, WORLD.hudH, WORLD.w, WORLD.h - WORLD.hudH);
  ctx.fillStyle = PALETTE.floorB;
  const s = 80;
  for (let y = WORLD.hudH; y < WORLD.h; y += s) {
    for (let x = 0; x < WORLD.w; x += s) {
      if (((x / s + y / s) % 2) === 0) ctx.fillRect(x, y, s, s);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.w; x += s) {
    ctx.beginPath(); ctx.moveTo(x, WORLD.hudH); ctx.lineTo(x, WORLD.h); ctx.stroke();
  }
  for (let y = WORLD.hudH; y <= WORLD.h; y += s) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke();
  }
}

function drawWallsAndCover(ctx, level) {
  for (const w of level.def.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
  for (const c of level.def.cover) {
    ctx.fillStyle = c.kind === 'crate' ? PALETTE.coverCrate : c.kind === 'planter' ? PALETTE.coverPlanter : PALETTE.coverCase;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    if (c.kind === 'planter') {
      ctx.fillStyle = '#2e7d4f';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'case') {
      ctx.fillStyle = 'rgba(242, 201, 76, 0.25)';
      ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.h / 2);
      ctx.lineTo(c.x + c.w, c.y + c.h / 2);
      ctx.stroke();
    }
    // "COVER" tag on the first crate of a level, so the read is unmistakable.
    if (c === level.def.cover[0]) {
      text(ctx, 'COVER', c.x + c.w / 2, c.y - 6, 11, PALETTE.safe, 'center', '700');
    }
  }
}

function drawExit(ctx, level, time) {
  const e = level.exit;
  const pulse = 0.5 + 0.2 * Math.sin(time * 3);
  ctx.fillStyle = 'rgba(60, 200, 120, ' + pulse.toFixed(2) + ')';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = PALETTE.safe;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
  text(ctx, 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5, 15, '#062b16', 'center', '700');
  text(ctx, level.def.exitLabel, e.x + e.w / 2, e.y - 8, 11, PALETTE.safe, 'center', '700');
}

function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.x) * 2;
    const cx = item.x;
    const cy = item.y + bob;
    ctx.save();
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 14;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    if (item.safe) {
      // A safe: a dark steel box with a gold dial.
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(cx - 16, cy - 14, 32, 28);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 16, cy - 14, 32, 28);
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      if (item.pick > 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + item.pick * Math.PI * 2);
        ctx.stroke();
        text(ctx, 'LOCKPICK ' + Math.round(item.pick * 100) + '%', cx, cy - 26, 12, PALETTE.gold, 'center', '700');
      } else {
        text(ctx, '$' + item.value.toLocaleString('en-US'), cx, cy - 22, 12, PALETTE.gold, 'center', '700');
      }
    } else {
      // Loose loot: a glowing gold diamond.
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx + 9, cy);
      ctx.lineTo(cx, cy + 11);
      ctx.lineTo(cx - 9, cy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      text(ctx, '$' + item.value.toLocaleString('en-US'), cx, cy - 18, 12, PALETTE.gold, 'center', '700');
    }
    ctx.restore();
  }
}

function drawCones(ctx, level) {
  for (const camera of level.cameras) {
    if (camera.disabled > 0) continue;
    fillPolygon(ctx, conePolygon(camera.x, camera.y, camera.angle, TUNE.cameraHalfAngle, TUNE.cameraRange, level.blockers), PALETTE.coneCamera);
  }
  for (const guard of level.guards) {
    const color = guard.state === 'alerted'
      ? 'rgba(229, 83, 75, 0.34)'
      : guard.state === 'suspicious'
        ? 'rgba(229, 83, 75, 0.26)'
        : PALETTE.coneGuard;
    fillPolygon(ctx, conePolygon(guard.x, guard.y, guard.facing, TUNE.coneHalfAngle, TUNE.coneRange, level.blockers), color);
  }
}

function drawCameras(ctx, level) {
  for (const camera of level.cameras) {
    const off = camera.disabled > 0;
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.angle);
    ctx.fillStyle = off ? '#55557a' : '#2a2a44';
    ctx.fillRect(-4, -7, 16, 14);
    ctx.fillStyle = off ? '#777' : PALETTE.amber;
    ctx.beginPath();
    ctx.arc(12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (off) {
      text(ctx, 'EMP ' + camera.disabled.toFixed(1) + 's', camera.x, camera.y - 16, 11, PALETTE.amber, 'center', '700');
    }
  }
}

function drawGuards(ctx, level) {
  for (const guard of level.guards) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    // Body: crimson circle with a dark rim and a facing tick.
    ctx.fillStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(guard.facing);
    ctx.fillStyle = '#ffd9d9';
    ctx.fillRect(8, -3, 10, 6);
    ctx.restore();
    // State tag above the head.
    if (guard.state !== 'patrol') {
      const label = guard.state === 'alerted' ? '!' : '?';
      const color = guard.state === 'alerted' ? PALETTE.danger : PALETTE.amber;
      text(ctx, label, guard.x, guard.y - 22, 20, color, 'center', '700');
    }
  }
}

function drawCoinsAndSmoke(ctx, game) {
  for (const coin of game.coins) {
    const rr = 6 + coin.ring * 26;
    ctx.strokeStyle = 'rgba(242, 201, 76, ' + Math.max(0, 1 - coin.ring / 1.2).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'CLINK!', coin.x, coin.y - 14, 11, PALETTE.gold, 'center', '700');
  }
  for (const cloud of game.smokes) {
    const alpha = Math.min(0.55, cloud.t / TUNE.smokeSeconds * 0.55);
    ctx.fillStyle = 'rgba(180, 180, 200, ' + alpha.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230, 230, 240, 0.8)';
    ctx.beginPath();
    ctx.arc(cloud.x - 22, cloud.y + 8, 22, 0, Math.PI * 2);
    ctx.arc(cloud.x + 24, cloud.y - 6, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  if (p.hidden) return; // Inside smoke: the thief cannot be seen — or drawn.
  // Click-to-move target marker.
  if (p.moveTarget) {
    ctx.strokeStyle = 'rgba(242, 201, 76, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.moveTarget.x, p.moveTarget.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.moveTarget.x - 12, p.moveTarget.y);
    ctx.lineTo(p.moveTarget.x + 12, p.moveTarget.y);
    ctx.moveTo(p.moveTarget.x, p.moveTarget.y - 12);
    ctx.lineTo(p.moveTarget.x, p.moveTarget.y + 12);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.sneaking) ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#23233d';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Gold mask stripe, turned toward the facing.
  ctx.rotate(p.facing);
  ctx.fillStyle = PALETTE.playerTrim;
  ctx.fillRect(2, -4, 9, 8);
  ctx.restore();
  if (p.sneaking) text(ctx, 'SNEAKING', p.x, p.y - 22, 11, PALETTE.muted, 'center', '700');
}

function drawAlarmVignette(ctx, game) {
  const a = game.alarm / 100;
  if (a < 0.25) return;
  const g = ctx.createRadialGradient(640, 432, 260, 640, 432, 720);
  g.addColorStop(0, 'rgba(229, 83, 75, 0)');
  g.addColorStop(1, 'rgba(229, 83, 75, ' + (a * 0.5).toFixed(2) + ')');
  ctx.fillStyle = g;
  ctx.fillRect(0, WORLD.hudH, WORLD.w, WORLD.h - WORLD.hudH);
  if (game.alarm >= 100 && game.grace > 0) {
    text(ctx, 'SPOTTED — BREAK LINE OF SIGHT!', 640, 120, 26, PALETTE.danger, 'center', '700');
  }
}

function drawObjective(ctx, game) {
  const level = game.level;
  const remaining = level.loot.filter((l) => !l.taken).length;
  const msg = remaining > 0
    ? 'Grab the gold, then reach the green EXIT — ' + remaining + ' piece' + (remaining === 1 ? '' : 's') + ' left'
    : 'All loot pocketed — get to the EXIT!';
  ctx.fillStyle = 'rgba(10, 10, 24, 0.7)';
  ctx.fillRect(16, 68, 560, 24);
  text(ctx, msg, 24, 85, 13, PALETTE.text, 'left');
}

function drawPanel(ctx, title, lines, prompt, titleColor) {
  const w = 640;
  const h = 150 + lines.length * 32 + 70;
  const x = (WORLD.w - w) / 2;
  const y = (WORLD.h - h) / 2;
  ctx.fillStyle = 'rgba(8, 8, 20, 0.82)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a3a5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  text(ctx, title, WORLD.w / 2, y + 72, 46, titleColor || PALETTE.text, 'center', '700');
  for (let i = 0; i < lines.length; i += 1) {
    text(ctx, lines[i], WORLD.w / 2, y + 128 + i * 32, 20, PALETTE.muted, 'center');
  }
  text(ctx, prompt, WORLD.w / 2, y + h - 34, 20, PALETTE.gold, 'center', '700');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function draw(game) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'alphabetic';

    if (game.screen === SCREEN_TITLE) {
      drawFloor(ctx);
      drawTitleBackdrop(ctx, game);
      drawPanel(
        ctx,
        'THE MERIDIAN JOB',
        [
          'Three jobs. Fifteen guards. Nine cameras. One crew: you.',
          'Sneak the Gallery, crack the Vault, lift the Penthouse crown.',
          'Steal ' + money(game.totalLoot) + ' of loot and walk out clean.',
          'WASD move · SHIFT sneak · E grab / lockpick',
          'Q coin · F EMP · SPACE smoke · CLICK move-to',
        ],
        'Press SPACE or click to start the first job',
        PALETTE.gold,
      );
      return;
    }

    drawFloor(ctx);
    drawWallsAndCover(ctx, game.level);
    drawExit(ctx, game.level, game.time);
    drawCones(ctx, game.level);
    drawLoot(ctx, game.level, game.time);
    drawCameras(ctx, game.level);
    drawGuards(ctx, game.level);
    drawCoinsAndSmoke(ctx, game);
    drawPlayer(ctx, game);
    drawAlarmVignette(ctx, game);
    drawHud(ctx, game);
    drawMinimap(ctx, game);
    drawHints(ctx);
    drawObjective(ctx, game);

    if (game.screen === SCREEN_PAUSED) {
      drawPanel(ctx, 'PAUSED', ['The guards will wait. The alarm will not forget.'], 'Press P to resume');
    } else if (game.screen === SCREEN_BUSTED) {
      drawPanel(
        ctx,
        'BUSTED!',
        [
          'The floor made you at ' + Math.round(game.alarmPeak) + '% alarm — ' + game.bustedBy + '.',
          'You kept ' + money(game.lootValue) + ' — the crew keeps the rest for the next try.',
          'Fair is fair: break line of sight before the meter tops out.',
        ],
        'Press SPACE or R to retry ' + game.level.def.name,
        PALETTE.danger,
      );
    } else if (game.screen === SCREEN_LEVEL_DONE) {
      const s = game.lastStats;
      drawPanel(
        ctx,
        'CLEAN GETAWAY',
        [
          game.level.def.name + ' — ' + money(s.value) + ' lifted in ' + fmtTime(s.time) + ' · peak alarm ' + Math.round(s.alarmPeak) + '%',
          'Rating ' + s.rating + '  ·  Running total ' + money(game.lootValue),
          game.levelIndex + 1 < 3 ? 'Next job: ' + game.nextName : 'That was the last job of the night.',
        ],
        game.levelIndex + 1 < 3 ? 'Press SPACE for the next job' : 'Press SPACE to see the night’s take',
        PALETTE.safe,
      );
    } else if (game.screen === SCREEN_GAME_DONE) {
      const lines = ['Total take: ' + money(game.lootValue) + ' across three jobs.'];
      for (let i = 0; i < game.ratings.length; i += 1) {
        lines.push('Job ' + (i + 1) + ' — ' + game.ratings[i].name + ': ' + game.ratings[i].rating + ' · ' + money(game.ratings[i].value));
      }
      lines.push('Best take so far: ' + money(game.best));
      drawPanel(ctx, 'THE MERIDIAN JOB — COMPLETE', lines, 'Press SPACE to run it back', PALETTE.gold);
    }
  }

  // Title backdrop: the Gallery floor with a guard sweeping and the thief
  // waiting in cover, so the title already shows the game.
  function drawTitleBackdrop(ctx, game) {
    const level = game.level;
    drawWallsAndCover(ctx, level);
    drawExit(ctx, level, 0);
    drawCones(ctx, level);
    drawLoot(ctx, level, 0);
    drawCameras(ctx, level);
    drawGuards(ctx, level);
    drawPlayer(ctx, game);
  }

  return { draw };
}
