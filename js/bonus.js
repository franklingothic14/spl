let bonusItems = [];
let bonusActive = {};
let bonusTimers = {};
let nextBonusAt = 0;

const BONUS_TYPES = ['debris', 'pierce', 'wide', 'blast', 'life', 'magnet'];
const BONUS_COLORS = {
    debris: '#c2a87a',
    pierce: '#c27a7a',
    wide: '#7ab8b8',
    blast: '#b87ab8',
    life: '#e07a7a',
    magnet: '#7a9fc2',
};
const BONUS_ICONS = {
    debris: '★',
    pierce: '●',
    wide: '⬌',
    blast: '✸',
    life: '♥',
    magnet: '⊕',
};

const PADDLE_NORMAL_W = 80;
const PADDLE_WIDE_W = 140;
const BALL_NORMAL_R = 4;
const BLAST_R = 6;
let blastWaves = [];
let magnetBall = null;

// ── Spawn ──────────────────────────────────────────────────────
function spawnBonus() {
    const type = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
    const alive = blocks.filter(b => b.alive);
    if (alive.length < 5) return;
    const occupied = new Set(bonusItems.map(b => `${b.blockX},${b.blockY}`));
    const candidates = alive.filter(b => !occupied.has(`${b.x},${b.y}`));
    if (candidates.length === 0) return;
    const bl = candidates[Math.floor(Math.random() * candidates.length)];
    bonusItems.push({
        x: bl.x - 1, y: bl.y - 1,
        w: SZ + 2, h: SZ + 2,
        blockX: bl.x, blockY: bl.y,
        type, blink: 0
    });
}

// ── Draw tiles ─────────────────────────────────────────────────
function drawBonus() {
    for (const item of bonusItems) {
        item.blink = (item.blink + 1) % 30;
        ctx.globalAlpha = item.blink < 15 ? 1 : 0.45;
        ctx.fillStyle = BONUS_COLORS[item.type];
        ctx.beginPath();
        ctx.roundRect(item.x, item.y, item.w, item.h, 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `${SZ + 1}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(BONUS_ICONS[item.type], item.x + item.w / 2, item.y + item.h / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    ctx.globalAlpha = 1;
}

// ── Collect ────────────────────────────────────────────────────
function checkBonusCollect(b) {
    for (let i = bonusItems.length - 1; i >= 0; i--) {
        const item = bonusItems[i];
        if (b.x + b.r > item.x && b.x - b.r < item.x + item.w &&
            b.y + b.r > item.y && b.y - b.r < item.y + item.h) {
            activateBonus(item.type, item.blockX, item.blockY, b);
            bonusItems.splice(i, 1);
        }
    }
}

// ── Activate ───────────────────────────────────────────────────
function activateBonus(type, bx, by, ball) {
    if (type === 'blast') { triggerBlast(bx, by); return; }

    if (type === 'life') {
        lives = Math.min(lives + 1, 5);
        updateHUD();
        showMsg('♥ EXTRA LIFE!', 2000);
        nextBonusAt = performance.now() + 8000;
        return;
    }

    if (bonusTimers[type]) clearTimeout(bonusTimers[type]);
    bonusActive[type] = { expiresAt: performance.now() + BONUS_DUR };

    bonusTimers[type] = setTimeout(() => {
        delete bonusActive[type];
        if (type === 'wide') resetPaddleWidth();
        if (type === 'magnet') stopMagnet();
    }, BONUS_DUR);

    if (type === 'wide') applyWidePaddle();
    if (type === 'magnet') startMagnet(ball);

    const labels = {
        debris: '★ DEBRIS MULTIBALL',
        pierce: '● PIERCE BALL',
        wide: '⬌ WIDE PADDLE',
        magnet: '⊕ AUTO-PILOT',
    };
    showMsg(labels[type], 2500);
    nextBonusAt = performance.now() + 8000;
}

function bonusIs(type) {
    return !!(bonusActive[type] && bonusActive[type].expiresAt > performance.now());
}

// ── Wide paddle ────────────────────────────────────────────────
function applyWidePaddle() {
    const cx = paddle.x + paddle.w / 2;
    paddle.w = PADDLE_WIDE_W;
    paddle.x = Math.max(0, Math.min(W - paddle.w, cx - paddle.w / 2));
}
function resetPaddleWidth() {
    if (!paddle) return;
    const cx = paddle.x + paddle.w / 2;
    paddle.w = PADDLE_NORMAL_W;
    paddle.x = Math.max(0, Math.min(W - paddle.w, cx - paddle.w / 2));
}

// ── Magnet auto-land ───────────────────────────────────────────
function startMagnet(ball) {
    const target = ball || (balls && balls[0]) || null;
    if (!target) return;
    target.homing = true;
    magnetBall = target;
}
function stopMagnet() {
    if (magnetBall) magnetBall.homing = false;
    magnetBall = null;
}
function applyMagnetHoming(b) {
    if (!b.homing || b.dy <= 0) return;

    const targetX = paddle.x + paddle.w / 2;
    const diffX = targetX - b.x;
    const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);

    // поточний кут руху
    const angle = Math.atan2(b.dy, b.dx);

    // бажаний кут — в бік центру платформи
    const targetAngle = Math.atan2(paddle.y - b.y, diffX);

    // плавний поворот — не більше 0.04 рад за кадр
    let delta = targetAngle - angle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

    const newAngle = angle + Math.sign(delta) * Math.min(Math.abs(delta), 0.04);

    // зберігаємо швидкість, змінюємо лише напрямок
    b.dx = Math.cos(newAngle) * spd;
    b.dy = Math.sin(newAngle) * spd;
}
function tryReleaseMagnet() { return false; }

// ── Blast ──────────────────────────────────────────────────────
function triggerBlast(hitX, hitY) {
    const centerCol = Math.round((hitX - OX) / CELL);
    const centerRow = Math.round((hitY - OY) / CELL);
    let destroyed = 0;
    for (const bl of blocks) {
        if (!bl.alive) continue;
        const col = Math.round((bl.x - OX) / CELL);
        const row = Math.round((bl.y - OY) / CELL);
        if (Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2) <= BLAST_R) {
            bl.alive = false; score += bl.pts;
            spawnDebrisParticles(bl.x, bl.y, TYPE_COLORS[currentWord().type]);
            destroyed++;
        }
    }
    blastWaves.push({ x: hitX + SZ / 2, y: hitY + SZ / 2, r: 0, alpha: 1 });
    if (destroyed > 0) { flashScore(); updateHUD(); }
    showMsg(`✸ BLAST — ${destroyed} blocks!`, 2000);
    nextBonusAt = performance.now() + 8000;
}
function updateDrawBlastWaves() {
    for (let i = blastWaves.length - 1; i >= 0; i--) {
        const w = blastWaves[i];
        w.r += 4; w.alpha -= 0.05;
        if (w.alpha <= 0) { blastWaves.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(184,122,184,${w.alpha})`;
        ctx.lineWidth = 2; ctx.stroke();
    }
}

// ── Bonus HUD ──────────────────────────────────────────────────
function drawBonusHUD() {
    const timed = ['debris', 'pierce', 'wide', 'magnet'].filter(t => bonusIs(t));
    if (timed.length === 0) return;

    const pillW = 56, pillH = 14, gap = 5, pad = 8;
    let x = W - pad - pillW;
    let y = H - pad - pillH;

    for (const type of timed) {
        const rem = Math.max(0, bonusActive[type].expiresAt - performance.now()) / 1000;
        const pct = rem / (BONUS_DUR / 1000);
        const col = BONUS_COLORS[type];

        ctx.fillStyle = 'rgba(242,239,232,0.92)';
        ctx.beginPath(); ctx.roundRect(x, y, pillW, pillH, pillH / 2); ctx.fill();

        ctx.save();
        ctx.beginPath(); ctx.roundRect(x, y, pillW, pillH, pillH / 2); ctx.clip();
        ctx.fillStyle = col + '55';
        ctx.fillRect(x, y, pillW * pct, pillH);
        ctx.restore();

        ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x, y, pillW, pillH, pillH / 2); ctx.stroke();

        ctx.fillStyle = col;
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(BONUS_ICONS[type], x + 6, y + pillH / 2);

        ctx.font = '7px sans-serif';
        ctx.fillStyle = '#3a3530';
        ctx.textAlign = 'right';
        ctx.fillText(rem.toFixed(1) + 's', x + pillW - 5, y + pillH / 2);

        y -= pillH + gap;
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ── Spawn tick ─────────────────────────────────────────────────
function maybeTrySpawnBonus() {
    if (performance.now() > nextBonusAt) {
        if (Math.random() < 0.016) spawnBonus();
    }
}

// ── Reset ──────────────────────────────────────────────────────
function resetBonuses() {
    bonusItems = [];
    bonusActive = {};
    blastWaves = [];
    if (magnetBall) magnetBall.homing = false;
    magnetBall = null;
    for (const t of BONUS_TYPES) {
        if (bonusTimers[t]) { clearTimeout(bonusTimers[t]); delete bonusTimers[t]; }
    }
}