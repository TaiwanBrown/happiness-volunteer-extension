// Back to Home button
document.getElementById('backToHome')?.addEventListener('click', () => {
  window.location.href = 'tools.html';
});

// Section visibility management
const SECTIONS = [
  { id: 'search', name: 'Support Search' },
  { id: 'youtube', name: 'Official YouTube Channel Search' },
  { id: 'links', name: 'Bookmarks' },
  { id: 'responses', name: 'Common Responses' },
  { id: 'profiler', name: 'Site Profiler' },
  { id: 'common-issues', name: 'Common Issues Quick Reference' },
  { id: 'escalation', name: 'Escalation Guidelines' }
];

const HIDDEN_SECTIONS_KEY = 'hidden_sections';

function loadHiddenSections() {
  return new Promise((resolve) => {
    chrome.storage.local.get([HIDDEN_SECTIONS_KEY], (res) => {
      resolve(res[HIDDEN_SECTIONS_KEY] || []);
    });
  });
}

function saveHiddenSections(hiddenSections) {
  chrome.storage.local.set({ [HIDDEN_SECTIONS_KEY]: hiddenSections });
}

async function renderSectionToggles() {
  const container = document.getElementById('sectionToggles');
  if (!container) return;

  const hiddenSections = await loadHiddenSections();

  container.innerHTML = '';
  SECTIONS.forEach(section => {
    const isHidden = hiddenSections.includes(section.id);
    const toggle = document.createElement('div');
    toggle.className = 'section-toggle';
    toggle.innerHTML = `
      <label>
        <input type="checkbox" class="section-checkbox" data-section-id="${section.id}" ${isHidden ? '' : 'checked'} />
        <span>${section.name}</span>
      </label>
    `;
    container.appendChild(toggle);
  });

  // Add event listeners
  document.querySelectorAll('.section-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const sectionId = e.target.dataset.sectionId;
      const hiddenSections = await loadHiddenSections();
      
      if (e.target.checked) {
        // Show section - remove from hidden list
        const index = hiddenSections.indexOf(sectionId);
        if (index > -1) {
          hiddenSections.splice(index, 1);
        }
      } else {
        // Hide section - add to hidden list
        if (!hiddenSections.includes(sectionId)) {
          hiddenSections.push(sectionId);
        }
      }
      
      saveHiddenSections(hiddenSections);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderSectionToggles();
});
