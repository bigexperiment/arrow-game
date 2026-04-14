import { useCallback, useEffect, useMemo, useRef, useState } from "react";

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  play(run) {
    this.init();
    this.resume();
    run(this.ctx);
  }

  tap() {
    this.play((ctx) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(760, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.08);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  fire(depth) {
    this.play((ctx) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 250 + depth * 75;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.16);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  clear(depth) {
    this.play((ctx) => {
      const t = ctx.currentTime;
      const f1 = 420 + depth * 45;
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      const gain = ctx.createGain();
      a.type = "sine";
      b.type = "sine";
      a.frequency.setValueAtTime(f1, t);
      b.frequency.setValueAtTime(f1 * 1.5, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      a.connect(gain).connect(ctx.destination);
      b.connect(gain);
      a.start(t);
      b.start(t);
      a.stop(t + 0.22);
      b.stop(t + 0.22);
    });
  }

  combo(chain) {
    this.play((ctx) => {
      const t = ctx.currentTime;
      [0, 0.05, 0.1].forEach((delay, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(520 + chain * 60 + index * 180, t + delay);
        gain.gain.setValueAtTime(0.11, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.14);
      });
    });
  }

  celebrate(chain = 1) {
    this.play((ctx) => {
      const t = ctx.currentTime;
      [0, 0.07, 0.14, 0.21].forEach((delay, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(680 + chain * 35 + index * 120, t + delay);
        gain.gain.setValueAtTime(0.09, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.18);
      });
    });
  }

  prompt() {
    this.play((ctx) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  win() {
    this.play((ctx) => {
      const t = ctx.currentTime;
      [523, 659, 784, 988].forEach((note, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = index * 0.09;
        osc.type = "sine";
        osc.frequency.setValueAtTime(note, t + delay);
        gain.gain.setValueAtTime(0.14, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.35);
      });
    });
  }

  lose() {
    this.play((ctx) => {
      const t = ctx.currentTime;
      [420, 340, 260, 190].forEach((note, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = index * 0.12;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(note, t + delay);
        osc.frequency.exponentialRampToValueAtTime(
          note * 0.7,
          t + delay + 0.18,
        );
        gain.gain.setValueAtTime(0.05, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.22);
      });
    });
  }
}

const sfx = new SoundEngine();

const STORAGE_KEY = "arrowx-endless-progress";
const DEFAULT_PROGRESS = {
  currentLevel: 1,
  bestLevel: 1,
  bestScore: 0,
  muted: false,
};

const DIRS = {
  up: { dx: 0, dy: -1, rot: 0, symbol: "↑" },
  right: { dx: 1, dy: 0, rot: 90, symbol: "→" },
  down: { dx: 0, dy: 1, rot: 180, symbol: "↓" },
  left: { dx: -1, dy: 0, rot: 270, symbol: "←" },
};

const DIRECTION_KEYS = Object.keys(DIRS);

const COLORS = {
  up: "#38bdf8",
  right: "#fb923c",
  down: "#f43f5e",
  left: "#c084fc",
};

const GLOWS = {
  up: "56,189,248",
  right: "251,146,60",
  down: "244,63,94",
  left: "192,132,252",
};

// Candy-style 3-stop gradients for each direction
const CANDY = {
  up:    { hi: "#bae6fd", mid: "#38bdf8", lo: "#0284c7", rim: "#075985" },
  right: { hi: "#fed7aa", mid: "#fb923c", lo: "#ea580c", rim: "#9a3412" },
  down:  { hi: "#fecdd3", mid: "#f43f5e", lo: "#be123c", rim: "#881337" },
  left:  { hi: "#ede9fe", mid: "#c084fc", lo: "#9333ea", rim: "#5b21b6" },
};

const SURFACE = {
  page: "linear-gradient(150deg, #f97316 0%, #ec4899 38%, #8b5cf6 68%, #2563eb 100%)",
  panel: "rgba(255,255,255,0.18)",
  panelSoft: "rgba(255,255,255,0.13)",
  chip: "rgba(255,255,255,0.28)",
  cardBorder: "rgba(255,255,255,0.38)",
  board: "rgba(255,255,255,0.20)",
  primaryButton: "linear-gradient(135deg, #f97316, #ec4899)",
  accentButton: "linear-gradient(135deg, #8b5cf6, #2563eb)",
  progress: "linear-gradient(90deg, #38bdf8, #c084fc 40%, #ec4899 72%, #fb923c)",
};

const LEVEL_NAMES = [
  "SPARK",
  "EMBER",
  "FLARE",
  "BLAZE",
  "COMET",
  "NOVA",
  "PULSAR",
  "QUASAR",
];

const DIFFICULTY_PRESETS = [
  {
    maxLevel: 2,
    cols: 5,
    rows: 5,
    chainCount: [2, 2],
    chainLength: [4, 5],
    frozenPerChain: [0, 0],
    decoys: [0, 1],
    gapRange: [1, 1],
    bonusTaps: 3,
    interference: false,
  },
  {
    maxLevel: 5,
    cols: 5,
    rows: 6,
    chainCount: [3, 3],
    chainLength: [3, 5],
    frozenPerChain: [0, 1],
    decoys: [2, 3],
    gapRange: [1, 2],
    bonusTaps: 2,
    interference: false,
  },
  {
    maxLevel: 9,
    cols: 6,
    rows: 7,
    chainCount: [4, 4],
    chainLength: [2, 4],
    frozenPerChain: [1, 2],
    decoys: [4, 5],
    gapRange: [1, 3],
    bonusTaps: 1,
    interference: false,
  },
  {
    maxLevel: Infinity,
    cols: 6,
    rows: 7,
    chainCount: [4, 5],
    chainLength: [2, 4],
    frozenPerChain: [1, 2],
    decoys: [4, 6],
    gapRange: [1, 3],
    bonusTaps: 1,
    interference: false,
  },
];

const COMBO_MESSAGES = [
  "Wow, you're on a roll.",
  "That chain was clean.",
  "Nice bounce.",
  "You found the rhythm.",
  "That was smooth.",
  "Chain magic.",
  "Beautiful setup.",
  "That snapped together.",
  "You saw that line.",
  "Sharp play.",
];

const WIN_MESSAGES = [
  "Level cleared. Keep flowing.",
  "That was tidy.",
  "Nice work. Next one.",
  "Smooth finish.",
  "You made that look easy.",
  "Clean clear.",
  "Locked in.",
  "That board never stood a chance.",
  "Great pacing.",
  "Another level down.",
];

const LOSE_MESSAGES = [
  "Close one. Try a different opener.",
  "Almost there. One better chain does it.",
  "Not bad. You learned the board.",
  "That one was sneaky.",
  "You were close.",
  "Try the longer lane first.",
  "Different first tap, better outcome.",
  "You’ve got this one.",
  "That board is teachable.",
  "Go again. You’re close.",
];

function pickMessage(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function keyOf(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y, cols, rows) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function rangeCells(a, b) {
  const cells = [];
  if (a.x === b.x) {
    const step = a.y < b.y ? 1 : -1;
    for (let y = a.y + step; y !== b.y; y += step) cells.push({ x: a.x, y });
  } else if (a.y === b.y) {
    const step = a.x < b.x ? 1 : -1;
    for (let x = a.x + step; x !== b.x; x += step) cells.push({ x, y: a.y });
  }
  return cells;
}

function occupiedKeySet(chains) {
  return new Set(
    chains.flatMap((chain) => chain.cells.map((cell) => keyOf(cell.x, cell.y))),
  );
}

function getDifficultyPreset(levelNumber) {
  return DIFFICULTY_PRESETS.find((preset) => levelNumber <= preset.maxLevel);
}

function getLevelConfig(levelNumber) {
  const preset = getDifficultyPreset(levelNumber);
  const chainCount = randInt(preset.chainCount[0], preset.chainCount[1]);
  return {
    levelNumber,
    title: LEVEL_NAMES[(levelNumber - 1) % LEVEL_NAMES.length],
    cols: preset.cols,
    rows: preset.rows,
    chainCount,
    chainLengthRange: preset.chainLength,
    frozenPerChain: preset.frozenPerChain,
    decoyCount: randInt(preset.decoys[0], preset.decoys[1]),
    gapRange: preset.gapRange,
    bonusTaps: preset.bonusTaps,
    taps: chainCount + preset.bonusTaps,
    interference: preset.interference,
    optimalTaps: chainCount,
  };
}

function buildBlueprint(config) {
  return Array.from({ length: config.chainCount }, (_, chainId) => {
    const length = randInt(
      config.chainLengthRange[0],
      config.chainLengthRange[1],
    );
    const frozenCount = Math.min(
      length - 1,
      randInt(config.frozenPerChain[0], config.frozenPerChain[1]),
    );
    return {
      chainId,
      length,
      frozenCount,
    };
  });
}

function anyExistingArrowSeesCell(chains, target, ignoredKey = null) {
  for (const chain of chains) {
    for (const cell of chain.cells) {
      if (!cell.dir) continue;
      if (ignoredKey && keyOf(cell.x, cell.y) === ignoredKey) continue;
      const dir = DIRS[cell.dir];
      let x = cell.x + dir.dx;
      let y = cell.y + dir.dy;
      while (inBounds(x, y, chain.cols, chain.rows)) {
        const currentKey = keyOf(x, y);
        if (x === target.x && y === target.y) return true;
        if (
          chains.some((currentChain) =>
            currentChain.cells.some(
              (occupied) => keyOf(occupied.x, occupied.y) === currentKey,
            ),
          )
        ) {
          break;
        }
        x += dir.dx;
        y += dir.dy;
      }
    }
  }
  return false;
}

function chooseSafeTailDirection(cell, chains, cols, rows) {
  const dirs = shuffle(DIRECTION_KEYS);
  for (const dirKey of dirs) {
    const dir = DIRS[dirKey];
    let x = cell.x + dir.dx;
    let y = cell.y + dir.dy;
    let safe = true;
    while (inBounds(x, y, cols, rows)) {
      const blocked = chains.some((chain) =>
        chain.cells.some((occupied) => occupied.x === x && occupied.y === y),
      );
      if (blocked) {
        safe = false;
        break;
      }
      x += dir.dx;
      y += dir.dy;
    }
    if (safe) return dirKey;
  }
  return dirs[0];
}

function buildChainFromStart(start, blueprint, config, chains) {
  const occupied = occupiedKeySet(chains);
  const path = [{ ...start, dir: null }];

  function extend(index) {
    if (index === blueprint.length - 1) {
      path[index].dir = chooseSafeTailDirection(
        path[index],
        chains,
        config.cols,
        config.rows,
      );
      return true;
    }

    const current = path[index];
    const candidates = [];

    for (const dirKey of shuffle(DIRECTION_KEYS)) {
      const dir = DIRS[dirKey];
      for (let gap = config.gapRange[0]; gap <= config.gapRange[1]; gap += 1) {
        const step = gap + 1;
        const next = {
          x: current.x + dir.dx * step,
          y: current.y + dir.dy * step,
        };
        if (!inBounds(next.x, next.y, config.cols, config.rows)) continue;
        if (occupied.has(keyOf(next.x, next.y))) continue;
        if (path.some((cell) => cell.x === next.x && cell.y === next.y))
          continue;

        const between = rangeCells(current, next);
        const pathBlocked = between.some(({ x, y }) => {
          const key = keyOf(x, y);
          return (
            occupied.has(key) ||
            path.some((cell) => keyOf(cell.x, cell.y) === key)
          );
        });
        if (pathBlocked) continue;

        if (!config.interference && anyExistingArrowSeesCell(chains, next))
          continue;

        candidates.push({ next, dirKey });
      }
    }

    for (const candidate of shuffle(candidates)) {
      path[index].dir = candidate.dirKey;
      path.push({ ...candidate.next, dir: null });
      if (extend(index + 1)) return true;
      path.pop();
      path[index].dir = null;
    }

    return false;
  }

  return extend(0) ? path : null;
}

function placeChains(config, blueprint) {
  const chains = [];
  const allCells = [];
  for (let y = 0; y < config.rows; y += 1) {
    for (let x = 0; x < config.cols; x += 1) allCells.push({ x, y });
  }

  for (const chainPlan of blueprint) {
    let placed = null;
    for (const start of shuffle(allCells)) {
      const occupied = occupiedKeySet(chains);
      if (occupied.has(keyOf(start.x, start.y))) continue;
      if (!config.interference && anyExistingArrowSeesCell(chains, start))
        continue;

      const candidate = buildChainFromStart(
        start,
        chainPlan,
        config,
        chains.map((chain) => ({
          ...chain,
          cols: config.cols,
          rows: config.rows,
        })),
      );

      if (candidate) {
        placed = {
          chainId: chainPlan.chainId,
          cells: candidate.map((cell, index) => ({
            ...cell,
            chainId: chainPlan.chainId,
            chainIndex: index,
            frozen: false,
            decoy: false,
            state: "idle",
          })),
          frozenCount: chainPlan.frozenCount,
          cols: config.cols,
          rows: config.rows,
        };
        chains.push(placed);
        break;
      }
    }

    if (!placed) return null;
  }

  return chains;
}

function firstArrowHit(board, cell, config) {
  const dir = DIRS[cell.dir];
  let x = cell.x + dir.dx;
  let y = cell.y + dir.dy;
  while (inBounds(x, y, config.cols, config.rows)) {
    const hit = board[keyOf(x, y)];
    if (hit) return hit;
    x += dir.dx;
    y += dir.dy;
  }
  return null;
}

function hasCrossChainInterference(chains, config) {
  const board = {};
  chains.forEach((chain) => {
    chain.cells.forEach((cell) => {
      board[keyOf(cell.x, cell.y)] = cell;
    });
  });

  return chains.some((chain) =>
    chain.cells.some((cell) => {
      const hit = firstArrowHit(board, cell, config);
      return hit && hit.chainId !== cell.chainId;
    }),
  );
}

function insertDecoys(chains, config) {
  for (let count = 0; count < config.decoyCount; count += 1) {
    const linkPool = [];
    chains.forEach((chain) => {
      for (let index = 0; index < chain.cells.length - 1; index += 1) {
        const from = chain.cells[index];
        const to = chain.cells[index + 1];
        const between = rangeCells(from, to).filter(
          (cell) =>
            !chains.some((currentChain) =>
              currentChain.cells.some(
                (occupied) => occupied.x === cell.x && occupied.y === cell.y,
              ),
            ),
        );
        if (between.length > 0) linkPool.push({ chain, index, between });
      }
    });

    if (linkPool.length === 0) return;
    const link = pickRandom(linkPool);
    const insertCell = pickRandom(link.between);

    const from = link.chain.cells[link.index];
    const to = link.chain.cells[link.index + 1];
    const dirToInsert =
      insertCell.x > from.x
        ? "right"
        : insertCell.x < from.x
          ? "left"
          : insertCell.y > from.y
            ? "down"
            : "up";
    const dirToNext =
      to.x > insertCell.x
        ? "right"
        : to.x < insertCell.x
          ? "left"
          : to.y > insertCell.y
            ? "down"
            : "up";

    const originalDir = from.dir;
    from.dir = dirToInsert;
    const inserted = {
      x: insertCell.x,
      y: insertCell.y,
      dir: dirToNext,
      chainId: link.chain.chainId,
      chainIndex: link.index + 1,
      frozen: false,
      decoy: true,
      state: "idle",
    };
    link.chain.cells.splice(link.index + 1, 0, inserted);

    link.chain.cells.forEach((cell, index) => {
      cell.chainIndex = index;
    });

    if (!config.interference && hasCrossChainInterference(chains, config)) {
      link.chain.cells.splice(link.index + 1, 1);
      from.dir = originalDir;
      link.chain.cells.forEach((cell, index) => {
        cell.chainIndex = index;
      });
    }
  }
}

function assignFrozenArrows(chains) {
  let frozenRemaining = 2;
  chains.forEach((chain) => {
    if (frozenRemaining <= 0) return;
    const candidates = shuffle(chain.cells.slice(1));
    const freezeCount = Math.min(chain.frozenCount, candidates.length, frozenRemaining);
    for (let index = 0; index < freezeCount; index += 1) {
      candidates[index].frozen = true;
    }
    frozenRemaining -= freezeCount;
  });
}

function buildBoard(config) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const blueprint = buildBlueprint(config);
    const chains = placeChains(config, blueprint);
    if (!chains) continue;
    insertDecoys(chains, config);
    if (!config.interference && hasCrossChainInterference(chains, config))
      continue;
    assignFrozenArrows(chains);

    const board = {};
    chains.forEach((chain) => {
      chain.cells.forEach((cell) => {
        board[keyOf(cell.x, cell.y)] = cell;
      });
    });

    if (isSolvable(board, config)) return board;
  }

  return null;
}

function genBoard(config) {
  const board = buildBoard(config);
  if (board) return board;

  return {
    "0,0": { x: 0, y: 0, dir: "right", frozen: false, state: "idle" },
    "2,0": { x: 2, y: 0, dir: "down", frozen: false, state: "idle" },
    "2,2": { x: 2, y: 2, dir: "left", frozen: false, state: "idle" },
  };
}

function traceChain(board, startCell, cols, rows) {
  const currentBoard = { ...board };
  const queue = [{ x: startCell.x, y: startCell.y, depth: 0 }];
  const seen = new Set();
  const sequence = [];

  while (queue.length) {
    const { x, y, depth } = queue.shift();
    const key = keyOf(x, y);
    if (
      seen.has(key) ||
      !currentBoard[key] ||
      currentBoard[key].state === "cleared"
    )
      continue;

    seen.add(key);
    const currentCell = currentBoard[key];
    const direction = DIRS[currentCell.dir];
    sequence.push({
      key,
      depth,
      x,
      y,
      dir: currentCell.dir,
      frozen: currentCell.frozen,
    });

    let nextX = x + direction.dx;
    let nextY = y + direction.dy;
    while (inBounds(nextX, nextY, cols, rows)) {
      const nextKey = keyOf(nextX, nextY);
      if (
        currentBoard[nextKey] &&
        currentBoard[nextKey].state !== "cleared" &&
        !seen.has(nextKey)
      ) {
        queue.push({ x: nextX, y: nextY, depth: depth + 1 });
        break;
      }
      nextX += direction.dx;
      nextY += direction.dy;
    }
  }

  return sequence;
}

function applyTapToBoard(board, cell, config) {
  if (cell.frozen) return board;
  const sequence = traceChain(board, cell, config.cols, config.rows);
  const nextBoard = { ...board };
  sequence.forEach((step) => {
    delete nextBoard[step.key];
  });
  return nextBoard;
}

function boardStateKey(board, tapsLeft) {
  const cells = Object.values(board)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((cell) => `${cell.x},${cell.y},${cell.dir},${cell.frozen ? 1 : 0}`)
    .join("|");
  return `${tapsLeft}::${cells}`;
}

function isSolvable(board, config) {
  const seen = new Set();

  function visit(currentBoard, tapsLeft) {
    if (Object.keys(currentBoard).length === 0) return true;
    if (tapsLeft <= 0) return false;

    const stateKey = boardStateKey(currentBoard, tapsLeft);
    if (seen.has(stateKey)) return false;
    seen.add(stateKey);

    const tappable = Object.values(currentBoard).filter((cell) => !cell.frozen);
    for (const cell of tappable) {
      const nextBoard = applyTapToBoard(currentBoard, cell, config);
      if (Object.keys(nextBoard).length === Object.keys(currentBoard).length)
        continue;
      if (visit(nextBoard, tapsLeft - 1)) return true;
    }

    return false;
  }

  return visit(board, config.taps);
}

function findOptimalSolution(board, config, maxTaps = config.optimalTaps) {
  const memo = new Map();

  function visit(currentBoard, tapsLeft) {
    if (Object.keys(currentBoard).length === 0) return [];
    if (tapsLeft <= 0) return null;

    const stateKey = boardStateKey(currentBoard, tapsLeft);
    if (memo.has(stateKey)) return memo.get(stateKey);

    let bestPath = null;
    const tappable = Object.values(currentBoard)
      .filter((cell) => !cell.frozen)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    for (const cell of tappable) {
      const nextBoard = applyTapToBoard(currentBoard, cell, config);
      if (Object.keys(nextBoard).length === Object.keys(currentBoard).length) continue;

      const remainder = visit(nextBoard, tapsLeft - 1);
      if (!remainder) continue;

      const candidate = [keyOf(cell.x, cell.y), ...remainder];
      if (!bestPath || candidate.length < bestPath.length) {
        bestPath = candidate;
      }
    }

    memo.set(stateKey, bestPath);
    return bestPath;
  }

  return visit(board, maxTaps);
}

function getDifficultyScore(board, config) {
  const cells = Object.values(board);
  const arrowCount = cells.length;
  const frozenCount = cells.filter((cell) => cell.frozen).length;
  const decoyCount = cells.filter((cell) => cell.decoy).length;
  const density = arrowCount / Math.max(1, config.cols * config.rows);
  const slack = Math.max(0, config.taps - config.optimalTaps);

  const score =
    config.optimalTaps * 14 +
    decoyCount * 3 +
    frozenCount * 6 +
    Math.round(density * 18) +
    Math.max(0, config.gapRange[1] - 1) * 4 -
    slack * 5;

  return Math.max(1, score);
}

function loadProgress() {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      currentLevel: Math.max(1, Number(parsed.currentLevel) || 1),
      bestLevel: Math.max(1, Number(parsed.bestLevel) || 1),
      bestScore: Math.max(0, Number(parsed.bestScore) || 0),
      muted: Boolean(parsed.muted),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function Burst({ x, y, color }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2 + Math.random() * 0.35;
        const distance = 14 + Math.random() * 28;
        return {
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          size: 2 + Math.random() * 4,
          delay: Math.random() * 0.05,
        };
      }),
    [],
  );

  return (
    <>
      {particles.map((particle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: x - particle.size / 2,
            top: y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            borderRadius: 999,
            background: color,
            opacity: 0,
            pointerEvents: "none",
            animation: `burstParticle .48s ${particle.delay}s ease-out forwards`,
            "--tx": `${particle.tx}px`,
            "--ty": `${particle.ty}px`,
          }}
        />
      ))}
    </>
  );
}

function Arrow({ cell, size, onTap, disabled }) {
  const direction = DIRS[cell.dir];
  const color = COLORS[cell.dir];
  const glow = GLOWS[cell.dir];
  const candy = CANDY[cell.dir];
  const cleared = cell.state === "cleared";
  const firing = cell.state === "firing";
  const frozen = Boolean(cell.frozen);

  return (
    <button
      onClick={() => !disabled && !cleared && !frozen && onTap(cell)}
      disabled={disabled || cleared || frozen}
      style={{
        position: "absolute",
        left: cell.x * size,
        top: cell.y * size,
        width: size,
        height: size,
        border: "none",
        background: "transparent",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: cleared || frozen ? "default" : "pointer",
        opacity: cleared ? 0 : 1,
        transform: cleared ? "scale(0.1)" : firing ? "scale(1.12)" : "scale(1)",
        transition: cleared
          ? "transform .42s cubic-bezier(.2,.9,.2,1), opacity .35s ease"
          : "transform .12s ease",
        zIndex: firing ? 5 : 2,
      }}
    >
      <div
        style={{
          width: size * 0.84,
          height: size * 0.84,
          borderRadius: size * 0.24,
          border: firing
            ? `3px solid ${candy.rim}`
            : frozen
              ? "3px solid #1d4ed8"
              : `3px solid ${candy.rim}`,
          background: firing
            ? `linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 38%), linear-gradient(145deg, ${candy.hi}, ${candy.mid}, ${candy.lo})`
            : frozen
              ? "linear-gradient(160deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 40%), linear-gradient(145deg, #bfdbfe, #93c5fd, #3b82f6)"
              : `linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 38%), linear-gradient(145deg, ${candy.hi}, ${candy.mid}, ${candy.lo})`,
          boxShadow: firing
            ? `0 0 ${size * 0.55}px rgba(${glow},0.75), 0 3px 12px rgba(${glow},0.50), inset 0 1px 0 rgba(255,255,255,0.60)`
            : frozen
              ? "0 4px 12px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.55)"
              : `0 4px 14px rgba(${glow},0.40), inset 0 1px 0 rgba(255,255,255,0.58)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg
          width={size * 0.44}
          height={size * 0.44}
          viewBox="0 0 24 24"
          style={{
            transform: `rotate(${direction.rot}deg)`,
            filter: firing ? `drop-shadow(0 0 7px ${color})` : "none",
          }}
        >
          <path
            d="M12 3L12 21M12 3L5 10M12 3L19 10"
            stroke={frozen ? "#bfdbfe" : "#ffffff"}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        {frozen && (
          <div
            style={{
              position: "absolute",
              right: size * 0.12,
              top: size * 0.1,
              fontSize: size * 0.14,
              color: "rgba(239,246,255,0.85)",
            }}
          >
            ❄
          </div>
        )}
      </div>
    </button>
  );
}

export default function ArrowsGame() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [progress, setProgress] = useState(initialProgress);
  const [level, setLevel] = useState(initialProgress.currentLevel);
  const [levelConfig, setLevelConfig] = useState(() =>
    getLevelConfig(initialProgress.currentLevel),
  );
  const [board, setBoard] = useState({});
  const [taps, setTaps] = useState(0);
  const [total, setTotal] = useState(0);
  const [gameState, setGameState] = useState("menu");
  const [busy, setBusy] = useState(false);
  const [particles, setParticles] = useState([]);
  const [trails, setTrails] = useState([]);
  const [combo, setCombo] = useState(null);
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState(null);
  const [autoSolveKeys, setAutoSolveKeys] = useState([]);
  const [autoSolveTotal, setAutoSolveTotal] = useState(0);
  const [autoDebugEnabled, setAutoDebugEnabled] = useState(false);
  const [muted, setMuted] = useState(initialProgress.muted);
  const [viewport, setViewport] = useState({
    width: typeof window === "undefined" ? 390 : window.innerWidth,
    height: typeof window === "undefined" ? 844 : window.innerHeight,
  });
  const boardRef = useRef(null);
  const particleId = useRef(0);
  const trailId = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...progress,
        muted,
      }),
    );
  }, [progress, muted]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), toast.duration ?? 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const startLevel = useCallback(
    (targetLevel, options = {}) => {
      const config = getLevelConfig(targetLevel);
      const nextBoard = genBoard(config);
      const solution =
        findOptimalSolution(nextBoard, { ...config, optimalTaps: config.taps }, config.taps) || [];
      const resolvedConfig = {
        ...config,
        optimalTaps: solution.length > 0 ? solution.length : config.optimalTaps,
      };
      setLevel(targetLevel);
      setLevelConfig(resolvedConfig);
      setBoard(nextBoard);
      setTaps(resolvedConfig.taps);
      setTotal(Object.keys(nextBoard).length);
      setBusy(false);
      setParticles([]);
      setTrails([]);
      setCombo(null);
      setAutoSolveKeys([]);
      setAutoSolveTotal(0);
      if (autoDebugEnabled) {
        setAutoSolveTotal(solution.length);
        setAutoSolveKeys(solution);
      }
      setToast({
        text: `Level ${targetLevel} · Solve in ${resolvedConfig.optimalTaps} taps`,
        tone: "guide",
        duration: 1800,
      });
      setGameState("playing");
      setScore(options.keepScore ? (options.score ?? score) : 0);
      setProgress((current) => ({
        ...current,
        currentLevel: targetLevel,
        bestLevel: Math.max(current.bestLevel, targetLevel),
        bestScore: Math.max(
          current.bestScore,
          options.keepScore ? (options.score ?? score) : 0,
        ),
      }));
      if (!muted) sfx.prompt();
    },
    [autoDebugEnabled, muted, score],
  );

  const addBurst = useCallback((x, y, color) => {
    const id = particleId.current++;
    setParticles((current) => [...current, { id, x, y, color }]);
    window.setTimeout(() => {
      setParticles((current) =>
        current.filter((particle) => particle.id !== id),
      );
    }, 540);
  }, []);

  const addTrail = useCallback((x1, y1, x2, y2, color, delay) => {
    const id = trailId.current++;
    setTrails((current) => [...current, { id, x1, y1, x2, y2, color, delay }]);
    window.setTimeout(
      () => {
        setTrails((current) => current.filter((trail) => trail.id !== id));
      },
      (delay + 0.55) * 1000,
    );
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    setLevel(1);
    setScore(0);
    setGameState("menu");
    setBoard({});
    setTaps(0);
    setTotal(0);
    setParticles([]);
    setTrails([]);
    setCombo(null);
    setAutoSolveKeys([]);
    setAutoSolveTotal(0);
  }, []);

  const handleTap = useCallback(
    (cell) => {
      if (busy || gameState !== "playing" || taps <= 0 || cell.frozen) return;

      setBusy(true);
      setTaps((value) => value - 1);
      if (!muted) sfx.tap();
      const sequence = traceChain(
        board,
        cell,
        levelConfig.cols,
        levelConfig.rows,
      );

      const cellSize = boardRef.current
        ? boardRef.current.getBoundingClientRect().width / levelConfig.cols
        : 48;
      const half = cellSize / 2;
      const gainedScore = sequence.reduce(
        (totalValue, entry) => totalValue + 16 + entry.depth * 11,
        0,
      );
      const finalScore = score + gainedScore;
      const maxDepth = sequence.length
        ? Math.max(...sequence.map((entry) => entry.depth))
        : 0;
      const scoreDelay = sequence.length ? maxDepth * 120 + 170 : 0;

      sequence.forEach(({ key, depth, x, y, dir }) => {
        const delay = depth * 120;

        window.setTimeout(() => {
          setBoard((current) => {
            const next = { ...current };
            if (next[key]) next[key] = { ...next[key], state: "firing" };
            return next;
          });
          if (!muted) sfx.fire(depth);
        }, delay);

        window.setTimeout(() => {
          setBoard((current) => {
            const next = { ...current };
            if (next[key]) next[key] = { ...next[key], state: "cleared" };
            return next;
          });
          if (!muted) sfx.clear(depth);
          addBurst(x * cellSize + half, y * cellSize + half, COLORS[dir]);
        }, delay + 170);
      });

      if (gainedScore > 0) {
        window.setTimeout(() => {
          setScore((value) => value + gainedScore);
        }, scoreDelay);
      }

      sequence.forEach(({ x, y, dir, depth }, index) => {
        const nextLink = sequence.find(
          (entry, entryIndex) =>
            entry.depth === depth + 1 && entryIndex > index,
        );
        if (!nextLink) return;
        addTrail(
          x * cellSize + half,
          y * cellSize + half,
          nextLink.x * cellSize + half,
          nextLink.y * cellSize + half,
          COLORS[dir],
          depth * 0.12,
        );
      });

      if (maxDepth >= 2) {
        window.setTimeout(
          () => {
            if (!muted) sfx.combo(maxDepth);
            if (!muted) sfx.celebrate(maxDepth);
            setCombo({
              value: sequence.length,
              key: Date.now(),
              text: pickMessage(
                COMBO_MESSAGES,
                level + sequence.length + maxDepth,
              ),
            });
            setToast({
              text: pickMessage(COMBO_MESSAGES, sequence.length * 7 + level),
              tone: "combo",
              duration: 1500,
            });
            window.setTimeout(() => setCombo(null), 850);
          },
          maxDepth * 120 + 60,
        );
      }

      const remainingTaps = taps - 1;
      const totalDelay = sequence.length ? maxDepth * 120 + 520 : 220;

      window.setTimeout(() => {
        setBusy(false);
        setBoard((current) => {
          const remaining = Object.values(current).filter(
            (entry) => entry.state !== "cleared",
          ).length;

          if (remaining === 0) {
            window.setTimeout(() => {
              setGameState("win");
              setToast({
                text: pickMessage(WIN_MESSAGES, level * 5 + remainingTaps),
                tone: "win",
                duration: 2200,
              });
              setProgress((saved) => ({
                ...saved,
                currentLevel: level + 1,
                bestLevel: Math.max(saved.bestLevel, level + 1),
                bestScore: Math.max(saved.bestScore, finalScore),
              }));
              if (!muted) sfx.win();
            }, 160);
          } else if (remainingTaps <= 0) {
            window.setTimeout(() => {
              setGameState("lose");
              setToast({
                text: pickMessage(LOSE_MESSAGES, level * 3 + remaining),
                tone: "lose",
                duration: 2200,
              });
              setProgress((saved) => ({
                ...saved,
                bestScore: Math.max(saved.bestScore, finalScore),
              }));
              if (!muted) sfx.lose();
            }, 160);
          }

          return current;
        });
      }, totalDelay);
    },
    [
      addBurst,
      addTrail,
      board,
      busy,
      gameState,
      level,
      levelConfig,
      muted,
      score,
      taps,
    ],
  );

  useEffect(() => {
    if (autoSolveKeys.length === 0) return undefined;
    if (busy || gameState !== "playing") return undefined;

    const nextKey = autoSolveKeys[0];
    const nextCell = board[nextKey];
    const timer = window.setTimeout(() => {
      const stepNumber = autoSolveTotal - autoSolveKeys.length + 1;
      setToast({
        text: `Debug tap ${stepNumber}/${autoSolveTotal}`,
        tone: "guide",
        duration: 900,
      });
      setAutoSolveKeys((current) => current.slice(1));
      if (nextCell && !nextCell.frozen) handleTap(nextCell);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [autoSolveKeys, autoSolveTotal, board, busy, gameState, handleTap]);

  useEffect(() => {
    if (!autoDebugEnabled || gameState !== "win") return undefined;

    const timer = window.setTimeout(() => {
      startLevel(level + 1, {
        keepScore: true,
        score,
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [autoDebugEnabled, gameState, level, score, startLevel]);

  useEffect(() => {
    if (!autoDebugEnabled || gameState !== "lose") return;
    setAutoDebugEnabled(false);
    setAutoSolveKeys([]);
    setAutoSolveTotal(0);
    setToast({
      text: "Auto debug stopped on a failed board.",
      tone: "lose",
      duration: 1800,
    });
  }, [autoDebugEnabled, gameState]);

  const remaining = useMemo(
    () =>
      Object.values(board).filter((cell) => cell.state !== "cleared").length,
    [board],
  );
  const debugDifficultyScore = useMemo(
    () => getDifficultyScore(board, levelConfig),
    [board, levelConfig],
  );
  const triggerAutoSolve = useCallback(() => {
    if (autoDebugEnabled) {
      setAutoDebugEnabled(false);
      setAutoSolveKeys([]);
      setAutoSolveTotal(0);
      setToast({
        text: "Auto debug stopped.",
        tone: "guide",
        duration: 1200,
      });
      return;
    }

    const solution = findOptimalSolution(board, levelConfig, taps);
    if (!solution) {
      setToast({
        text: "No optimal path found for this board state.",
        tone: "lose",
        duration: 1800,
      });
      return;
    }

    setToast({
      text: `Auto debug: solving in ${solution.length} taps · score ${debugDifficultyScore}`,
      tone: "guide",
      duration: 1600,
    });
    setAutoDebugEnabled(true);
    setAutoSolveTotal(solution.length);
    setAutoSolveKeys(solution);
  }, [autoDebugEnabled, board, debugDifficultyScore, levelConfig, taps]);
  const cellSize = useMemo(() => {
    if (gameState === "menu") return 48;
    const widthBudget = Math.min(viewport.width - 40, 640);
    const heightBudget = Math.min(viewport.height * 0.72, 720);
    return Math.max(
      34,
      Math.floor(
        Math.min(
          widthBudget / levelConfig.cols,
          heightBudget / levelConfig.rows,
        ),
      ),
    );
  }, [
    gameState,
    levelConfig.cols,
    levelConfig.rows,
    viewport.height,
    viewport.width,
  ]);

  const boardWidth = levelConfig.cols * cellSize;
  const boardHeight = levelConfig.rows * cellSize;
  const canResume = progress.currentLevel > 1;
  const nextLevelPreview = getLevelConfig(progress.currentLevel);

  return (
    <div
      style={{
        height: "100vh",
        color: "#1e0a3c",
        fontFamily: "'Rajdhani', system-ui, sans-serif",
        background: SURFACE.page,
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html,body,#root{margin:0;height:100%;overflow:hidden}
        body{background:linear-gradient(150deg,#f97316 0%,#ec4899 38%,#8b5cf6 68%,#2563eb 100%)}
        button{font:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 rgba(251,146,60,0)}50%{box-shadow:0 0 40px rgba(236,72,153,0.55)}}
        @keyframes burstParticle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.2)}}
        @keyframes trailFlash{0%{opacity:0}20%{opacity:.68}100%{opacity:0}}
        @keyframes comboPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.8)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
        @keyframes comboRing{0%{opacity:.85;transform:translate(-50%,-50%) scale(.45)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}
        @keyframes toastRise{0%{opacity:0;transform:translate(-50%,8px) scale(.96)}12%{opacity:1}100%{opacity:0;transform:translate(-50%,-16px) scale(1)}}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .pressable:active{transform:scale(.97)}
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.32,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,.8), rgba(0,0,0,.2))",
        }}
      />

      {toast && gameState !== "menu" && (
        <div
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 16px",
            borderRadius: 999,
            background:
              toast.tone === "win"
                ? "linear-gradient(135deg, rgba(94,234,212,0.95), rgba(56,189,248,0.92))"
                : toast.tone === "lose"
                  ? "linear-gradient(135deg, rgba(251,113,133,0.95), rgba(245,158,11,0.92))"
                  : toast.tone === "combo"
                    ? "linear-gradient(135deg, rgba(250,204,21,0.96), rgba(251,113,133,0.92))"
                    : "linear-gradient(135deg, rgba(147,197,253,0.95), rgba(129,140,248,0.92))",
            color: toast.tone === "guide" ? "#f8fafc" : "#082032",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.01em",
            zIndex: 30,
            pointerEvents: "none",
            boxShadow: "0 14px 32px rgba(0,0,0,0.24)",
            animation: "toastRise 1.8s ease forwards",
            maxWidth: "min(86vw, 380px)",
            textAlign: "center",
          }}
        >
          {toast.text}
        </div>
      )}

      {gameState === "menu" && (
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              display: "grid",
              gap: 12,
              animation: "fadeUp .5s ease",
              maxHeight: "100%",
            }}
          >
            <div
              style={{
                padding: "22px 18px 18px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.20)",
                backdropFilter: "blur(24px)",
                border: `2px solid ${SURFACE.cardBorder}`,
                boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: -14,
                  width: 124,
                  height: 124,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle, rgba(56,189,248,0.45), transparent 62%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -28,
                  bottom: -42,
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle, rgba(251,146,60,0.40), transparent 66%)",
                }}
              />
              <div
                style={{
                  display: "inline-flex",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: SURFACE.chip,
                  color: "rgba(255,255,255,0.82)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Endless chain puzzle
              </div>

              <div
                style={{
                  marginTop: 18,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: viewport.width < 420 ? 38 : 46,
                  lineHeight: 0.95,
                  letterSpacing: "-0.06em",
                }}
              >
                Arrow
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #4ade80, #22c55e 55%, #f87171)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 28px rgba(74,222,128,0.2)",
                  }}
                >
                  X
                </span>
              </div>


              <div
                style={{
                  marginTop: 22,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: "12px 10px",
                    borderRadius: 18,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    border: `1px solid ${SURFACE.cardBorder}`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 22,
                      color: "#f8fafc",
                    }}
                  >
                    {progress.currentLevel}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.58)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Saved level
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Optimal solve: {nextLevelPreview.optimalTaps} taps
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gap: 10,
                }}
              >
                <button
                  className="pressable"
                  onClick={() => {
                    sfx.init();
                    startLevel(progress.currentLevel);
                  }}
                  style={{
                    minHeight: 68,
                    borderRadius: 20,
                    border: "none",
                    background: SURFACE.primaryButton,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 20,
                    letterSpacing: "0.02em",
                    boxShadow: "0 8px 32px rgba(249,115,22,0.45), 0 2px 0 rgba(255,255,255,0.25) inset",
                    animation: "pulseGlow 2.6s ease-in-out infinite",
                  }}
                >
                  {canResume
                    ? `Continue from level ${progress.currentLevel}`
                    : "Start level 1"}
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                  }}
                >
                  <button
                    className="pressable"
                    onClick={() => {
                      sfx.init();
                      startLevel(1);
                    }}
                    style={{
                      minHeight: 56,
                      borderRadius: 16,
                      border: "2px solid rgba(30,10,60,0.14)",
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(12px)",
                      color: "#1e0a3c",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    Fresh run
                  </button>
                  <button
                    className="pressable"
                    onClick={() => {
                      sfx.init();
                      setMuted((value) => !value);
                    }}
                    style={{
                      minHeight: 56,
                      minWidth: 80,
                      borderRadius: 16,
                      border: "2px solid rgba(30,10,60,0.14)",
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(12px)",
                      color: "#1e0a3c",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {muted ? "Mute" : "Sound"}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: 14,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.80)",
                  backdropFilter: "blur(16px)",
                  border: "2px solid rgba(255,255,255,0.95)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.58)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Saved run
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, rgba(94,234,212,0.22), rgba(56,189,248,0.26), rgba(250,204,21,0.18))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      animation: "floaty 3s ease-in-out infinite",
                    }}
                  >
                    {DIRS.up.symbol}
                  </div>
                  <div>
                    <div
                      style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22 }}
                    >
                      Level {nextLevelPreview.levelNumber}: {nextLevelPreview.title}
                    </div>
                    <div
                      style={{ color: "rgba(255,255,255,0.64)", marginTop: 4 }}
                    >
                      {nextLevelPreview.cols}x{nextLevelPreview.rows} board ·{" "}
                      {nextLevelPreview.taps} taps
                    </div>
                  </div>
                </div>
                <button
                  className="pressable"
                  onClick={clearProgress}
                  style={{
                    marginTop: 16,
                    minHeight: 42,
                    width: "100%",
                    borderRadius: 14,
                    border: `1px solid ${SURFACE.cardBorder}`,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  Reset saved progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState !== "menu" && (
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              height: "100%",
              animation: "fadeUp .35s ease",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: 28,
                background: "linear-gradient(145deg, rgba(255,236,246,0.90) 0%, rgba(245,240,255,0.90) 50%, rgba(234,247,255,0.90) 100%)",
                backdropFilter: "blur(24px)",
                border: "3px solid rgba(255,255,255,0.92)",
                boxShadow: "0 16px 48px rgba(139,92,246,0.20)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(30,10,60,0.10)",
                      color: "rgba(30,10,60,0.70)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Level {level} • {levelConfig.title}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: viewport.width < 420 ? 20 : 26,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {`Level ${level}: ${levelConfig.title}`}
                    {/*
                    Debug-only score display. Keeping this commented so it is easy
                    to restore later while hidden from normal gameplay.
                    {autoDebugEnabled && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontFamily: "'Rajdhani', system-ui, sans-serif",
                          fontSize: viewport.width < 420 ? 11 : 12,
                          color: "rgba(94,234,212,0.72)",
                          letterSpacing: "0.03em",
                          fontWeight: 600,
                        }}
                      >
                        debug score {debugDifficultyScore}
                      </span>
                    )}
                    */}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="pressable"
                    onClick={() => setGameState("menu")}
                    style={{
                      minHeight: 42,
                      padding: "0 14px",
                      borderRadius: 14,
                      border: `2px solid ${SURFACE.cardBorder}`,
                      background: "rgba(255,255,255,0.70)",
                      backdropFilter: "blur(12px)",
                      color: "#1e0a3c",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Menu
                  </button>
                  <button
                    className="pressable"
                    onClick={() => startLevel(level)}
                    style={{
                      minHeight: 42,
                      padding: "0 14px",
                      borderRadius: 14,
                      border: `2px solid ${SURFACE.cardBorder}`,
                      background: "rgba(255,255,255,0.70)",
                      backdropFilter: "blur(12px)",
                      color: "#1e0a3c",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    ↺
                  </button>
                  {/*
                  Debug-only autoplay control. Commented out for now so normal
                  players do not see it, but the implementation remains easy to
                  re-enable later.
                  <button
                    className="pressable"
                    onClick={triggerAutoSolve}
                    style={{
                      minHeight: 36,
                      padding: "0 10px",
                      borderRadius: 12,
                      border: "1px dashed rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.035)",
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 12,
                    }}
                  >
                    {autoDebugEnabled ? "Stop auto debug" : "Auto debug"}
                  </button>
                  */}
                  <button
                    className="pressable"
                    onClick={() => setMuted((value) => !value)}
                    style={{
                      minHeight: 42,
                      padding: "0 14px",
                      borderRadius: 14,
                      border: `2px solid ${SURFACE.cardBorder}`,
                      background: "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(12px)",
                      color: "#fff",
                      fontSize: 18,
                    }}
                  >
                    {muted ? "🔇" : "🔊"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {[
                  { label: "LVL",  value: level,     color: "#0284c7", bg: "linear-gradient(145deg, #f0f9ff, #bae6fd)" },
                  { label: "TAPS", value: taps,      color: taps <= 2 ? "#be123c" : "#ea580c", bg: taps <= 2 ? "linear-gradient(145deg, #fff1f2, #fecdd3)" : "linear-gradient(145deg, #fff7ed, #fed7aa)" },
                  { label: "LEFT", value: remaining, color: "#7c3aed", bg: "linear-gradient(145deg, #faf5ff, #ede9fe)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 18,
                      background: item.bg,
                      border: "3px solid rgba(255,255,255,0.90)",
                      boxShadow: `0 3px 12px rgba(0,0,0,0.08)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: viewport.width < 420 ? 26 : 30,
                        color: item.color,
                        lineHeight: 1,
                        textShadow: `0 0 20px ${item.color}`,
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 10,
                        color: "rgba(30,10,60,0.50)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                ref={boardRef}
                style={{
                  width: boardWidth,
                  maxWidth: "100%",
                  height: boardHeight,
                  margin: "0 auto",
                  flex: 1,
                  position: "relative",
                  borderRadius: 24,
                  overflow: "hidden",
                  background: "linear-gradient(145deg, #fdf2f8 0%, #f5f3ff 50%, #eff6ff 100%)",
                  border: "3px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 8px 32px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.9)",
                  touchAction: "manipulation",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "linear-gradient(rgba(139,92,246,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(236,72,153,0.14) 1px, transparent 1px)",
                    backgroundSize: `${cellSize}px ${cellSize}px`,
                    opacity: 1,
                  }}
                />

                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: boardWidth,
                    height: boardHeight,
                    pointerEvents: "none",
                    zIndex: 4,
                  }}
                >
                  {trails.map((trail) => (
                    <line
                      key={trail.id}
                      x1={trail.x1}
                      y1={trail.y1}
                      x2={trail.x2}
                      y2={trail.y2}
                      stroke={trail.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0"
                      style={{
                        filter: `drop-shadow(0 0 6px ${trail.color})`,
                        animation: `trailFlash .42s ${trail.delay}s ease-out forwards`,
                      }}
                    />
                  ))}
                </svg>

                {Object.values(board).map((cell) => (
                  <Arrow
                    key={`${cell.x},${cell.y}`}
                    cell={cell}
                    size={cellSize}
                    onTap={handleTap}
                    disabled={busy || gameState !== "playing"}
                  />
                ))}

                {particles.map((particle) => (
                  <Burst key={particle.id} {...particle} />
                ))}

                {combo && (
                  <div
                    key={combo.key}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: viewport.width < 420 ? 38 : 48,
                      color: "#fde047",
                      textShadow: "0 0 28px rgba(251,191,36,0.4)",
                      pointerEvents: "none",
                      zIndex: 8,
                      animation: "comboPop .75s ease forwards",
                      textAlign: "center",
                    }}
                  >
                    <div>x{combo.value}</div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: viewport.width < 420 ? 12 : 14,
                        color: "#fff7cc",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {combo.text}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: viewport.width < 420 ? 78 : 96,
                        height: viewport.width < 420 ? 78 : 96,
                        borderRadius: "50%",
                        border: "2px solid rgba(253,224,71,0.65)",
                        transform: "translate(-50%, -50%)",
                        animation: "comboRing .75s ease-out forwards",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: viewport.width < 420 ? 108 : 132,
                        height: viewport.width < 420 ? 108 : 132,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.34)",
                        transform: "translate(-50%, -50%)",
                        animation: "comboRing .75s .08s ease-out forwards",
                      }}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {(gameState === "win" || gameState === "lose") && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.40)",
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 380,
                  padding: "32px 24px",
                  borderRadius: 32,
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(24px)",
                  border: "2px solid rgba(255,255,255,0.95)",
                  textAlign: "center",
                  animation: "fadeUp .35s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: gameState === "win" ? 36 : 30,
                    color: gameState === "win" ? "#0369a1" : "#be123c",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {gameState === "win"
                    ? `Level ${level} cleared`
                    : "Out of taps"}
                </div>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  {[
                    { label: "Level", value: level },
                    {
                      label: "Next",
                      value: gameState === "win" ? level + 1 : level,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "14px 8px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.80)",
                        border: "2px solid rgba(255,255,255,0.95)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: 20,
                        }}
                      >
                        {item.value}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.55)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {gameState === "win" ? (
                    <button
                      className="pressable"
                      onClick={() =>
                        startLevel(level + 1, {
                          keepScore: true,
                          score,
                        })
                      }
                      style={{
                        minHeight: 62,
                        borderRadius: 20,
                        border: "none",
                        background: SURFACE.primaryButton,
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 18,
                        boxShadow: "0 8px 28px rgba(249,115,22,0.40)",
                      }}
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      className="pressable"
                      onClick={() => startLevel(level)}
                      style={{
                        minHeight: 62,
                        borderRadius: 20,
                        border: "none",
                        background: SURFACE.accentButton,
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 18,
                        boxShadow: "0 8px 28px rgba(139,92,246,0.40)",
                      }}
                    >
                      Try again ↺
                    </button>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <button
                      className="pressable"
                      onClick={() => setGameState("menu")}
                      style={{
                        minHeight: 52,
                        borderRadius: 16,
                        border: "2px solid rgba(30,10,60,0.12)",
                        background: "rgba(255,255,255,0.75)",
                        backdropFilter: "blur(12px)",
                        color: "#1e0a3c",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      Menu
                    </button>
                    {gameState === "win" ? (
                      <button
                        className="pressable"
                        onClick={() => startLevel(level)}
                        style={{
                          minHeight: 52,
                          borderRadius: 16,
                          border: `2px solid ${SURFACE.cardBorder}`,
                          background: "rgba(255,255,255,0.20)",
                          backdropFilter: "blur(12px)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        Replay
                      </button>
                    ) : (
                      <button
                        className="pressable"
                        onClick={() => startLevel(progress.currentLevel)}
                        style={{
                          minHeight: 52,
                          borderRadius: 16,
                          border: `2px solid ${SURFACE.cardBorder}`,
                          background: "rgba(255,255,255,0.20)",
                          backdropFilter: "blur(12px)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
