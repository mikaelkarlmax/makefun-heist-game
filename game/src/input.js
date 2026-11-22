// Input: keyboard held-keys plus edge-triggered presses, and the mouse for
// click-to-move. Space doubles as smoke in play and confirm on menus; the
// caller decides which by screen. Blur releases every key, so a held key
// never sticks when the tab loses focus.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_COIN = 4;
export const ACTION_EMP = 8;
export const ACTION_SMOKE = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false, sneak: false, interact: false };
  let actions = 0;
  const mouse = { x: 640, y: 400, clicked: false, clickX: 0, clickY: 0 };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (1280 / rect.width),
      y: (event.clientY - rect.top) * (800 / rect.height),
    };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = true;
    else if (event.code === 'KeyE') held.interact = true;
    else if (event.code === 'KeyQ') { if (!event.repeat) actions |= ACTION_COIN; }
    else if (event.code === 'KeyF') { if (!event.repeat) actions |= ACTION_EMP; }
    else if (event.code === 'Space') { if (!event.repeat) actions |= ACTION_SMOKE | ACTION_CONFIRM; }
    else if (event.code === 'Enter') { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (event.code === 'KeyP' || event.code === 'Escape') { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (event.code === 'KeyR') { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = false;
    else if (event.code === 'KeyE') held.interact = false;
  });
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = held.sneak = held.interact = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.clicked = true;
    mouse.clickX = p.x;
    mouse.clickY = p.y;
  });

  return {
    held,
    mouse,
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },
  };
}
