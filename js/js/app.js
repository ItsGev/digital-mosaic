/* ============================================================
   app.js — Digital Mosaic Collective
   ============================================================ */

emailjs.init({ publicKey: CONFIG.emailjs_public_key });

const KEY_PENDING    = 'dmc_pending';
const KEY_LIVE_TILES = 'dmc_live_tiles';

let currentStep  = 1;
let selectedType = 'text';
let selectedFile = null;

/* ── Restore saved tiles on page load ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
    saved.forEach(t => renderTileToGrid(t, false));
  } catch(e) { console.warn('Tile restore error:', e); }
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
   MODAL OPEN / CLOSE / RESET
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
  showStep(1);
  ['f-title','f-story','f-name','f-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const tc = document.getElementById('title-count');
  const sc = document.getElementById('story-count');
  if (tc) tc.textContent = '0 / 80';
  if (sc) sc.textContent = '0 / 600';
  document.querySelectorAll('.tsel').forEach(t => t.classList.remove('on','disabled'));
  document.querySelectorAll('.type-opt').forEach(t => t.classList.remove('selected'));
  const first = document.querySelector('.type-opt');
  if (first) first.classList.add('selected');
  selectedType = 'text';
  selectedFile = null;
  const fp = document.getElementById('file-preview');
  const fi = document.getElementById('file-input');
  if (fp) fp.classList.remove('show');
  if (fi) fi.value = '';
  const ss = document.getElementById('success-screen');
  if (ss) ss.classList.remove('show');
  const steps = document.getElementById('steps');
  if (steps) steps.style.display = '';
  const mt = document.getElementById('modal-title');
  if (mt) mt.textContent = 'Add a Tile';
  const sb = document.getElementById('submit-btn');
  if (sb) sb.classList.remove('loading');
  clearErrors();
  updateUploadUI();
}

/* ════════════════════════════════════════════════════════════
   STEP NAVIGATION
   showStep()  — directly show any step panel, no validation
   goStep()    — validate current step before advancing
════════════════════════════════════════════════════════════ */
function showStep(n) {
  currentStep = n;
  [1,2,3,4].forEach(i => {
    const panel = document.getElementById('step' + i);
    if (panel) panel.style.display = (i === n) ? '' : 'none';
    const s = document.getElementById('s' + i);
    if (!s) return;
    s.classList.remove('active','done');
    if (i < n) s.classList.add('done');
    if (i === n) s.classList.add('active');
    const numEl = s.querySelector('.step-num');
    if (numEl) {
      numEl.innerHTML = (i < n)
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
        : i;
    }
  });
  const scroll = document.getElementById('modal-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function goStep(n) {
  /* Validate current step before moving forward */
  if (n > currentStep && !validateStep(currentStep)) return;
  showStep(n);
  if (n !== 4) updateUploadUI();
}

/* ── Called by the Preview button — skips validation entirely */
function showPreview() {
  showStep(4);
  renderPreview();
}

/* ════════════════════════════════════════════════════════════
   STEP 4 — RENDER PREVIEW CARD
════════════════════════════════════════════════════════════ */
function renderPreview() {
  const card = document.getElementById('tile-preview-card');
  if (!card) { console.error('tile-preview-card not found'); return; }

  try {
    const title      = (document.getElementById('f-title')?.value  || '').trim() || 'Untitled';
    const story      = (document.getElementById('f-story')?.value  || '').trim() || '';
    const authorName = (document.getElementById('f-name')?.value   || '').trim() || 'Anonymous';
    const link       = (document.getElementById('f-link')?.value   || '').trim() || '';
    const tags       = [...document.querySelectorAll('.tsel.on')].map(t => t.textContent.trim());
    const date       = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    const accents    = ['navy','sky','gold','gray'];
    const accentCls  = accents[document.querySelectorAll('#grid .tile').length % 4];
    const tagsHtml   = tags.map(t => `<span class="ttag c1">${t}</span>`).join('');
    const initial    = authorName.charAt(0).toUpperCase();

    /* Build media block if file uploaded */
    let mediaHtml = '';
    if (selectedFile) {
      try {
        const url = URL.createObjectURL(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
          mediaHtml = `<img src="${url}" alt="Upload preview"
            style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;">`;
        } else if (selectedFile.type.startsWith('audio/')) {
          mediaHtml = `
            <div style="background:var(--navy);padding:16px 18px;
                        display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--gold);
                          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1c22">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </div>
              <span style="font-size:.78rem;color:rgba(255,255,255,.8);
                           overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${selectedFile.name}
              </span>
            </div>`;
        } else if (selectedFile.type.startsWith('video/')) {
          mediaHtml = `
            <div style="position:relative;aspect-ratio:16/9;overflow:hidden;background:#000;">
              <video src="${url}" style="width:100%;height:100%;object-fit:cover;"
                     muted playsinline></video>
              <div style="position:absolute;inset:0;display:flex;align-items:center;
                          justify-content:center;background:rgba(11,78,162,.3);">
                <div style="width:44px;height:44px;border-radius:50%;
                            background:rgba(255,196,37,.9);
                            display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1c22">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              </div>
            </div>`;
        }
      } catch(me) { console.warn('Media preview error:', me); }
    }

    card.innerHTML = `
      <div class="tile-accent ${accentCls}"></div>
      ${mediaHtml}
      <div class="tile-body">
        <div class="tile-meta">
          <span class="tile-type txt-type">${selectedType} tile</span>
          <span class="tile-date">${date}</span>
        </div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;
                   color:var(--navy);line-height:1.25;margin-bottom:7px;">${title}</h3>
        ${story ? `<p class="tile-desc">${story}</p>` : ''}
        <div class="tile-author"
             style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--navy);
                      display:flex;align-items:center;justify-content:center;
                      font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;">
            ${initial}
          </div>
          <span style="font-size:.78rem;font-weight:500;">${authorName}</span>
        </div>
        ${tagsHtml ? `<div class="tile-tags"
          style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">
          ${tagsHtml}</div>` : ''}
        ${buildLinkHtml(link)}
      </div>`;

  } catch(e) {
    console.error('renderPreview error:', e);
    card.innerHTML = `
      <div style="padding:24px;text-align:center;color:var(--gray);font-size:.88rem;">
        <p>Preview could not load, but your tile will post correctly.</p>
      </div>`;
  }
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
  const ug = document.getElementById('upload-group');
  const fi = document.getElementById('file-input');
  const at = document.getElementById('accepted-types');
  if (!ug) return;
  if (selectedType === 'text') { ug.style.display = 'none'; return; }
  ug.style.display = '';
  const map = {
    image:   { accept:'image/*', label:'JPEG, PNG, GIF, WebP — up to 100 MB' },
    artwork: { accept:'image/*', label:'JPEG, PNG, GIF, WebP — up to 100 MB' },
    audio:   { accept:'audio/*', label:'MP3, WAV, OGG, AAC — up to 100 MB'  },
    video:   { accept:'video/*', label:'MP4, WebM, MOV — up to 100 MB'       },
  };
  const cfg = map[selectedType];
  if (cfg && fi) fi.accept          = cfg.accept;
  if (cfg && at) at.textContent     = cfg.label;
}

/* ════════════════════════════════════════════════════════════
   FILE UPLOAD
════════════════════════════════════════════════════════════ */
function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  const preview = document.getElementById('file-preview');
  const thumb   = document.getElementById('preview-thumb');
  const nameEl  = document.getElementById('preview-name');
  const sizeEl  = document.getElementById('preview-size');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatBytes(file.size);
  if (thumb)  thumb.innerHTML    = '';
  if (thumb && file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file); img.alt = 'Preview';
    thumb.appendChild(img);
  } else if (thumb) {
    thumb.innerHTML = `
      <div style="width:48px;height:48px;background:var(--navy);border-radius:8px;
                  display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="white" stroke-width="1.8">
          <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2"/>
        </svg>
      </div>`;
  }
  if (preview) preview.classList.add('show');
}

function removeFile() {
  selectedFile = null;
  const fi = document.getElementById('file-input');
  const fp = document.getElementById('file-preview');
  if (fi) fi.value = '';
  if (fp) fp.classList.remove('show');
}

function formatBytes(b) {
  if (b < 1024)    return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

/* Drag & drop */
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('drop-zone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) { document.getElementById('file-input').files = e.dataTransfer.files; handleFile(file); }
  });
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
   VALIDATION  (steps 1 and 3 only; step 2 and 4 are free)
════════════════════════════════════════════════════════════ */
function validateStep(n) {
  clearErrors();
  if (n === 1) {
    if (!(document.getElementById('f-title')?.value || '').trim()) {
      showError('f-title','err-title'); return false;
    }
  }
  if (n === 3) {
    if (!(document.getElementById('f-story')?.value || '').trim()) {
      showError('f-story','err-story'); return false;
    }
    const link = (document.getElementById('f-link')?.value || '').trim();
    if (link && !isValidUrl(link)) { showError('f-link','err-link'); return false; }
  }
  return true;
}

function isValidUrl(s) {
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:'; }
  catch { return false; }
}

function validateLinkInput(el) {
  const v = el.value.trim();
  el.classList.remove('error');
  const e = document.getElementById('err-link');
  if (e) e.classList.remove('show');
  if (v && !isValidUrl(v)) el.classList.add('error');
}

function showError(inputId, errId) {
  document.getElementById(inputId)?.classList.add('error');
  document.getElementById(errId)?.classList.add('show');
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
}

function countChars(el, countId, max) {
  const c = document.getElementById(countId);
  if (c) c.textContent = el.value.length + ' / ' + max;
  el.classList.remove('error');
}

/* ════════════════════════════════════════════════════════════
   LINK HELPER
════════════════════════════════════════════════════════════ */
function buildLinkHtml(link) {
  if (!link) return '';
  let display = link;
  try {
    const u  = new URL(link);
    display  = u.hostname.replace('www.','') + (u.pathname !== '/' ? u.pathname : '');
    if (display.length > 42) display = display.slice(0,40) + '…';
  } catch { /* use raw */ }
  return `
    <a href="${link}" target="_blank" rel="noopener noreferrer" class="tile-link">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
      ${display}
    </a>`;
}

/* ════════════════════════════════════════════════════════════
   SUBMIT — fires from step 4 "Submit for Review" button
════════════════════════════════════════════════════════════ */
async function submitTile() {
  const btn        = document.getElementById('submit-btn');
  const title      = (document.getElementById('f-title')?.value  || '').trim();
  const story      = (document.getElementById('f-story')?.value  || '').trim();
  const authorName = (document.getElementById('f-name')?.value   || '').trim() || 'Anonymous';
  const link       = (document.getElementById('f-link')?.value   || '').trim();
  const tags       = [...document.querySelectorAll('.tsel.on')].map(t => t.textContent.trim());
  const dateStr    = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const id         = 'post-' + Date.now();
  const accents    = ['navy','sky','gold','gray'];
  const accentCls  = accents[document.querySelectorAll('#grid .tile').length % 4];

  const tileData = { id, title, type:selectedType, story, authorName, link, tags, date:dateStr, accentCls };

  if (btn) btn.classList.add('loading');

  /* Save to localStorage */
  try {
    const saved = JSON.parse(localStorage.getItem(KEY_LIVE_TILES) || '[]');
    saved.unshift(tileData);
    localStorage.setItem(KEY_LIVE_TILES, JSON.stringify(saved));
  } catch(e) { console.warn('localStorage error:', e); }

  /* Post to wall */
  renderTileToGrid(tileData, true);

  /* Email notification */
  try {
    await emailjs.send(CONFIG.emailjs_service_id, CONFIG.emailjs_template_id, {
      to_email:     CONFIG.admin_email,
      tile_title:   title,
      tile_type:    selectedType,
      tile_story:   story,
      tile_author:  authorName,
      tile_tags:    tags.join(', ') || 'None',
      tile_link:    link || 'None',
      submitted_at: dateStr,
    });
  } catch(e) { console.warn('EmailJS:', e); }

  if (btn) btn.classList.remove('loading');

  /* Success screen */
  [1,2,3,4].forEach(i => {
    const p = document.getElementById('step' + i);
    if (p) p.style.display = 'none';
  });
  const stepsEl = document.getElementById('steps');
  const titleEl = document.getElementById('modal-title');
  const metaEl  = document.getElementById('success-meta');
  const succEl  = document.getElementById('success-screen');
  if (stepsEl) stepsEl.style.display = 'none';
  if (titleEl) titleEl.textContent = 'Posted!';
  if (metaEl) metaEl.innerHTML = `
    <div class="row"><span>Title</span><span>${title}</span></div>
    <div class="row"><span>Type</span><span>${selectedType.charAt(0).toUpperCase()+selectedType.slice(1)}</span></div>
    ${tags.length ? `<div class="row"><span>Themes</span><span>${tags.join(', ')}</span></div>` : ''}
    ${link ? `<div class="row"><span>Link</span><span><a href="${link}" target="_blank" rel="noopener noreferrer" style="color:var(--sky)">View</a></span></div>` : ''}
    <div class="row"><span>Posted by</span><span>${authorName}</span></div>
    <div class="row"><span>Date</span><span>${dateStr}</span></div>`;
  const h3   = succEl?.querySelector('h3');
  const desc = succEl?.querySelector('p');
  if (h3)   h3.textContent   = 'Your tile is live!';
  if (desc) desc.textContent = 'Your tile has been added to The Digital Mosaic Collective. Thank you for contributing.';
  if (succEl) succEl.classList.add('show');
}

/* ════════════════════════════════════════════════════════════
   RENDER TILE TO GRID
════════════════════════════════════════════════════════════ */
function renderTileToGrid(data, prepend = true) {
  const { id, title, type, story, authorName, link, tags, date, accentCls } = data;
  const tagsHtml = (tags||[]).map(t => `<span class="ttag c1">${t}</span>`).join('');
  const initial  = (authorName||'A').charAt(0).toUpperCase();
  const accent   = accentCls || 'navy';

  const article        = document.createElement('article');
  article.className    = 'tile';
  article.dataset.id   = id;
  article.dataset.tags = (tags||[]).join(',');
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
      ${buildLinkHtml(link||'')}
    </div>`;

  const grid = document.getElementById('grid');
  if (!grid) return;
  if (prepend) grid.insertBefore(article, grid.firstChild);
  else grid.appendChild(article);
}

/* ════════════════════════════════════════════════════════════
   AUDIO TOGGLE
════════════════════════════════════════════════════════════ */
function togglePlay(btn) {
  const svg     = btn.querySelector('svg');
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
  if (el) el.textContent = JSON.parse(localStorage.getItem(KEY_PENDING)||'[]').length;
}

function updateLiveCount() {
  const el = document.getElementById('stat-live');
  if (el) el.textContent = document.querySelectorAll('#grid .tile').length;
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'toast ' + (type||'');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
