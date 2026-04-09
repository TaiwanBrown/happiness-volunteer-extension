function showToast(msg) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2000);
}

// Back to Tools button
document.getElementById('backToTools')?.addEventListener('click', () => {
  window.location.href = 'tools.html';
});

// Notes functionality
function initNotes() {
  const NOTES_KEY = 'wp_support_notes_v2';
  const noteInput = document.getElementById('noteInput');
  const addNoteBtn = document.getElementById('addNote');
  const notesList = document.getElementById('notesList');
  let notes = [];

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} at ${timeStr}`;
  }

  function saveNotes() {
    chrome.storage.local.set({ [NOTES_KEY]: notes });
  }

  function makeLinksClickable(text) {
    // Escape HTML first
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    
    // Replace URLs with clickable links
    return escaped.replace(urlPattern, '<a href="$1" target="_blank" class="note-link">$1</a>');
  }

  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
      notesList.innerHTML = '<div style="color: var(--muted); font-size: 12px; text-align: center; padding: 20px;">No notes yet. Add one above!</div>';
      return;
    }

    notes.forEach((note, index) => {
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      noteItem.dataset.index = index;

      if (note.editing) {
        noteItem.classList.add('editing');
        noteItem.innerHTML = `
          <input type="text" class="note-edit-input" value="${note.text.replace(/"/g, '&quot;')}" data-index="${index}" />
          <div class="note-edit-actions">
            <button class="btn note-save-btn" data-index="${index}">Save</button>
            <button class="btn note-cancel-btn" data-index="${index}">Cancel</button>
          </div>
        `;
      } else {
        noteItem.innerHTML = `
          <div class="note-header">
            <span class="note-timestamp">${formatTimestamp(note.timestamp)}</span>
            <div class="note-actions">
              <button class="note-action-btn note-edit-btn" data-index="${index}" title="Edit">✏️</button>
              <button class="note-action-btn note-delete-btn" data-index="${index}" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="note-text">${makeLinksClickable(note.text)}</div>
        `;
      }

      notesList.appendChild(noteItem);
    });

    attachNoteEventListeners();
  }

  function attachNoteEventListeners() {
    document.querySelectorAll('.note-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        notes[index].editing = true;
        renderNotes();
      });
    });

    document.querySelectorAll('.note-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        notes.splice(index, 1);
        saveNotes();
        renderNotes();
        showToast('Note deleted.');
      });
    });

    document.querySelectorAll('.note-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const input = document.querySelector(`.note-edit-input[data-index="${index}"]`);
        const newText = input.value.trim();
        if (newText) {
          notes[index].text = newText;
          notes[index].editing = false;
          saveNotes();
          renderNotes();
          showToast('Note updated.');
        }
      });
    });

    document.querySelectorAll('.note-cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        notes[index].editing = false;
        renderNotes();
      });
    });

    document.querySelectorAll('.note-edit-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const index = parseInt(e.target.dataset.index);
          const saveBtn = document.querySelector(`.note-save-btn[data-index="${index}"]`);
          if (saveBtn) saveBtn.click();
        }
      });
    });
  }

  function addNote() {
    const text = noteInput.value.trim();
    if (!text) {
      showToast('Please enter a note.');
      return;
    }

    notes.unshift({
      text: text,
      timestamp: Date.now(),
      editing: false
    });

    noteInput.value = '';
    saveNotes();
    renderNotes();
    showToast('Note added.');
  }

  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', addNote);
  }

  if (noteInput) {
    noteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNote();
      }
    });
  }

  chrome.storage.local.get([NOTES_KEY], (res) => {
    if (res && Array.isArray(res[NOTES_KEY])) {
      notes = res[NOTES_KEY];
    }
    renderNotes();
  });
}

// Export notes as CSV
function exportNotesAsCSV() {
  const NOTES_KEY = 'wp_support_notes_v2';
  
  chrome.storage.local.get([NOTES_KEY], (res) => {
    const notes = res[NOTES_KEY] || [];
    
    if (notes.length === 0) {
      showToast('No notes to export.');
      return;
    }
    
    // Create CSV content
    let csvContent = 'Timestamp,Date,Time,Note\n';
    
    notes.forEach(note => {
      const date = new Date(note.timestamp);
      const dateStr = date.toLocaleDateString('en-US');
      const timeStr = date.toLocaleTimeString('en-US');
      const noteText = note.text.replace(/"/g, '""'); // Escape quotes
      
      csvContent += `"${note.timestamp}","${dateStr}","${timeStr}","${noteText}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `happiness-volunteer-notes-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Notes exported successfully!');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNotes();
  
  // Export CSV button
  const exportBtn = document.getElementById('exportNotesCSV');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportNotesAsCSV);
  }
});
