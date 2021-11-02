/**
 * PWA stuff
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/notes/sw.js');
};

var settings = JSON.parse(localStorage.getItem('notes-settings') || '{"autosave": true}');

/**
 * Read the notes from localStorage
 */
notes.value = localStorage.getItem('notes-notes');

/**
 * Save notes to localStorage
 */
function saveNotes(e) {
    localStorage.setItem('notes-notes', notes.value);
}

/**
 * Save notes to localStorage when notes changed if autosave is enabled
 */
if (settings.autosave)
    notes.addEventListener('input', saveNotes);
else
    savebtn.classList.add('visible');

/**
 * Save notes to localStorage when save button is clicked
 */
savebtn.addEventListener('click', saveNotes);

/**
 * Save notes to localStorage when Ctrl + S
 */
window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNotes();
    }
});

settingsbtn.addEventListener('click', () => {
    settingspanel.querySelector('form input#settings-autosave').checked = settings.autosave;
    settingspanel.classList.add('visible');
    panelbackground.classList.add('visible');
});

panelbackground.addEventListener('click', () => {
    settingspanel.classList.remove('visible');
    panelbackground.classList.remove('visible');
});

/**
 * Save settings to localStorage
 */
function saveSettings(e) {
    e.preventDefault();

    // Hide settings panel
    settingspanel.classList.remove('visible');
    panelbackground.classList.remove('visible');

    // Set settings values to the ones specified
    settings.autosave = e.target.querySelector('input#settings-autosave').checked;

    // Save settings to localStorage
    localStorage.setItem('notes-settings', JSON.stringify(settings));

    // Apply settings
    if (settings.autosave) {
        notes.addEventListener('input', saveNotes);
        savebtn.classList.remove('visible');
    } else {
        notes.removeEventListener('input', saveNotes)
        savebtn.classList.add('visible');
    }
}