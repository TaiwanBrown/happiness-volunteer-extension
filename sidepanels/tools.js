function showToast(msg) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

function sendInsert(text) {
  if (!text) return;
  chrome.runtime.sendMessage({ action: 'insertText', text }, (res) => {
    if (!res || !res.ok) {
      copyToClipboard(text);
      showToast('Copied to clipboard. Focus a text field and paste.');
    } else {
      showToast('Inserted into page.');
    }
  });
}

// Bookmarks Management
const DEFAULT_BOOKMARKS = [
  { title: 'Support Docs', url: 'https://wordpress.com/support/' },
  { title: 'Forums', url: 'https://wordpress.com/forums/' },
  { title: 'Account Settings', url: 'https://wordpress.com/me' },
  { title: 'WordPress.com', url: 'https://wordpress.com' },
  { title: 'Volunteers', url: 'https://wordpress.com/support/wordpress-com-volunteers/' },
  { title: 'COM vs ORG', url: 'https://wordpress.com/support/com-vs-org/' }
];

const BOOKMARKS_KEY = 'user_bookmarks';

function loadBookmarks() {
  return new Promise((resolve) => {
    chrome.storage.local.get([BOOKMARKS_KEY], (res) => {
      resolve(res[BOOKMARKS_KEY] || DEFAULT_BOOKMARKS);
    });
  });
}

function saveBookmarks(bookmarks) {
  chrome.storage.local.set({ [BOOKMARKS_KEY]: bookmarks });
}

async function renderBookmarks() {
  const grid = document.getElementById('bookmarksGrid');
  if (!grid) return;

  const bookmarks = await loadBookmarks();
  grid.innerHTML = '';

  bookmarks.forEach((bookmark, index) => {
    const bookmarkEl = document.createElement('div');
    bookmarkEl.className = 'bookmark-item';
    bookmarkEl.innerHTML = `
      <button class="btn bookmark-link" data-url="${bookmark.url}">${bookmark.title}</button>
      <button class="bookmark-delete" data-index="${index}" title="Delete">×</button>
    `;
    grid.appendChild(bookmarkEl);
  });

  // Add click handlers
  grid.querySelectorAll('.bookmark-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      chrome.tabs.create({ url, active: false });
    });
  });

  grid.querySelectorAll('.bookmark-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index);
      const bookmarks = await loadBookmarks();
      bookmarks.splice(index, 1);
      saveBookmarks(bookmarks);
      renderBookmarks();
      showToast('Bookmark deleted.');
    });
  });
}

function initBookmarks() {
  renderBookmarks();

  const addBtn = document.getElementById('addBookmark');
  const titleInput = document.getElementById('bookmarkTitle');
  const urlInput = document.getElementById('bookmarkUrl');

  if (addBtn && titleInput && urlInput) {
    addBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const url = urlInput.value.trim();

      if (!title || !url) {
        showToast('Please enter both title and URL.');
        return;
      }

      const bookmarks = await loadBookmarks();
      bookmarks.push({ title, url });
      saveBookmarks(bookmarks);
      renderBookmarks();

      titleInput.value = '';
      urlInput.value = '';
      showToast('Bookmark added.');
    });
  }
}

// Responses Management
const DEFAULT_RESPONSES = [
  { title: 'Greeting', text: "Hello! I'm sorry to hear about your issue. As a WordPress.com Support Volunteer, I will try my best to help you." },
  { title: 'Clear Cache', text: "Could you please try clearing your browser cache and cookies? This often resolves many common issues. Here's how to do it: https://wordpress.com/support/browser-issues/#clearing-your-browser-cache" },
  { title: 'Browser Troubleshooting', text: "This might be related to the browser. Please try: \n1) Clear cache/cookies\n2) Try another browser\n3) Incognito/private window\n4) Temporarily disable extensions" }
];

const RESPONSES_KEY = 'user_responses';

function loadResponses() {
  return new Promise((resolve) => {
    chrome.storage.local.get([RESPONSES_KEY], (res) => {
      resolve(res[RESPONSES_KEY] || DEFAULT_RESPONSES);
    });
  });
}

function saveResponses(responses) {
  chrome.storage.local.set({ [RESPONSES_KEY]: responses });
}

async function renderResponses() {
  const grid = document.getElementById('responsesGrid');
  if (!grid) return;

  const responses = await loadResponses();
  grid.innerHTML = '';

  responses.forEach((response, index) => {
    const responseEl = document.createElement('div');
    responseEl.className = 'response-item';
    responseEl.innerHTML = `
      <button class="btn response-btn" data-index="${index}">${response.title}</button>
      <button class="response-delete" data-index="${index}" title="Delete">×</button>
    `;
    grid.appendChild(responseEl);
  });

  // Add click handlers
  grid.querySelectorAll('.response-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index);
      const responses = await loadResponses();
      sendInsert(responses[index].text);
    });
  });

  grid.querySelectorAll('.response-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index);
      const responses = await loadResponses();
      responses.splice(index, 1);
      saveResponses(responses);
      renderResponses();
      showToast('Response deleted.');
    });
  });
}

function initResponses() {
  renderResponses();

  const addBtn = document.getElementById('addResponse');
  const titleInput = document.getElementById('responseTitle');
  const textInput = document.getElementById('responseText');

  if (addBtn && titleInput && textInput) {
    addBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const text = textInput.value.trim();

      if (!title || !text) {
        showToast('Please enter both title and response text.');
        return;
      }

      const responses = await loadResponses();
      responses.push({ title, text });
      saveResponses(responses);
      renderResponses();

      titleInput.value = '';
      textInput.value = '';
      showToast('Response added.');
    });
  }
}

// Navigate to Notes page
function initNotesNavigation() {
  const goToNotesBtn = document.getElementById('goToNotes');
  if (goToNotesBtn) {
    goToNotesBtn.addEventListener('click', () => {
      window.location.href = 'notes.html';
    });
  }
}

// Navigate to Settings page
function initSettingsNavigation() {
  const goToSettingsBtn = document.getElementById('goToSettings');
  if (goToSettingsBtn) {
    goToSettingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }
}

// Support Search
function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  const performSearch = () => {
    const query = searchInput?.value.trim();
    if (!query) {
      showToast('Please enter a search term.');
      return;
    }
    const searchUrl = `https://wordpress.com/support/?s=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url: searchUrl, active: false });
  };

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}

// YouTube Search
function initYouTube() {
  const youtubeBtn = document.getElementById('youtubeBtn');
  const youtubeInput = document.getElementById('youtubeInput');

  const performYouTubeSearch = () => {
    const query = youtubeInput?.value.trim();
    if (!query) {
      showToast('Please enter a search term.');
      return;
    }
    const searchUrl = `https://www.youtube.com/@wordpress/search?query=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url: searchUrl, active: false });
  };

  if (youtubeBtn) {
    youtubeBtn.addEventListener('click', performYouTubeSearch);
  }

  if (youtubeInput) {
    youtubeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performYouTubeSearch();
      }
    });
  }
}

// Site Profiler
function initProfiler() {
  const loadBtn = document.getElementById('loadProfiler');
  const copyBtn = document.getElementById('copyProfilerUrl');
  const siteInput = document.getElementById('profilerSiteInput');

  const loadProfile = () => {
    if (!siteInput) return;
    
    let site = siteInput.value.trim();
    if (!site) {
      showToast('Please enter a website URL');
      return;
    }
    
    // Clean up the URL - remove protocol if present
    site = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Open the site profiler in a new tab
    const profilerUrl = `https://wordpress.com/site-profiler/${encodeURIComponent(site)}`;
    chrome.tabs.create({ url: profilerUrl, active: false });
    showToast('Opening site profiler in new tab...');
  };

  const copyProfilerUrl = async () => {
    if (!siteInput) return;
    
    let site = siteInput.value.trim();
    if (!site) {
      showToast('Please enter a website URL');
      return;
    }
    
    // Clean up the URL - remove protocol if present
    site = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    const profilerUrl = `https://wordpress.com/site-profiler/${encodeURIComponent(site)}`;
    await copyToClipboard(profilerUrl);
    showToast('Profiler URL copied to clipboard!');
  };

  if (loadBtn) {
    loadBtn.addEventListener('click', loadProfile);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyProfilerUrl);
  }

  if (siteInput) {
    siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadProfile();
      }
    });
  }
}

// Collapse/Expand sections
function initCollapse() {
  document.querySelectorAll('.collapse-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.closest('.section');
      const isCollapsed = section.classList.toggle('collapsed');
      btn.textContent = isCollapsed ? '+' : '−';
      saveSectionStates();
    });
  });
}

// Drag and Drop reordering
function initDragDrop() {
  const container = document.getElementById('sectionsContainer');
  let draggedElement = null;

  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('section')) {
      draggedElement = e.target;
      e.target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  container.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('section')) {
      e.target.classList.remove('dragging');
      draggedElement = null;
      saveSectionOrder();
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(draggedElement);
    } else {
      container.insertBefore(draggedElement, afterElement);
    }
  });

  container.addEventListener('dragenter', (e) => {
    if (e.target.classList.contains('section') && e.target !== draggedElement) {
      e.target.classList.add('drag-over');
    }
  });

  container.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('section')) {
      e.target.classList.remove('drag-over');
    }
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('drag-over'));
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.section:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Save and restore section order
function saveSectionOrder() {
  const order = [...document.querySelectorAll('.section')].map(s => s.id);
  chrome.storage.local.set({ section_order: order });
}

function restoreSectionOrder() {
  chrome.storage.local.get(['section_order'], (res) => {
    if (res.section_order && Array.isArray(res.section_order)) {
      const container = document.getElementById('sectionsContainer');
      res.section_order.forEach(id => {
        const section = document.getElementById(id);
        if (section) container.appendChild(section);
      });
    }
  });
}

// Save and restore collapsed states
function saveSectionStates() {
  const states = {};
  document.querySelectorAll('.section').forEach(s => {
    states[s.id] = s.classList.contains('collapsed');
  });
  chrome.storage.local.set({ section_states: states });
}

function restoreSectionStates() {
  chrome.storage.local.get(['section_states'], (res) => {
    if (res.section_states) {
      Object.keys(res.section_states).forEach(id => {
        const section = document.getElementById(id);
        const btn = section?.querySelector('.collapse-btn');
        if (section && res.section_states[id]) {
          section.classList.add('collapsed');
          if (btn) btn.textContent = '+';
        }
      });
    }
  });
}

// Apply hidden sections from settings
function applyHiddenSections() {
  chrome.storage.local.get(['hidden_sections'], (res) => {
    const hiddenSections = res.hidden_sections || [];
    const container = document.getElementById('sectionsContainer');
    
    hiddenSections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section && container) {
        // Move to bottom
        container.appendChild(section);
        // Collapse it
        section.classList.add('collapsed');
        const btn = section.querySelector('.collapse-btn');
        if (btn) btn.textContent = '+';
      }
    });
  });
}

// Tag copying
function initTagCopy() {
  document.querySelectorAll('.tag-copy').forEach(tag => {
    tag.addEventListener('click', async () => {
      const tagText = tag.dataset.tag;
      await copyToClipboard(tagText);
      showToast(`Tag "${tagText}" copied to clipboard!`);
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  restoreSectionOrder();
  restoreSectionStates();
  initBookmarks();
  initSearch();
  initYouTube();
  initResponses();
  initNotesNavigation();
  initSettingsNavigation();
  initProfiler();
  initCollapse();
  initDragDrop();
  applyHiddenSections();
  initTagCopy();
});
