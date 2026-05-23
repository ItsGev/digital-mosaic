/* ============================================================
   admin.js — password gate, review panel, approve / delete
   Depends on: config.js, app.js (loaded first in index.html)
   ============================================================ */

let adminUnlocked = false;

/* ════════════════════════════════════════════════════════════
   PASSWORD GATE
════════════════════════════════════════════════════════════ */
function openAdminGate() {
  if (adminUnlocked) { openAdmin(); return; }
  document.getElementById('pw-gate').classList.add('open');
  setTimeout(() => document.getElementById('pw-input').focus(), 100);
}

function checkPassword() {
  const input = document.getElementById('pw-input');
  if (input.value === CONFIG.admin_password) {
    document.getElementById('pw-gate').classList.remove('open');
    document.getElementById('pw-err').classList.remove('show');
    input.value   = '';
    adminUnlocked = true;
    openAdmin();
  } else {
    input.classList.add('shake');
    input.value = '';
    document.getElementById('pw-err').classList.add('show');
    setTimeout(() => input.classList.remove('shake'), 350);
  }
}

function closePwGate(e) {
  if (e.target === document.getElementById('pw-gate')) {
    document.getElementById('pw-gate').classList.remove('open');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('pw-gate').classList.remove('open');
    exitAdmin();
  }
});

/* ════════════════════════════════════════════════════════════
   ADMIN PANEL — OPEN / EXIT
════════════════════════════════════════════════════════════ */
function openAdmin() {
  document.getElementById('admin-overlay').classList.add('open');
  document.body.classList.add('admin-active');
  document.body.style.overflow = 'hidden';
  renderAdminPanel();
}

function exitAdmin() {
  document.getElementById('admin-overlay').classList.remove('open');
  document.body.classList.remove('admin-active');
  document.body.style.overflow = '';
}

/* ════════════════════════════════════════════════════════════
   ADMIN PANEL — RENDER
════════════════════════════════════════════════════════════ */
function renderAdminPanel() {
  renderPending();
  renderLive();
}

function renderPending() {
  const pending    = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  const list       = document.getElementById('pending-list');
  document.getElementById('pending-count').textContent = pending.length;

  if (pending.length === 0) {
    list.innerHTML = '<div class="admin-empty">No pending submissions — you\'re all caught up ✓</div>';
    return;
  }

  list.innerHTML = pending.map(sub => {
    const date     = new Date(sub.submittedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const tagsHtml = sub.tags.map(t => `<span class="ttag c1">${t}</span>`).join('');
    return `
      <div class="pending-card" id="pc-${sub.id}">
        <div>
          <div class="pc-meta">
            <strong>${sub.type.toUpperCase()}</strong>
            <span>${date}</span>
            <span>by ${sub.authorName}</span>
          </div>
          <div class="pc-title">${sub.title}</div>
          <div class="pc-story">${sub.story}</div>
          ${sub.tags.length ? `<div class="pc-tags">${tagsHtml}</div>` : ''}
        </div>
        <div class="pc-actions">
          <button class="btn-approve" onclick="approveTile('${sub.id}')">✓ Approve &amp; Post</button>
          <button class="btn-reject"  onclick="rejectTile('${sub.id}')">✕ Reject</button>
        </div>
      </div>`;
  }).join('');
}

function renderLive() {
  const tiles      = document.querySelectorAll('#grid .tile');
  const list       = document.getElementById('live-list');
  document.getElementById('live-count').textContent = tiles.length;

  if (tiles.length === 0) {
    list.innerHTML = '<div class="admin-empty">No live tiles yet.</div>';
    return;
  }

  const accentColors = ['navy', 'sky', 'gold', 'gray'];
  list.innerHTML = [...tiles].map((tile, i) => {
    const title  = tile.querySelector('h3')?.textContent || 'Untitled';
    const type   = tile.querySelector('.tile-type')?.textContent?.trim() || '';
    const author = tile.querySelector('.author-name')?.textContent || 'Anonymous';
    const date   = tile.querySelector('.tile-date')?.textContent || '';
    const color  = `var(--${accentColors[i % accentColors.length]})`;
    const id     = tile.dataset.id || '';
    return `
      <div class="live-card">
        <div class="live-card-accent" style="background:${color}"></div>
        <div class="live-card-info">
          <div class="live-card-title">${title}</div>
          <div class="live-card-meta">${type} · ${author} · ${date}</div>
        </div>
        <button class="btn-delete-live" onclick="deleteLiveTileById('${id}')">Delete</button>
      </div>`;
  }).join('');
}

/* ════════════════════════════════════════════════════════════
   APPROVE / REJECT (for pending queue flow)
════════════════════════════════════════════════════════════ */
function approveTile(id) {
  const pending = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  const sub     = pending.find(p => p.id === id);
  if (!sub) return;

  localStorage.setItem(KEY_PENDING, JSON.stringify(pending.filter(p => p.id !== id)));

  const accentColors = ['navy', 'sky', 'gold', 'gray'];
  const tileData = {
    id:         sub.id,
    title:      sub.title,
    type:       sub.type,
    story:      sub.story,
    authorName: sub.authorName,
    tags:       sub.tags,
    date:       new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    accentCls:  accentColors[document.querySelectorAll('#grid .tile').length % 4],
  };

  /* Save to live tiles and render */
  const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
  saved.unshift(tileData);
  localStorage.setItem(KEY_LIVE_TILES, JSON.stringify(saved));
  renderTileToGrid(tileData, true);

  updatePendingBadge();
  updateLiveCount();
  renderAdminPanel();
  toast('Tile approved and posted! ✓', 'success');
}

function rejectTile(id) {
  if (!confirm('Reject and permanently delete this submission?')) return;
  const pending = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  localStorage.setItem(KEY_PENDING, JSON.stringify(pending.filter(p => p.id !== id)));
  updatePendingBadge();
  renderAdminPanel();
  toast('Submission rejected.', '');
}

/* ════════════════════════════════════════════════════════════
   DELETE LIVE TILES — also removes from localStorage
════════════════════════════════════════════════════════════ */
function removeTileFromStorage(id) {
  const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
  localStorage.setItem(KEY_LIVE_TILES, JSON.stringify(saved.filter(t => t.id !== id)));
}

/* Called from admin panel list */
function deleteLiveTileById(id) {
  if (!confirm('Permanently delete this tile from the board?')) return;
  const tile = document.querySelector(`[data-id="${id}"]`);
  if (tile) {
    tile.style.transition = 'opacity .2s, transform .2s';
    tile.style.opacity    = '0';
    tile.style.transform  = 'scale(0.96)';
    setTimeout(() => { tile.remove(); updateLiveCount(); renderLive(); }, 200);
  }
  removeTileFromStorage(id);
  toast('Tile deleted.', '');
}

/* Called from ✕ button on the tile card itself (admin mode) */
function deleteLiveTile(btn) {
  if (!adminUnlocked) return;
  if (!confirm('Permanently delete this tile from the board?')) return;
  const tile = btn.closest('.tile');
  const id   = tile.dataset.id;
  tile.style.transition = 'opacity .2s, transform .2s';
  tile.style.opacity    = '0';
  tile.style.transform  = 'scale(0.96)';
  setTimeout(() => {
    tile.remove();
    updateLiveCount();
    if (document.getElementById('admin-overlay').classList.contains('open')) renderLive();
  }, 200);
  removeTileFromStorage(id);
  toast('Tile deleted.', '');
}
