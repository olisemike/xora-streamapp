const STREAM_SUBDOMAIN = 'https://customer-virwr1ukt49zj3yu.cloudflarestream.com';
const IMAGES_BASE = 'https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q';

// ============================================================
// AD CONFIGURATION
// Replace these with your actual ad image URLs and click URLs
// No SDK required — pure HTML banner + image ads
// ============================================================
const ADS = {
  // Top banner ad (728x90 leaderboard)
  topBanner: {
    imageUrl: '', // e.g. 'https://youradserver.com/banner.jpg'
    clickUrl: '',
    altText: 'Advertisement',
  },
  // Bottom banner ad
  bottomBanner: {
    imageUrl: '',
    clickUrl: '',
    altText: 'Advertisement',
  },
  // Grid ads — appear every N items in the grid
  gridInterval: 6, // Insert an ad every 6 media items
  gridAds: [
    {
      provider: 'hpf',
      key: 'a399b7cca2749f83337c7ee47284ef7a',
      width: 300,
      height: 250,
      altText: 'Advertisement',
    },
    { imageUrl: '', clickUrl: '', altText: 'Advertisement' },
  ],
};

let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  loadMedia(1);
  setupEventListeners();
  loadCategories();
  initBannerAds();
  setupFileDrop();
});

// ============================================================
// AD RENDERING
// ============================================================

function initBannerAds() {
  renderBannerAd('topBannerContent', ADS.topBanner);
  renderBannerAd('bottomBannerContent', ADS.bottomBanner);
}

function renderBannerAd(containerId, ad) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (ad.imageUrl) {
    container.innerHTML = `
      <a href="${ad.clickUrl || '#'}" target="_blank" rel="noopener" class="ad-card" onclick="trackAdClick('banner')">
        <img src="${ad.imageUrl}" alt="${ad.altText}">
      </a>`;
  } else {
    // Placeholder when no ad is configured
    container.innerHTML = `<div class="ad-placeholder">728 × 90 — Banner Ad Slot</div>`;
  }
}

function renderGridAd(adData) {
  if (adData && adData.provider === 'hpf' && adData.key) {
    const width = Number(adData.width) || 300;
    const height = Number(adData.height) || 250;
    return `<div class="grid-ad-slot" data-hpf-key="${adData.key}" data-hpf-width="${width}" data-hpf-height="${height}">
      <span class="ad-label">Ad</span>
      <div class="grid-ad-runtime"></div>
    </div>`;
  }

  if (adData && adData.imageUrl) {
    return `<div class="grid-ad-slot" onclick="trackAdClick('grid'); window.open('${adData.clickUrl}','_blank')">
      <span class="ad-label">Ad</span>
      <img src="${adData.imageUrl}" alt="${adData.altText}">
    </div>`;
  }
  return `<div class="grid-ad-slot">
    <span class="ad-label">Advertisement</span>
    <span style="font-size:12px;color:var(--text-muted)">Ad Slot</span>
  </div>`;
}

function hydrateGridScriptAds() {
  document.querySelectorAll('.grid-ad-slot[data-hpf-key]').forEach((slot) => {
    if (slot.dataset.initialized === '1') return;
    slot.dataset.initialized = '1';

    const key = slot.dataset.hpfKey;
    const width = Number(slot.dataset.hpfWidth) || 300;
    const height = Number(slot.dataset.hpfHeight) || 250;
    const mount = slot.querySelector('.grid-ad-runtime');
    if (!key || !mount) return;

    window.atOptions = { key, format: 'iframe', height, width, params: {} };
    const script = document.createElement('script');
    script.src = `https://www.highperformanceformat.com/${key}/invoke.js`;
    script.async = true;
    mount.appendChild(script);
  });
}

function trackAdClick(type) {
  // Hook into your analytics here if needed
  console.log('Ad clicked:', type);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.add('active');
  });

  document.getElementById('uploadClose').addEventListener('click', closeModal);

  document.getElementById('uploadModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });

  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await uploadMedia();
  });

  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query.length > 0) {
        currentSearch = query;
        currentCategory = '';
        searchMedia(query, 1);
      } else {
        currentSearch = '';
        loadMedia(1);
      }
    }, 300);
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) navigatePage(currentPage - 1);
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage < totalPages) navigatePage(currentPage + 1);
  });
}

function setupFileDrop() {
  const fileDrop = document.getElementById('fileDrop');
  const fileInput = document.getElementById('uploadFile');
  const fileText = document.getElementById('fileDropText');

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      fileText.textContent = fileInput.files[0].name;
      fileDrop.style.borderColor = 'var(--red-dim)';
    }
  });

  fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = 'var(--red)';
  });

  fileDrop.addEventListener('dragleave', () => {
    fileDrop.style.borderColor = '';
  });

  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileText.textContent = file.name;
      fileDrop.style.borderColor = 'var(--red-dim)';
    }
  });
}

function closeModal() {
  document.getElementById('uploadModal').classList.remove('active');
}

function navigatePage(page) {
  if (currentSearch) searchMedia(currentSearch, page);
  else if (currentCategory) loadCategoryMedia(currentCategory, page);
  else loadMedia(page);
}

// ============================================================
// API CALLS
// ============================================================

async function loadMedia(page) {
  showLoading(true);
  try {
    const response = await fetch('/api/media?page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading media:', error);
  } finally {
    showLoading(false);
  }
}

async function searchMedia(query, page) {
  showLoading(true);
  try {
    const response = await fetch('/api/search?q=' + encodeURIComponent(query) + '&page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error searching:', error);
  } finally {
    showLoading(false);
  }
}

async function loadCategoryMedia(category, page) {
  showLoading(true);
  try {
    const response = await fetch('/api/category?name=' + encodeURIComponent(category) + '&page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading category:', error);
  } finally {
    showLoading(false);
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    if (data.success && data.categories) {
      const container = document.getElementById('categoryFilter');
      container.innerHTML =
        '<button class="category-btn active" onclick="filterByCategory(event, \'\')">All</button>'
        + data.categories.map(cat =>
          `<button class="category-btn" onclick="filterByCategory(event, '${escapeHtml(cat.name)}')">${escapeHtml(cat.name)} <span style="opacity:0.5">${cat.count}</span></button>`
        ).join('');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// ============================================================
// RENDER
// ============================================================

function getThumbnailUrl(media) {
  if (media.type === 'image') {
    return `${IMAGES_BASE}/${media.cfId}/public`;
  }
  return `${STREAM_SUBDOMAIN}/${media.cfId}/thumbnails/thumbnail.jpg`;
}

function renderGrid(media) {
  const grid = document.getElementById('mediaGrid');
  if (!media || media.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted);font-size:15px;">No media found</div>';
    return;
  }

  const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' fill='rgba(255,255,255,0.2)' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'%3ENo Preview%3C/text%3E%3C/svg%3E";

  let html = '';
  let adIndex = 0;

  media.forEach((item, i) => {
    // Insert grid ad every N items
    if (i > 0 && i % ADS.gridInterval === 0) {
      const adData = ADS.gridAds[adIndex % ADS.gridAds.length];
      html += renderGridAd(adData);
      adIndex++;
    }

    const thumbUrl = item.cfId ? getThumbnailUrl(item) : '';
    html += `<div class="media-item" onclick="goToWatch('${item.id}')">
      <img
        src="${thumbUrl || fallback}"
        alt="${escapeHtml(item.title)}"
        loading="lazy"
        onerror="this.src='${fallback}'"
      >
      ${item.type === 'video' ? `<div class="play-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>` : ''}
      <div class="media-overlay">
        <h3 class="media-title">${escapeHtml(item.title)}</h3>
        <div class="media-badges">
          <span class="badge badge-type">${item.type}</span>
          <span class="badge badge-cat" onclick="filterByCategory(event, '${escapeHtml(item.category)}')">${escapeHtml(item.category)}</span>
        </div>
      </div>
    </div>`;
  });

  grid.innerHTML = html;
  hydrateGridScriptAds();
}

// ============================================================
// UTILITIES
// ============================================================

// eslint-disable-next-line no-unused-vars
function filterByCategory(event, category) {
  event.stopPropagation();
  currentCategory = category;
  currentSearch = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  if (category) loadCategoryMedia(category, 1);
  else loadMedia(1);
}

function updatePagination() {
  document.getElementById('pageNumber').textContent = currentPage;
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('prevBtn').disabled = currentPage <= 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

// eslint-disable-next-line no-unused-vars
function goToWatch(mediaId) {
  window.location.href = '/watch.html?id=' + mediaId;
}

function showLoading(visible) {
  document.getElementById('loadingIndicator').style.display = visible ? 'flex' : 'none';
}

async function uploadMedia() {
  const password = document.getElementById('adminPassword').value;
  const title = document.getElementById('uploadTitle').value;
  const description = document.getElementById('uploadDesc').value;
  const type = document.getElementById('uploadType').value;
  const category = document.getElementById('uploadCategory').value;
  const file = document.getElementById('uploadFile').files[0];

  if (!file) { showStatus('Please select a file', 'error'); return; }

  const submitBtn = document.querySelector('#uploadForm .btn-submit');
  submitBtn.disabled = true;
  showStatus('Uploading... this may take a moment for large videos', 'loading');

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('category', category);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'X-Admin-Key': password },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showStatus('Upload successful!', 'success');
      setTimeout(() => {
        document.getElementById('uploadForm').reset();
        document.getElementById('fileDropText').textContent = 'Drop file here or click to browse';
        document.getElementById('fileDrop').style.borderColor = '';
        closeModal();
        loadMedia(1);
        loadCategories();
      }, 1500);
    } else {
      showStatus(data.error || 'Upload failed', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function showStatus(message, type) {
  const status = document.getElementById('uploadStatus');
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/*
const STREAM_SUBDOMAIN = 'https://customer-virwr1ukt49zj3yu.cloudflarestream.com';
const IMAGES_BASE = 'https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q';

let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  loadMedia(1);
  setupEventListeners();
  loadCategories();
});

function setupEventListeners() {
  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.add('active');
  });

  document.getElementById('uploadClose').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.remove('active');
  });

  document.getElementById('uploadModal').addEventListener('click', (e) => {
    if (e.target.id === 'uploadModal') {
      document.getElementById('uploadModal').classList.remove('active');
    }
  });

  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await uploadMedia();
  });

  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query.length > 0) {
        currentSearch = query;
        currentCategory = '';
        searchMedia(query, 1);
      } else {
        currentSearch = '';
        loadMedia(1);
      }
    }, 300);
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      navigatePage(currentPage - 1);
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      navigatePage(currentPage + 1);
    }
  });
}

function navigatePage(page) {
  if (currentSearch) {
    searchMedia(currentSearch, page);
  } else if (currentCategory) {
    loadCategoryMedia(currentCategory, page);
  } else {
    loadMedia(page);
  }
}

async function loadMedia(page) {
  showLoading(true);
  try {
    const response = await fetch('/api/media?page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading media:', error);
  } finally {
    showLoading(false);
  }
}

async function searchMedia(query, page) {
  showLoading(true);
  try {
    const response = await fetch('/api/search?q=' + encodeURIComponent(query) + '&page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error searching:', error);
  } finally {
    showLoading(false);
  }
}

async function loadCategoryMedia(category, page) {
  showLoading(true);
  try {
    const response = await fetch('/api/category?name=' + encodeURIComponent(category) + '&page=' + page);
    const data = await response.json();
    if (data.success) {
      currentPage = data.page;
      totalPages = data.totalPages;
      renderGrid(data.media);
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading category:', error);
  } finally {
    showLoading(false);
  }
}

function getThumbnailUrl(media) {
  if (media.type === 'image') {
    return `${IMAGES_BASE}/${media.cfId}/public`;
  } else {
    // Cloudflare Stream thumbnail — uses your customer subdomain, NOT videodelivery.net
    return `https://customer-virwr1ukt49zj3yu.cloudflarestream.com/${media.cfId}/thumbnails/thumbnail.jpg`;
  }
}

function renderGrid(media) {
  const grid = document.getElementById('mediaGrid');
  if (!media || media.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.5);">No media found</div>';
    return;
  }

  grid.innerHTML = media.map(item => {
    const thumbUrl = item.cfId ? getThumbnailUrl(item) : '';
    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%231a0a0a'/%3E%3Ctext x='50%25' y='50%25' fill='rgba(255,255,255,0.3)' font-family='sans-serif' font-size='16' text-anchor='middle' dy='.3em'%3ENo Preview%3C/text%3E%3C/svg%3E";
    return `<div class="media-item" onclick="goToWatch('${item.id}')">
      <img
        src="${thumbUrl || fallback}"
        alt="${escapeHtml(item.title)}"
        onerror="this.src='${fallback}'"
      >
      ${item.type === 'video' ? '<div class="play-icon">▶</div>' : ''}
      <div class="media-overlay">
        <h3 class="media-title">${escapeHtml(item.title)}</h3>
        <div>
          <span class="media-type-badge">${item.type}</span>
          <span class="media-category-badge" onclick="filterByCategory(event, '${escapeHtml(item.category)}')">${escapeHtml(item.category)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    if (data.success && data.categories) {
      const container = document.getElementById('categoryFilter');
      container.innerHTML =
        '<button class="category-btn active" onclick="filterByCategory(event, \'\')">All</button>'
        + data.categories.map(cat =>
          `<button class="category-btn" onclick="filterByCategory(event, '${escapeHtml(cat.name)}')">${escapeHtml(cat.name)} (${cat.count})</button>`,
        ).join('');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// eslint-disable-next-line no-unused-vars
function filterByCategory(event, category) {
  event.stopPropagation();
  currentCategory = category;
  currentSearch = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  if (category) {
    loadCategoryMedia(category, 1);
  } else {
    loadMedia(1);
  }
}

function updatePagination() {
  document.getElementById('pageNumber').textContent = currentPage;
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('prevBtn').disabled = currentPage <= 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

// eslint-disable-next-line no-unused-vars
function goToWatch(mediaId) {
  window.location.href = '/watch.html?id=' + mediaId;
}

function showLoading(visible) {
  document.getElementById('loadingIndicator').style.display = visible ? 'flex' : 'none';
}

async function uploadMedia() {
  const password = document.getElementById('adminPassword').value;
  const title = document.getElementById('uploadTitle').value;
  const description = document.getElementById('uploadDesc').value;
  const type = document.getElementById('uploadType').value;
  const category = document.getElementById('uploadCategory').value;
  const file = document.getElementById('uploadFile').files[0];

  if (!file) {
    showStatus('Please select a file', 'error');
    return;
  }

  const submitBtn = document.querySelector('#uploadForm .btn-submit');
  submitBtn.disabled = true;
  showStatus('Uploading... this may take a moment for videos', 'loading');

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('category', category);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'X-Admin-Key': password },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showStatus('Upload successful!', 'success');
      setTimeout(() => {
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadModal').classList.remove('active');
        loadMedia(1);
        loadCategories();
      }, 1500);
    } else {
      showStatus(data.error || 'Upload failed', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function showStatus(message, type) {
  const status = document.getElementById('uploadStatus');
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
*/
