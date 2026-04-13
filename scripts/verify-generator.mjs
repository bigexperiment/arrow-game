const DIRS = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

const DIRECTION_KEYS = Object.keys(DIRS);

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
    const length = randInt(config.chainLengthRange[0], config.chainLengthRange[1]);
    const frozenCount = Math.min(
      length - 1,
      randInt(config.frozenPerChain[0], config.frozenPerChain[1]),
    );
    return { chainId, length, frozenCount };
  });
}

function anyExistingArrowSeesCell(chains, target) {
  for (const chain of chains) {
    for (const cell of chain.cells) {
      if (!cell.dir) continue;
      const dir = DIRS[cell.dir];
      let x = cell.x + dir.dx;
      let y = cell.y + dir.dy;
      while (inBounds(x, y, chain.cols, chain.rows)) {
        if (x === target.x && y === target.y) return true;
        const blocked = chains.some((currentChain) =>
          currentChain.cells.some((occupied) => occupied.x === x && occupied.y === y),
        );
        if (blocked) break;
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
      path[index].dir = chooseSafeTailDirection(path[index], chains, config.cols, config.rows);
      return true;
    }

    const current = path[index];
    const candidates = [];

    for (const dirKey of shuffle(DIRECTION_KEYS)) {
      const dir = DIRS[dirKey];
      for (let gap = config.gapRange[0]; gap <= config.gapRange[1]; gap += 1) {
        const step = gap + 1;
        const next = { x: current.x + dir.dx * step, y: current.y + dir.dy * step };
        if (!inBounds(next.x, next.y, config.cols, config.rows)) continue;
        if (occupied.has(keyOf(next.x, next.y))) continue;
        if (path.some((cell) => cell.x === next.x && cell.y === next.y)) continue;

        const between = rangeCells(current, next);
        const blocked = between.some(({ x, y }) => {
          const key = keyOf(x, y);
          return occupied.has(key) || path.some((cell) => keyOf(cell.x, cell.y) === key);
        });
        if (blocked) continue;
        if (!config.interference && anyExistingArrowSeesCell(chains, next)) continue;
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
      if (!config.interference && anyExistingArrowSeesCell(chains, start)) continue;

      const candidate = buildChainFromStart(start, chainPlan, config, chains.map((chain) => ({
        ...chain,
        cols: config.cols,
        rows: config.rows,
      })));

      if (!candidate) continue;
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
      insertCell.x > from.x ? "right" : insertCell.x < from.x ? "left" : insertCell.y > from.y ? "down" : "up";
    const dirToNext =
      to.x > insertCell.x ? "right" : to.x < insertCell.x ? "left" : to.y > insertCell.y ? "down" : "up";

    const originalDir = from.dir;
    from.dir = dirToInsert;
    link.chain.cells.splice(link.index + 1, 0, {
      x: insertCell.x,
      y: insertCell.y,
      dir: dirToNext,
      chainId: link.chain.chainId,
      chainIndex: link.index + 1,
      frozen: false,
      decoy: true,
      state: "idle",
    });

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
    if (!config.interference && hasCrossChainInterference(chains, config)) continue;
    assignFrozenArrows(chains);

    const board = {};
    chains.forEach((chain) => {
      chain.cells.forEach((cell) => {
        board[keyOf(cell.x, cell.y)] = { ...cell };
      });
    });

    if (isSolvable(board, config)) return board;
  }
  return null;
}

function traceChain(board, startCell, cols, rows) {
  const currentBoard = { ...board };
  const queue = [{ x: startCell.x, y: startCell.y, depth: 0 }];
  const seen = new Set();
  const sequence = [];

  while (queue.length) {
    const { x, y, depth } = queue.shift();
    const key = keyOf(x, y);
    if (seen.has(key) || !currentBoard[key] || currentBoard[key].state === "cleared") continue;
    seen.add(key);

    const currentCell = currentBoard[key];
    const direction = DIRS[currentCell.dir];
    sequence.push({ key, x, y });

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

function applyTap(board, cell, config) {
  if (cell.frozen) return board;
  const sequence = traceChain(board, cell, config.cols, config.rows);
  const nextBoard = { ...board };
  for (const step of sequence) {
    delete nextBoard[step.key];
  }
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
      const nextBoard = applyTap(currentBoard, cell, config);
      if (Object.keys(nextBoard).length === Object.keys(currentBoard).length) continue;
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
      const nextBoard = applyTap(currentBoard, cell, config);
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

function summarize(level, samples, failures, metrics) {
  const status = failures.length === 0 ? "PASS" : "FAIL";
  console.log(`${status} level ${level}: tested ${samples}, failures ${failures.length}`);
  if (metrics.length > 0) {
    const optimals = metrics.map((entry) => entry.optimal);
    const scores = metrics.map((entry) => entry.score);
    const avgOptimal = optimals.reduce((sum, value) => sum + value, 0) / optimals.length;
    const avgScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    console.log(
      `  optimal taps min/avg/max: ${Math.min(...optimals)}/${avgOptimal.toFixed(2)}/${Math.max(...optimals)}`,
    );
    console.log(
      `  difficulty score min/avg/max: ${Math.min(...scores)}/${avgScore.toFixed(2)}/${Math.max(...scores)}`,
    );
  }
  if (failures.length > 0) {
    console.log(`  first failing config: ${JSON.stringify(failures[0])}`);
  }
}

const failures = [];
const allMetrics = [];
const perLevelSamples = 100;
const maxLevel = 20;

for (let level = 1; level <= maxLevel; level += 1) {
  const levelFailures = [];
  const levelMetrics = [];
  for (let sample = 0; sample < perLevelSamples; sample += 1) {
    const config = getLevelConfig(level);
    const board = buildBoard(config);
    if (!board) {
      levelFailures.push({ reason: "generator_failed", config });
      continue;
    }
    const solvable = isSolvable(board, config);
    if (!solvable) {
      levelFailures.push({
        reason: "unsolved_within_budget",
        config,
        board: Object.values(board),
      });
      continue;
    }
    const optimalPath = findOptimalSolution(board, config, config.taps);
    const optimalTaps = optimalPath ? optimalPath.length : null;
    const difficultyScore = getDifficultyScore(board, {
      ...config,
      optimalTaps: optimalTaps ?? config.optimalTaps,
    });
    levelMetrics.push({ optimal: optimalTaps ?? -1, score: difficultyScore });
    allMetrics.push({ level, optimal: optimalTaps ?? -1, score: difficultyScore });
  }
  summarize(level, perLevelSamples, levelFailures, levelMetrics);
  failures.push(...levelFailures.map((failure) => ({ level, ...failure })));
}

if (failures.length > 0) {
  console.error(`\nFound ${failures.length} failing boards.`);
  process.exit(1);
}

console.log(`\nAll ${perLevelSamples * maxLevel} generated boards were solvable within tap budget.`);
if (allMetrics.length > 0) {
  const avgOptimal = allMetrics.reduce((sum, entry) => sum + entry.optimal, 0) / allMetrics.length;
  const avgScore = allMetrics.reduce((sum, entry) => sum + entry.score, 0) / allMetrics.length;
  console.log(
    `Overall optimal taps avg: ${avgOptimal.toFixed(2)} | overall difficulty score avg: ${avgScore.toFixed(2)}`,
  );
}
