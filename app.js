const app = document.getElementById("app");
const toastEl = document.getElementById("toast");

function clientId() {
  let id = localStorage.getItem("jp_id");
  if (!id) {
    id = "c" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("jp_id", id);
  }
  return id;
}

let role = null;
let meName = localStorage.getItem("jp_name") || "";
let meId = clientId();
let state = null;
let localCode = "";
let lastEventT = 0;
let pollTimer = null;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), 2200);
}

function money(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, clientId: meId, code: localCode })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function act(action, extra = {}) {
  try {
    await api("/api/action", { action, ...extra });
    await pull();
  } catch (e) {
    toast(e.message);
  }
}

async function pull() {
  if (!localCode || !role) return;
  try {
    const res = await fetch(`/api/state?code=${encodeURIComponent(localCode)}&role=${role}&clientId=${encodeURIComponent(meId)}`);
    if (!res.ok) return;
    const s = await res.json();
    const ev = s.event;
    if (ev && ev.t && ev.t !== lastEventT) {
      lastEventT = ev.t;
      if (ev.type === "buzzersOpen") toast("BUZZERS OPEN");
      if (ev.type === "buzzWinner") toast(ev.name + " buzzed in!");
    }
    const prev = JSON.stringify(state);
    state = s;
    meId = s.meId || meId;
    if (JSON.stringify(state) !== prev) render();
  } catch (_) {}
}

function startPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pull();
  pollTimer = setInterval(pull, 400);
}

function landing() {
  app.innerHTML = `
    <div class="hero card">
      <h1>THANKSGIVING JEOPARDY!</h1>
      <p>Create a room as host, share the code, and buzz in after each clue. Thanksgiving trivia, Daily Doubles, Double Jeopardy, and Final Jeopardy.</p>
      <input id="name" placeholder="Your name" maxlength="20" value="${escapeHtml(meName)}" />
      <div class="row">
        <button id="create">I'm the Host</button>
        <button class="secondary" id="showJoin">I have a code</button>
      </div>
      <div id="joinBox" class="hidden" style="margin-top:16px">
        <input id="code" placeholder="Room code" maxlength="6" style="text-transform:uppercase" />
        <button id="join">Join Game</button>
      </div>
    </div>`;
  document.getElementById("create").onclick = async () => {
    meName = document.getElementById("name").value.trim() || "Host";
    localStorage.setItem("jp_name", meName);
    try {
      const data = await api("/api/create", { hostName: meName });
      role = "host";
      localCode = data.code;
      history.replaceState({}, "", "/?host=" + localCode);
      startPoll();
    } catch (e) { toast(e.message); }
  };
  document.getElementById("showJoin").onclick = () => {
    document.getElementById("joinBox").classList.remove("hidden");
  };
  document.getElementById("join").onclick = joinNow;
}

async function joinNow() {
  meName = (document.getElementById("name")?.value || meName || "Player").trim() || "Player";
  localCode = (document.getElementById("code")?.value || localCode || "").toUpperCase().trim();
  localStorage.setItem("jp_name", meName);
  try {
    const data = await api("/api/join", { code: localCode, name: meName });
    role = "player";
    localCode = data.code;
    meName = data.name;
    history.replaceState({}, "", "/?play=" + localCode);
    startPoll();
  } catch (e) { toast(e.message); }
}

function render() {
  if (!state) return landing();
  if (role === "host") return renderHost();
  return renderPlayer();
}

function scoreboard(highlightId) {
  return `
    <div class="card">
      <div class="pill" style="margin-bottom:10px">Players</div>
      <div class="scores">
        ${(state.players || []).map((p) => `
          <div class="player-card ${p.id === highlightId ? "buzzing" : ""}">
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="score">${money(p.score)}</div>
          </div>`).join("")}
        ${state.players?.length ? "" : "<div class='status'>Waiting for players…</div>"}
      </div>
    </div>`;
}

function roundLabel() {
  if (state.round === "double") return "DOUBLE JEOPARDY";
  if (state.round === "final") return "FINAL JEOPARDY";
  return "THANKSGIVING";
}

function renderHost() {
  app.innerHTML = `
    <div class="topbar">
      <div class="brand">THANKSGIVING HOST</div>
      <div class="pill">Code <span class="code-big" style="font-size:22px">${state.code}</span></div>
      <div class="pill">${roundLabel()}</div>
    </div>
    <div class="layout">
      <div>${hostMain()}</div>
      <div>
        ${scoreboard(state.current?.buzzer)}
        <div class="card" style="margin-top:10px">
          <div class="pill" style="margin-bottom:8px">Host controls</div>
          <div class="controls">${hostControls()}</div>
        </div>
      </div>
    </div>`;
  bindHost();
}

function hostMain() {
  if (state.phase === "lobby") {
    return `<div class="clue-stage">
      <div class="meta">LOBBY</div>
      <div class="text">Share code <b>${state.code}</b> with players.<br/>Press Start when ready.</div>
    </div>`;
  }
  if (state.phase === "board") {
    return boardHtml(true) + (state.lastResult ? resultBanner() : "");
  }
  if (["clue", "buzzing", "answering", "daily_double_pick", "daily_double_clue"].includes(state.phase)) {
    const c = state.current;
    const title = c.dailyDouble ? "DAILY DOUBLE" : `${c.category} — ${money(c.value)}`;
    const showClue = state.phase !== "daily_double_pick";
    return `<div class="clue-stage">
      <div class="meta">${title}</div>
      <div class="text">${showClue ? escapeHtml(c.clue) : "Waiting for Daily Double wager…"}</div>
      ${showClue ? `<div class="answer-box">ANSWER: ${escapeHtml(c.answer)}</div>` : ""}
      <div class="status">${statusLine()}</div>
    </div>`;
  }
  if (["final_wager", "final_clue", "final_judge", "game_over"].includes(state.phase)) {
    return finalHost();
  }
  return "";
}

function resultBanner() {
  const r = state.lastResult;
  if (r.message) return `<div class="status">${escapeHtml(r.message)}</div>`;
  if (r.skipped) return `<div class="status">Clue skipped</div>`;
  return `<div class="status">${escapeHtml(r.name)} ${r.correct ? "was correct" : "was incorrect"} ${r.value ? "(" + money(r.correct ? r.value : -r.value) + ")" : ""}</div>`;
}

function statusLine() {
  const c = state.current || {};
  if (state.phase === "clue") return "Read the clue out loud. Buzzers are live.";
  if (state.phase === "buzzing") return "Read the clue out loud. Buzzers are live.";
  if (state.phase === "answering") return (c.answeringName || "Player") + " is answering.";
  if (state.phase === "daily_double_pick") return (c.ddPlayerName || "A player") + " must wager.";
  if (state.phase === "daily_double_clue") return "Daily Double for " + money(c.ddWager) + ". Judge the answer.";
  return "";
}

function boardHtml(isHost) {
  if (!state.board) return "";
  const cats = state.board.categories;
  let html = `<div class="board">`;
  cats.forEach((c) => { html += `<div class="cat">${escapeHtml(c.title)}</div>`; });
  for (let r = 0; r < 5; r++) {
    cats.forEach((c, ci) => {
      const cell = c.clues[r];
      const cls = ["cell", cell.used ? "used" : "", isHost && cell.dailyDouble && !cell.used ? "dd-host" : ""].join(" ");
      html += `<div class="${cls}" data-cat="${ci}" data-row="${r}">${cell.used ? "" : money(cell.value)}</div>`;
    });
  }
  html += `</div>`;
  return html;
}

function hostControls() {
  const p = state.phase;
  if (p === "lobby") return `<button id="start">Start Game</button>`;
  if (p === "board") return `
    <button class="secondary" id="forceDouble">Skip to Double Jeopardy</button>
    <button class="secondary" id="forceFinal">Skip to Final Jeopardy</button>`;
  if (p === "clue" || p === "buzzing") return `<button class="secondary" id="skip">No one buzzed — skip</button>`;
  if (p === "answering" || p === "daily_double_clue") return `
    <button class="good" id="yes">Correct</button>
    <button class="danger" id="no">Incorrect</button>
    <button class="secondary" id="skip">Skip</button>`;
  if (p === "daily_double_pick") {
    return (state.players || []).map((pl) =>
      `<button class="secondary dd-assign" data-id="${pl.id}">Give DD to ${escapeHtml(pl.name)}</button>`
    ).join("") + `<p class="status">They wager on their own screen.</p>`;
  }
  if (p === "final_wager") return `<button id="revealFinal">Reveal Final Clue</button>`;
  if (p === "final_clue") return `<button id="lockFinal">Lock answers & judge</button>`;
  if (p === "game_over") return `<button id="start">Play again</button>`;
  return "";
}

function winnerBlock() {
  const sorted = [...(state.players || [])].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  return `<div class="status winner">${top ? escapeHtml(top.name) + " wins with " + money(top.score) : "Game over"}</div>`;
}

function finalHost() {
  const f = state.final || {};
  const answers = f.playerAnswers || [];
  return `<div class="clue-stage">
    <div class="meta">FINAL JEOPARDY — ${escapeHtml(f.category)}</div>
    <div class="text">${f.clueShown || state.phase !== "final_wager" ? escapeHtml(f.clue || "") : "Players are wagering…"}</div>
    <div class="answer-box">ANSWER: ${escapeHtml(f.answer || "")}</div>
  </div>
  <div class="card" style="margin-top:12px">
    ${answers.map((p) => `
      <div class="player-card" style="margin-bottom:8px">
        <div class="name">${escapeHtml(p.name)} — wager ${money(p.wager || 0)} ${p.hasWagered ? "✓" : "…"} ${p.hasFinalAnswer ? "answered" : ""}</div>
        <div>${state.phase === "final_judge" || state.phase === "game_over" ? "Answer: <b>" + escapeHtml(p.finalAnswer || "(blank)") + "</b>" : ""}</div>
        ${state.phase === "final_judge" ? `
          <div class="row" style="margin-top:8px">
            <button class="good fj-yes" data-id="${p.id}">Correct</button>
            <button class="danger fj-no" data-id="${p.id}">Incorrect</button>
          </div>` : ""}
      </div>`).join("")}
    ${state.phase === "game_over" ? winnerBlock() : ""}
  </div>`;
}

function bindHost() {
  const on = (id, fn) => document.getElementById(id)?.addEventListener("click", fn);
  on("start", () => act("startGame"));
  on("openBuzz", () => act("openBuzzers"));
  on("yes", () => act("judge", { correct: true }));
  on("no", () => act("judge", { correct: false }));
  on("skip", () => act("skipClue"));
  on("forceDouble", () => act("forceDouble"));
  on("forceFinal", () => act("forceFinal"));
  on("revealFinal", () => act("revealFinalClue"));
  on("lockFinal", () => act("lockFinalAnswers"));
  document.querySelectorAll(".cell").forEach((el) => {
    el.onclick = () => {
      if (el.classList.contains("used")) return;
      act("selectClue", { cat: +el.dataset.cat, row: +el.dataset.row });
    };
  });
  document.querySelectorAll(".dd-assign").forEach((el) => {
    el.onclick = () => act("hostAssignDD", { playerId: el.dataset.id });
  });
  document.querySelectorAll(".fj-yes").forEach((el) => {
    el.onclick = () => act("judgeFinal", { playerId: el.dataset.id, correct: true });
  });
  document.querySelectorAll(".fj-no").forEach((el) => {
    el.onclick = () => act("judgeFinal", { playerId: el.dataset.id, correct: false });
  });
}

function renderPlayer() {
  app.innerHTML = `
    <div class="topbar">
      <div class="brand">THANKSGIVING!</div>
      <div class="pill">${state.code} · ${escapeHtml(meName)}</div>
      <div class="pill">${roundLabel()}</div>
    </div>
    ${playerMain()}
    <div style="margin-top:12px">${scoreboard(state.current?.buzzer)}</div>`;
  bindPlayer();
}

function myPlayer() {
  return (state.players || []).find((p) => p.id === meId);
}

function playerMain() {
  const p = state.phase;
  if (p === "lobby") {
    return `<div class="clue-stage"><div class="meta">YOU'RE IN</div><div class="text">Waiting for the host to start.</div></div>`;
  }
  if (p === "board") {
    return boardHtml(false) + (state.lastResult ? resultBanner() : `<div class="status">Host is picking a clue</div>`);
  }
  if (p === "clue" || p === "buzzing") {
    const c = state.current;
    return `<div class="clue-stage">
      <div class="meta">${escapeHtml(c.category)} — ${money(c.value)}</div>
      <div class="text">Listen to the host</div>
      <div class="status">Buzz when you know it</div>
      <button class="buzzer" id="buzz">BUZZ</button>
    </div>`;
  }
  if (p === "answering") {
    const c = state.current;
    const mine = c.buzzer === meId;
    return `<div class="clue-stage">
      <div class="meta">${mine ? "YOUR TURN" : (c.answeringName || "Player") + " buzzed"}</div>
      <div class="text">${mine ? "Answer out loud." : "Listen for the answer."}</div>
      <div class="status">${mine ? "The host will judge you." : "Waiting for the host to judge."}</div>
    </div>`;
  }
  if (p === "daily_double_pick") {
    const c = state.current;
    const mine = !c.ddPlayer || c.ddPlayer === meId;
    const me = myPlayer();
    const max = Math.max(c.value, me?.score || 0, 1000);
    if (mine) {
      return `<div class="clue-stage">
        <div class="meta">DAILY DOUBLE</div>
        <div class="text">You can wager up to ${money(max)}.</div>
        <input id="wager" type="number" min="0" max="${max}" value="${c.value}" />
        <button id="sendWager">Lock Wager</button>
      </div>`;
    }
    return `<div class="clue-stage"><div class="meta">DAILY DOUBLE</div><div class="text">${escapeHtml(c.ddPlayerName || "A player")} is wagering.</div></div>`;
  }
  if (p === "daily_double_clue") {
    const c = state.current;
    return `<div class="clue-stage">
      <div class="meta">DAILY DOUBLE — ${money(c.ddWager)}</div>
      <div class="text">Listen to the host</div>
      <div class="status">${c.ddPlayer === meId ? "Answer out loud." : escapeHtml(c.ddPlayerName || "Player") + " is answering."}</div>
    </div>`;
  }
  if (p === "final_wager") {
    const me = myPlayer();
    const max = Math.max(0, me?.score || 0);
    if (max <= 0) {
      return `<div class="clue-stage"><div class="meta">FINAL JEOPARDY — ${escapeHtml(state.final.category)}</div><div class="text">You need a positive score to play Final.</div></div>`;
    }
    return `<div class="clue-stage">
      <div class="meta">FINAL JEOPARDY — ${escapeHtml(state.final.category)}</div>
      <div class="text">Wager up to ${money(max)}. Category only — clue comes next.</div>
      <input id="wager" type="number" min="0" max="${max}" value="0" />
      <button id="sendFinalWager">${me?.hasWagered ? "Update Wager" : "Lock Wager"}</button>
    </div>`;
  }
  if (p === "final_clue") {
    const me = myPlayer();
    return `<div class="clue-stage">
      <div class="meta">FINAL JEOPARDY — ${escapeHtml(state.final.category)}</div>
      <div class="text">Listen to the host, then type your answer</div>
      ${me && me.score > 0 ? `
        <input id="finalAns" placeholder="Your answer" maxlength="80" />
        <button id="sendFinalAns">${me.hasFinalAnswer ? "Update Answer" : "Submit Answer"}</button>` : `<div class="status">Watching Final Jeopardy</div>`}
    </div>`;
  }
  if (p === "final_judge" || p === "game_over") {
    return `<div class="clue-stage">
      <div class="meta">FINAL JEOPARDY</div>
      <div class="text">Host is revealing answers</div>
      ${p === "game_over" ? winnerBlock() : `<div class="status">Host is judging answers.</div>`}
    </div>`;
  }
  return "";
}

function bindPlayer() {
  document.getElementById("buzz")?.addEventListener("click", () => act("buzz"));
  document.getElementById("sendWager")?.addEventListener("click", () => {
    act("ddWager", { amount: document.getElementById("wager").value });
  });
  document.getElementById("sendFinalWager")?.addEventListener("click", () => {
    act("submitWager", { amount: document.getElementById("wager").value });
  });
  document.getElementById("sendFinalAns")?.addEventListener("click", () => {
    act("submitFinalAnswer", { answer: document.getElementById("finalAns").value });
  });
}

const params = new URLSearchParams(location.search);
if (params.get("host")) {
  localCode = params.get("host").toUpperCase();
  role = "host";
  api("/api/rehost", { code: localCode }).then(startPoll).catch(() => landing());
} else if (params.get("play")) {
  landing();
  document.getElementById("code").value = params.get("play");
  document.getElementById("joinBox").classList.remove("hidden");
} else {
  landing();
}
