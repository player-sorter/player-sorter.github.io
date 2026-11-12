(function () {
  const FORMATS = {
    story: { w: 1080, h: 1920, head: 340, foot: 120 },
    post: { w: 1080, h: 1350, head: 240, foot: 96, maxCols: 3, threeColsFrom: 31 },
    square: { w: 1080, h: 1080, head: 210, foot: 90, maxCols: 3 },
    wide: { w: 1920, h: 1080, head: 210, foot: 90, maxCols: 3, side: true, maxRowW: 1200, uniformNames: true, leadMax: 150 }
  };
  const LIMITS = { top3: 3, top10: 10, full: Infinity };
  const GROWTH = 0.9;
  const MIN_ROW = 66;
  const MAX_ROW = 104;
  const PAD = 64;
  const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const BODY = '"Barlow", system-ui, sans-serif';
  const cache = new Map();

  function isRemote(src) {
    try {
      const url = new URL(src, location.href);
      return /^https?:$/.test(url.protocol) && url.origin !== location.origin;
    } catch (e) {
      return false;
    }
  }

  function loadOne(src) {
    if (cache.has(src)) return cache.get(src);
    const p = new Promise(resolve => {
      const img = new Image();
      if (isRemote(src)) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img.naturalWidth ? img : null);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    cache.set(src, p);
    return p;
  }

  async function loadImage(srcs) {
    const list = Array.isArray(srcs) ? srcs : srcs ? [srcs] : [];
    for (const src of list) {
      const img = await loadOne(src);
      if (img) return img;
    }
    return null;
  }

  async function loadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('800 italic 80px "Barlow Condensed"'),
        document.fonts.load('800 80px "Barlow Condensed"'),
        document.fonts.load('600 40px "Barlow Condensed"'),
        document.fonts.load('700 40px "Barlow"'),
        document.fonts.load('500 40px "Barlow"')
      ]);
    } catch (e) {}
  }

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function hexToRgba(hex, alpha) {
    if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
    const clean = String(hex).trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      const expanded = clean.split("").map(ch => ch + ch).join("");
      const n = parseInt(expanded, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      const n = parseInt(clean, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }
    return "rgba(0, 0, 0, " + alpha + ")";
  }

  function font(weight, size, family, italic) {
    return (italic ? "italic " : "") + weight + " " + Math.round(size) + "px " + family;
  }

  function fitSize(ctx, text, maxW, weight, start, min, family, italic) {
    let size = start;
    ctx.font = font(weight, size, family, italic);
    while (size > min && ctx.measureText(text).width > maxW) {
      size -= 2;
      ctx.font = font(weight, size, family, italic);
    }
    return size;
  }

  function ellipsize(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t.trimEnd() + "…";
  }

  function drawAvatar(ctx, cx, cy, r, img, player, kit, ring) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    if (img) {
      ctx.fillStyle = kit.accent;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, cx - dw / 2, cy - r, dw, dh);
    } else {
      Kits.draw(ctx, cx - r, cy - r, r * 2, r * 2, kit.pattern);
      const num = player.number != null ? String(player.number) : "";
      const size = r * 0.78;
      ctx.font = font(800, size, DISPLAY, true);
      const tw = ctx.measureText(num).width;
      const pw = tw + size * 0.5;
      const ph = size * 1.05;
      ctx.fillStyle = kit.accent;
      rr(ctx, cx - pw / 2, cy - ph / 2, pw, ph, ph * 0.3);
      ctx.fill();
      ctx.fillStyle = kit.onAccent;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(num, cx, cy + size * 0.04);
    }
    ctx.restore();
    if (ring) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = ring;
      ctx.strokeStyle = kit.card;
      ctx.stroke();
    }
  }

  const BOLT = [[78, 0], [96, 0], [77, 38], [89, 38], [48, 100], [28, 100], [60, 52], [48, 52]];

  // Patterns that build their own artwork for the banner's shape (see Kits.*List in kits.js).
  const BANNER_ART = ["burst", "shards", "crosses", "pinlines", "slashes", "vee", "scatter", "ornament", "raglan", "streaks", "swell", "stars"];

  function bannerArt(ctx, f, k, p, from, room, h) {
    if (p.type === "fade") {
      const r = p.range || [0.4, 0.62];
      const g = ctx.createLinearGradient(0, 0, f.w, 0);
      g.addColorStop(r[0], p.base);
      g.addColorStop(r[1], (p.bands && p.bands[0]) || p.base);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, f.w, h);
      return;
    }
    if (p.full) { from = 0; room = f.w; }
    if (room < 150) return;
    const s = h / 100;
    const W = room / s;
    const off = document.createElement("canvas");
    off.width = Math.ceil(room);
    off.height = Math.ceil(h);
    const o = off.getContext("2d");
    const poly = pts => {
      o.beginPath();
      pts.forEach((q, i) => { if (i === 0) o.moveTo(q[0] * s, q[1] * s); else o.lineTo(q[0] * s, q[1] * s); });
      o.closePath();
      o.fill();
    };
    if (p.type === "lines") {
      (p.lines || []).forEach(l => {
        o.fillStyle = l[0];
        o.fillRect(0, off.height * l[1], off.width, off.height * (l[2] - l[1]));
      });
      if (p.fade) {
        const g = o.createLinearGradient(0, 0, off.width, 0);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.55, "rgba(0,0,0,1)");
        o.globalCompositeOperation = "destination-in";
        o.fillStyle = g;
        o.fillRect(0, 0, off.width, off.height);
        o.globalCompositeOperation = "source-over";
      }
    } else if (p.type === "burst") {
      const c = Kits.burstColors(p);
      Kits.burstList(W).forEach(r => {
        o.globalAlpha = r[0] ? 0.9 : 0.58;
        o.fillStyle = c[r[0]];
        poly(r[1]);
      });
      o.globalAlpha = 1;
      const hx = W * 0.74 * s, hy = 34 * s;
      const g = o.createRadialGradient(hx, hy, 0, hx, hy, 46 * s);
      g.addColorStop(0, k.header);
      g.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = g;
      o.fillRect(0, 0, off.width, off.height);
    } else if (p.type === "shards") {
      Kits.shards(o, 0, 0, s, Kits.shardColors(p), Kits.shardList(W));
    } else {
      if (p.type === "scatter") Kits.stripes.dots(o, 0, 0, s, p.dots || "rgba(255,255,255,0.32)", W);
      Kits.shards(o, 0, 0, s, Kits.stripes.colors(p), Kits.stripes.list(p.type, W));
    }
    if ((p.type !== "lines" || !p.fade) && !p.full) {
      // soften the edge nearest the title
      const g = o.createLinearGradient(0, 0, off.width, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(Math.min(0.3, 220 / off.width), "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      o.globalCompositeOperation = "destination-in";
      o.fillStyle = g;
      o.fillRect(0, 0, off.width, off.height);
    }
    ctx.drawImage(off, from, 0);
  }

  function headerPattern(ctx, f, k, clearX) {
    const p = k.headerPattern || k.pattern || {};
    const band = (p.bands && p.bands[0]) || k.onHeader;
    const h = f.head - 14;
    const from = Math.max(clearX || 0, 0);
    const room = f.w - from;
    ctx.save();
    if (BANNER_ART.indexOf(p.type) >= 0 || Kits.stripes.has(p.type) || p.type === "lines" || p.type === "fade") {
      bannerArt(ctx, f, k, p, from, room, h);
      ctx.restore();
      return;
    }
    if (["zigzag", "hoops", "split", "sash", "diamonds", "lightning", "checks", "triangles", "chevron", "sleeves", "centreband", "band", "cross", "dots", "thick-waves"].indexOf(p.type) >= 0) {
      if (room < 150) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.rect(from, 0, room, h);
      ctx.clip();
    }
    if (p.type === "stripes") {
      ctx.globalAlpha = k.headerPatternAlpha != null ? k.headerPatternAlpha : 0.1;
      ctx.fillStyle = k.headerPatternAlpha != null ? band : k.onHeader;
      for (let x = 54; x < f.w; x += 108) ctx.fillRect(x, 0, 54, h);
    } else if (p.type === "diamonds") {
      const bands = p.bands && p.bands.length ? p.bands : [k.onHeader];
      const colors = bands.length >= 3 ? bands.slice(0, 3) : bands.concat(Array(3 - bands.length).fill(bands[0] || k.onHeader));
      const segment = room / colors.length;
      const gap = 0;
      colors.forEach((color, i) => {
        const x0 = from + i * segment + gap * 0.7;
        const x1 = from + (i + 1) * segment - gap * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, h * 0.5);
        ctx.lineTo(x1, h);
        ctx.lineTo(x1, h * 0.5);
        ctx.closePath();
        ctx.fill();
      });
    } else if (p.type === "pinstripe") {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = band;
      for (let x = 46; x < f.w; x += 64) ctx.fillRect(x, 0, 4, h);
    } else if (p.type === "bolts") {
      const zig = [[0, 0], [-8, 0.12], [5, 0.24], [-8, 0.36], [5, 0.48], [-8, 0.6], [5, 0.72], [-8, 0.84], [5, 0.96], [0, 1]];
      ctx.strokeStyle = band;
      ctx.lineWidth = 5;
      ctx.lineJoin = "miter";
      [30, f.w - 30].forEach((cx, i) => {
        ctx.beginPath();
        zig.forEach(([dx, fy], j) => {
          const X = cx + (i ? -dx : dx);
          const Y = fy * h;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.stroke();
      });
    } else if (p.type === "zigzag") {
      const colors = p.bands && p.bands.length ? p.bands : [k.onHeader];
      const start = Math.max(f.w * 0.5, from + 12);
      const span = f.w - start;
      const teeth = Math.max(3, Math.round(span / 60));
      const amp = 14;
      ctx.lineWidth = 6;
      ctx.lineJoin = "miter";
      ctx.globalAlpha = 0.9;
      [0.3, 0.55].forEach((fy, i) => {
        ctx.strokeStyle = colors[i % colors.length];
        ctx.beginPath();
        for (let t = 0; t <= teeth * 2; t++) {
          const X = start + (t * span) / (teeth * 2);
          const Y = h * fy + (t % 2 ? -amp : amp);
          if (t) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        ctx.stroke();
      });
    } else if (p.type === "waves") {
      const colors = p.bands && p.bands.length ? p.bands : [band];
      const rows = 10;
      const amplitude = Math.min(h * 0.18, 16);
      const phase = 0.75;
      for (let i = 0; i < rows; i++) {
        const yBase = ((i + 0.5) / rows) * h;
        ctx.beginPath();
        for (let x = 0; x <= f.w; x += 10) {
          const y = yBase + Math.sin((x / 120) * Math.PI * 2 + phase) * amplitude;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.3 + ((i % 4) + 1) * 0.12;
        ctx.stroke();
      }
    } else if (p.type === "thick-waves") {
      const colors = p.bands && p.bands.length ? p.bands : [band];
      const rows = 5;
      const amplitude = Math.min(h * 0.18, 16);
      const phase = 0.75;
      for (let i = 0; i < rows; i++) {
        const yBase = ((i + 0.5) / rows) * h;
        ctx.beginPath();
        for (let x = 0; x <= f.w; x += 10) {
          const y = yBase + Math.sin((x / 120) * Math.PI * 2 + phase) * amplitude;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 20;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
    } else if (p.type === "sash") {
      const bw = Math.min(120, room * 0.38);
      const x0 = Math.max(from + 20, f.w - bw - h * 0.9);
      const x1 = x0 + h * 0.7;
      const top = p.reverse ? x1 : x0;
      const bottom = p.reverse ? x0 : x1;
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(top, 0);
      ctx.lineTo(top + bw, 0);
      ctx.lineTo(bottom + bw, h);
      ctx.lineTo(bottom, h);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === "lightning") {
      const right = f.w - 36;
      const size = Math.min(h * 0.9, (right - from - 12) / 0.68);
      const top = (h - size) / 2;
      if (size >= h * 0.45) {
        ctx.fillStyle = band;
        ctx.beginPath();
        BOLT.forEach(([px, py], j) => {
          const X = right - ((96 - px) / 100) * size;
          const Y = top + (py / 100) * size;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === "sleeves") {
      const c = p.bands && p.bands[0] ? p.bands[0] : k.onHeader;
      const sleeveW = Math.min(120, Math.max(60, room * 0.18));
      const sleeveH = h * 0.7;
      const dy = (h - sleeveH) / 2;
      const drawSleeve = (x, flip) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        [[0, 0], [30, 0], [22, 46], [0, 60]].forEach(([px, py], j) => {
          const X = x + (flip ? (100 - px) : px) / 100 * sleeveW;
          const Y = dy + (py / 100) * sleeveH;
          if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.closePath();
        ctx.fill();
      };
      drawSleeve(from + 10, false);
      drawSleeve(f.w - sleeveW - 10, true);
    } else if (p.type === "centreband") {
      const edge = p.bands && p.bands[0] ? p.bands[0] : k.onHeader;
      const mid = p.bands && p.bands[1] ? p.bands[1] : edge;
      ctx.fillStyle = edge;
      const [start, innerStart, innerEnd, end] = p.stops || [0.33, 0.39, 0.61, 0.67];
      ctx.fillRect(from + room * start, 0, room * (end - start), h);
      ctx.fillStyle = mid;
      ctx.fillRect(from + room * innerStart, 0, room * (innerEnd - innerStart), h);
    } else if (p.type === "band") {
      const edge = p.bands && p.bands[0] ? p.bands[0] : k.onHeader;
      const mid = p.bands && p.bands[1] ? p.bands[1] : edge;
      ctx.fillStyle = edge;
      ctx.fillRect(from, h * 0.36, room, h * (0.64 - 0.36));
      ctx.fillStyle = mid;
      ctx.fillRect(from, h * 0.41, room, h * (0.59 - 0.41));
    } else if (p.type === "cross") {
      const white = p.bands && p.bands[0] ? p.bands[0] : "#FFFFFF";
      const blue = p.bands && p.bands[1] ? p.bands[1] : "#00205B";
      const centerX = f.w * 0.65;
      const startX = f.w * 0.3;
      const whiteWidth = Math.min(h * 0.12, f.w * 0.05);
      const blueWidth = whiteWidth * 1.05;
      const whiteSpan = whiteWidth * 2.2;
      const blueSpan = blueWidth * 1.15;
      const off = document.createElement("canvas");
      off.width = f.w;
      off.height = Math.ceil(h);
      const o = off.getContext("2d");
      o.fillStyle = white;
      o.fillRect(centerX - whiteSpan / 2, 0, whiteSpan, h);
      o.fillRect(startX, h * 0.5 - whiteSpan / 2, f.w - startX, whiteSpan);
      o.fillStyle = blue;
      o.fillRect(centerX - blueSpan / 2, 0, blueSpan, h);
      o.fillRect(startX, h * 0.5 - blueSpan / 2, f.w, blueSpan);
      // the arm fades out toward the title; the upright stays solid
      const g = o.createLinearGradient(0, 0, f.w, 0);
      const up = Math.max(0.01, (centerX - whiteSpan / 2) / f.w);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(startX / f.w, "rgba(0,0,0,0)");
      g.addColorStop(up, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      o.globalCompositeOperation = "destination-in";
      o.fillStyle = g;
      o.fillRect(0, 0, off.width, off.height);
      ctx.drawImage(off, 0, 0);
    } else if (p.type === "tipping") {
      const colors = p.bands && p.bands.length ? p.bands : [k.onHeader];
      const bandH = Math.round(f.head * 0.035);
      colors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, h - bandH * (2 * colors.length - 2 * i), f.w, bandH);
      });
    } else if (p.type === "gradient") {
      const g = ctx.createLinearGradient(0, 0, f.w, 0);
      g.addColorStop(0, p.base);
      g.addColorStop(1, band);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, f.w, h);
    } else if (p.type === "split") {
      const amp = 26;
      const steps = 6;
      const cx = f.w * 0.72;
      ctx.globalAlpha = k.headerPatternAlpha != null ? k.headerPatternAlpha : 0.9;
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      for (let i = 1; i < steps; i++) ctx.lineTo(cx + (i % 2 ? amp : -amp), (h * i) / steps);
      ctx.lineTo(cx, h);
      ctx.lineTo(f.w, h);
      ctx.lineTo(f.w, 0);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === "checks") {
      const header = String(k.header || "").toLowerCase();
      ctx.fillStyle = String(p.base).toLowerCase() !== header ? p.base : band;
      const cell = h / 4;
      const cols = Math.min(8, Math.floor((room - 24) / cell));
      const x0 = f.w - cols * cell;
      for (let r = 0; r < 4; r++) {
        for (let q = r % 2; q < cols; q += 2) ctx.fillRect(x0 + q * cell, r * cell, cell, cell);
      }
    } else if (p.type === "dots") {
      const s = Math.max(room / 200, h / 100);
      const ox = from + (room - 200 * s) / 2;
      const oy = (h - 100 * s) / 2;
      ctx.fillStyle = band;
      ctx.globalAlpha = 0.85;
      Kits.dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(ox + d[0] * s, oy + d[1] * s, d[2] * s, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (p.type === "triangles") {
      const start = Math.max(f.w * 0.45, from + 12);
      const tw = 36;
      const th = 32;
      for (let ty = 0; ty < h; ty += th) {
        for (let tx = start; tx < f.w; tx += tw) {
          const fade = Math.min(1, (tx - start) / Math.max(1, f.w - start) + 0.15);
          ctx.globalAlpha = 0.5 * fade;
          ctx.strokeStyle = band;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx + tw / 2, ty);
          ctx.lineTo(tx + tw, ty + th);
          ctx.lineTo(tx, ty + th);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = 0.2 * fade;
          ctx.fillStyle = band;
          ctx.beginPath();
          ctx.moveTo(tx + tw / 2, ty);
          ctx.lineTo(tx + tw / 2, ty + th);
          ctx.lineTo(tx, ty + th);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (p.type === "chevron") {
      const centerX = from + ((f.w - from) * 0.5);
      const size = Math.max(60, room * 0.58);
      const left = from;
      const right = f.w;
      const top = 0;
      const bottom = h;
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(centerX, bottom);
      ctx.lineTo(right, top);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0;
      ctx.fillStyle = k.onHeader;
      ctx.fillRect(left, top, size, bottom);
      ctx.globalAlpha = 1;
    } else if (p.type === "hoops") {
      const colors = p.bands && p.bands.length ? p.bands : [k.onHeader];
      const bandH = Math.round(f.head * 0.028);
      const gap = Math.round(bandH * 0.7);
      let y = h - 6 * bandH - 5 * gap - Math.round(f.head * 0.06);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.9;
        ctx.fillRect(f.w * 0.62, y, f.w * 0.38, bandH);
        y += bandH + gap;
      }
    }
    ctx.restore();
  }

  // Two thin, sharp-tipped neon curves like a cubic graph, one near each end of the banner (the
  // flank panels of the Atletico away shirt). Each curve's lower end bends smoothly into the
  // bottom line, so curve and line read as one shape. Soft glow behind each.
  function neonCurves(ctx, f, k, t) {
    const h = f.head - 14;
    const color = t.color || k.headerBand || "#D7FF1F";
    const amp = h * 0.17, wmax = h * 0.042, n = 80, trim = h * 0.18;
    const R = h * 0.26, u0 = 1 - R / h;
    const cxL = trim + wmax / 2 - 0.65 * amp;
    const half = (u, g) => g * wmax * Math.pow(Math.sin(Math.PI * Math.min(u, 0.999)), 0.75) / 2;
    const build = (cx, dir, g, fillet) => {
      const outer = [], inner = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = u * 2 - 1;
        const x = cx + dir * amp * (v * v * v - 0.35 * v);
        const w = u < 0.5 ? half(u, g) : g * wmax / 2 * (1 - 0.0 * u);
        let ex = 0;
        if (fillet && u > u0) { const q = (u - u0) / (1 - u0); ex = R * (1 - Math.sqrt(Math.max(0, 1 - q * q))); }
        outer.push([x - dir * w, u * h]);
        inner.push([x + dir * (w + ex), u * h]);
      }
      return outer.concat(inner.reverse());
    };
    const fill = pts => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); };
    const draw = (cx, dir) => {
      [[2.8, 0.1], [1.9, 0.16]].forEach(g => { ctx.globalAlpha = g[1]; ctx.fillStyle = color; fill(build(cx, dir, g[0], false)); });
      ctx.globalAlpha = 1; ctx.fillStyle = color;
      fill(build(cx, dir, 1, true));
    };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, f.w, h + 1); ctx.clip();
    const gl = ctx.createLinearGradient(0, h, 0, h - h * 0.4);
    gl.addColorStop(0, color); gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.15; ctx.fillStyle = gl;
    ctx.fillRect(0, h - h * 0.4, f.w, h * 0.4);
    ctx.globalAlpha = 1;
    draw(cxL, 1);
    draw(f.w - cxL, -1);
    ctx.restore();
  }

  function headerCollar(ctx, f, k, clearX) {
    const t = k.headerDecor;
    if (t && t.type === "neon-curves") return neonCurves(ctx, f, k, t);
    if (!t || (t.type !== "collar" && t.type !== "panel-collar")) return;
    const h = f.head - 14;
    const from = Math.max(clearX || 0, 0);
    const room = f.w - from;
    if (room < 150) return;
    if (t.type === "panel-collar") return panelCollar(ctx, k, t, from, room, h);
    const sy = h / 66;
    const sx = (room - 16) / 156;
    const rad = Math.PI / 180;
    ctx.save();
    ctx.beginPath();
    ctx.rect(from, 0, room, h);
    ctx.clip();
    ctx.translate(from + room / 2, -8 * sy);
    ctx.scale(sx, sy);
    ctx.fillStyle = t.color || k.onHeader;
    ctx.globalAlpha = t.opacity != null ? t.opacity : 0.6;
    for (let i = 0; i < 15; i++) {
      const a0 = (43 + i * 6.4) * rad;
      const a1 = a0 + 4.6 * rad;
      const r0 = 40;
      const r1 = i % 2 ? 62 : 78;
      ctx.beginPath();
      ctx.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0));
      ctx.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
      ctx.lineTo(r1 * Math.cos(a1 + 0.02), r1 * Math.sin(a1 + 0.02));
      ctx.lineTo(r1 * Math.cos(a0 - 0.02), r1 * Math.sin(a0 - 0.02));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Glossy panel collar spread across the banner, like the Uruguay 2026 away shirt: two arcs of
  // trapezoid panels around the neck and a row of long blocks hanging below them, each panel
  // brightest in the middle with a peach glow, divided by thin peach rib lines.
  function panelCollar(ctx, k, t, from, room, h) {
    const off = document.createElement("canvas");
    off.width = Math.ceil(room);
    off.height = Math.ceil(h);
    const o = off.getContext("2d");
    panelCollarArt(o, k, t, 0, room, h);
    // fade the whole collar out toward the title, smoothly over the left half
    const g = o.createLinearGradient(0, 0, room, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.12, "rgba(0,0,0,0.12)");
    g.addColorStop(0.3, "rgba(0,0,0,0.5)");
    g.addColorStop(0.5, "rgba(0,0,0,0.85)");
    g.addColorStop(0.65, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    o.globalCompositeOperation = "destination-in";
    o.fillStyle = g;
    o.fillRect(0, 0, off.width, off.height);
    ctx.drawImage(off, from, 0);
  }

  function panelCollarArt(ctx, k, t, from, room, h) {
    const blue = t.color || "#3B63FF";
    const deep = t.deep || "#12207F";
    const glow = t.glow || "#F2A98B";
    const rad = Math.PI / 180;
    const cx = from + room / 2, cy = -0.42 * h;
    const rx = room * 0.4, ry = h * 1.0;
    const P = (kk, a) => [cx + rx * kk * Math.cos(a * rad), cy + ry * kk * Math.sin(a * rad)];
    const rings = [
      { k0: 0.40, k1: 0.66, n: 13, a0: 26, a1: 154, gap: 0.3, glow: 0.3 },
      { k0: 0.72, k1: 1.0, n: 11, a0: 20, a1: 160, gap: 0.3, glow: 0.28 },
      { k0: 1.06, k1: 1.7, n: 6, a0: 32, a1: 148, gap: 0.45, glow: 0.2 }
    ];
    ctx.save();
    ctx.beginPath();
    ctx.rect(from, 0, room, h);
    ctx.clip();
    rings.forEach((rg, ri) => {
      const step = (rg.a1 - rg.a0) / rg.n;
      for (let i = 0; i < rg.n; i++) {
        const w = step * (1 - rg.gap);
        const a = rg.a0 + i * step + (step - w) / 2;
        const p0 = P(rg.k0, a), p1 = P(rg.k0, a + w), p2 = P(rg.k1, a + w), p3 = P(rg.k1, a);
        const mx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4, my = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
        const edge = 1;
        const centre = 1 - Math.min(1, Math.abs(a - 90) / 90) * 0.35;
        ctx.globalAlpha = edge * (0.75 + 0.25 * centre);
        const g = ctx.createLinearGradient((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2);
        if (ri === 2) {
          g.addColorStop(0, blue);
          g.addColorStop(0.55, deep);
          g.addColorStop(1, "rgba(27,47,168,0)");
        } else {
          g.addColorStop(0, deep);
          g.addColorStop(0.5, blue);
          g.addColorStop(1, deep);
        }
        ctx.save();
        ctx.shadowColor = blue;
        ctx.shadowBlur = h * 0.03;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // peach glow in the middle of the panel
        const r = Math.hypot(p1[0] - p0[0], p3[1] - p0[1]) * 0.55 + h * 0.05;
        const gx = ri === 2 ? (p0[0] + p1[0]) / 2 : mx, gy = ri === 2 ? (p0[1] + p1[1]) / 2 + (p3[1] - p0[1]) * 0.18 : my;
        const rgd = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
        rgd.addColorStop(0, glow);
        rgd.addColorStop(1, "rgba(242,169,139,0)");
        ctx.globalAlpha *= rg.glow;
        ctx.fillStyle = rgd;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();
        // thin peach rib lines in the gap beside the panel
        if (i % 2 === 0) {
          const q0 = P(rg.k0 + (rg.k1 - rg.k0) * 0.08, a - step * 0.12), q1 = P(rg.k1 - (rg.k1 - rg.k0) * 0.1, a - step * 0.12);
          ctx.globalAlpha = edge * 0.7;
          ctx.strokeStyle = glow;
          ctx.lineWidth = Math.max(1, h * 0.011);
          ctx.beginPath();
          ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]);
          ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  function drawHeader(ctx, f, k, team, crestImg, subtitle) {
    const t = { secondary: k.onHeader };
    let textX = PAD;
    const crestSize = f.head * 0.52;
    if (crestImg) textX = PAD + crestSize + 36;
    const title = team.name.toUpperCase();
    const eSize = f.head * 0.075;
    const sSize = f.head * 0.07;
    const tSize = fitSize(ctx, title, f.w - textX - PAD, 800, f.head * 0.26, 40, DISPLAY, true);
    const titleW = ctx.measureText(title).width;
    ctx.font = font(500, sSize, BODY);
    const subW = ctx.measureText(subtitle).width;
    ctx.font = font(600, eSize, DISPLAY);
    const eyebrowW = ctx.measureText("MY RANKING").width + 40;
    const clearX = textX + Math.max(titleW, subW, eyebrowW) + 36;

      ctx.fillStyle = k.header;
      ctx.fillRect(0, 0, f.w, f.head);
    headerPattern(ctx, f, k, clearX);
        headerCollar(ctx, f, k, clearX);
    if (k.headerStripes && k.headerStripes.length) {
      const total = k.headerStripes.reduce((n, st) => n + st[1], 0);
      let yy = f.head - 14;
      k.headerStripes.forEach(st => {
        const hh = (14 * st[1]) / total;
        ctx.fillStyle = st[0];
        ctx.fillRect(0, yy, f.w, Math.ceil(hh));
        yy += hh;
      });
    } else {
      ctx.fillStyle = k.headerBand;
      ctx.fillRect(0, f.head - 14, f.w, 14);
    }

    if (crestImg) {
      const inner = k.crestBg ? crestSize * 0.68 : crestSize;
      const s = Math.min(inner / crestImg.naturalWidth, inner / crestImg.naturalHeight);
      const w = crestImg.naturalWidth * s;
      const h = crestImg.naturalHeight * s;
      if (k.crestBg) {
        ctx.fillStyle = k.crestBg;
        ctx.beginPath();
        ctx.arc(PAD + crestSize / 2, (f.head - 14) / 2, crestSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.drawImage(crestImg, PAD + (crestSize - w) / 2, (f.head - 14 - h) / 2, w, h);
    }
    const mid = (f.head - 14) / 2;
    const blockH = eSize + tSize * 0.95 + sSize * 1.7;
    const eBase = mid - blockH / 2 + eSize;
    const tBase = eBase + tSize * 0.95;
    const sBase = tBase + sSize * 1.7;

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = t.secondary;
    ctx.globalAlpha = 0.85;
    ctx.font = font(600, eSize, DISPLAY);
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "4px";
    ctx.fillText("MY RANKING", textX, eBase);
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
    ctx.globalAlpha = 1;

    ctx.font = font(800, tSize, DISPLAY, true);
    if (k.metal && k.metal.length > 1) {
      const g = ctx.createLinearGradient(textX, tBase - tSize, textX + titleW, tBase);
      k.metal.forEach((c, i) => g.addColorStop(i / (k.metal.length - 1), c));
      ctx.fillStyle = g;
    }
    ctx.fillText(title, textX, tBase);
    ctx.fillStyle = t.secondary;

    ctx.globalAlpha = 0.85;
    ctx.font = font(500, sSize, BODY);
    ctx.fillText(subtitle, textX, sBase);
    ctx.globalAlpha = 1;
  }

  function rankScale(rank) {
    return Math.max(0, (4 - rank) / 3);
  }

  function columns(hMax) {
    const pad = Math.min(hMax * 0.28, 44);
    const rankW = Math.min(hMax * 0.5, 120) * 1.65;
    const slot = Math.min(hMax * 0.36, 96) * 2;
    const gap = Math.min(hMax * 0.26, 36);
    return { pad, rankW, slot, gap, nameOff: pad + rankW + slot + gap, twoLine: hMax >= 84 };
  }

  function weight(entry) {
    return 1 + GROWTH * rankScale(entry.rank);
  }

  function centredBaseline(ctx, text, mid) {
    const mt = ctx.measureText(text);
    return mid + (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
  }

  function nameFit(ctx, w, h, entry, showPos, m) {
    const twoLine = m.twoLine && h >= 56;
    const posW = showPos && !twoLine ? h * 2.3 : 0;
    const maxName = w - m.nameOff - posW - m.pad;
    const desired = Math.min(h * (twoLine ? 0.3 : 0.4), 84);
    const fitted = fitSize(ctx, entry.player.name.toUpperCase(), maxName, 800, desired, 18, DISPLAY);
    return { desired, fitted };
  }

  function groupNameSizes(ctx, rows) {
    const fits = rows.map(r => nameFit(ctx, r.w, r.h, r.entry, r.showPos, r.cols));
    const k = Math.min(1, ...fits.map(f => f.fitted / f.desired));
    return fits.map(f => Math.max(18, f.desired * k));
  }

  function drawRow(ctx, x, y, w, h, entry, img, theme, showPos, cols, nameSize) {
    const m = cols || columns(h);
    const sc = rankScale(entry.rank);
    const floor = theme.rowTintFloor || 0;
    const amount = sc > 0 ? (theme.rowTintStrength != null ? theme.rowTintStrength : 0.07) * (floor + (1 - floor) * sc) : 0;
    ctx.fillStyle = Kits.mix(theme.rowTint || theme.primary, theme.card, amount);
    rr(ctx, x, y, w, h, Math.min(20, h * 0.24));
    ctx.fill();

    const mid = y + h / 2;
    const pad = m.pad;
    const label = entry.rank + (entry.tied ? "=" : "");
    ctx.fillStyle = theme.primary;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const rankSize = Math.min(h * 0.5, 120);
    ctx.font = font(800, fitSize(ctx, label, m.rankW, 800, rankSize, 18, DISPLAY, true), DISPLAY, true);
    ctx.fillText(label, x + pad + m.rankW / 2, centredBaseline(ctx, label, mid));
    ctx.textAlign = "left";

    const ar = Math.min(h * 0.36, 96);
    const ax = x + pad + m.rankW + m.slot / 2;
    drawAvatar(ctx, ax, mid, ar, img, entry.player, entry.kit, 0);

    const nameX = x + m.nameOff;
    const twoLine = m.twoLine && h >= 56;
    const posInline = showPos && !twoLine;
    const posW = posInline ? h * 2.3 : 0;
    const maxName = x + w - nameX - posW - pad;
    const name = entry.player.name.toUpperCase();
    const size = nameSize || fitSize(ctx, name, maxName, 800, Math.min(h * (twoLine ? 0.3 : 0.4), 84), 18, DISPLAY);
    ctx.fillStyle = theme.ink;
    ctx.font = font(800, size, DISPLAY);
    const nameText = ellipsize(ctx, name, maxName);

    ctx.textBaseline = "alphabetic";
    if (twoLine) {
      const metaSize = nameSize ? Math.min(Math.max(16, nameSize * 0.62), 32) : Math.min(Math.max(18, h * 0.14), 32);
      const meta = entry.metaLine || [entry.positionLabel, entry.player.number != null ? "#" + entry.player.number : ""].filter(Boolean).join(" · ");
      const nameAsc = ctx.measureText(nameText).actualBoundingBoxAscent;
      ctx.font = font(500, metaSize, BODY);
      const mm = ctx.measureText(meta);
      const gap = metaSize * 0.5;
      const block = nameAsc + gap + mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
      const nameBase = mid - block / 2 + nameAsc;
      ctx.fillStyle = theme.ink;
      ctx.font = font(800, size, DISPLAY);
      ctx.fillText(nameText, nameX, nameBase);
      ctx.fillStyle = theme.muted;
      ctx.font = font(500, metaSize, BODY);
      ctx.fillText(meta, nameX, nameBase + gap + mm.actualBoundingBoxAscent);
    } else {
      ctx.fillText(nameText, nameX, centredBaseline(ctx, nameText, mid));
      if (posInline) {
        const pos = entry.positionLabel.toUpperCase();
        ctx.fillStyle = theme.muted;
        ctx.textAlign = "right";
        ctx.font = font(600, h * 0.28, DISPLAY);
        ctx.fillText(pos, x + w - pad, centredBaseline(ctx, pos, mid));
      }
    }
  }

  function layoutList(ctx, f, shown, imgs, top, bottom, theme) {
    const avail = bottom - top;
    const fullW = f.w - PAD * 2;
    const maxFirst = f.h * 0.17;
    const sumW = shown.reduce((sum, e) => sum + weight(e), 0);
    const gapOf = h => Math.max(8, h * 0.1);

    let base = (avail - gapOf(70) * (shown.length - 1)) / sumW;
    base = Math.min(base, MAX_ROW, maxFirst / weight(shown[0]));

    if (base >= MIN_ROW) {
      const rowW = Math.min(fullW, f.maxRowW || fullW);
      const x0 = PAD + (fullW - rowW) / 2;
      const heights = shown.map(e => base * weight(e));
      const gaps = heights.slice(1).map(gapOf);
      const used = heights.reduce((a, h) => a + h, 0) + gaps.reduce((a, g) => a + g, 0);
      let y = top + Math.max(0, (avail - used) / 2);
      const cols = columns(heights[0]);
      const sizes = f.uniformNames
        ? groupNameSizes(ctx, shown.map((e, i) => ({ w: rowW, h: heights[i], entry: e, showPos: true, cols })))
        : [];
      shown.forEach((e, i) => {
        drawRow(ctx, x0, y, rowW, heights[i], e, imgs.get(e.key), theme, true, cols, sizes[i]);
        y += heights[i] + (gaps[i] || 0);
      });
      return;
    }

    const lead = shown.slice(0, Math.min(3, shown.length));
    const rest = shown.slice(lead.length);
    const leadW = lead.reduce((sum, e) => sum + weight(e), 0);
    const colGap = 20;
    const sideGap = 40;
    const leadAreaW = f.side ? fullW * 0.4 : fullW;
    const restX = f.side ? PAD + leadAreaW + sideGap : PAD;
    const restAreaW = f.side ? fullW - leadAreaW - sideGap : fullW;

    let best = null;
    for (let n = 2; n <= (f.maxCols || 2); n++) {
      const perCol = Math.ceil(rest.length / n);
      const colW = (restAreaW - colGap * (n - 1)) / n;
      if (n > 2 && (colW < 290 || rest.length < (f.threeColsFrom || 12))) break;
      const used = h => f.side
        ? perCol * h + (perCol - 1) * gapOf(h)
        : lead.reduce((sum, e) => sum + h * weight(e) + gapOf(h * weight(e)), 0) + perCol * h + (perCol - 1) * gapOf(h);
      let lo = 8;
      let hi = f.side ? MAX_ROW : Math.min(MAX_ROW, maxFirst / weight(lead[0]));
      for (let k = 0; k < 30; k++) {
        const midH = (lo + hi) / 2;
        if (used(midH) <= avail) lo = midH;
        else hi = midH;
      }
      const c = lo;
      const score = f.uniformNames
        ? Math.min(...groupNameSizes(ctx, rest.map(e => ({ w: colW, h: c, entry: e, showPos: false, cols: columns(c) }))))
        : c;
      if (!best || score > best.score + 0.5) best = { n, perCol, colW, c, score };
    }
    const { perCol, colW, c } = best;
    const restGap = gapOf(c);

    let leadH;
    let y;
    if (f.side) {
      let lb = (avail - gapOf(90) * (lead.length - 1)) / leadW;
      lb = Math.min(lb, MAX_ROW * 1.1, Math.min(maxFirst, f.leadMax || Infinity) / weight(lead[0]));
      leadH = lead.map(e => lb * weight(e));
      const leadUsed = leadH.reduce((a, h) => a + h, 0) + leadH.slice(1).map(gapOf).reduce((a, g) => a + g, 0);
      y = top + Math.max(0, (avail - leadUsed) / 2);
    } else {
      leadH = lead.map(e => c * weight(e));
      const used = leadH.reduce((a, h) => a + h, 0) + leadH.map(gapOf).reduce((a, g) => a + g, 0) + perCol * c + (perCol - 1) * restGap;
      y = top + Math.max(0, (avail - used) / 2);
    }
    const leadCols = columns(leadH[0]);
    const restCols = columns(c);
    const leadSizes = f.uniformNames
      ? groupNameSizes(ctx, lead.map((e, i) => ({ w: leadAreaW, h: leadH[i], entry: e, showPos: true, cols: leadCols })))
      : [];
    const restSizes = f.uniformNames
      ? groupNameSizes(ctx, rest.map(e => ({ w: colW, h: c, entry: e, showPos: false, cols: restCols })))
      : [];
    lead.forEach((e, i) => {
      drawRow(ctx, PAD, y, leadAreaW, leadH[i], e, imgs.get(e.key), theme, true, leadCols, leadSizes[i]);
      y += leadH[i] + gapOf(leadH[i]);
    });
    const restTop = f.side ? top + Math.max(0, (avail - (perCol * c + (perCol - 1) * restGap)) / 2) : y;
    rest.forEach((e, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      drawRow(ctx, restX + col * (colW + colGap), restTop + row * (c + restGap), colW, c, e, imgs.get(e.key), theme, false, restCols, restSizes[i]);
    });
  }


  function drawFooter(ctx, f, siteUrl, creditNote, theme) {
    const y = f.h - f.foot;
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(f.w - PAD, y);
    ctx.stroke();
    ctx.textBaseline = "middle";
    const lineY = y + f.foot / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = theme.onPaper;
    ctx.font = font(800, 34, DISPLAY, true);
    ctx.fillText(siteUrl ? "RANK YOURS" : "bit.ly/player-sorter", PAD, creditNote ? lineY - 14 : lineY);
    if (siteUrl) {
      ctx.textAlign = "right";
      ctx.fillStyle = theme.paperPrimary;
      ctx.font = font(600, 28, BODY);
      ctx.fillText(siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""), f.w - PAD, creditNote ? lineY - 14 : lineY);
    }
    if (creditNote) {
      ctx.textAlign = "left";
      ctx.fillStyle = theme.onPaperMuted;
      ctx.font = font(500, 20, BODY);
      ctx.fillText(creditNote, PAD, lineY + 24);
    }
  }

  async function render(opts, allowImages) {
    const { format, mode, team, entries, siteUrl, subtitleExtra } = opts;
    const kitFor = opts.kitFor || (t => Kits.get(t));
    const kit = kitFor(team);
    const f = FORMATS[format];
    const useImages = allowImages !== false;
    await loadFonts();

    const limit = LIMITS[mode];
    const shown = entries.slice(0, Math.min(limit, entries.length));
    shown.forEach(e => { e.kit = kitFor(e.team); });

    const imgs = new Map();
    let crestImg = null;
    if (useImages) {
      crestImg = await loadImage(opts.crestSrc);
      await Promise.all(shown.map(async e => imgs.set(e.key, await loadImage(e.photoSrc))));
    }

    const canvas = document.createElement("canvas");
    canvas.width = f.w;
    canvas.height = f.h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = kit.paper;
    ctx.fillRect(0, 0, f.w, f.h);

    const modeLabel = mode === "top3" ? "Top 3" : mode === "top10" ? "Top 10" : team.squadLabel ? "All " + team.squadLabel : "Full squad";
    drawHeader(ctx, f, kit, team, crestImg, (team.shareLabel || team.season + " " + (team.squadLabel || "squad")) + " · " + modeLabel + (subtitleExtra || ""));

    layoutList(ctx, f, shown, imgs, f.head + 36, f.h - f.foot - 28, kit);

    const credited = shown.some(e => imgs.get(e.key) && e.player.credit);
    drawFooter(ctx, f, siteUrl, credited ? "Player photos via Wikimedia Commons. Full credits on the site." : "", kit);

    if (useImages) {
      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch (e) {
        const fallback = await render(opts, false);
        fallback.photosDropped = true;
        return fallback;
      }
    }
    return canvas;
  }

  function canvasToFile(canvas, name) {
    const data = canvas.toDataURL("image/png");
    const bin = atob(data.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], name, { type: "image/png" });
  }

  function canShareFiles() {
    try {
      const probe = new File([new Uint8Array(1)], "probe.png", { type: "image/png" });
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [probe] }));
    } catch (e) {
      return false;
    }
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function inAppBrowser() {
    const ua = navigator.userAgent || "";
    return /Twitter|TwitterAndroid|FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Bytedance|Snapchat|LinkedInApp|Pinterest|; wv\)/i.test(ua);
  }

  function isTouchDevice() {
    try {
      return window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    } catch (e) {
      return false;
    }
  }

  function prefersSaveView() {
    return inAppBrowser() || isTouchDevice();
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function needsBrowserEscape() {
    return inAppBrowser() && isAndroid();
  }

  function browserIntent(href) {
    const u = new URL(href);
    return "intent://" + u.host + u.pathname + u.search +
      "#Intent;scheme=" + u.protocol.replace(":", "") +
      ";action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE" +
      ";S.browser_fallback_url=" + encodeURIComponent(href) + ";end";
  }

  function showSaveView(canvas, message, escapeHref) {
    const old = document.querySelector(".save-view");
    if (old) old.remove();
    const view = document.createElement("div");
    view.className = "save-view" + (escapeHref ? " has-escape" : "");
    view.setAttribute("role", "dialog");
    view.setAttribute("aria-modal", "true");
    view.innerHTML =
      '<button type="button" class="save-view-close" aria-label="Close"><svg class="x-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
      '<p class="save-view-tip"></p>' +
      (escapeHref
        ? '<p class="save-view-sub save-view-stuck">If press & hold isn\'t working, please open in your browser. Twitter browser is buggy and I can\'t figure out how to fix it. I\'m sorry.</p>'
        : "") +
      '<img class="save-view-img" alt="Your ranking">';
    view.querySelector(".save-view-tip").textContent = message || "Press and hold the image to save it";
    view.querySelector(".save-view-img").src = canvas.toDataURL("image/png");
    const openLink = view.querySelector(".save-view-open");
    if (escapeHref && openLink) openLink.href = browserIntent(escapeHref);
    const close = () => view.remove();
    view.querySelector(".save-view-close").addEventListener("click", close);
    view.addEventListener("click", e => { if (e.target === view) close(); });
    document.body.appendChild(view);
    return view;
  }

  window.ShareImage = { render, canvasToFile, canShareFiles, download, LIMITS, inAppBrowser, prefersSaveView, showSaveView, needsBrowserEscape, browserIntent };
})();