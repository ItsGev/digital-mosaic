/* ============================================================
   admin.js — password gate, review panel, approve / delete
   Depends on: config.js, app.js (loaded first in index.html)
   ============================================================ */

let adminUnlocked = false;

/* ════════════════════════════════════════════════════════════
   PASSWORD GATE
════════════════════════════════════════════════════════════ */
function openAdminGate() {
  if (adminUnlocked) {
    openAdmin();
    return;
  }
  document.getElementById('pw-gate').classList.add('open');
  setTimeout(() => document.getElementById('pw-input').focus(), 100);
}

function checkPassword() {
  const input = document.getElementById('pw-input');
  const val   = input.value;

  if (val === CONFIG.admin_password) {
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

/* Close gate on Escape */
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

/* ── Pending submissions ────────────────────────────────── */
function renderPending() {
  const pending    = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  const list       = document.getElementById('pending-list');
  const countBadge = document.getElementById('pending-count');

  countBadge.textContent = pending.length;

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

/* ── Live tiles ─────────────────────────────────────────── */
function renderLive() {
  const tiles      = document.querySelectorAll('#grid .tile');
  const list       = document.getElementById('live-list');
  const countBadge = document.getElementById('live-count');

  countBadge.textContent = tiles.length;

  if (tiles.length === 0) {
    list.innerHTML = '<div class="admin-empty">No live tiles yet.</div>';
    return;
  }

  const accentColors = ['navy', 'sky', 'gold', 'gray'];

  list.innerHTML = [...tiles].map((tile, i) => {
    const title    = tile.querySelector('h3')?.textContent || 'Untitled';
    const type     = tile.querySelector('.tile-type')?.textContent?.trim() || '';
    const author   = tile.querySelector('.author-name')?.textContent || 'Anonymous';
    const date     = tile.querySelector('.tile-date')?.textContent || '';
    const color    = `var(--${accentColors[i % accentColors.length]})`;
    const id       = tile.dataset.id || '';

    return `
      <div class="live-card">
        <div class="live-card-accent" style="background:${color}"></div>
        <div class="live-card-info">
          <div class="live-card-title">${title}</div>
          <div class="live-card-meta">${type} · ${author} · ${date}</div>
        </div>
        <button class="btn-delete-live" onclick="deleteLiveTileFromAdmin('${id}')">Delete</button>
      </div>`;
  }).join('');
}

/* ════════════════════════════════════════════════════════════
   APPROVE / REJECT
════════════════════════════════════════════════════════════ */
function approveTile(id) {
  const pending = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  const sub     = pending.find(p => p.id === id);
  if (!sub) return;

  /* Remove from pending */
  localStorage.setItem(KEY_PENDING, JSON.stringify(pending.filter(p => p.id !== id)));

  /* Build and append the new tile */
  const accentOptions = ['navy', 'sky', 'gold', 'gray'];
  const accentCls     = accentOptions[document.querySelectorAll('#grid .tile').length % 4];
  const date          = new Date(sub.submittedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const tagsHtml = sub.tags.map(t => `<span class="ttag c1">${t}</span>`).join('');

  const article         = document.createElement('article');
  article.className     = 'tile';
  article.dataset.id    = sub.id;
  article.dataset.tags  = sub.tags.join(',');
  article.style.animation = 'fadeUp 0.45s ease forwards';

  article.innerHTML = `
    <button class="admin-delete" onclick="deleteLiveTile(this)" title="Delete tile" aria-label="Delete tile">✕</button>
    <div class="tile-accent ${accentCls}"></div>
    <div class="tile-body">
      <div class="tile-meta">
        <span class="tile-type txt-type">${sub.type} tile</span>
        <span class="tile-date">${date}</span>
      </div>
      <h3>${sub.title}</h3>
      <p class="tile-desc">${sub.story}</p>
      <div class="tile-author">
        <div class="avatar navy" aria-hidden="true">${sub.authorName.charAt(0).toUpperCase()}</div>
        <span class="author-name">${sub.authorName}</span>
      </div>
      ${tagsHtml ? `<div class="tile-tags">${tagsHtml}</div>` : ''}
    </div>`;

  document.getElementById('grid').appendChild(article);

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
   DELETE LIVE TILES
════════════════════════════════════════════════════════════ */

/* Called from admin panel list row */
function deleteLiveTileFromAdmin(id) {
  if (!confirm('Permanently delete this live tile from the board?')) return;
  const tile = document.querySelector(`[data-id="${id}"]`);
  if (tile) {
    tile.style.transition = 'opacity .2s, transform .2s';
    tile.style.opacity    = '0';
    tile.style.transform  = 'scale(0.96)';
    setTimeout(() => {
      tile.remove();
      updateLiveCount();
      renderLive();
    }, 200);
  }
  toast('Tile deleted.', '');
}

/* Called from the ✕ button on the tile itself (admin mode) */
function deleteLiveTile(btn) {
  if (!adminUnlocked) return;
  if (!confirm('Permanently delete this tile from the board?')) return;
  const tile = btn.closest('.tile');
  tile.style.transition = 'opacity .2s, transform .2s';
  tile.style.opacity    = '0';
  tile.style.transform  = 'scale(0.96)';
  setTimeout(() => {
    tile.remove();
    updateLiveCount();
    renderLive();
  }, 200);
  toast('Tile deleted.', '');
}
