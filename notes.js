/**
 * PWA stuff
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Notes/sw.js');
};

function q(elem, parentElem=document) { return parentElem.querySelector(elem); }
function qs(elems, parentElem=document) { return parentElem.querySelectorAll(elems); }

class Note {
    title;
    content;
    constructor(title = '', content = '') {
        this.title = title;
        this.content = content;
    }
}

function setVisible(panel, visible) {
    if(panel === 'all') {
        qs('dialog').forEach(elem => setVisible(elem, false));
        return;
    }
    else if(typeof panel === 'string')
        panel = q(panel);
    panel.parentElement.classList.toggle('visible', visible);
}

// Yes No Cancel
function YNC(title, message, onyes, onno, oncancel) {
    let yncPanel = q('#ync-panel');
    yncPanel.querySelector('h2').textContent = title;
    yncPanel.querySelector('p').textContent = message;
    yncPanel.parentElement.onclick = e => {
        if(e.target.dataset.type === 'yes') {
            if(onyes) onyes();
            setVisible(yncPanel, false);
        }
        else if(e.target.dataset.type === 'no') {
            if(onno) onno();
            setVisible(yncPanel, false);
        }
        else if(e.target.dataset.type === 'cancel' || e.target.classList.contains('panel-background')) {
            if(oncancel) oncancel();
            setVisible(yncPanel, false);
        }
    };
    setVisible(yncPanel, true);
}

var settings = JSON.parse(localStorage.getItem('notes-settings') || '{"autosave": true, "fontfamily": "font-monospace"}');
var notes = JSON.parse(localStorage.getItem('notes-notes') || '[{"title": "", "content": ""}]');

Object.defineProperty(settings, 'selected', {
    get: function() {
        let selected = Number(localStorage.getItem('notes-selected'));
        return notes.length > selected ? selected : 0;
    },
    set: function(newValue) {
        localStorage.setItem('notes-selected', newValue);
    }
});

/**
 * Read the notes from localStorage
 */
function loadNote() {
    if(notes.length === 0) notes = [{"title": "", "content": ""}];
    q('#note-title').value = notes[settings.selected].title;
    q('#note-content').value = notes[settings.selected].content;
    setVisible('#menu-panel', false);
}
loadNote();

/**
 * Save notes to localStorage
 */
function saveNotesList() {
    localStorage.setItem('notes-notes', JSON.stringify(notes));
}
/**
 * Save note title to localStorage
 */
function saveNoteTitle() {
    notes[settings.selected].title = q('#note-title').value;
    saveNotesList();
}
/**
 * Save note content to localStorage
 */
function saveNoteContent() {
    notes[settings.selected].content = q('#note-content').value;
    saveNotesList();
}
/**
 * Save note content to localStorage
 */
function saveNote() {
    saveNoteTitle();
    saveNoteContent();
    updateSaveIcon(true);
}
/**
 * Save note content to localStorage
 */
function updateSaveIcon(saved = false) {
    if(saved instanceof InputEvent) saved = false;
    q('#save-btn').style.opacity = saved ? 0.5 : 1;
}

/**
 * Export notes as JSON and let user save file
 * Credit: https://stackoverflow.com/a/52297652/6542268
 */
function exportData() {
    const fileName = 'notes.json';
    const toJson = {
        'version': 3,
        'notes': notes,
        'settings': settings,
    };
    const jsonStr = JSON.stringify(toJson);

    let elem = document.createElement('a');
    elem.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr));
    elem.setAttribute('download', fileName);

    elem.style.display = 'none';
    document.body.appendChild(elem);

    elem.click();

    document.body.removeChild(elem);
}

/**
 * Import notes from JSON file that the user uploads
 */
function importData() {
    setVisible('#import-panel', true);
}

q('form#form-import').addEventListener('submit', async e => {
    e.preventDefault();
    if(!q('#file-import').value)
        return;
    const mode = q('#select-import-mode').value;
    const importSettings = q('#cb-import-settings').checked;
    let data;
    try {
        data = JSON.parse(await q('#file-import').files[0].text());
    } catch (error){
        console.error(error);
        alert(`Error while reading file:\n\n${error}`);
        return;
    }
    YNC(
        mode === 'append' ? 'Append notes?' : 'Overwrite notes?',
        mode === 'append' ?
            'Are you sure that you want to append notes?' :
            'Are you sure that you want to OVERWRITE notes? (This cannot be undone)', () => {
        if(importSettings) {
            settings = data.settings;
            saveSettings();
        }
        if(mode === 'append')
            data.notes.forEach(note => notes.push(note));
        else if(mode === 'overwrite')
            notes = data.notes;
        saveNotesList();
        setVisible('all', false);
    });
});

/**
 * Save notes to localStorage when notes changed if autosave is enabled
 */
if (settings.autosave) {
    q('#note-title').addEventListener('input', saveNoteTitle);
    q('#note-content').addEventListener('input', saveNoteContent);
}
else {
    q('#save-btn').classList.add('visible');
    q('#note-title').addEventListener('input', updateSaveIcon);
    q('#note-content').addEventListener('input', updateSaveIcon);
}

if (settings.fontfamily)
    q('body').classList.add(settings.fontfamily);

/**
 * Save notes to localStorage when save button is clicked
 */
q('#save-btn').addEventListener('click', saveNote);

/**
 * Handle keyboard shortcuts
 */
window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
    }
    else if (e.key === 'Escape') {
        e.preventDefault();
        setVisible('all', false);
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        importData();
    }
});

q('#settings-btn').addEventListener('click', () => {
    q('#settings-panel form input#settings-autosave').checked = settings.autosave;
    q('#settings-panel form select#settings-fontfamily').value = settings.fontfamily || '';
    setVisible('#settings-panel', true);
});

q('#menu-btn').addEventListener('click', () => {
    let newElems = [];
    notes.forEach((e, i) => {
        let newElem = document.createElement('li');
        newElem.innerHTML = `<button data-i="${i}"></button><button aria-label="Delete" title="Delete">X</button>`;
        q('button', newElem).textContent = e.title || 'No Title';
        newElems.push(newElem);
    });
    q('#menu-panel ul').replaceChildren(...newElems);
    setVisible('#menu-panel', true);
});

qs('div.panel div.panel-background:not(.ync-panel)').forEach(e =>
    e.addEventListener('click', () => setVisible(e, false)));

q('#menu-panel').addEventListener('click', e => {
    // console.log(e.target);

    if(e.target.dataset.i) {
        if(!settings.autosave)
            YNC('Do want to save?', 'Do you want to save notes before closing?',
                () => {
                    saveNote();
                    settings.selected = Number(e.target.dataset.i);
                    loadNote();
                }, () => {
                    settings.selected = Number(e.target.dataset.i);
                    loadNote();
                });
        else {
            settings.selected = Number(e.target.dataset.i);
            loadNote();
        }
    }

    else if(e.target.parentElement.children[0].dataset.i) {
        let i = Number(e.target.parentElement.children[0].dataset.i);
        YNC(`Do you want to delete "${
                notes[i].title || 'No Title'
            }"?`, `Are you sure that you want to delete "${
                notes[i].title || 'No Title'
            }" (this cannot be undone)?`, () => {
                notes.splice(i, 1);
                saveNotesList();
                loadNote();
        });
    }

    else if(e.target.id === 'add-notes-btn'){
        if(!settings.autosave)
            YNC('Do want to save?', 'Do you want to save notes before closing?', () => {
                saveNote();
                settings.selected = notes.push(new Note()) - 1;
                loadNote();
                saveNote();
            }, () => {
                settings.selected = notes.push(new Note()) - 1;
                loadNote();
                saveNote();
            });
        else {
            settings.selected = notes.push(new Note()) - 1;
            loadNote();
            saveNote();
        }
    }

    else if(e.target.id === 'edit-notes-btn')
        q('#menu-panel').classList.add('editing');

    else if(e.target.id === 'done-edit-notes-btn')
        q('#menu-panel').classList.remove('editing');

    else if(e.target.id === 'export-btn' || e.target.parentElement.id === 'export-btn')
        exportData();

    else if(e.target.id === 'import-btn' || e.target.parentElement.id === 'import-btn')
        importData();
});

/**
 * Save settings to localStorage
 */
function saveSettings(e) {
    if(e instanceof Event) {
        e.preventDefault();

        // Hide settings panel
        setVisible('#settings-panel', false);

        // Set settings values to the ones specified
        settings.autosave = e.target.querySelector('input#settings-autosave').checked;
        settings.fontfamily = e.target.querySelector('select#settings-fontfamily').value;
    }

    // Save settings to localStorage
    localStorage.setItem('notes-settings', JSON.stringify(settings));

    // Apply settings
    if (settings.autosave) {
        q('#note-title').addEventListener('input', saveNoteTitle);
        q('#note-content').addEventListener('input', saveNoteContent);
        q('#save-btn').classList.remove('visible');
    } else {
        q('#note-title').removeEventListener('input', saveNoteTitle);
        q('#note-content').removeEventListener('input', saveNoteContent)
        q('#note-title').addEventListener('input', updateSaveIcon);
        q('#note-content').addEventListener('input', updateSaveIcon);
        q('#save-btn').classList.add('visible');
    }
    q('body').classList.remove(...q('body').classList);
    q('body').classList.add(settings.fontfamily);
}

q('#toolbar').addEventListener('click', e => {
    e.preventDefault();
    q('#note-content').focus();
});