const SIZE = 4;

let boardEl = document.getElementById('board');
let scoreEl = document.getElementById('score');
let bestEl = document.getElementById('best');

let state = {grid:[], score:0, best:0, over:false};
let tileEls = [];

let restartBtn = document.getElementById('restartBtn');

function makeEmptyGrid(){ return Array.from({length:SIZE},()=>Array(SIZE).fill(0)); }

function initTiles(){
    tileEls = [];
    boardEl.innerHTML = '';
    const boardRect = boardEl.getBoundingClientRect();
    const gap = 12;
    const cellSize = (boardRect.width - (SIZE - 1) * gap) / SIZE;

    for(let r=0;r<SIZE;r++){
        tileEls[r] = [];
        for(let c=0;c<SIZE;c++){
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.width = tile.style.height = `${cellSize}px`;
            tile.innerHTML = '<span></span>';
            boardEl.appendChild(tile);
            tileEls[r][c] = tile;
        }
    }
}

function renderGrid() {
    const boardRect = boardEl.getBoundingClientRect();
    const gap = 12;
    const cellSize = (boardRect.width - (SIZE - 1) * gap) / SIZE;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const val = state.grid[r][c];
            const tile = tileEls[r][c];

            if(tile.dataset.val != val){
                tile.dataset.val = val;
                tile.className = 'tile' + (val ? ` v${val}` : '');
                tile.querySelector('span').textContent = val || '';
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

window.addEventListener('resize', renderGrid);

function saveToStorage(){ localStorage.setItem('game_2048_state', JSON.stringify(state)); }
function loadFromStorage(){
    const s = localStorage.getItem('game_2048_state');
    if(s){ try{ state=JSON.parse(s); }catch(e){ state={grid:makeEmptyGrid(),score:0,best:0,over:false} } }
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function addRandomTiles(count=1){
    const empties=[];
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(state.grid[r][c]===0) empties.push([r,c]);
    count=Math.min(count,empties.length);
    for(let i=0;i<count;i++){
        const idx=Math.floor(Math.random()*empties.length);
        const [r,c]=empties.splice(idx,1)[0];
        state.grid[r][c] = Math.random()<0.9?2:4;
    }
}

function startNew(){
    state={grid:makeEmptyGrid(), score:0, best:Math.max(state.best||0, Number(localStorage.getItem('best_2048')||0)), over:false};
    addRandomTiles(randInt(1,3));
    saveToStorage();
    renderGrid();
}

restartBtn.addEventListener('click',()=>{ startNew(); });


