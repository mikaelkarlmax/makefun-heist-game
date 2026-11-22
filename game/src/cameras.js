// Security cameras: wall-mounted lenses that sweep a fixed arc. A camera that
// spots the thief feeds the alarm fast — but an EMP pulse (F) kills every lens
// on the floor for six seconds, and smoke hides the thief from them too.

import { TUNE } from './config.js';
import { angleDiff, dist, losClear } from './world.js';

// Can this camera see the thief right now? 0 when it cannot, up to 1.
export function cameraSees(camera, player, level, smokes) {
  if (camera.disabled > 0 || player.hidden) return 0;
  const d = dist(camera.x, camera.y, player.x, player.y);
  if (d > TUNE.cameraRange) return 0;
  const ang = Math.atan2(player.y - camera.y, player.x - camera.x);
  if (Math.abs(angleDiff(camera.angle, ang)) > TUNE.cameraHalfAngle) return 0;
  if (!losClear(camera.x, camera.y, player.x, player.y, level.blockers)) return 0;
  if (smokes) {
    for (let i = 0; i < smokes.length; i += 1) {
      const s = smokes[i];
      if (dist(player.x, player.y, s.x, s.y) < s.r) return 0;
    }
  }
  return Math.min(1, 0.5 + 0.5 * (1 - d / TUNE.cameraRange));
}

// Sweep each lens back and forth along its arc; count down EMP downtime.
export function updateCameras(level, dt) {
  for (const camera of level.cameras) {
    if (camera.disabled > 0) {
      camera.disabled = Math.max(0, camera.disabled - dt);
      continue;
    }
    camera.angle += camera.dir * camera.speed * dt;
    if (camera.angle > camera.a1) { camera.angle = camera.a1; camera.dir = -1; }
    if (camera.angle < camera.a0) { camera.angle = camera.a0; camera.dir = 1; }
  }
}

// Strongest camera vision signal this frame (0 when no lens sees the thief).
export function camerasSee(level, player, smokes) {
  let strongest = 0;
  for (const camera of level.cameras) {
    const seen = cameraSees(camera, player, level, smokes);
    if (seen > strongest) strongest = seen;
  }
  return strongest;
}

// EMP pulse: every camera on the floor goes dark for TUNE.empSeconds.
export function empBlast(level) {
  for (const camera of level.cameras) camera.disabled = TUNE.empSeconds;
}
