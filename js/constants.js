const W = 472, H = 300;
const SZ = 4, GAP = 1, CELL = SZ + GAP;
const COLS = 80;
const ROWS = 14;                                        // ← було 10, більше рядків = вище шрифт
const GRID_W = COLS * CELL - GAP;                 // 399px
const OX = Math.floor((W - GRID_W) / 2);      // 36px
const WORD_ZONE_H = ROWS * CELL - GAP;                 // 69px ← було 49px
const OY = Math.round(H * 0.32 - WORD_ZONE_H / 2);  // ← було 0.42, вище

const PADDLE_Y = H - 18;
const GRAVITY = 0.15;
const TRAIL_LEN = 18;
const BONUS_DUR = 20000;
const MAX_BALLS = 8;

const TYPE_COLORS = {
    adv: '#7a9fc2',
    part: '#c27a7a',
    konj: '#7ab87a',
    adj: '#b09fc2',
    phrase: '#c2a87a',
};
const TYPE_LABELS = {
    adv: 'Adverb',
    part: 'Partikel',
    konj: 'Konj.',
    adj: 'Adjektiv',
    phrase: 'Phrase',
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');