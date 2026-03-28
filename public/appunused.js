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

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      currentSearch = query;
      currentCategory = '';
      searchMedia(query, 1);
    } else {
      currentSearch = '';
      loadMedia(1);
    }
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      if (currentSearch) {
        searchMedia(currentSearch, currentPage - 1);
      } else if (currentCategory) {
        loadCategoryMedia(currentCategory, currentPage - 1);
      } else {
        loadMedia(currentPage - 1);
      }
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      if (currentSearch) {
        searchMedia(currentSearch, currentPage + 1);
      } else if (currentCategory) {
        loadCategoryMedia(currentCategory, currentPage + 1);
      } else {
        loadMedia(currentPage + 1);
      }
    }
  });
}

async function loadMedia(page) {
  document.getElementById('loadingIndicator').style.display = 'flex';
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
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

async function searchMedia(query, page) {
  document.getElementById('loadingIndicator').style.display = 'flex';
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
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

async function loadCategoryMedia(category, page) {
  document.getElementById('loadingIndicator').style.display = 'flex';
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
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

function renderGrid(media) {
  const grid = document.getElementById('mediaGrid');
  if (!media || media.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No media found</div>';
    return;
  }

  grid.innerHTML = media.map(item => {
    const thumbUrl = getThumbnailUrl(item);
    return '<div class="media-item" onclick="goToWatch(\'' + item.id + '\')">'
      + '<img src="' + thumbUrl + '" alt="' + item.title + '" onerror="this.src=\'https://via.placeholder.com/400x225?text=No+Image\'">'
      + (item.type === 'video' ? '<div class="play-icon">▶</div>' : '')
      + '<div class="media-overlay">'
      + '<h3 class="media-title">' + item.title + '</h3>'
      + '<div><span class="media-type-badge">' + item.type + '</span>'
      + '<span class="media-category-badge" onclick="filterByCategory(event, \'' + item.category + '\')">' + item.category + '</span></div>'
      + '</div></div>';
  }).join('');
}

function getThumbnailUrl(media) {
  if (media.type === 'image') {
    return 'https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q/' + media.cfId + '/public';
  } else {
    //return 'https://videodelivery.net/' + media.cfId + '/thumbnails/thumbnail.jpg?time=1s';
    return 'https://customer-virwr1ukt49zj3yu.cloudflarestream.com/' + media.cfId + '/thumbnails/thumbnail.jpg?time=1s';
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    if (data.success && data.categories) {
      const container = document.getElementById('categoryFilter');
      container.innerHTML = data.categories
        .map(cat => '<button class="category-btn" onclick="filterByCategory(event, \'' + cat.name + '\')">' + cat.name + ' (' + cat.count + ')</button>')
        .join('')
        + '<button class="category-btn active" onclick="filterByCategory(event, \'\')">All</button>';
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

  showStatus('Uploading...', 'loading');

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
      }, 1500);
    } else {
      showStatus(data.error || 'Upload failed', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('uploadStatus');
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
}
