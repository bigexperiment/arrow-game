const DIRS = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

const DK = Object.keys(DIRS);

const TUTORIAL = {
  1: {
    name: "TAP!",
    cols: 4,
    rows: 2,
    taps: 1,
    minTaps: 1,
    arrows: [
      { x: 0, y: 0, dir: "right", frozen: false },
      { x: 3, y: 0, dir: "left", frozen: false },
    ],
  },
  2: {
    name: "CHAIN!",
    cols: 4,
    rows: 4,
    taps: 1,
    minTaps: 1,
    arrows: [
      { x: 0, y: 0, dir: "right", frozen: false },
      { x: 3, y: 0, dir: "down", frozen: false },
      { x: 3, y: 3, dir: "left", frozen: false },
      { x: 0, y: 3, dir: "up", frozen: false },
    ],
  },
  3: {
    name: "TWO CHAINS",
    cols: 5,
    rows: 4,
    taps: 2,
    minTaps: 2,
    arrows: [
      { x: 0, y: 0, dir: "right", frozen: false },
      { x: 2, y: 0, dir: "down", frozen: false },
      { x: 4, y: 2, dir: "left", frozen: false },
      { x: 0, y: 2, dir: "down", frozen: false },
      { x: 0, y: 3, dir: "right", frozen: false },
    ],
  },
  4: {
    name: "FROZEN!",
    cols: 5,
    rows: 3,
    taps: 1,
    minTaps: 1,
    arrows: [
      { x: 0, y: 1, dir: "right", frozen: false },
      { x: 2, y: 1, dir: "up", frozen: true },
      { x: 2, y: 0, dir: "right", frozen: true },
      { x: 4, y: 0, dir: "down", frozen: false },
    ],
  },
};

const NAMED = [
  "INFERNO", "NOVA", "PULSAR", "QUASAR", "ECLIPSE", "COMET", "NEBULA", "VORTEX",
  "GALAXY", "APEX", "ZENITH", "INFINITY", "STELLAR", "COSMIC", "ORACLE", "VOID",
];

function keyOf(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y, cols, rows) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
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

function simulateChain(boardMap, startKey, cols, rows) {
  if (!boardMap.has(startKey)) return new Set();
  const cleared = new Set();
  const queue = [startKey];
  while (queue.length > 0) {
    const k = queue.shift();
    if (cleared.has(k) || !boardMap.has(k)) continue;
    cleared.add(k);
    const cell = boardMap.get(k);
    const d = DIRS[cell.dir];
    let nx = cell.x + d.dx;
    let ny = cell.y + d.dy;
    while (inBounds(nx, ny, cols, rows)) {
      const nk = keyOf(nx, ny);
      if (boardMap.has(nk) && !cleared.has(nk)) {
        queue.push(nk);
        break;
      }
      nx += d.dx;
      ny += d.dy;
    }
  }
  return cleared;
}

function wouldBreakExisting(boardMap, x, y, cols, rows) {
  for (const [, arrow] of boardMap) {
    if (arrow.dir === null) continue;
    const d = DIRS[arrow.dir];
    let cx = arrow.x + d.dx;
    let cy = arrow.y + d.dy;
    while (inBounds(cx, cy, cols, rows)) {
      if (boardMap.has(keyOf(cx, cy))) break;
      if (cx === x && cy === y) return true;
      cx += d.dx;
      cy += d.dy;
    }
  }
  return false;
}

function placeChain(boardMap, targetLen, cols, rows, gapMin, gapMax) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const empties = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (!boardMap.has(keyOf(x, y))) empties.push({ x, y });
      }
    }
    if (empties.length === 0) return null;

    const start = empties[Math.floor(Math.random() * empties.length)];
    if (wouldBreakExisting(boardMap, start.x, start.y, cols, rows)) continue;

    const chain = [{ x: start.x, y: start.y, dir: null, frozen: false }];
    const temp = new Map(boardMap);
    temp.set(keyOf(start.x, start.y), chain[0]);
    let stuck = false;

    for (let index = 0; index < targetLen - 1; index += 1) {
      const prev = chain[index];
      const dirs = shuffle(DK);
      const gaps = shuffle(Array.from({ length: gapMax - gapMin + 1 }, (_, gap) => gapMin + gap));
      let placed = false;

      outer:
      for (const dir of dirs) {
        for (const gap of gaps) {
          const d = DIRS[dir];
          const nx = prev.x + d.dx * gap;
          const ny = prev.y + d.dy * gap;
          const nk = keyOf(nx, ny);
          if (!inBounds(nx, ny, cols, rows) || temp.has(nk)) continue;

          let ok = true;
          for (let step = 1; step < gap; step += 1) {
            if (temp.has(keyOf(prev.x + d.dx * step, prev.y + d.dy * step))) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
          if (wouldBreakExisting(temp, nx, ny, cols, rows)) continue;

          prev.dir = dir;
          const nextArrow = { x: nx, y: ny, dir: null, frozen: false };
          chain.push(nextArrow);
          temp.set(nk, nextArrow);
          placed = true;
          break outer;
        }
      }

      if (!placed) {
        stuck = true;
        break;
      }
    }

    if (stuck || chain.length !== targetLen) continue;

    const last = chain[targetLen - 1];
    const tailDirs = shuffle(DK);
    let tailOk = false;
    for (const dir of tailDirs) {
      const d = DIRS[dir];
      let x = last.x + d.dx;
      let y = last.y + d.dy;
      let hits = false;
      while (inBounds(x, y, cols, rows)) {
        if (temp.has(keyOf(x, y))) {
          hits = true;
          break;
        }
        x += d.dx;
        y += d.dy;
      }
      if (!hits) {
        last.dir = dir;
        tailOk = true;
        break;
      }
    }
    if (!tailOk) last.dir = DK[Math.floor(Math.random() * DK.length)];
    return chain;
  }

  return null;
}

function verifyChains(boardMap, chains, cols, rows) {
  for (const chain of chains) {
    const startKey = keyOf(chain[0].x, chain[0].y);
    const cleared = simulateChain(boardMap, startKey, cols, rows);
    const expected = new Set(chain.map((cell) => keyOf(cell.x, cell.y)));
    if (cleared.size !== expected.size) return false;
    for (const key of expected) {
      if (!cleared.has(key)) return false;
    }
  }
  return true;
}

function assignFrozen(chains, maxPerChain) {
  if (maxPerChain <= 0) return;
  for (const chain of chains) {
    if (chain.length <= 1) continue;
    const candidates = shuffle(chain.slice(1));
    const count = Math.min(maxPerChain, candidates.length);
    for (let index = 0; index < count; index += 1) {
      candidates[index].frozen = true;
    }
  }
}

function firstArrowHit(board, cell, cols, rows) {
  const dir = DIRS[cell.dir];
  let x = cell.x + dir.dx;
  let y = cell.y + dir.dy;
  while (inBounds(x, y, cols, rows)) {
    const hit = board[keyOf(x, y)];
    if (hit && hit.state !== "cleared") return hit;
    x += dir.dx;
    y += dir.dy;
  }
  return null;
}

function hasCrossChainInterference(chains, cols, rows) {
  const board = {};
  chains.forEach((chain) => {
    chain.forEach((cell) => {
      board[keyOf(cell.x, cell.y)] = cell;
    });
  });

  return chains.some((chain) =>
    chain.some((cell) => {
      const hit = firstArrowHit(board, cell, cols, rows);
      return hit && hit.chainId !== cell.chainId;
    }),
  );
}

function insertDecoys(chains, cols, rows, decoyCount) {
  for (let count = 0; count < decoyCount; count += 1) {
    const linkPool = [];
    chains.forEach((chain) => {
      for (let index = 0; index < chain.length - 1; index += 1) {
        const from = chain[index];
        const to = chain[index + 1];
        const between = rangeCells(from, to).filter((cell) =>
          !chains.some((currentChain) =>
            currentChain.some((occupied) => occupied.x === cell.x && occupied.y === cell.y),
          ),
        );
        if (between.length > 0) linkPool.push({ chain, index, between });
      }
    });

    if (linkPool.length === 0) return;
    const link = pickRandom(linkPool);
    const insertCell = pickRandom(link.between);
    const from = link.chain[link.index];
    const to = link.chain[link.index + 1];
    const originalDir = from.dir;

    const dirToInsert =
      insertCell.x > from.x ? "right"
      : insertCell.x < from.x ? "left"
      : insertCell.y > from.y ? "down"
      : "up";
    const dirToNext =
      to.x > insertCell.x ? "right"
      : to.x < insertCell.x ? "left"
      : to.y > insertCell.y ? "down"
      : "up";

    from.dir = dirToInsert;
    const inserted = {
      x: insertCell.x,
      y: insertCell.y,
      dir: dirToNext,
      frozen: false,
      decoy: true,
      chainId: from.chainId,
      chainIndex: link.index + 1,
    };
    link.chain.splice(link.index + 1, 0, inserted);
    link.chain.forEach((cell, idx) => {
      cell.chainIndex = idx;
    });

    if (hasCrossChainInterference(chains, cols, rows)) {
      link.chain.splice(link.index + 1, 1);
      from.dir = originalDir;
      link.chain.forEach((cell, idx) => {
        cell.chainIndex = idx;
      });
    }
  }
}

function traceChain(board, startCell, cols, rows) {
  const queue = [{ x: startCell.x, y: startCell.y, depth: 0 }];
  const seen = new Set();
  const sequence = [];

  while (queue.length) {
    const { x, y, depth } = queue.shift();
    const key = keyOf(x, y);
    if (seen.has(key) || !board[key] || board[key].state === "cleared") continue;

    seen.add(key);
    const current = board[key];
    sequence.push({ key, depth, x, y, dir: current.dir });

    const dir = DIRS[current.dir];
    let nx = x + dir.dx;
    let ny = y + dir.dy;
    while (inBounds(nx, ny, cols, rows)) {
      const nk = keyOf(nx, ny);
      if (board[nk] && board[nk].state !== "cleared" && !seen.has(nk)) {
        queue.push({ x: nx, y: ny, depth: depth + 1 });
        break;
      }
      nx += dir.dx;
      ny += dir.dy;
    }
  }

  return sequence;
}

function applyTapToBoard(board, cell, cols, rows) {
  if (cell.frozen) return board;
  const sequence = traceChain(board, cell, cols, rows);
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

function isSolvable(board, cols, rows, taps) {
  const seen = new Set();

  function visit(currentBoard, tapsLeft) {
    if (Object.keys(currentBoard).length === 0) return true;
    if (tapsLeft <= 0) return false;

    const stateKey = boardStateKey(currentBoard, tapsLeft);
    if (seen.has(stateKey)) return false;
    seen.add(stateKey);

    const tappable = Object.values(currentBoard).filter((cell) => !cell.frozen);
    for (const cell of tappable) {
      const nextBoard = applyTapToBoard(currentBoard, cell, cols, rows);
      if (Object.keys(nextBoard).length === Object.keys(currentBoard).length) continue;
      if (visit(nextBoard, tapsLeft - 1)) return true;
    }
    return false;
  }

  return visit(board, taps);
}

function findOptimalSolution(board, cols, rows, maxTaps) {
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
      const nextBoard = applyTapToBoard(currentBoard, cell, cols, rows);
      if (Object.keys(nextBoard).length === Object.keys(currentBoard).length) continue;

      const remainder = visit(nextBoard, tapsLeft - 1);
      if (!remainder) continue;

      const candidate = [keyOf(cell.x, cell.y), ...remainder];
      if (!bestPath || candidate.length < bestPath.length) bestPath = candidate;
    }

    memo.set(stateKey, bestPath);
    return bestPath;
  }

  return visit(board, maxTaps);
}

function calcStars(used, min) {
  if (used <= min) return 3;
  if (used === min + 1) return 2;
  return 1;
}

function generateValidBoard(levelInfo) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const boardMap = new Map();
    const chains = [];
    let ok = true;

    for (let chainId = 0; chainId < levelInfo.chainCount; chainId += 1) {
      const len = levelInfo.chainLenMin + Math.floor(Math.random() * (levelInfo.chainLenMax - levelInfo.chainLenMin + 1));
      const chain = placeChain(boardMap, len, levelInfo.cols, levelInfo.rows, levelInfo.gapMin, levelInfo.gapMax);
      if (!chain) {
        ok = false;
        break;
      }

      chain.forEach((arrow, index) => {
        arrow.chainId = chainId;
        arrow.chainIndex = index;
        arrow.decoy = false;
        boardMap.set(keyOf(arrow.x, arrow.y), arrow);
      });
      chains.push(chain);
    }

    if (!ok) continue;
    if (!verifyChains(boardMap, chains, levelInfo.cols, levelInfo.rows)) continue;

    if (levelInfo.decoyCount > 0) {
      insertDecoys(chains, levelInfo.cols, levelInfo.rows, levelInfo.decoyCount);
      if (hasCrossChainInterference(chains, levelInfo.cols, levelInfo.rows)) continue;
    }

    assignFrozen(chains, levelInfo.frozenPerChain);

    const board = {};
    chains.forEach((chain) => {
      chain.forEach((cell) => {
        board[keyOf(cell.x, cell.y)] = { ...cell, state: "idle" };
      });
    });

    const taps = levelInfo.chainCount + levelInfo.bonus;
    if (!isSolvable(board, levelInfo.cols, levelInfo.rows, taps)) continue;

    const solution = findOptimalSolution(board, levelInfo.cols, levelInfo.rows, taps);
    const minTaps = solution?.length ?? levelInfo.chainCount;

    return {
      board,
      taps,
      total: Object.keys(board).length,
      minTaps,
      generationAttempt: attempt + 1,
      optimalSolution: solution ?? [],
    };
  }

  const fallback = {};
  for (let x = 0; x < 4; x += 1) {
    fallback[keyOf(x, 0)] = { x, y: 0, dir: "right", frozen: false, state: "idle" };
  }

  return {
    board: fallback,
    taps: 3,
    total: 4,
    minTaps: 1,
    generationAttempt: 60,
    optimalSolution: [keyOf(0, 0)],
    fallback: true,
  };
}

function getLevelInfo(level) {
  if (TUTORIAL[level]) return { ...TUTORIAL[level], isTutorial: true };

  const idx = level - 5;
  const nameIdx = idx % NAMED.length;
  const loop = Math.floor(idx / NAMED.length);
  const name = loop > 0 ? `${NAMED[nameIdx]} ${loop + 1}` : NAMED[nameIdx];
  const tier = idx;

  return {
    name,
    cols: Math.min(7, 5 + Math.floor(tier / 3)),
    rows: Math.min(8, 5 + Math.floor(tier / 2)),
    chainCount: Math.min(6, 2 + Math.floor(tier / 2)),
    chainLenMin: 3,
    chainLenMax: Math.max(3, 6 - Math.floor(tier / 4)),
    frozenPerChain: Math.min(3, Math.floor(tier / 3)),
    decoyCount: Math.min(6, Math.max(0, Math.floor(tier / 2))),
    bonus: tier < 2 ? 3 : tier < 5 ? 2 : 1,
    gapMin: 1,
    gapMax: Math.min(3, 2 + Math.floor(tier / 8)),
    isTutorial: false,
  };
}

function getBoardForLevel(level) {
  const info = getLevelInfo(level);
  if (info.isTutorial) {
    const board = {};
    for (const arrow of info.arrows) {
      board[keyOf(arrow.x, arrow.y)] = { ...arrow, state: "idle", decoy: false };
    }
    return {
      board,
      taps: info.taps,
      total: info.arrows.length,
      minTaps: info.minTaps,
      cols: info.cols,
      rows: info.rows,
      isTutorial: true,
      generationAttempt: 1,
      optimalSolution: [],
      fallback: false,
      info,
    };
  }

  const generated = generateValidBoard(info);
  return {
    ...generated,
    cols: info.cols,
    rows: info.rows,
    isTutorial: false,
    fallback: Boolean(generated.fallback),
    info,
  };
}

function cloneBoard(board) {
  return Object.fromEntries(Object.entries(board).map(([key, cell]) => [key, { ...cell }]));
}

function analyzeBoard(board, cols, rows) {
  const cells = Object.values(board);
  const lengths = cells
    .filter((cell) => !cell.frozen)
    .map((cell) => traceChain(board, cell, cols, rows).length);
  return {
    arrows: cells.length,
    frozen: cells.filter((cell) => cell.frozen).length,
    decoys: cells.filter((cell) => cell.decoy).length,
    maxChainFromAnyTap: lengths.length > 0 ? Math.max(...lengths) : 0,
    avgChainFromAnyTap: lengths.length > 0 ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length : 0,
  };
}

function runGreedyPlayer(board, cols, rows, taps) {
  let currentBoard = cloneBoard(board);
  let tapsUsed = 0;
  const moves = [];

  while (Object.keys(currentBoard).length > 0 && tapsUsed < taps) {
    const options = Object.values(currentBoard)
      .filter((cell) => !cell.frozen)
      .map((cell) => ({
        cell,
        sequence: traceChain(currentBoard, cell, cols, rows),
      }))
      .filter((entry) => entry.sequence.length > 0)
      .sort((a, b) => {
        if (b.sequence.length !== a.sequence.length) return b.sequence.length - a.sequence.length;
        if (a.cell.y !== b.cell.y) return a.cell.y - b.cell.y;
        return a.cell.x - b.cell.x;
      });

    if (options.length === 0) break;

    const best = options[0];
    moves.push(keyOf(best.cell.x, best.cell.y));
    currentBoard = applyTapToBoard(currentBoard, best.cell, cols, rows);
    tapsUsed += 1;
  }

  const stars = Object.keys(currentBoard).length === 0 ? calcStars(tapsUsed, moves.length) : 0;
  return {
    won: Object.keys(currentBoard).length === 0,
    tapsUsed,
    remaining: Object.keys(currentBoard).length,
    moves,
    stars,
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseArgs(argv) {
  const args = { games: 1000, levels: 40 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--games") args.games = Number(argv[index + 1] ?? args.games);
    if (arg === "--levels") args.levels = Number(argv[index + 1] ?? args.levels);
  }
  args.games = Number.isFinite(args.games) && args.games > 0 ? Math.floor(args.games) : 1000;
  args.levels = Number.isFinite(args.levels) && args.levels > 0 ? Math.floor(args.levels) : 40;
  return args;
}

function levelBand(level) {
  if (level <= 4) return "tutorial";
  if (level <= 10) return "5-10";
  if (level <= 20) return "11-20";
  if (level <= 30) return "21-30";
  return "31+";
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function main() {
  const { games, levels } = parseArgs(process.argv.slice(2));
  const samples = [];
  const issues = [];

  for (let index = 0; index < games; index += 1) {
    const level = (index % levels) + 1;
    const boardData = getBoardForLevel(level);
    const metrics = analyzeBoard(boardData.board, boardData.cols, boardData.rows);
    const greedy = runGreedyPlayer(boardData.board, boardData.cols, boardData.rows, boardData.taps);
    const exactSolution = boardData.optimalSolution.length > 0
      ? boardData.optimalSolution
      : findOptimalSolution(boardData.board, boardData.cols, boardData.rows, boardData.taps) ?? [];

    const solvable = exactSolution.length > 0 || boardData.isTutorial;
    if (!solvable) {
      issues.push({
        type: "impossible_board",
        level,
        taps: boardData.taps,
        arrows: metrics.arrows,
        generationAttempt: boardData.generationAttempt,
      });
    }

    const minTaps = boardData.isTutorial ? boardData.minTaps : exactSolution.length;
    samples.push({
      level,
      band: levelBand(level),
      fallback: boardData.fallback,
      generationAttempt: boardData.generationAttempt,
      tapsAllowed: boardData.taps,
      minTaps,
      slack: boardData.taps - minTaps,
      arrows: metrics.arrows,
      frozen: metrics.frozen,
      decoys: metrics.decoys,
      maxChain: metrics.maxChainFromAnyTap,
      avgChain: metrics.avgChainFromAnyTap,
      greedyWon: greedy.won,
      greedyTapsUsed: greedy.tapsUsed,
      greedyRemaining: greedy.remaining,
    });
  }

  const impossibleBoards = issues.filter((issue) => issue.type === "impossible_board").length;
  const fallbackBoards = samples.filter((sample) => sample.fallback).length;
  const greedyWins = samples.filter((sample) => sample.greedyWon).length;

  console.log(`Simulated ${games} generated games across levels 1-${levels}.`);
  console.log("");
  console.log("Overall");
  console.log(`- Impossible boards found: ${impossibleBoards}`);
  console.log(`- Fallback boards used: ${fallbackBoards}`);
  console.log(`- Average generation attempt: ${formatNumber(average(samples.map((sample) => sample.generationAttempt)))}`);
  console.log(`- Average arrows per board: ${formatNumber(average(samples.map((sample) => sample.arrows)))}`);
  console.log(`- Average optimal taps: ${formatNumber(average(samples.map((sample) => sample.minTaps)))}`);
  console.log(`- Average tap slack: ${formatNumber(average(samples.map((sample) => sample.slack)))}`);
  console.log(`- Greedy bot win rate: ${formatNumber((greedyWins / samples.length) * 100)}%`);
  console.log("");

  console.log("Difficulty progression by level band");
  for (const band of ["tutorial", "5-10", "11-20", "21-30", "31+"]) {
    const group = samples.filter((sample) => sample.band === band);
    if (group.length === 0) continue;
    console.log(`- ${band}: boards=${group.length}, arrows=${formatNumber(average(group.map((sample) => sample.arrows)))}, frozen=${formatNumber(average(group.map((sample) => sample.frozen)))}, decoys=${formatNumber(average(group.map((sample) => sample.decoys)))}, optimal=${formatNumber(average(group.map((sample) => sample.minTaps)))}, slack=${formatNumber(average(group.map((sample) => sample.slack)))}, greedyWin=${formatNumber((group.filter((sample) => sample.greedyWon).length / group.length) * 100)}%`);
  }

  console.log("");
  console.log("Hardest sampled levels by greedy failure rate");
  const byLevel = new Map();
  for (const sample of samples) {
    if (!byLevel.has(sample.level)) byLevel.set(sample.level, []);
    byLevel.get(sample.level).push(sample);
  }
  const hardest = [...byLevel.entries()]
    .map(([level, group]) => ({
      level,
      failureRate: 1 - group.filter((sample) => sample.greedyWon).length / group.length,
      arrows: average(group.map((sample) => sample.arrows)),
      decoys: average(group.map((sample) => sample.decoys)),
      slack: average(group.map((sample) => sample.slack)),
    }))
    .sort((a, b) => b.failureRate - a.failureRate || b.level - a.level)
    .slice(0, 8);
  for (const item of hardest) {
    console.log(`- Level ${item.level}: greedy fail ${formatNumber(item.failureRate * 100)}%, arrows ${formatNumber(item.arrows)}, decoys ${formatNumber(item.decoys)}, slack ${formatNumber(item.slack)}`);
  }

  if (issues.length > 0) {
    console.log("");
    console.log("Issues");
    for (const issue of issues.slice(0, 10)) {
      console.log(`- ${issue.type} at level ${issue.level} (taps=${issue.taps}, arrows=${issue.arrows}, generationAttempt=${issue.generationAttempt})`);
    }
  }
}

main();
