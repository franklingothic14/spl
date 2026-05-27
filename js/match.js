let matchSelectedDE = null, matchSelectedUA = null;
let matchDone = 0, matchTotal = 0, matchFailed = false;

function openMatch() {
    document.getElementById('pauseOverlay').classList.remove('open');
    const cur = currentWord();
    const others = shuffle(WORDS.filter(w => w !== cur)).slice(0, 4);
    const pairs = [cur, ...others];
    matchTotal = pairs.length; matchDone = 0; matchFailed = false;
    matchSelectedDE = null; matchSelectedUA = null;

    const deW = shuffle([...pairs]);
    const uaW = shuffle([...pairs]);

    document.getElementById('colDE').innerHTML = '';
    document.getElementById('colUA').innerHTML = '';

    deW.forEach(w => {
        const el = document.createElement('div');
        el.className = 'mItem';
        el.textContent = w.word.charAt(0) + w.word.slice(1).toLowerCase();
        el.addEventListener('click', () => matchClickDE(el, w));
        document.getElementById('colDE').appendChild(el);
    });
    uaW.forEach(w => {
        const el = document.createElement('div');
        el.className = 'mItem';
        el.textContent = w.tr;
        el.addEventListener('click', () => matchClickUA(el, w));
        document.getElementById('colUA').appendChild(el);
    });

    document.getElementById('matchResult').textContent = '';
    document.getElementById('matchClose').style.display = 'none';
    document.getElementById('matchOverlay').classList.add('open');
}

function matchClickDE(el, w) {
    if (el.classList.contains('correct')) return;
    document.querySelectorAll('#colDE .mItem.selected').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    matchSelectedDE = { el, w };
    tryMatch();
}

function matchClickUA(el, w) {
    if (el.classList.contains('correct')) return;
    document.querySelectorAll('#colUA .mItem.selected').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    matchSelectedUA = { el, w };
    tryMatch();
}

function tryMatch() {
    if (!matchSelectedDE || !matchSelectedUA) return;
    const de = matchSelectedDE, ua = matchSelectedUA;
    matchSelectedDE = null; matchSelectedUA = null;

    if (de.w.word === ua.w.word) {
        de.el.classList.remove('selected'); de.el.classList.add('correct');
        ua.el.classList.remove('selected'); ua.el.classList.add('correct');
        matchDone++;

        if (matchDone === matchTotal) {
            if (!matchFailed) {
                // ── Perfect: закриваємо overlay → advanceLevel запускає loop сам
                document.getElementById('matchResult').textContent = '✓ Perfect! +200pts — next level…';
                score += 200; updateHUD();
                setTimeout(() => {
                    document.getElementById('matchOverlay').classList.remove('open');
                    paused = false;
                    document.getElementById('f-status').textContent = 'ACTIVE';
                    cancelAnimationFrame(animId);  // вбити будь-який зависший loop
                    advanceLevel();                // інкремент + initLevel + renderFrame + rAF
                }, 1200);
            } else {
                // ── З помилками: тільки кнопка Close, без skip
                document.getElementById('matchResult').textContent = 'All matched (with mistakes — no skip)';
                document.getElementById('matchClose').style.display = 'block';
            }
        }
    } else {
        matchFailed = true;
        de.el.classList.remove('selected'); de.el.classList.add('wrong');
        ua.el.classList.remove('selected'); ua.el.classList.add('wrong');
        document.getElementById('matchResult').textContent = '✗ Not a match, try again';
        setTimeout(() => {
            de.el.classList.remove('wrong');
            ua.el.classList.remove('wrong');
        }, 700);
    }
}

function closeMatch() {
    document.getElementById('matchOverlay').classList.remove('open');
    paused = false;
    document.getElementById('f-status').textContent = 'ACTIVE';
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
}