/* ============================================================
   app.js — filtering, submit modal, form logic
   Depends on: config.js (loaded first in index.html)
   ============================================================ */

emailjs.init({ publicKey: CONFIG.emailjs_public_key });

const KEY_PENDING    = 'dmc_pending';
const KEY_LIVE_TILES = 'dmc_live_tiles';

let currentStep  = 1;
let selectedType = 'text';
let selectedFile = null;

/* ════════════════════════════════════════════════════════════
   ON PAGE LOAD — restore saved tiles from localStorage
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
  saved.forEach(tile => renderTileToGrid(tile, false));
  updateLiveCount();
  updatePendingBadge();
});

/* ════════════════════════════════════════════════════════════
   FILTERING
════════════════════════════════════════════════════════════ */
function filter(btn, tag) {
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#grid .tile').forEach(tile => {
    const tags = tile.dataset.tags || '';
    tile.style.display = (tag === 'all' || tags.includes(tag)) ? '' : 'none';
  });
}

/* ════════════════════════════════════════════════════════════
   MODAL — OPEN / CLOSE / RESET
════════════════════════════════════════════════════════════ */
function openModal() {
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  resetModal();
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

function bgClick(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

function resetModal() {
  goStep(1, true);
  ['f-title', 'f-story', 'f-name', 'f-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('title-count').textContent = '0 / 80';
  document.getElementById('story-count').textContent = '0 / 600';
  document.querySelectorAll('.tsel').forEach(t => t.classList.remove('on', 'disabled'));
  document.querySelectorAll('.type-opt').forEach(t => t.classList.remove('selected'));
  document.querySelector('.type-opt').classList.add('selected');
  selectedType = 'text';
  selectedFile = null;
  document.getElementById('file-preview').classList.remove('show');
  document.getElementById('file-input').value = '';
  document.getElementById('success-screen').classList.remove('show');
  document.getElementById('steps').style.display = '';
  document.getElementById('modal-title').textContent = 'Add a Tile';
  document.getElementById('submit-btn').classList.remove('loading');
  clearErrors();
}

/* ════════════════════════════════════════════════════════════
   STEPS
════════════════════════════════════════════════════════════ */
function goStep(n, silent) {
  if (!silent && n > currentStep && !validateStep(currentStep)) return;
  currentStep = n;

  [1, 2, 3, 4].forEach(i => {
    const panel = document.getElementById('step' + i);
    if (panel) panel.style.display = (i === n) ? '' : 'none';

    const s = document.getElementById('s' + i);
    if (!s) return;
    s.classList.remove('active', 'done');
    if (i < n) s.classList.add('done');
    if (i === n) s.classList.add('active');
    s.querySelector('.step-num').innerHTML = (i < n)
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
      : i;
  });

  if (n === 4) renderPreview();
  document.getElementById('modal-scroll').scrollTop = 0;
  updateUploadUI();
}

/* ════════════════════════════════════════════════════════════
   STEP 4 — PREVIEW CARD
════════════════════════════════════════════════════════════ */
function renderPreview() {
  const title      = document.getElementById('f-title').value.trim();
  const story      = document.getElementById('f-story').value.trim();
  const authorName = document.getElementById('f-name').value.trim() || 'Anonymous';
  const link       = document.getElementById('f-link').value.trim();
  const tags       = [...document.querySelectorAll('.tsel.on')].map(t => t.textContent.trim());
  const date       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const accentColors = ['navy', 'sky', 'gold', 'gray'];
  const accentCls  = accentColors[document.querySelectorAll('#grid .tile').length % 4];
  const tagsHtml   = tags.map(t => `<span class="ttag c1">${t}</span>`).join('');
  const initial    = authorName.charAt(0).toUpperCase();
  const linkHtml   = buildLinkHtml(link);

  let mediaHtml = '';
  if (selectedFile && selectedFile.type.startsWith('image/')) {
    mediaHtml = `<img src="${URL.createObjectURL(selectedFile)}" alt="Preview"
      style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;" />`;
  } else if (selectedFile && selectedFile.type.startsWith('audio/')) {
    mediaHtml = `
      <div style="background:var(--navy);padding:16px 18px;display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--gold);
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1c22"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
        <span style="font-size:.78rem;color:rgba(255,255,255,.7);">${selectedFile.name}</span>
      </div>`;
  } else if (selectedFile && selectedFile.type.startsWith('video/')) {
    mediaHtml = `
      <div style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
        <video src="${URL.createObjectURL(selectedFile)}"
               style="width:100%;height:100%;object-fit:cover;" muted></video>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                    background:rgba(11,78,162,.3);">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,196,37,.9);
                      display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1c22"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      </div>`;
  }

  document.getElementById('tile-preview-card').innerHTML = `
    <div class="tile-accent ${accentCls}"></div>
    ${mediaHtml}
    <div class="tile-body">
      <div class="tile-meta">
        <span class="tile-type txt-type">${selectedType} tile</span>
        <span class="tile-date">${date}</span>
      </div>
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;
                 color:var(--navy);margin-bottom:7px;">${title}</h3>
      <p class="tile-desc">${story}</p>
      <div class="tile-author">
        <div class="avatar navy">${initial}</div>
        <span class="author-name">${authorName}</span>
      </div>
      ${tagsHtml ? `<div class="tile-tags" style="margin-top:8px;">${tagsHtml}</div>` : ''}
      ${linkHtml}
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   TILE TYPE SELECTOR
════════════════════════════════════════════════════════════ */
function selectType(el, type) {
  document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedType = type;
  updateUploadUI();
}

function updateUploadUI() {
  const uploadGroup   = document.getElementById('upload-group');
  const fileInput     = document.getElementById('file-input');
  const acceptedTypes = document.getElementById('accepted-types');

  if (selectedType === 'text') { uploadGroup.style.display = 'none'; return; }
  uploadGroup.style.display = '';

  const typeMap = {
    image:   { accept: 'image/*', label: 'JPEG, PNG, GIF, WebP — up to 100 MB' },
    artwork: { accept: 'image/*', label: 'JPEG, PNG, GIF, WebP — up to 100 MB' },
    audio:   { accept: 'audio/*', label: 'MP3, WAV, OGG, AAC — up to 100 MB' },
    video:   { accept: 'video/*', label: 'MP4, WebM, MOV — up to 100 MB' },
  };
  const cfg = typeMap[selectedType];
  if (cfg) { fileInput.accept = cfg.accept; acceptedTypes.textContent = cfg.label; }
}

/* ════════════════════════════════════════════════════════════
   FILE UPLOAD
════════════════════════════════════════════════════════════ */
function handleFile(file) {
  if (!file) return;
  selectedFile = file;

  const preview = document.getElementById('file-preview');
  const thumb   = document.getElementById('preview-thumb');
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-size').textContent = formatBytes(file.size);
  thumb.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file); img.alt = 'Preview';
    thumb.appendChild(img);
  } else {
    thumb.innerHTML = `
      <div style="width:48px;height:48px;background:var(--navy);border-radius:8px;
                  display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
          <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2"/>
        </svg>
      </div>`;
  }
  preview.classList.add('show');
}

function removeFile() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-preview').classList.remove('show');
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file) { document.getElementById('file-input').files = e.dataTransfer.files; handleFile(file); }
});

/* ════════════════════════════════════════════════════════════
   TAGS
════════════════════════════════════════════════════════════ */
function toggleTag(el) {
  if (el.classList.contains('disabled')) return;
  el.classList.toggle('on');
  const n = document.querySelectorAll('.tsel.on').length;
  document.querySelectorAll('.tsel:not(.on)').forEach(t => t.classList.toggle('disabled', n >= 4));
}

/* ════════════════════════════════════════════════════════════
   VALIDATION
════════════════════════════════════════════════════════════ */
function validateStep(n) {
  clearErrors();
  if (n === 1 && !document.getElementById('f-title').value.trim()) {
    showError('f-title', 'err-title'); return false;
  }
  if (n === 3 && !document.getElementById('f-story').value.trim()) {
    showError('f-story', 'err-story'); return false;
  }
  if (n === 3) {
    const link = document.getElementById('f-link').value.trim();
    if (link && !isValidUrl(link)) {
      showError('f-link', 'err-link'); return false;
    }
  }
  return true;
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
}

function validateLinkInput(el) {
  const val = el.value.trim();
  el.classList.remove('error');
  document.getElementById('err-link').classList.remove('show');
  if (val && !isValidUrl(val)) el.classList.add('error');
}

function showError(inputId, errId) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(errId).classList.add('show');
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
}

function countChars(el, countId, max) {
  document.getElementById(countId).textContent = el.value.length + ' / ' + max;
  el.classList.remove('error');
}

/* ════════════════════════════════════════════════════════════
   LINK HELPER — builds the tile link button HTML
════════════════════════════════════════════════════════════ */
function buildLinkHtml(link) {
  if (!link) return '';
  let displayUrl;
  try {
    const u = new URL(link);
    displayUrl = u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : '');
    if (displayUrl.length > 40) displayUrl = displayUrl.slice(0, 38) + '…';
  } catch { displayUrl = link; }

  return `
    <a href="${link}" target="_blank" rel="noopener noreferrer" class="tile-link">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" aria-hidden="true">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
      ${displayUrl}
    </a>`;
}

/* ════════════════════════════════════════════════════════════
   SUBMIT — triggered by "Post to Wall" on step 4
════════════════════════════════════════════════════════════ */
async function submitTile() {
  const btn        = document.getElementById('submit-btn');
  const title      = document.getElementById('f-title').value.trim();
  const story      = document.getElementById('f-story').value.trim();
  const authorName = document.getElementById('f-name').value.trim() || 'Anonymous';
  const link       = document.getElementById('f-link').value.trim();
  const tags       = [...document.querySelectorAll('.tsel.on')].map(t => t.textContent.trim());
  const now        = new Date();
  const dateStr    = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const id         = 'post-' + Date.now();

  const accentColors = ['navy', 'sky', 'gold', 'gray'];
  const accentCls    = accentColors[document.querySelectorAll('#grid .tile').length % 4];

  const tileData = { id, title, type: selectedType, story, authorName, link, tags, date: dateStr, accentCls };

  btn.classList.add('loading');

  /* Save to localStorage */
  const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
  saved.unshift(tileData);
  localStorage.setItem(KEY_LIVE_TILES, JSON.stringify(saved));

  /* Render to wall */
  renderTileToGrid(tileData, true);

  /* Optional email notification */
  try {
    await emailjs.send(CONFIG.emailjs_service_id, CONFIG.emailjs_template_id, {
      to_email:      CONFIG.admin_email,
      submission_id: id,
      tile_title:    title,
      tile_type:     selectedType,
      tile_story:    story,
      tile_author:   authorName,
      tile_tags:     tags.join(', ') || 'None',
      tile_link:     link || 'None',
      submitted_at:  dateStr,
      admin_url:     window.location.href.split('#')[0],
    });
  } catch (err) {
    console.warn('EmailJS: not configured or send failed.', err);
  }

  btn.classList.remove('loading');

  /* Show success */
  [1, 2, 3, 4].forEach(i => { const p = document.getElementById('step' + i); if (p) p.style.display = 'none'; });
  document.getElementById('steps').style.display     = 'none';
  document.getElementById('modal-title').textContent = '🎉 Posted!';
  document.getElementById('success-meta').innerHTML  = `
    <div class="row"><span>Title</span><span>${title}</span></div>
    <div class="row"><span>Type</span><span>${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</span></div>
    ${tags.length ? `<div class="row"><span>Themes</span><span>${tags.join(', ')}</span></div>` : ''}
    ${link ? `<div class="row"><span>Link</span><span><a href="${link}" target="_blank" rel="noopener noreferrer" style="color:var(--sky);">View →</a></span></div>` : ''}
    <div class="row"><span>Posted by</span><span>${authorName}</span></div>
    <div class="row"><span>Date</span><span>${dateStr}</span></div>
  `;
  document.querySelector('.success-screen h3').textContent = 'Your tile is live!';
  document.querySelector('.success-screen > p').textContent =
    'Your tile has been added to The Digital Mosaic Collective. Thank you for contributing.';
  document.getElementById('success-screen').classList.add('show');
}

/* ════════════════════════════════════════════════════════════
   RENDER TILE TO GRID
   Called on submit (prepend=true) and on page reload (prepend=false)
════════════════════════════════════════════════════════════ */
function renderTileToGrid(data, prepend = true) {
  const { id, title, type, story, authorName, link, tags, date, accentCls } = data;
  const tagsHtml = (tags || []).map(t => `<span class="ttag c1">${t}</span>`).join('');
  const initial  = (authorName || 'A').charAt(0).toUpperCase();
  const accent   = accentCls || 'navy';
  const linkHtml = buildLinkHtml(link || '');

  const article        = document.createElement('article');
  article.className    = 'tile';
  article.dataset.id   = id;
  article.dataset.tags = (tags || []).join(',');
  if (prepend) article.style.animation = 'fadeUp 0.45s ease forwards';

  article.innerHTML = `
    <button class="admin-delete" onclick="deleteLiveTile(this)"
            title="Delete tile" aria-label="Delete tile">✕</button>
    <div class="tile-accent ${accent}"></div>
    <div class="tile-body">
      <div class="tile-meta">
        <span class="tile-type txt-type">${type} tile</span>
        <span class="tile-date">${date}</span>
      </div>
      <h3>${title}</h3>
      <p class="tile-desc">${story}</p>
      <div class="tile-author">
        <div class="avatar navy" aria-hidden="true">${initial}</div>
        <span class="author-name">${authorName}</span>
      </div>
      ${tagsHtml ? `<div class="tile-tags">${tagsHtml}</div>` : ''}
      ${linkHtml}
    </div>`;

  const grid = document.getElementById('grid');
  if (prepend) grid.insertBefore(article, grid.firstChild);
  else grid.appendChild(article);
}

/* ════════════════════════════════════════════════════════════
   AUDIO PLAY TOGGLE
════════════════════════════════════════════════════════════ */
function togglePlay(btn) {
  const svg = btn.querySelector('svg');
  const playing = btn.dataset.playing === '1';
  svg.innerHTML = playing
    ? '<polygon points="5,3 19,12 5,21"/>'
    : '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  btn.dataset.playing = playing ? '0' : '1';
}

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
function updatePendingBadge() {
  const el = document.getElementById('stat-pending');
  if (el) el.textContent = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]').length;
}

function updateLiveCount() {
  const el = document.getElementById('stat-live');
  if (el) el.textContent = document.querySelectorAll('#grid .tile').length;
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast ' + (type || '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
