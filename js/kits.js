(function () {
  const ORDER = ["home", "away", "third"];
  const HOOPS = { count: 6, start: 0.275, band: 0.05, gap: 0.03 };

  function legacy(t) {
    return {
      label: "Home",
      paper: "#F5F2EC",
      card: "#FFFFFF",
      ink: t.ink || t.accent || "#111827",
      muted: "#5B6170",
      primary: t.primary || "#1F2937",
      onPrimary: t.secondary || "#FFFFFF",
      accent: t.accent || "#111827",
      onAccent: t.secondary || "#FFFFFF",
      header: t.primary || "#1F2937",
      onHeader: t.secondary || "#FFFFFF",
      pattern: {
        type: t.pattern === "stripes" ? "stripes" : "solid",
        base: t.primary || "#1F2937",
        bands: [t.secondary || "#FFFFFF"]
      }
    };
  }

  function all(team) {
    return team.kits || { home: legacy(team.theme || {}) };
  }

  function ids(team) {
    const kits = all(team);
    return ORDER.filter(id => kits[id]).concat(Object.keys(kits).filter(id => !ORDER.includes(id)));
  }

  function get(team, id) {
    const kits = all(team);
    const use = kits[id] ? id : ids(team)[0];
    const kit = kits[use];
    return Object.assign(
      {
        id: use,
        line: "rgba(17,24,39,0.12)",
        headerBand: kit.accent,
        dark: false,
        onPaper: kit.ink,
        onPaperMuted: kit.muted,
        paperPrimary: kit.primary,
        paperOnPrimary: kit.onPrimary
      },
      kit,
      { id: use }
    );
  }

  function hoops(p) {
    const bands = p.bands && p.bands.length ? p.bands : [p.base];
    const out = [];
    for (let i = 0; i < HOOPS.count; i++) {
      const from = HOOPS.start + i * (HOOPS.band + HOOPS.gap);
      out.push({ from, to: from + HOOPS.band, color: bands[i % bands.length] });
    }
    return out;
  }

  const BOLT = [[0, 0], [-3.5, 12], [2.5, 24], [-3.5, 36], [2.5, 48], [-3.5, 60], [2.5, 72], [-3.5, 84], [2.5, 96], [0, 100]];
  const BOLT_X = [14, 86];
  const BOLT_W = 2;

  function boltPoints(cx, mirror) {
    return BOLT.map(([dx, y]) => [cx + (mirror ? -dx : dx), y]);
  }

  function boltSvg(p) {
    const color = (p.bands && p.bands[0]) || "#FFFFFF";
    const lines = BOLT_X.map((cx, i) =>
      '<polyline points="' + boltPoints(cx, i === 1).map(pt => pt.join(",")).join(" ") +
      '" fill="none" stroke="' + color + '" stroke-width="' + BOLT_W + '" stroke-linejoin="miter"/>'
    ).join("");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + "</svg>";
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')";
  }

  const ZIG = [[50, 0], [57, 12.5], [43, 25], [57, 37.5], [43, 50], [57, 62.5], [43, 75], [57, 87.5], [50, 100]];

  function splitSvg(p) {
    const color = (p.bands && p.bands[0]) || "#000000";
    const pts = ZIG.map(pt => pt.join(",")).concat(["100,100", "100,0"]).join(" ");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="' + pts + '" fill="' + color + '"/></svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')";
  }

  const CB = [0.33, 0.39, 0.61, 0.67];

  const BAND = [0.36, 0.41, 0.59, 0.64];

  const SASH = [[0, 6], [0, 34], [100, 96], [100, 68]];

  function sashPoints(p) {
    return p.reverse ? SASH.map(([x, y]) => [100 - x, y]) : SASH;
  }

  function sashSvg(p) {
    const color = (p.bands && p.bands[0]) || "#FFFFFF";
    const pts = sashPoints(p).map(pt => pt.join(",")).join(" ");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="' + pts + '" fill="' + color + '"/></svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')";
  }

  function diamondsSvg(p) {
    const bands = p.bands && p.bands.length ? p.bands : ["#FFFFFF"];
    const colors = bands.length >= 3 ? bands.slice(0, 3) : bands.concat(Array(3 - bands.length).fill(bands[0] || "#FFFFFF"));
    const segment = 100 / colors.length;
    const gap = 0;
    const shapes = colors.map((color, i) => {
      const x0 = i * segment + gap * 0.7;
      const x1 = (i + 1) * segment - gap * 0.7;
      const pts = [[x0, 0], [x0, 50], [x1, 100], [x1, 50]].map(pt => pt.join(",")).join(" ");
      return '<polygon points="' + pts + '" fill="' + color + '"/>';
    }).join("");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + shapes + '</svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / 100% 100% no-repeat, " + p.base;
  }
  const RAYO_BOLT = [[78, 0], [96, 0], [77, 38], [89, 38], [48, 100], [28, 100], [60, 52], [48, 52]];

  const TIP = [[0.24, 0.3], [0.33, 0.39]];

  const FADE = [0.4, 0.62];

  const SLEEVE_L = [[0, 0], [30, 0], [22, 46], [0, 60]];

  const ZZ_ROWS = [0.3, 0.46, 0.62, 0.78];
  const ZZ_TEETH = 5;

  function zigzagRow(y) {
    const pts = [];
    for (let i = 0; i <= ZZ_TEETH * 2; i++) pts.push([(i * 100) / (ZZ_TEETH * 2), y * 100 + (i % 2 ? -5 : 5)]);
    return pts;
  }

  function zigzagSvg(p) {
    const bands = p.bands && p.bands.length ? p.bands : ["#FFFFFF"];
    const lines = ZZ_ROWS.map((y, i) =>
      '<polyline points="' + zigzagRow(y).map(pt => pt.join(",")).join(" ") +
      '" fill="none" stroke="' + bands[i % bands.length] + '" stroke-width="3.5" stroke-linejoin="miter"/>'
    ).join("");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + "</svg>";
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')";
  }

  function wavesSvg(p) {
    const color = (p.bands && p.bands[0]) || "#FFFFFF";
    const rows = 12;
    const amplitude = 6.4;
    const phase = 0.75;
    const paths = Array.from({ length: rows }, (_, i) => {
      const y = (i + 0.5) * (100 / rows);
      const d = Array.from({ length: 26 }, (_, j) => {
        const x = (j / 25) * 100;
        const yy = y + Math.sin((x / 100) * Math.PI * 4 + phase) * amplitude;
        return (j === 0 ? "M" : "L") + " " + x + " " + yy;
      }).join(" ");
      return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.2" stroke-linecap="round" opacity="' + (0.28 + (i % 4) * 0.14) + '"/>';
    }).join("");
    return "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + paths + '</svg>') + "') center / 100% 100% no-repeat, " + p.base;
  }

  function thickWavesSvg(p) {
    const color = (p.bands && p.bands[0]) || "#FFFFFF";
    const rows = 6;
    const amplitude = 6.4;
    const phase = 0.75;
    const paths = Array.from({ length: rows }, (_, i) => {
      const y = (i + 0.5) * (100 / rows);
      const d = Array.from({ length: 26 }, (_, j) => {
        const x = (j / 25) * 100;
        const yy = y + Math.sin((x / 100) * Math.PI * 4 + phase) * amplitude;
        return (j === 0 ? "M" : "L") + " " + x + " " + yy;
      }).join(" ");
      return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="8" stroke-linecap="round" opacity="1"/>';
    }).join("");
    return "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + paths + '</svg>') + "') center / 100% 100% no-repeat, " + p.base;
  }

  function chevronSvg(p) {
    const color = (p.bands && p.bands[0]) || "#FFFFFF";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,0 50,100 100,0" fill="' + color + '"/></svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / 100% 100% no-repeat, " + p.base;
  }

  const CHECKS = 6;

  function trianglesSvg(c, fadeTo, opacity) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>' +
      '<pattern id="t" width="18" height="16" patternUnits="userSpaceOnUse">' +
      '<polygon points="9,0 18,16 0,16" fill="none" stroke="' + c + '" stroke-width="1.1" stroke-opacity="0.55"/>' +
      '<polygon points="9,0 9,16 0,16" fill="' + c + '" fill-opacity="0.22"/></pattern>' +
      '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="' + fadeTo + '"/></linearGradient>' +
      '<mask id="m"><rect width="100%" height="100%" fill="url(#g)"/></mask></defs>' +
      '<rect width="100%" height="100%" fill="url(#t)" mask="url(#m)" opacity="' + opacity + '"/></svg>';
  }

  // Halftone dots on a 200x100 grid: small and sparse at the bottom-left, large and dense
  // toward the top-right (Orlando City's "digital storm" body pattern).
  const DOTS = (function () {
    const out = [];
    for (let row = 0, y = 1.6; y < 100; row++, y = 1.6 + row * 2.9) {
      for (let x = 1.6 + (row % 2 ? 1.7 : 0); x < 200; x += 3.4) {
        const t = Math.max(0, Math.min(1, 0.55 * (x / 200) + 0.45 * (1 - y / 100)));
        out.push([x, y, 0.2 + 1.25 * Math.pow(t, 1.0)]);
      }
    }
    return out;
  })();

  function dotsSvg(c) {
    const circles = DOTS.map(d => '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2].toFixed(2) + '"/>').join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice"><g fill="' + c + '">' + circles + "</g></svg>";
  }

  // Width of the grid the shape generators below build for. Cards use 200; share banners ask
  // for a wider grid (see stripeList / shardList / burstList) so the art fills their shape.
  let GW = 200;

  // Radial ray burst on a 200x100 grid, centred near the top-right like the crest on the
  // New England Revolution home shirt. Wide wedges use the first band colour, thin streaks
  // the second (or white). Each entry is [kind, points] where kind 0 = wedge, 1 = streak.
  function burstList(W) {
    const out = [];
    const cx = W * 0.74, cy = 34, far = Math.max(320, W * 1.6), n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.11;
      const wide = (i % 3 !== 1);
      const half = wide ? 0.052 + 0.05 * ((i * 7) % 5) / 4 : 0.012;
      const pts = [[cx, cy]];
      pts.push([cx + Math.cos(a - half) * far, cy + Math.sin(a - half) * far]);
      pts.push([cx + Math.cos(a + half) * far, cy + Math.sin(a + half) * far]);
      out.push([wide ? 0 : 1, pts]);
    }
    return out;
  }

  const BURST = burstList(200);

  function burstColors(p) {
    const b = p.bands || [];
    return [b[0] || "#CE1126", b[1] || "#FFFFFF"];
  }

  function burstSvg(p) {
    const c = burstColors(p);
    const polys = BURST.map(r => '<polygon fill="' + c[r[0]] + '" opacity="' + (r[0] ? 0.9 : 0.58) + '" points="' +
      r[1].map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ") + '"/>').join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="h" cx="148" cy="34" r="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + p.base + '" stop-opacity="1"/><stop offset="1" stop-color="' + p.base + '" stop-opacity="0"/></radialGradient></defs>' +
      polys + '<circle cx="148" cy="34" r="46" fill="url(#h)"/></svg>';
  }

  // Blocky "bento shard" texture on a 200x100 grid with contrasting sleeve panels at both
  // ends (West Ham 2026/27 home). Entries are [kind, alpha, points]: kind 0 = dark block
  // (second band colour), kind 1 = sleeve panel (first band colour). Blocks of mixed sizes are
  // packed on a 5-unit grid, denser along diagonal streaks, some cut on the diagonal.
  function shardList(W) {
    const out = [];
    const E = W - 70;
    let seed = 11;
    const rnd = function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const U = 5, cols = Math.round(W / 5), rows = 20;
    const used = [];
    for (let r = 0; r < rows; r++) used.push(new Array(cols).fill(false));
    const sizes = [[1, 1], [2, 1], [1, 2], [2, 2], [2, 2], [3, 2], [2, 3], [3, 1], [1, 3]];
    function free(c, r, w, h) {
      if (c + w > cols || r + h > rows) return false;
      for (let j = r; j < r + h; j++) for (let i = c; i < c + w; i++) if (used[j][i]) return false;
      return true;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 4; c < cols - 4; c++) {
        if (used[r][c]) continue;
        const streak = 0.5 + 0.5 * Math.sin((c + r * 0.9) * 0.5);
        if (rnd() > 0.3 + 0.7 * streak) continue;
        const pick = sizes[Math.floor(rnd() * sizes.length)];
        let w = pick[0], h = pick[1];
        if (!free(c, r, w, h)) { w = 1; h = 1; }
        for (let j = r; j < r + h; j++) for (let i = c; i < c + w; i++) used[j][i] = true;
        const x = c * U + 0.5, y = r * U + 0.5, bw = w * U - 1, bh = h * U - 1;
        const a = 0.28 + rnd() * 0.62;
        const cut = rnd();
        let pts = [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]];
        if (cut > 0.72 && bw >= 4 && bh >= 4) pts = [[x, y], [x + bw, y], [x, y + bh]];
        else if (cut > 0.5 && bw >= 4 && bh >= 4) pts = [[x + bw, y], [x + bw, y + bh], [x, y + bh]];
        out.push([0, a, pts]);
      }
    }
    // Sleeve panels (no shapes on them) with a checkered strip along their inner edge.
    const sq = 2.6;
    out.push([1, 1, [[-1, 0], [19, 0], [11, 100], [-1, 100]]]);
    out.push([1, 1, [[W + 1, 0], [E, 0], [E + 8, 100], [W + 1, 100]]]);
    for (let r = 0; r * sq < 100; r++) {
      const y = r * sq;
      [0, 1].forEach(c => {
        if ((r + c) % 2) return;
        const lx = 19 - (y + sq / 2) * 0.08 - (c + 1) * sq;
        const rx = E + (y + sq / 2) * 0.08 + c * sq;
        out.push([0, 0.85, [[lx, y], [lx + sq, y], [lx + sq, y + sq], [lx, y + sq]]]);
        out.push([0, 0.85, [[rx, y], [rx + sq, y], [rx + sq, y + sq], [rx, y + sq]]]);
      });
    }
    return out;
  }

  const SHARDS = shardList(200);

  function shardColors(p) {
    const b = p.bands || [];
    return [b[1] || "#000000", b[0] || "#FFFFFF"];
  }

  function shardsSvg(p) {
    const c = shardColors(p);
    const polys = SHARDS.map(r => '<polygon fill="' + c[r[0]] + '" opacity="' + r[1].toFixed(2) + '" points="' +
      r[2].map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ") + '"/>').join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">' + polys + "</svg>";
  }

  function paintShards(ctx, ox, oy, s, colors, list) {
    (list || SHARDS).forEach(r => {
      ctx.globalAlpha = r[1];
      ctx.fillStyle = colors[r[0]];
      ctx.beginPath();
      r[2].forEach((q, i) => {
        if (i === 0) ctx.moveTo(ox + q[0] * s, oy + q[1] * s); else ctx.lineTo(ox + q[0] * s, oy + q[1] * s);
      });
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Vertical stripe patterns built from shapes on a 200x100 grid. Entries are [kind, alpha, points].
  // "crosses": thick stripes whose lower part fills with a fading lattice of plus signs
  // (Leverkusen home). "pinlines": thick stripes cut by a thin line in the base colour, with a
  // thin line in the stripe colour running down the gap between stripes (Frankfurt home).
  function stripeShapes(kind) {
    const out = [];
    const period = 44, width = 20, first = 6;
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let i = 0; i < Math.ceil((GW - first) / period); i++) {
      const x0 = first + i * period;
      out.push([0, 1, rect(x0, -1, width, 102)]);
      if (kind === "crosses") {
        const step = 5.6;
        for (let r = 0; r * step < 104; r++) {
          const y = r * step;
          const t = Math.max(0, Math.min(1, (y - 10) / 74));
          if (t < 0.1) continue;
          const arm = 0.4 + 1.9 * Math.pow(t, 1.2);
          const th = 0.5 + 1.0 * t;
          const off = r % 2 ? step / 2 : 0;
          for (let x = x0 + step / 2 + off - (off ? step : 0); x < x0 + width; x += step) {
            if (x - arm < x0 || x + arm > x0 + width) continue;
            out.push([1, 1, rect(x - arm, y - th / 2, arm * 2, th)]);
            out.push([1, 1, rect(x - th / 2, y - arm, th, arm * 2)]);
          }
        }
      } else {
        out.push([1, 1, rect(x0 + width / 2 - 0.9, -1, 1.8, 102)]);
        out.push([2, 1, rect(x0 + width + (period - width) / 2 - 0.7, -1, 1.4, 102)]);
      }
    }
    return out;
  }

  // "slashes": dense steep diagonal lines that switch between thick (kind 0) and thin (kind 1)
  // in horizontal zones whose edges step across the card (France 2026 home).
  function slashShapes() {
    const out = [];
    const lean = 0.55, gap = 4.2, zone = 21;
    for (let i = -16; i < Math.ceil(GW / gap) + 13; i++) {
      const xr = i * gap;
      const xAt = y => xr + (y - 50) * lean;
      let ya = -10, kind = -1;
      const bandOf = y => Math.floor((y + xr * 0.34 + 60) / zone);
      const wide = y => (bandOf(y) % 2 + 2) % 2 === 0;
      const flush = (yb) => {
        if (kind < 0) return;
        const w = kind === 0 ? 2.5 : 1.0;
        out.push([kind, 1, [[xAt(ya) - w / 2, ya], [xAt(ya) + w / 2, ya], [xAt(yb) + w / 2, yb], [xAt(yb) - w / 2, yb]]]);
      };
      for (let y = -10; y <= 110; y += 1) {
        const kk = wide(y + 0.5) ? 0 : 1;
        if (kk !== kind) { flush(y); ya = y; kind = kk; }
      }
      flush(110);
    }
    return out;
  }

  // "vee": three chevron bands pointing down with a white gap at the centre, like the 1990
  // style Germany shirt. Kinds 0, 1, 2 take the three band colours from top to bottom.
  function veeShapes() {
    const out = [];
    const slope = 40 / (GW / 2), thick = 14.8, gap = 4, mid = GW / 2;
    [-14, 0.4, 14.8].forEach((y0, kind) => {
      out.push([kind, 1, [[-1, y0 - 0.5], [mid - gap, y0 + (mid + 1 - gap) * slope], [mid - gap, y0 + (mid + 1 - gap) * slope + thick], [-1, y0 + thick - 0.5]]]);
      out.push([kind, 1, [[GW + 1, y0 - 0.5], [mid + gap, y0 + (mid + 1 - gap) * slope], [mid + gap, y0 + (mid + 1 - gap) * slope + thick], [GW + 1, y0 + thick - 0.5]]]);
    });
    return out;
  }

  // "scatter": thin white slashes at assorted angles plus small pale triangles scattered over the
  // base, never touching each other, like the Liverpool 2026/27 home shirt. Kind 0 = slash,
  // kind 1 = triangle. A grid of tiny dots sits behind them (see dotGrid).
  function scatterShapes() {
    const out = [];
    const taken = [];
    let seed = 41;
    const rnd = function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const clear = function (circles) {
      return circles.every(c => taken.every(t => Math.hypot(c[0] - t[0], c[1] - t[1]) > c[2] + t[2] + 1.6));
    };
    let placed = 0;
    for (let tries = 0; tries < 900 * GW / 200 && placed < Math.round(60 * GW / 200); tries++) {
      const isTri = placed % 3 === 2;
      if (isTri) {
        const cx = rnd() * GW, cy = -2 + rnd() * 104;
        const s = 3.2 + rnd() * 3.6;
        if (!clear([[cx, cy, s * 1.25]])) continue;
        const flip = rnd() < 0.5 ? -1 : 1;
        out.push([1, 0.5, [[cx - s * flip, cy + s], [cx + s * flip, cy + s], [cx + (rnd() - 0.5) * s, cy - s]]]);
        taken.push([cx, cy, s * 1.25]);
      } else {
        const cx = rnd() * GW, cy = -2 + rnd() * 104;
        const len = 8 + rnd() * 22;
        const ang = (rnd() < 0.5 ? 1 : -1) * (0.5 + rnd() * 0.95);
        const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
        const circles = [];
        for (let i = -2; i <= 2; i++) circles.push([cx + dx * i / 2, cy + dy * i / 2, len / 8 + 0.6]);
        if (!clear(circles)) continue;
        const nx = -Math.sin(ang) * 0.4, ny = Math.cos(ang) * 0.4;
        out.push([0, 0.9, [[cx - dx + nx, cy - dy + ny], [cx + dx + nx, cy + dy + ny], [cx + dx - nx, cy + dy - ny], [cx - dx - nx, cy - dy - ny]]]);
        circles.forEach(c => taken.push(c));
      }
      placed++;
    }
    return out;
  }

  // Tiny vector dots on a staggered grid behind the scatter shapes.
  function dotGrid(ctx, ox, oy, s, color, W) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let row = 0, y = 1.7; y < 100; row++, y = 1.7 + row * 3.4) {
      for (let x = 1.7 + (row % 2 ? 1.7 : 0); x < (W || 200); x += 3.4) {
        ctx.moveTo(ox + (x + 0.4) * s, oy + y * s);
        ctx.arc(ox + x * s, oy + y * s, 0.4 * s, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  function dotGridSvg(color, W) {
    return '<defs><pattern id="d" width="3.4" height="3.4" patternUnits="userSpaceOnUse"><circle cx="0.85" cy="0.85" r="0.4" fill="' + color + '"/><circle cx="2.55" cy="2.55" r="0.4" fill="' + color + '"/></pattern></defs><rect width="' + (W || 200) + '" height="100" fill="url(#d)"/>';
  }

  // "raglan": a white band with a checkered edge on both sides and a thick maroon band
  // either side, on the base colour (Arsenal home). It is centred in the middle of the grid so
  // it survives the cropping a home-page card applies. Kinds: 0 band, 1 stripe, 2 check squares.
  function raglanShapes() {
    const out = [];
    const lean = 0.09, sq = GW > 300 ? 3.4 : 2.6;
    const shear = (x, y) => [x + (y - 50) * lean, y];
    const quad = (x1, x2, y1, y2) => [shear(x1, y1), shear(x2, y1), shear(x2, y2), shear(x1, y2)];
    const K = GW > 300 ? 2.2 : 1;
    const x0 = GW - 62 * K, x1 = GW - 22 * K;
    out.push([0, 1, quad(x0, x1, -10, 110)]);
    [[x0 - 12 * K, x0], [x1, x1 + 12 * K]].forEach(p => out.push([1, 1, quad(p[0], p[1], -10, 110)]));
    for (let r = 0; r * sq < 120; r++) {
      const y = -10 + r * sq;
      [x0, x0 + sq, x1 - sq * 2, x1 - sq].forEach((cx, c) => {
        if ((r + c) % 2) return;
        out.push([2, 1, quad(cx, cx + sq, y, y + sq)]);
      });
    }
    return out;
  }

  // "streaks": fine parallel lines that sweep through the card in a big "S" curve, broken into
  // runs so the texture stays faint and tone-on-tone (the Villarreal 2026/27 home shirt print).
  // Kind 0 = line (first band colour).
  function streakShapes() {
    const out = [];
    let seed = 5;
    const rnd = function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const gap = 4.2, w = 1.5, step = 4;
    const curve = (xr, y) => xr + 16 * Math.sin((y / 100) * Math.PI * 2 + xr * 0.012) + 5 * Math.sin(y * 0.13 + xr * 0.02);
    for (let xr = -20; xr < GW + 20; xr += gap) {
      let run = null;
      const flush = () => {
        if (run && run.length > 2) {
          const left = run.map(q => [q[0] - w / 2, q[1]]);
          const right = run.map(q => [q[0] + w / 2, q[1]]).reverse();
          out.push([0, 0.85, left.concat(right)]);
        }
        run = null;
      };
      for (let y = -4; y <= 104; y += step) {
        const x = curve(xr, y);
        const f = 0.5 + 0.5 * Math.sin(y * 0.05 + xr * 0.045) * Math.cos(xr * 0.03 - y * 0.02);
        if (f > 0.34 + rnd() * 0.12) {
          if (!run) run = [];
          run.push([x, y]);
        } else {
          flush();
        }
      }
      flush();
    }
    return out;
  }

  // "swell": wide rolling bands in the first band colour with a darker shadow under each one,
  // like the USA 2026 home shirt. Kind 0 = band, kind 1 = shadow edge (second band colour).
  function swellShapes() {
    const out = [];
    const period = 21, band = 11.5, amp = 7, k = (Math.PI * 2) / 105, phase = 0.9;
    const wave = (x, y) => y + amp * Math.sin(x * k + phase);
    for (let y = -30; y < 135; y += period) {
      const top = [], bot = [], shadow = [];
      for (let x = -10; x <= GW + 10; x += 4) {
        top.push([x, wave(x, y)]);
        bot.push([x, wave(x, y) + band]);
      }
      const botRev = bot.slice().reverse();
      out.push([1, 0.85, bot.map(q => [q[0], q[1] - 0.6]).concat(bot.slice().reverse().map(q => [q[0], q[1] + 2.6]))]);
      out.push([0, 1, top.concat(botRev)]);
    }
    return out;
  }

  // "stars": upright five-point stars, all the same size, on a regular staggered grid in the
  // first band colour on the base, like the USA 2026 away shirt. Kind 0 = star.
  function starShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1;
    const r = 5.2 * K, dx = 23 * K, dy = 17 * K;
    for (let row = 0, y = 4; y < 112; row++, y += dy) {
      for (let x = (row % 2 ? dx / 2 : 0) + 4; x < GW + 14; x += dx) {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 ? r * 0.4 : r;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
        }
        out.push([0, 0.85, pts]);
      }
    }
    return out;
  }

  // "ornament": delicate tone-on-tone line work (nested diamonds with small knot motifs and
  // dotted lines) in the first band colour, like the Fiorentina 2026/27 home shirt.
  function ornamentShapes() {
    const out = [];
    const A = 0.8;
    const LW = GW > 300 ? 1.7 : 1;
    const seg = (x1, y1, x2, y2, w0) => {
      const w = w0 * LW;
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l * w / 2, ny = dx / l * w / 2;
      out.push([0, A, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]]);
    };
    const diamond = (cx, cy, rx, ry, w) => {
      seg(cx, cy - ry, cx + rx, cy, w); seg(cx + rx, cy, cx, cy + ry, w);
      seg(cx, cy + ry, cx - rx, cy, w); seg(cx - rx, cy, cx, cy - ry, w);
    };
    const dots = (x1, y1, x2, y2, n, s) => {
      for (let i = 0; i <= n; i++) {
        const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
        out.push([0, A, [[x - s, y], [x, y - s], [x + s, y], [x, y + s]]]);
      }
    };
    const knot = (cx, cy, r) => {
      diamond(cx, cy, r, r, 0.45);
      diamond(cx, cy, r * 0.55, r * 0.55, 0.4);
      seg(cx - r * 1.5, cy, cx + r * 1.5, cy, 0.4);
      seg(cx, cy - r * 1.5, cx, cy + r * 1.5, 0.4);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(q => {
        out.push([0, A, [[cx + q[0] * r * 0.5 - 0.7, cy + q[1] * r * 0.5 - 0.7], [cx + q[0] * r * 0.5 + 0.7, cy + q[1] * r * 0.5 - 0.7], [cx + q[0] * r * 0.5 + 0.7, cy + q[1] * r * 0.5 + 0.7], [cx + q[0] * r * 0.5 - 0.7, cy + q[1] * r * 0.5 + 0.7]]]);
      });
    };
    const centres = [];
    for (let c = GW / 2; c < GW + 120; c += 110) centres.push([c, 50]);
    for (let c = GW / 2 - 110; c > -120; c -= 110) centres.push([c, 50]);
    centres.forEach((c, n) => {
      const cx = c[0], cy = c[1];
      [[10, 0.5], [15, 0.4], [34, 0.5], [38, 0.4], [60, 0.5], [64, 0.4], [86, 0.5]].forEach(d => diamond(cx, cy, d[0] * 1.9 / 1.9 * 1.4, d[0] * 0.95, d[1]));
      knot(cx, cy, 4.2);
      [24, 49, 75].forEach(r => {
        const rx = r * 1.4, ry = r * 0.95;
        dots(cx, cy - ry, cx + rx, cy, 7 + Math.round(r / 12), 0.55);
        dots(cx + rx, cy, cx, cy + ry, 7 + Math.round(r / 12), 0.55);
        dots(cx, cy + ry, cx - rx, cy, 7 + Math.round(r / 12), 0.55);
        dots(cx - rx, cy, cx, cy - ry, 7 + Math.round(r / 12), 0.55);
      });
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(q => {
        knot(cx + q[0] * 49 * 1.4 * 0.5 + (q[0] ? 0 : 0), cy + q[1] * 49 * 0.95 * 0.5, 3.4);
        knot(cx + q[0] * 75 * 1.4 * 0.5, cy + q[1] * 75 * 0.95 * 0.5, 3.4);
      });
    });
    return out;
  }

  // ---- away / third kit art -------------------------------------------------------------

  function seeded(seed) {
    let s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  // "bruise": jagged zig-zag strokes and small triangles scattered over the base, in the first
  // band colour (Arsenal away, after the 1991-93 "bruised banana" print). Kind 0.
  function bruiseShapes() {
    const out = [];
    const rnd = seeded(3);
    const K = GW > 300 ? 1.5 : 1;
    const n = Math.round((GW / 8.5) / K);
    for (let i = 0; i < n; i++) {
      let x = rnd() * (GW + 40) - 20, y = -10 + rnd() * 90;
      const segs = 5 + Math.floor(rnd() * 5), w = (1.6 + rnd() * 1.4) * K, amp = (4 + rnd() * 4) * K;
      const pts = [[x, y]];
      for (let s = 0; s < segs; s++) {
        x += (3.2 + rnd() * 2) * K;
        y += (6 + rnd() * 3) * K;
        pts.push([x + (s % 2 ? amp : -amp), y]);
      }
      const left = pts.map(q => [q[0] - w / 2, q[1]]);
      const right = pts.map(q => [q[0] + w / 2, q[1]]).reverse();
      out.push([0, 0.85, left.concat(right)]);
      if (rnd() < 0.5) {
        const tx = pts[pts.length - 1][0] + 2 * K, ty = pts[pts.length - 1][1];
        out.push([0, 0.85, [[tx, ty], [tx + 5 * K, ty + 2 * K], [tx + 1 * K, ty + 7 * K]]]);
      }
    }
    return out;
  }

  // "pole": one vertical stripe whose colour fades away downward, white base around it (Man City
  // third). Kind 0 = top colour, kind 1 = fade colour.
  function poleShapes() {
    const out = [];
    const K = GW > 300 ? 2.2 : 1;
    const cx = GW > 300 ? GW * 0.7 : GW / 2;
    const bw = 7.5 * K, gap = 0.5 * K;
    const N = 90;
    const prof = t => 0.04 + 0.96 * Math.pow(Math.abs(2 * t - 1), 1.5);
    for (let i = 0; i < N; i++) {
      const y0 = -4 + (i * 108) / N, y1 = -4 + ((i + 1) * 108) / N + 0.3;
      const ya = (y0 + 4) / 108, yb = (y1 + 4) / 108;
      const al = prof((ya + yb) / 2);
      // the upper part leans outward so the two bars open into the V of the collar
      const lean = t => 6 * K * Math.max(0, 1 - t / 0.3);
      [-1, 1].forEach(s => {
        const inner = cx + s * gap / 2, outer = cx + s * (gap / 2 + bw);
        const li = s * lean(ya), lj = s * lean(yb);
        let quad = [[inner + li * 0.6, y0], [outer + li, y0], [outer + lj, y1], [inner + lj * 0.6, y1]];
        if (i === 0) quad = [[inner + li * 0.6, y0 + 9], [outer + li, y0], [outer + lj, y1], [inner + lj * 0.6, y1]];
        out.push([s < 0 ? 0 : 1, al, quad]);
      });
    }
    return out;
  }

  // "swirls": soft overlapping watercolour blobs in up to three band colours (West Ham third,
  // Leverkusen away). Kinds 0-2.
  function swirlShapes() {
    const out = [];
    const rnd = seeded(17);
    const K = GW > 300 ? 1.6 : 1;
    const n = Math.round((14 * GW) / 200 / (K > 1 ? 1.5 : 1));
    for (let i = 0; i < n; i++) {
      const x0 = -10 + rnd() * (GW + 20), y0 = 5 + rnd() * 90;
      const len = (45 + rnd() * 55) * K, amp = (7 + rnd() * 9) * K, f = 0.05 + rnd() * 0.05, ph = rnd() * 6.28;
      const w0 = (5 + rnd() * 6) * K, dir = rnd() < 0.5 ? -1 : 1;
      const left = [], right = [];
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const x = x0 + t * len, y = y0 + dir * amp * Math.sin(t * len * f + ph) + (t - 0.5) * 8 * K;
        const w = w0 * (0.25 + 0.75 * Math.sin(Math.PI * t));
        left.push([x, y - w / 2]);
        right.push([x, y + w / 2]);
      }
      out.push([i % 3, 0.35 + rnd() * 0.4, left.concat(right.reverse())]);
    }
    return out;
  }

  // "ticks": a faint zig-zag (herringbone) texture with small stacks of three diamonds spread
  // out in a staggered grid (Germany away). Kind 0 = diamonds (first band colour), kind 1 = the
  // zig-zag texture (second band colour).
  function tickShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1;
    // chevron rows of equal height, every other one in the lighter tone
    const rh = 8.6 * K, zw = 38 * K, amp = 7.5 * K;
    for (let r = 0, y0 = -14 * K; y0 < 112; r++, y0 += rh) {
      if (r % 2) continue;
      const top = [], bot = [];
      for (let x = -zw; x <= GW + zw; x += zw / 4) {
        const ph = ((x % zw) + zw) % zw / zw;
        const yy = y0 + amp * Math.abs(ph * 2 - 1);
        top.push([x, yy]);
        bot.push([x, yy + rh]);
      }
      out.push([1, 1, top.concat(bot.reverse())]);
    }
    // stacked diamonds
    const dx = 40 * K, dy = 46 * K, w = 1.9 * K, h = 2.7 * K, step = 3.9 * K;
    for (let row = 0, y = 10; y < 108; row++, y += dy) {
      for (let x = (row % 2 ? dx / 2 : 0) + 9; x < GW + dx; x += dx) {
        for (let i = 0; i < 3; i++) {
          const cy = y + (i - 1) * step;
          out.push([0, 0.95, [[x, cy - h], [x + w, cy], [x, cy + h], [x - w, cy]]]);
        }
      }
    }
    return out;
  }

  // "gridiron": diagonal navy and red stripes across the end of the card, like the striped
  // sleeves on the Cagliari away shirt. Kind 0 = first colour, kind 1 = second colour.
  function gridironShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1;
    const len = 62 * K, w = 4.6 * K, gap = 3.2 * K, lean = 0.5;
    const q = (x0, x1) => [[x0, -5], [x1, -5], [x1 - 110 * lean, 105], [x0 - 110 * lean, 105]];
    let x = GW - len, i = 0;
    while (x < GW + 120) {
      out.push([i % 2, 1, q(x, x + w)]);
      x += w + gap;
      i++;
    }
    return out;
  }

  // "hexes": a honeycomb of faintly lit hexagons in the first band colour (Man City away bees).
  function hexShapes() {
    const out = [];
    const rnd = seeded(29);
    const K = GW > 300 ? 1.6 : 1;
    const r = 6.2 * K, h = r * Math.sqrt(3) / 2;
    for (let row = 0, y = 0; y < 112; row++, y += h * 1.0) {
      for (let x = (row % 2 ? r * 1.5 : 0); x < GW + r * 2; x += r * 3) {
        if (rnd() < 0.42) continue;
        const pts = [];
        for (let a = 0; a < 6; a++) pts.push([x + Math.cos((a * Math.PI) / 3) * (r - 0.5), y + Math.sin((a * Math.PI) / 3) * (r - 0.5)]);
        out.push([0, 0.12 + rnd() * 0.5, pts]);
      }
    }
    return out;
  }

  // ---- second round of kit art ----------------------------------------------------------

  // Smooth 2D value noise in [0, 1].
  function noise2(seed) {
    const h = (ix, iy) => {
      let n = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
      n = (n ^ (n >>> 13)) * 1274126177;
      n = n ^ (n >>> 16);
      return ((n >>> 0) % 100000) / 100000;
    };
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
      const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  // "contours": long, smooth wavy lines that swell and settle with a slow noise field, nested
  // like topographic contours (the Villarreal 2026/27 kits). Kind 0.
  function contourShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1;
    const warp = noise2(7), tilt = noise2(19), gate = noise2(31);
    const gap = 4.1 * K, w = 0.85 * K;
    for (let yb = -14; yb < 116; yb += gap) {
      let run = null;
      const flush = () => {
        if (run && run.length > 3) {
          out.push([0, 0.5, run.map(q => [q[0], q[1] - w / 2]).concat(run.map(q => [q[0], q[1] + w / 2]).reverse())]);
        }
        run = null;
      };
      for (let x = -6; x <= GW + 6; x += 2.5) {
        const y = yb + 9 * K * (warp(x * 0.018 / K, yb * 0.02) * 2 - 1) + 3 * K * (tilt(x * 0.035 / K, yb * 0.03) * 2 - 1);
        if (gate(x * 0.022 / K + 3, yb * 0.03) > 0.1) {
          if (!run) run = [];
          run.push([x, y]);
        } else {
          flush();
        }
      }
      flush();
    }
    return out;
  }

  // "golden": the single golden-ratio figure from the Fiorentina centenary shirt (a near-square
  // frame split at the golden section, a big circle through it and one small spiral at the upper
  // left), alone in the middle on a background of very large, faint geometric tiles (Fiorentina
  // third).
  function goldenShapes() {
    const out = [];
    const A = 0.78, lw = GW > 300 ? 1.2 : 0.95;
    const seg = (x1, y1, x2, y2, w, al) => {
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l * w / 2, ny = dx / l * w / 2;
      out.push([0, al || A, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]]);
    };
    const arc = (cx, cy, r, a0, a1, w, al) => {
      const n = 40;
      let px = cx + Math.cos(a0) * r, py = cy + Math.sin(a0) * r;
      for (let i = 1; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        seg(px, py, x, y, w, al);
        px = x; py = y;
      }
    };
    const diamond = (x, y, rx, ry, al) => out.push([0, al, [[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]]]);
    const phi = 1.6180339887;
    const cx = GW / 2, cy = 50;
    const H = GW > 300 ? 90 : 74, Wd = H * phi;
    const lwf = GW > 300 ? 1.5 : 1.2;
    let x0 = cx - Wd / 2, y0 = cy - H / 2, w = Wd, h = H;
    // the golden rectangle
    seg(x0, y0, x0 + w, y0, lwf, 0.9); seg(x0 + w, y0, x0 + w, y0 + h, lwf, 0.9);
    seg(x0 + w, y0 + h, x0, y0 + h, lwf, 0.9); seg(x0, y0 + h, x0, y0, lwf, 0.9);
    // circle inscribed in the first square
    arc(x0 + H / 2, cy, H / 2, 0, Math.PI * 2, lwf * 0.8, 0.7);
    // successive squares with the quarter-circle arcs that make the spiral
    let side = 0;
    for (let i = 0; i < 9; i++) {
      const s = Math.min(w, h);
      if (s < 1.5) break;
      if (side === 0) {
        arc(x0 + s, y0 + s, s, Math.PI, Math.PI * 1.5, lwf * 1.3, 0.95);
        seg(x0 + s, y0, x0 + s, y0 + h, lwf * 0.8, 0.85);
        x0 += s; w -= s;
      } else if (side === 1) {
        arc(x0, y0 + s, s, -Math.PI / 2, 0, lwf * 1.3, 0.95);
        seg(x0, y0 + s, x0 + w, y0 + s, lwf * 0.8, 0.85);
        y0 += s; h -= s;
      } else if (side === 2) {
        arc(x0 + w - s, y0, s, 0, Math.PI / 2, lwf * 1.3, 0.95);
        seg(x0 + w - s, y0, x0 + w - s, y0 + h, lwf * 0.8, 0.85);
        w -= s;
      } else {
        arc(x0 + w, y0 + h - s, s, Math.PI / 2, Math.PI, lwf * 1.3, 0.95);
        seg(x0, y0 + h - s, x0 + w, y0 + h - s, lwf * 0.8, 0.85);
        h -= s;
      }
      side = (side + 1) % 4;
    }
    const Wd2 = Wd, H2 = H;
    // very large faint tiles spread over the whole background
    const gxs = GW > 300 ? 118 : 92, gys = 78;
    const figHalf = Wd2 / 2 + H2 * 0.08;
    let n = 0;
    for (let row = -1; row < 3; row++) {
      for (let x = -gxs / 3 + (row % 2 ? gxs / 2 : 0); x < GW + gxs; x += gxs) {
        const y = 6 + row * gys;
        n++;
        if (Math.abs(x - cx) < figHalf + 22 && y > -10 && y < 110) continue;
        const kind = n % 4;
        if (kind === 0) {
          const c = 15;
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) diamond(x - 22 + i * c, y - 22 + j * c, c * 0.46, c * 0.46, 0.14);
        } else if (kind === 1) {
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => arc(x + d[0] * 16, y + d[1] * 16, 17, 0, Math.PI * 2, 1.8, 0.16));
          arc(x, y, 33, 0, Math.PI * 2, 1.4, 0.14);
        } else if (kind === 2) {
          diamond(x, y, 10, 32, 0.17); diamond(x, y, 32, 10, 0.17);
          diamond(x + 42, y, 8, 8, 0.17); diamond(x - 42, y, 8, 8, 0.17);
          diamond(x, y + 40, 8, 8, 0.17); diamond(x, y - 40, 8, 8, 0.17);
        } else {
          for (let q = 1; q <= 4; q++) diamond(x, y, 11 * q, 11 * q, 0.05 + 0.025 * q);
          arc(x, y, 10, 0, Math.PI * 2, 2, 0.2);
        }
      }
    }
    return out;
  }

  // "vtex": rows of downward-pointing dark triangles with thin light rules, tone-on-tone (the
  // Arsenal away "V" texture). Kind 0 = triangle, kind 1 = rule.
  function vtexShapes() {
    const out = [];
    const K = GW > 300 ? 1.5 : 1;
    const rowH = 19 * K, tw = 28 * K;
    for (let row = 0, y = -4; y < 108; row++, y += rowH) {
      for (let x = (row % 2 ? tw / 2 : 0) - tw; x < GW + tw; x += tw) {
        out.push([0, 0.75, [[x, y], [x + tw, y], [x + tw / 2, y + rowH - 1]]]);
      }
      out.push([1, 0.4, [[-2, y + rowH - 1.2], [GW + 2, y + rowH - 1.2], [GW + 2, y + rowH - 0.2], [-2, y + rowH - 0.2]]]);
      const off = row % 2 ? 0 : tw / 2;
      for (let x = 0; x < GW + tw; x += tw) {
        out.push([1, 0.22, [[x + off - 0.4, y + rowH * 0.3], [x + off + 0.4, y + rowH * 0.3], [x + off + 0.4, y + rowH], [x + off - 0.4, y + rowH]]]);
      }
    }
    return out;
  }

  // "skewchecks": a skewed, blurred-looking checkerboard of uneven cells, with some cells cut
  // into triangles (Liverpool third).
  function skewcheckShapes() {
    const out = [];
    const rnd = seeded(13);
    const K = GW > 300 ? 1.6 : 1;
    for (let y = -6, row = 0; y < 106; row++) {
      const rh = (10 + rnd() * 9) * K, sk = (rnd() - 0.5) * 10 * K;
      let x = -20 + rnd() * 10;
      let on = row % 2 === 0;
      while (x < GW + 20) {
        const cw = (11 + rnd() * 10) * K;
        const a = 0.35 + rnd() * 0.6;
        const tl = [x + sk, y], tr = [x + cw + sk, y], br = [x + cw - sk, y + rh], bl = [x - sk, y + rh];
        const roll = rnd();
        if (roll < 0.34) {
          // triangle: either half of the cell, drawn whether or not the cell is "on"
          out.push([0, a, roll < 0.17 ? [tl, tr, bl] : [tr, br, bl]]);
          if (on) out.push([0, a * 0.7, roll < 0.17 ? [tr, br, bl] : [tl, tr, bl]]);
        } else if (on) {
          out.push([0, a, [tl, tr, br, bl]]);
        }
        x += cw;
        on = !on;
      }
      y += rh;
    }
    return out;
  }

  // "bees": a tone-on-tone grid of worker bees (Man City away). Kind 0 = body, kind 1 = wings.
  function beeShapes() {
    const out = [];
    const K = GW > 300 ? 1.5 : 1;
    const dx = 40 * K, dy = 34 * K, s = 1.25 * K;
    const ell = (cx, cy, rx, ry, rot) => {
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
      }
      return pts;
    };
    for (let row = 0, y = 6; y < 112; row++, y += dy) {
      for (let x = (row % 2 ? dx / 2 : 0) + 8; x < GW + dx; x += dx) {
        out.push([1, 0.65, ell(x - 6.5 * s, y - 1 * s, 7.5 * s, 3.4 * s, -0.55)]);
        out.push([1, 0.65, ell(x + 6.5 * s, y - 1 * s, 7.5 * s, 3.4 * s, 0.55)]);
        out.push([0, 0.8, ell(x, y + 3 * s, 3.4 * s, 6.6 * s, 0)]);
        out.push([0, 0.8, ell(x, y - 5 * s, 2.6 * s, 2.6 * s, 0)]);
        [0, 3, 6].forEach(o => out.push([1, 0.9, [[x - 3.4 * s, y + (o + 1) * s], [x + 3.4 * s, y + (o + 1) * s], [x + 3.4 * s, y + (o + 1.8) * s], [x - 3.4 * s, y + (o + 1.8) * s]]]));
      }
    }
    return out;
  }

  // "vbars": wide soft vertical bars each flanked by a thin rule, tone-on-tone (Dortmund third).
  function vbarShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1;
    const p = 14 * K;
    for (let x = 2; x < GW + p; x += p) {
      out.push([0, 0.55, [[x, -2], [x + 6 * K, -2], [x + 6 * K, 102], [x, 102]]]);
      out.push([0, 0.35, [[x + 10 * K, -2], [x + 10.9 * K, -2], [x + 10.9 * K, 102], [x + 10 * K, 102]]]);
    }
    return out;
  }

  // "marble": flowing, ink-marbling-like ribbons in up to three band colours that swell and thin
  // along a drifting noise field (Leverkusen away). Kinds: 0 = deepest, 1 = middle, 2 = lightest.
  // On banners it thickens toward the right edge, where the sleeves are.
  function marbleShapes() {
    const out = [];
    const warp = noise2(3), warp2 = noise2(11), tone = noise2(23), width = noise2(37);
    const K = GW > 300 ? 1.6 : 1;
    const gap = 2.6 * K;
    for (let yb = -12; yb < 114; yb += gap) {
      const parts = [];
      let run = null;
      for (let x = -6; x <= GW + 6; x += 3) {
        const rt = GW > 300 ? Math.min(1, Math.max(0, (x / GW - 0.05) / 0.7)) : 0.8;
        const rightness = rt * rt * (3 - 2 * rt);
        const y = yb + 12 * K * (warp(x * 0.028 / K, yb * 0.02) * 2 - 1) + 4.5 * K * (warp2(x * 0.09 / K, yb * 0.05) * 2 - 1);
        const t = tone(x * 0.04 / K, yb * 0.045);
        const w = (2.7 + 4.6 * width(x * 0.07 / K + 5, yb * 0.06)) * K * (0.15 + 0.95 * rightness);
        const kind = t > 0.6 ? 0 : t > 0.38 ? 1 : 2;
        if (w > 0.7 * K) {
          if (run && run.kind !== kind) { parts.push(run); run = null; }
          if (!run) run = { kind, pts: [] };
          run.pts.push([x, y, w]);
        } else if (run) {
          parts.push(run);
          run = null;
        }
      }
      if (run) parts.push(run);
      parts.forEach(r => {
        if (r.pts.length < 2) return;
        out.push([r.kind, 0.88, r.pts.map(q => [q[0], q[1] - q[2] / 2]).concat(r.pts.map(q => [q[0], q[1] + q[2] / 2]).reverse())]);
      });
    }
    return out;
  }

  // "rings": soft spray-paint circles drawn as feathered rings, plus a solid side panel at the
  // right end (West Ham third). Kind 0 = ring, kind 1 = panel.
  function ringShapes() {
    const out = [];
    const rnd = seeded(23);
    const K = GW > 300 ? 1.7 : 1;
    const circle = (cx, cy, r, n) => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return pts;
    };
    const taken = [];
    const count = Math.round((5 * GW) / 200 / (K > 1 ? 1.2 : 1));
    for (let tries = 0; tries < 400 && taken.length < count; tries++) {
      const r = (20 + rnd() * 26) * K, cx = rnd() * GW, cy = rnd() * 100;
      if (taken.some(t => Math.hypot(cx - t[0], cy - t[1]) < (r + t[2]) * 0.7)) continue;
      taken.push([cx, cy, r]);
      [[5.2, 0.12], [3.6, 0.2], [2.4, 0.3], [1.4, 0.45]].forEach(b => {
        const o = circle(cx, cy, r + b[0] * K, 36), i = circle(cx, cy, r - b[0] * K, 36);
        for (let j = 0; j < 36; j++) {
          const j2 = (j + 1) % 36;
          out.push([0, b[1], [o[j], o[j2], i[j2], i[j]]]);
        }
      });
    }
    out.push([1, 1, [[GW + 1, -1], [GW - 34 * K, -1], [GW - 28 * K, 101], [GW + 1, 101]]]);
    return out;
  }

  // "flash": many faint lightning strikes, one per vertical layer, each running the full height
  // and side by side across the width (Dortmund away). Kind 0.
  function flashShapes() {
    const out = [];
    const rnd = seeded(61);
    const K = GW > 300 ? 1.6 : 1;
    const step = 21 * K, Wb = 30 * K;
    const bolt = [[0.5, -0.06], [0.98, -0.06], [0.68, 0.42], [1.04, 0.42], [0.04, 1.06], [0.36, 0.56], [-0.05, 0.56]];
    for (let x = -10 * K; x < GW + 20; x += step) {
      const dx = (rnd() - 0.5) * 6 * K;
      out.push([0, 0.12 + rnd() * 0.2, bolt.map(q => [x + dx + q[0] * Wb, q[1] * 100])]);
    }
    return out;
  }

  // "baroque": big teardrop scrolls that curl inward, like the Bembel jug pattern (Frankfurt away).
  // Kind 0 = scroll (first band colour).
  function baroqueShapes() {
    const out = [];
    const rnd = seeded(83);
    const K = GW > 300 ? 1.5 : 1;
    const scroll = (cx, cy, r, dir, rot) => {
      const left = [], right = [];
      const n = 30;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const ang = rot + dir * t * Math.PI * 2.25;
        const rad = r * (1 - 0.72 * t);
        const px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * 0.95;
        const tx = -Math.sin(ang) * dir, ty = Math.cos(ang) * dir;
        const w = r * 0.95 * Math.pow(1 - t, 0.45) * (0.45 + 0.55 * Math.min(1, (1 - t) * 3)) + 0.4;
        left.push([px + tx * w, py + ty * w]);
        right.push([px - tx * w, py - ty * w]);
      }
      out.push([0, 0.95, left.concat(right.reverse())]);
    };
    const drop = (x, y, r) => {
      const pts = [];
      for (let i = 0; i < 14; i++) pts.push([x + Math.cos((i / 14) * Math.PI * 2) * r, y + Math.sin((i / 14) * Math.PI * 2) * r * 1.15]);
      out.push([0, 0.95, pts]);
    };
    for (let col = 0, x = 6 * K; x < GW + 20 * K; col++, x += 30 * K) {
      for (let row = 0; row < 3; row++) {
        if (rnd() < 0.18) continue;
        const r = (10 + rnd() * 7) * K;
        scroll(x + (rnd() - 0.5) * 8 * K, 16 + row * 34 + (rnd() - 0.5) * 8, r, rnd() < 0.5 ? 1 : -1, rnd() * Math.PI * 2);
        if (rnd() < 0.7) drop(x + (rnd() - 0.5) * 24 * K, 8 + row * 34 + rnd() * 26, (1.6 + rnd() * 1.6) * K);
      }
    }
    return out;
  }

  // "herring": fine herringbone chevron lines in the first band colour that pile into large
  // upward-pointing arrows, (New England Revolution away, Arsenal away). Kind 0.
  function herringShapes() {
    const out = [];
    const K = GW > 300 ? 1.5 : 1;
    const zw = 30 * K, amp = 15 * K, gap = 4.4 * K, w = 2.5 * K;
    for (let y0 = -16 * K; y0 < 112; y0 += gap) {
      const top = [], bot = [];
      for (let x = -zw; x <= GW + zw; x += zw / 4) {
        const ph = ((x % zw) + zw) % zw / zw;
        const yy = y0 + amp * Math.abs(ph * 2 - 1);
        top.push([x, yy]);
        bot.push([x, yy + w]);
      }
      out.push([0, 0.95, top.concat(bot.reverse())]);
    }
    return out;
  }

  // "ripple": soft concentric rings spreading from a point near the top right, with a very faint
  // diagonal lattice across them (Cagliari third). Kind 0 = dark rings, kind 1 = light rings.
  function rippleShapes() {
    const out = [];
    const K = GW > 300 ? 1.5 : 1;
    const cx = GW * (GW > 300 ? 0.74 : 0.6), cy = 18;
    const ring = (r, w, kind, al) => {
      const n = 64, o = [], i = [];
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        o.push([cx + Math.cos(a) * (r + w / 2) * 1.25, cy + Math.sin(a) * (r + w / 2)]);
        i.push([cx + Math.cos(a) * (r - w / 2) * 1.25, cy + Math.sin(a) * (r - w / 2)]);
      }
      for (let j = 0; j < n; j++) {
        const j2 = (j + 1) % n;
        out.push([kind, al, [o[j], o[j2], i[j2], i[j]]]);
      }
    };
    for (let r = 6 * K, idx = 0; r < 150 * K; r += 6.2 * K, idx++) {
      ring(r, 2.6 * K, 0, 0.5 - Math.min(0.28, r / (400 * K)));
      ring(r + 3.1 * K, 1.6 * K, 1, 0.28);
    }
    // faint diagonal lattice
    const g = 8 * K;
    for (let x = -100; x < GW + 100; x += g) {
      out.push([0, 0.12, [[x, -2], [x + 0.5 * K, -2], [x + 0.5 * K + 70, 102], [x + 70, 102]]]);
      out.push([0, 0.12, [[x, -2], [x + 0.5 * K, -2], [x + 0.5 * K - 70, 102], [x - 70, 102]]]);
    }
    return out;
  }

  // "dashes": rows of short horizontal dashes that gather into dense, bright zones and thin out
  // into the base, like the speed-line texture on the France 2018 sleeves. Kind 0.
  function dashShapes() {
    const out = [];
    const rnd = seeded(97), zone = noise2(53);
    const K = GW > 300 ? 1.5 : 1;
    const rowGap = 2.1 * K, h = 0.95 * K;
    for (let row = 0, y = -2; y < 104; row++, y += rowGap) {
      let x = rnd() * 6 * K - 4;
      while (x < GW + 6) {
        const len = (2 + rnd() * 8) * K;
        const dens = zone(x * 0.02 / K + 2, y * 0.045) * 0.75 + (1 - x / GW) * 0.25;
        if (rnd() < dens * dens * 1.5) {
          const xo = (row % 2) * 1.3 * K;
          out.push([0, 0.55 + 0.45 * dens, [[x + xo, y], [x + xo + len, y], [x + xo + len, y + h], [x + xo, y + h]]]);
        }
        x += len + (0.8 + rnd() * 3.2) * K;
      }
    }
    return out;
  }

  // "weft": a halftone knit that runs to the right edge (no flat block): thick bright rows
  // with tiny dark dots punched through them, the dots growing and the rows thinning with
  // distance until only thin dotted lines are left, in many different lengths. No flat block
  // (France 2018 sleeve). Kind 0 = bright rows and seam, kind 1 = dark dots (the base colour).
  function weftShapes() {
    const out = [];
    const rnd = seeded(71), reach = noise2(43), jit = noise2(17);
    const wide = GW > 300;
    const K = wide ? 1.5 : 1;
    const seam = 0;
    const edge = GW + 1;
    const maxL = (GW - seam) * 0.97;
    const rowGap = 1.9 * K, step = 2.0 * K;
    const q = a => Math.round(a * 10) / 10;
    const rows = [];
    for (let y = -1; y < 104; y += rowGap) {
      const g = reach(y * 0.12, 3.7);
      const L = (0.22 + 0.78 * Math.pow(0.6 * g + 0.4 * rnd(), 0.9)) * maxL;
      rows.push([y, L]);
    }
    // bright rows: thick at the seam, thin far away
    rows.forEach(r => {
      const y = r[0], L = r[1], x1 = edge + 0.8 * K;
      const top = [], bot = [];
      for (let x = x1; x > x1 - L; x -= 6 * K) {
        const t = (x1 - x) / maxL;
        const th = rowGap * (0.8 - 0.58 * Math.pow(t, 0.5));
        top.push([x, y - th / 2 + rowGap / 2]);
        bot.push([x, y + th / 2 + rowGap / 2]);
      }
      const x2 = x1 - L, tt = L / maxL, th2 = rowGap * (0.8 - 0.58 * Math.pow(tt, 0.5));
      top.push([x2, y - th2 / 2 + rowGap / 2]); bot.push([x2, y + th2 / 2 + rowGap / 2]);
      out.push([0, q(1 - 0.45 * Math.pow(tt, 1.3)), top.concat(bot.reverse())]);
    });
    // dark dots punched through the rows, bigger the farther from the seam
    rows.forEach(r => {
      const y = r[0], L = r[1], x1 = edge + 0.8 * K;
      for (let x = x1 - step * 0.5; x > x1 - L; x -= step) {
        const t = (x1 - x) / maxL;
        const sz = rowGap * (0.14 + 0.55 * Math.pow(t, 0.6)) * (0.85 + 0.3 * jit(x * 0.3, y * 0.4));
        if (rnd() < 0.08) continue;
        const cx = x, cy = y + rowGap / 2;
        out.push([1, 1, [[cx - sz / 2, cy - sz / 2], [cx + sz / 2, cy - sz / 2], [cx + sz / 2, cy + sz / 2], [cx - sz / 2, cy + sz / 2]]]);
      }
    });
    return out;
  }

  // "finelines": very fine, slightly darker vertical lines across the whole base, like the
  // woven pinstripes on the Uruguay 2026 home shirt. Kind 0 = line (first band colour).
  function fineLineShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const period = 2.3 * K, w = 0.8 * K;
    for (let x = 0.4 * K; x < GW + period; x += period) {
      out.push([0, 0.9, [[x, -2], [x + w, -2], [x + w, 102], [x, 102]]]);
    }
    return out;
  }

  // "sunstone": the Aztec sun stone of the Mexico home shirt in tone-on-tone dark lines. Two units
  // alternate along the strip: the stone (hatched concentric rings, a ring of blocks and a hub
  // inside a diamond frame with small rings and rays in the corners) and the lower part of the
  // shirt (XIX over five circles, an arc of glyph blocks, XXXX arcs, scallops, Greek-key fret
  // panels and a downward triangle). Kind 0 = dark motif.
  function sunstoneShapes() {
    const out = [];
    const A = 1;
    const P = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const poly = (pts, al) => out.push([0, al || A, pts]);
    const bar = (x1, y1, x2, y2, w) => {
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
      poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
    };
    const slats = (cx, cy, r0, r1, n, fill, lean, skip, a0, a1) => {
      const start = a0 == null ? 0 : a0, span = a1 == null ? Math.PI * 2 : a1 - a0, step = span / n;
      for (let i = 0; i < n; i++) {
        if (skip && skip(i)) continue;
        const s0 = start + i * step, s1 = s0 + step * fill;
        poly([P(cx, cy, r0, s0), P(cx, cy, r0, s1), P(cx, cy, r1, s1 + lean), P(cx, cy, r1, s0 + lean)]);
      }
    };
    const edgeRing = (cx, cy, r0, r1, a0, a1) => {
      const start = a0 == null ? 0 : a0, span = a1 == null ? Math.PI * 2 : a1 - a0;
      const n = Math.max(6, Math.round(span * 9));
      for (let i = 0; i < n; i++) {
        const s0 = start + (i / n) * span, s1 = start + ((i + 1.05) / n) * span;
        poly([P(cx, cy, r0, s0), P(cx, cy, r0, s1), P(cx, cy, r1, s1), P(cx, cy, r1, s0)]);
      }
    };
    const ringO = (cx, cy, r, w) => edgeRing(cx, cy, r - w, r);
    // ---------- unit 1: the stone inside its diamond frame
    const stone = (cx, cy) => {
      slats(cx, cy, 36, 46, 100, 0.62, 0.16);
      edgeRing(cx, cy, 45.2, 46.8); edgeRing(cx, cy, 35.2, 36.4);
      slats(cx, cy, 25.5, 33, 96, 0.62, 0.2, i => i % 8 === 0 || i % 8 === 7);
      edgeRing(cx, cy, 24.4, 25.6);
      slats(cx, cy, 14, 21, 70, 0.62, 0.2);
      edgeRing(cx, cy, 20.4, 22); edgeRing(cx, cy, 13, 14.2);
      edgeRing(cx, cy, 5.5, 8.5); edgeRing(cx, cy, 0, 3.6);
      // diamond frame, big enough to hold the rings
      const R = 84;
      const tips = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      tips.forEach((d, i) => {
        const e = tips[(i + 1) % 4];
        bar(cx + d[0] * R, cy + d[1] * R, cx + e[0] * R, cy + e[1] * R, 3.4);
        bar(cx + d[0] * (R - 8), cy + d[1] * (R - 8), cx + e[0] * (R - 8), cy + e[1] * (R - 8), 1.5);
      });
      // small rings in the four corners between the stone and the frame
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(d => ringO(cx + d[0] * 38, cy + d[1] * 38, 4.2, 1.7));
      // rays pointing out of the stone toward the frame tips
      tips.forEach(d => {
        const bx = cx + d[0] * 54, by = cy + d[1] * 54;
        const px = -d[1], py = d[0];
        poly([[bx + px * 8, by + py * 8], [bx - px * 8, by - py * 8], [cx + d[0] * 72, cy + d[1] * 72]], 0.75);
      });
    };
    // ---------- unit 2: the lower part of the shirt
    const lower = bx => {
      const glyphX = (x, y, s, w) => { bar(x - s, y - s, x + s, y + s, w); bar(x - s, y + s, x + s, y - s, w); };
      glyphX(bx - 13, 11, 4.2, 2.2); bar(bx, 6.8, bx, 15.2, 2.4); glyphX(bx + 13, 11, 4.2, 2.2);
      for (let j = -2; j <= 2; j++) ringO(bx + j * 9, 26, 4, 1.5);
      // arc of glyph blocks (the "I B I" band)
      const cy = -8;
      slats(bx, cy, 44, 54, 30, 0.55, 0.22, null, 0.18 * Math.PI, 0.82 * Math.PI);
      edgeRing(bx, cy, 43.2, 44.6, 0.14 * Math.PI, 0.86 * Math.PI);
      edgeRing(bx, cy, 53.6, 55, 0.14 * Math.PI, 0.86 * Math.PI);
      for (let i = 0; i < 9; i++) {
        const a0 = (0.2 + i * 0.07) * Math.PI;
        const gw = (i % 2 ? 0.045 : 0.055) * Math.PI;
        poly([P(bx, cy, 56.5, a0), P(bx, cy, 56.5, a0 + gw), P(bx, cy, 63, a0 + gw), P(bx, cy, 63, a0)]);
      }
      // XXXX arcs on both sides
      [-1, 1].forEach(sd => {
        for (let i = 0; i < 4; i++) {
          const a = sd < 0 ? (0.86 - i * 0.045) * Math.PI : (0.14 + i * 0.045) * Math.PI;
          const c = P(bx, cy, 71, a), s = 3.2;
          bar(c[0] - s, c[1] - s, c[0] + s, c[1] + s, 1.8); bar(c[0] - s, c[1] + s, c[0] + s, c[1] - s, 1.8);
        }
      });
      // scallops (the "UUUU" rows)
      [-1, 1].forEach(sd => {
        for (let i = 0; i < 6; i++) {
          const x = bx + sd * (11 + i * 6.6);
          const pts = [], inner = [];
          for (let q = 0; q <= 8; q++) { pts.push(P(x, 76, 3.2, (q / 8) * Math.PI)); inner.push(P(x, 76, 1.5, (q / 8) * Math.PI)); }
          poly(pts.concat(inner.reverse()));
        }
      });
      // Greek-key fret panels
      [-1, 1].forEach(sd => {
        for (let i = 0; i < 3; i++) {
          const x0 = bx + sd * (11 + i * 15.5);
          const f = (x, y) => [x0 + sd * x * 1.25, 82 + y * 1.1];
          const path = [[0, 14], [0, 0], [11, 0], [11, 10], [3, 10], [3, 3.5], [8, 3.5]];
          for (let q = 0; q < path.length - 1; q++) {
            const u = f(path[q][0], path[q][1]), v = f(path[q + 1][0], path[q + 1][1]);
            bar(u[0], u[1], v[0], v[1], 2.1);
          }
        }
      });
      // downward triangle in the middle
      poly([[bx - 6, 62], [bx + 6, 62], [bx, 96]]);
    };
    const wide = GW > 300;
    const step = 270;
    const c0 = wide ? GW * 0.74 : 150;
    for (let cx = c0; cx > -140; cx -= step) {
      stone(cx, 50);
      if (wide) lower(cx - step / 2);
    }
    for (let cx = c0 + step; cx < GW + 140; cx += step) {
      stone(cx, 50);
      if (wide) lower(cx - step / 2);
    }
    if (wide) lower(c0 + step / 2);
    return out;
  }

  // "scrolls": a tone-on-tone baroque print: a diamond lattice of dotted lines with a pair of
  // curling scrolls and small buds in every cell, like the Spain 2026 away shirt. Kind 0.
  function scrollShapes() {
    const out = [];
    const rnd = seeded(33);
    const K = GW > 300 ? 1.75 : 1.15;
    const cell = 27 * K;
    const dot = (x, y, r, al) => {
      const pts = [];
      for (let i = 0; i < 5; i++) pts.push([x + Math.cos((i / 5) * Math.PI * 2) * r, y + Math.sin((i / 5) * Math.PI * 2) * r]);
      out.push([0, al, pts]);
    };
    const spiral = (cx, cy, R, dir, a0, w, al) => {
      const left = [], right = [];
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = a0 + dir * t * Math.PI * 3.1;
        const r = R * (1 - 0.88 * t);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        const tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir;
        const ww = w * (0.45 + 0.55 * Math.min(1, (1 - t) * 2.2));
        left.push([x + tx * ww / 2, y + ty * ww / 2]);
        right.push([x - tx * ww / 2, y - ty * ww / 2]);
      }
      out.push([0, al, left.concat(right.reverse())]);
    };
    const rows = Math.ceil(110 / (cell / 2)) + 2;
    for (let j = -1; j < rows; j++) {
      for (let i = -1; i * cell < GW + cell; i++) {
        const cx = i * cell + (j % 2 ? cell / 2 : 0), cy = j * cell / 2;
        // dotted diamond lattice edges
        for (let q = 1; q < 6; q++) {
          const t = q / 6;
          dot(cx + (cell / 2) * t, cy + (cell / 2) * (1 - t) * 0 + (cell / 4) * t * 0, 0, 0);
        }
        const flip = (i + j) % 2 ? 1 : -1;
        spiral(cx - cell * 0.17, cy - cell * 0.06, cell * 0.19, flip, rnd() * 0.5 + (flip > 0 ? 0 : Math.PI), cell * 0.09, 0.85);
        spiral(cx + cell * 0.17, cy + cell * 0.1, cell * 0.17, -flip, rnd() * 0.5 + (flip > 0 ? Math.PI : 0), cell * 0.085, 0.8);
        // small buds
        dot(cx, cy + cell * 0.2, cell * 0.045, 0.8);
        dot(cx - cell * 0.05, cy - cell * 0.22, cell * 0.036, 0.7);
        dot(cx + cell * 0.22, cy - cell * 0.12, cell * 0.032, 0.7);
      }
    }
    // dotted lattice lines on the diagonals
    const step = cell * 0.09;
    for (let o = -200; o < GW + 200; o += cell) {
      for (let t = -40; t < 140; t += step * 2.4) {
        dot(o + t * 1.0, t, cell * 0.024, 0.6);
        dot(o - t * 1.0 + 100, t, cell * 0.024, 0.6);
      }
    }
    return out;
  }

  // "rulestripes": wide vertical stripes in two colours with fine rules, like the Atletico de
  // Madrid home shirt: the base colour is the thick stripe and the first band colour the wide
  // band between them. Each band has one thin line in the base colour along each edge, each
  // thick stripe has a thin line in the band colour just inside both edges, and three thin
  // lines in the second band colour run down its middle from a small trident. Kinds: 0 = band,
  // 1 = thin line in the stripe (band colour), 2 = thin lines in the band (base colour),
  // 3 = centre lines and trident (second band colour).
  function ruleStripeShapes() {
    const out = [];
    const K = GW > 300 ? 1.7 : 1.45;
    const R = 15 * K, W = 18 * K, P = R + W;
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    // on a card only the right part of the grid shows; keep its left part plain so a long name
    // stays readable, and line a stripe up with the right-hand edge
    const x0 = GW > 300 ? 6 * K : 78;
    for (let i = GW > 300 ? -1 : 0; x0 + i * P < GW + P; i++) {
      const sx = x0 + i * P;            // start of the thick stripe
      const bx = sx + R;                // start of the band
      out.push([0, 1, rect(bx, -2, W, 104)]);
      // one thin line in the band along each edge
      [1.5].forEach(o => {
        out.push([2, 1, rect(bx + o * K, -2, 0.8 * K, 104)]);
        out.push([2, 1, rect(bx + W - (o + 0.8) * K, -2, 0.8 * K, 104)]);
      });
      // three thin lines down the middle, starting under a trident
      const cx = sx + R / 2, ly = 27;
      [-2.4, 0, 2.4].forEach(o => out.push([3, 0.95, rect(cx + o * K - 0.35 * K, ly, 0.7 * K, 104 - ly)]));
      const w = 0.8 * K, pr = 2.4 * K;
      out.push([3, 1, rect(cx - w / 2, 14, w, ly - 14)]);                          // shaft
      out.push([3, 1, rect(cx - pr - w / 2, 6, w, 11)]);                            // left prong
      out.push([3, 1, rect(cx + pr - w / 2, 6, w, 11)]);                            // right prong
      out.push([3, 1, rect(cx - w / 2, 2, w, 13)]);                                  // middle prong
      out.push([3, 1, rect(cx - pr - w / 2, 15.6, 2 * pr + w, w)]);                // crossbar
      [-1, 0, 1].forEach(d => out.push([3, 1, [[cx + d * pr - w * 1.1, 6.5], [cx + d * pr + w * 1.1, 6.5], [cx + d * pr, 2.6]]]));
    }
    return out;
  }

  // "multistripes": equal-width vertical stripes cycling through every band colour in order, so a
  // kit with many shades (the Barcelona home shirt) shows them all. Kind i = band colour i.
  function multiStripeShapes() {
    const out = [];
    const K = GW > 300 ? 1.5 : 1;
    const w = 11 * K;
    const n = (stripeColors.cur || []).length || 6;
    for (let i = 0, x = 0; x < GW + w; i++, x += w) {
      out.push([i % n, 1, [[x, -2], [x + w + 0.3, -2], [x + w + 0.3, 102], [x, 102]]]);
    }
    return out;
  }

  // "prism": tilted bands of stacked dark grey right triangles (a sawtooth mountain range) on
  // near-black, with black stripes between the bands, like the Atletico de Madrid away shirt. Kind 0.
  function prismShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const w = 11 * K, h = 12 * K, P = w * 1.55, sh = w * 0.55;
    const rows = Math.ceil(110 / h) + 3;
    const span = Math.ceil((GW + rows * sh) / P) + 3;
    for (let i = -2; i < span; i++) {
      for (let j = -1; j < rows; j++) {
        const x0 = i * P - j * sh, y = j * h - 4;
        // one dark grey triangle per step; the near-black base shows between the bands
        // brightness drifts smoothly across the strip (a soft light from the top right)
        const cx = x0 + w * 0.35, cy = y + h * 0.65;
        const lit = Math.max(0, Math.min(1, Math.pow(0.1 + 0.95 * (cx / Math.max(GW, 1)) + 0.45 * (1 - cy / 100) - 0.35, 1.25)));
        out.push([0, 0.3 + 0.7 * lit, [[x0, y + h], [x0, y], [x0 + w, y + h]]]);
        // a slim soft highlight along the slope of each peak
        out.push([1, 0.04 + 0.5 * lit, [[x0 + w * 0.06, y + h * 0.9], [x0 + w * 0.06, y + h * 0.25], [x0 + w * 0.68, y + h * 0.9]]]);
      }
    }
    return out;
  }

  // "railstripes": horizontal stripes in the first band colour, each framed by a thin line of the
  // second colour above and below with a small gap of base colour between (Atletico third).
  // Kind 0 = stripe, kind 1 = thin framing lines.
  function railStripeShapes() {
    const out = [];
    const period = 27, sh = 3.6, gap = 0.9, th = 0.95;
    const rect = (y, h) => [[-2, y], [GW + 2, y], [GW + 2, y + h], [-2, y + h]];
    // big faint lightning shapes under the stripes, made only of grain: tiny dots packed inside each
    // bolt silhouette and scattering softly past its edge
    const rnd = seeded(57);
    const K = GW > 300 ? 1.6 : 1;
    const dot = (x, y, r, al) => {
      const pts = [];
      for (let i = 0; i < 4; i++) pts.push([x + Math.cos((i / 4) * Math.PI * 2 + 0.78) * r, y + Math.sin((i / 4) * Math.PI * 2 + 0.78) * r]);
      out.push([2, al, pts]);
    };
    const tpl = [[0.5, -0.06], [0.98, -0.06], [0.68, 0.42], [1.04, 0.42], [0.04, 1.06], [0.36, 0.56], [-0.05, 0.56]];
    const inside = (poly, x, y) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        if (((poly[i][1] > y) !== (poly[j][1] > y)) && x < ((poly[j][0] - poly[i][0]) * (y - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
      }
      return c;
    };
    const Wb = 46 * K, step = 58 * K;
    for (let x0 = -10 * K, n = 0; x0 < GW + Wb; x0 += step * (0.85 + rnd() * 0.3), n++) {
      const flip = n % 2 ? -1 : 1, sc = 0.9 + rnd() * 0.25;
      const poly = tpl.map(q => [x0 + (flip > 0 ? q[0] : 1 - q[0]) * Wb * sc, q[1] * 100]);
      const minX = Math.min(...poly.map(q => q[0])) - 6 * K, maxX = Math.max(...poly.map(q => q[0])) + 6 * K;
      const tries = Math.round((maxX - minX) * 100 * 0.55);
      for (let t = 0; t < tries; t++) {
        const x = minX + rnd() * (maxX - minX), y = rnd() * 112 - 6;
        if (inside(poly, x, y)) dot(x, y, (0.18 + rnd() * 0.18) * K, 0.32 + rnd() * 0.3);
        else if (rnd() < 0.04) dot(x, y, (0.14 + rnd() * 0.12) * K, 0.18);
      }
    }
    for (let y = 6; y < 106; y += period) {
      out.push([0, 1, rect(y, sh)]);
      out.push([1, 1, rect(y - gap - th, th)]);
      out.push([1, 1, rect(y + sh + gap, th)]);
    }
    return out;
  }

  // "twotone": the left of the kit is the base colour and the right part a lighter colour (first
  // band colour) with a sawtooth join at `split` (default 50%) of the width, and tone-on-tone
  // jagged Z-shaped ribbons in lighter and darker shades over the lighter part (Barcelona third).
  // Kinds: 0 = lighter part, 1 = lighter ribbons, 2 = darker ribbons.
  function twoToneShapes() {
    const out = [];
    const rnd = seeded(77);
    const K = GW > 300 ? 1.6 : 1;
    const xm = GW * (GW > 300 ? 0.5 : 0.3);
    const tooth = 2.7 * K, amp = 2.1 * K;
    const edge = [[xm, -2]];
    for (let y = 1, i = 0; y < 104; y += tooth, i++) edge.push([xm + (i % 2 ? amp : -amp), y]);
    edge.push([xm, 104]);
    out.push([0, 1, edge.concat([[GW + 2, 104], [GW + 2, -2]])]);
    const n = Math.max(5, Math.round((GW - xm) / (13 * K)));
    for (let r = 0; r < n; r++) {
      let x = xm + 10 * K + rnd() * (GW - xm - 14 * K);
      const wd = (3 + rnd() * 7) * K;
      const left = [], right = [];
      for (let y = -6; y < 110; y += 7 + rnd() * 10) {
        x += (rnd() - 0.5) * 11 * K;
        left.push([x, y]); right.push([x + wd * (0.6 + rnd() * 0.8), y + 2 + rnd() * 5]);
      }
      out.push([r % 3 === 0 ? 2 : 1, 0.18 + rnd() * 0.3, left.concat(right.reverse())]);
    }
    return out;
  }

  // "ribfade": a vertical fade from the base colour (top) into the first band colour (bottom) with
  // fine vertical ribs and a dotted knit texture over the upper part, like the Barcelona away
  // shirt. Kinds: 0 = ribs, 1 = fade slices, 2 = knit dots. Use `full: true` on banners.
  function ribFadeShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const N = 36;
    for (let i = 0; i < N; i++) {
      // black zone is 25% taller: the purple only starts fading in after the top quarter
      const t = Math.max(0, ((i + 0.5) / N - 0.25) / 0.75);
      out.push([1, Math.pow(t, 1.5) * 0.95, [[-2, (i * 100) / N], [GW + 2, (i * 100) / N], [GW + 2, ((i + 1) * 100) / N + 0.4], [-2, ((i + 1) * 100) / N + 0.4]]]);
    }
    const step = 2.3 * K, w = 0.5 * K;
    for (let x = 0.5 * K; x < GW; x += step) out.push([0, 0.26, [[x, -2], [x + w, -2], [x + w, 102], [x, 102]]]);
    const ds = 1.7 * K;
    for (let row = 0, y = 2; y < 55; row++, y += ds) {
      for (let x = (row % 2 ? ds / 2 : 0); x < GW; x += ds) {
        const r = 0.34 * K;
        out.push([2, 0.3 * (1 - y / 60), [[x, y - r], [x + r, y], [x, y + r], [x - r, y]]]);
      }
    }
    return out;
  }

  // "gradstripes": wide vertical stripes whose width is shaded in many blues, bright sky blue in the
  // middle deepening to the edges with a navy hairline on each side (Argentina 2026 home). The base
  // colour is the white between the stripes. Kinds 0-3 = shades light to deep, 4 = edge hairline.
  function gradStripeShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const P = 30 * K, bw = 20 * K, ns = 20, sw = bw / ns, hl = 0.55 * K;
    // on a card keep the left part plain so the name stays readable
    const x0 = GW > 300 ? 2 * K : 82;
    for (let x = x0 - (GW > 300 ? P : 0); x < GW + P; x += P) {
      for (let j = 0; j < ns; j++) {
        const d = Math.abs((j + 0.5) / ns - 0.5) * 2;
        out.push([Math.min(3, Math.floor(Math.pow(d, 1.15) * 4)), 1, [[x + j * sw, -2], [x + (j + 1) * sw + 0.3, -2], [x + (j + 1) * sw + 0.3, 102], [x + j * sw, 102]]]);
      }
      out.push([4, 0.85, [[x, -2], [x + hl, -2], [x + hl, 102], [x, 102]]]);
      out.push([4, 0.85, [[x + bw - hl, -2], [x + bw, -2], [x + bw, 102], [x + bw - hl, 102]]]);
    }
    return out;
  }

  // "leaves": baroque acanthus scrollwork in glowing blues on a near-black base, like the Argentina
  // 2026 away shirt. Long S-shaped vines (each ends in a tight curl) carry rows of curved, feathered
  // leaf blades on alternating sides, and every blade or vine is a layered ribbon: deep blue body,
  // royal blue core and a thin cyan/pale highlight along one edge. Kinds: 0 = royal blue,
  // 1 = cyan, 2 = pale highlight, 3 = deep blue.
  function leafShapes() {
    const out = [];
    const rnd = seeded(26);
    const wide = GW > 300;
    const K = wide ? 1.25 : 1;
    // on a card keep the left part dim so the name stays readable
    const fadeL = x => (wide ? 1 : Math.max(0.1, Math.min(1, (x / GW - 0.3) / 0.35)));
    // walk a curve with heading th and curvature kf(t) (radians per unit length)
    const walk = (x, y, th, len, kf) => {
      const n = 36, ds = len / n, pts = [[x, y, th]];
      for (let i = 0; i < n; i++) {
        th += kf(i / n) * ds;
        x += Math.cos(th) * ds; y += Math.sin(th) * ds;
        pts.push([x, y, th]);
      }
      return pts;
    };
    const ribbon = (kind, al, pts, wl, wr, ax) => {
      const L = [], R = [], n = pts.length - 1;
      pts.forEach((p, i) => {
        const t = i / n, nx = -Math.sin(p[2]), ny = Math.cos(p[2]);
        L.push([p[0] + nx * wl(t), p[1] + ny * wl(t)]);
        R.push([p[0] - nx * wr(t), p[1] - ny * wr(t)]);
      });
      out.push([kind, al * fadeL(ax), L.concat(R.reverse())]);
    };
    // a layered ribbon: deep body, royal core, cyan edge light, pale glint
    const layered = (pts, W, prof, a, ax, lit) => {
      const f = (sc, side) => t => W * sc * prof(t) * side;
      ribbon(3, 0.97 * a, pts, f(1, 0.7), f(1, 1), ax);
      ribbon(0, 0.95 * a, pts, f(0.7, 0.5), f(0.7, 0.8), ax);
      if (lit) {
        ribbon(1, 0.95 * a, pts, f(0.5, 0.95), f(0.1, 0.1), ax);
        ribbon(2, 0.8 * a, pts, f(0.18, 0.55), f(0.02, 0.02), ax);
      }
    };
    const vine = (bx, by, d, S, a) => {
      const len = S * 1.45, w = 2 * Math.PI * 0.85 / len, A = 0.034 * d;
      const ph = rnd() * 1.2;
      const kf = t => A * Math.cos(w * t * len + ph) + d * 0.4 * Math.pow(Math.max(0, (t - 0.74) / 0.26), 1.3);
      const pts = walk(bx, by, -Math.PI / 2, len, kf);
      const prof = t => 0.35 + 0.65 * (1 - t) * (1 - t) * (1 - 0.0) + (t > 0.8 ? 0 : 0);
      layered(pts, 0.05 * S, t => Math.max(0.04, 1 - t * 1.02), a, bx, true);
      // leaf blades along the stem, alternating sides, shrinking toward the curl
      for (let i = 4, side = 1; i < 31; i += 3, side = -side) {
        const t = i / 36, p = pts[i];
        const Ll = S * (0.55 - 0.3 * t) * (0.85 + rnd() * 0.3);
        const lead = p[2] + side * (1.0 - 0.25 * t);
        const lk = -side * (0.02 + 0.014 * t) * (0.9 + rnd() * 0.3) * (S / 100 > 0 ? 1 : 1);
        const curl = -side * (0.1 + 0.08 * (1 - t));
        const bl = walk(p[0], p[1], lead, Ll, u => lk + curl * Math.pow(Math.max(0, (u - 0.6) / 0.4), 1.3));
        const prof2 = u => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.9) * (1 - 0.3 * u) + 0.03;
        layered(bl, 0.15 * Ll, prof2, a, p[0], true);
      }
    };
    // free scrolls: tight double spirals filling the gaps between the vines
    const scroll = (cx, cy, R, dir, a) => {
      const th0 = rnd() * 6.28;
      const pts = walk(cx + Math.cos(th0) * R, cy + Math.sin(th0) * R, th0 + dir * Math.PI / 2, R * 4.4, t => dir / (R * (1 - 0.82 * t)));
      layered(pts, 0.2 * R, t => Math.max(0.15, 1 - t * 0.8), a, cx, true);
    };
    for (let x = 30 * K, n = 0; x < GW + 20 * K; x += 62 * K * (0.9 + rnd() * 0.3), n++) scroll(x, 22 + rnd() * 30, (13 + rnd() * 6) * K * (wide ? 0.8 : 1), n % 2 ? 1 : -1, 0.95);
    // back layer: larger dimmer vines for depth; front layer: the bright ones
    for (let x = -10 * K, n = 0; x < GW + 40 * K; x += 78 * K * (0.8 + rnd() * 0.4), n++) vine(x, 116, n % 2 ? -1 : 1, 112 * K * (wide ? 0.8 : 1), 0.3);
    for (let x = 6 * K, n = 0; x < GW + 30 * K; x += 62 * K * (0.85 + rnd() * 0.3), n++) vine(x, 108, n % 2 ? 1 : -1, 84 * K * (wide ? 0.8 : 1), 1);
    return out;
  }

  // "flamehatch": a deep indigo shirt that fades into lavender toward the bottom, with tall jagged
  // flame shapes rising from the hem and fine diagonal vector hatching over everything, like the
  // Argentina 2022 away shirt. Kinds: 0 = flames, 1 = pale flame tips and light hatching, 2 = dark
  // hatching, 3 = lavender fade.
  function flameHatchShapes() {
    const out = [];
    const rnd = seeded(22);
    const K = GW > 300 ? 1.5 : 1;
    // vertical fade, stacked slices so the alpha builds smoothly
    const N = 24;
    for (let i = 0; i < N; i++) out.push([3, 0.5 * Math.pow((i + 0.5) / N, 1.4), [[-2, (i * 100) / N], [GW + 2, (i * 100) / N], [GW + 2, 102], [-2, 102]]]);
    // flames: jagged tapering blades with a slight sway, tall and short ones overlapping
    const flame = (x, h, w, kind, al) => {
      const L = [], R = [], n = 14, sway = (rnd() - 0.5) * 0.5 * h * 0.3;
      for (let i = 0; i <= n; i++) {
        const t = i / n, y = 104 - h * t;
        const cx = x + sway * Math.sin(t * Math.PI * 0.9) * 1.6;
        const half = w * Math.pow(1 - t, 0.85) * (0.5 + 0.5 * (1 - t));
        const jag = (i % 2 ? 1 : -1) * w * 0.12 * (1 - t) * (0.6 + rnd() * 0.8);
        L.push([cx - half + jag, y]); R.push([cx + half - jag, y]);
      }
      out.push([kind, al, L.concat(R.reverse())]);
    };
    for (let x = -4 * K; x < GW + 8 * K; x += (3.4 + rnd() * 2.6) * K) {
      const h = (28 + rnd() * rnd() * 80) * (0.6 + 0.4 * Math.min(1, GW > 300 ? 1 : 0.8));
      flame(x, h, (5 + rnd() * 3.5) * K, 0, 0.5 + rnd() * 0.45);
      if (rnd() < 0.7) flame(x + (rnd() - 0.5) * 2 * K, h * (0.5 + rnd() * 0.35), (2.6 + rnd() * 2) * K, 1, 0.45 + rnd() * 0.4);
    }
    // diagonal hatching: pale lines in the dark upper part, dark lines across the flames below
    const step = 2.5 * K, lw = 0.55 * K, slope = 0.62;
    for (let x0 = -110; x0 < GW + 10; x0 += step) {
      const seg = (y0, y1, kind, al) => out.push([kind, al, [[x0 + y0 * slope, y0], [x0 + y0 * slope + lw, y0], [x0 + y1 * slope + lw, y1], [x0 + y1 * slope, y1]]]);
      seg(-4, 62, 1, 0.22);
      seg(34, 104, 2, 0.3);
    }
    return out;
  }
  // "flatstripes": equal-width vertical stripes in the first band colour over the base colour, kept to
  // the right part of a card (Southampton, Sunderland and Swansea kits). Kind 0 = stripe.
  function flatStripeShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const P = 26 * K, bw = 13 * K;
    const x0 = GW > 300 ? 0 : 82;
    for (let x = x0 - (GW > 300 ? P : 0); x < GW + P; x += P) out.push([0, 1, [[x, -2], [x + bw, -2], [x + bw, 102], [x, 102]]]);
    return out;
  }

  // "liquid": marbled liquid swirls, many overlapping wavy ribbons of varying thickness in three
  // colours over the base colour, like the Southampton 2026/27 away shirt. Kinds 0, 1, 2 = the
  // three band colours.
  function liquidShapes() {
    const out = [];
    const rnd = seeded(41);
    const K = GW > 300 ? 1.5 : 1;
    const x0 = GW > 300 ? -4 : 70;
    const fadeL = x => (GW > 300 ? 1 : Math.max(0.1, Math.min(1, (x - 70) / 40)));
    for (let r = 0; r < 42; r++) {
      const y0 = -12 + r * 3.1 + rnd() * 3;
      const f1 = 0.028 + rnd() * 0.02, f2 = 0.07 + rnd() * 0.05, p1 = rnd() * 6.3, p2 = rnd() * 6.3, p3 = rnd() * 6.3;
      const a1 = (8 + rnd() * 9) * K, a2 = (3 + rnd() * 5) * K, w0 = (2.5 + rnd() * 4) * K;
      const top = [], bot = [];
      for (let x = x0; x <= GW + 6; x += 3 * K) {
        const y = y0 + a1 * Math.sin(f1 * x / K + p1) + a2 * Math.sin(f2 * x / K + p2 + y0 * 0.05);
        const w = w0 * (0.35 + 0.9 * Math.pow(Math.sin(0.05 * x / K + p3), 2));
        top.push([x, y - w]); bot.push([x, y + w]);
      }
      out.push([r % 3, 0.9 * fadeL(GW * 0.5 + (x0 - GW * 0.5)), top.concat(bot.reverse())]);
    }
    return out;
  }
  // "redpurple": wide red stripes alternating with purple-blue stripes, each purple stripe lit lighter
  // in the middle and edged with a thin white pinstripe, like the Swansea 2026/27 away shirt. The
  // base colour is the red. Kinds: 0 = purple, 1 = white pinstripe, 2 = lighter violet centre.
  function redPurpleShapes() {
    const out = [];
    const K = GW > 300 ? 1.6 : 1;
    const rw = 12 * K, pw = 12 * K, hl = 2.4 * K, P = rw + pw + 2 * hl;
    const x0 = GW > 300 ? 0 : 82;
    const rect = (x, w) => [[x, -2], [x + w, -2], [x + w, 102], [x, 102]];
    for (let x = x0 - (GW > 300 ? P : 0); x < GW + P; x += P) {
      const px = x + rw + hl;
      out.push([1, 0.95, rect(x + rw, hl)]);
      out.push([0, 1, rect(px, pw)]);
      out.push([2, 0.22, rect(px + pw * 0.25, pw * 0.5)]);
      out.push([1, 0.95, rect(px + pw, hl)]);
    }
    return out;
  }

  // "diamondfade": a vertical fade from the black base into pink, with a tone-on-tone lattice of
  // inscribed diamonds (a diamond inside a diamond) embossed over the pink, like the Sunderland
  // 2026/27 away shirt. Kinds: 0 = pink fade, 1 = light lattice lines, 2 = shaded lattice lines.
  function diamondFadeShapes() {
    const out = [];
    const K = GW > 300 ? 1.25 : 1;
    const N = 30;
    for (let i = 0; i < N; i++) {
      const y0 = i * 1.4 + 36;
      out.push([0, 0.1, [[-2, y0], [GW + 2, y0], [GW + 2, 102], [-2, 102]]]);
    }
    const s = 17 * K, hd = s / 2, lw = 0.8 * K;
    const ramp = y => Math.max(0, Math.min(1, (y - 52) / 24));
    const seg = (kind, al, x1, y1, x2, y2) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * lw / 2, ny = dx / len * lw / 2;
      out.push([kind, al, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]]);
    };
    const diamond = (cx, cy, h, al) => {
      const pts = [[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]];
      for (let i = 0; i < 4; i++) {
        const a = pts[i], b = pts[(i + 1) % 4];
        seg(1, 0.7 * al, a[0], a[1], b[0], b[1]);
        seg(2, 0.5 * al, a[0] + 0.5 * K, a[1] + 0.5 * K, b[0] + 0.5 * K, b[1] + 0.5 * K);
      }
    };
    for (let j = -1; j * hd < 112; j++) {
      for (let i = -1; i * s < GW + s; i++) {
        const cx = i * s + (j % 2 ? hd : 0), cy = j * hd;
        const al = ramp(cy);
        if (al < 0.05) continue;
        diamond(cx, cy, hd, al);
        diamond(cx, cy, hd * 0.62, al);
        diamond(cx, cy, hd * 0.26, al);
      }
    }
    return out;
  }
  // "glassmotif": a tone-on-tone all-over print of stained-glass ribbing on royal blue, in offset
  // rows: pairs of overlapping oval rings around a small diamond, then rows of paired capsule ribs,
  // like the Sunderland 2026/27 third shirt. Kinds: 0 = lighter blue, 1 = darker blue, 2 = copper.
  function glassMotifShapes() {
    const out = [];
    const K = GW > 300 ? 1.9 : 1.3;
    const cw = 30 * K, rh = 15 * K;
    const lw = 1.3 * K;
    const seg = (kind, al, x1, y1, x2, y2) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * lw / 2, ny = dx / len * lw / 2;
      out.push([kind, al, [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]]);
    };
    const ring = (kind, al, cx, cy, rx, ry) => {
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
        seg(kind, al, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cx + Math.cos(b) * rx, cy + Math.sin(b) * ry);
      }
    };
    const diamond = (kind, al, cx, cy, h) => out.push([kind, al, [[cx, cy - h], [cx + h * 0.8, cy], [cx, cy + h], [cx - h * 0.8, cy]]]);
    const capsule = (kind, al, cx, cy, w, h) => {
      const r = w / 2, pts = [];
      for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([cx + Math.cos(a) * r, cy - h / 2 + r + Math.sin(a) * r]); }
      for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; pts.push([cx + Math.cos(a) * r, cy + h / 2 - r + Math.sin(a) * r]); }
      out.push([kind, al, pts]);
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; seg(0, 0.6, a[0], a[1], b[0], b[1]); }
    };
    for (let j = -1; j * rh < 112; j++) {
      for (let i = -1; i * cw < GW + cw; i++) {
        const cx = i * cw + (j % 2 ? cw / 2 : 0), cy = j * rh + rh / 2;
        if (j % 2 === 0) {
          ring(0, 0.85, cx - 5.2 * K, cy, 7.2 * K, 4.6 * K);
          ring(0, 0.85, cx + 5.2 * K, cy, 7.2 * K, 4.6 * K);
          diamond(0, 0.9, cx, cy, 3.4 * K);
          diamond(1, 0.55, cx, cy, 1.5 * K);
        } else {
          capsule(1, 0.5, cx - 2.6 * K, cy, 3.4 * K, 10 * K);
          capsule(1, 0.5, cx + 2.6 * K, cy, 3.4 * K, 10 * K);
          diamond(0, 0.6, cx - cw / 2 + 0.01, cy, 2.2 * K);
        }
      }
    }
    return out;
  }
  const STRIPE_GEN = {
    glassmotif: glassMotifShapes,
    redpurple: redPurpleShapes, diamondfade: diamondFadeShapes,
    flatstripes: flatStripeShapes, liquid: liquidShapes,
    flamehatch: flameHatchShapes,
    gradstripes: gradStripeShapes, leaves: leafShapes,
    crosses: () => stripeShapes("crosses"), pinlines: () => stripeShapes("pinlines"), slashes: slashShapes,
    vee: veeShapes, scatter: scatterShapes, ornament: ornamentShapes, raglan: raglanShapes,
    streaks: streakShapes, swell: swellShapes, stars: starShapes,
    bruise: bruiseShapes, pole: poleShapes, swirls: swirlShapes, ticks: tickShapes, gridiron: gridironShapes, hexes: hexShapes,
    contours: contourShapes, golden: goldenShapes, vtex: vtexShapes, skewchecks: skewcheckShapes, bees: beeShapes,
    vbars: vbarShapes, marble: marbleShapes, rings: ringShapes, flash: flashShapes, baroque: baroqueShapes, herring: herringShapes, ripple: rippleShapes, dashes: dashShapes, weft: weftShapes, finelines: fineLineShapes, sunstone: sunstoneShapes, scrolls: scrollShapes, rulestripes: ruleStripeShapes, multistripes: multiStripeShapes, prism: prismShapes, railstripes: railStripeShapes, twotone: twoToneShapes, ribfade: ribFadeShapes
  };
  const STRIPE_CACHE = {};

  // Shapes for a pattern on a grid W units wide (100 high). Cards use the default 200.
  function stripeList(type, W) {
    const w = Math.round(W || 200);
    const key = type + ":" + w;
    if (!STRIPE_CACHE[key]) {
      GW = w;
      try { STRIPE_CACHE[key] = STRIPE_GEN[type](); } finally { GW = 200; }
    }
    return STRIPE_CACHE[key];
  }

  function stripeColors(p) {
    const b = p.bands || [];
    const red = b[0] || "#E31B2B";
    if (p.type === "crosses") return [red, b[1] || mix("#000000", red, 0.3)];
    if (p.type === "slashes") return [red, b[1] || red];
    if (p.type === "ornament") return [b[0] || "#000000"];
    if (p.type === "stars") return [b[0] || "#FFFFFF"];
    if (p.type === "ticks") return [b[0] || "#5FD8C8", b[1] || "#FFFFFF"];
    if (p.type === "gradstripes") return [b[0] || "#C4E9FB", b[1] || "#8FCDF2", b[2] || "#5BA9E3", b[3] || "#3A80C6", b[4] || "#12315C"];
    if (p.type === "flamehatch") return [b[0] || "#A98BE6", b[1] || "#CDB8F6", b[2] || "#1B1560", b[3] || "#8F72DD"];
    if (p.type === "redpurple") return [b[0] || "#3A2C9C", b[1] || "#FFFFFF", b[2] || "#6A55D0"];
    if (p.type === "diamondfade") return [b[0] || "#F4A6C8", b[1] || "#FFD6E8", b[2] || "#C9709A"];
    if (p.type === "glassmotif") return [b[0] || "#3A62CC", b[1] || "#12287A", b[2] || "#D98B4E"];
    if (p.type === "flatstripes") return [b[0] || "#FFFFFF"];
    if (p.type === "liquid") return [b[0] || "#F4A9D8", b[1] || "#8EC2F2", b[2] || "#1B2BC0"];
    if (p.type === "leaves") return [b[0] || "#1F5FE0", b[1] || "#3DB4FF", b[2] || "#BDEBFF", b[3] || "#0F3A9C"];
    if (p.type === "ribfade") return [b[1] || "#9A97A6", b[0] || "#6A45B8", b[2] || "#7C788A"];
    if (p.type === "twotone") return [b[0] || "#97D7CF", b[1] || "#C4EEE8", b[2] || "#6FC4BA"];
    if (p.type === "railstripes") return [b[0] || "#C8302A", b[1] || "#262F61", b[2] || "#8E99A8"];
    if (p.type === "prism") return [b[0] || "#3A3D43", b[1] || b[0] || "#4A4E55"];
    if (p.type === "multistripes") { stripeColors.cur = b.length ? b : ["#FFFFFF"]; return stripeColors.cur; }
    if (p.type === "rulestripes") return [b[0] || "#FFFFFF", b[0] || "#FFFFFF", p.base, b[1] || "#262F61"];
    if (p.type === "scrolls") return [b[0] || "#D6C9B0"];
    if (p.type === "sunstone") return [b[0] || "#0A5547"];
    if (p.type === "finelines") return [b[0] || "#9BB1DF"];
    if (p.type === "weft") return [b[0] || "#2285F0", b[1] || "#08122B"];
    if (p.type === "dashes") return [b[0] || "#2D7CF0"];
    if (p.type === "ripple") return [b[0] || "#7A6B60", b[1] || "#C2B6AB"];
    if (p.type === "herring") return [b[0] || "#2DB8A6", b[1] || "#2A3F94"];
    if (p.type === "flash" || p.type === "baroque") return [b[0] || "#2B2B2B"];
    if (p.type === "bruise" || p.type === "hexes") return [b[0] || "#FFFFFF"];
    if (p.type === "pole") return [b[0] || "#1C2C5B", b[1] || "#6CABDD"];
    if (p.type === "contours" || p.type === "golden" || p.type === "skewchecks" || p.type === "vbars") return [b[0] || "#FFFFFF"];
    if (p.type === "vtex") return [b[0] || "#0E1642", b[1] || "#3E5CB0"];
    if (p.type === "bees") return [b[0] || "#2E2B28", b[1] || b[0] || "#2E2B28"];
    if (p.type === "marble") return [b[0] || "#1B3358", b[1] || "#4F7FA6", b[2] || "#CFE3EA"];
    if (p.type === "rings") return [b[0] || "#1FA6C4", b[1] || "#1A9AB0"];
    if (p.type === "swirls") return [b[0] || "#2BB3E0", b[1] || b[0] || "#6FD0F0", b[2] || b[0] || "#BFE9F7"];
    if (p.type === "gridiron") return [b[0] || "#14233F", b[1] || "#C8102E"];
    if (p.type === "swell") return [b[0] || "#BB2534", b[1] || "#7A1220"];
    if (p.type === "streaks") return [b[0] || "#FFFFFF", b[1] || "#005187"];
    if (p.type === "raglan") return [b[0] || "#FFFFFF", b[1] || "#7A1426", b[2] || "#8B0F1D"];
    if (p.type === "scatter") return [b[0] || "#FFFFFF", b[1] || "#F7B4BE"];
    if (p.type === "vee") return [b[0] || "#111111", b[1] || "#E31835", b[2] || "#E8A824"];
    return [red, p.base, b[1] || red];
  }

  function stripeSvg(p) {
    const c = stripeColors(p);
    const groups = {};
    const order = [];
    stripeList(p.type).forEach(r => {
      const key = r[0] + "|" + r[1].toFixed(2);
      if (!groups[key]) { groups[key] = ""; order.push(key); }
      groups[key] += "M" + r[2].map(q => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L") + "Z";
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">' +
      (p.type === "scatter" ? dotGridSvg(p.dots || "rgba(255,255,255,0.32)") : "") +
      order.map(key => {
        const parts = key.split("|");
        return '<path fill="' + c[+parts[0]] + '" opacity="' + parts[1] + '" d="' + groups[key] + '"/>';
      }).join("") + "</svg>";
  }

  function lineList(p) {
    return (p.lines && p.lines.length ? p.lines : [[(p.bands && p.bands[0]) || "#000000", 0.3, 0.34]]);
  }

  function linesSvg(p) {
    const rects = lineList(p).map(l => '<rect x="0" y="' + (l[1] * 100) + '" width="100" height="' + ((l[2] - l[1]) * 100) + '" fill="' + l[0] + '"/>').join("");
    const fade = p.fade
      ? '<defs><linearGradient id="f" x1="0" x2="1" y1="0" y2="0"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>' +
        '<mask id="m"><rect width="100" height="100" fill="url(#f)"/></mask></defs><g mask="url(#m)">' + rects + "</g>"
      : rects;
    return "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' + fade + "</svg>") + "') center / 100% 100% no-repeat, " + p.base;
  }

  function pct(n) {
    return (n * 100).toFixed(2) + "%";
  }

  function css(p) {
    const b = p.bands || [];
    if (STRIPE_GEN[p.type]) {
      return "url('data:image/svg+xml," + encodeURIComponent(stripeSvg(p)) + "') center / cover no-repeat, " + p.base;
    }
    if (p.type === "shards") {
      return "url('data:image/svg+xml," + encodeURIComponent(shardsSvg(p)) + "') center / cover no-repeat, " + p.base;
    }
    if (p.type === "burst") {
      return "url('data:image/svg+xml," + encodeURIComponent(burstSvg(p)) + "') center / cover no-repeat, " + p.base;
    }
    if (p.type === "dots") {
      return "url('data:image/svg+xml," + encodeURIComponent(dotsSvg(b[0] || "#FFFFFF")) + "') center / cover no-repeat, " + p.base;
    }
    if (p.type === "stripes") {
      return "repeating-linear-gradient(90deg, " + p.base + " 0 18%, " + b[0] + " 18% 30%)";
    }
    if (p.type === "pinstripe") {
      const start = pct(0.17 - (p.width ?? 0.02));
      return "repeating-linear-gradient(90deg, " + p.base + " 0 " + start + ", " + b[0] + " " + start + " 17%)";
    }
    if (p.type === "bolts") {
      return boltSvg(p) + " center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "gradient") {
      return "linear-gradient(180deg, " + p.base + ", " + (b[0] || p.base) + ")";
    }
    if (p.type === "fade") {
      // left half base colour, softly blending into the band colour on the right (Cagliari)
      const fr = p.range || FADE;
      return "linear-gradient(90deg, " + p.base + " 0 " + pct(fr[0]) + ", " + (b[0] || p.base) + " " + pct(fr[1]) + " 100%)";
    }
    if (p.type === "sleeves") {
      const c = b[0] || "#FFFFFF";
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        '<polygon points="' + SLEEVE_L.map(pt => pt.join(",")).join(" ") + '" fill="' + c + '"/>' +
        '<polygon points="' + SLEEVE_L.map(([px, py]) => [100 - px, py].join(",")).join(" ") + '" fill="' + c + '"/></svg>';
      return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "zigzag") {
      return zigzagSvg(p) + " center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "waves") {
      return wavesSvg(p);
    }
    if (p.type === "thick-waves") {
      return thickWavesSvg(p);
    }
    if (p.type === "lightning") {
      const c = b[0] || "#FFFFFF";
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="' +
        RAYO_BOLT.map(pt => pt.join(",")).join(" ") + '" fill="' + c + '"/></svg>';
      return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') right center / auto 100% no-repeat, " + p.base;
    }
    if (p.type === "triangles") {
      const c = b[0] || "#FFFFFF";
      const svg = trianglesSvg(c, 0.12, 1);
      return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "chevron") {
      return chevronSvg(p);
    }
    if (p.type === "centreband") {
      const stops = p.stops || CB;
      const edge = b[0] || "#FFFFFF";
      const mid = b[1] || edge;
      return "linear-gradient(90deg, " + p.base + " 0 " + pct(stops[0]) + ", " + edge + " " + pct(stops[0]) + " " + pct(stops[1]) + ", " +
        mid + " " + pct(stops[1]) + " " + pct(stops[2]) + ", " + edge + " " + pct(stops[2]) + " " + pct(stops[3]) + ", " + p.base + " " + pct(stops[3]) + " 100%)";
    }
    if (p.type === "band") {
      const edge = b[0] || "#FFFFFF";
      const mid = b[1] || edge;
      return "linear-gradient(180deg, " + p.base + " 0 " + pct(BAND[0]) + ", " + edge + " " + pct(BAND[0]) + " " + pct(BAND[1]) + ", " +
        mid + " " + pct(BAND[1]) + " " + pct(BAND[2]) + ", " + edge + " " + pct(BAND[2]) + " " + pct(BAND[3]) + ", " + p.base + " " + pct(BAND[3]) + " 100%)";
    }
    if (p.type === "sash") {
      return sashSvg(p) + " center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "diamonds") {
      return diamondsSvg(p);
    }
    if (p.type === "lines") {
      return linesSvg(p);
    }
    if (p.type === "tipping") {
      const c = b.length ? b : ["#000000"];
      const stops = [p.base + " 0 " + pct(TIP[0][0])];
      TIP.forEach(([from, to], i) => {
        stops.push(c[i % c.length] + " " + pct(from) + " " + pct(to));
        stops.push(p.base + " " + pct(to) + " " + pct(i + 1 < TIP.length ? TIP[i + 1][0] : 1));
      });
      return "linear-gradient(180deg, " + stops.join(", ") + ")";
    }
    if (p.type === "split") {
      return splitSvg(p) + " center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "cross") {
      const white = b[0] || "#FFFFFF";
      const blue = b[1] || "#00205B";
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        '<rect width="100" height="100" fill="' + p.base + '"/>' +
        '<rect x="0" y="42" width="100" height="16" fill="' + white + '"/>' +
        '<rect x="28" y="0" width="16" height="100" fill="' + white + '"/>' +
        '<rect x="0" y="47" width="100" height="6" fill="' + blue + '"/>' +
        '<rect x="33" y="0" width="6" height="100" fill="' + blue + '"/>' +
        '</svg>';
      return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / 100% 100% no-repeat, " + p.base;
    }
    if (p.type === "checks") {
      const c = b[0] || "#000000";
      let cells = "";
      for (let r = 0; r < CHECKS; r++) {
        for (let q = r % 2; q < CHECKS; q += 2) cells += '<rect x="' + q + '" y="' + r + '" width="1" height="1"/>';
      }
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CHECKS + " " + CHECKS + '" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges"><g fill="' + c + '">' + cells + "</g></svg>";
      return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center / cover no-repeat, " + p.base;
    }
    if (p.type === "hoops") {
      const stops = [];
      let pos = 0;
      hoops(p).forEach(h => {
        stops.push(p.base + " " + pct(pos) + " " + pct(h.from));
        stops.push(h.color + " " + pct(h.from) + " " + pct(h.to));
        pos = h.to;
      });
      stops.push(p.base + " " + pct(pos) + " 100%");
      return "linear-gradient(180deg, " + stops.join(", ") + ")";
    }
    return p.base;
  }

  function draw(ctx, x, y, w, h, p) {
    const b = p.bands || [];
    ctx.fillStyle = p.base;
    ctx.fillRect(x, y, w, h);
    if (p.type === "stripes" || p.type === "pinstripe") {
      const period = w * (p.type === "stripes" ? 0.3 : 0.17);
      const bandW = p.type === "stripes" ? period * 0.4 : w * (p.width ?? 0.02);
      const offset = 1 - bandW / period;
      ctx.fillStyle = b[0];
      for (let sx = x; sx < x + w; sx += period) ctx.fillRect(sx + period * offset, y, bandW, h);
    } else if (p.type === "diamonds") {
      const colors = b.length >= 3 ? b.slice(0, 3) : b.concat(Array(3 - b.length).fill(b[0] || "#FFFFFF"));
      const segment = w / colors.length;
      const gap = 2.5;
      colors.forEach((color, i) => {
        const x0 = x + i * segment + gap * 0.7;
        const x1 = x + (i + 1) * segment - gap * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x0, y + h * 0.06);
        ctx.lineTo(x0, y + h * 0.34);
        ctx.lineTo(x1, y + h * 0.96);
        ctx.lineTo(x1, y + h * 0.68);
        ctx.closePath();
        ctx.fill();
      });
    } else if (p.type === "bolts") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.strokeStyle = b[0] || "#FFFFFF";
      ctx.lineJoin = "miter";
      ctx.lineWidth = BOLT_W * (w + h) / 200;
      BOLT_X.forEach((cx, i) => {
        ctx.beginPath();
        boltPoints(cx, i === 1).forEach(([px, py], j) => {
          const X = x + (px / 100) * w;
          const Y = y + (py / 100) * h;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.stroke();
      });
      ctx.restore();
    } else if (p.type === "hoops") {
      hoops(p).forEach(hp => {
        ctx.fillStyle = hp.color;
        ctx.fillRect(x, y + h * hp.from, w, h * (hp.to - hp.from));
      });
    } else if (p.type === "sleeves") {
      ctx.fillStyle = b[0] || "#FFFFFF";
      [false, true].forEach(mirror => {
        ctx.beginPath();
        SLEEVE_L.forEach(([px, py], j) => {
          const X = x + ((mirror ? 100 - px : px) / 100) * w;
          const Y = y + (py / 100) * h;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.closePath();
        ctx.fill();
      });
    } else if (p.type === "zigzag") {
      const bands = b.length ? b : ["#FFFFFF"];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.lineWidth = 3.5 * (w + h) / 200;
      ctx.lineJoin = "miter";
      ZZ_ROWS.forEach((ry, i) => {
        ctx.strokeStyle = bands[i % bands.length];
        ctx.beginPath();
        zigzagRow(ry).forEach(([px, py], j) => {
          const X = x + (px / 100) * w;
          const Y = y + (py / 100) * h;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.stroke();
      });
      ctx.restore();
    } else if (p.type === "waves") {
      const color = b[0] || "#FFFFFF";
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const rows = Math.max(8, Math.round(h / 12));
      const amplitude = h * 0.04;
      const phase = 0.75;
      for (let i = 0; i < rows; i++) {
        const waveY = y + ((i + 0.5) / rows) * h;
        ctx.beginPath();
        for (let q = 0; q <= 80; q++) {
          const px = x + (q / 80) * w;
          const py = waveY + Math.sin((q / 80) * Math.PI * 2 * 2 + phase) * amplitude;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.0, h * 0.006);
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.24 + ((i % 4) + 1) * 0.14;
        ctx.stroke();
      }
      ctx.restore();
    } else if (p.type === "thick-waves") {
      const color = b[0] || "#FFFFFF";
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const rows = Math.max(8, Math.round(h / 12));
      const amplitude = h * 0.04;
      const phase = 0.75;
      for (let i = 0; i < rows; i++) {
        const waveY = y + ((i + 0.5) / rows) * h;
        ctx.beginPath();
        for (let q = 0; q <= 80; q++) {
          const px = x + (q / 80) * w;
          const py = waveY + Math.sin((q / 80) * Math.PI * 2 * 2 + phase) * amplitude;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(5, h * 0.03);
        ctx.lineCap = "round";
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      ctx.restore();
    } else if (p.type === "lightning") {
      ctx.fillStyle = b[0] || "#FFFFFF";
      ctx.beginPath();
      RAYO_BOLT.forEach(([px, py], j) => {
        const X = x + w - h + (px / 100) * h;
        const Y = y + (py / 100) * h;
        if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      });
      ctx.closePath();
      ctx.fill();
    } else if (STRIPE_GEN[p.type]) {
      const s = Math.max(w / 200, h / 100);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      if (p.type === "scatter") dotGrid(ctx, x + (w - 200 * s) / 2, y + (h - 100 * s) / 2, s, p.dots || "rgba(255,255,255,0.32)");
      paintShards(ctx, x + (w - 200 * s) / 2, y + (h - 100 * s) / 2, s, stripeColors(p), stripeList(p.type));
      ctx.restore();
    } else if (p.type === "shards") {
      const s = Math.max(w / 200, h / 100);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      paintShards(ctx, x + (w - 200 * s) / 2, y + (h - 100 * s) / 2, s, shardColors(p));
      ctx.restore();
    } else if (p.type === "burst") {
      const c = burstColors(p);
      const s = Math.max(w / 200, h / 100);
      const ox = x + (w - 200 * s) / 2;
      const oy = y + (h - 100 * s) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      BURST.forEach(r => {
        ctx.globalAlpha = r[0] ? 0.9 : 0.58;
        ctx.fillStyle = c[r[0]];
        ctx.beginPath();
        r[1].forEach((q, i) => {
          if (i === 0) ctx.moveTo(ox + q[0] * s, oy + q[1] * s); else ctx.lineTo(ox + q[0] * s, oy + q[1] * s);
        });
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      const hx = ox + 148 * s, hy = oy + 34 * s;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 46 * s);
      g.addColorStop(0, p.base);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    } else if (p.type === "dots") {
      const s = Math.max(w / 200, h / 100);
      const ox = x + (w - 200 * s) / 2;
      const oy = y + (h - 100 * s) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = b[0] || "#FFFFFF";
      DOTS.forEach(d => {
        ctx.beginPath();
        ctx.arc(ox + d[0] * s, oy + d[1] * s, d[2] * s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    } else if (p.type === "triangles") {
      const c = b[0] || "#FFFFFF";
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.ceil(w));
      off.height = Math.max(1, Math.ceil(h));
      const o = off.getContext("2d");
      for (let ty = 0; ty < off.height; ty += 16) {
        for (let tx = 0; tx < off.width; tx += 18) {
          o.beginPath();
          o.moveTo(tx + 9, ty);
          o.lineTo(tx + 18, ty + 16);
          o.lineTo(tx, ty + 16);
          o.closePath();
          o.globalAlpha = 0.55;
          o.strokeStyle = c;
          o.lineWidth = 1.1;
          o.stroke();
          o.beginPath();
          o.moveTo(tx + 9, ty);
          o.lineTo(tx + 9, ty + 16);
          o.lineTo(tx, ty + 16);
          o.closePath();
          o.globalAlpha = 0.22;
          o.fillStyle = c;
          o.fill();
        }
      }
      o.globalAlpha = 1;
      o.globalCompositeOperation = "destination-in";
      const fade = o.createLinearGradient(0, 0, 0, off.height);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0.12)");
      o.fillStyle = fade;
      o.fillRect(0, 0, off.width, off.height);
      ctx.drawImage(off, x, y, w, h);
    } else if (p.type === "chevron") {
      ctx.fillStyle = b[0] || "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === "centreband") {
      const stops = p.stops || CB;
      const edge = b[0] || "#FFFFFF";
      ctx.fillStyle = edge;
      ctx.fillRect(x + w * stops[0], y, w * (stops[3] - stops[0]), h);
      ctx.fillStyle = b[1] || edge;
      ctx.fillRect(x + w * stops[1], y, w * (stops[2] - stops[1]), h);
    } else if (p.type === "band") {
      const edge = b[0] || "#FFFFFF";
      ctx.fillStyle = edge;
      ctx.fillRect(x, y + h * BAND[0], w, h * (BAND[3] - BAND[0]));
      ctx.fillStyle = b[1] || edge;
      ctx.fillRect(x, y + h * BAND[1], w, h * (BAND[2] - BAND[1]));
    } else if (p.type === "sash") {
      ctx.fillStyle = b[0] || "#FFFFFF";
      ctx.beginPath();
      sashPoints(p).forEach(([px, py], j) => {
        const X = x + (px / 100) * w;
        const Y = y + (py / 100) * h;
        if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      });
      ctx.closePath();
      ctx.fill();
    } else if (p.type === "lines") {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(w));
      off.height = Math.max(1, Math.round(h));
      const o = off.getContext("2d");
      lineList(p).forEach(l => {
        o.fillStyle = l[0];
        o.fillRect(0, off.height * l[1], off.width, off.height * (l[2] - l[1]));
      });
      if (p.fade) {
        const g = o.createLinearGradient(0, 0, off.width, 0);
        g.addColorStop(0.55, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        o.globalCompositeOperation = "destination-in";
        o.fillStyle = g;
        o.fillRect(0, 0, off.width, off.height);
      }
      ctx.drawImage(off, x, y, w, h);
    } else if (p.type === "tipping") {
      const c = b.length ? b : ["#000000"];
      TIP.forEach(([from, to], i) => {
        ctx.fillStyle = c[i % c.length];
        ctx.fillRect(x, y + h * from, w, h * (to - from));
      });
    } else if (p.type === "fade") {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop((p.range || FADE)[0], p.base);
      g.addColorStop((p.range || FADE)[1], b[0] || p.base);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    } else if (p.type === "gradient") {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, p.base);
      g.addColorStop(1, b[0] || p.base);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    } else if (p.type === "checks") {
      const cell = Math.max(w, h) / CHECKS;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      ctx.fillStyle = b[0] || "#000000";
      for (let r = 0; r < rows; r++) {
        for (let q = r % 2; q < cols; q += 2) ctx.fillRect(x + q * cell, y + r * cell, cell, cell);
      }
    } else if (p.type === "split") {
      ctx.fillStyle = b[0] || p.base;
      ctx.beginPath();
      ZIG.forEach(([px, py], j) => {
        const X = x + (px / 100) * w;
        const Y = y + (py / 100) * h;
        if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      });
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === "cross") {
      const white = b[0] || "#FFFFFF";
      const blue = b[1] || "#00205B";
      ctx.fillStyle = p.base;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = white;
      ctx.fillRect(x, y + h * 0.42, w, h * 0.16);
      ctx.fillRect(x + w * 0.28, y, w * 0.16, h);
      ctx.fillStyle = blue;
      ctx.fillRect(x, y + h * 0.47, w, h * 0.06);
      ctx.fillRect(x + w * 0.33, y, w * 0.06, h);
    }
  }

  function hexRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, amount) {
    const x = hexRgb(a);
    const y = hexRgb(b);
    if (!x || !y) return b;
    const c = x.map((v, i) => Math.round(v * amount + y[i] * (1 - amount)));
    return "rgb(" + c.join(",") + ")";
  }

  function isLight(hex) {
    const c = hexRgb(hex);
    return !!c && (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.85;
  }

  window.Kits = { ids, get, css, draw, mix, isLight, dots: DOTS, burst: BURST, burstList, shardList, shardColors, burstColors, shards: paintShards, stripes: { colors: stripeColors, list: stripeList, has: type => !!STRIPE_GEN[type], dots: dotGrid } };
})();