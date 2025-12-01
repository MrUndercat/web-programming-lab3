const SIZE = 4;

let boardEl = document.getElementById('board');
let scoreEl = document.getElementById('score');
let bestEl = document.getElementById('best');

let state = {grid:[], score:0, best:0, over:false};
let tileEls = [];

let restartBtn = document.getElementById('restartBtn');
let undoBtn = document.getElementById('undoBtn');

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

function move(dir){
    if(state.over) return;
    pushUndo();
    let moved=false;
    let points=0;

    const operateLine = line=>{
        const arr=line.filter(v=>v!==0);
        for(let i=0;i<arr.length-1;i++){
            if(arr[i]===arr[i+1]){ arr[i]*=2; points+=arr[i]; arr.splice(i+1,1); }
        }
        while(arr.length<SIZE) arr.push(0);
        return arr;
    };

    if(dir==='left') for(let r=0;r<SIZE;r++){ const res=operateLine(state.grid[r]); for(let c=0;c<SIZE;c++){ if(state.grid[r][c]!==res[c]) moved=true; state.grid[r][c]=res[c]; } }
    else if(dir==='right') for(let r=0;r<SIZE;r++){ const res=operateLine(state.grid[r].slice().reverse()).reverse(); for(let c=0;c<SIZE;c++){ if(state.grid[r][c]!==res[c]) moved=true; state.grid[r][c]=res[c]; } }
    else if(dir==='up') for(let c=0;c<SIZE;c++){ const col=[]; for(let r=0;r<SIZE;r++) col.push(state.grid[r][c]); const res=operateLine(col); for(let r=0;r<SIZE;r++){ if(state.grid[r][c]!==res[r]) moved=true; state.grid[r][c]=res[r]; } }
    else if(dir==='down') for(let c=0;c<SIZE;c++){ const col=[]; for(let r=SIZE-1;r>=0;r--) col.push(state.grid[r][c]); const res=operateLine(col).reverse(); for(let r=0;r<SIZE;r++){ if(state.grid[r][c]!==res[r]) moved=true; state.grid[r][c]=res[r]; } }

    state.score+=points;
    if(state.score>state.best) state.best=state.score;

    if(moved){
        addRandomTiles(randInt(1,2));
        saveToStorage();
        renderGrid();
        if(!canMove()) endGame();
    } else prevState=null;
}

function canMove(){
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
        if(state.grid[r][c]===0) return true;
        const v=state.grid[r][c];
        if(c+1<SIZE && state.grid[r][c+1]===v) return true;
        if(r+1<SIZE && state.grid[r+1][c]===v) return true;
    }
    return false;
}

window.addEventListener('keydown', e=>{
    if(e.key.startsWith('Arrow')){
        e.preventDefault();
        move({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key]);
    }
});

let touchStart=null;

boardEl.addEventListener('touchstart', e=>{ if(e.touches.length===1) touchStart=e.touches[0]; });
boardEl.addEventListener('touchend', e=>{
    if(!touchStart) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStart.clientX;
    const dy=t.clientY-touchStart.clientY;
    if(Math.abs(dx)+Math.abs(dy)<30){ touchStart=null; return; }
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
    else move(dy>0?'down':'up');
    touchStart=null;
});

let prevState = null;
function pushUndo(){ prevState = JSON.parse(JSON.stringify(state)); }
function canUndo(){ return prevState && !state.over; }

undoBtn.addEventListener('click',()=>{
    if(canUndo()){
        state=JSON.parse(JSON.stringify(prevState));
        prevState=null;
        saveToStorage();
        renderGrid();
    }
});




