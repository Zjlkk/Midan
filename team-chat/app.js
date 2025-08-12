const state = {
  user: { connected: false, address: null },
  memberships: new Set(),
  currentTeamId: "team-101",
  channels: [ { id: "general", name: "#general" } ],
  activeChannelId: "general",
  activeDM: null,
  embed: false,
  messages: {
    general: [
      { from: "0xALPHA000000000000000000000000000000000000", ts: Date.now() - 100000, text: "Welcome to the team!" },
      { from: "0xBETA000000000000000000000000000000000000", ts: Date.now() - 80000, text: "Hey all, let's sync." },
    ],
  },
  dms: {},
};

// Parse URL params for team context and membership flag
(function initFromURL(){
  try {
    const url = new URL(window.location.href);
    const teamParam = url.searchParams.get('team');
    const isMember = url.searchParams.get('member') === '1';
    const embed = url.searchParams.get('embed') === '1';
    if (teamParam) state.currentTeamId = teamParam;
    if (isMember && teamParam) state.memberships.add(teamParam);
    state.embed = embed;
    if (embed) {
      const btn = document.getElementById('btn-connect');
      if (btn) btn.style.display = 'none';
    }
  } catch(err) { /* ignore */ }
})();

function short(a){ return a?.slice(0,6)+"…"+a?.slice(-4); }
function showToast(msg){ const t = ensureToast(); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1500);} 
function ensureToast(){ let t = document.getElementById('toast'); if(!t){ t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t);} return t; }

function connectWallet(){
  if(state.user.connected) return;
  state.user.connected = true;
  state.user.address = "0xYOU000000000000000000000000000000000000";
  const btn = document.getElementById('btn-connect'); if(btn) btn.textContent = short(state.user.address);
  showToast('Wallet connected (mock)');
  render();
}

function render(){
  const root = document.getElementById('app-root');
  const isMember = state.memberships.has(state.currentTeamId);
  const dmPeers = Object.keys(state.dms);
  const showingDM = !!state.activeDM;
  const headerTitle = 'Chat';
  const placeholder = !isMember ? 'Join the team to chat' : (showingDM ? `Message ${short(state.activeDM)}…` : 'Type a message…');

  root.innerHTML = `
    <section class="chat">
      <aside class="sidebar">
        <div class="section">
          <div class="badge">Team: ${state.currentTeamId}</div>
          <div>${isMember ? 'Member access granted' : 'Not a member'}</div>
        </div>
        <div class="section" id="channels">
          <div class="section-title">Channels</div>
          ${state.channels.map(c => `<div class="channel ${!showingDM && state.activeChannelId===c.id?'active':''}" data-chan="${c.id}">${c.name}</div>`).join('')}
        </div>
        <div class="section" id="dm-list">
          <div class="section-title">Direct Messages</div>
          ${dmPeers.length? dmPeers.map(a=> `<div class="channel ${showingDM && state.activeDM===a?'active':''}" data-dm="${a}">@${short(a)}</div>`).join('') : '<div class="meta">No DMs yet</div>'}
        </div>
      </aside>
      <section class="content">
        <div class="toolbar">
          <div>${headerTitle}</div>
          <div></div>
        </div>
        <div class="msgs" id="msgs">
          ${renderMessages(showingDM ? 'dm' : 'channel')}
        </div>
        <div class="composer">
          <input id="msg-input" placeholder="${placeholder}" ${isMember? '' : 'disabled'} />
          <button class="btn" id="btn-send" ${isMember? '' : 'disabled'}>Send</button>
        </div>
      </section>
    </section>
  `;

  document.querySelectorAll('[data-chan]').forEach(el=> el.addEventListener('click',()=>{ state.activeChannelId = el.getAttribute('data-chan'); state.activeDM = null; render(); }));
  document.querySelectorAll('[data-dm]').forEach(el=> el.addEventListener('click',()=>{ state.activeDM = el.getAttribute('data-dm'); render(); }));

  document.getElementById('btn-send').addEventListener('click', sendMsg);
  const inp = document.getElementById('msg-input');
  inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ sendMsg(); }});

  document.querySelectorAll('[data-peer]').forEach(el => el.addEventListener('click', ()=> openDM(el.getAttribute('data-peer'))));
}

// Attach header connect button once (for non-embed)
(function(){ const b = document.getElementById('btn-connect'); if(b){ b.addEventListener('click', connectWallet); }})();

function renderMessages(kind){
  let arr = [];
  if(kind==='channel') arr = state.messages[state.activeChannelId] || [];
  else if(kind==='dm') arr = state.dms[state.activeDM] || [];
  if(arr.length===0) return `<div class="meta">No messages yet.</div>`;
  return arr.map(m=> `
    <div class="msg">
      <div class="avatar" data-peer="${m.from}">${m.from.slice(2,4)}</div>
      <div class="bubble">
        <div class="meta">${short(m.from)} • ${new Date(m.ts).toLocaleTimeString()}</div>
        <div>${escapeHtml(m.text)}</div>
      </div>
    </div>
  `).join('');
}

function openDM(addr){
  if(!addr) return;
  state.activeDM = addr;
  if(!state.dms[addr]){
    state.dms[addr] = [ { from: addr, ts: Date.now(), text: `Hi, this is ${short(addr)}. Let's chat!` } ];
  }
  render();
}

function sendMsg(){
  const isMember = state.memberships.has(state.currentTeamId);
  if(!isMember){ showToast('Join the team to chat'); return; }
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if(!text) return;
  const from = state.user.connected ? state.user.address : '0xYOU';
  if(state.activeDM){
    state.dms[state.activeDM] = state.dms[state.activeDM] || [];
    state.dms[state.activeDM].push({ from, ts: Date.now(), text });
  } else {
    state.messages[state.activeChannelId] = state.messages[state.activeChannelId] || [];
    state.messages[state.activeChannelId].push({ from, ts: Date.now(), text });
  }
  input.value = '';
  render();
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

render(); 