import { useState, useCallback, useRef, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════ */
const memStore = {};
const STORE_KEY = "arrows-game-progress-v2";
const START_LEVEL_OVERRIDE = 100; // Set to `null` to restore normal start/progress behavior.
const DEFAULT_LEVEL = START_LEVEL_OVERRIDE ?? 1;
const storage = {
  load() {
    try {
      if (typeof window === "undefined" || !window.localStorage) return memStore[STORE_KEY] || null;
      const raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return memStore[STORE_KEY] || null; }
  },
  save(data) {
    memStore[STORE_KEY] = data;
    try { if (window.localStorage) window.localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
  },
  clear() {
    delete memStore[STORE_KEY];
    try { if (window.localStorage) window.localStorage.removeItem(STORE_KEY); } catch {}
  },
};

/* ═══════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════ */
class SFX {
  constructor(){this.c=null;this.on=true}
  init(){if(!this.c){try{this.c=new(window.AudioContext||window.webkitAudioContext)()}catch{return}}if(this.c.state==="suspended")this.c.resume()}
  play(fn){if(!this.on)return;this.init();if(!this.c)return;try{fn(this.c)}catch{}}
  tap(){this.play(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(420,t+.06);g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.1)})}
  hit(d){this.play(c=>{const t=c.currentTime,f=340+d*120,o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.9,t+.04);o.frequency.exponentialRampToValueAtTime(f*.35,t+.12);g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.15)})}
  pop(d){this.play(c=>{const t=c.currentTime,f=600+d*60;[1,1.5,2].forEach((m,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(f*m,t);g.gain.setValueAtTime(.08/(i+1),t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.2)})})}
  combo(n){this.play(c=>{const t=c.currentTime;[0,.05,.1,.15].slice(0,Math.min(n,4)).forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(523*Math.pow(1.189,i+n),t+d);g.gain.setValueAtTime(.14,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.13);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.13)})})}
  win(stars){this.play(c=>{const t=c.currentTime;const notes=stars>=3?[523,659,784,1047,1319]:stars===2?[523,659,784,1047]:[523,659,784];notes.forEach((f,i)=>{const d=i*.1,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(f,t+d);g.gain.setValueAtTime(.17,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.4);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.4)})})}
  levelUp(){this.play(c=>{const t=c.currentTime;[0,.08,.16,.24,.32].forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(523*Math.pow(1.26,i),t+d);g.gain.setValueAtTime(.15,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.3);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.3)})})}
  lose(){this.play(c=>{const t=c.currentTime;[420,330,260,170].forEach((f,i)=>{const d=i*.13,o=c.createOscillator(),g=c.createGain();o.type="sawtooth";o.frequency.setValueAtTime(f,t+d);o.frequency.exponentialRampToValueAtTime(f*.6,t+d+.2);g.gain.setValueAtTime(.07,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.24);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.28)})})}
  click(){this.play(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(900,t+.05);g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.07)})}
  nope(){this.play(c=>{const t=c.currentTime;[300,260,220].forEach((f,i)=>{const d=i*.04,o=c.createOscillator(),g=c.createGain();o.type="square";o.frequency.setValueAtTime(f,t+d);g.gain.setValueAtTime(.06,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+.08);o.connect(g).connect(c.destination);o.start(t+d);o.stop(t+d+.1)})})}
}
const sfx = new SFX();
const buzz = (ms=10) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch {} };

/* ═══════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════ */
const I = {
  Arrow: ({s=20,c="#fff"}) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M6 16H24M24 16L17 8.5M24 16L17 23.5" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Snow: ({s=20,c="#3b82f6"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 3l3 2 3-2M9 21l3-2 3 2M3 9l2 3-2 3M21 9l-2 3 2 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Lock: ({s=20,c="#fff"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill={c}/>
      <path d="M8 10.5V7a4 4 0 118 0v3.5" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="15" r="1.8" fill="#475569"/>
    </svg>
  ),
  Star: ({s=20,filled=true,c="#fbbf24",outline="#f59e0b"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 8.3L21.5 8.9L16.2 13.6L17.8 20.5L12 17.3L6.2 20.5L7.8 13.6L2.5 8.9L9.5 8.3L12 2Z" fill={filled?c:"#fff"} stroke={filled?outline:"#cbd5e1"} strokeWidth="1.5" strokeLinejoin="round"/>
      {filled && <path d="M12 5L13.5 9L18 9.5L15 12.5L16 17L12 15L8 17L9 12.5L6 9.5L10.5 9L12 5Z" fill="#fef3c7" opacity=".6"/>}
    </svg>
  ),
  Gear: ({s=20,c="#6b21a8"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.3" stroke={c} strokeWidth="2" fill="#fff"/>
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7l-2.1-2.1" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Close: ({s=20,c="#6b21a8"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="3" strokeLinecap="round"/></svg>
  ),
  Play: ({s=20,c="#fff"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5L7 4.5z" fill={c} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  Refresh: ({s=20,c="#6b21a8"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0115.6-6.1L21 8M21 3v5h-5M21 12a9 9 0 01-15.6 6.1L3 16M3 21v-5h5" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chevron: ({s=20,c="#6b21a8",dir="left"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{transform:dir==="right"?"rotate(180deg)":"none"}}><path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Speaker: ({s=20,c="#6b21a8",muted=false}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2.5v6H6l5 4V5z" fill={c}/>
      {!muted && <path d="M15 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10" stroke={c} strokeWidth="2" strokeLinecap="round"/>}
      {muted && <path d="M16 10l6 6M22 10l-6 6" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>}
    </svg>
  ),
  Vibrate: ({s=20,c="#6b21a8"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="4" width="8" height="16" rx="1.5" stroke={c} strokeWidth="2" fill="#fff"/>
      <circle cx="12" cy="17" r="1" fill={c}/>
      <path d="M3 9v6M5 11v2M21 9v6M19 11v2" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Trash: ({s=20,c="#fff"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M10 7V4h4v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M10 11v7M14 11v7" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Bulb: ({s=20,c="#f59e0b"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.6 1 1.3 1 2V17h6v-1.5c0-.7.2-1.4 1-2A6 6 0 0012 3z" fill="#fef3c7" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 7v4M10 11h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Face: ({s=20,mood="sad"}) => (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="url(#fgrad)" stroke="#fff" strokeWidth="2"/>
      <circle cx="14" cy="17" r="2.5" fill="#1e1b4b"/>
      <circle cx="26" cy="17" r="2.5" fill="#1e1b4b"/>
      {mood==="sad" ? <path d="M13 26 Q20 22 27 26" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/> : <path d="M13 23 Q20 29 27 23" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
      <defs><radialGradient id="fgrad" cx="35%" cy="30%"><stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor="#f59e0b"/></radialGradient></defs>
    </svg>
  ),
  Check: ({s=20,c="#10b981"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Sparkle: ({s=20,c="#fbbf24"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v8M12 14v8M2 12h8M14 12h8M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Banned: ({s=20,c="#ef4444"}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2.5" fill="rgba(255,255,255,.4)"/>
      <path d="M6 6l12 12" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* Happy blob character for map marker */
function MarkerBlob({s=40}) {
  return (
    <svg width={s} height={s*1.1} viewBox="0 0 44 48">
      <ellipse cx="22" cy="44" rx="12" ry="2.5" fill="rgba(0,0,0,.25)"/>
      <defs>
        <radialGradient id="mgrad" cx="35%" cy="25%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="55%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#b45309"/>
        </radialGradient>
      </defs>
      <circle cx="22" cy="22" r="19" fill="url(#mgrad)" stroke="#fff" strokeWidth="2.5"/>
      <ellipse cx="15" cy="12" rx="5.5" ry="3.5" fill="rgba(255,255,255,.55)"/>
      <circle cx="15" cy="22" r="3.5" fill="#1e1b4b"/>
      <circle cx="29" cy="22" r="3.5" fill="#1e1b4b"/>
      <circle cx="16.5" cy="21" r="1.3" fill="#fff"/>
      <circle cx="30.5" cy="21" r="1.3" fill="#fff"/>
      <path d="M14 29 Q22 34 30 29" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="10" cy="28" r="2.2" fill="#fbcfe8" opacity=".7"/>
      <circle cx="34" cy="28" r="2.2" fill="#fbcfe8" opacity=".7"/>
    </svg>
  );
}

/* Tutorial pointing hint — animated down arrow */
function PointerHint({size=32}) {
  return (
    <svg width={size} height={size*1.4} viewBox="0 0 32 44">
      <defs>
        <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
      <path d="M16 2v30M8 24l8 10 8-10" stroke="#b45309" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4v28M10 24l6 8 6-8" stroke="url(#phGrad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   GAME LOGIC
   ═══════════════════════════════════════════════════════ */
const DIRS = { up:{dx:0,dy:-1,rot:-90}, right:{dx:1,dy:0,rot:0}, down:{dx:0,dy:1,rot:90}, left:{dx:-1,dy:0,rot:180} };
const DK = Object.keys(DIRS);
const keyOf = (x, y) => `${x},${y}`;
const inBounds = (x, y, cols, rows) => x >= 0 && x < cols && y >= 0 && y < rows;
const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
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
    let nx = cell.x + d.dx, ny = cell.y + d.dy;
    while (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
      const nk = `${nx},${ny}`;
      if (boardMap.has(nk) && !cleared.has(nk)) { queue.push(nk); break; }
      nx += d.dx; ny += d.dy;
    }
  }
  return cleared;
}

function wouldBreakExisting(boardMap, x, y, cols, rows) {
  for (const [, arrow] of boardMap) {
    if (arrow.dir === null) continue;
    const d = DIRS[arrow.dir];
    let cx = arrow.x + d.dx, cy = arrow.y + d.dy;
    while (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      if (boardMap.has(`${cx},${cy}`)) break;
      if (cx === x && cy === y) return true;
      cx += d.dx; cy += d.dy;
    }
  }
  return false;
}

function placeChain(boardMap, targetLen, cols, rows, gapMin, gapMax) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const empties = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
      if (!boardMap.has(`${x},${y}`)) empties.push({x,y});
    if (empties.length === 0) return null;
    const start = empties[Math.floor(Math.random() * empties.length)];
    if (wouldBreakExisting(boardMap, start.x, start.y, cols, rows)) continue;

    const chain = [{x:start.x,y:start.y,dir:null,frozen:false}];
    const temp = new Map(boardMap);
    temp.set(`${start.x},${start.y}`, chain[0]);
    let stuck = false;

    for (let i = 0; i < targetLen - 1; i++) {
      const prev = chain[i];
      const dirs = [...DK].sort(() => Math.random() - .5);
      const gaps = []; for (let g = gapMin; g <= gapMax; g++) gaps.push(g);
      gaps.sort(() => Math.random() - .5);
      let placed = false;
      outer: for (const dir of dirs) for (const gap of gaps) {
        const d = DIRS[dir];
        const nx = prev.x + d.dx*gap, ny = prev.y + d.dy*gap;
        if (nx<0||nx>=cols||ny<0||ny>=rows) continue;
        const nk = `${nx},${ny}`;
        if (temp.has(nk)) continue;
        let ok = true;
        for (let s = 1; s < gap; s++) if (temp.has(`${prev.x+d.dx*s},${prev.y+d.dy*s}`)) { ok = false; break; }
        if (!ok) continue;
        if (wouldBreakExisting(temp, nx, ny, cols, rows)) continue;
        prev.dir = dir;
        const newA = {x:nx,y:ny,dir:null,frozen:false};
        chain.push(newA);
        temp.set(nk, newA);
        placed = true;
        break outer;
      }
      if (!placed) { stuck = true; break; }
    }
    if (stuck || chain.length !== targetLen) continue;

    const last = chain[targetLen-1];
    const td = [...DK].sort(() => Math.random()-.5);
    let ok = false;
    for (const dir of td) {
      const d = DIRS[dir]; let x = last.x+d.dx, y = last.y+d.dy, hits = false;
      while (x>=0&&x<cols&&y>=0&&y<rows) { if (temp.has(`${x},${y}`)) { hits=true; break; } x+=d.dx; y+=d.dy; }
      if (!hits) { last.dir = dir; ok = true; break; }
    }
    if (!ok) last.dir = DK[Math.floor(Math.random()*4)];
    return chain;
  }
  return null;
}

function verifyChains(boardMap, chains, cols, rows) {
  for (const chain of chains) {
    const sk = keyOf(chain[0].x, chain[0].y);
    const cl = simulateChain(boardMap, sk, cols, rows);
    const exp = new Set(chain.map(a => keyOf(a.x, a.y)));
    if (cl.size !== exp.size) return false;
    for (const k of exp) if (!cl.has(k)) return false;
  }
  return true;
}

function assignFrozen(chains, maxPerChain, maxTotal = Infinity) {
  if (maxPerChain <= 0 || maxTotal <= 0) return;
  let frozenPlaced = 0;
  for (const chain of chains) {
    if (frozenPlaced >= maxTotal) break;
    if (chain.length <= 1) continue;
    const cand = chain.slice(1).sort(() => Math.random()-.5);
    const n = Math.min(maxPerChain, cand.length, maxTotal - frozenPlaced);
    for (let i = 0; i < n; i++) cand[i].frozen = true;
    frozenPlaced += n;
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
  chains.forEach(chain => {
    chain.forEach(cell => { board[keyOf(cell.x, cell.y)] = cell; });
  });

  return chains.some(chain =>
    chain.some(cell => {
      const hit = firstArrowHit(board, cell, cols, rows);
      return hit && hit.chainId !== cell.chainId;
    }),
  );
}

function insertDecoys(chains, cols, rows, decoyCount) {
  for (let count = 0; count < decoyCount; count++) {
    const linkPool = [];
    chains.forEach(chain => {
      for (let index = 0; index < chain.length - 1; index++) {
        const from = chain[index];
        const to = chain[index + 1];
        const between = rangeCells(from, to).filter(cell =>
          !chains.some(currentChain =>
            currentChain.some(occupied => occupied.x === cell.x && occupied.y === cell.y),
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
    link.chain.forEach((cell, idx) => { cell.chainIndex = idx; });

    if (hasCrossChainInterference(chains, cols, rows)) {
      link.chain.splice(link.index + 1, 1);
      from.dir = originalDir;
      link.chain.forEach((cell, idx) => { cell.chainIndex = idx; });
    }
  }
}

function traceChain(board, startCell, cols, rows) {
  const queue = [{ x: startCell.x, y: startCell.y, depth: 0 }];
  const seen = new Set();
  const sequence = [];

  while (queue.length) {
    const { x, y, depth } = queue.shift();
    const k = keyOf(x, y);
    if (seen.has(k) || !board[k] || board[k].state === "cleared") continue;

    seen.add(k);
    const current = board[k];
    sequence.push({ key: k, depth, x, y, dir: current.dir });

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
  sequence.forEach(step => { delete nextBoard[step.key]; });
  return nextBoard;
}

function boardStateKey(board, tapsLeft) {
  const cells = Object.values(board)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map(cell => `${cell.x},${cell.y},${cell.dir},${cell.frozen ? 1 : 0}`)
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

    const tappable = Object.values(currentBoard).filter(cell => !cell.frozen);
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
      .filter(cell => !cell.frozen)
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

function generateValidBoard(lv) {
  for (let a = 0; a < 60; a++) {
    const bm = new Map();
    const chains = [];
    let ok = true;
    for (let ci = 0; ci < lv.chainCount; ci++) {
      const len = lv.chainLenMin + Math.floor(Math.random() * (lv.chainLenMax - lv.chainLenMin + 1));
      const c = placeChain(bm, len, lv.cols, lv.rows, lv.gapMin, lv.gapMax);
      if (!c) { ok = false; break; }
      c.forEach((ar, index) => {
        ar.chainId = ci;
        ar.chainIndex = index;
        ar.decoy = false;
        bm.set(keyOf(ar.x, ar.y), ar);
      });
      chains.push(c);
    }
    if (!ok) continue;
    if (!verifyChains(bm, chains, lv.cols, lv.rows)) continue;
    if (lv.decoyCount > 0) {
      insertDecoys(chains, lv.cols, lv.rows, lv.decoyCount);
      if (hasCrossChainInterference(chains, lv.cols, lv.rows)) continue;
    }
    assignFrozen(chains, lv.frozenPerChain, lv.maxFrozenTotal);
    const board = {};
    chains.forEach(chain => {
      chain.forEach(cell => { board[keyOf(cell.x, cell.y)] = { ...cell, state: "idle" }; });
    });
    const taps = lv.chainCount + lv.bonus;
    if (!isSolvable(board, lv.cols, lv.rows, taps)) continue;
    const solution = findOptimalSolution(board, lv.cols, lv.rows, taps);
    const minTaps = solution?.length ?? lv.chainCount;
    return { board, taps, total: Object.keys(board).length, minTaps };
  }
  const board = {};
  for (let x=0; x<4; x++) board[`${x},0`] = { x, y:0, dir:"right", frozen:false, state:"idle" };
  return { board, taps:3, total:4, minTaps:1 };
}

/* ═══════════════════════════════════════════════════════
   TUTORIAL LEVELS — hardcoded to teach mechanics
   ═══════════════════════════════════════════════════════ */
const TUTORIAL = {
  1: {
    name: "TAP!", tagline: "Your first pop",
    instruction: "Tap the glowing arrow to pop it!",
    cols:4, rows:2, taps:1, minTaps:1, pointAt:"0,0", bonus:0,
    arrows: [
      { x:0, y:0, dir:"right", frozen:false },
      { x:3, y:0, dir:"left",  frozen:false },
    ],
  },
  2: {
    name: "CHAIN!", tagline: "One tap, many pops",
    instruction: "Each arrow triggers the next — one tap clears them all!",
    cols:4, rows:4, taps:1, minTaps:1, pointAt:"0,0", bonus:0,
    arrows: [
      { x:0, y:0, dir:"right", frozen:false },
      { x:3, y:0, dir:"down",  frozen:false },
      { x:3, y:3, dir:"left",  frozen:false },
      { x:0, y:3, dir:"up",    frozen:false },
    ],
  },
  3: {
    name: "TWO CHAINS", tagline: "Plan every tap",
    instruction: "Two separate chains — find both starting arrows!",
    cols:5, rows:4, taps:2, minTaps:2, pointAt:null, bonus:0,
    arrows: [
      { x:0, y:0, dir:"right", frozen:false },
      { x:2, y:0, dir:"down",  frozen:false },
      { x:4, y:2, dir:"left",  frozen:false },
      { x:0, y:2, dir:"down",  frozen:false },
      { x:0, y:3, dir:"right", frozen:false },
    ],
  },
  4: {
    name: "FROZEN!", tagline: "Break the ice",
    instruction: "Blue arrows are FROZEN — only chains can break them!",
    cols:5, rows:3, taps:1, minTaps:1, pointAt:"0,1", bonus:0,
    arrows: [
      { x:0, y:1, dir:"right", frozen:false },
      { x:2, y:1, dir:"up",    frozen:true  },
      { x:2, y:0, dir:"right", frozen:true  },
      { x:4, y:0, dir:"down",  frozen:false },
    ],
  },
};

const NAMED = [
  "INFERNO","NOVA","PULSAR","QUASAR","ECLIPSE","COMET","NEBULA","VORTEX",
  "GALAXY","APEX","ZENITH","INFINITY","STELLAR","COSMIC","ORACLE","VOID",
];

function getLevelInfo(level) {
  if (TUTORIAL[level]) return { ...TUTORIAL[level], isTutorial: true };

  const idx = level - 5; // first non-tutorial is level 5
  const nameIdx = idx % NAMED.length;
  const loop = Math.floor(idx / NAMED.length);
  const name = loop > 0 ? `${NAMED[nameIdx]} ${loop+1}` : NAMED[nameIdx];

  // Difficulty ramp: idx starts at 0 for level 5
  const tier = idx;
  const cols = Math.min(7, 5 + Math.floor(tier/3));
  const rows = Math.min(8, 5 + Math.floor(tier/2));
  const chainCount = Math.min(6, 2 + Math.floor(tier/2));
  const chainLenMin = 3;
  const chainLenMax = Math.max(3, 6 - Math.floor(tier/4));
  const frozenPerChain = tier < 8 ? 0 : 1;
  const maxFrozenTotal = tier < 8 ? 0 : tier < 20 ? 1 : 2;
  const decoyCount = Math.min(6, Math.max(0, Math.floor(tier / 2)));
  const bonus = tier < 2 ? 3 : tier < 5 ? 2 : 1;

  return {
    name, tagline: "Chain the arrows",
    cols, rows, chainCount, chainLenMin, chainLenMax,
    frozenPerChain, maxFrozenTotal, decoyCount, bonus,
    gapMin: 1,
    gapMax: Math.min(3, 2 + Math.floor(tier/8)),
    isTutorial: false,
  };
}

function getBoardForLevel(level) {
  const info = getLevelInfo(level);
  if (info.isTutorial) {
    const board = {};
    for (const a of info.arrows) board[`${a.x},${a.y}`] = { ...a, state:"idle" };
    return {
      board,
      taps: info.taps,
      total: info.arrows.length,
      minTaps: info.minTaps,
      cols: info.cols,
      rows: info.rows,
      instruction: info.instruction,
      pointAt: info.pointAt,
      isTutorial: true,
    };
  }
  const r = generateValidBoard(info);
  return { ...r, cols: info.cols, rows: info.rows, isTutorial: false };
}

/* ═══════════════════════════════════════════════════════
   PALETTE
   ═══════════════════════════════════════════════════════ */
const PAL = {
  up:    { main:"#22c55e", rgb:"34,197,94",   light:"#86efac", dark:"#15803d" },
  right: { main:"#f59e0b", rgb:"245,158,11",  light:"#fcd34d", dark:"#b45309" },
  down:  { main:"#ec4899", rgb:"236,72,153",  light:"#f9a8d4", dark:"#be185d" },
  left:  { main:"#8b5cf6", rgb:"139,92,246",  light:"#c4b5fd", dark:"#6d28d9" },
};
const DIR_COLORS = Object.values(PAL).map(p => p.main);

/* ═══════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════ */
function Cell({ cell, size, onTap, disabled, shaking }) {
  const p = PAL[cell.dir];
  const d = DIRS[cell.dir];
  const gone = cell.state === "cleared";
  const lit = cell.state === "firing";
  const frozen = cell.frozen && cell.state === "idle";
  const pulseMe = cell.tutorialHint; // for tutorial pulsing

  return (
    <div onClick={() => !disabled && !gone && onTap(cell)}
      style={{
        position:"absolute", left:cell.x*size, top:cell.y*size,
        width:size, height:size, padding:size*.07,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor: gone ? "default" : "pointer",
        opacity: gone ? 0 : 1,
        transform: gone ? "scale(0) rotate(180deg)" : lit ? "scale(1.22)" : "scale(1)",
        transition: gone ? "all .5s cubic-bezier(.68,-0.55,.27,1.55)"
          : lit ? "transform .15s cubic-bezier(.34,1.56,.64,1)"
          : "transform .1s ease-out",
        zIndex: lit ? 10 : pulseMe ? 6 : 1,
      }}>
      <div style={{
        width:"100%", height:"100%",
        borderRadius: size*.28,
        background: lit
          ? `radial-gradient(circle at 50% 40%, #fff 0%, ${p.light} 40%, ${p.main} 100%)`
          : frozen
          ? "linear-gradient(145deg, #dbeafe 0%, #93c5fd 70%, #3b82f6 100%)"
          : `linear-gradient(145deg, ${p.light} 0%, ${p.main} 60%, ${p.dark} 100%)`,
        border: `2.5px solid ${lit ? "#fff" : frozen ? "#1e40af" : p.dark}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative", overflow:"hidden",
        boxShadow: lit
          ? `0 0 ${size*.7}px ${p.main}, 0 8px 20px rgba(0,0,0,.25), inset 0 -4px 0 rgba(0,0,0,.15), inset 0 4px 0 rgba(255,255,255,.4)`
          : frozen
          ? `0 4px 0 #1e40af, 0 6px 12px rgba(30,64,175,.25), inset 0 -2px 0 rgba(0,0,0,.1), inset 0 2px 0 rgba(255,255,255,.5)`
          : `0 4px 0 ${p.dark}, 0 6px 12px rgba(0,0,0,.15), inset 0 -2px 0 rgba(0,0,0,.1), inset 0 2px 0 rgba(255,255,255,.4)`,
        transition:"all .15s ease",
        animation: shaking ? "cellShake .4s ease" : pulseMe && !gone ? "cellPulse 1.2s ease-in-out infinite" : "none",
      }}>
        {/* Gloss */}
        <div style={{
          position:"absolute", top:"8%", left:"15%", right:"15%", height:"25%",
          borderRadius:"50%",
          background:"linear-gradient(180deg, rgba(255,255,255,.65) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents:"none", filter:"blur(2px)",
        }}/>

        {/* Frozen overlay */}
        {frozen && (
          <>
            <div style={{
              position:"absolute", inset:0, opacity:.35,
              background:"repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(255,255,255,.7) 4px, rgba(255,255,255,.7) 5px)",
            }}/>
            <div style={{
              position:"absolute", top:3, right:3,
              filter:"drop-shadow(0 1px 1px rgba(0,0,0,.3))",
            }}>
              <I.Snow s={size*.24} c="#fff"/>
            </div>
          </>
        )}

        {/* Arrow icon */}
        <div style={{
          transform:`rotate(${d.rot}deg)`,
          transition:"transform .12s",
          opacity: frozen ? .75 : 1,
          filter: lit ? "drop-shadow(0 0 8px #fff)" : "drop-shadow(0 2px 2px rgba(0,0,0,.3))",
          zIndex:2,
        }}>
          <I.Arrow s={size*.52} c={lit ? "#fff" : frozen ? "#1e3a8a" : "#fff"}/>
        </div>
      </div>
    </div>
  );
}

function Burst({ x, y, color }) {
  const parts = useMemo(() => Array.from({length:14}, (_,i) => {
    const a = (i/14)*Math.PI*2 + Math.random()*.5;
    const r = 20 + Math.random()*40;
    return { tx:Math.cos(a)*r, ty:Math.sin(a)*r, s:3+Math.random()*5, delay:Math.random()*.05 };
  }), []);
  return <>{parts.map((p,i) => (
    <div key={i} style={{
      position:"absolute", left:x-p.s/2, top:y-p.s/2,
      width:p.s, height:p.s, borderRadius:"50%",
      background:`radial-gradient(circle, #fff 0%, ${color} 50%, transparent 80%)`,
      opacity:0, pointerEvents:"none",
      animation:`burstp .6s ${p.delay}s ease-out forwards`,
      "--tx":`${p.tx}px`, "--ty":`${p.ty}px`,
      boxShadow:`0 0 8px ${color}`,
    }}/>
  ))}</>;
}

function Confetti() {
  const pieces = useMemo(() => Array.from({length:60}, (_,i) => ({
    left: Math.random()*100, delay: Math.random()*.8,
    duration: 2.5 + Math.random()*1.5,
    color: DIR_COLORS[Math.floor(Math.random()*4)],
    rot: Math.random()*360,
    size: 8 + Math.random()*8,
    drift: (Math.random()-.5)*150,
    shape: i % 3,
  })), []);
  return (
    <div style={{position:"fixed", inset:0, pointerEvents:"none", zIndex:999, overflow:"hidden"}}>
      {pieces.map((p,i) => (
        <div key={i} style={{
          position:"absolute", top:-20, left:`${p.left}%`,
          width:p.size, height:p.size*(p.shape===1?.5:1), background:p.color,
          borderRadius: p.shape===0 ? "50%" : p.shape===1 ? "2px" : "30%",
          transform:`rotate(${p.rot}deg)`,
          animation:`confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
          "--drift": `${p.drift}px`,
          boxShadow:"0 2px 4px rgba(0,0,0,.2)",
        }}/>
      ))}
    </div>
  );
}

function StarRow({ stars, size = 28, animate = true }) {
  return (
    <div style={{display:"flex", gap:6}}>
      {[1,2,3].map(n => {
        const filled = n <= stars;
        return (
          <div key={n} style={{
            width:size, height:size, display:"flex",
            alignItems:"center", justifyContent:"center",
            animation: animate && filled ? `starpop .4s ${n*0.2}s ease-out both` : "none",
            opacity: animate && !filled ? .25 : filled ? 1 : .25,
            filter: filled ? "drop-shadow(0 2px 6px rgba(245,158,11,.5))" : "none",
          }}>
            <I.Star s={size} filled={filled}/>
          </div>
        );
      })}
    </div>
  );
}

function calcStars(used, min) {
  if (used <= min) return 3;
  if (used === min + 1) return 2;
  return 1;
}

/* Level node badge for the map */
function LevelNode({ level, status, stars = 0, size = 80 }) {
  const colorIdx = (level - 1) % 4;
  const p = Object.values(PAL)[colorIdx];
  const locked = status === "locked";
  const current = status === "current";
  const done = status === "completed";

  return (
    <div style={{
      position:"relative", width:size, height:size,
      animation: current ? "breathe 2.5s ease-in-out infinite" : "none",
    }}>
      {current && (
        <div style={{
          position:"absolute", inset:-12, borderRadius:"50%",
          background:`radial-gradient(circle, ${p.main}66 0%, transparent 70%)`,
          animation:"pulseGlow 2s ease-in-out infinite",
          pointerEvents:"none",
        }}/>
      )}
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        background: locked
          ? "linear-gradient(145deg, #e2e8f0 0%, #94a3b8 100%)"
          : `linear-gradient(145deg, ${p.light} 0%, ${p.main} 55%, ${p.dark} 100%)`,
        border:`3.5px solid ${locked ? "#64748b" : "#fff"}`,
        boxShadow: locked
          ? `0 5px 0 #475569, 0 7px 12px rgba(0,0,0,.15), inset 0 -3px 0 rgba(0,0,0,.15)`
          : `0 5px 0 ${p.dark}, 0 8px 16px rgba(0,0,0,.22), inset 0 -3px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.4)`,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        color:"#fff", overflow:"hidden",
      }}>
        {/* Gloss */}
        <div style={{
          position:"absolute", top:"10%", left:"20%", right:"20%", height:"25%",
          borderRadius:"50%",
          background:"linear-gradient(180deg, rgba(255,255,255,.7) 0%, rgba(255,255,255,0) 100%)",
          filter:"blur(3px)", pointerEvents:"none",
        }}/>
        {locked ? (
          <I.Lock s={size*.4} c="#fff"/>
        ) : (
          <>
            <div style={{
              fontFamily:"'Baloo 2', sans-serif", fontWeight:900,
              fontSize: size*.42, lineHeight:1,
              textShadow:"0 2px 4px rgba(0,0,0,.3)",
              letterSpacing:"-1px",
            }}>{level}</div>
            {done && stars > 0 && (
              <div style={{marginTop:3}}>
                <StarRow stars={stars} size={size*.14} animate={false}/>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
export default function ArrowsGame() {
  const [level, setLevel] = useState(1);
  const [starsMap, setStarsMap] = useState({});
  const [bestScores, setBestScores] = useState({});
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [board, setBoard] = useState({});
  const [taps, setTaps] = useState(0);
  const [total, setTotal] = useState(0);
  const [minTaps, setMinTaps] = useState(0);
  const [curCols, setCurCols] = useState(5);
  const [curRows, setCurRows] = useState(5);
  const [isTutorial, setIsTutorial] = useState(false);
  const [tutorialText, setTutorialText] = useState("");
  const [pointAt, setPointAt] = useState(null);
  const [screen, setScreen] = useState("splash"); // splash | map | generating | playing | win | lose
  const [busy, setBusy] = useState(false);
  const [parts, setParts] = useState([]);
  const [trails, setTrails] = useState([]);
  const [cmb, setCmb] = useState(null);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [shakeCell, setShakeCell] = useState(null);
  const [toast, setToast] = useState(null);
  const [winStars, setWinStars] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mapMarkerUp, setMapMarkerUp] = useState(false); // level-up animation

  const boardRef = useRef(null);
  const pid = useRef(0);
  const tid = useRef(0);
  const tapsUsedRef = useRef(0);

  const info = useMemo(() => getLevelInfo(level), [level]);

  // Load progress
  useEffect(() => {
    const saved = storage.load();
    if (saved) {
      setLevel(START_LEVEL_OVERRIDE ?? (saved.level || DEFAULT_LEVEL));
      setStarsMap(saved.starsMap || {});
      setBestScores(saved.bestScores || {});
      if (typeof saved.soundOn === "boolean") setSoundOn(saved.soundOn);
      if (typeof saved.hapticsOn === "boolean") setHapticsOn(saved.hapticsOn);
    } else {
      setLevel(DEFAULT_LEVEL);
    }
    setLoaded(true);
  }, []);

  // Save progress
  useEffect(() => {
    if (!loaded) return;
    storage.save({ level, starsMap, bestScores, soundOn, hapticsOn });
  }, [level, starsMap, bestScores, soundOn, hapticsOn, loaded]);

  useEffect(() => { sfx.on = soundOn; }, [soundOn]);

  const vib = useCallback((ms) => { if (hapticsOn) buzz(ms); }, [hapticsOn]);

  const startLevel = useCallback((lvNum) => {
    sfx.init();
    sfx.click();
    vib(8);
    setScreen("generating");
    setLevel(lvNum);
    setTimeout(() => {
      const r = getBoardForLevel(lvNum);
      setBoard(r.board);
      setTaps(r.taps);
      setTotal(r.total);
      setMinTaps(r.minTaps);
      setCurCols(r.cols);
      setCurRows(r.rows);
      setIsTutorial(r.isTutorial);
      setTutorialText(r.instruction || "");
      setPointAt(r.pointAt || null);
      setScreen("playing");
      setBusy(false);
      setParts([]);
      setTrails([]);
      setCmb(null);
      setScore(0);
      setShake(false);
      setShakeCell(null);
      setToast(null);
      tapsUsedRef.current = 0;
    }, 350);
  }, [vib]);

  const addBurst = useCallback((cx, cy, color) => {
    const id = pid.current++;
    setParts(p => [...p, {id,x:cx,y:cy,color}]);
    setTimeout(() => setParts(p => p.filter(pp => pp.id !== id)), 700);
  }, []);

  const addTrail = useCallback((x1,y1,x2,y2,color,delay) => {
    const id = tid.current++;
    setTrails(t => [...t, {id,x1,y1,x2,y2,color,delay}]);
    setTimeout(() => setTrails(t => t.filter(tt => tt.id !== id)), (delay+.7)*1000);
  }, []);

  const showToast = useCallback((text, sub, variant = "info") => {
    const k = Date.now();
    setToast({ text, sub, variant, k });
    setTimeout(() => setToast(t => (t && t.k === k) ? null : t), 2000);
  }, []);

  const handleTap = useCallback((cell) => {
    if (busy || screen !== "playing" || taps <= 0) return;

    // FROZEN FEEDBACK
    if (cell.frozen && cell.state === "idle") {
      setShakeCell(`${cell.x},${cell.y}`);
      setTimeout(() => setShakeCell(null), 400);
      showToast("Can't tap frozen arrows!", "Break them with chain reactions", "frozen");
      sfx.nope();
      vib(20);
      return;
    }

    setBusy(true);
    setTaps(t => t - 1);
    tapsUsedRef.current += 1;
    sfx.tap();
    vib(8);

    const aliveMap = new Map();
    Object.entries(board).forEach(([k,v]) => {
      if (v.state !== "cleared") aliveMap.set(k, v);
    });

    const startKey = `${cell.x},${cell.y}`;
    const depthMap = new Map();
    const dq = [{key:startKey, depth:0}];
    const dvis = new Set();

    while (dq.length > 0) {
      const {key, depth} = dq.shift();
      if (dvis.has(key) || !aliveMap.has(key)) continue;
      dvis.add(key);
      depthMap.set(key, depth);
      const c = aliveMap.get(key);
      const d = DIRS[c.dir];
      let nx = c.x+d.dx, ny = c.y+d.dy;
      while (nx>=0 && nx<curCols && ny>=0 && ny<curRows) {
        const nk = `${nx},${ny}`;
        if (aliveMap.has(nk) && !dvis.has(nk)) { dq.push({key:nk, depth:depth+1}); break; }
        nx += d.dx; ny += d.dy;
      }
    }

    const csz = boardRef.current ? boardRef.current.getBoundingClientRect().width / curCols : 44;
    const h = csz/2;
    let maxD = 0;
    const seq = [...depthMap.entries()].map(([k, depth]) => {
      const c = aliveMap.get(k);
      if (depth > maxD) maxD = depth;
      return { k, depth, x:c.x, y:c.y, dir:c.dir };
    });

    seq.forEach(({k,depth,x,y,dir}) => {
      const delay = depth * 115;
      setTimeout(() => {
        setBoard(p => { const n = {...p}; if (n[k]) n[k] = {...n[k], state:"firing"}; return n; });
        sfx.hit(depth);
      }, delay);
      setTimeout(() => {
        setBoard(p => { const n = {...p}; if (n[k]) n[k] = {...n[k], state:"cleared"}; return n; });
        sfx.pop(depth);
        addBurst(x*csz + h, y*csz + h, PAL[dir].main);
        setScore(s => s + (depth+1)*25);
      }, delay + 150);
    });

    seq.forEach(({x,y,dir,depth}) => {
      const next = seq.find(s => s.depth === depth + 1);
      if (next) addTrail(x*csz+h, y*csz+h, next.x*csz+h, next.y*csz+h, PAL[dir].main, depth*.12);
    });

    if (maxD >= 2) {
      setTimeout(() => {
        sfx.combo(maxD);
        vib(22);
        setCmb({v:seq.length, k:Date.now()});
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setTimeout(() => setCmb(null), 900);
      }, maxD*115 + 80);
    }

    const newTaps = taps - 1;
    const totalTime = seq.length > 0 ? maxD*115 + 600 : 250;

    setTimeout(() => {
      setBusy(false);
      setBoard(prev => {
        const rem = Object.values(prev).filter(c => c.state !== "cleared").length;
        if (rem === 0) {
          setTimeout(() => {
            const s = calcStars(tapsUsedRef.current, minTaps);
            setWinStars(s);
            const prevBest = bestScores[level] || 0;
            setIsNewBest(score > prevBest);
            setBestScores(b => ({...b, [level]: Math.max(prevBest, score)}));
            setStarsMap(m => ({...m, [level]: Math.max(m[level] || 0, s)}));
            setScreen("win");
            sfx.win(s);
            vib(40);
          }, 150);
        } else if (newTaps <= 0) {
          setTimeout(() => { setScreen("lose"); sfx.lose(); }, 150);
        }
        return prev;
      });
    }, totalTime);
  }, [board, busy, screen, taps, curCols, curRows, minTaps, score, bestScores, level, vib, addBurst, addTrail, showToast]);

  const continueFromWin = useCallback(() => {
    sfx.click(); vib(10);
    setScreen("map");
    // Trigger marker-up animation on map
    setTimeout(() => {
      setMapMarkerUp(true);
      sfx.levelUp();
      vib(30);
      setTimeout(() => {
        setLevel(l => l + 1);
        setMapMarkerUp(false);
      }, 850);
    }, 400);
  }, [vib]);

  const goToMap = useCallback(() => { sfx.click(); vib(8); setScreen("map"); }, [vib]);

  const resetAll = useCallback(() => {
    storage.clear();
    setLevel(DEFAULT_LEVEL);
    setStarsMap({});
    setBestScores({});
    setShowResetConfirm(false);
    setShowSettings(false);
    setScreen("map");
    vib(20);
  }, [vib]);

  const rem = Object.values(board).filter(c => c.state !== "cleared").length;
  const frozenLeft = Object.values(board).filter(c => c.state !== "cleared" && c.frozen).length;
  const isNarrow = typeof window !== "undefined" ? window.innerWidth <= 420 : true;

  const csz = useMemo(() => {
    if (screen !== "playing") return 44;
    const mw = Math.min(window.innerWidth - (isNarrow ? 16 : 24), 420);
    const mh = window.innerHeight * (isNarrow ? 0.5 : 0.44);
    return Math.max(36, Math.floor(Math.min(mw/curCols, mh/curRows)));
  }, [screen, curCols, curRows, isNarrow]);
  const bw = curCols * csz;
  const bh = curRows * csz;
  const totalStars = Object.values(starsMap).reduce((a,b) => a+b, 0);

  // Show tutorial pointer above this cell
  const pointerCell = (isTutorial && pointAt && tapsUsedRef.current === 0)
    ? pointAt.split(",").map(Number) : null;

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg, #fef3c7 0%, #fde68a 15%, #fbcfe8 45%, #c4b5fd 80%, #a78bfa 100%)",
      color:"#1e1b4b",
      fontFamily:"'Nunito', sans-serif",
      display:"flex", flexDirection:"column", alignItems:"center",
      overflow:"hidden", userSelect:"none", WebkitUserSelect:"none",
      touchAction:"manipulation", position:"relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&family=Fredoka:wght@500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        body { background:#fef3c7; overflow-x:hidden; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes burstp { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)} }
        @keyframes tflash { 0%{opacity:.8} 100%{opacity:0} }
        @keyframes cpop { 0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-10deg)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1.5) rotate(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.2) rotate(5deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes confetti-fall { 0%{transform:translateY(0) translateX(0) rotate(0)} 100%{transform:translateY(110vh) translateX(var(--drift)) rotate(720deg);opacity:0} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes starpop { 0%{transform:scale(0) rotate(-180deg);opacity:0} 70%{transform:scale(1.3) rotate(0);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes bounceIn { 0%{transform:scale(.3);opacity:0} 50%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes pulseGlow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes cloudDrift { from{transform:translateX(-120px)} to{transform:translateX(calc(100vw + 120px))} }
        @keyframes popIn { 0%{opacity:0;transform:scale(.5)} 60%{opacity:1;transform:scale(1.1)} 100%{transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { 0%{opacity:0;transform:scale(.7)} 100%{opacity:1;transform:scale(1)} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0) rotate(0)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        @keyframes cellShake { 0%,100%{transform:scale(1) translateX(0)} 25%{transform:scale(1.06) translateX(-5px)} 50%{transform:scale(1.06) translateX(5px)} 75%{transform:scale(1.06) translateX(-3px)} }
        @keyframes cellPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.08);filter:brightness(1.15)} }
        @keyframes pointerBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes markerUp { from{transform:translateY(0)} to{transform:translateY(-140px)} }
        @keyframes wiggle { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }

        .btn { transition:transform .15s cubic-bezier(.34,1.56,.64,1), filter .2s; }
        .btn:active { transform:scale(.93)!important; filter:brightness(.92); }
      `}</style>

      {/* Ambient clouds */}
      <div style={{position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden"}}>
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{
            position:"absolute", top:`${8+i*18}%`, left:-120,
            width:80+Math.random()*60, height:40+Math.random()*20,
            background:"rgba(255,255,255,.75)",
            borderRadius:"50%", filter:"blur(2px)",
            animation:`cloudDrift ${30+i*10}s ${i*5}s linear infinite`,
            opacity:.6+Math.random()*.3,
          }}/>
        ))}
        {[...Array(12)].map((_,i) => (
          <div key={`s${i}`} style={{
            position:"absolute",
            left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
            opacity:0, animation:`sparkle ${2+Math.random()*3}s ${Math.random()*4}s ease-in-out infinite`,
          }}>
            <I.Sparkle s={14} c="#fff"/>
          </div>
        ))}
      </div>

      {/* ═══════ SPLASH ═══════ */}
      {loaded && screen === "splash" && (
        <div style={{
          minHeight:"100vh", width:"100%", maxWidth:480,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"2rem 1.5rem", animation:"fadeIn .5s ease",
        }}>
          <div style={{display:"flex", gap:8, marginBottom:20, animation:"bounceIn .8s ease"}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width:52, height:52, borderRadius:14,
                background:`linear-gradient(145deg, ${Object.values(PAL)[i].light}, ${DIR_COLORS[i]}, ${Object.values(PAL)[i].dark})`,
                boxShadow:`0 6px 0 ${Object.values(PAL)[i].dark}, 0 8px 16px rgba(0,0,0,.2), inset 0 -3px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.5)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                animation:`float 3s ${i*.2}s ease-in-out infinite`,
                transform:`rotate(${[0,90,180,270][i]}deg)`,
              }}>
                <I.Arrow s={30} c="#fff"/>
              </div>
            ))}
          </div>

          <h1 style={{
            fontFamily:"'Baloo 2', sans-serif", fontSize:"4rem", fontWeight:800,
            letterSpacing:"-2px", lineHeight:1,
            background:"linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #8b5cf6 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginBottom:4,
            filter:"drop-shadow(0 4px 8px rgba(236,72,153,.3))",
          }}>Arrows!</h1>
          <p style={{
            fontSize:"1rem", color:"#7c3aed", fontWeight:700,
            marginBottom:"2.5rem",
            fontFamily:"'Fredoka', sans-serif",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <I.Sparkle s={16} c="#f59e0b"/>
            chain reaction puzzles
            <I.Sparkle s={16} c="#f59e0b"/>
          </p>

          <button onClick={() => { sfx.init(); sfx.click(); vib(10); setScreen("map"); }} className="btn"
            style={{
              background:"linear-gradient(145deg, #fbbf24 0%, #f59e0b 60%, #b45309 100%)",
              color:"#fff", fontFamily:"'Baloo 2', sans-serif",
              fontSize:"1.4rem", fontWeight:800,
              padding:"18px 52px",
              border:"3px solid #fff", borderRadius:20,
              boxShadow:"0 6px 0 #b45309, 0 10px 20px rgba(180,83,9,.4), inset 0 -3px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.4)",
              cursor:"pointer", letterSpacing:"1px",
              textShadow:"0 2px 4px rgba(0,0,0,.25)",
              animation:"breathe 2s ease-in-out infinite",
              display:"flex", alignItems:"center", gap:10,
            }}>
            <I.Play s={22}/> {level > 1 ? `CONTINUE · LV ${level}` : "START GAME"}
          </button>

          {totalStars > 0 && (
            <div style={{
              marginTop:"2rem", display:"flex", gap:10, alignItems:"center",
              background:"rgba(255,255,255,.7)", padding:"10px 20px",
              borderRadius:16, border:"2px solid #fff",
              boxShadow:"0 4px 12px rgba(0,0,0,.08)",
            }}>
              <I.Star s={22}/>
              <span style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:700, color:"#92400e", fontSize:"1.1rem"}}>{totalStars} stars</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════ MAP ═══════ */}
      {loaded && screen === "map" && (
        <div style={{
          minHeight:"100vh", width:"100%", maxWidth:440,
          display:"flex", flexDirection:"column",
          padding:"1.25rem 1.25rem 2rem",
          animation:"fadeIn .5s ease",
          position:"relative",
        }}>
          {/* Header */}
          <div style={{
            display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:14,
          }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background:"rgba(255,255,255,.85)",
              padding:"8px 16px", borderRadius:20,
              border:"2px solid #fff",
              boxShadow:"0 4px 12px rgba(0,0,0,.1)",
            }}>
              <I.Star s={20}/>
              <span style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#92400e"}}>{totalStars}</span>
            </div>
            <div style={{
              fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
              fontSize:"1.3rem",
              background:"linear-gradient(135deg, #ec4899, #8b5cf6)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              letterSpacing:"0.5px",
            }}>JOURNEY</div>
            <button onClick={() => { sfx.click(); vib(8); setShowSettings(true); }} className="btn"
              style={{
                background:"linear-gradient(145deg, #fff, #f3f4f6)",
                border:"2px solid #fff", borderRadius:"50%",
                width:42, height:42,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 0 #9ca3af, 0 6px 12px rgba(0,0,0,.15)",
                cursor:"pointer",
              }}>
              <I.Gear s={22}/>
            </button>
          </div>

          <div style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            position:"relative", padding:"1rem 0",
          }}>
            {/* Upcoming level (N+1) */}
            <div style={{animation:"slideUp .4s .1s ease both", marginBottom:6}}>
              <LevelNode level={level+1} status="locked" size={54}/>
            </div>
            {/* Dashed connector */}
            <div style={{
              width:4, height:30,
              background:"repeating-linear-gradient(180deg, rgba(255,255,255,.7) 0 5px, transparent 5px 10px)",
              marginBottom:6,
              animation:"slideUp .4s .15s ease both",
            }}/>

            {/* Marker + current level container */}
            <div style={{
              position:"relative", animation:"slideUp .4s .2s ease both",
            }}>
              {/* Marker character */}
              <div style={{
                position:"absolute",
                top:-56, left:"50%",
                transform:"translateX(-50%)",
                zIndex:5,
                animation: mapMarkerUp
                  ? "markerUp .85s cubic-bezier(.34,1.56,.64,1) forwards"
                  : "float 2.2s ease-in-out infinite",
                filter:"drop-shadow(0 4px 6px rgba(0,0,0,.2))",
              }}>
                <MarkerBlob s={48}/>
              </div>
              {/* Current level badge */}
              <LevelNode level={level} status="current" size={120}/>
            </div>

            {/* Info card */}
            <div style={{
              marginTop:18, marginBottom:18,
              background:"rgba(255,255,255,.92)",
              padding:"14px 22px", borderRadius:18,
              border:"3px solid #fff",
              boxShadow:"0 6px 16px rgba(0,0,0,.12)",
              textAlign:"center",
              animation:"slideUp .4s .3s ease both",
              minWidth:240,
            }}>
              <div style={{
                fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
                fontSize:"1.4rem", lineHeight:1,
                color: DIR_COLORS[(level-1) % 4],
                letterSpacing:"-0.5px",
              }}>{info.name}</div>
              <div style={{
                fontSize:".82rem", color:"#6b21a8",
                fontFamily:"'Fredoka', sans-serif",
                fontWeight:500, marginTop:3,
              }}>{info.tagline}</div>
              {!info.isTutorial && (
                <div style={{marginTop:6, fontSize:".68rem", color:"#9333ea", fontWeight:700, letterSpacing:"1px"}}>
                  {info.cols}×{info.rows} · {info.chainCount} chains · {info.chainCount + info.bonus} taps
                </div>
              )}
              {info.isTutorial && (
                <div style={{
                  marginTop:6, fontSize:".68rem", fontWeight:700,
                  color:"#fff",
                  background:"linear-gradient(135deg, #f59e0b, #ec4899)",
                  padding:"2px 10px", borderRadius:10,
                  display:"inline-block", letterSpacing:"1px",
                }}>✨ TUTORIAL</div>
              )}
            </div>

            {/* Play button */}
            <button onClick={() => startLevel(level)} className="btn"
              style={{
                background:"linear-gradient(145deg, #10b981 0%, #059669 55%, #047857 100%)",
                color:"#fff", fontFamily:"'Baloo 2', sans-serif",
                fontSize:"1.5rem", fontWeight:800,
                padding:"18px 56px",
                border:"4px solid #fff", borderRadius:22,
                boxShadow:"0 6px 0 #047857, 0 12px 20px rgba(4,120,87,.35), inset 0 -3px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.4)",
                cursor:"pointer", letterSpacing:"2px",
                textShadow:"0 2px 4px rgba(0,0,0,.3)",
                animation:"breathe 1.8s ease-in-out infinite, slideUp .4s .4s ease both",
                display:"flex", alignItems:"center", gap:10,
              }}>
              <I.Play s={22}/> PLAY
            </button>

            {/* Connector down */}
            <div style={{
              width:4, height:30, marginTop:18,
              background:"repeating-linear-gradient(180deg, rgba(255,255,255,.7) 0 5px, transparent 5px 10px)",
              animation:"slideUp .4s .5s ease both",
            }}/>

            {/* Past level (N-1) */}
            {level > 1 && (
              <div style={{marginTop:6, animation:"slideUp .4s .55s ease both"}}>
                <LevelNode level={level-1} status="completed" stars={starsMap[level-1] || 0} size={62}/>
              </div>
            )}
            {level === 1 && (
              <div style={{
                marginTop:8,
                fontSize:".65rem", color:"#7c3aed",
                fontFamily:"'Fredoka', sans-serif", fontWeight:600,
                letterSpacing:"2px", opacity:.6,
              }}>START OF JOURNEY</div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ GENERATING ═══════ */}
      {screen === "generating" && (
        <div style={{
          position:"fixed", inset:0,
          background:"linear-gradient(180deg, rgba(254,243,199,.96) 0%, rgba(196,181,253,.96) 100%)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", zIndex:200,
          animation:"fadeIn .2s ease",
        }}>
          <div style={{
            width:60, height:60,
            border:"5px solid rgba(139,92,246,.2)",
            borderTop:"5px solid #8b5cf6",
            borderRadius:"50%",
            animation:"spin .6s linear infinite",
            marginBottom:20,
          }}/>
          <div style={{fontFamily:"'Baloo 2', sans-serif", fontSize:"1.3rem", color:"#6d28d9", fontWeight:700}}>
            building your puzzle…
          </div>
        </div>
      )}

      {/* ═══════ PLAYING ═══════ */}
      {screen === "playing" && (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          width:"100%", maxWidth:440, padding:isNarrow ? "8px 8px 12px" : "10px 12px 0",
          animation:"fadeIn .3s ease", position:"relative",
        }}>
          {/* Top bar */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            width:"100%", marginBottom:isNarrow ? 8 : 10, gap:isNarrow ? 6 : 8,
          }}>
            <button onClick={goToMap} className="btn"
              style={{
                background:"linear-gradient(145deg, #fff, #f3f4f6)",
                border:"2px solid #fff", borderRadius:12,
                padding:isNarrow ? "8px 10px" : "8px 14px", color:"#6b21a8",
                fontFamily:"'Baloo 2', sans-serif",
                fontSize:".75rem", fontWeight:700,
                cursor:"pointer", letterSpacing:"1px",
                boxShadow:"0 4px 0 #9ca3af, 0 6px 10px rgba(0,0,0,.15)",
                display:"flex", alignItems:"center", gap:4,
              }}>
              <I.Chevron s={16}/> MAP
            </button>
            <div style={{
              background:"rgba(255,255,255,.9)", padding:isNarrow ? "6px 10px" : "6px 14px",
              borderRadius:14, border:"2px solid #fff",
              boxShadow:"0 3px 8px rgba(0,0,0,.1)",
              display:"flex", alignItems:"center", gap:6,
              minWidth:0, flex:1, justifyContent:"center",
            }}>
              <span style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:isNarrow ? ".9rem" : "1rem", color:"#7c3aed", flexShrink:0}}>LEVEL {level}</span>
              <span style={{
                fontFamily:"'Baloo 2', sans-serif", fontWeight:700,
                fontSize:isNarrow ? ".84rem" : ".92rem", color:DIR_COLORS[(level-1)%4],
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>{info.name}</span>
            </div>
            <div style={{display:"flex", gap:6, flexShrink:0}}>
              <button onClick={() => { sfx.click(); vib(8); startLevel(level); }} className="btn"
                style={{
                  background:"linear-gradient(145deg, #fff, #f3f4f6)",
                  border:"2px solid #fff", borderRadius:12,
                  padding:"8px 10px", cursor:"pointer",
                  boxShadow:"0 4px 0 #9ca3af, 0 6px 10px rgba(0,0,0,.15)",
                  display:"flex", alignItems:"center",
                }}>
                <I.Refresh s={18}/>
              </button>
              <button onClick={() => { sfx.click(); vib(8); setShowSettings(true); }} className="btn"
                style={{
                  background:"linear-gradient(145deg, #fff, #f3f4f6)",
                  border:"2px solid #fff", borderRadius:12,
                  padding:"8px 10px", cursor:"pointer",
                  boxShadow:"0 4px 0 #9ca3af, 0 6px 10px rgba(0,0,0,.15)",
                  display:"flex", alignItems:"center",
                }}>
                <I.Gear s={18}/>
              </button>
            </div>
          </div>

          {/* TUTORIAL BANNER */}
          {isTutorial && tutorialText && (
            <div style={{
              width:"100%", marginBottom:isNarrow ? 8 : 10,
              background:"linear-gradient(135deg, #fbbf24, #ec4899)",
              padding:isNarrow ? "10px 12px" : "12px 16px",
              borderRadius:16, border:"3px solid #fff",
              boxShadow:"0 4px 12px rgba(0,0,0,.15)",
              color:"#fff",
              fontFamily:"'Baloo 2', sans-serif", fontWeight:700,
              fontSize:isNarrow ? ".8rem" : ".85rem",
              display:"flex", alignItems:"center", gap:10,
              animation:"popIn .5s ease both",
              textShadow:"0 1px 2px rgba(0,0,0,.25)",
            }}>
              <I.Bulb s={22} c="#fef3c7"/>
              <span style={{flex:1, lineHeight:1.4}}>{tutorialText}</span>
            </div>
          )}

          {/* Stats */}
          <div style={{
            display:"grid",
            gridTemplateColumns: isNarrow ? "repeat(3, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
            gap:isNarrow ? 8 : 0, marginBottom:isNarrow ? 8 : 10, width:"100%",
            background:"rgba(255,255,255,.9)",
            borderRadius:18, border:"3px solid #fff",
            boxShadow:"0 4px 12px rgba(0,0,0,.12)",
            padding:isNarrow ? "10px" : "12px 0",
          }}>
            {[
              { l:"TAPS",  v:taps, c: taps <= 1 ? "#ef4444" : taps <= 2 ? "#f59e0b" : "#10b981" },
              { l:"LEFT",  v:rem,  c:"#f59e0b" },
              { l:"SCORE", v:score, c:"#8b5cf6" },
            ].map(({l:label,v,c},i,a) => (
              <div key={label} style={{
                flex:1, textAlign:"center",
                borderRight: !isNarrow && i < a.length-1 ? "2px solid rgba(0,0,0,.06)" : "none",
                background:isNarrow ? "rgba(255,255,255,.55)" : "transparent",
                borderRadius:isNarrow ? 14 : 0,
                padding:isNarrow ? "8px 4px" : 0,
              }}>
                <div style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:isNarrow ? "1.35rem" : "1.55rem", color:c, lineHeight:1, transition:"color .3s"}}>{v}</div>
                <div style={{fontSize:isNarrow ? ".54rem" : ".58rem", color:"#6b21a8", fontFamily:"'Fredoka', sans-serif", letterSpacing:"1.5px", marginTop:4, fontWeight:600}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Board */}
          <div ref={boardRef} style={{
            position:"relative", width:bw, height:bh, maxWidth:"100%",
            background:"rgba(255,255,255,.45)",
            borderRadius:20,
            border:"3px solid rgba(255,255,255,.8)",
            boxShadow:"0 6px 16px rgba(0,0,0,.1), inset 0 2px 0 rgba(255,255,255,.5)",
            marginBottom:isNarrow ? 6 : 0,
            animation: shake ? "shake .3s ease" : "fadeIn .4s ease",
          }}>
            {/* GRID LINES — visible on board */}
            <svg style={{position:"absolute", inset:0, width:bw, height:bh, pointerEvents:"none", zIndex:0}}>
              {/* vertical */}
              {Array.from({length: curCols + 1}).map((_,i) => (
                <line key={`v${i}`} x1={i*csz} y1={0} x2={i*csz} y2={bh}
                  stroke="rgba(139,92,246,.18)" strokeWidth="1.5" strokeDasharray="4 4"/>
              ))}
              {/* horizontal */}
              {Array.from({length: curRows + 1}).map((_,i) => (
                <line key={`h${i}`} x1={0} y1={i*csz} x2={bw} y2={i*csz}
                  stroke="rgba(139,92,246,.18)" strokeWidth="1.5" strokeDasharray="4 4"/>
              ))}
            </svg>

            {/* Chain trail overlay */}
            <svg style={{position:"absolute", inset:0, width:bw, height:bh, pointerEvents:"none", zIndex:5}}>
              {trails.map(t => (
                <line key={t.id} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                  stroke={t.color} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="5 4" opacity="0"
                  style={{animation:`tflash .55s ${t.delay}s ease-out forwards`, filter:`drop-shadow(0 0 4px ${t.color})`}}/>
              ))}
            </svg>

            {/* Cells */}
            {Object.values(board).map(c => {
              const cellKey = `${c.x},${c.y}`;
              const isHinted = pointerCell && c.x === pointerCell[0] && c.y === pointerCell[1] && c.state === "idle";
              return (
                <Cell key={cellKey}
                  cell={{...c, tutorialHint: isHinted}}
                  size={csz}
                  onTap={handleTap}
                  disabled={busy}
                  shaking={shakeCell === cellKey}
                />
              );
            })}

            {/* Tutorial pointer */}
            {pointerCell && (() => {
              const [px, py] = pointerCell;
              const cell = board[`${px},${py}`];
              if (!cell || cell.state !== "idle") return null;
              return (
                <div style={{
                  position:"absolute",
                  left: px*csz + csz/2 - 18,
                  top: py*csz - 50,
                  pointerEvents:"none", zIndex:20,
                  animation:"pointerBounce 1s ease-in-out infinite",
                  filter:"drop-shadow(0 4px 6px rgba(0,0,0,.2))",
                }}>
                  <PointerHint size={36}/>
                </div>
              );
            })()}

            {parts.map(p => <Burst key={p.id} {...p}/>)}

            {cmb && (
              <div key={cmb.k} style={{
                position:"absolute", top:"50%", left:"50%",
                fontFamily:"'Baloo 2', sans-serif", fontWeight:900,
                fontSize:"3.5rem",
                background:"linear-gradient(135deg, #f59e0b, #ec4899)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                pointerEvents:"none", zIndex:20,
                animation:"cpop .8s ease forwards",
                filter:"drop-shadow(0 0 20px rgba(245,158,11,.7)) drop-shadow(0 0 40px rgba(236,72,153,.5))",
                letterSpacing:"-2px",
              }}>×{cmb.v}!</div>
            )}
          </div>

          {/* Hint for non-tutorial */}
          {!isTutorial && rem === total && !busy && (
            <div style={{
              marginTop:16, textAlign:"center",
              animation:"fadeIn .5s ease",
            }}>
              <div style={{
                fontFamily:"'Baloo 2', sans-serif", fontWeight:700,
                fontSize:"1rem", color:"#7c3aed",
                background:"rgba(255,255,255,.7)",
                padding:"8px 20px", borderRadius:16,
                border:"2px solid #fff",
                boxShadow:"0 4px 10px rgba(0,0,0,.08)",
                display:"inline-flex", alignItems:"center", gap:8,
              }}>
                <I.Bulb s={18}/>
                solvable in <span style={{color:"#ec4899"}}>{minTaps}</span> {minTaps === 1 ? "tap" : "taps"}!
              </div>
            </div>
          )}

          {/* TOAST */}
          {toast && (
            <div style={{
              position:"fixed", top:90, left:"50%",
              transform:"translateX(-50%)",
              background: toast.variant === "frozen"
                ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color:"#fff", padding:"12px 20px",
              borderRadius:16, border:"3px solid #fff",
              boxShadow:"0 8px 20px rgba(0,0,0,.25)",
              animation:"toastIn .3s ease",
              zIndex:150, maxWidth:320,
              textAlign:"center",
              fontFamily:"'Baloo 2', sans-serif",
            }}>
              <div style={{
                display:"flex", alignItems:"center",
                justifyContent:"center", gap:8,
                fontWeight:700, fontSize:".95rem",
                textShadow:"0 1px 2px rgba(0,0,0,.3)",
              }}>
                {toast.variant === "frozen" && <I.Banned s={18} c="#fff"/>}
                {toast.text}
              </div>
              {toast.sub && (
                <div style={{
                  fontSize:".72rem", fontWeight:500, marginTop:2,
                  opacity:.9, fontFamily:"'Fredoka', sans-serif",
                }}>{toast.sub}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ WIN OVERLAY ═══════ */}
      {screen === "win" && (
        <>
          <Confetti/>
          <div style={{
            position:"fixed", inset:0,
            background:"radial-gradient(ellipse at center, rgba(254,243,199,.95) 0%, rgba(251,207,232,.95) 50%, rgba(196,181,253,.95) 100%)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            zIndex:100, animation:"fadeIn .4s ease",
            padding:"2rem 1.5rem",
          }}>
            <div style={{
              fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
              fontSize:"1rem", color:"#9333ea",
              letterSpacing:"3px", marginBottom:6,
              animation:"popIn .4s .1s ease both",
            }}>LEVEL {level} COMPLETE!</div>

            <div style={{
              fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
              fontSize:"3rem", letterSpacing:"-1.5px",
              background:"linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #8b5cf6 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              marginBottom:16, lineHeight:1, textAlign:"center",
              animation:"popIn .5s .2s ease both",
              filter:"drop-shadow(0 4px 8px rgba(236,72,153,.3))",
            }}>{info.name}</div>

            <div style={{margin:"16px 0 20px", animation:"popIn .4s .3s ease both"}}>
              <StarRow stars={winStars} size={54}/>
            </div>

            <div style={{
              background:"rgba(255,255,255,.85)",
              padding:"14px 28px", borderRadius:20,
              border:"3px solid #fff",
              boxShadow:"0 6px 14px rgba(0,0,0,.12)",
              textAlign:"center", marginBottom:18,
              animation:"popIn .4s .4s ease both",
            }}>
              <div style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:"2.2rem", color:"#f59e0b", lineHeight:1}}>{score}</div>
              <div style={{fontSize:".6rem", color:"#92400e", fontFamily:"'Fredoka', sans-serif", letterSpacing:"2.5px", marginTop:4, fontWeight:600}}>POINTS</div>
              {isNewBest && (
                <div style={{
                  marginTop:8, fontSize:".7rem", fontWeight:800, color:"#fff",
                  background:"linear-gradient(135deg, #fbbf24, #f59e0b)",
                  padding:"4px 14px", borderRadius:12, letterSpacing:"2px",
                  boxShadow:"0 3px 8px rgba(245,158,11,.4)",
                  animation:"wiggle .4s ease infinite",
                  display:"inline-flex", alignItems:"center", gap:6,
                }}><I.Star s={14}/> NEW BEST <I.Star s={14}/></div>
              )}
            </div>

            <div style={{
              fontSize:".8rem", color:"#6b21a8",
              fontFamily:"'Fredoka', sans-serif", fontWeight:600,
              marginBottom:28,
              animation:"popIn .4s .5s ease both",
            }}>
              {tapsUsedRef.current}/{minTaps + info.bonus} taps
              {winStars === 3 ? " · perfect!" : ""}
            </div>

            <button onClick={continueFromWin} className="btn"
              style={{
                background:"linear-gradient(145deg, #10b981 0%, #059669 60%, #047857 100%)",
                color:"#fff", fontFamily:"'Baloo 2', sans-serif",
                fontSize:"1.4rem", fontWeight:800,
                padding:"16px 50px",
                border:"4px solid #fff", borderRadius:20,
                boxShadow:"0 6px 0 #047857, 0 12px 20px rgba(4,120,87,.35), inset 0 -3px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.4)",
                cursor:"pointer", letterSpacing:"1.5px",
                textShadow:"0 2px 4px rgba(0,0,0,.3)",
                animation:"breathe 1.8s ease-in-out infinite, popIn .4s .6s ease both",
                display:"flex", alignItems:"center", gap:8,
              }}>CONTINUE <I.Chevron s={18} c="#fff" dir="right"/></button>
          </div>
        </>
      )}

      {/* ═══════ LOSE ═══════ */}
      {screen === "lose" && (
        <div style={{
          position:"fixed", inset:0,
          background:"radial-gradient(ellipse at center, rgba(254,205,211,.94) 0%, rgba(196,181,253,.94) 100%)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          zIndex:100, animation:"fadeIn .4s ease",
          padding:"2rem 1.5rem",
        }}>
          <div style={{marginBottom:12, animation:"wiggle .6s ease infinite"}}>
            <I.Face s={80} mood="sad"/>
          </div>
          <div style={{
            fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
            fontSize:"2.4rem",
            background:"linear-gradient(135deg, #ec4899, #8b5cf6)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            letterSpacing:"-1px", marginBottom:10, textAlign:"center",
          }}>Out of taps!</div>
          <div style={{
            background:"rgba(255,255,255,.85)", padding:"10px 20px",
            borderRadius:16, border:"2px solid #fff",
            boxShadow:"0 4px 12px rgba(0,0,0,.1)",
            fontFamily:"'Fredoka', sans-serif", fontWeight:600,
            color:"#6b21a8", fontSize:".85rem", marginBottom:8,
          }}>{rem} arrows left · {score} pts</div>
          <div style={{
            fontSize:".75rem", color:"#7c3aed",
            fontFamily:"'Fredoka', sans-serif", fontWeight:500,
            marginBottom:30, textAlign:"center", maxWidth:280, lineHeight:1.5,
            display:"flex", alignItems:"center", gap:6, justifyContent:"center",
          }}>
            <I.Bulb s={16}/>
            Solvable in <strong style={{color:"#10b981"}}>{minTaps} taps</strong>. Try a different first move!
          </div>

          <div style={{display:"flex", gap:12}}>
            <button onClick={goToMap} className="btn"
              style={{
                background:"linear-gradient(145deg, #fff, #e5e7eb)",
                color:"#6b21a8", fontFamily:"'Baloo 2', sans-serif",
                fontSize:"1rem", fontWeight:800,
                padding:"14px 24px",
                border:"3px solid #fff", borderRadius:18,
                boxShadow:"0 5px 0 #9ca3af, 0 10px 18px rgba(0,0,0,.15)",
                cursor:"pointer", letterSpacing:"1px",
                display:"flex", alignItems:"center", gap:6,
              }}><I.Chevron s={16}/> MAP</button>
            <button onClick={() => { sfx.click(); vib(10); startLevel(level); }} className="btn"
              style={{
                background:"linear-gradient(145deg, #ec4899 0%, #db2777 60%, #9f1239 100%)",
                color:"#fff", fontFamily:"'Baloo 2', sans-serif",
                fontSize:"1.1rem", fontWeight:800,
                padding:"14px 32px",
                border:"3px solid #fff", borderRadius:18,
                boxShadow:"0 5px 0 #9f1239, 0 10px 18px rgba(159,18,57,.35), inset 0 3px 0 rgba(255,255,255,.3)",
                cursor:"pointer", letterSpacing:"1.5px",
                textShadow:"0 2px 4px rgba(0,0,0,.3)",
                display:"flex", alignItems:"center", gap:6,
              }}>TRY AGAIN <I.Refresh s={18} c="#fff"/></button>
          </div>
        </div>
      )}

      {/* ═══════ SETTINGS ═══════ */}
      {showSettings && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(30,27,75,.6)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:500, animation:"fadeIn .2s ease",
          padding:"1.5rem",
        }} onClick={() => setShowSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"linear-gradient(180deg, #fff 0%, #fef3c7 100%)",
            borderRadius:28, padding:"1.75rem 1.5rem 1.5rem",
            width:"100%", maxWidth:360,
            border:"4px solid #fff",
            boxShadow:"0 20px 60px rgba(0,0,0,.3)",
            animation:"modalIn .3s cubic-bezier(.34,1.56,.64,1) both",
          }}>
            <div style={{
              display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:20,
            }}>
              <div style={{
                fontFamily:"'Baloo 2', sans-serif", fontWeight:800,
                fontSize:"1.5rem",
                background:"linear-gradient(135deg, #ec4899, #8b5cf6)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                display:"flex", alignItems:"center", gap:8,
              }}>
                <I.Gear s={24} c="#8b5cf6"/> Settings
              </div>
              <button onClick={() => setShowSettings(false)} className="btn"
                style={{
                  background:"linear-gradient(145deg, #fff, #f3f4f6)",
                  border:"2px solid #e5e7eb", borderRadius:"50%",
                  width:36, height:36, cursor:"pointer",
                  boxShadow:"0 3px 0 #9ca3af",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                <I.Close s={16}/>
              </button>
            </div>

            {[
              { label:"Sound Effects", Icon:I.Speaker, value:soundOn, onChange: () => { setSoundOn(s => !s); sfx.click(); } },
              { label:"Vibration", Icon:I.Vibrate, value:hapticsOn, onChange: () => { setHapticsOn(h => !h); vib(15); } },
            ].map(({label, Icon, value, onChange}) => (
              <div key={label} style={{
                display:"flex", alignItems:"center",
                justifyContent:"space-between",
                background:"rgba(255,255,255,.7)",
                padding:"14px 18px", borderRadius:16,
                marginBottom:10,
                border:"2px solid rgba(255,255,255,.9)",
              }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:10,
                  fontFamily:"'Baloo 2', sans-serif", fontWeight:700,
                  fontSize:"1rem", color:"#6b21a8",
                }}>
                  <Icon s={22} c="#6b21a8" muted={label === "Sound Effects" && !value}/>
                  {label}
                </div>
                <button onClick={onChange} className="btn"
                  style={{
                    width:52, height:28,
                    background: value ? "linear-gradient(145deg, #10b981, #059669)" : "linear-gradient(145deg, #e5e7eb, #d1d5db)",
                    border:"2px solid #fff", borderRadius:14,
                    cursor:"pointer", position:"relative",
                    boxShadow: value ? "0 3px 0 #047857, inset 0 2px 0 rgba(255,255,255,.3)" : "0 3px 0 #9ca3af, inset 0 2px 0 rgba(255,255,255,.5)",
                    transition:"all .2s",
                  }}>
                  <div style={{
                    position:"absolute", top:1, left: value ? 23 : 1,
                    width:20, height:20,
                    background:"#fff", borderRadius:"50%",
                    boxShadow:"0 2px 4px rgba(0,0,0,.2)",
                    transition:"left .2s ease",
                  }}/>
                </button>
              </div>
            ))}

            <div style={{
              background:"rgba(255,255,255,.7)",
              padding:"14px 18px", borderRadius:16,
              marginTop:14, marginBottom:14,
              border:"2px solid rgba(255,255,255,.9)",
            }}>
              <div style={{fontFamily:"'Fredoka', sans-serif", fontWeight:600, fontSize:".7rem", color:"#9333ea", letterSpacing:"2px", marginBottom:8}}>YOUR PROGRESS</div>
              <div style={{display:"flex", justifyContent:"space-around"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:"1.4rem", color:"#8b5cf6", lineHeight:1}}>{level}</div>
                  <div style={{fontSize:".6rem", color:"#6b21a8", fontWeight:600, marginTop:3, letterSpacing:"1px"}}>LEVEL</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:"1.4rem", color:"#f59e0b", lineHeight:1, display:"flex", alignItems:"center", gap:4, justifyContent:"center"}}>{totalStars} <I.Star s={16}/></div>
                  <div style={{fontSize:".6rem", color:"#92400e", fontWeight:600, marginTop:3, letterSpacing:"1px"}}>STARS</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Baloo 2', sans-serif", fontWeight:800, fontSize:"1.4rem", color:"#ec4899", lineHeight:1}}>{Object.keys(starsMap).length}</div>
                  <div style={{fontSize:".6rem", color:"#9f1239", fontWeight:600, marginTop:3, letterSpacing:"1px"}}>CLEARED</div>
                </div>
              </div>
            </div>

            {!showResetConfirm ? (
              <button onClick={() => setShowResetConfirm(true)} className="btn"
                style={{
                  width:"100%",
                  background:"linear-gradient(145deg, #fecaca, #fca5a5)",
                  color:"#991b1b", fontFamily:"'Baloo 2', sans-serif",
                  fontSize:".9rem", fontWeight:800,
                  padding:"12px", border:"2px solid #fff", borderRadius:14,
                  boxShadow:"0 4px 0 #dc2626, 0 6px 12px rgba(220,38,38,.2)",
                  cursor:"pointer", letterSpacing:"1px",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}><I.Trash s={16} c="#991b1b"/> RESET PROGRESS</button>
            ) : (
              <div style={{
                background:"rgba(254,202,202,.6)",
                padding:"14px", borderRadius:14,
                border:"2px solid #fca5a5",
                animation:"popIn .2s ease both",
              }}>
                <div style={{
                  fontFamily:"'Baloo 2', sans-serif", fontWeight:700,
                  fontSize:".85rem", color:"#991b1b",
                  textAlign:"center", marginBottom:10,
                }}>Are you sure? Can't undo!</div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={() => setShowResetConfirm(false)} className="btn"
                    style={{
                      flex:1, background:"linear-gradient(145deg, #fff, #f3f4f6)",
                      color:"#6b21a8", fontFamily:"'Baloo 2', sans-serif",
                      fontWeight:700, fontSize:".85rem",
                      padding:"10px", border:"2px solid #fff", borderRadius:12,
                      cursor:"pointer", boxShadow:"0 3px 0 #9ca3af",
                    }}>CANCEL</button>
                  <button onClick={resetAll} className="btn"
                    style={{
                      flex:1, background:"linear-gradient(145deg, #ef4444, #b91c1c)",
                      color:"#fff", fontFamily:"'Baloo 2', sans-serif",
                      fontWeight:800, fontSize:".85rem",
                      padding:"10px", border:"2px solid #fff", borderRadius:12,
                      cursor:"pointer",
                      boxShadow:"0 3px 0 #7f1d1d", letterSpacing:"1px",
                      textShadow:"0 1px 2px rgba(0,0,0,.3)",
                    }}>YES, RESET</button>
                </div>
              </div>
            )}

            <div style={{
              marginTop:14, textAlign:"center",
              fontFamily:"'Fredoka', sans-serif", fontWeight:500,
              fontSize:".6rem", color:"#9ca3af", letterSpacing:"1px",
            }}>Arrows! · made with love</div>
          </div>
        </div>
      )}
    </div>
  );
}
