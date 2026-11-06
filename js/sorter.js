(function () {
  // Elo points at each whole slider level. Level 0 is a tie. Levels in between
  // are interpolated by levelGap.
  const LEVEL_GAPS = [0, 50, 120, 200, 300, 400];
  // Scores are stored with two decimals: 1.01 stays at least 1 after rounding.
  const MIN_GAP = 1.01;
  const FIT_PASSES = 500;
  const FIT_TOLERANCE = 0.001;
  const MAX_FIT_STEP = 200;
  const SCORE_MAX = 1000;

  function levelGap(level) {
    const below = Math.min(Math.floor(level), LEVEL_GAPS.length - 2);
    return LEVEL_GAPS[below] + (LEVEL_GAPS[below + 1] - LEVEL_GAPS[below]) * (level - below);
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mergePlan(n) {
    const q = new Array(n).fill(1);
    let work = 0;
    let worstChoices = 0;
    while (q.length > 1) {
      const a = q.shift();
      const b = q.shift();
      work += a + b;
      worstChoices += a + b - 1;
      q.push(a + b);
    }
    return { work, worstChoices };
  }

  function countItems(groups) {
    return groups.reduce((sum, g) => sum + g.length, 0);
  }

  function create(ids, weighted) {
    const state = {
      queue: shuffle(ids).map(id => [[id]]),
      left: null,
      right: null,
      merged: null,
      i: 0,
      j: 0,
      placed: 0,
      total: mergePlan(ids.length).work,
      choices: 0,
      done: false,
      history: []
    };
    if (weighted) state.weights = [];
    startNextMerge(state);
    return state;
  }

  function startNextMerge(state) {
    if (state.queue.length < 2) {
      state.done = true;
      state.left = state.right = state.merged = null;
      return;
    }
    state.left = state.queue.shift();
    state.right = state.queue.shift();
    state.merged = [];
    state.i = 0;
    state.j = 0;
  }

  function settle(state) {
    while (!state.done && (state.i >= state.left.length || state.j >= state.right.length)) {
      const rest = state.i >= state.left.length
        ? state.right.slice(state.j)
        : state.left.slice(state.i);
      state.placed += countItems(rest);
      state.queue.push(state.merged.concat(rest));
      startNextMerge(state);
    }
  }

  function snapshot(state) {
    const { history, weights, ...rest } = state;
    return JSON.stringify(rest);
  }

  function current(state) {
    if (state.done) return null;
    return { left: state.left[state.i][0], right: state.right[state.j][0] };
  }

  function choose(state, pick, level) {
    if (state.done) return;
    state.history.push(snapshot(state));
    const l = state.left[state.i];
    const r = state.right[state.j];
    if (state.weights) {
      const stored = pick === "tie" ? 0 : Math.round(level * 100) / 100;
      state.weights.push(pick === "right" ? [r[0], l[0], stored] : [l[0], r[0], stored]);
    }
    if (pick === "left") {
      state.merged.push(l);
      state.placed += l.length;
      state.i++;
    } else if (pick === "right") {
      state.merged.push(r);
      state.placed += r.length;
      state.j++;
    } else {
      state.merged.push(l.concat(r));
      state.placed += l.length + r.length;
      state.i++;
      state.j++;
    }
    state.choices++;
    settle(state);
  }

  function undo(state) {
    if (!state.history.length) return false;
    const prev = JSON.parse(state.history.pop());
    Object.assign(state, prev);
    if (state.weights) state.weights.pop();
    return true;
  }

  function progress(state) {
    if (state.done || state.total === 0) return 1;
    return state.placed / state.total;
  }

  function ranking(state) {
    if (!state.done) return [];
    const groups = state.queue[0] || [];
    const out = [];
    let rank = 1;
    for (const g of groups) {
      out.push({ rank, ids: g.slice() });
      rank += g.length;
    }
    return out;
  }

  function expected(gap) {
    return 1 / (1 + Math.pow(10, -gap / 400));
  }

  // Finds the gaps between neighbouring groups that best explain every answer at
  // once, like a hard-margin ranking SVM: every winner must end at least MIN_GAP
  // above their loser, and within that limit the Elo error is as small as possible.
  // The ranking is already known, so the unknowns are how far each gap goes beyond
  // MIN_GAP. Neighbouring groups always met in a matchup, so this separates them all.
  // Each game is [winner, loser, gap], using positions in the ranking.
  function fitExtraGaps(count, games) {
    const extra = new Array(Math.max(0, count - 1)).fill(0);
    const crossing = extra.map(() => []);
    games.forEach(game => {
      for (let k = game[0]; k < game[1]; k++) crossing[k].push(game);
    });
    const ratings = new Array(count).fill(0).map((_, i) => -i * MIN_GAP);
    for (let pass = 0; pass < FIT_PASSES; pass++) {
      let moved = 0;
      extra.forEach((value, k) => {
        let error = 0;
        let curve = 0;
        crossing[k].forEach(([winner, loser, gap]) => {
          const e = expected(ratings[winner] - ratings[loser]);
          error += expected(gap) - e;
          curve += e * (1 - e);
        });
        if (!curve) return;
        const step = (400 / Math.LN10) * error / curve;
        const next = Math.max(0, value + Math.max(-MAX_FIT_STEP, Math.min(MAX_FIT_STEP, step)));
        const change = next - value;
        if (!change) return;
        extra[k] = next;
        moved = Math.max(moved, Math.abs(change));
        for (let i = k + 1; i < count; i++) ratings[i] -= change;
      });
      if (moved < FIT_TOLERANCE) break;
    }
    return extra;
  }

  // Centres the scores on 500. If they don't fit in 0-1000, only the part of each
  // gap above MIN_GAP shrinks, so two close players stay close instead of landing
  // on 1000 and 0, and no gap drops below the minimum.
  function toScoreScale(extra) {
    const floor = extra.length * MIN_GAP;
    const total = extra.reduce((sum, gap) => sum + gap, 0);
    const spread = floor + total;
    const shrink = spread > SCORE_MAX ? (SCORE_MAX - floor) / total : 1;
    let score = (SCORE_MAX + Math.min(spread, SCORE_MAX)) / 2;
    const out = [score];
    extra.forEach(gap => {
      score -= MIN_GAP + gap * shrink;
      out.push(score);
    });
    return out.map(value => Math.round(value * 100) / 100 + 0);
  }

  function scores(state) {
    if (state.savedScores) return state.savedScores;
    if (!state.done || !state.weights) return null;
    const groups = state.queue[0] || [];
    const groupOf = {};
    groups.forEach((g, i) => g.forEach(id => { groupOf[id] = i; }));
    const games = state.weights
      .map(([winner, loser, level]) => [groupOf[winner], groupOf[loser], levelGap(level)])
      .filter(([winner, loser]) => winner !== loser);
    const scale = toScoreScale(fitExtraGaps(groups.length, games));
    const out = {};
    groups.forEach((g, i) => g.forEach(id => { out[id] = scale[i]; }));
    return out;
  }

  function allIds(state) {
    const ids = [];
    const collect = list => list && list.forEach(g => g.forEach(id => ids.push(id)));
    state.queue.forEach(collect);
    if (!state.done) {
      collect(state.left);
      collect(state.right);
    }
    return ids;
  }

  window.MergeSorter = {
    create, choose, undo, current, progress, ranking, allIds, scores,
    levelGap,
    maxLevel: LEVEL_GAPS.length - 1,
    worstChoices: n => mergePlan(n).worstChoices
  };
})();
