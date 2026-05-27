function loadBest() { return parseInt(localStorage.getItem('bde6') || '0', 10); }
function saveBest(s) { if (s > loadBest()) localStorage.setItem('bde6', String(s)); }

// ── Leaderboard ───────────────────────────────────────────────
function loadLeaderboard() {
    try { return JSON.parse(localStorage.getItem('bde6_lb') || '[]'); }
    catch { return []; }
}
function saveToLeaderboard(s) {
    const lb = loadLeaderboard();
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    lb.push({ score: s, date });
    lb.sort((a, b) => b.score - a.score);
    lb.splice(8);  // зберігаємо топ 8
    localStorage.setItem('bde6_lb', JSON.stringify(lb));
}

function showLeaderboard() {
    const lb = loadLeaderboard();
    const list = document.getElementById('lbList');
    list.innerHTML = '';
    if (lb.length === 0) {
        list.innerHTML = '<div class="lbEmpty">Ще немає результатів</div>';
    } else {
        lb.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'lbRow' + (i === 0 ? ' lbFirst' : '');
            row.innerHTML = `
        <span class="lbRank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
        <span class="lbScore">${entry.score}</span>
        <span class="lbDate">${entry.date}</span>`;
            list.appendChild(row);
        });
    }
    document.getElementById('lbOverlay').classList.add('open');
}

function closeLeaderboard() {
    document.getElementById('lbOverlay').classList.remove('open');
}

// ── Flash / msg ───────────────────────────────────────────────
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
    const lv = ['■■■■■', '■■■■□', '■■■□□', '■■□□□', '■□□□□', '□□□□□'];
    document.getElementById('f-lives').textContent = lv[5 - Math.max(0, Math.min(5, lives))];
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