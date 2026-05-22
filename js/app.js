/* ============================================================
   app.js — filtering, submit modal, form logic
   Depends on: config.js (loaded first in index.html)
   ============================================================ */

/* ── Init EmailJS ─────────────────────────────────────────── */
emailjs.init({ publicKey: CONFIG.emailjs_public_key });

/* ── localStorage keys ────────────────────────────────────── */
const KEY_PENDING = 'dmc_pending';

/* ── State ────────────────────────────────────────────────── */
let currentStep  = 1;
let selectedType = 'text';
let selectedFile = null;

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
   MODAL — OPEN / CLOSE
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
  ['f-title', 'f-story', 'f-name'].forEach(id => {
    document.getElementById(id).value = '';
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
  document.getElementById('modal-title').textContent = 'Add Your Tile';
  document.getElementById('submit-btn').classList.remove('loading');
  clearErrors();
}

/* ════════════════════════════════════════════════════════════
   MODAL — STEPS
════════════════════════════════════════════════════════════ */
function goStep(n, silent) {
  if (!silent && n > currentStep && !validateStep(currentStep)) return;
  currentStep = n;

  [1, 2, 3].forEach(i => {
    document.getElementById('step' + i).style.display = (i === n) ? '' : 'none';
    const s = document.getElementById('s' + i);
    s.classList.remove('active', 'done');
    if (i < n) s.classList.add('done');
    if (i === n) s.classList.add('active');
    s.querySelector('.step-num').innerHTML = (i < n)
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
      : i;
  });

  document.getElementById('modal-scroll').scrollTop = 0;
  updateUploadUI();
}

/* ════════════════════════════════════════════════════════════
   MODAL — TILE TYPE
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

  if (selectedType === 'text') {
    uploadGroup.style.display = 'none';
    return;
  }

  uploadGroup.style.display = '';

  const typeMap = {
    image:   { accept: 'image/*',         label: 'JPEG, PNG, GIF, WebP — up to 100 MB' },
    artwork: { accept: 'image/*',         label: 'JPEG, PNG, GIF, WebP — up to 100 MB' },
    audio:   { accept: 'audio/*',         label: 'MP3, WAV, OGG, AAC — up to 100 MB' },
    video:   { accept: 'video/*',         label: 'MP4, WebM, MOV — up to 100 MB' },
  };

  const config = typeMap[selectedType];
  if (config) {
    fileInput.accept      = config.accept;
    acceptedTypes.textContent = config.label;
  }
}

/* ════════════════════════════════════════════════════════════
   MODAL — FILE UPLOAD
════════════════════════════════════════════════════════════ */
function handleFile(file) {
  if (!file) return;
  selectedFile = file;

  const preview  = document.getElementById('file-preview');
  const thumb    = document.getElementById('preview-thumb');
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-size').textContent = formatBytes(file.size);

  thumb.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Preview';
    thumb.appendChild(img);
  } else {
    thumb.innerHTML = `
      <div style="width:48px;height:48px;background:var(--navy);border-radius:8px;
                  display:flex;align-items:center;justify-content:center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="white" stroke-width="1.8">
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

function formatBytes(bytes) {
  if (bytes < 1024)         return bytes + ' B';
  if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* Drag & drop */
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file) {
    document.getElementById('file-input').files = e.dataTransfer.files;
    handleFile(file);
  }
});

/* ════════════════════════════════════════════════════════════
   MODAL — TAGS
════════════════════════════════════════════════════════════ */
function toggleTag(el) {
  if (el.classList.contains('disabled')) return;
  el.classList.toggle('on');
  const activeCount = document.querySelectorAll('.tsel.on').length;
  document.querySelectorAll('.tsel:not(.on)').forEach(t => {
    t.classList.toggle('disabled', activeCount >= 4);
  });
}

/* ════════════════════════════════════════════════════════════
   MODAL — VALIDATION
════════════════════════════════════════════════════════════ */
function validateStep(n) {
  clearErrors();
  if (n === 1 && !document.getElementById('f-title').value.trim()) {
    showError('f-title', 'err-title');
    return false;
  }
  if (n === 3 && !document.getElementById('f-story').value.trim()) {
    showError('f-story', 'err-story');
    return false;
  }
  return true;
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
   MODAL — SUBMIT
════════════════════════════════════════════════════════════ */
async function submitTile() {
  if (!validateStep(3)) return;

  const btn        = document.getElementById('submit-btn');
  const title      = document.getElementById('f-title').value.trim();
  const story      = document.getElementById('f-story').value.trim();
  const authorName = document.getElementById('f-name').value.trim() || 'Anonymous';
  const tags       = [...document.querySelectorAll('.tsel.on')].map(t => t.textContent.trim());
  const now        = new Date();
  const dateStr    = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const id         = 'sub-' + Date.now();

  btn.classList.add('loading');

  /* Save to localStorage pending queue */
  const pending = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  pending.unshift({
    id,
    title,
    type:        selectedType,
    story,
    authorName,
    tags,
    submittedAt: now.toISOString(),
  });
  localStorage.setItem(KEY_PENDING, JSON.stringify(pending));
  updatePendingBadge();

  /* Send email notification via EmailJS */
  try {
    await emailjs.send(CONFIG.emailjs_service_id, CONFIG.emailjs_template_id, {
      to_email:      CONFIG.admin_email,
      submission_id: id,
      tile_title:    title,
      tile_type:     selectedType,
      tile_story:    story,
      tile_author:   authorName,
      tile_tags:     tags.join(', ') || 'None',
      submitted_at:  dateStr,
      admin_url:     window.location.href.split('#')[0] + '#admin',
    });
  } catch (err) {
    /* Submission still saved locally even if email isn't configured yet */
    console.warn('EmailJS: not configured or send failed — submission saved locally.', err);
  }

  btn.classList.remove('loading');

  /* Show success screen */
  [1, 2, 3].forEach(i => document.getElementById('step' + i).style.display = 'none');
  document.getElementById('steps').style.display    = 'none';
  document.getElementById('modal-title').textContent = '🎉 Thank you!';
  document.getElementById('success-meta').innerHTML = `
    <div class="row"><span>Title</span><span>${title}</span></div>
    <div class="row"><span>Type</span><span>${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</span></div>
    ${tags.length ? `<div class="row"><span>Themes</span><span>${tags.join(', ')}</span></div>` : ''}
    <div class="row"><span>Submitted by</span><span>${authorName}</span></div>
    <div class="row"><span>Date</span><span>${dateStr}</span></div>
  `;
  document.getElementById('success-screen').classList.add('show');
}

/* ════════════════════════════════════════════════════════════
   AUDIO PLAY TOGGLE
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
   SHARED HELPERS
════════════════════════════════════════════════════════════ */
function updatePendingBadge() {
  const pending = JSON.parse(localStorage.getItem(KEY_PENDING) || '[]');
  const el = document.getElementById('stat-pending');
  if (el) el.textContent = pending.length;
}

function updateLiveCount() {
  const el = document.getElementById('stat-live');
  if (el) el.textContent = document.querySelectorAll('#grid .tile').length;
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent  = msg;
  t.className    = 'toast ' + (type || '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Init ─────────────────────────────────────────────────── */
updatePendingBadge();
updateLiveCount();
