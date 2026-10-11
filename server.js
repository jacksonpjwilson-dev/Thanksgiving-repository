const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const boards = require("./data/boards");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const rooms = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json"
};

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? makeCode() : code;
}

function cloneBoard(roundKey) {
  const src = boards[roundKey];
  const categories = src.categories.map((cat) => ({
    title: cat.title,
    clues: cat.clues.map((c, i) => ({
      value: src.values[i],
      clue: c.clue,
      answer: c.answer,
      used: false,
      dailyDouble: false
    }))
  }));
  const cells = [];
  categories.forEach((cat, ci) => cat.clues.forEach((_, ri) => cells.push([ci, ri])));
  for (let n = 0; n < src.dailyDoubles; n++) {
    if (!cells.length) break;
    const idx = Math.floor(Math.random() * cells.length);
    const [ci, ri] = cells.splice(idx, 1)[0];
    categories[ci].clues[ri].dailyDouble = true;
  }
  return { name: src.name, values: src.values, categories };
}

function unusedCount(board) {
  if (!board) return 0;
  let n = 0;
  board.categories.forEach((c) => c.clues.forEach((cl) => { if (!cl.used) n++; }));
  return n;
}

function publicState(room) {
  const players = [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    connected: p.connected,
    wager: p.wager,
    hasWagered: p.hasWagered,
    hasFinalAnswer: p.hasFinalAnswer
  }));
  const board = room.board
    ? {
        name: room.board.name,
        values: room.board.values,
        categories: room.board.categories.map((cat) => ({
          title: cat.title,
          clues: cat.clues.map((c) => ({ value: c.value, used: c.used }))
        }))
      }
    : null;
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    players,
    board,
    current: room.current
      ? {
          category: room.current.category,
          value: room.current.value,
          dailyDouble: room.current.dailyDouble,
          buzzOpen: room.current.buzzOpen,
          buzzer: room.current.buzzer,
          answeringName: room.current.answeringName,
          ddPlayer: room.current.ddPlayer,
          ddPlayerName: room.current.ddPlayerName,
          ddWager: room.current.ddWager
        }
      : null,
    final: room.final
      ? {
          category: room.final.category,
          clueShown: room.final.clueShown,
          answersLocked: room.final.answersLocked
        }
      : null,
    lastResult: room.lastResult,
    event: room.event
  };
}

function hostState(room) {
  const state = publicState(room);
  if (room.board) {
    state.board.categories = room.board.categories.map((cat) => ({
      title: cat.title,
      clues: cat.clues.map((c) => ({
        value: c.value,
        used: c.used,
        dailyDouble: c.dailyDouble,
        clue: c.clue,
        answer: c.answer
      }))
    }));
  }
  if (room.current) {
    state.current.answer = room.current.answer;
    state.current.clue = room.current.clue;
  }
  if (room.final) {
    state.final.answer = room.final.answer;
    state.final.clue = room.final.clue;
    state.final.playerAnswers = [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      wager: p.wager,
      finalAnswer: p.finalAnswer,
      hasWagered: p.hasWagered,
      hasFinalAnswer: p.hasFinalAnswer
    }));
  }
  return state;
}

function startFinal(room) {
  room.round = "final";
  room.phase = "final_wager";
  room.board = null;
  room.current = null;
  room.final = {
    category: boards.final.category,
    clue: boards.final.clue,
    answer: boards.final.answer,
    clueShown: false,
    answersLocked: false
  };
  for (const p of room.players.values()) {
    p.wager = 0;
    p.hasWagered = p.score <= 0;
    p.finalAnswer = "";
    p.hasFinalAnswer = false;
    p.finalJudged = false;
  }
}

function maybeAdvance(room) {
  if (unusedCount(room.board) !== 0) return;
  if (room.round === "jeopardy") {
    room.round = "double";
    room.board = cloneBoard("double");
    room.phase = "board";
    room.lastResult = { message: "Welcome to Double Jeopardy!" };
  } else if (room.round === "double") {
    startFinal(room);
  }
}

function applyAction(room, action, body, clientId) {
  const isHost = room.hostId === clientId;
  const player = room.players.get(clientId);

  switch (action) {
    case "startGame":
      if (!isHost) return;
      room.board = cloneBoard("jeopardy");
      room.round = "jeopardy";
      room.phase = "board";
      room.current = null;
      room.lastResult = null;
      room.controlId = room.players.values().next().value?.id || null;
      break;
    case "selectClue": {
      if (!isHost || room.phase !== "board") return;
      const clue = room.board?.categories?.[body.cat]?.clues?.[body.row];
      if (!clue || clue.used) return;
      clue.used = true;
      const category = room.board.categories[body.cat].title;
      room.lastResult = null;
      if (clue.dailyDouble) {
        room.phase = "daily_double_pick";
        room.current = {
          cat: body.cat, row: body.row, category, value: clue.value,
          clue: clue.clue, answer: clue.answer, dailyDouble: true,
          buzzOpen: false, buzzer: null, answeringName: null,
          ddPlayer: room.controlId,
          ddPlayerName: room.players.get(room.controlId)?.name || null,
          ddWager: null
        };
      } else {
        room.phase = "buzzing";
        room.current = {
          cat: body.cat, row: body.row, category, value: clue.value,
          clue: clue.clue, answer: clue.answer, dailyDouble: false,
          buzzOpen: true, buzzer: null, answeringName: null
        };
        room.event = { type: "buzzersOpen", t: Date.now() };
      }
      break;
    }
    case "openBuzzers":
      if (!isHost || room.phase !== "clue") return;
      room.current.buzzOpen = true;
      room.current.buzzer = null;
      room.phase = "buzzing";
      room.event = { type: "buzzersOpen", t: Date.now() };
      break;
    case "buzz":
      if (!player || room.phase !== "buzzing" || !room.current?.buzzOpen || room.current.buzzer) return;
      room.current.buzzOpen = false;
      room.current.buzzer = clientId;
      room.current.answeringName = player.name;
      room.phase = "answering";
      room.event = { type: "buzzWinner", name: player.name, t: Date.now() };
      break;
    case "hostAssignDD": {
      if (!isHost || room.phase !== "daily_double_pick") return;
      const p = room.players.get(body.playerId);
      if (!p) return;
      room.current.ddPlayer = body.playerId;
      room.current.ddPlayerName = p.name;
      break;
    }
    case "ddWager": {
      if (!player || room.phase !== "daily_double_pick") return;
      if (room.current.ddPlayer && room.current.ddPlayer !== clientId) return;
      if (!room.current.ddPlayer) {
        room.current.ddPlayer = clientId;
        room.current.ddPlayerName = player.name;
      }
      const max = Math.max(room.current.value, player.score, 1000);
      let wager = parseInt(body.amount, 10) || 0;
      wager = Math.max(0, Math.min(wager, max));
      room.current.ddWager = wager;
      room.current.value = wager;
      room.phase = "daily_double_clue";
      break;
    }
    case "judge": {
      if (!isHost || !room.current) return;
      const isDD = room.current.dailyDouble;
      const answeringId = isDD ? room.current.ddPlayer : room.current.buzzer;
      const p = answeringId ? room.players.get(answeringId) : null;
      const value = room.current.value || 0;
      if (p) {
        p.score += body.correct ? value : -value;
        if (body.correct) room.controlId = p.id;
      }
      room.lastResult = {
        correct: !!body.correct,
        name: p?.name || "No one",
        value,
        score: p?.score ?? null
      };
      if (!body.correct && !isDD && room.phase === "answering") {
        room.current.buzzer = null;
        room.current.answeringName = null;
        room.current.buzzOpen = true;
        room.phase = "buzzing";
        room.event = { type: "buzzersOpen", t: Date.now() };
        return;
      }
      room.current = null;
      room.phase = "board";
      maybeAdvance(room);
      break;
    }
    case "skipClue":
      if (!isHost || !room.current) return;
      room.lastResult = { correct: false, name: "No one", value: 0, skipped: true };
      room.current = null;
      room.phase = "board";
      maybeAdvance(room);
      break;
    case "forceDouble":
      if (!isHost) return;
      room.round = "double";
      room.board = cloneBoard("double");
      room.phase = "board";
      room.current = null;
      room.lastResult = { message: "Welcome to Double Jeopardy!" };
      break;
    case "forceFinal":
      if (!isHost) return;
      startFinal(room);
      break;
    case "submitWager": {
      if (!player || room.phase !== "final_wager") return;
      let wager = parseInt(body.amount, 10) || 0;
      wager = Math.max(0, Math.min(wager, Math.max(0, player.score)));
      player.wager = wager;
      player.hasWagered = true;
      break;
    }
    case "revealFinalClue":
      if (!isHost || room.phase !== "final_wager") return;
      room.final.clueShown = true;
      room.phase = "final_clue";
      break;
    case "submitFinalAnswer":
      if (!player || room.phase !== "final_clue") return;
      player.finalAnswer = String(body.answer || "").slice(0, 80);
      player.hasFinalAnswer = true;
      break;
    case "lockFinalAnswers":
      if (!isHost) return;
      room.final.answersLocked = true;
      room.phase = "final_judge";
      break;
    case "judgeFinal": {
      if (!isHost) return;
      const p = room.players.get(body.playerId);
      if (!p) return;
      p.score += body.correct ? p.wager : -p.wager;
      p.finalJudged = true;
      const all = [...room.players.values()].every((x) => x.finalJudged || x.score <= 0);
      if (all) room.phase = "game_over";
      break;
    }
    default:
      break;
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { resolve({}); }
    });
  });
}

function json(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(obj));
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC, "index.html"), (e2, html) => {
        if (e2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/api/create") {
    const body = await readBody(req);
    const code = makeCode();
    rooms.set(code, {
      code,
      hostId: body.clientId,
      hostName: String(body.hostName || "Host").slice(0, 24),
      players: new Map(),
      phase: "lobby",
      round: "jeopardy",
      board: null,
      current: null,
      final: null,
      lastResult: null,
      controlId: null,
      event: null
    });
    return json(res, 200, { code, role: "host" });
  }

  if (req.method === "POST" && url.pathname === "/api/join") {
    const body = await readBody(req);
    const code = String(body.code || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return json(res, 404, { error: "No game found with that code." });
    const id = body.clientId;
    const name = String(body.name || "Player").trim().slice(0, 20) || "Player";
    if (room.players.has(id)) {
      room.players.get(id).connected = true;
      room.players.get(id).name = name;
    } else {
      room.players.set(id, {
        id, name, score: 0, connected: true,
        wager: 0, hasWagered: false, finalAnswer: "", hasFinalAnswer: false
      });
    }
    return json(res, 200, { code, name, role: "player" });
  }

  if (req.method === "POST" && url.pathname === "/api/rehost") {
    const body = await readBody(req);
    const room = rooms.get(String(body.code || "").toUpperCase());
    if (!room) return json(res, 404, { error: "Game not found." });
    room.hostId = body.clientId;
    return json(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/action") {
    const body = await readBody(req);
    const room = rooms.get(String(body.code || "").toUpperCase());
    if (!room) return json(res, 404, { error: "Game not found." });
    applyAction(room, body.action, body, body.clientId);
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const code = (url.searchParams.get("code") || "").toUpperCase();
    const clientId = url.searchParams.get("clientId") || "";
    const role = url.searchParams.get("role") || "player";
    const room = rooms.get(code);
    if (!room) return json(res, 404, { error: "Game not found." });
    const state = role === "host" ? hostState(room) : publicState(room);
    state.meId = clientId;
    return json(res, 200, state);
  }

  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Jeopardy Gamer running on http://0.0.0.0:" + PORT);
});
