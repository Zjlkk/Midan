// Simple hash router + mock state prototype (no blockchain)

const state = {
  user: {
    connected: false,
    address: null,
    // Per-competition membership: { [cid]: teamId }
    memberships: {},
  },
  competitions: [],
  teamsByCompetition: new Map(),
  nextTeamId: 101,
  ui: {
    activeModal: null,
    prefillCode: null,
    pendingJoinTeamId: null,
    currentCid: null,
  },
};

function seedMock() {
  const now = Date.now();
  state.competitions = [
    mkEvent(
      "sonic-trade",
      "Sonic SVM On‑Chain Trading Competition",
      "A trading tournament hosted by Sonic SVM with a prize pool of up to $1,000,000. Form a team and climb the leaderboard.",
      now - 1*86_400_000, now + 14*86_400_000, 'trade', ['Trading','DeFi']
    ),
    mkEvent(
      "sonic-hack",
      "Sonic SVM Internal Hackathon Grouping",
      "Team up for the Sonic SVM internal hackathon. Find collaborators and build fast.",
      now - 2*86_400_000, now + 7*86_400_000, 'hackathon', ['Hackathon','Builders']
    ),
    mkEvent(
      "goodr-alpha",
      "Goodr — Alpha Finding",
      "Scout promising narratives and early signals on the Goodr Launchpad. Share research, validate theses, and surface Alpha.",
      now - 5*86_400_000, now + 20*86_400_000, 'alpha', ['Launchpad','Research']
    ),
    mkEvent(
      "chaos-group",
      "Chaos Finance — Official Group",
      "Join the official Chaos Finance group for AMAs, product updates, and direct Q&A with the team.",
      now - 3*86_400_000, now + 30*86_400_000, 'official', ['AMA','Community']
    ),
    mkEvent(
      "chillonic-otc",
      "Chillonic — OTC Group",
      "Peer‑to‑peer OTC hub for exchanging Chillonic NFTs. Find counterparties safely and coordinate trades.",
      now - 2*86_400_000, now + 15*86_400_000, 'trade', ['NFT','OTC']
    ),
    mkEvent(
      "fomoney-gov",
      "FoMoney — Governance Event",
      "Back your favorite ticker and participate in governance decisions. Rally a team for coordinated voting.",
      now + 1*86_400_000, now + 7*86_400_000, 'official', ['Governance','Voting']
    ),
  ];

  const teams_trade = [
    mkTeam(1, "Alpha Squad", false, 10, [addr("A1"), addr("A2"), addr("A3")], addr("A1"), now - 3600_000, null, "High‑frequency strategy experiments and cross‑venue market making. Daily PnL reviews and fast iteration."),
    mkTeam(2, "Beta Wolves", true, 6, [addr("B1"), addr("B2")], addr("B1"), now - 7200_000, "BETA1234", "Private quant pod focused on momentum and breakout systems. Invite‑only; share code and risk rules."),
    mkTeam(3, "Gamma Traders", false, 4, [addr("C1"), addr("C2"), addr("C3"), addr("C4")], addr("C1"), now - 86_400_000, null, "Discretionary team tracking catalysts and narrative rotations across the Sonic ecosystem."),
    mkTeam(4, "Delta Focus", true, 8, [addr("D1")], addr("D1"), now - 12_000_000, "DELTA8888", "Options and basis desk optimizing funding and carry. Calm risk, steady edge."),
  ];

  state.teamsByCompetition.set("sonic-trade", teams_trade);
  state.teamsByCompetition.set("sonic-hack", []);
  state.teamsByCompetition.set("goodr-alpha", []);
  state.teamsByCompetition.set("chaos-group", []);
  state.teamsByCompetition.set("chillonic-otc", []);
  state.teamsByCompetition.set("fomoney-gov", []);
}

function mkEvent(id, name, subtitle, startTs, endTs, type, tags) {
  return { id, name, subtitle, startTs, endTs, type, tags };
}

function getTeams(cid) { return state.teamsByCompetition.get(cid) || []; }
function setTeams(cid, teams) { state.teamsByCompetition.set(cid, teams); }

function mkTeam(id, name, isPrivate, maxMembers, members, captain, createdAt, joinCode, description) {
  return { teamId: id, name, description: description || "", isPrivate, maxMembers, members: [...members], captain, createdAt, joinCode: isPrivate ? (joinCode || "SECRET123") : null };
}

function addr(seed) { return `0x${seed}${"0".repeat(Math.max(0, 38 - String(seed).length))}`; }
function shortAddr(a) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }

function getMyTeamId(cid) { return state.user.memberships[cid] || null; }
function hasAnyMembership() { return Object.keys(state.user.memberships).length > 0; }

function showToast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1800); }
function setHash(path) { window.location.hash = `#${path}`; }
function parseHash() { const h = window.location.hash.slice(1) || "/events"; const url = new URL(h, window.location.origin); return { path: url.pathname, search: url.searchParams }; }

function render() {
  const root = document.getElementById("app-root");
  const { path, search } = parseHash();

  // Header buttons state
  document.getElementById("btn-my-team").disabled = !hasAnyMembership();
  document.getElementById("btn-connect").textContent = state.user.connected ? shortAddr(state.user.address) : "Connect Wallet";

  // Router
  if (path === "/events") {
    renderEvents(root);
    return;
  }
  if (path === "/me/teams") {
    renderMyTeams(root);
    return;
  }
  if (path.startsWith("/competition/")) {
    const parts = path.split("/");
    const cid = parts[2];
    state.ui.currentCid = cid;
    if (parts.length === 3) {
      renderCompetitionOverview(root, cid);
      return;
    }
    if (parts.length >= 5 && parts[3] === "team") {
      const teamId = Number(parts[4]);
      const prefill = search.get("prefillCode");
      state.ui.prefillCode = prefill || null;
      renderTeamDetail(root, cid, teamId);
      return;
    }
  }
  setHash("/events");
}

// Filters helpers (Type + Status + Search) with an 'All' chip to reset type/status
function readEventFilters() {
  const url = new URL(window.location.href); const q = url.searchParams;
  const type = q.get('type')||''; // single type key or '' for all
  const status = q.get('status')||''; // ongoing/upcoming/completed
  const search = q.get('q')||'';
  const sort = q.get('sort')||'active';
  return { type, status, search, sort };
}
function writeEventFilters(delta) {
  const url = new URL(window.location.href); const p = url.searchParams; const cur = readEventFilters();
  const next = { ...cur, ...delta };
  p.set('type', next.type||'');
  p.set('status', next.status||'');
  p.set('q', next.search||'');
  p.set('sort', next.sort||'active');
  history.replaceState({}, '', url.toString());
}

function filterEvents(events, f) {
  let arr = [...events];
  if (f.search) {
    const s = f.search.toLowerCase();
    arr = arr.filter(e => e.name.toLowerCase().includes(s) || e.subtitle.toLowerCase().includes(s));
  }
  if (f.type) arr = arr.filter(e => e.type === f.type);
  if (f.status) {
    const now = Date.now();
    arr = arr.filter(e => {
      const st = now < e.startTs ? 'upcoming' : (now > e.endTs ? 'completed' : 'ongoing');
      return st === f.status;
    });
  }
  if (f.sort === 'newest') arr.sort((a,b)=> b.startTs - a.startTs);
  else if (f.sort === 'ending') arr.sort((a,b)=> a.endTs - b.endTs);
  else if (f.sort === 'active') arr.sort((a,b)=> (Date.now()>b.startTs && Date.now()<b.endTs ? 1:0) - (Date.now()>a.startTs && Date.now()<a.endTs ? 1:0));
  return arr;
}

// Views
function renderEvents(root) {
  const f = readEventFilters();
  const events = filterEvents(state.competitions, f);
  const allActive = !f.type && !f.status; // All chip active when no type/status

  root.innerHTML = `
    <section class="intro">
      <div class="intro-grid">
        <div>
          <h2>Midan — On‑chain Arena for Teams</h2>
          <div class="subtitle">A social, team‑first hub where you create events, form teams, chat natively by wallet, and launch on‑chain assets together.</div>
          <div class="bullets">
            <div class="item">✅ On‑chain events & membership</div>
            <div class="item">👥 Team chat & collaboration</div>
            <div class="item">🚀 Group launches made simple</div>
          </div>
        </div>
        <div>
          <div class="visual">
            <svg width="320" height="160" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="gStatic" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#6366F1"/>
                  <stop offset="100%" stop-color="#06B6D4"/>
                </linearGradient>
              </defs>
              <path d="M10,120 C60,40 170,40 310,120" stroke="url(#gStatic)" stroke-width="1.6" stroke-linecap="round" opacity="0.95"/>
              <path d="M10,110 C80,30 190,30 310,110" stroke="url(#gStatic)" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>
              <path d="M10,130 C100,50 210,50 310,130" stroke="url(#gStatic)" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
            </svg>
            <div class="visual-caption">On‑chain sync, team signals</div>
          </div>
        </div>
      </div>
    </section>

    <section class="filters-bar">
      <div class="search"><input id="flt-q" placeholder="Search events" value="${escapeHtml(f.search)}" /></div>
      <div class="chips">
        <div class="chip ${allActive? 'active':''}" id="flt-all">All</div>
      </div>
      <div>
        <select id="flt-type" class="btn outline" style="padding:8px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#0f172a;">
          ${renderTypeOption('', 'Event Type: All', f.type)}
          ${renderTypeOption('trade','Trade', f.type)}
          ${renderTypeOption('hackathon','Hackathon', f.type)}
          ${renderTypeOption('official','Official', f.type)}
          ${renderTypeOption('alpha','Alpha Finding', f.type)}
          ${renderTypeOption('competition','Competition', f.type)}
          ${renderTypeOption('launchpad','Launchpad', f.type)}
          ${renderTypeOption('quest','Quest', f.type)}
        </select>
      </div>
      <div>
        <select id="flt-status" class="btn outline" style="padding:8px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#0f172a;">
          ${renderStatusOption('', 'Status: All', f.status)}
          ${renderStatusOption('ongoing','Ongoing', f.status)}
          ${renderStatusOption('upcoming','Upcoming', f.status)}
          ${renderStatusOption('completed','Completed', f.status)}
        </select>
      </div>
      <div class="spacer"></div>
    </section>

    <section>
      <div class="card-grid" id="comp-grid"></div>
    </section>
  `;

  // Skeleton before rendering content
  const grid = document.getElementById("comp-grid");
  grid.innerHTML = new Array(6).fill(0).map(() => `
    <article class=\"card\">
      <div class=\"skel-line skel\" style=\"width:60%\"></div>
      <div class=\"skel-line skel\" style=\"width:90%\"></div>
      <div class=\"skel-badge skel\"></div>
      <div class=\"skel-line skel\" style=\"width:70%\"></div>
      <div class=\"skel skel-btn\"></div>
    </article>
  `).join("");

  // Then render real cards
  grid.innerHTML = events.map(c => renderEventCard(c)).join("");
  if (events.length === 0) {
    grid.innerHTML = `
      <article class=\"card empty-card\">
        <svg class=\"empty-illu\" viewBox=\"0 0 120 60\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"2\" y=\"18\" rx=\"8\" ry=\"8\" width=\"116\" height=\"24\" fill=\"#eef2ff\" stroke=\"#e5e7eb\"/><path d=\"M10 30 H110\" stroke=\"#c7d2fe\" stroke-dasharray=\"4 6\" /></svg>
        <div class=\"title\">No events found</div>
        <div class=\"subtle\">Try clearing filters or adjusting your search.</div>
        <div class=\"actions\"><button class=\"btn outline\" id=\"clear-filters\">Clear Filters</button></div>
      </article>
    `;
    const clear = document.getElementById('clear-filters'); if (clear) clear.addEventListener('click', ()=> { writeEventFilters({ type:'', status:'', search:'' }); render(); });
  }
  wireEventCardFilters();

  // Filters wiring
  document.getElementById('flt-q').addEventListener('input', (e)=> { writeEventFilters({ search: e.target.value }); render(); });
  document.getElementById('flt-all').addEventListener('click', ()=> { writeEventFilters({ type: '', status: '' }); render(); });
  document.getElementById('flt-type').addEventListener('change', (e)=> { writeEventFilters({ type: e.target.value }); render(); });
  document.getElementById('flt-status').addEventListener('change', (e)=> { writeEventFilters({ status: e.target.value }); render(); });
}

function renderTypeOption(value, label, selected){ return `<option value="${value}" ${selected===value?'selected':''}>${label}</option>`; }
function renderStatusOption(value, label, selected){ return `<option value="${value}" ${selected===value?'selected':''}>${label}</option>`; }

function renderEventCard(c) {
  const now = Date.now();
  const status = now < c.startTs ? 'Upcoming' : (now > c.endTs ? 'Completed' : 'Ongoing');
  const typeClass = (
    c.type==='trade' || c.type==='competition' ? 'type-blue' :
    c.type==='hackathon' || c.type==='alpha' ? 'type-purple' :
    c.type==='official' || c.type==='launchpad' ? 'type-green' :
    'type-orange'
  );
  const coverClass = (
    c.type==='trade' || c.type==='competition' ? 'blue' :
    c.type==='hackathon' || c.type==='alpha' ? 'purple' :
    c.type==='official' || c.type==='launchpad' ? 'green' :
    'orange'
  );
  const icon = c.type==='trade' ? '📈' : c.type==='hackathon' ? '🛠️' : c.type==='official' ? '🏛️' : c.type==='alpha' ? '🔎' : c.type==='launchpad' ? '🚀' : '🎯';
  const teams = getTeams(c.id);
  const teamCount = teams.length;
  const memberCount = teams.reduce((acc,t)=> acc + t.members.length, 0);
  const tagPills = (c.tags||[]).slice(0,2).map(t=> `<span class=\"tag-pill\" data-type-filter=\"${c.type}\">${t}</span>`).join('');
  const more = (c.tags||[]).length>2 ? `<span class=\"tag-pill\" title=\"More\">+${(c.tags||[]).length-2}</span>`: '';
  return `
    <article class="card">
      <div class="cover ${coverClass}"></div>
      <div class="title" style="margin-top:10px;">${escapeHtml(c.name)}</div>
      <div class="subtle">${escapeHtml(c.subtitle)}</div>
      <div class="meta"><span class="badge">${status}</span></div>
      <div class="tag-row">
        <span class="type-pill ${typeClass}"><span class="icon">${icon}</span>${labelForType(c.type)}</span>
        ${tagPills}${more}
      </div>
      <div class="hairline"></div>
      <div class="info-bar">
        <span>${new Date(c.startTs).toLocaleDateString()} – ${new Date(c.endTs).toLocaleDateString()}</span>
        <span>Teams: ${teamCount} · Members: ${memberCount}</span>
      </div>
      <div class="actions">
        <button class="btn primary" data-open-comp="${c.id}">Enter</button>
      </div>
    </article>
  `;
}
function labelForType(t){
  if(t==='trade') return 'Trade';
  if(t==='hackathon') return 'Hackathon';
  if(t==='official') return 'Official';
  if(t==='competition') return 'Competition';
  if(t==='alpha') return 'Alpha Finding';
  if(t==='launchpad') return 'Launchpad';
  if(t==='quest') return 'Quest';
  return 'Event';
}
function wireEventCardFilters(){
  document.querySelectorAll('[data-open-comp]').forEach((el) => { el.addEventListener("click", () => setHash(`/competition/${el.getAttribute("data-open-comp")}`)); });
  document.querySelectorAll('[data-type-filter]').forEach(el=> el.addEventListener('click', ()=> { const typ = el.getAttribute('data-type-filter'); writeEventFilters({ type: typ }); render(); }));
}

function renderCompetitionOverview(root, cid) {
  const c = state.competitions.find(x => x.id === cid);
  if (!c) { root.innerHTML = `<div class="card"><div class="title">Competition not found</div></div>`; return; }
  const now = Date.now();
  const status = now < c.startTs ? 'Upcoming' : (now > c.endTs ? 'Completed' : 'Ongoing');

  // Filters data
  const filters = getUIFilters();
  const teamsAll = getTeams(cid);
  const teams = filterAndSortTeams(teamsAll, filters);
  const totalMembers = teamsAll.reduce((acc,t)=> acc + t.members.length, 0);

  root.innerHTML = `
    <section class="team-header">
      <div>
        <h2>${escapeHtml(c.name)}</h2>
        <div class="meta">
          <span class="badge">${status}</span>
          <span class="badge">${new Date(c.startTs).toLocaleDateString()} – ${new Date(c.endTs).toLocaleDateString()}</span>
        </div>
        <p class="subtle" style="margin-top:8px;">${escapeHtml(c.subtitle)}</p>
      </div>
      <div class="header-cta">
        <button class="btn primary" id="ui-create">Create Team</button>
      </div>
    </section>

    <section class="summary">
      <div class="item">📋 <strong>${teamsAll.length}</strong> Teams</div>
      <div class="item">👥 <strong>${totalMembers}</strong> Members</div>
      <div class="item">⏱️ <strong>${status}</strong></div>
    </section>

    <section class="card" style="margin-bottom:12px;">
      <div class="title">About</div>
      <div class="subtle">Team formation and joining rules: one wallet can create one team or join one team per competition. Private teams require a join code.</div>
    </section>

    <section class="controls">
      <div class="filters">
        <label class="filter"><input type="checkbox" id="flt-joinable"> Joinable</label>
        <label class="filter"><input type="checkbox" id="flt-public"> Public</label>
        <label class="filter"><input type="checkbox" id="flt-private"> Private</label>
        <div class="search"><input id="search" placeholder="Search by team or captain" /></div>
      </div>
      <div class="spacer"></div>
    </section>

    <section>
      <div class="card-grid" id="grid"></div>
    </section>
  `;

  document.getElementById("flt-joinable").checked = filters.joinable;
  document.getElementById("flt-public").checked = filters.publicOnly;
  document.getElementById("flt-private").checked = filters.privateOnly;
  document.getElementById("search").value = filters.search;

  const grid = document.getElementById("grid");
  // Team skeletons
  grid.innerHTML = new Array(6).fill(0).map(() => `
    <article class=\"card\">
      <div class=\"skel-line skel\" style=\"width:40%\"></div>
      <div class=\"skel-line skel\" style=\"width:90%\"></div>
      <div style=\"display:flex;align-items:center;gap:6px;margin:6px 0;\">
        <div class=\"skel-badge skel\"></div>
        <div class=\"skel-badge skel\"></div>
      </div>
      <div style=\"display:flex;align-items:center;\">
        <div class=\"skel skel-avatar\"></div>
        <div class=\"skel skel-avatar\" style=\"margin-left:-6px\"></div>
        <div class=\"skel skel-avatar\" style=\"margin-left:-6px\"></div>
      </div>
      <div class=\"skel skel-btn\" style=\"margin-top:8px\"></div>
    </article>
  `).join("");

  if (teams.length === 0) {
    grid.innerHTML = `
      <article class=\"card empty-card\">
        <svg class=\"empty-illu\" viewBox=\"0 0 120 60\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"2\" y=\"18\" rx=\"8\" ry=\"8\" width=\"116\" height=\"24\" fill=\"#eef2ff\" stroke=\"#e5e7eb\"/><path d=\"M10 30 H110\" stroke=\"#c7d2fe\" stroke-dasharray=\"4 6\" /></svg>
        <div class=\"title\">No teams yet</div>
        <div class=\"subtle\">Create the first team and invite others.</div>
        <div class=\"actions\"><button class=\"btn primary\" id=\"empty-create\">Create Team</button></div>
      </article>`;
    document.getElementById('empty-create').addEventListener('click', ()=> document.getElementById('ui-create').click());
  } else {
    grid.innerHTML = teams.map(t => renderTeamCard(cid, t)).join("");
  }

  document.getElementById("ui-create").addEventListener("click", () => openCreateModal(cid));
  document.getElementById("flt-joinable").addEventListener("change", () => { setUIFilters({ joinable: document.getElementById("flt-joinable").checked }); render(); });
  document.getElementById("flt-public").addEventListener("change", () => { setUIFilters({ publicOnly: document.getElementById("flt-public").checked }); render(); });
  document.getElementById("flt-private").addEventListener("change", () => { setUIFilters({ privateOnly: document.getElementById("flt-private").checked }); render(); });
  document.getElementById("search").addEventListener("input", (e) => {
    setUIFilters({ search: e.target.value });
    const teams2 = filterAndSortTeams(getTeams(cid), getUIFilters());
    if (teams2.length === 0) {
      grid.innerHTML = `<article class=\"card empty-card\"><div class=\"title\">No results</div><div class=\"subtle\">Try adjusting your filters.</div></article>`;
    } else {
      grid.innerHTML = teams2.length ? teams2.map(t => renderTeamCard(cid, t)).join("") : ``;
      wireCardButtons(cid);
    }
  });
  wireCardButtons(cid);
}

function renderTeamCard(cid, t) {
  const full = t.members.length >= t.maxMembers;
  const inTeamThisComp = !!getMyTeamId(cid);
  const btn = full ? `<button class="btn" disabled>Full</button>`
    : inTeamThisComp ? `<button class="btn" disabled>You’re already in a team</button>`
    : t.isPrivate ? `<button class="btn" data-join-private="${t.teamId}">Join with Code</button>`
    : `<button class="btn primary" data-join-public="${t.teamId}">Join</button>`;
  const privacy = t.isPrivate ? '<span class="badge gray">Private</span>' : '<span class="badge green">Public</span>';
  const initials = (addr) => addr.slice(2,4).toUpperCase();
  const avatars = t.members.slice(0,4).map(a => `<div class=\"avatar\">${initials(a)}</div>`).join("");
  const more = t.members.length > 4 ? `<span class=\"more\">+${t.members.length-4}</span>` : '';
  return `
    <article class="card" data-team-id="${t.teamId}">
      <div class="title">${escapeHtml(t.name)}</div>
      <div class="subtle">${escapeHtml(t.description || '')}</div>
      <div class="meta">
        ${privacy}
        <span class="badge">Members ${t.members.length}/${t.maxMembers}</span>
        <span class="badge">Captain ${shortAddr(t.captain)}</span>
      </div>
      <div class="avatars">${avatars}${more}</div>
      <div class="actions">
        <button class="btn outline" data-view="${t.teamId}">View</button>
        ${btn}
      </div>
    </article>
  `;
}

function wireCardButtons(cid) {
  document.querySelectorAll("[data-view]").forEach((el) => { el.addEventListener("click", () => setHash(`/competition/${cid}/team/${el.getAttribute("data-view")}`)); });
  document.querySelectorAll("[data-join-public]").forEach((el) => { el.addEventListener("click", () => joinPublic(cid, Number(el.getAttribute("data-join-public")))); });
  document.querySelectorAll("[data-join-private]").forEach((el) => { el.addEventListener("click", () => openJoinModal(cid, Number(el.getAttribute("data-join-private")))); });
}

function renderTeamDetail(root, cid, teamId) {
  const teams = getTeams(cid);
  const t = teams.find((x) => x.teamId === teamId);
  if (!t) { root.innerHTML = `<div class="card"><div class="title">Team not found</div><div class="subtle">This team does not exist.</div></div>`; return; }
  const full = t.members.length >= t.maxMembers;
  const myTeamId = getMyTeamId(cid);
  const isMember = myTeamId === t.teamId;
  const inOtherTeam = !!myTeamId && !isMember;

  let cta = "";
  if (!state.user.connected) cta = `<button class=\"btn outline\" id=\"cta-connect\">Connect Wallet</button>`;
  else if (isMember) cta = `<button class=\"btn\" id=\"cta-invite\">Invite</button>`;
  else if (inOtherTeam) cta = `<button class=\"btn\" disabled>You’re already in a team</button>`;
  else if (full) cta = `<button class=\"btn\" disabled>Full</button>`;
  else if (t.isPrivate) cta = `<button class=\"btn\" id=\"cta-join-private\">Join with Code</button>`;
  else cta = `<button class=\"btn primary\" id=\"cta-join-public\">Join</button>`;

  const shareUrl = `${location.origin}${location.pathname}#${`/competition/${cid}/team/${t.teamId}`}`;
  const shareHtml = isMember ? `
    <section style=\"height:8px\"></section>
    <section class=\"share\"> 
      <h3>Invite teammates</h3>
      <div class=\"helper\">${t.isPrivate ? 'This link does not include the join code. Share the code separately.' : 'Share this link so anyone can join while spots last.'}</div>
      <div class=\"row\">
        <input id=\"share-url\" value=\"${shareUrl}\" readonly />
        <button class=\"btn\" id=\"btn-copy\">Copy Link</button>
      </div>
    </section>
  ` : "";

  // Only members can view embedded chat
  let chatHtml = "";
  if (isMember) {
    const chatBase = `${location.origin}/team-chat/`;
    const chatUrl = `${chatBase}?team=${encodeURIComponent(String(t.teamId))}&member=1&embed=1&v=${Date.now()}`;
    chatHtml = `
      <section style=\"height:8px\"></section>
      <section class=\"embed\">
        <div class=\"embed-header\">
          <h3>Team Chat</h3>
          <a class=\"btn outline\" href=\"${chatUrl}\" target=\"_blank\" rel=\"noopener\">Open in new window</a>
        </div>
        <iframe class=\"chat-embed\" src=\"${chatUrl}\" title=\"Team Chat\"></iframe>
      </section>
    `;
  }

  root.innerHTML = `
    <section class=\"controls\">
      <button class=\"btn outline\" id=\"back-overview\">← Back</button>
      <div class=\"spacer\"></div>
    </section>
    <section class=\"team-header\">
      <div>
        <h2>${escapeHtml(t.name)}</h2>
        <p class=\"subtle\" style=\"margin-top:6px\">${escapeHtml(t.description || '')}</p>
        <div class=\"meta\">
          ${t.isPrivate ? '<span class="badge gray">Private</span>' : '<span class="badge green">Public</span>'}
          <span class=\"badge\">Members ${t.members.length}/${t.maxMembers}</span>
          <span class=\"badge\">Captain ${shortAddr(t.captain)}</span>
          <span class=\"badge\">Team #${t.teamId}</span>
        </div>
      </div>
      <div class=\"header-cta\">${cta}</div>
    </section>

    <section class=\"members\">
      <h3>Members</h3>
      ${t.members.map(renderMember).join("")}
    </section>

    ${shareHtml}

    ${chatHtml}
  `;

  document.getElementById("back-overview").addEventListener("click", () => setHash(`/competition/${cid}`));
  const c1 = document.getElementById("cta-connect"); if (c1) c1.addEventListener("click", connectWallet);
  const c2 = document.getElementById("cta-join-public"); if (c2) c2.addEventListener("click", () => joinPublic(cid, t.teamId));
  const c3 = document.getElementById("cta-join-private"); if (c3) c3.addEventListener("click", () => openJoinModal(cid, t.teamId));
  const c4 = document.getElementById("btn-copy"); if (c4) c4.addEventListener("click", () => copyShare());
  const c5 = document.getElementById("cta-invite"); if (c5) c5.addEventListener("click", () => copyShare());

  if (state.ui.prefillCode && !isMember && !inOtherTeam && t.isPrivate) { openJoinModal(cid, t.teamId, state.ui.prefillCode); state.ui.prefillCode = null; }
}

function renderMember(m) { return `<div class="member-item"><div class="member-avatar">${m.slice(2,4)}</div><div>${shortAddr(m)}</div></div>`; }

function renderMyTeams(root) {
  const entries = Object.entries(state.user.memberships);
  const list = entries.map(([cid, teamId]) => {
    const comp = state.competitions.find(c => c.id === cid);
    const team = getTeams(cid).find(t => t.teamId === teamId);
    if (!comp || !team) return null;
    return { cid, comp, team };
  }).filter(Boolean);

  root.innerHTML = `
    <section class=\"team-header\">
      <div>
        <h2>My Teams</h2>
        <div class=\"subtle\">You can have one team per competition. Each entry below is labeled by competition.</div>
      </div>
      <div class=\"header-cta\">
        <button class=\"btn outline\" id=\"back-all\">← Explore Events</button>
      </div>
    </section>
    <section>
      <div class=\"card-grid\" id=\"myteams-grid\"></div>
    </section>
  `;

  document.getElementById("back-all").addEventListener("click", () => setHash("/events"));

  const grid = document.getElementById("myteams-grid");
  if (list.length === 0) {
    grid.innerHTML = `<article class=\"card\"><div class=\"title\">No teams yet</div><div class=\"subtle\">Join or create a team from an event page.</div></article>`;
    return;
  }
  grid.innerHTML = list.map(({ cid, comp, team }) => `
    <article class=\"card\">
      <div class=\"title\">${escapeHtml(team.name)}</div>
      <div class=\"meta\">
        <span class=\"badge\">Event: ${escapeHtml(comp.name)}</span>
        ${team.isPrivate ? '<span class="badge gray">Private</span>' : '<span class="badge green">Public</span>'}
        <span class=\"badge\">Members ${team.members.length}/${team.maxMembers}</span>
      </div>
      <div class=\"actions\">
        <button class=\"btn primary\" data-open-team=\"${cid}:${team.teamId}\">View team</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll('[data-open-team]').forEach((el) => {
    el.addEventListener('click', () => {
      const [cid2, teamIdStr] = el.getAttribute('data-open-team').split(':');
      setHash(`/competition/${cid2}/team/${Number(teamIdStr)}`);
    });
  });
}

function getUIFilters() {
  const url = new URL(window.location.href);
  return {
    joinable: url.searchParams.get("joinable") === "1" || false,
    publicOnly: url.searchParams.get("public") === "1" || false,
    privateOnly: url.searchParams.get("private") === "1" || false,
    search: url.searchParams.get("q") || "",
    tag: url.searchParams.get("tag") || "all"
  };
}
function setUIFilters(delta) {
  const url = new URL(window.location.href); const params = url.searchParams;
  if (delta.joinable !== undefined) params.set("joinable", delta.joinable ? "1" : "0");
  if (delta.publicOnly !== undefined) params.set("public", delta.publicOnly ? "1" : "0");
  if (delta.privateOnly !== undefined) params.set("private", delta.privateOnly ? "1" : "0");
  if (delta.search !== undefined) params.set("q", delta.search);
  if (delta.tag !== undefined) params.set("tag", delta.tag);
  history.replaceState({}, "", url.toString());
}
function filterAndSortTeams(arr, f) {
  let out = [...arr];
  if (f.joinable) out = out.filter((t) => t.members.length < t.maxMembers);
  if (f.publicOnly && !f.privateOnly) out = out.filter((t) => !t.isPrivate);
  if (f.privateOnly && !f.publicOnly) out = out.filter((t) => t.isPrivate);
  if (f.search) { const q = f.search.toLowerCase(); out = out.filter((t) => t.name.toLowerCase().includes(q) || shortAddr(t.captain).toLowerCase().includes(q)); }
  out.sort((a, b) => (b.members.length - a.members.length) || (b.createdAt - a.createdAt));
  return out;
}

// Actions (mocked)
function connectWallet() { if (!state.user.connected) { state.user.connected = true; state.user.address = addr("YOU"); showToast("Wallet connected (mock)"); render(); } }

function openCreateModal(cid) {
  if (!state.user.connected) { showToast("Connect wallet to continue"); return; }
  if (getMyTeamId(cid)) { showToast("You’re already in a team for this competition"); return; }
  toggleModal("modal-create", true);
  const radios = document.querySelectorAll('input[name="privacy"]');
  const codeField = document.getElementById("create-code-field");
  radios.forEach(r => r.addEventListener('change', () => { const isPrivate = document.querySelector('input[name="privacy"]:checked').value === 'private'; codeField.hidden = !isPrivate; }));
  const desc = document.getElementById('create-desc'); const counter = document.getElementById('desc-count'); if (desc && counter) { const upd = ()=> counter.textContent = String(desc.value.length); upd(); desc.addEventListener('input', upd); }
  document.getElementById("form-create-team").onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("create-name").value.trim();
    const description = document.getElementById("create-desc").value.trim();
    const privacy = document.querySelector('input[name="privacy"]:checked').value; const isPrivate = privacy === 'private';
    const code = document.getElementById("create-code").value.trim();
    const max = Number(document.getElementById("create-max").value);
    if (!name) { showToast("Please enter a team name"); return; }
    if (description.length < 10) { showToast("Description must be at least 10 characters"); return; }
    if (isPrivate && (code.length < 8 || code.length > 12)) { showToast("Join code must be 8–12 chars"); return; }
    if (max < 3 || max > 50) { showToast("Members limit must be between 3 and 50"); return; }
    const id = state.nextTeamId++;
    const captain = state.user.address;
    const t = mkTeam(id, name, isPrivate, max, [captain], captain, Date.now(), isPrivate ? code : null, description);
    const list = getTeams(cid); list.unshift(t); setTeams(cid, list);
    state.user.memberships[cid] = id;
    toggleModal("modal-create", false);
    showToast("Team created! You’re the captain.");
    setHash(`/competition/${cid}/team/${id}`);
  };
}

function openJoinModal(cid, teamId, prefill) {
  if (!state.user.connected) { showToast("Connect wallet to continue"); return; }
  if (getMyTeamId(cid)) { showToast("You’re already in a team for this competition"); return; }
  state.ui.pendingJoinTeamId = teamId;
  toggleModal("modal-join", true);
  const inp = document.getElementById("join-code"); inp.value = prefill || ""; setTimeout(() => inp.focus(), 50);
  document.getElementById("form-join-private").onsubmit = (e) => { e.preventDefault(); const code = inp.value.trim(); if (code.length < 8 || code.length > 12) { showToast("Join code must be 8–12 chars"); return; } joinPrivate(cid, teamId, code); };
}

function joinPublic(cid, teamId) {
  if (!state.user.connected) { showToast("Connect wallet to continue"); return; }
  if (getMyTeamId(cid)) { showToast("You’re already in a team for this competition"); return; }
  const list = getTeams(cid); const t = list.find(x => x.teamId === teamId); if (!t) return;
  if (t.isPrivate) { showToast("This is a private team"); return; }
  if (t.members.length >= t.maxMembers) { showToast("This team is full"); return; }
  t.members.push(state.user.address); state.user.memberships[cid] = t.teamId;
  showToast("Joined the team"); setHash(`/competition/${cid}/team/${t.teamId}`);
}

function joinPrivate(cid, teamId, code) {
  const list = getTeams(cid); const t = list.find(x => x.teamId === teamId);
  if (!t) { toggleModal("modal-join", false); return; }
  if (!t.isPrivate) { showToast("This is a public team"); return; }
  if (t.members.length >= t.maxMembers) { showToast("This team is full"); return; }
  if (code !== t.joinCode) { showToast("The join code is incorrect"); return; }
  t.members.push(state.user.address); state.user.memberships[cid] = t.teamId;
  toggleModal("modal-join", false); showToast("You’ve joined the team"); setHash(`/competition/${cid}/team/${t.teamId}`);
}

function copyShare() { const el = document.getElementById("share-url"); if (!el) return; el.select(); document.execCommand("copy"); showToast("Link copied"); }
function toggleModal(id, show) { const m = document.getElementById(id); if (!m) return; m.setAttribute("aria-hidden", show ? "false" : "true"); }
function escapeHtml(str) { return str.replace(/[&<>"]+/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] )); }

// Header buttons
function wireHeader() {
  document.getElementById("nav-home").addEventListener("click", () => setHash("/events"));
  document.getElementById("btn-connect").addEventListener("click", connectWallet);
  document.getElementById("btn-my-team").addEventListener("click", () => {
    if (hasAnyMembership()) setHash(`/me/teams`);
  });
  document.querySelectorAll("[data-close-modal]").forEach((el) => { el.addEventListener("click", () => toggleModal(el.getAttribute("data-close-modal"), false)); });
}

window.addEventListener("hashchange", render);

// Init
seedMock();
wireHeader();
render();