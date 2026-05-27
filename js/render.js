function drawBg() {
    ctx.fillStyle = '#F2EFE8';
    ctx.fillRect(0, 0, W, H);
}

function drawBlocks() {
    ctx.fillStyle = TYPE_COLORS[currentWord().type] || '#3a3530';
    for (const b of blocks) if (b.alive) ctx.fillRect(b.x, b.y, b.w, b.h);
}

function drawPaddle() {
    ctx.fillStyle = bonusIs('magnet') ? '#7a9fc2'
        : bonusIs('wide') ? '#7ab8b8'
            : '#A69B8D';
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(paddle.x + 2, paddle.y, paddle.w - 4, 1);

    if (bonusIs('magnet')) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
        ctx.strokeStyle = `rgba(122,159,194,${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddle.x + 4, paddle.y + 3);
        ctx.lineTo(paddle.x + paddle.w - 4, paddle.y + 3);
        ctx.stroke();
    }
}

function drawBalls() {
    for (const b of balls) {
        const trailColor = b.pierce ? '194,122,122'
            : b.homing ? '122,159,194'
                : '166,155,141';

        for (let i = 0; i < b.trail.length; i++) {
            const p = i / b.trail.length;
            ctx.beginPath();
            ctx.arc(b.trail[i].x, b.trail[i].y, b.r * p * .6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${trailColor},${p * .25})`; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.pierce ? '#c27a7a' : b.homing ? '#7a9fc2' : '#3a3530';
        ctx.fill();

        if (b.pierce) {
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(194,122,122,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        if (b.homing) {
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(122,159,194,${0.4 + pulse * 0.5})`;
            ctx.lineWidth = 2; ctx.stroke();
        }
    }
}

function drawDebrisParticles() {
    for (const d of debrisParticles) {
        const fade = d.y > H - 30 ? Math.max(0, 1 - (d.y - (H - 30)) / 35) : 1;
        ctx.globalAlpha = fade;
        ctx.fillStyle = d.color || '#3a3530';
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