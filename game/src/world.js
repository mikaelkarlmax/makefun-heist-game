// World: the level's geometry, movement collision and line of sight.
// No drawing here, no browser in it — pure rectangles, circles and segments,
// so the same helpers serve guards, cameras, the player and the minimap.

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Shortest signed turn from angle `from` to angle `to`, in (-PI, PI].
export function angleDiff(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Circle vs rectangle: true when the circle overlaps the rect.
export function circleHitsRect(cx, cy, radius, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

// Segment vs rectangle via the slab method. True when the segment touches the rect.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Line of sight: clear when no blocker rect sits between the two points.
export function losClear(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

// Build the runtime level from a config entry: fresh loot, guards, cameras,
// player at the start, empty tool effects, alarm at zero.
export function createLevel(def) {
  const blockers = def.walls.concat(def.cover);
  return {
    def,
    blockers,
    loot: def.loot.map((l) => ({ ...l, taken: false, pick: 0 })),
    guards: def.guards.map((g) => ({
      wp: g.wp,
      speed: g.speed,
      x: g.wp[0][0],
      y: g.wp[0][1],
      wpIndex: 1,
      facing: 0,
      state: 'patrol',
      pause: 0,
      lookTimer: 0,
      lastSeen: null,
      investigate: null,
    })),
    cameras: def.cameras.map((c) => ({
      x: c.x, y: c.y, a0: c.a0, a1: c.a1, speed: c.speed,
      angle: (c.a0 + c.a1) / 2, dir: 1, disabled: 0,
    })),
    exit: def.exit,
    start: def.start,
  };
}

// Move a circle (the thief, a guard) through the world: try x, then y, so it
// slides along walls instead of sticking. Returns true when it moved at all.
export function moveCircle(body, dx, dy, blockers) {
  let moved = false;
  const nx = body.x + dx;
  let blocked = false;
  for (let i = 0; i < blockers.length; i += 1) {
    if (circleHitsRect(nx, body.y, body.r, blockers[i])) { blocked = true; break; }
  }
  if (!blocked) { body.x = nx; moved = true; }
  const ny = body.y + dy;
  blocked = false;
  for (let i = 0; i < blockers.length; i += 1) {
    if (circleHitsRect(body.x, ny, body.r, blockers[i])) { blocked = true; break; }
  }
  if (!blocked) { body.y = ny; moved = true; }
  return moved;
}

// Is the thief standing inside a smoke cloud (invisible to eyes and lenses)?
export function inSmoke(x, y, smokes) {
  for (let i = 0; i < smokes.length; i += 1) {
    if (dist(x, y, smokes[i].x, smokes[i].y) < smokes[i].r) return true;
  }
  return false;
}
