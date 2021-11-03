/**
 * PWA stuff
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Notes/sw.js');
};

class Note {
    title;
    content;
    constructor(title = "", content = "") {
        this.title = title;
        this.content = content;
    }
}

function setVisible(panel, visible) {
    panel.parentElement.classList.toggle('visible', visible);
}

function YNC(title, message, onyes, onno, oncancel) {
    yncpanel.querySelector('h2').innerText = title;
    yncpanel.querySelector('p').innerText = message;
    yncpanel.parentElement.onclick = e => {
        if(e.target.dataset.type === "yes") {
            if(onyes) onyes();
            setVisible(yncpanel, false);
        }
        if(e.target.dataset.type === "no") {
            if(onno) onno();
            setVisible(yncpanel, false);
        }
        else if(e.target.dataset.type === "cancel" || e.target.classList.contains('panelbackground')) {
            if(oncancel) oncancel();
            setVisible(yncpanel, false);
        }
    };
    setVisible(yncpanel, true);
}

var settings = JSON.parse(localStorage.getItem('notes-settings') || '{"autosave": true, "fontfamily": ""}');
var notes = JSON.parse(localStorage.getItem('notes-notes') || '[{"title": "", "content": ""}]');

Object.defineProperty(settings, 'selected', {
    get: function() {
        return Number(localStorage.getItem('notes-selected') || 0);
    },
    set: function(newValue) {
        localStorage.setItem('notes-selected', newValue);
    }
});

/**
 * Read the notes from localStorage
 */
function loadNote() {
    notetitle.value = notes[settings.selected].title;
    notecontent.value = notes[settings.selected].content;
    setVisible(menupanel, false);
}
loadNote();

/**
 * Save note title to localStorage
 */
function saveNoteTitle() {
    notes[settings.selected].title = notetitle.value;
    localStorage.setItem('notes-notes', JSON.stringify(notes));
}
/**
 * Save note content to localStorage
 */
function saveNoteContent() {
    notes[settings.selected].content = notecontent.value;
    localStorage.setItem('notes-notes', JSON.stringify(notes));
}
/**
 * Save note content to localStorage
 */
function saveNote() {
    saveNoteTitle();
    saveNoteContent();
}

/**
 * Save notes to localStorage when notes changed if autosave is enabled
 */
if (settings.autosave) {
    notetitle.addEventListener('input', saveNoteTitle);
    notecontent.addEventListener('input', saveNoteContent);
}
else
    savebtn.classList.add('visible');

if (settings.fontfamily)
    document.querySelector('body').classList.add(settings.fontfamily);

/**
 * Save notes to localStorage when save button is clicked
 */
savebtn.addEventListener('click', saveNote);

/**
 * Save notes to localStorage when Ctrl + S
 */
window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
    }
});

settingsbtn.addEventListener('click', () => {
    settingspanel.querySelector('form input#settings-autosave').checked = settings.autosave;
    settingspanel.querySelector('form select#settings-fontfamily').value = settings.fontfamily;
    setVisible(settingspanel, true);
});

menubtn.addEventListener('click', () => {
    let newElems = [];
    notes.forEach((e, i) => {
        let newElem = document.createElement('li');
        newElem.innerHTML = `<button data-i="${i}">${e.title || "No Title"}</button>`;
        newElems.push(newElem);
    });
    menupanel.querySelector('ul').replaceChildren(...newElems);
    setVisible(menupanel, true);
});

document.querySelectorAll('div.panel div.panelbackground:not(.yncpanel)').forEach(e =>
    e.addEventListener('click', () => setVisible(e, false)));

menupanel.addEventListener('click', e => {
    if(e.target.dataset.i) {
        if(!settings.autosave)
            YNC("Do want to save?", "Do you want to save notes before closing?", () => {
                saveNote();
                settings.selected = Number(e.target.dataset.i);
                loadNote();
            }, () => {
                settings.selected = Number(e.target.dataset.i);
                loadNote();
            })
        else {
            settings.selected = Number(e.target.dataset.i);
            loadNote();
        }
    }
    else if(e.target.id === "addnotesbtn"){
        if(!settings.autosave)
            YNC("Do want to save?", "Do you want to save notes before closing?", () => {
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
    // else if(e.target.id === "editnotesbtn"){
    //     console.log("Edit");
    // }
});

/**
 * Save settings to localStorage
 */
function saveSettings(e) {
    e.preventDefault();

    // Hide settings panel
    setVisible(settingspanel, false);

    // Set settings values to the ones specified
    settings.autosave = e.target.querySelector('input#settings-autosave').checked;
    settings.fontfamily = e.target.querySelector('select#settings-fontfamily').value;

    // Save settings to localStorage
    localStorage.setItem('notes-settings', JSON.stringify(settings));

    // Apply settings
    if (settings.autosave) {
        notetitle.addEventListener('input', saveNoteTitle);
        notecontent.addEventListener('input', saveNoteContent);
        savebtn.classList.remove('visible');
    } else {
        notetitle.removeEventListener('input', saveNoteTitle);
        notecontent.removeEventListener('input', saveNoteContent)
        savebtn.classList.add('visible');
    }
    document.querySelector('body').classList.remove(...document.querySelector('body').classList);
    document.querySelector('body').classList.add(settings.fontfamily);
}

document.querySelector('#toolbar').addEventListener('click', e => {
    e.preventDefault();
    notecontent.focus();
});