const SHEET_NAME = "Requests";
const HEADERS = ["Received", "Type", "Category", "Squad", "Player / league", "Notes", "Squad id", "Page", "Status"];
const TYPES = { team: "Squad request", player: "Missing player", other: "Message" };
const STATUSES = ["New", "Added", "Not adding"];
const MAX_PER_MINUTE = 30;

const OLD_RANKINGS_SHEET = "Rankings";
const RANKINGS_BOOK_NAME = "Player Sorter rankings";
const RANKINGS_BOOK_KEY = "RANKINGS_BOOK_ID";
const RANKING_HEADERS = ["Updated", "Players", "Ranking", "Device"];
const RANKINGS_PER_MINUTE = 300;
const STATS_MIN = 20;
const STATS_CACHE_SECONDS = 900;
const COUNTS_CACHE_KEY = "counts";
const CUSTOM_COUNT_KEY = "CUSTOM_RANKINGS";
const CUSTOM_SQUAD_ID = "build-your-own";
const LINKS_SHEET = "Links";
const LINK_ID_LENGTH = 7;
const LINK_MAX_QUERY = 3000;
const LINK_CACHE_SECONDS = 21600;
const LINK_ID_PATTERN = /^[A-Za-z0-9]{4,12}$/;
const LINK_QUERY_PATTERN = /^[A-Za-z0-9._~:%+=&*!'()-]+$/;
const ID_PATTERN = /^[a-z0-9-]{1,60}$/;
const DEVICE_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const LIBRARY_SHEET = "Library";
const LIBRARY_CHUNK = 45000;
const LIBRARY_MAX = 450000;
const LIBRARY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LIBRARY_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{9}$/;
const LIBRARY_PER_MINUTE = 240;

let rankingsBookCache_ = null;

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: "busy" });
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (data.website) return reply_(true);
    if (data.type === "ranking") return reply_(saveRanking_(data));
    if (data.type === "custom") return json_(countCustom_());
    if (data.type === "library") {
      try {
        return json_(library_(data));
      } catch (error) {
        return json_({ ok: false, error: String(error && error.message || error) });
      }
    }
    if (data.type === "short") {
      try {
        return json_(shorten_(data));
      } catch (error) {
        return json_({ ok: false, error: String(error && error.message || error) });
      }
    }

    const type = TYPES[data.type];
    if (!type) return reply_(false);
    if (data.type === "team" && !clean_(data.squad)) return reply_(false);
    if (data.type === "player" && !clean_(data.name)) return reply_(false);
    if (data.type === "other" && !clean_(data.notes)) return reply_(false);
    if (overLimit_("requests", MAX_PER_MINUTE)) return reply_(false);

    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      type,
      clean_(data.category, 60),
      clean_(data.squad, 120),
      clean_(data.name, 120),
      clean_(data.notes, data.type === "other" ? 1000 : 500),
      clean_(data.squadId, 60),
      clean_(data.page, 200),
      "New"
    ]);
    return reply_(true);
  } catch (error) {
    return reply_(false);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === "stats") return json_(stats_(String(params.squad || "")));
  if (params.action === "counts") return json_(counts_());
  if (params.action === "link") return json_(expand_(String(params.id || "")));
  return reply_(true);
}

function setup() {
  trimColumns_(getSheet_(), HEADERS.length);
  const book = rankingsBook_(true);
  Logger.log("Rankings spreadsheet: " + book.getUrl());
}

function migrateRankings() {
  const old = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(OLD_RANKINGS_SHEET);
  if (!old || old.getLastRow() < 2) {
    Logger.log("No old Rankings tab to move.");
    return;
  }
  const rows = old.getRange(2, 1, old.getLastRow() - 1, 5).getValues();
  const bySquad = {};
  rows.forEach(r => {
    const squad = String(r[1] || "");
    const device = String(r[4] || "").split("|")[1] || "";
    if (!ID_PATTERN.test(squad) || !DEVICE_PATTERN.test(device)) return;
    const list = bySquad[squad] || (bySquad[squad] = {});
    const row = [r[0], r[2], r[3], device];
    if (!list[device] || new Date(row[0]) > new Date(list[device][0])) list[device] = row;
  });

  const report = [];
  const skipped = [];
  Object.keys(bySquad).forEach(squad => {
    const result = migrateSquad_(squad, bySquad[squad]);
    if (result === null) skipped.push(squad);
    else report.push(squad + ": " + result.added + " added, " + result.updated + " updated, " + result.kept + " already there");
  });
  Logger.log("Rankings spreadsheet: " + rankingsBook_(true).getUrl() + "\n" + report.join("\n"));
  if (skipped.length) Logger.log("Too busy right now, run migrateRankings again for: " + skipped.join(", "));
}

function migrateSquad_(squad, incoming) {
  const lock = LockService.getScriptLock();
  let got = false;
  for (let attempt = 0; attempt < 6 && !got; attempt++) got = lock.tryLock(5000);
  if (!got) return null;
  try {
    const sheet = squadSheet_(squad, true);
    const last = sheet.getLastRow();
    const existing = last > 1 ? sheet.getRange(2, 1, last - 1, 4).getValues() : [];
    const where = {};
    existing.forEach((row, i) => { where[row[3]] = i; });
    const additions = [];
    let updated = 0;
    let kept = 0;
    Object.keys(incoming).forEach(device => {
      const row = incoming[device];
      const at = where[device];
      if (at === undefined) {
        additions.push(row);
      } else if (new Date(row[0]) > new Date(existing[at][0])) {
        sheet.getRange(at + 2, 1, 1, 4).setValues([row]);
        updated++;
      } else {
        kept++;
      }
    });
    if (additions.length) {
      ensureRows_(sheet, last + additions.length);
      sheet.getRange(last + 1, 1, additions.length, 4).setValues(additions);
    }
    if (additions.length || updated) CacheService.getScriptCache().remove("stats-" + squad);
    return { added: additions.length, updated: updated, kept: kept };
  } finally {
    lock.releaseLock();
  }
}

function saveRanking_(data) {
  const squad = String(data.squadId || "");
  const device = String(data.device || "");
  if (!ID_PATTERN.test(squad) || !DEVICE_PATTERN.test(device)) return false;
  if (!Array.isArray(data.order) || !data.order.length) return false;

  const seen = {};
  const order = [];
  for (const group of data.order) {
    if (!Array.isArray(group) || !group.length) return false;
    const ids = [];
    for (const id of group) {
      if (typeof id !== "string" || !ID_PATTERN.test(id) || seen[id]) return false;
      seen[id] = true;
      ids.push(id);
    }
    order.push(ids);
  }
  const total = Object.keys(seen).length;
  if (total < 2 || total > 80) return false;
  if (overLimit_("rankings", RANKINGS_PER_MINUTE)) return false;

  const sheet = squadSheet_(squad, true);
  const row = [new Date(), total, JSON.stringify(order), device];
  const last = sheet.getLastRow();
  const hit = last > 1
    ? sheet.getRange(2, 4, last - 1, 1).createTextFinder(device).matchEntireCell(true).findNext()
    : null;
  if (hit) sheet.getRange(hit.getRow(), 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  CacheService.getScriptCache().removeAll(["stats-" + squad, COUNTS_CACHE_KEY]);
  return true;
}

function stats_(squad) {
  if (!ID_PATTERN.test(squad)) return { ok: false };
  const cache = CacheService.getScriptCache();
  const cacheKey = "stats-" + squad;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const sheet = squadSheet_(squad, false);
  const last = sheet ? sheet.getLastRow() : 0;
  const rows = last > 1 ? sheet.getRange(2, 3, last - 1, 1).getValues() : [];
  const players = {};
  let count = 0;

  rows.forEach(r => {
    let order;
    try {
      order = JSON.parse(r[0]);
    } catch (err) {
      return;
    }
    if (!Array.isArray(order)) return;
    const total = order.reduce((n, g) => n + g.length, 0);
    const quarter = Math.max(1, Math.round(total / 4));
    let before = 0;
    count++;
    order.forEach(group => {
      const rank = before + 1;
      const after = total - before - group.length;
      group.forEach(id => {
        const p = players[id] || (players[id] = { n: 0, sum: 0, sq: 0, top1: 0, top3: 0, bottom3: 0, topQ: 0, bottomQ: 0, min: rank, max: rank });
        p.n++;
        p.sum += rank;
        p.sq += rank * rank;
        if (rank === 1) p.top1++;
        if (rank <= 3) p.top3++;
        if (after < 3) p.bottom3++;
        if (rank <= quarter) p.topQ++;
        if (after < quarter) p.bottomQ++;
        p.min = Math.min(p.min, rank);
        p.max = Math.max(p.max, rank);
      });
      before += group.length;
    });
  });

  const result = { ok: true, squad: squad, count: count, min: STATS_MIN, updated: new Date().toISOString() };
  if (count >= STATS_MIN) {
    result.players = {};
    Object.keys(players).forEach(id => {
      const p = players[id];
      const avg = p.sum / p.n;
      result.players[id] = {
        n: p.n,
        avg: Math.round(avg * 100) / 100,
        sd: Math.round(Math.sqrt(Math.max(0, p.sq / p.n - avg * avg)) * 100) / 100,
        top1: p.top1,
        top3: p.top3,
        bottom3: p.bottom3,
        topQ: p.topQ,
        bottomQ: p.bottomQ,
        min: p.min,
        max: p.max
      };
    });
  }
  cache.put(cacheKey, JSON.stringify(result), STATS_CACHE_SECONDS);
  return result;
}

function linkId_(query, salt) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + "|" + query);
  let id = "";
  for (let i = 0; i < LINK_ID_LENGTH; i++) id += chars[(bytes[i] + 256) % 62];
  return id;
}

function linksSheet_() {
  const book = rankingsBook_(true);
  let sheet = book.getSheetByName(LINKS_SHEET);
  if (sheet) return sheet;
  sheet = book.insertSheet(LINKS_SHEET);
  sheet.getRange(1, 1, 1, 3).setValues([["Id", "Query", "Created"]]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.getRange("A:A").setNumberFormat("@");
  return sheet;
}

function findLink_(sheet, id) {
  if (sheet.getLastRow() < 2) return null;
  const hit = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).matchCase(true).findNext();
  return hit ? String(sheet.getRange(hit.getRow(), 2).getValue()) : null;
}

function shorten_(data) {
  const query = String(data.q || "");
  if (!query || query.length > LINK_MAX_QUERY || !LINK_QUERY_PATTERN.test(query)) return { ok: false, error: "bad query" };
  if (overLimit_("links", MAX_PER_MINUTE * 4)) return { ok: false, error: "rate limited" };
  const cache = CacheService.getScriptCache();
  const sheet = linksSheet_();
  for (let salt = 0; salt < 5; salt++) {
    const id = linkId_(query, salt);
    const cached = cache.get("link-" + id);
    const existing = cached != null ? cached : findLink_(sheet, id);
    if (existing === query) return { ok: true, id: id };
    if (existing) continue;
    sheet.appendRow([id, query, new Date()]);
    cache.put("link-" + id, query, LINK_CACHE_SECONDS);
    return { ok: true, id: id };
  }
  return { ok: false, error: "no free id" };
}

function expand_(id) {
  if (!LINK_ID_PATTERN.test(id)) return { ok: false };
  const cache = CacheService.getScriptCache();
  let query = cache.get("link-" + id);
  if (query == null) {
    const book = rankingsBook_(false);
    const sheet = book && book.getSheetByName(LINKS_SHEET);
    query = sheet ? findLink_(sheet, id) : null;
    if (!query) return { ok: false };
    cache.put("link-" + id, query, LINK_CACHE_SECONDS);
  }
  return { ok: true, q: query };
}

function countCustom_() {
  if (overLimit_("custom", RANKINGS_PER_MINUTE)) return { ok: false, error: "rate limited" };
  const props = PropertiesService.getScriptProperties();
  const next = Number(props.getProperty(CUSTOM_COUNT_KEY) || 0) + 1;
  props.setProperty(CUSTOM_COUNT_KEY, String(next));
  CacheService.getScriptCache().remove(COUNTS_CACHE_KEY);
  return { ok: true };
}

function counts_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(COUNTS_CACHE_KEY);
  if (cached) return JSON.parse(cached);
  const book = rankingsBook_(false);
  const counts = {};
  if (book) {
    book.getSheets().forEach(sheet => {
      const name = sheet.getName();
      if (!ID_PATTERN.test(name)) return;
      counts[name] = Math.max(0, sheet.getLastRow() - 1);
    });
  }
  const counted = Number(PropertiesService.getScriptProperties().getProperty(CUSTOM_COUNT_KEY) || 0);
  const links = book && book.getSheetByName(LINKS_SHEET) ? Math.max(0, book.getSheetByName(LINKS_SHEET).getLastRow() - 1) : 0;
  counts[CUSTOM_SQUAD_ID] = Math.max(counted, links);
  const result = { ok: true, counts: counts, updated: new Date().toISOString() };
  cache.put(COUNTS_CACHE_KEY, JSON.stringify(result), STATS_CACHE_SECONDS);
  return result;
}

function rankingsBook_(create) {
  if (rankingsBookCache_) return rankingsBookCache_;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(RANKINGS_BOOK_KEY);
  if (id) {
    rankingsBookCache_ = SpreadsheetApp.openById(id);
    return rankingsBookCache_;
  }
  if (!create) return null;
  const book = SpreadsheetApp.create(RANKINGS_BOOK_NAME);
  const first = book.getSheets()[0];
  first.setName("About");
  first.getRange(1, 1).setValue("One tab per squad. Tabs are added automatically when the first ranking for a squad arrives.");
  trimColumns_(first, 1);
  trimRows_(first, 1);
  props.setProperty(RANKINGS_BOOK_KEY, book.getId());
  rankingsBookCache_ = book;
  return book;
}

function squadSheet_(squad, create) {
  const book = rankingsBook_(create);
  if (!book) return null;
  let sheet = book.getSheetByName(squad);
  if (sheet || !create) return sheet;
  sheet = book.insertSheet(squad);
  sheet.getRange(1, 1, 1, RANKING_HEADERS.length).setValues([RANKING_HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  trimColumns_(sheet, RANKING_HEADERS.length);
  trimRows_(sheet, 2);
  sheet.getRange("A:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
  [150, 70, 600, 260].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  return sheet;
}

function trimColumns_(sheet, keep) {
  const max = sheet.getMaxColumns();
  if (max > keep) sheet.deleteColumns(keep + 1, max - keep);
}

function trimRows_(sheet, keep) {
  const max = sheet.getMaxRows();
  if (max > keep) sheet.deleteRows(keep + 1, max - keep);
}

function ensureRows_(sheet, needed) {
  const max = sheet.getMaxRows();
  if (max < needed) sheet.insertRowsAfter(max, needed - max);
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;
  sheet = book.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.getRange("A:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
  [150, 120, 120, 180, 180, 280, 130, 220, 100].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
  sheet.getRange(2, HEADERS.length, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  return sheet;
}

function clean_(value, max) {
  let text = String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function overLimit_(name, limit) {
  const cache = CacheService.getScriptCache();
  const key = name + "-" + Math.floor(Date.now() / 60000);
  const count = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(count), 120);
  return count > limit;
}

function reply_(ok) {
  return json_({ ok: ok });
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function librarySheet_() {
  const book = rankingsBook_(true);
  let sheet = book.getSheetByName(LIBRARY_SHEET);
  if (sheet) return sheet;
  sheet = book.insertSheet(LIBRARY_SHEET);
  sheet.getRange(1, 1, 1, 3).setValues([["Code", "Updated", "Data"]]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.getRange("A:A").setNumberFormat("@");
  return sheet;
}

function findLibraryRow_(sheet, code) {
  if (sheet.getLastRow() < 2) return 0;
  const hit = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(code).matchEntireCell(true).matchCase(true).findNext();
  return hit ? hit.getRow() : 0;
}

function libraryCode_() {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + "|" + Date.now());
  let code = "";
  for (let i = 0; i < 9; i++) code += LIBRARY_CODE_CHARS[(bytes[i] + 256) % LIBRARY_CODE_CHARS.length];
  return code;
}

function libraryBody_(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!Array.isArray(value.rankings) || !Array.isArray(value.folders)) return null;
  const text = JSON.stringify({ rankings: value.rankings, folders: value.folders, dead: value.dead || {} });
  return text.length > LIBRARY_MAX ? null : text;
}

function writeLibrary_(sheet, row, code, text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += LIBRARY_CHUNK) chunks.push("~" + text.slice(i, i + LIBRARY_CHUNK));
  const width = 2 + chunks.length;
  if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  sheet.getRange(row, 1, 1, width).setValues([[code, new Date()].concat(chunks)]);
  const last = sheet.getLastColumn();
  if (last > width) sheet.getRange(row, width + 1, 1, last - width).clearContent();
}

function readLibrary_(sheet, row) {
  const last = sheet.getLastColumn();
  if (last < 3) return {};
  const text = sheet.getRange(row, 3, 1, last - 2).getValues()[0]
    .map(value => String(value))
    .filter(value => value.charAt(0) === "~")
    .map(value => value.slice(1))
    .join("");
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

function library_(data) {
  if (overLimit_("library", LIBRARY_PER_MINUTE)) return { ok: false, error: "rate limited" };
  const op = String(data.op || "");
  const sheet = librarySheet_();
  if (op === "create") {
    const text = libraryBody_(data.data);
    if (text == null) return { ok: false, error: "bad data" };
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = libraryCode_();
      if (findLibraryRow_(sheet, code)) continue;
      writeLibrary_(sheet, Math.max(2, sheet.getLastRow() + 1), code, text);
      return { ok: true, code: code };
    }
    return { ok: false, error: "no free code" };
  }
  const code = String(data.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!LIBRARY_CODE_PATTERN.test(code)) return { ok: false, error: "bad code" };
  const row = findLibraryRow_(sheet, code);
  if (!row) return { ok: false, error: "not found" };
  if (op === "load") return { ok: true, code: code, data: readLibrary_(sheet, row) };
  if (op === "save") {
    const text = libraryBody_(data.data);
    if (text == null) return { ok: false, error: "bad data" };
    writeLibrary_(sheet, row, code, text);
    return { ok: true };
  }
  return { ok: false, error: "bad op" };
}