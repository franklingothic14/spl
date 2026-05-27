let bonusItems = [];
let bonusActive = {};     // { debris, pierce, wide } → кожен має expiresAt або null
let bonusTimers = {};     // окремий таймер для кожного типу
let nextBonusAt = 0;

const BONUS_TYPES = ['debris', 'pierce', 'wide', 'blast'];
const BONUS_COLORS = {
    debris: '#c2a87a',
    pierce: '#c27a7a',
    wide: '#7ab8b8',
    blast: '#b87ab8',
};
const BONUS_ICONS = {
    debris: '★',
    pierce: '●',
    wide: '⬌',
    blast: '✸',
};

const PADDLE_NORMAL_W = 80;
const PADDLE_WIDE_W = 140;
const BLAST_R = 6;
let blastWaves = [];

// ── Spawn ─────────────────────────────────────────────────────
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

// ── Draw tiles ────────────────────────────────────────────────
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

// ── Collect ───────────────────────────────────────────────────
function checkBonusCollect(b) {
    for (let i = bonusItems.length - 1; i >= 0; i--) {
        const item = bonusItems[i];
        if (b.x + b.r > item.x && b.x - b.r < item.x + item.w &&
            b.y + b.r > item.y && b.y - b.r < item.y + item.h) {
            activateBonus(item.type, item.blockX, item.blockY);
            bonusItems.splice(i, 1);
        }
    }
}

// ── Activate ──────────────────────────────────────────────────
function activateBonus(type, bx, by) {
    if (type === 'blast') {
        triggerBlast(bx, by);
        return;
    }

    // Якщо вже активний — продовжити таймер
    if (bonusTimers[type]) clearTimeout(bonusTimers[type]);

    bonusActive[type] = { expiresAt: performance.now() + BONUS_DUR };

    bonusTimers[type] = setTimeout(() => {
        delete bonusActive[type];
        if (type === 'wide') resetPaddleWidth();
    }, BONUS_DUR);

    if (type === 'wide') applyWidePaddle();

    const labels = {
        debris: '★ DEBRIS MULTIBALL 20s',
        pierce: '● PIERCE BALL 20s',
        wide: '⬌ WIDE PADDLE 20s',
    };
    showMsg(labels[type], 2500);
    nextBonusAt = performance.now() + 8000;
}

// ── Helpers: check if a bonus type is currently active
function bonusIs(type) {
    return !!(bonusActive[type] && bonusActive[type].expiresAt > performance.now());
}

// ── Wide paddle ───────────────────────────────────────────────
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

// ── Blast ─────────────────────────────────────────────────────
function triggerBlast(hitX, hitY) {
    const centerCol = Math.round((hitX - OX) / CELL);
    const centerRow = Math.round((hitY - OY) / CELL);

    let destroyed = 0;
    for (const bl of blocks) {
        if (!bl.alive) continue;
        const col = Math.round((bl.x - OX) / CELL);
        const row = Math.round((bl.y - OY) / CELL);
        const dist = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
        if (dist <= BLAST_R) {
            bl.alive = false;
            score += bl.pts;
            spawnDebrisParticles(bl.x, bl.y);
            destroyed++;
        }
    }

    blastWaves.push({
        x: hitX + SZ / 2, y: hitY + SZ / 2,
        r: 0, maxR: BLAST_R * CELL,
        alpha: 1
    });

    if (destroyed > 0) { flashScore(); updateHUD(); }
    showMsg(`✸ BLAST — ${destroyed} blocks!`, 2000);
    nextBonusAt = performance.now() + 8000;
}

// ── Blast wave animation ──────────────────────────────────────
function updateDrawBlastWaves() {
    for (let i = blastWaves.length - 1; i >= 0; i--) {
        const w = blastWaves[i];
        w.r += 4;
        w.alpha -= 0.05;
        if (w.alpha <= 0) { blastWaves.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(184,122,184,${w.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ── HUD bar — показує всі активні бонуси окремими смужками ───
function drawBonusHUD() {
    const active = ['debris', 'pierce', 'wide'].filter(t => bonusIs(t));
    if (active.length === 0) return;

    const barH = 3;
    const totalH = active.length * (barH + 1);
    let yOff = H - totalH - 2;

    for (const type of active) {
        const rem = Math.max(0, bonusActive[type].expiresAt - performance.now()) / 1000;
        const pct = rem / (BONUS_DUR / 1000);
        ctx.fillStyle = BONUS_COLORS[type] + '40';
        ctx.fillRect(0, yOff, W, barH);
        ctx.fillStyle = BONUS_COLORS[type];
        ctx.fillRect(0, yOff, W * pct, barH);
        yOff += barH + 1;
    }
}

// ── Spawn tick ────────────────────────────────────────────────
function maybeTrySpawnBonus() {
    if (performance.now() > nextBonusAt) {
        if (Math.random() < 0.016) spawnBonus();
    }
}

// ── Reset on new level/game ───────────────────────────────────
function resetBonuses() {
    bonusItems = [];
    bonusActive = {};
    blastWaves = [];
    for (const t of BONUS_TYPES) {
        if (bonusTimers[t]) { clearTimeout(bonusTimers[t]); delete bonusTimers[t]; }
    }
    resetPaddleWidth();
}