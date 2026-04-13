import { useState, useCallback, useRef, useMemo, useEffect } from "react";

/* ── Audio Engine (Web Audio API — zero external deps) ── */
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
  _go(fn) {
    this.init();
    this.resume();
    fn(this.ctx);
  }

  tap() {
    this._go((c) => {
      const t = c.currentTime,
        o = c.createOscillator(),
        g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(350, t + 0.08);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.1);
    });
  }
  fire(depth) {
    this._go((c) => {
      const t = c.currentTime,
        f = 280 + depth * 90;
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.06);
      o.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.15);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  }
  clear(depth) {
    this._go((c) => {
      const t = c.currentTime,
        f = 520 + depth * 55;
      const o1 = c.createOscillator(),
        o2 = c.createOscillator(),
        g = c.createGain();
      o1.type = "sine";
      o1.frequency.setValueAtTime(f, t);
      o2.type = "sine";
      o2.frequency.setValueAtTime(f * 1.5, t);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o1.connect(g).connect(c.destination);
      o2.connect(g);
      o1.start(t);
      o2.start(t);
      o1.stop(t + 0.22);
      o2.stop(t + 0.22);
    });
  }
  combo(n) {
    this._go((c) => {
      const t = c.currentTime;
      [0, 0.06, 0.12].forEach((d, i) => {
        const o = c.createOscillator(),
          g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(600 + n * 80 + i * 220, t + d);
        g.gain.setValueAtTime(0.14, t + d);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.14);
        o.connect(g).connect(c.destination);
        o.start(t + d);
        o.stop(t + d + 0.14);
      });
    });
  }
  win() {
    this._go((c) => {
      const t = c.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => {
        const d = i * 0.11,
          o = c.createOscillator(),
          g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, t + d);
        g.gain.setValueAtTime(0.18, t + d);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.4);
        o.connect(g).connect(c.destination);
        o.start(t + d);
        o.stop(t + d + 0.4);
      });
    });
  }
  lose() {
    this._go((c) => {
      const t = c.currentTime;
      [400, 340, 280, 180].forEach((f, i) => {
        const d = i * 0.14,
          o = c.createOscillator(),
          g = c.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(f, t + d);
        o.frequency.exponentialRampToValueAtTime(f * 0.65, t + d + 0.2);
        g.gain.setValueAtTime(0.07, t + d);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.24);
        o.connect(g).connect(c.destination);
        o.start(t + d);
        o.stop(t + d + 0.28);
      });
    });
  }
}
const sfx = new SoundEngine();

/* ── Constants ── */
const DIRS = {
  up: { dx: 0, dy: -1, rot: 0 },
  right: { dx: 1, dy: 0, rot: 90 },
  down: { dx: 0, dy: 1, rot: 180 },
  left: { dx: -1, dy: 0, rot: 270 },
};
const DK = Object.keys(DIRS);
const COL = {
  up: "#00f5d4",
  right: "#ffd60a",
  down: "#ff006e",
  left: "#8338ec",
};
const GLW = {
  up: "0,245,212",
  right: "255,214,10",
  down: "255,0,110",
  left: "131,56,236",
};

const LEVELS = [
  { name: "SPARK", cols: 5, rows: 5, fill: 0.5, taps: 8 },
  { name: "EMBER", cols: 5, rows: 6, fill: 0.53, taps: 8 },
  { name: "FLAME", cols: 6, rows: 6, fill: 0.56, taps: 9 },
  { name: "BLAZE", cols: 6, rows: 7, fill: 0.58, taps: 9 },
  { name: "INFERNO", cols: 7, rows: 7, fill: 0.6, taps: 10 },
  { name: "NOVA", cols: 7, rows: 8, fill: 0.62, taps: 10 },
  { name: "PULSAR", cols: 8, rows: 8, fill: 0.64, taps: 11 },
  { name: "QUASAR", cols: 8, rows: 9, fill: 0.66, taps: 11 },
];

const PROGRESS_KEY = "arrowx_unlocked_level";

function genBoard(cols, rows, fill) {
  const b = {},
    cx = cols / 2,
    cy = rows / 2,
    mr = Math.min(cols, rows) / 2;
  const sh = ["blob", "ring", "wave", "diamond", "cross"][
    Math.floor(Math.random() * 5)
  ];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const dx = x - cx + 0.5,
        dy = y - cy + 0.5,
        dist = Math.sqrt(dx * dx + dy * dy);
      let ok = false;
      if (sh === "blob") ok = dist < mr * 1.1 && Math.random() < fill;
      if (sh === "ring")
        ok = dist > mr * 0.3 && dist < mr * 1.1 && Math.random() < fill;
      if (sh === "wave")
        ok = Math.random() < fill * (1 + 0.3 * Math.sin(x * 0.8 + y * 0.5));
      if (sh === "diamond")
        ok = Math.abs(dx) + Math.abs(dy) < mr * 1.3 && Math.random() < fill;
      if (sh === "cross")
        ok =
          (Math.abs(dx) < mr * 0.4 || Math.abs(dy) < mr * 0.4) &&
          Math.random() < fill + 0.1;
      if (ok)
        b[`${x},${y}`] = {
          x,
          y,
          dir: DK[Math.floor(Math.random() * 4)],
          state: "idle",
        };
    }
  return b;
}

/* ── Burst particles ── */
function Burst({ x, y, color }) {
  const ps = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5,
          r = 16 + Math.random() * 30;
        return {
          tx: Math.cos(a) * r,
          ty: Math.sin(a) * r,
          s: 2 + Math.random() * 3,
          d: Math.random() * 0.06,
        };
      }),
    [],
  );
  return (
    <>
      {ps.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - p.s / 2,
            top: y - p.s / 2,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: color,
            opacity: 0,
            pointerEvents: "none",
            animation: `burstp .45s ${p.d}s ease-out forwards`,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
          }}
        />
      ))}
    </>
  );
}

/* ── Arrow cell ── */
function Arrow({ cell, size, onTap, disabled }) {
  const d = DIRS[cell.dir],
    c = COL[cell.dir],
    g = GLW[cell.dir];
  const gone = cell.state === "cleared",
    lit = cell.state === "firing";
  return (
    <div
      onClick={() => !disabled && !gone && onTap(cell)}
      style={{
        position: "absolute",
        left: cell.x * size,
        top: cell.y * size,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: gone ? "default" : "pointer",
        opacity: gone ? 0 : 1,
        transform: gone
          ? "scale(0) rotate(90deg)"
          : lit
            ? "scale(1.18)"
            : "scale(1)",
        transition: gone ? "all .45s cubic-bezier(.4,0,.2,1)" : "transform .1s",
        zIndex: lit ? 10 : 1,
      }}
    >
      <div
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.17,
          background: lit ? `rgba(${g},.22)` : "rgba(255,255,255,.025)",
          border: `1.5px solid ${lit ? c : "rgba(255,255,255,.07)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: lit
            ? `0 0 ${size * 0.5}px rgba(${g},.45),inset 0 0 ${size * 0.2}px rgba(${g},.25)`
            : "none",
          transition: "all .1s",
        }}
      >
        <svg
          width={size * 0.4}
          height={size * 0.4}
          viewBox="0 0 24 24"
          style={{
            transform: `rotate(${d.rot}deg)`,
            filter: lit ? `drop-shadow(0 0 5px ${c})` : "none",
          }}
        >
          <path
            d="M12 3L12 21M12 3L5 10M12 3L19 10"
            stroke={lit ? "#fff" : c}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ArrowsGame() {
  const [li, setLi] = useState(0);
  const [board, setBoard] = useState({});
  const [taps, setTaps] = useState(0);
  const [total, setTotal] = useState(0);
  const [gs, setGs] = useState("playing");
  const [busy, setBusy] = useState(false);
  const [parts, setParts] = useState([]);
  const [trails, setTrails] = useState([]);
  const [cmb, setCmb] = useState(null);
  const [muted, setMuted] = useState(false);
  const ref = useRef(null);
  const pid = useRef(0),
    tid2 = useRef(0);

  const lv = LEVELS[li];

  const start = useCallback((idx) => {
    const l = LEVELS[idx];
    const b = genBoard(l.cols, l.rows, l.fill);
    setBoard(b);
    setTaps(l.taps);
    setTotal(Object.keys(b).length);
    setGs("playing");
    setBusy(false);
    setParts([]);
    setTrails([]);
    setCmb(null);
    setLi(idx);
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem(PROGRESS_KEY) ?? "0");
    const startLevel = Number.isFinite(saved)
      ? Math.max(0, Math.min(saved, LEVELS.length - 1))
      : 0;
    start(startLevel);
  }, [start]);

  const addBurst = useCallback((cx, cy, color) => {
    const id = pid.current++;
    setParts((p) => [...p, { id, x: cx, y: cy, color }]);
    setTimeout(() => setParts((p) => p.filter((pp) => pp.id !== id)), 550);
  }, []);

  const addTrail = useCallback((x1, y1, x2, y2, color, delay) => {
    const id = tid2.current++;
    setTrails((t) => [...t, { id, x1, y1, x2, y2, color, delay }]);
    setTimeout(
      () => setTrails((t) => t.filter((tt) => tt.id !== id)),
      (delay + 0.5) * 1000,
    );
  }, []);

  const handleTap = useCallback(
    (cell) => {
      if (busy || gs !== "playing" || taps <= 0) return;
      setBusy(true);
      setTaps((t) => t - 1);
      if (!muted) sfx.tap();

      const cur = { ...board };
      const q = [{ x: cell.x, y: cell.y, depth: 0 }],
        seq = [],
        vis = new Set();
      while (q.length) {
        const { x, y, depth } = q.shift(),
          k = `${x},${y}`;
        if (vis.has(k) || !cur[k] || cur[k].state === "cleared") continue;
        vis.add(k);
        const cc = cur[k],
          d = DIRS[cc.dir];
        seq.push({ k, depth, x, y, dir: cc.dir });
        let nx = x + d.dx,
          ny = y + d.dy;
        while (nx >= 0 && nx < lv.cols && ny >= 0 && ny < lv.rows) {
          const nk = `${nx},${ny}`;
          if (cur[nk] && cur[nk].state !== "cleared" && !vis.has(nk)) {
            q.push({ x: nx, y: ny, depth: depth + 1 });
            break;
          }
          nx += d.dx;
          ny += d.dy;
        }
      }

      const csz = ref.current
        ? ref.current.getBoundingClientRect().width / lv.cols
        : 40;
      const h = csz / 2;

      seq.forEach(({ k, depth, x, y, dir }) => {
        const dl = depth * 125;
        setTimeout(() => {
          setBoard((p) => {
            const n = { ...p };
            if (n[k]) n[k] = { ...n[k], state: "firing" };
            return n;
          });
          if (!muted) sfx.fire(depth);
        }, dl);
        setTimeout(() => {
          setBoard((p) => {
            const n = { ...p };
            if (n[k]) n[k] = { ...n[k], state: "cleared" };
            return n;
          });
          if (!muted) sfx.clear(depth);
          addBurst(x * csz + h, y * csz + h, COL[dir]);
        }, dl + 170);
      });

      // trails
      seq.forEach(({ x, y, dir, depth }) => {
        const nx = seq.find((s) => s.depth === depth + 1);
        if (nx)
          addTrail(
            x * csz + h,
            y * csz + h,
            nx.x * csz + h,
            nx.y * csz + h,
            COL[dir],
            depth * 0.13,
          );
      });

      const maxD = seq.length > 0 ? Math.max(...seq.map((s) => s.depth)) : 0;
      if (maxD >= 2)
        setTimeout(
          () => {
            if (!muted) sfx.combo(maxD);
            setCmb({ v: seq.length, k: Date.now() });
            setTimeout(() => setCmb(null), 800);
          },
          maxD * 125 + 80,
        );

      const newTaps = taps - 1;
      const tt = seq.length > 0 ? maxD * 125 + 550 : 200;
      setTimeout(() => {
        setBusy(false);
        setBoard((prev) => {
          const rem = Object.values(prev).filter(
            (c) => c.state !== "cleared",
          ).length;
          if (rem === 0)
            setTimeout(() => {
              const unlocked = Number(localStorage.getItem(PROGRESS_KEY) ?? "0");
              if (li < LEVELS.length - 1 && li + 1 > unlocked) {
                localStorage.setItem(PROGRESS_KEY, String(li + 1));
              }
              setGs("win");
              if (!muted) sfx.win();
            }, 150);
          else if (newTaps <= 0)
            setTimeout(() => {
              setGs("lose");
              if (!muted) sfx.lose();
            }, 150);
          return prev;
        });
      }, tt);
    },
    [board, busy, gs, taps, lv, muted, addBurst, addTrail],
  );

  const rem = Object.values(board).filter((c) => c.state !== "cleared").length;
  const csz = (() => {
    const mw = Math.min(window.innerWidth - 24, 440);
    const mh = window.innerHeight * 0.52;
    return Math.floor(Math.min(mw / lv.cols, mh / lv.rows));
  })();
  const bw = lv.cols * csz,
    bh = lv.rows * csz;
  const pct = total > 0 ? ((total - rem) / total) * 100 : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080e",
        color: "#eee",
        fontFamily: "'Outfit',sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        body{background:#08080e;overflow-x:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse2{0%,100%{opacity:.25}50%{opacity:.6}}
        @keyframes burstp{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}
        @keyframes tflash{0%{opacity:.55}100%{opacity:0}}
        @keyframes cpop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(2.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.8)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes spinin{from{opacity:0;transform:scale(.7) rotate(-15deg)}to{opacity:1;transform:scale(1) rotate(0)}}
        .bh:active{transform:scale(.95)!important}
      `}</style>

      {/* dot grid bg */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.015,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.4) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* ═══ GAMEPLAY ═══ */}
      {gs && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 460,
            padding: "10px 12px",
            animation: "fadeUp .3s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              borderRadius: 14,
              marginBottom: 8,
              padding: "10px 12px",
              background:
                "linear-gradient(135deg,rgba(0,245,212,.08),rgba(131,56,236,.08))",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,.28)",
            }}
          >
            <div
              style={{
                fontSize: ".52rem",
                letterSpacing: "2.5px",
                color: "rgba(255,255,255,.36)",
                marginBottom: 3,
                fontWeight: 700,
              }}
            >
              ARROWX · CHAIN REACTION
            </div>
            <div
              style={{
                fontSize: ".62rem",
                color: "rgba(255,255,255,.64)",
              }}
            >
              Clear every arrow before your moves run out.
            </div>
          </div>

          {/* top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginBottom: 7,
            }}
          >
            <button
              onClick={() => start(li)}
              className="bh"
              style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 9,
                padding: "6px 12px",
                color: "rgba(255,255,255,.35)",
                fontFamily: "inherit",
                fontSize: ".55rem",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              ↺ RESET
            </button>
            <span
              style={{
                fontSize: ".55rem",
                fontWeight: 700,
                letterSpacing: "3px",
                color: "rgba(255,255,255,.18)",
              }}
            >
              LV{li + 1} · {lv.name}
            </span>
            <div style={{ display: "flex", gap: 5 }}>
              <button
                onClick={() => setMuted((m) => !m)}
                className="bh"
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 9,
                  padding: "6px 8px",
                  color: "rgba(255,255,255,.35)",
                  fontFamily: "inherit",
                  fontSize: ".6rem",
                  cursor: "pointer",
                }}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={() => start(li)}
                className="bh"
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 9,
                  padding: "6px 12px",
                  color: "rgba(255,255,255,.35)",
                  fontFamily: "inherit",
                  fontSize: ".55rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "1px",
                }}
              >
                ↻
              </button>
            </div>
          </div>

          {/* stats */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginBottom: 7,
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            {[
              { l: "MOVES", v: taps, c: taps <= 2 ? "#ff006e" : "#00f5d4" },
              { l: "ARROWS", v: rem, c: "#ffd60a" },
            ].map(({ l: label, v, c }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: c,
                    transition: "color .3s",
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: ".45rem",
                    color: "rgba(255,255,255,.2)",
                    letterSpacing: "2px",
                    marginTop: 2,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* progress */}
          <div
            style={{
              width: "100%",
              height: 2.5,
              background: "rgba(255,255,255,.03)",
              borderRadius: 2,
              marginBottom: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                width: `${pct}%`,
                background: "linear-gradient(90deg,#00f5d4,#ffd60a,#ff006e)",
                transition: "width .35s ease",
              }}
            />
          </div>

          {/* board */}
          <div
            ref={ref}
            style={{
              position: "relative",
              width: bw,
              height: bh,
              animation: "fadeUp .35s ease",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.07)",
              background:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,.06), rgba(255,255,255,.015) 45%, rgba(255,255,255,.01))",
              boxShadow: "inset 0 0 30px rgba(255,255,255,.03), 0 10px 24px rgba(0,0,0,.28)",
              overflow: "hidden",
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: bw,
                height: bh,
                pointerEvents: "none",
                zIndex: 5,
              }}
            >
              {trails.map((t) => (
                <line
                  key={t.id}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0"
                  style={{
                    animation: `tflash .4s ${t.delay}s ease-out forwards`,
                  }}
                />
              ))}
            </svg>
            {Object.values(board).map((c) => (
              <Arrow
                key={`${c.x},${c.y}`}
                cell={c}
                size={csz}
                onTap={handleTap}
                disabled={busy || gs !== "playing"}
              />
            ))}
            {parts.map((p) => (
              <Burst key={p.id} {...p} />
            ))}
            {cmb && (
              <div
                key={cmb.k}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: "#ffd60a",
                  pointerEvents: "none",
                  zIndex: 20,
                  animation: "cpop .7s ease forwards",
                  textShadow: "0 0 28px rgba(255,214,10,.5)",
                }}
              >
                ×{cmb.v}
              </div>
            )}
          </div>

          {/* hint */}
          {gs === "playing" && rem === total && (
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
                color: "rgba(255,255,255,.15)",
                fontSize: ".55rem",
                letterSpacing: "2px",
                fontWeight: 500,
                animation: "pulse2 2.5s infinite",
              }}
            >
              TAP AN ARROW TO START A CHAIN
            </div>
          )}

          {/* ── WIN ── */}
          {gs === "win" && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,8,14,.93)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                animation: "fadeUp .4s ease",
              }}
            >
              <div
                style={{
                  fontSize: "2.8rem",
                  fontWeight: 900,
                  letterSpacing: "-2px",
                  background: "linear-gradient(135deg,#00f5d4,#ffd60a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 4,
                }}
              >
                CLEARED
              </div>
              <div
                style={{
                  fontSize: ".65rem",
                  color: "rgba(255,255,255,.25)",
                  letterSpacing: "2px",
                  marginBottom: 28,
                }}
              >
                {taps} MOVES LEFT · {rem} ARROWS LEFT
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => start(li)}
                  className="bh"
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 13,
                    padding: "13px 26px",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  REPLAY
                </button>
                {li < LEVELS.length - 1 && (
                  <button
                    onClick={() => start(li + 1)}
                    className="bh"
                    style={{
                      background: "linear-gradient(135deg,#00f5d4,#00b89c)",
                      border: "none",
                      borderRadius: 13,
                      padding: "13px 26px",
                      color: "#08080e",
                      fontFamily: "inherit",
                      fontSize: ".78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    NEXT →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── LOSE ── */}
          {gs === "lose" && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,8,14,.93)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                animation: "fadeUp .4s ease",
              }}
            >
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: "#ff006e",
                  marginBottom: 6,
                  letterSpacing: "-1px",
                }}
              >
                GAME OVER
              </div>
              <div
                style={{
                  fontSize: ".7rem",
                  color: "rgba(255,255,255,.3)",
                  marginBottom: 28,
                }}
              >
                {rem} arrows left · No moves remaining
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => start(li)}
                  className="bh"
                  style={{
                    background: "linear-gradient(135deg,#ff006e,#c00058)",
                    border: "none",
                    borderRadius: 13,
                    padding: "13px 26px",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
