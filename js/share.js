(function () {
  const FORMATS = {
    story: { w: 1080, h: 1920, head: 340, foot: 120 },
    post: { w: 1080, h: 1350, head: 240, foot: 96 },
    square: { w: 1080, h: 1080, head: 210, foot: 90, maxCols: 3 },
    wide: { w: 1920, h: 1080, head: 210, foot: 90, maxCols: 3, side: true, maxRowW: 1200, uniformNames: true, leadMax: 150 }
  };
  const LIMITS = { top3: 3, top10: 10, full: Infinity };
  const GROWTH = 0.9;
  const MIN_ROW = 66;
  const MAX_ROW = 104;
  const PAD = 64;
  const CHART_SCALE = 2.2;
  const CHART_PAD = 28;
  const DROP_ROW = 76;
  const DROP_HEAD = 84;
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

  function headerPattern(ctx, f, k, clearX) {
    const p = k.pattern || {};
    const band = (p.bands && p.bands[0]) || k.onHeader;
    const h = f.head - 14;
    const from = Math.max(clearX || 0, 0);
    const room = f.w - from;
    ctx.save();
    if (["zigzag", "hoops", "split"].indexOf(p.type) >= 0) {
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
    ctx.fillStyle = k.headerBand;
    ctx.fillRect(0, f.head - 14, f.w, 14);

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
    ctx.fillText(title, textX, tBase);

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

  function scoreSize(h) {
    return Math.min(h * 0.36, 64);
  }

  function scoreWidth(entry, h) {
    return entry.score == null ? 0 : scoreSize(h) * 2.4;
  }

  function nameFit(ctx, w, h, entry, showPos, m) {
    const twoLine = m.twoLine && h >= 56;
    const posW = showPos && !twoLine && entry.score == null ? h * 2.3 : 0;
    const maxName = w - m.nameOff - posW - scoreWidth(entry, h) - m.pad;
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
    const scored = entry.score != null;
    const posInline = showPos && !twoLine && !scored;
    const posW = posInline ? h * 2.3 : 0;
    const maxName = x + w - nameX - posW - scoreWidth(entry, h) - pad;
    const name = entry.player.name.toUpperCase();
    const size = nameSize || fitSize(ctx, name, maxName, 800, Math.min(h * (twoLine ? 0.3 : 0.4), 84), 18, DISPLAY);
    ctx.fillStyle = theme.ink;
    ctx.font = font(800, size, DISPLAY);
    const nameText = ellipsize(ctx, name, maxName);

    ctx.textBaseline = "alphabetic";
    if (twoLine) {
      const metaSize = nameSize ? Math.min(Math.max(16, nameSize * 0.62), 32) : Math.min(Math.max(18, h * 0.14), 32);
      const meta = entry.positionLabel + " · #" + entry.player.number;
      const nameAsc = ctx.measureText(nameText).actualBoundingBoxAscent;
      ctx.font = font(500, metaSize, BODY);
      const metaText = scored ? ellipsize(ctx, meta, maxName) : meta;
      const mm = ctx.measureText(metaText);
      const gap = metaSize * 0.5;
      const block = nameAsc + gap + mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
      const nameBase = mid - block / 2 + nameAsc;
      ctx.fillStyle = theme.ink;
      ctx.font = font(800, size, DISPLAY);
      ctx.fillText(nameText, nameX, nameBase);
      ctx.fillStyle = theme.muted;
      ctx.font = font(500, metaSize, BODY);
      ctx.fillText(metaText, nameX, nameBase + gap + mm.actualBoundingBoxAscent);
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

    if (scored) {
      const score = String(Math.round(entry.score));
      ctx.fillStyle = theme.primary;
      ctx.textAlign = "right";
      ctx.font = font(800, scoreSize(h), DISPLAY);
      ctx.fillText(score, x + w - pad, centredBaseline(ctx, score, mid));
      ctx.textAlign = "left";
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
      if (n > 2 && (colW < 290 || rest.length < 12)) break;
      let c = f.side
        ? (avail - (perCol - 1) * 8) / (perCol * 1.0)
        : avail / (leadW * 1.1 + perCol * 1.12 + 0.3);
      c = Math.min(c, MAX_ROW);
      if (!f.side) c = Math.min(c, maxFirst / weight(lead[0]));
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


  function drawChartText(ctx, label, colour, outline) {
    ctx.textAlign = label.anchor === "middle" ? "center" : label.anchor === "end" ? "right" : "left";
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeText(label.text, label.x, label.y);
    }
    ctx.fillStyle = colour;
    ctx.fillText(label.text, label.x, label.y);
  }

  function drawChart(ctx, view, x, y, theme) {
    const { plot } = view;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(CHART_SCALE, CHART_SCALE);
    ctx.textBaseline = "alphabetic";
    ctx.lineCap = "round";

    ctx.font = font(500, 12, BODY);
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    view.yTicks.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(plot.left, t.y);
      ctx.lineTo(plot.right, t.y);
      ctx.stroke();
      drawChartText(ctx, { x: plot.left - 8, y: t.y + 4, anchor: "end", text: t.text }, theme.muted);
    });
    view.xTicks.forEach(t => drawChartText(ctx, { x: t.x, y: plot.bottom + 18, anchor: "middle", text: t.text }, theme.muted));

    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.1;
    ctx.fill(new Path2D(view.area));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(view.line));
    ctx.lineWidth = 4;
    view.drops.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d.from.x, d.from.y);
      ctx.lineTo(d.to.x, d.to.y);
      ctx.stroke();
    });

    ctx.lineWidth = 1.5;
    view.points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = theme.primary;
      ctx.strokeStyle = theme.card;
      ctx.fill();
      ctx.stroke();
    });

    ctx.font = font(700, 13, BODY);
    view.drops.forEach(d => drawChartText(ctx, d.label, theme.ink, theme.card));
    view.labels.forEach(l => drawChartText(ctx, l, theme.ink, theme.card));
    ctx.restore();
  }

  function drawDrops(ctx, curve, drops, x, y, w, theme) {
    const rankOf = p => "#" + p.rank + (p.tied ? "=" : "");
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = theme.ink;
    ctx.font = font(800, 36, DISPLAY);
    ctx.fillText("BIGGEST DROPS", x, y + 44);
    drops.forEach((point, i) => {
      const next = curve[point.index + 1];
      const mid = y + DROP_HEAD + DROP_ROW * i + DROP_ROW / 2;
      const value = "−" + point.dropLabel + " pts";
      ctx.font = font(800, 40, DISPLAY);
      const valueW = ctx.measureText(value).width;
      ctx.textAlign = "right";
      ctx.fillStyle = theme.primary;
      ctx.fillText(value, x + w, centredBaseline(ctx, value, mid));
      const pair = rankOf(point) + " " + point.name + " → " + rankOf(next) + " " + next.name;
      const size = fitSize(ctx, pair, w - valueW - 24, 700, 30, 20, BODY);
      ctx.font = font(700, size, BODY);
      const text = ellipsize(ctx, pair, w - valueW - 24);
      ctx.textAlign = "left";
      ctx.fillStyle = theme.ink;
      ctx.fillText(text, x, centredBaseline(ctx, text, mid));
    });
  }

  function layoutCurve(ctx, f, curve, top, bottom, theme) {
    const w = f.w - PAD * 2;
    const drops = f.h > f.w ? ScoreChart.bigDrops(curve) : [];
    const panelH = drops.length ? DROP_HEAD + DROP_ROW * drops.length + CHART_PAD * 2 : 0;
    const chartH = bottom - top - (panelH ? panelH + 20 : 0);
    const view = ScoreChart.layout(curve, (w - CHART_PAD * 2) / CHART_SCALE, (chartH - CHART_PAD * 2) / CHART_SCALE);

    ctx.fillStyle = theme.card;
    rr(ctx, PAD, top, w, chartH, 20);
    ctx.fill();
    drawChart(ctx, view, PAD + CHART_PAD, top + CHART_PAD, theme);

    if (!panelH) return;
    const panelTop = bottom - panelH;
    ctx.fillStyle = theme.card;
    rr(ctx, PAD, panelTop, w, panelH, 20);
    ctx.fill();
    drawDrops(ctx, curve, drops, PAD + CHART_PAD, panelTop + CHART_PAD, w - CHART_PAD * 2, theme);
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

    const isCurve = mode === "curve";
    const shown = isCurve ? [] : entries.slice(0, Math.min(LIMITS[mode], entries.length));
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

    const modeLabel = isCurve ? "Score curve" : mode === "top3" ? "Top 3" : mode === "top10" ? "Top 10" : "Full squad";
    drawHeader(ctx, f, kit, team, crestImg, team.season + " squad · " + modeLabel + (subtitleExtra || ""));

    if (isCurve) layoutCurve(ctx, f, opts.curve, f.head + 36, f.h - f.foot - 28, kit);
    else layoutList(ctx, f, shown, imgs, f.head + 36, f.h - f.foot - 28, kit);

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
      '<button type="button" class="save-view-close" aria-label="Close">×</button>' +
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