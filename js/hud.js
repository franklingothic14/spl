function loadBest() { return parseInt(localStorage.getItem('bde6') || '0', 10); }
function saveBest(s) { if (s > loadBest()) localStorage.setItem('bde6', String(s)); }

let flashTO = null;
function flashScore() {
    const el = document.getElementById('bigScore');
    el.classList.remove('score-flash'); void el.offsetWidth; el.classList.add('score-flash');
    if (flashTO) clearTimeout(flashTO);
    flashTO = setTimeout(() => el.classList.remove('score-flash'), 320);
}

let msgTO = null;
function showMsg(txt, dur = 2000) {
    document.getElementById('message').textContent = txt;
    if (msgTO) clearTimeout(msgTO);
    if (dur < 99999) msgTO = setTimeout(() => { document.getElementById('message').textContent = ''; }, dur);
}

function updateHUD() {
    saveBest(score);
    document.getElementById('scoreVal').textContent = score;
    document.getElementById('bigScoreVal').textContent = String(score).padStart(3, '0');
    document.getElementById('levelVal').textContent = level;
    document.getElementById('bestVal').textContent = loadBest();
    document.getElementById('f-level').textContent = String(level).padStart(2, '0');
    const lv = ['■■■', '■■□', '■□□', '□□□'];
    document.getElementById('f-lives').textContent = lv[3 - Math.max(0, Math.min(3, lives))];
}

function showWord() {
    const w = currentWord();
    const col = TYPE_COLORS[w.type] || '#A69B8D';
    document.getElementById('wType').textContent = TYPE_LABELS[w.type] || '';
    document.getElementById('wType').style.color = col;
    document.getElementById('wWord').textContent = w.word.charAt(0) + w.word.slice(1).toLowerCase();
    document.getElementById('wordTranslation').textContent = w.tr;
    document.getElementById('wordExample').textContent = w.ex || '';
    const d = document.getElementById('wordDisplay');
    d.classList.remove('word-pop'); void d.offsetWidth; d.classList.add('word-pop');
}