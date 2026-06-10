let sectionCounter = 0;
let onChangeCallback = null;

function triggerChange() {
  if (onChangeCallback) onChangeCallback();
}

function createSectionEl(data = {}) {
  sectionCounter++;
  const id = `section-${sectionCounter}`;
  const div = document.createElement('div');
  div.className = 'editor-section fade-in';
  div.dataset.id = id;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'section-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Remove section';
  removeBtn.addEventListener('click', () => {
    div.remove();
    triggerChange();
  });

  const header = document.createElement('div');
  header.className = 'section-header';
  header.contentEditable = 'true';
  header.textContent = data.header || '';
  header.addEventListener('input', triggerChange);

  const chords = document.createElement('div');
  chords.className = 'section-chords';
  chords.contentEditable = 'true';
  chords.spellcheck = false;
  chords.textContent = data.chordLine || '';
  chords.addEventListener('input', triggerChange);

  const lyrics = document.createElement('div');
  lyrics.className = 'section-lyrics';
  lyrics.contentEditable = 'true';
  lyrics.textContent = data.lyricLine || '';
  lyrics.addEventListener('input', triggerChange);

  div.append(removeBtn, header, chords, lyrics);
  return div;
}

export function createEditor(container, onChange) {
  onChangeCallback = onChange;
  const sectionsContainer = container.querySelector('#editor-sections');
  const addBtn = container.querySelector('#add-section');

  function addSection(data = {}) {
    const el = createSectionEl(data);
    sectionsContainer.appendChild(el);
    triggerChange();
    return el;
  }

  addBtn.addEventListener('click', () => {
    const el = addSection();
    const header = el.querySelector('.section-header');
    setTimeout(() => header.focus(), 50);
  });

  return {
    addSection,
    getSections() {
      const items = sectionsContainer.querySelectorAll('.editor-section');
      return Array.from(items).map(el => ({
        header: el.querySelector('.section-header').textContent.trim(),
        chordLine: el.querySelector('.section-chords').textContent.trim(),
        lyricLine: el.querySelector('.section-lyrics').textContent.trim(),
      }));
    },
    loadSections(dataArray) {
      sectionsContainer.innerHTML = '';
      dataArray.forEach(d => addSection(d));
    },
    clear() {
      sectionsContainer.innerHTML = '';
    },
  };
}
