// Boot and the one loop: input every frame, the world in fixed 1/60 s steps,
// the renderer painting what is there. Screens: title, playing, paused,
// busted, level done, game done. The alarm is the heart of the game: seen by
// a guard or a camera it climbs, hidden it falls, and at 100% the thief gets
// a short grace window to break line of sight before the bust lands.
//
// ?shot=cover|tools|alarm|escape stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY, LEVELS, TUNE, totalLootValue } from './config.js';
import { createLevel, inSmoke } from './world.js';
import { camerasSee, empBlast, updateCameras } from './cameras.js';
import { updateGuards } from './guards.js';
import { atExit, rateLevel, updateCoins, updateLoot, updateSmokes } from './loot.js';
import { createPlayer, dropSmoke, fireEmp, throwCoin, updatePlayer } from './player.js';
import { ACTION_COIN, ACTION_CONFIRM, ACTION_EMP, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import {
  SCREEN_BUSTED, SCREEN_GAME_DONE, SCREEN_LEVEL_DONE, SCREEN_PAUSED,
  SCREEN_PLAYING, SCREEN_TITLE, createRenderer,
} from './render.js';
import { stageShot } from './shots.js';
import {
  alarmHeartbeat, initAudio, sfxBusted, sfxClick, sfxCoin, sfxEmp,
  sfxGetaway, sfxPickup, sfxSafe, sfxSmoke,
} from './audio.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows may refuse storage; the best then lasts this visit only.
  }
}

// The whole session: three jobs, one running total, one alarm meter.
function createGame() {
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: null,
    player: null,
    coins: [],
    smokes: [],
    alarm: 0,
    alarmPeak: 0,
    grace: TUNE.graceSeconds,
    time: 0,
    lootValue: 0,
    levelStartValue: 0,
    totalLoot: totalLootValue(),
    ratings: [],
    lastStats: null,
    nextName: '',
    bustedBy: 'a guard',
    best: readBest(),
    frozen: false,
  };

  game.loadLevel = function loadLevel(index) {
    game.levelIndex = index;
    game.level = createLevel(LEVELS[index]);
    game.player = createPlayer(LEVELS[index].start.x, LEVELS[index].start.y, LEVELS[index].tools);
    game.coins = [];
    game.smokes = [];
    game.alarm = 0;
    game.alarmPeak = 0;
    game.grace = TUNE.graceSeconds;
    game.time = 0;
    game.levelStartValue = game.lootValue;
    game.screen = SCREEN_PLAYING;
  };

  return game;
}

const game = createGame();
game.loadLevel(0);
game.screen = SCREEN_TITLE;

function announce(message) {
  statusEl.textContent = message;
}

function bust(seer) {
  game.bustedBy = seer;
  game.screen = SCREEN_BUSTED;
  sfxBusted();
  announce('Busted by ' + seer + '. Press Space to retry ' + game.level.def.name + '.');
}

function finishLevel() {
  const level = game.level;
  const value = game.lootValue - game.levelStartValue;
  const stats = {
    value,
    total: level.loot.reduce((s, l) => s + l.value, 0),
    time: game.time,
    alarmPeak: game.alarmPeak,
    rating: '',
  };
  stats.rating = rateLevel(stats, level.def.par);
  game.lastStats = stats;
  game.ratings.push({ name: level.def.name, rating: stats.rating, value });
  game.nextName = game.levelIndex + 1 < LEVELS.length ? LEVELS[game.levelIndex + 1].name : '';
  game.screen = SCREEN_LEVEL_DONE;
  sfxGetaway();
  announce(level.def.name + ' done. ' + stats.rating + ' rating. Press Space to continue.');
}

function finishGame() {
  game.screen = SCREEN_GAME_DONE;
  if (game.lootValue > game.best) {
    game.best = game.lootValue;
    saveBest(game.best);
  }
  announce('The Meridian Job complete. Total take ' + game.lootValue + ' dollars.');
}

function startJob(index) {
  game.loadLevel(index);
  announce('Job ' + (index + 1) + ': ' + LEVELS[index].name + '. Grab the loot, reach the exit.');
}

function stepPlaying(dt, input) {
  const level = game.level;
  const player = game.player;
  const actions = input.takeActions();
  const click = input.takeClick();

  if (click) player.moveTarget = { x: click.x, y: click.y };
  if (actions & ACTION_PAUSE) {
    game.screen = SCREEN_PAUSED;
    announce('Paused.');
    return;
  }
  if (actions & ACTION_COIN) {
    const coin = throwCoin(player, game.coins, input.mouse);
    if (coin) sfxCoin();
  }
  if (actions & ACTION_EMP) {
    if (fireEmp(player)) {
      empBlast(level);
      sfxEmp();
    }
  }
  if (actions & ACTION_SMOKE) {
    const cloud = dropSmoke(player, game.smokes);
    if (cloud) sfxSmoke();
  }

  updatePlayer(player, dt, input.held, level);
  player.hidden = inSmoke(player.x, player.y, game.smokes);

  const guardSeen = updateGuards(level, dt, player, game.alarm, game.smokes);
  updateCameras(level, dt);
  const camSeen = camerasSee(level, player, game.smokes);

  // The alarm: climbs while seen, falls while hidden. At 100% the grace
  // window runs — break line of sight and it drops back; stay seen and
  // the bust lands.
  const seen = Math.max(guardSeen, camSeen);
  if (seen > 0) {
    const rise = guardSeen * TUNE.alarmRiseGuard + camSeen * TUNE.alarmRiseCamera;
    game.alarm = Math.min(100, game.alarm + rise * dt);
    if (game.alarm >= 100) {
      game.grace -= dt;
      if (game.grace <= 0) {
        bust(camSeen > guardSeen ? 'a camera lens' : 'a guard');
        return;
      }
    } else {
      game.grace = TUNE.graceSeconds;
    }
  } else {
    game.alarm = Math.max(0, game.alarm - (game.alarm >= 100 ? 30 : TUNE.alarmDecay) * dt);
    game.grace = TUNE.graceSeconds;
  }
  if (game.alarm > game.alarmPeak) game.alarmPeak = game.alarm;

  const taken = updateLoot(level, player, input.held.interact, dt);
  if (taken) {
    game.lootValue += taken.value;
    if (taken.safe) sfxSafe();
    else sfxPickup();
    announce('Pocketed ' + taken.name + ' for ' + taken.value + ' dollars.');
  }

  updateCoins(game.coins, level.guards, dt);
  updateSmokes(game.smokes, dt);
  game.time += dt;
  alarmHeartbeat(dt, game.alarm);

  if (atExit(level, player)) {
    const got = level.loot.some((l) => l.taken);
    if (got) finishLevel();
  }
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();

  function handleMenuActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    const confirm = (actions & ACTION_CONFIRM) !== 0 || click !== null;
    if (!confirm && !(actions & ACTION_PAUSE)) return;
    if (game.screen === SCREEN_TITLE) {
      initAudio();
      sfxClick();
      startJob(0);
    } else if (game.screen === SCREEN_BUSTED) {
      initAudio();
      game.lootValue = game.levelStartValue;
      startJob(game.levelIndex);
    } else if (game.screen === SCREEN_LEVEL_DONE) {
      initAudio();
      if (game.levelIndex + 1 < LEVELS.length) startJob(game.levelIndex + 1);
      else finishGame();
    } else if (game.screen === SCREEN_GAME_DONE) {
      initAudio();
      game.lootValue = 0;
      game.ratings = [];
      startJob(0);
    } else if (game.screen === SCREEN_PAUSED) {
      if (actions & ACTION_PAUSE) {
        game.screen = SCREEN_PLAYING;
        announce('Playing.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (game.screen === SCREEN_PLAYING) {
      while (accumulator >= STEP && game.screen === SCREEN_PLAYING) {
        stepPlaying(STEP, input);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      handleMenuActions();
    }
    renderer.draw(game);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.screen === SCREEN_PLAYING) {
      game.screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('The Meridian Job. Press Space or click to start.');
  requestAnimationFrame(frame);
}

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) runShot(shot);
else runGame();
