const SIZE = 4;

let boardEl = document.getElementById('board');
let scoreEl = document.getElementById('score');
let bestEl = document.getElementById('best');

let undoBtn = document.getElementById('undoBtn');
let restartBtn = document.getElementById('restartBtn');
let restartBtn2 = document.getElementById('restartBtn2');

let leaderBtn = document.getElementById('leaderBtn');
let leaderModal = document.getElementById('leaderModal');
let leaderTableBody = document.querySelector('#leaderTable tbody');

let closeLeader = document.getElementById('closeLeader');
let clearLeaders = document.getElementById('clearLeaders');

let gameOverModal = document.getElementById('gameOverModal');
let gameOverMsg = document.getElementById('gameOverMsg');

let saveWrap = document.getElementById('saveWrap');
let saveScoreBtn = document.getElementById('saveScoreBtn');
let playerName = document.getElementById('playerName');
let savedMsg = document.getElementById('savedMsg');

let mobileControls = document.getElementById('mobileControls');

let state = {grid: [], score: 0, best: 0, over: false};
let prevState = null;
let tileEls = [];

// Инициализация пустого грида
function makeEmptyGrid() {
    return Array.from({length: SIZE}, () => Array(SIZE).fill(0));
}

// Очистка элемента от всех дочерних элементов
function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Создание DOM-элементов плиток, вычисление размеров и размещение по сетке
function initTiles() {
    tileEls = [];
    clearElement(boardEl);
    const boardRect = boardEl.getBoundingClientRect();
    const gap = 12;
    const cellSize = (boardRect.width - (SIZE - 1) * gap) / SIZE;

    for (let r = 0; r < SIZE; r++) {
        tileEls[r] = [];
        for (let c = 0; c < SIZE; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.width = tile.style.height = `${cellSize}px`;
            const span = document.createElement('span');
            tile.appendChild(span);
            boardEl.appendChild(tile);
            tileEls[r][c] = tile;
        }
    }
}

// Обновление отображения: расставление плиток по сетке и изменение их значений
function renderGrid() {
    const boardRect = boardEl.getBoundingClientRect();
    const gap = 12;
    const cellSize = (boardRect.width - (SIZE - 1) * gap) / SIZE;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const val = state.grid[r][c];
            const tile = tileEls[r][c];

            if (tile.dataset.val != val) {
                tile.dataset.val = val;
                tile.className = 'tile' + (val ? ` v${val}` : '');
                const span = tile.querySelector('span');
                if (span) {
                    span.textContent = val || '';
                }
            }

            const x = c * (cellSize + gap);
            const y = r * (cellSize + gap);
            tile.style.width = tile.style.height = `${cellSize}px`;
            tile.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    scoreEl.textContent = state.score;
    bestEl.textContent = state.best;
}

// Перерендер при ресайзе окна
window.addEventListener('resize', renderGrid);

// Сохранение состояния
function saveToStorage() {
    localStorage.setItem('game_2048_state', JSON.stringify(state));
}

function loadFromStorage() {
    const s = localStorage.getItem('game_2048_state');
    if (s) {
        try {
            state = JSON.parse(s);
        } catch (e) {
            state = {grid: makeEmptyGrid(), score: 0, best: 0, over: false};
        }
    }
}

// Реализация обратного хода
function pushUndo() {
    prevState = JSON.parse(JSON.stringify(state));
}

function canUndo() {
    return prevState && !state.over;
}

undoBtn.addEventListener('click', () => {
    if (canUndo()) {
        state = JSON.parse(JSON.stringify(prevState));
        prevState = null;
        saveToStorage();
        renderGrid();
    }
});

// Инициализация новой игры
function startNew() {
    state = {
        grid: makeEmptyGrid(),
        score: 0,
        best: Math.max(state.best || 0, Number(localStorage.getItem('best_2048') || 0)),
        over: false
    };
    pushUndo();
    addRandomTiles(randInt(1, 3));
    saveToStorage();
    renderGrid();
}

restartBtn.addEventListener('click', () => {
    startNew();
});

restartBtn2.addEventListener('click', () => {
    gameOverModal.classList.remove('open');
    startNew();
});

function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// Логика появления новых плиток
function addRandomTiles(count = 1) {
    const empties = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state.grid[r][c] === 0) {
                empties.push([r, c]);
            }
        }
    }
    count = Math.min(count, empties.length);
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * empties.length);
        const [r, c] = empties.splice(idx, 1)[0];
        state.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

// Передвижение элементов
function move(dir) {
    if (state.over) return;
    pushUndo();
    let moved = false;
    let points = 0;

    const operateLine = line => {
        const arr = line.filter(v => v !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                points += arr[i];
                arr.splice(i + 1, 1);
            }
        }
        while (arr.length < SIZE) arr.push(0);
        return arr;
    };

    if (dir === 'left') {
        for (let r = 0; r < SIZE; r++) {
            const res = operateLine(state.grid[r]);
            for (let c = 0; c < SIZE; c++) {
                if (state.grid[r][c] !== res[c]) moved = true;
                state.grid[r][c] = res[c];
            }
        }
    } else if (dir === 'right') {
        for (let r = 0; r < SIZE; r++) {
            const res = operateLine(state.grid[r].slice().reverse()).reverse();
            for (let c = 0; c < SIZE; c++) {
                if (state.grid[r][c] !== res[c]) moved = true;
                state.grid[r][c] = res[c];
            }
        }
    } else if (dir === 'up') {
        for (let c = 0; c < SIZE; c++) {
            const col = [];
            for (let r = 0; r < SIZE; r++) {
                col.push(state.grid[r][c]);
            }
            const res = operateLine(col);
            for (let r = 0; r < SIZE; r++) {
                if (state.grid[r][c] !== res[r]) moved = true;
                state.grid[r][c] = res[r];
            }
        }
    } else if (dir === 'down') {
        for (let c = 0; c < SIZE; c++) {
            const col = [];
            for (let r = SIZE - 1; r >= 0; r--) {
                col.push(state.grid[r][c]);
            }
            const res = operateLine(col).reverse();
            for (let r = 0; r < SIZE; r++) {
                if (state.grid[r][c] !== res[r]) moved = true;
                state.grid[r][c] = res[r];
            }
        }
    }

    state.score += points;
    if (state.score > state.best) {
        state.best = state.score;
    }

    if (moved) {
        addRandomTiles(randInt(1, 2));
        saveToStorage();
        renderGrid();
        if (!canMove()) endGame();
    } else {
        prevState = null;
    }
}

// Условие, при выполнении которого проверяется, можем ли продолжать ходить или нет
function canMove() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state.grid[r][c] === 0) return true;
            const v = state.grid[r][c];
            if (c + 1 < SIZE && state.grid[r][c + 1] === v) return true;
            if (r + 1 < SIZE && state.grid[r + 1][c] === v) return true;
        }
    }
    return false;
}

// Функция завершения игры: state over, сохранение результата
function endGame() {
    state.over = true;

    saveToStorage();
    localStorage.setItem('best_2048', state.best);

    gameOverMsg.textContent = 'Игра окончена. Ваш счёт: ' + state.score;
    gameOverModal.classList.add('open');

    saveWrap.style.display = 'block';
    savedMsg.style.display = 'none';

    playerName.value = '';

    mobileControls.style.display = 'none';
}

// Движение плиток
window.addEventListener('keydown', e => {
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        move({ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'}[e.key]);
    }
});

// На мобилках нет клавиатуры :)
document.querySelectorAll('#mobileControls button').forEach(b => {
    b.addEventListener('click', () => {
        move(b.dataset.dir);
    });
});

let touchStart = null;

boardEl.addEventListener('touchstart', e => {
    if (e.touches.length === 1) touchStart = e.touches[0];
});

boardEl.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.clientX;
    const dy = t.clientY - touchStart.clientY;
    if (Math.abs(dx) + Math.abs(dy) < 30) {
        touchStart = null;
        return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
    } else {
        move(dy > 0 ? 'down' : 'up');
    }
    touchStart = null;
});

// Сохранение/загрузка лидеров
function loadLeaders() {
    return JSON.parse(localStorage.getItem('leaders_2048') || '[]');
}

function saveLeader(name, score) {
    const arr = loadLeaders();
    arr.push({name, score, date: new Date().toLocaleString()});
    arr.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaders_2048', JSON.stringify(arr.slice(0, 10)));
}

leaderBtn.addEventListener('click', () => {
    showLeaders();
});

closeLeader.addEventListener('click', () => {
    leaderModal.classList.remove('open');
    if (!state.over) mobileControls.style.display = 'flex';
});

clearLeaders.addEventListener('click', () => {
    localStorage.removeItem('leaders_2048');
    showLeaders();
});

function showLeaders() {
    clearElement(leaderTableBody);
    loadLeaders().forEach((it, i) => {
        const tr = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.textContent = i + 1;
        tr.appendChild(td1);
        
        const td2 = document.createElement('td');
        td2.textContent = escapeHtml(it.name);
        tr.appendChild(td2);
        
        const td3 = document.createElement('td');
        td3.textContent = it.score;
        tr.appendChild(td3);
        
        const td4 = document.createElement('td');
        td4.textContent = it.date;
        tr.appendChild(td4);
        
        leaderTableBody.appendChild(tr);
    });
    leaderModal.classList.add('open');
    mobileControls.style.display = 'none';
}

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

saveScoreBtn.addEventListener('click', () => {
    const name = playerName.value.trim() || 'Аноним';
    saveLeader(name, state.score);
    
    // Обновляем лучший результат в состоянии и сохраняем
    const newBest = Math.max(Number(localStorage.getItem('best_2048') || 0), state.score);
    state.best = newBest;
    localStorage.setItem('best_2048', newBest);
    saveToStorage();
    renderGrid();
    
    savedMsg.style.display = 'block';
    saveWrap.style.display = 'none';
});

gameOverModal.addEventListener('click', e => {
    if (e.target === gameOverModal) {
        gameOverModal.classList.remove('open');
    }
});

// Инициализация игры
function init() {
    loadFromStorage();
    if (!state.grid || state.grid.length !== SIZE) {
        state.grid = makeEmptyGrid();
    }
    let empty = true;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (state.grid[r][c]) empty = false;
        }
    }
    if (empty) {
        addRandomTiles(randInt(1, 3));
        saveToStorage();
    }

    initTiles();
    renderGrid();

    if (window.innerWidth <= 420) {
        mobileControls.style.display = 'flex';
    }
}

init();
