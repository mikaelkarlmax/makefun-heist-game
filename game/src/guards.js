// Guards: patrol beats, vision cones raycast against walls and cover, and a
// three-state brain — calm patrol, suspicious investigation, alerted chase.
// A guard only "sees" the thief inside its cone, in range, with a clear line
// of sight, and not hidden in smoke; sneaking shrinks the range that counts.

import { TUNE } from './config.js';
import { angleDiff, dist, losClear, moveCircle } from './world.js';

// Can this guard see the thief right now? Returns a 0..1 strength (1 = close
// and dead-centre in the cone) so near misses raise the alarm slowly.
export function guardSees(guard, player, level, smokes) {
  if (player.hidden) return 0;
  const d = dist(guard.x, guard.y, player.x, player.y);
  const range = TUNE.coneRange * (player.sneaking ? 0.62 : 1);
  if (d > range) return 0;
  const ang = Math.atan2(player.y - guard.y, player.x - guard.x);
  if (Math.abs(angleDiff(guard.facing, ang)) > TUNE.coneHalfAngle) return 0;
  if (!losClear(guard.x, guard.y, player.x, player.y, level.blockers)) return 0;
  if (smokes && smokes.length) {
    // Smoke between the guard and the thief blocks the view too.
    for (let i = 0; i < smokes.length; i += 1) {
      const s = smokes[i];
      if (dist(player.x, player.y, s.x, s.y) < s.r) return 0;
    }
  }
  const centre = 1 - Math.abs(angleDiff(guard.facing, ang)) / TUNE.coneHalfAngle;
  const closeness = 1 - d / range;
  return Math.min(1, 0.35 + 0.65 * (centre * 0.6 + closeness * 0.4));
}

function walkToward(guard, tx, ty, dt, speed, level) {
  const d = dist(guard.x, guard.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const dx = ((tx - guard.x) / d) * step;
  const dy = ((ty - guard.y) / d) * step;
  guard.facing = Math.atan2(dy, dx);
  moveCircle(guard, dx, dy, level.blockers);
  return d - step < 4;
}

// One guard, one step. `seen` is this guard's vision strength this frame;
// `alarm` is the shared meter, which steers the whole floor's mood.
export function updateGuard(guard, dt, level, player, seen, alarm, smokes) {
  guard.r = 13;
  if (seen > 0) {
    guard.lastSeen = { x: player.x, y: player.y };
  }
  if (alarm >= TUNE.alarmAlerted && guard.lastSeen) {
    guard.state = 'alerted';
  } else if (alarm >= TUNE.alarmSuspicious && guard.lastSeen) {
    if (guard.state === 'patrol') guard.state = 'suspicious';
  } else if (alarm < TUNE.alarmSuspicious * 0.6 && guard.state !== 'patrol' && !guard.investigate) {
    guard.state = 'patrol';
    guard.lastSeen = null;
  }

  // A thrown coin pulls any guard in earshot off its beat to look.
  if (guard.investigate) {
    const arrived = walkToward(guard, guard.investigate.x, guard.investigate.y, dt, guard.speed * 1.25, level);
    if (arrived) {
      guard.lookTimer += dt;
      guard.facing += dt * 1.6;
      if (guard.lookTimer > 2.5) {
        guard.investigate = null;
        guard.lookTimer = 0;
        guard.state = 'patrol';
      }
    }
    return;
  }

  if (guard.state === 'alerted' && guard.lastSeen) {
    const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt, TUNE.guardChaseSpeed, level);
    if (arrived) {
      // Lost the trail at the last seen spot: look around, then give up.
      guard.lookTimer += dt;
      guard.facing += dt * 2.2;
      if (guard.lookTimer > 2) {
        guard.lookTimer = 0;
        guard.state = 'suspicious';
        guard.lastSeen = null;
      }
    }
    return;
  }

  if (guard.state === 'suspicious' && guard.lastSeen) {
    const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt, guard.speed * 1.3, level);
    if (arrived) {
      guard.lookTimer += dt;
      guard.facing += dt * 1.8;
      if (guard.lookTimer > 3) {
        guard.lookTimer = 0;
        guard.state = 'patrol';
        guard.lastSeen = null;
      }
    }
    return;
  }

  // Patrol: walk the beat, pause and scan at each waypoint.
  if (guard.pause > 0) {
    guard.pause -= dt;
    guard.facing += dt * 0.9;
    return;
  }
  const target = guard.wp[guard.wpIndex];
  const arrived = walkToward(guard, target[0], target[1], dt, guard.speed, level);
  if (arrived) {
    guard.wpIndex = (guard.wpIndex + 1) % guard.wp.length;
    guard.pause = 1.1;
  }
}

// Step every guard and return the strongest vision signal this frame.
export function updateGuards(level, dt, player, alarm, smokes) {
  let strongest = 0;
  for (const guard of level.guards) {
    const seen = guardSees(guard, player, level, smokes);
    if (seen > strongest) strongest = seen;
    updateGuard(guard, dt, level, player, seen, alarm, smokes);
  }
  return strongest;
}
