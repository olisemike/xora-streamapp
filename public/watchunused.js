let mediaData = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mediaId = params.get('id');
  if (mediaId) {
    loadMedia(mediaId);
    recordView(mediaId);
    setupDelete(mediaId);
  }
});

async function loadMedia(mediaId) {
  try {
    const response = await fetch('/api/media/' + mediaId);
    if (!response.ok) {
      document.getElementById('mediaTitle').textContent = 'Not Found';
      return;
    }
    mediaData = await response.json();
    document.getElementById('mediaTitle').textContent = mediaData.title;
    document.getElementById('mediaDesc').textContent = mediaData.description || 'No description';
    document.getElementById('viewCount').textContent = mediaData.views || 0;
    document.getElementById('category').textContent = mediaData.category;

    const player = document.getElementById('player');
    if (mediaData.type === 'image') {
      player.innerHTML = '<img src="https://imagedelivery.net/1eL4FEtJQavAd5JjFtJe7Q/' + mediaData.cfId
        + '/public" alt="' + mediaData.title + '" style="max-width: 100%; height: auto;">';
    } else {
    //  player.innerHTML = '<video controls style="width: 100%;"><source src="https://customer-virwr1ukt49zj3yu.cloudflarestream.com/'

      player.innerHTML = '<iframe src="https://customer-virwr1ukt49zj3yu.cloudflarestream.com/'
  + mediaData.cfId + '/iframe" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';

      + mediaData.cfId + '/watch" type="video/mp4"></video>';
    }

    document.getElementById('deleteBtn').style.display = 'block';
  } catch (error) {
    console.error('Error loading media:', error);
    document.getElementById('mediaTitle').textContent = 'Error loading media';
  }
}

async function recordView(mediaId) {
  try {
    await fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: mediaId }),
    });
  } catch (error) {
    console.error('Error recording view:', error);
  }
}

function setupDelete(mediaId) {
  const deleteBtn = document.getElementById('deleteBtn');
  if (!deleteBtn) {
    return;
  }
  deleteBtn.addEventListener('click', async () => {
    const password = prompt('Enter admin password:');
    if (!password) {
      return;
    }
    if (confirm('Delete this media?')) {
      try {
        const response = await fetch('/media/' + mediaId, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': password },
        });
        if (response.ok) {
          alert('Deleted!');
          window.location.href = '/';
        } else {
          alert('Delete failed - check password');
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  });
}
