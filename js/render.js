function drawBg() {
    ctx.fillStyle = '#F2EFE8';
    ctx.fillRect(0, 0, W, H);
}

function drawBlocks() {
    ctx.fillStyle = TYPE_COLORS[currentWord().type] || '#3a3530';
    for (const b of blocks) if (b.alive) ctx.fillRect(b.x, b.y, b.w, b.h);
}

function drawPaddle() {
    ctx.fillStyle = bonusIs('wide') ? '#7ab8b8' : '#A69B8D';  // ← колір під wide бонус
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(paddle.x + 2, paddle.y, paddle.w - 4, 1);
}

function drawBalls() {
    for (const b of balls) {
        for (let i = 0; i < b.trail.length; i++) {
            const p = i / b.trail.length;
            ctx.beginPath();
            ctx.arc(b.trail[i].x, b.trail[i].y, b.r * p * .6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(166,155,141,${p * .25})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.pierce ? '#c27a7a' : '#3a3530'; ctx.fill();
        if (b.pierce) {
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(194,122,122,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
    }
}

function drawDebrisParticles() {
    for (const d of debrisParticles) {
        const fade = d.y > H - 30 ? Math.max(0, 1 - (d.y - (H - 30)) / 35) : 1;
        ctx.globalAlpha = fade;
        ctx.fillStyle = d.color || '#3a3530';    // ← використовуємо збережений колір
        ctx.fillRect(Math.round(d.x - d.sz / 2), Math.round(d.y - d.sz / 2),
            Math.ceil(d.sz), Math.ceil(d.sz));
    }
    ctx.globalAlpha = 1;
}

function drawPauseCanvas() {
    ctx.fillStyle = 'rgba(242,239,232,0.5)';
    ctx.fillRect(0, 0, W, H);
}

function renderFrame() {
    drawBg();
    drawBlocks();
    drawBonus();
    updateDrawBlastWaves();
    drawDebrisParticles();
    drawPaddle();
    drawBalls();
    drawBonusHUD();
    ctx.strokeStyle = 'rgba(166,155,141,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
}