(function () {
  const SCORE_MAX = 1000;
  const Y_TICKS = [0, 250, 500, 750, 1000];
  const PADDING = { top: 30, right: 14, bottom: 26, left: 38 };
  const WIDE_HEIGHT = 300;
  const NARROW_HEIGHT = 240;
  const NARROW_WIDTH = 480;
  const DOT_SPACING = 14;
  const X_TICK_SPACING = 30;
  const MAX_DROPS = 3;
  const DROP_MIN_POINTS = 20;
  const DROP_MIN_RATIO = 2;
  const CHAR_WIDTH = 6.8;
  const LADDER_MAX_RADIUS = 104;
  const LADDER_MIN_RADIUS = 10;
  const LADDER_GAP = 0.07;
  const LADDER_TICK_SPACING = 120;
  const LADDER_TICK_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];

  function esc(text) {
    return String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // rows: [{ key, name, rank, tied, score }] in ranking order. `score` keeps its
  // decimals for positions and `label` is the whole number shown to people.
  function points(rows) {
    return rows.map((row, i) => {
      const next = rows[i + 1];
      return {
        ...row,
        index: i,
        label: Math.round(row.score),
        drop: next ? row.score - next.score : 0,
        dropLabel: next ? Math.round(row.score) - Math.round(next.score) : 0
      };
    });
  }

  // The drops that stand out from the usual gap between players, largest first.
  function bigDrops(list) {
    const gaps = list.filter(p => p.drop > 0);
    if (!gaps.length) return [];
    const usual = gaps.reduce((sum, p) => sum + p.drop, 0) / gaps.length;
    return gaps
      .filter(p => p.drop >= DROP_MIN_POINTS && p.drop >= usual * DROP_MIN_RATIO)
      .sort((a, b) => b.drop - a.drop)
      .slice(0, MAX_DROPS);
  }

  function isAllTied(list) {
    return list[0].rank === list[list.length - 1].rank;
  }

  function textBox(label) {
    const width = label.text.length * CHAR_WIDTH;
    const left = label.anchor === "end" ? label.x - width : label.anchor === "middle" ? label.x - width / 2 : label.x;
    return { left, right: left + width, top: label.y - 12, bottom: label.y + 4 };
  }

  function overlaps(a, b) {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }

  function nameLabel(list, point) {
    const others = list.filter(p => p.rank === point.rank).length - 1;
    return point.name + (others ? " +" + others : "") + " · " + point.label;
  }

  // The curve only goes down, so its highest point right of `x` is its height at `x`.
  function curveHeight(list, x) {
    const after = list.findIndex(p => p.x >= x);
    const before = list[after - 1];
    const next = list[after];
    return before ? before.y + (next.y - before.y) * (x - before.x) / (next.x - before.x) : next.y;
  }

  function nameLabels(list, plot) {
    const first = list[0];
    const last = list[list.length - 1];
    if (isAllTied(list)) {
      return [{
        text: "All tied at " + first.label + " pts",
        x: (plot.left + plot.right) / 2,
        y: first.y - 12,
        anchor: "middle"
      }];
    }
    const top = { text: nameLabel(list, first), x: first.x, y: first.y - 12, anchor: "start" };
    const bottom = { text: nameLabel(list, last), x: last.x, y: last.y + 22, anchor: "end" };
    if (bottom.y > plot.bottom - 2) bottom.y = curveHeight(list, textBox(bottom).left) - 8;
    return overlaps(textBox(top), textBox(bottom)) ? [top] : [top, bottom];
  }

  function dropMarks(list, plot, taken) {
    const boxes = taken.map(textBox);
    const marks = [];
    bigDrops(list).forEach(point => {
      const next = list[point.index + 1];
      const middleX = (point.x + next.x) / 2;
      const middleY = (point.y + next.y) / 2;
      const label = { text: "−" + point.dropLabel + " pts", x: middleX + 8, y: middleY - 4, anchor: "start" };
      if (textBox(label).right > plot.right) {
        label.x = middleX - 8;
        label.anchor = "end";
      }
      const box = textBox(label);
      if (boxes.some(other => overlaps(box, other))) return;
      boxes.push(box);
      marks.push({ from: point, to: next, label });
    });
    return marks;
  }

  function xTicks(list, plot) {
    if (isAllTied(list)) return [{ x: list[0].x, text: "1" }];
    const gap = (plot.right - plot.left) / (list.length - 1);
    const step = [1, 2, 5, 10].find(s => s * gap >= X_TICK_SPACING) || 10;
    const counted = position => (step > 2 ? position % step === 0 : (position - 1) % step === 0);
    return list
      .filter(point => point.index === 0 || counted(point.index + 1))
      .map(point => ({ x: point.x, text: String(point.index + 1) }));
  }

  // Everything needed to draw the chart, in pixels, with no DOM or colours. The SVG
  // below reads it, and anything else that draws the chart can read it the same way.
  function layout(list, width, fixedHeight) {
    const height = fixedHeight || (width < NARROW_WIDTH ? NARROW_HEIGHT : WIDE_HEIGHT);
    const plot = {
      left: PADDING.left,
      right: width - PADDING.right,
      top: PADDING.top,
      bottom: height - PADDING.bottom
    };
    const yOf = score => plot.bottom - (plot.bottom - plot.top) * score / SCORE_MAX;
    const span = plot.right - plot.left;
    const placed = list.map(point => ({
      ...point,
      x: plot.left + (list.length > 1 ? span * point.index / (list.length - 1) : span / 2),
      y: yOf(point.score)
    }));
    const first = placed[0];
    const last = placed[placed.length - 1];
    const line = placed.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join("");
    const labels = nameLabels(placed, plot);
    return {
      width,
      height,
      plot,
      points: placed,
      line,
      area: line + "L" + last.x.toFixed(1) + " " + plot.bottom + "L" + first.x.toFixed(1) + " " + plot.bottom + "Z",
      yTicks: Y_TICKS.map(value => ({ y: yOf(value), text: String(value) })),
      xTicks: xTicks(placed, plot),
      labels,
      drops: isAllTied(placed) ? [] : dropMarks(placed, plot, labels),
      showAllDots: placed.length < 2 || span / (placed.length - 1) >= DOT_SPACING
    };
  }

  // Moves circles sideways only, so y keeps meaning the score. Slots sit half a circle
  // apart: tied players fill every other slot and close scores nest in between.
  function stack(ys, size) {
    const placed = [];
    const isFree = (x, y) => placed.every(p => (p.x - x) ** 2 + (p.y - y) ** 2 >= size * size - 0.01);
    let lean = 0;
    ys.forEach(y => {
      const side = lean > 0 ? -1 : 1;
      let x = 0;
      for (let k = 1; !isFree(x, y); k++) x = (k % 2 ? side : -side) * Math.ceil(k / 2) * size / 2;
      lean += Math.sign(x);
      placed.push({ x, y });
    });
    return placed;
  }

  function ladderTicks(high, low, box, yOf) {
    if (high === low) return [{ y: yOf(high), text: String(Math.round(high)) }];
    const perPoint = (yOf(low) - yOf(high)) / (high - low);
    const step = LADDER_TICK_STEPS.find(s => s * perPoint >= LADDER_TICK_SPACING) || SCORE_MAX;
    const ceiling = Math.min(SCORE_MAX, high + (yOf(high) - box.top) / perPoint);
    const floor = Math.max(0, low - (box.bottom - yOf(low)) / perPoint);
    const ticks = [];
    for (let value = Math.ceil(floor / step) * step; value <= ceiling; value += step) {
      ticks.push({ y: yOf(value), text: String(value) });
    }
    return ticks;
  }

  // Circles from the highest score to the lowest, as big as the box allows. The centre
  // of each circle sits exactly on its score. Like layout, it has no DOM or colours.
  function ladder(list, box) {
    const high = list[0].score;
    const low = list[list.length - 1].score;
    const room = box.right - box.left;
    let view = null;
    for (let radius = LADDER_MAX_RADIUS; radius >= LADDER_MIN_RADIUS; radius--) {
      const top = box.top + radius;
      const bottom = box.bottom - radius;
      const yOf = score => (high === low ? (top + bottom) / 2 : top + (bottom - top) * (high - score) / (high - low));
      const placed = stack(list.map(p => yOf(p.score)), radius * 2 * (1 + LADDER_GAP));
      const xs = placed.map(p => p.x);
      const leftmost = Math.min(...xs);
      const rightmost = Math.max(...xs);
      const shift = (box.left + box.right - leftmost - rightmost) / 2;
      view = {
        radius,
        circles: list.map((p, i) => ({ ...p, x: placed[i].x + shift, y: placed[i].y })),
        ticks: ladderTicks(high, low, box, yOf)
      };
      if (rightmost - leftmost + radius * 2 <= room) break;
    }
    return view;
  }

  function svg(view) {
    const { plot } = view;
    const dots = view.showAllDots ? view.points : [view.points[0], view.points[view.points.length - 1]];
    const text = (label, cls) =>
      '<text class="' + cls + '" x="' + label.x.toFixed(1) + '" y="' + label.y.toFixed(1) + '" text-anchor="' + label.anchor + '">' + esc(label.text) + "</text>";
    return (
      '<svg width="' + view.width + '" height="' + view.height + '" viewBox="0 0 ' + view.width + " " + view.height + '" aria-hidden="true">' +
        view.yTicks.map(t =>
          '<line class="sc-grid" x1="' + plot.left + '" x2="' + plot.right + '" y1="' + t.y.toFixed(1) + '" y2="' + t.y.toFixed(1) + '"></line>' +
          text({ x: plot.left - 8, y: t.y + 4, anchor: "end", text: t.text }, "sc-axis")
        ).join("") +
        view.xTicks.map(t => text({ x: t.x, y: plot.bottom + 18, anchor: "middle", text: t.text }, "sc-axis")).join("") +
        '<path class="sc-area" d="' + view.area + '"></path>' +
        '<path class="sc-line" d="' + view.line + '"></path>' +
        view.drops.map(d =>
          '<line class="sc-drop" x1="' + d.from.x.toFixed(1) + '" y1="' + d.from.y.toFixed(1) + '" x2="' + d.to.x.toFixed(1) + '" y2="' + d.to.y.toFixed(1) + '"></line>'
        ).join("") +
        dots.map(p => '<circle class="sc-dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"></circle>').join("") +
        '<line class="sc-cross" y1="' + plot.top + '" y2="' + plot.bottom + '" visibility="hidden"></line>' +
        '<circle class="sc-focus" r="6" visibility="hidden"></circle>' +
        view.drops.map(d => text(d.label, "sc-label sc-label-drop")).join("") +
        view.labels.map(l => text(l, "sc-label")).join("") +
      "</svg>"
    );
  }

  function summary(list) {
    const first = list[0];
    const last = list[list.length - 1];
    if (isAllTied(list)) return "Score curve: all " + list.length + " players tied at " + first.label + " points.";
    const biggest = bigDrops(list)[0];
    return "Score curve for " + list.length + " players, from " + first.label + " points for " + first.name +
      " down to " + last.label + " for " + last.name + "." +
      (biggest ? " The biggest drop is " + biggest.dropLabel + " points, after " + biggest.name + "." : "");
  }

  function markup(list) {
    return (
      '<figure class="score-chart">' +
        "<figcaption>" +
          '<h2 class="score-chart-title">Your score curve</h2>' +
          '<p class="score-chart-sub">Points out of 1000 by position. Hover or tap to see each player.</p>' +
        "</figcaption>" +
        '<div class="score-stage">' +
          '<div class="score-plot" role="img" tabindex="0" aria-label="' + esc(summary(list)) + '"></div>' +
          '<div class="score-tip" aria-live="polite" hidden>' +
            '<b class="score-tip-value"></b>' +
            '<span class="score-tip-name"></span>' +
          "</div>" +
        "</div>" +
      "</figure>"
    );
  }

  function mount(figure, list) {
    const stage = figure.querySelector(".score-stage");
    const plot = figure.querySelector(".score-plot");
    const tip = figure.querySelector(".score-tip");
    let view = null;
    let active = -1;

    function clear() {
      active = -1;
      tip.hidden = true;
      plot.querySelectorAll(".sc-cross, .sc-focus").forEach(el => el.setAttribute("visibility", "hidden"));
    }

    function select(index) {
      active = index;
      const point = view.points[index];
      const cross = plot.querySelector(".sc-cross");
      const focus = plot.querySelector(".sc-focus");
      cross.setAttribute("x1", point.x);
      cross.setAttribute("x2", point.x);
      cross.setAttribute("visibility", "visible");
      focus.setAttribute("cx", point.x);
      focus.setAttribute("cy", point.y);
      focus.setAttribute("visibility", "visible");
      tip.querySelector(".score-tip-value").textContent = point.label + " pts";
      tip.querySelector(".score-tip-name").textContent = "#" + point.rank + (point.tied ? "=" : "") + " " + point.name;
      tip.hidden = false;
      const left = Math.max(0, Math.min(view.width - tip.offsetWidth, point.x - tip.offsetWidth / 2));
      const above = point.y - tip.offsetHeight - 12;
      tip.style.left = left + "px";
      tip.style.top = (above >= 0 ? above : point.y + 12) + "px";
    }

    function draw() {
      const width = Math.floor(stage.clientWidth);
      if (!width || (view && view.width === width)) return;
      view = layout(list, width);
      plot.innerHTML = svg(view);
      if (active >= 0) select(active);
    }

    function nearest(event) {
      const x = event.clientX - plot.getBoundingClientRect().left;
      return view.points.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best)).index;
    }

    plot.addEventListener("pointermove", e => { if (view) select(nearest(e)); });
    plot.addEventListener("pointerdown", e => { if (view) select(nearest(e)); });
    plot.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") clear(); });
    plot.addEventListener("focus", () => { if (view && active < 0 && plot.matches(":focus-visible")) select(0); });
    plot.addEventListener("blur", clear);
    plot.addEventListener("keydown", e => {
      if (!view) return;
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Escape") clear();
      if (!step) return;
      e.preventDefault();
      select(Math.max(0, Math.min(list.length - 1, Math.max(active, 0) + step)));
    });

    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(stage);
  }

  window.ScoreChart = { points, bigDrops, layout, ladder, svg, summary, markup, mount };
})();
