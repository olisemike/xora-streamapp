const STREAM_SUBDOMAIN = 'https://customer-virwr1ukt49zj3yu.cloudflarestream.com';
const IMAGES_BASE = 'https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q';

// ============================================================
// AD CONFIGURATION — Watch Page
// Replace with your actual ad content. No SDK required.
// ============================================================
const WATCH_ADS = {
  // Pre-roll ad shown before video plays
  preroll: {
    enabled: true,
    skipAfterSeconds: 5,       // User can skip after this many seconds
    durationSeconds: 15,       // How long the ad plays (for image ads)
    imageUrl: '',              // Image ad URL — leave empty for no preroll
    videoUrl: '',              // Video ad URL (MP4) — takes priority over image
    clickUrl: '',              // Where clicking the ad goes
    altText: 'Advertisement',
  },
  // Banner above player
  topBanner: {
    imageUrl: '',
    clickUrl: '',
    altText: 'Advertisement',
  },
  // Banner below player
  bottomBanner: {
    imageUrl: '',
    clickUrl: '',
    altText: 'Advertisement',
  },
};

let mediaData = null;
let prerollComplete = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mediaId = params.get('id');
  if (mediaId) {
    loadMedia(mediaId);
    setupDelete(mediaId);
  } else {
    document.getElementById('mediaTitle').textContent = 'No media ID provided';
  }

  initWatchBannerAds();
});

// ============================================================
// AD SYSTEM
// ============================================================

function initWatchBannerAds() {
  renderWatchBanner('watchTopContent', WATCH_ADS.topBanner);
  renderWatchBanner('watchBottomContent', WATCH_ADS.bottomBanner);
}

function renderWatchBanner(containerId, ad) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (ad.imageUrl) {
    container.innerHTML = `
      <a href="${ad.clickUrl || '#'}" target="_blank" rel="noopener" class="ad-card">
        <img src="${ad.imageUrl}" alt="${ad.altText}">
      </a>`;
  } else {
    container.innerHTML = `<div class="ad-placeholder">728 × 90 — Ad Slot</div>`;
  }
}

function showPrerollAd(onComplete) {
  const cfg = WATCH_ADS.preroll;

  // Skip if no ad configured or disabled
  if (!cfg.enabled || (!cfg.imageUrl && !cfg.videoUrl)) {
    onComplete();
    return;
  }

  const overlay = document.getElementById('prerollAd');
  const mediaEl = document.getElementById('prerollMedia');
  const skipBtn = document.getElementById('prerollSkip');
  const countdown = document.getElementById('prerollCountdown');
  const progressBar = document.getElementById('prerollBar');

  // Render ad media
  if (cfg.videoUrl) {
    mediaEl.innerHTML = `<video autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;">
      <source src="${cfg.videoUrl}" type="video/mp4">
    </video>`;
    const video = mediaEl.querySelector('video');
    video.addEventListener('ended', () => completePreroll(onComplete));
  } else {
    mediaEl.innerHTML = `<img src="${cfg.imageUrl}" alt="${cfg.altText}" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="window.open('${cfg.clickUrl}','_blank')">`;
  }

  overlay.style.display = 'block';

  let secondsLeft = cfg.skipAfterSeconds;
  let totalSeconds = cfg.durationSeconds;
  let elapsed = 0;

  const tick = setInterval(() => {
    elapsed++;
    secondsLeft = Math.max(0, cfg.skipAfterSeconds - elapsed);

    // Update progress bar
    const pct = Math.min(100, (elapsed / totalSeconds) * 100);
    progressBar.style.width = pct + '%';

    // Countdown text
    if (secondsLeft > 0) {
      countdown.textContent = `Skip in ${secondsLeft}s`;
    } else {
      countdown.textContent = 'You can now skip';
      skipBtn.disabled = false;
      skipBtn.style.opacity = '1';
    }

    // Auto-complete for image ads after duration
    if (!cfg.videoUrl && elapsed >= totalSeconds) {
      clearInterval(tick);
      completePreroll(onComplete);
    }
  }, 1000);

  skipBtn.addEventListener('click', () => {
    if (!skipBtn.disabled) {
      clearInterval(tick);
      completePreroll(onComplete);
    }
  });
}

function completePreroll(onComplete) {
  const overlay = document.getElementById('prerollAd');
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.style.opacity = '';
    prerollComplete = true;
    onComplete();
  }, 300);
}

// ============================================================
// MEDIA LOADING
// ============================================================

async function loadMedia(mediaId) {
  try {
    const response = await fetch('/api/media/' + mediaId);
    if (!response.ok) {
      document.getElementById('mediaTitle').textContent = 'Media not found';
      return;
    }

    mediaData = await response.json();

    if (mediaData.success === false) {
      document.getElementById('mediaTitle').textContent = 'Media not found';
      return;
    }

    document.getElementById('mediaTitle').textContent = mediaData.title || 'Untitled';
    document.getElementById('mediaDesc').textContent = mediaData.description || '';
    document.getElementById('viewCount').textContent = mediaData.views || 0;
    document.getElementById('category').textContent = mediaData.category || '-';
    document.title = `${mediaData.title} — RedStreamer`;

    // Show pre-roll for videos, then render player
    if (mediaData.type === 'video' && WATCH_ADS.preroll.enabled) {
      showPrerollAd(() => renderPlayer(mediaData));
    } else {
      renderPlayer(mediaData);
    }

    recordView(mediaId);
    document.getElementById('deleteBtn').style.display = 'flex';
  } catch (error) {
    console.error('Error loading media:', error);
    document.getElementById('mediaTitle').textContent = 'Error loading media';
  }
}

function renderPlayer(media) {
  const player = document.getElementById('player');

  if (!media.cfId) {
    player.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);font-size:15px;">Media unavailable</div>';
    return;
  }

  if (media.type === 'image') {
    player.innerHTML = `<img src="${IMAGES_BASE}/${media.cfId}/public" alt="${escapeHtml(media.title)}" style="width:100%;height:100%;object-fit:contain;">`;
  } else {
    player.innerHTML = `<iframe
      src="https://iframe.cloudflarestream.com/${media.cfId}"
      style="width:100%;height:100%;border:none;"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>`;
  }
}

async function recordView(mediaId) {
  try {
    await fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    });
  } catch (_) { /* non-critical */ }
}

function setupDelete(mediaId) {
  const deleteBtn = document.getElementById('deleteBtn');
  if (!deleteBtn) return;

  deleteBtn.addEventListener('click', async () => {
    const password = prompt('Enter admin password:');
    if (!password) return;
    if (!confirm('Delete this media permanently?')) return;

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';

      const response = await fetch('/media/' + mediaId, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': password },
      });

      if (response.ok) {
        alert('Deleted!');
        window.location.href = '/';
      } else {
        const data = await response.json().catch(() => ({}));
        alert('Delete failed: ' + (data.error || 'Check your password'));
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> Delete`;
      }
    } catch (error) {
      alert('Error: ' + error.message);
      deleteBtn.disabled = false;
    }
  });
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/*
// Your Cloudflare Stream customer subdomain — update if different
const STREAM_SUBDOMAIN = 'https://customer-virwr1ukt49zj3yu.cloudflarestream.com';
const IMAGES_BASE = 'https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q';

let mediaData = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mediaId = params.get('id');
  if (mediaId) {
    loadMedia(mediaId);
    setupDelete(mediaId);
  } else {
    document.getElementById('mediaTitle').textContent = 'No media ID provided';
  }
});

async function loadMedia(mediaId) {
  try {
    const response = await fetch('/api/media/' + mediaId);
    if (!response.ok) {
      document.getElementById('mediaTitle').textContent = 'Media not found';
      return;
    }

    mediaData = await response.json();

    // Handle both wrapped {success, data} and direct object responses
    if (mediaData.success === false) {
      document.getElementById('mediaTitle').textContent = 'Media not found';
      return;
    }

    document.getElementById('mediaTitle').textContent = mediaData.title || 'Untitled';
    document.getElementById('mediaDesc').textContent = mediaData.description || 'No description';
    document.getElementById('viewCount').textContent = mediaData.views || 0;
    document.getElementById('category').textContent = mediaData.category || '-';

    renderPlayer(mediaData);

    // Record view after successful load
    recordView(mediaId);

    document.getElementById('deleteBtn').style.display = 'inline-block';
  } catch (error) {
    console.error('Error loading media:', error);
    document.getElementById('mediaTitle').textContent = 'Error loading media';
  }
}

function renderPlayer(media) {
  const player = document.getElementById('player');

  if (!media.cfId) {
    player.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.5);font-size:16px;">Media unavailable — upload may have failed</div>';
    return;
  }

  if (media.type === 'image') {
    const url = `${IMAGES_BASE}/${media.cfId}/public`;
    player.innerHTML = `<img src="${url}" alt="${escapeHtml(media.title)}" style="width:100%;height:100%;object-fit:contain;">`;
  } else {
    // Cloudflare Stream MUST use iframe, not <video> src
    // The /watch URL returns HTML, not a video stream
    const iframeSrc = `${STREAM_SUBDOMAIN}/${media.cfId}/iframe`;
    player.innerHTML = `<iframe
      src="${iframeSrc}"
      style="width:100%;height:100%;border:none;"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>`;
  }
}

async function recordView(mediaId) {
  try {
    await fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    });
  } catch (error) {
    // Non-critical, ignore
  }
}

function setupDelete(mediaId) {
  const deleteBtn = document.getElementById('deleteBtn');
  if (!deleteBtn) return;

  deleteBtn.addEventListener('click', async () => {
    const password = prompt('Enter admin password:');
    if (!password) return;

    if (!confirm('Are you sure you want to delete this media? This cannot be undone.')) return;

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';

      const response = await fetch('/media/' + mediaId, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': password },
      });

      if (response.ok) {
        alert('Deleted successfully!');
        window.location.href = '/';
      } else {
        const data = await response.json().catch(() => ({}));
        alert('Delete failed: ' + (data.error || 'Check your password'));
        deleteBtn.disabled = false;
        deleteBtn.textContent = '🗑️ Delete';
      }
    } catch (error) {
      alert('Error: ' + error.message);
      deleteBtn.disabled = false;
      deleteBtn.textContent = '🗑️ Delete';
    }
  });
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
*/