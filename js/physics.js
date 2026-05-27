function shuffle(a) {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

function newBall() {
    const spd = 3.2 + Math.min(level - 1, 40) * 0.07;
    const dir = Math.random() > 0.5 ? 1 : -1;
    return {
        x: W / 2, y: 50, r: 4, dx: dir * spd * 0.65, dy: spd,
        isMini: false, pierce: false, trail: []
    };
}

function spawnDebrisParticles(bx, by, color) {   // ← додано color
    const cx = bx + SZ / 2, cy = by + SZ / 2;
    for (let i = 0; i < 6; i++) {
        const a = Math.PI * 2 * i / 6 + (Math.random() - .5) * .5;
        const sp = 1 + Math.random() * 2.5;
        debrisParticles.push({
            x: cx, y: cy,
            dx: Math.cos(a) * sp, dy: Math.sin(a) * sp + .5,
            sz: 1.5 + Math.random() * 2,
            color                          // ← зберігаємо колір
        });
    }
}

function debrisToMiniball(d) {
    if (balls.length >= MAX_BALLS) return;
    const spd = 3.5 + Math.min(level, 30) * .08;
    const hit = (d.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    balls.push({
        x: d.x, y: paddle.y - 5, r: 4,
        dx: hit * spd * .8 + (Math.random() - .5),
        dy: -(spd + Math.random()),
        isMini: false,
        pierce: bonusIs('pierce'),
        trail: []
    });
}

function updateBall(b) {
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > TRAIL_LEN) b.trail.shift();
    b.x += b.dx; b.y += b.dy;

    if (b.x - b.r < 0) { b.x = b.r; b.dx = Math.abs(b.dx); }
    if (b.x + b.r > W) { b.x = W - b.r; b.dx = -Math.abs(b.dx); }
    if (b.y - b.r < 0) { b.y = b.r; b.dy = Math.abs(b.dy); }

    if (b.dy > 0 && b.x > paddle.x && b.x < paddle.x + paddle.w &&
        b.y + b.r >= paddle.y && b.y + b.r <= paddle.y + paddle.h + 8) {
        b.y = paddle.y - b.r;
        const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        const hit = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        b.dx = hit * Math.max(spd, 3.0);
        b.dy = -Math.abs(b.dy);
        b.trail = [];
        b.pierce = bonusIs('pierce');
    }

    checkBonusCollect(b);

    let hitsLeft = b.pierce ? 2 : 1;
    for (const bl of blocks) {
        if (!bl.alive || hitsLeft <= 0) continue;
        if (b.x + b.r > bl.x && b.x - b.r < bl.x + bl.w &&
            b.y + b.r > bl.y && b.y - b.r < bl.y + bl.h) {
            bl.alive = false;
            score += bl.pts;
            flashScore(); updateHUD();
            spawnDebrisParticles(bl.x, bl.y, TYPE_COLORS[currentWord().type]);  // ← передаємо колір
            hitsLeft--;
            if (!b.pierce) {
                const ot = b.y + b.r - bl.y, ob = bl.y + bl.h - (b.y - b.r);
                const ol = b.x + b.r - bl.x, or2 = bl.x + bl.w - (b.x - b.r);
                if (Math.min(ot, ob) < Math.min(ol, or2)) b.dy *= -1; else b.dx *= -1;
            }
            break;
        }
    }
}

function updateDebris() {
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
        const d = debrisParticles[i];
        d.dy += GRAVITY; d.x += d.dx; d.y += d.dy;
        if (d.x < 0) { d.x = 0; d.dx = Math.abs(d.dx) * .5; }
        if (d.x > W) { d.x = W; d.dx = -Math.abs(d.dx) * .5; }
        if (d.dy > 0 && d.x > paddle.x && d.x < paddle.x + paddle.w &&
            d.y + d.sz / 2 >= paddle.y && d.y - d.sz / 2 <= paddle.y + paddle.h + 4) {
            if (bonusIs('debris')) debrisToMiniball(d);
            debrisParticles.splice(i, 1); continue;
        }
        if (d.y > H + 30) { debrisParticles.splice(i, 1); continue; }
    }
}