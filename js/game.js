let paddle, blocks, balls, debrisParticles;
let score, lives, level, gameOver, won, paused, animId;
let levelOrder = [];
let keys = {};

function currentWord() {
    return WORDS[levelOrder[(level - 1) % levelOrder.length]];
}

function initGame() {
    score = 0; lives = 3; level = 1;
    gameOver = false; won = false; paused = false;
    resetBonuses();                              // ← замінено
    nextBonusAt = performance.now() + 8000;
    levelOrder = shuffle(WORDS.map((_, i) => i));
    document.getElementById('message').textContent = '';
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('f-status').textContent = 'ACTIVE';
    showWord(); initLevel(); updateHUD();
}

function initLevel() {
    paddle = { x: W / 2 - 40, y: PADDLE_Y, w: PADDLE_NORMAL_W, h: 6 };  // ← PADDLE_NORMAL_W
    balls = [newBall()];
    debrisParticles = [];
    blocks = [];
    resetBonuses();                              // ← замінено
    const alive = buildWordSet(currentWord());
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            blocks.push({
                x: OX + c * CELL, y: OY + r * CELL,
                w: SZ, h: SZ,
                alive: alive.has(r + ',' + c),
                pts: (ROWS - r) * 5
            });
        }
    }
}

function advanceLevel() {
    level++;
    if (level > WORDS.length) {
        won = true; saveBest(score);
        showMsg('ALLE WÖRTER — ' + score + ' PTS', 99999);
        document.getElementById('f-status').textContent = 'COMPLETE';
        document.getElementById('restartBtn').style.display = 'inline-block';
        renderFrame(); return;
    }
    showWord();
    showMsg('LVL ' + level + ' — ' + currentWord().word, 2000);
    initLevel();
    updateHUD();
    renderFrame();
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
}

function movePaddle() {
    if (keys['ArrowLeft'] || keys['a']) paddle.x -= 6;
    if (keys['ArrowRight'] || keys['d']) paddle.x += 6;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
}

function gameLoop() {
    if (paused) { renderFrame(); drawPauseCanvas(); return; }
    if (gameOver || won) { renderFrame(); return; }

    movePaddle();
    for (const b of balls) updateBall(b);
    updateDebris();
    maybeTrySpawnBonus();

    balls = balls.filter(b => b.y - b.r <= H);
    if (balls.length === 0) {
        lives--; updateHUD();
        if (lives <= 0) {
            gameOver = true; saveBest(score);
            showMsg('GAME OVER', 99999);
            document.getElementById('f-status').textContent = 'FAILED';
            document.getElementById('restartBtn').style.display = 'inline-block';
            renderFrame(); return;
        }
        balls = [newBall()];
        paddle.x = W / 2 - paddle.w / 2;
        debrisParticles = [];
    }

    if (blocks.every(b => !b.alive) && debrisParticles.length === 0) {
        advanceLevel(); return;
    }

    renderFrame();
    animId = requestAnimationFrame(gameLoop);
}

function openPauseMenu() {
    if (gameOver || won) return;
    paused = true;
    document.getElementById('f-status').textContent = 'PAUSED';
    renderFrame(); drawPauseCanvas();
    document.getElementById('pauseOverlay').classList.add('open');
}
function resumeGame() {
    document.getElementById('pauseOverlay').classList.remove('open');
    paused = false;
    document.getElementById('f-status').textContent = 'ACTIVE';
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(gameLoop);
}
function togglePause() {
    if (gameOver || won) return;
    if (paused) resumeGame(); else openPauseMenu();
}
function restartGame() {
    document.getElementById('pauseOverlay').classList.remove('open');
    document.getElementById('matchOverlay').classList.remove('open');
    cancelAnimationFrame(animId);
    initGame();
    animId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key.startsWith('Arrow')) e.preventDefault();
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    if (e.key === 'Escape') {
        if (document.getElementById('matchOverlay').classList.contains('open')) closeMatch();
        else if (document.getElementById('pauseOverlay').classList.contains('open')) resumeGame();
        else openPauseMenu();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('click', () => togglePause());
canvas.addEventListener('mousemove', e => {
    if (paused) return;
    const r = canvas.getBoundingClientRect();
    paddle.x = (e.clientX - r.left) * (W / r.width) - paddle.w / 2;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
});

let touchMoved = false;
canvas.addEventListener('touchstart', e => { touchMoved = false; e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', e => {
    touchMoved = true; e.preventDefault();
    if (paused) return;
    const r = canvas.getBoundingClientRect();
    paddle.x = (e.touches[0].clientX - r.left) * (W / r.width) - paddle.w / 2;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
}, { passive: false });
canvas.addEventListener('touchend', e => {
    if (!touchMoved) togglePause();
    e.preventDefault();
}, { passive: false });

initGame();
animId = requestAnimationFrame(gameLoop);