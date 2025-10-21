const firebaseConfig = {
    apiKey: "AIzaSyCiiSuG-XsE73TvTL2lHeIZ1w5PotlUTTY",
    authDomain: "brainrot-88434.firebaseapp.com",
    projectId: "brainrot-88434",
    storageBucket: "brainrot-88434.firebasestorage.app",
    messagingSenderId: "867519121615",
    appId: "1:867519121615:web:1e79d21a24776b13170fba"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ROWS = 5;
const COLS = 5;
const TOTAL_CELLS = ROWS * COLS;

let gameState = 'LOADING'; 
let balance = 0;
let betAmount = 10;
let minesCount = 3;
let revealedCells = 0;
let multiplier = 1.00;
let gameHistory = [];
let minePositions = [];
let currentUser = null;
let isDataLoaded = false;

const MULTIPLIERS = {
    1: [1.08, 1.17, 1.27, 1.39, 1.52, 1.68, 1.87, 2.10, 2.39, 2.76, 3.23, 3.85, 4.67, 5.77, 7.27, 9.36, 12.43, 17.07, 24.43, 37.65, 63.25, 126.50],
    2: [1.19, 1.42, 1.70, 2.05, 2.50, 3.08, 3.84, 4.85, 6.20, 8.06, 10.67, 14.42, 19.96, 28.42, 41.80, 64.60, 106.00, 190.80, 381.60, 954.00, 3816.00],
    3: [1.33, 1.78, 2.37, 3.20, 4.36, 6.03, 8.50, 12.24, 18.10, 27.68, 43.80, 72.80, 127.40, 237.30, 474.60, 1019.00, 2547.00, 7641.00, 30564.00],
    4: [1.54, 2.37, 3.70, 5.87, 9.50, 15.75, 26.87, 47.50, 88.12, 172.25, 354.50, 779.90, 1872.00, 5148.00, 17160.00, 68640.00],
    5: [1.82, 3.31, 6.10, 11.50, 22.33, 44.67, 93.33, 205.33, 482.00, 1205.00, 3254.00, 9762.00, 34167.00],
    6: [2.22, 5.00, 11.50, 27.17, 66.67, 171.43, 466.67, 1366.67, 4433.00, 16600.00],
    7: [2.86, 8.00, 23.33, 72.73, 242.42, 888.89, 3636.00, 18180.00],
    8: [4.00, 14.00, 54.67, 246.00, 1292.00, 8400.00],
    9: [6.00, 30.00, 180.00, 1440.00],
    10: [10.00, 70.00, 630.00],
    11: [20.00, 220.00],
    12: [50.00],
    13: [100.00],
    14: [200.00],
    15: [500.00],
    16: [1000.00],
    17: [2000.00],
    18: [5000.00],
    19: [10000.00],
    20: [20000.00],
    21: [50000.00],
    22: [100000.00],
    23: [200000.00],
    24: [500000.00]
};

document.addEventListener('DOMContentLoaded', function() {
    currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    loadGameData();
    createGameBoard();
    setupEventListeners();
});

async function loadGameData() {
    try {
        document.body.classList.add('loading');
        
        const doc = await db.collection('users').doc(currentUser).get();
        
        if (doc.exists) {
            const data = doc.data();
            balance = data.balance || 0;
            
            if (data.minesHistory) {
                gameHistory = data.minesHistory;
            }
            
            isDataLoaded = true;
            gameState = 'IDLE';
            updateUI();
            updateHistoryDisplay();
        } else {
            showMessage('Ошибка загрузки данных', 'lose');
        }
        
    } catch (error) {
        console.error('Load error:', error);
        showMessage('Ошибка загрузки данных', 'lose');
    } finally {
        document.body.classList.remove('loading');
    }
}

async function saveGameData() {
    if (!isDataLoaded || !currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser).set({
            balance: balance,
            minesHistory: gameHistory,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('Mines progress saved to Firebase. Balance:', balance);
    } catch (error) {
        console.error('Save error:', error);
    }
}

function createGameBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => revealCell(i));
        gameBoard.appendChild(cell);
    }
}

function setupEventListeners() {
    document.getElementById('minesSlider').addEventListener('input', function(e) {
        minesCount = parseInt(e.target.value);
        document.getElementById('minesValue').textContent = minesCount;
        if (gameState === 'IDLE') {
            updateMultiplier();
        }
    });
    
    document.getElementById('betAmount').addEventListener('input', function(e) {
        betAmount = parseInt(e.target.value) || 10;
        if (betAmount < 10) betAmount = 10;
        if (betAmount > 1000000) betAmount = 1000000;
        e.target.value = betAmount;
        if (gameState === 'IDLE') {
            updateMultiplier();
        }
    });

    document.addEventListener('click', function(e) {
        if ((gameState === 'LOST' || gameState === 'WON' || gameState === 'CASHED_OUT') && 
            !e.target.closest('.action-buttons')) {
            resetGame();
        }
    });
}

function updateUI() {
    document.getElementById('balance').textContent = balance;
    document.getElementById('betAmount').value = betAmount;
    document.getElementById('minesValue').textContent = minesCount;
    document.getElementById('minesSlider').value = minesCount;
    
    const playBtn = document.getElementById('playBtn');
    const cashoutBtn = document.getElementById('cashoutBtn');
    
    if (gameState === 'IDLE') {
        playBtn.disabled = false;
        cashoutBtn.disabled = true;
        playBtn.textContent = 'ИГРАТЬ';
        document.getElementById('currentMultiplier').textContent = '1.00x';
        document.getElementById('potentialWin').textContent = '0 ₿';
    } else if (gameState === 'PLAYING') {
        playBtn.disabled = true;
        cashoutBtn.disabled = false;
        playBtn.textContent = 'ИГРА...';
    } else {
        playBtn.disabled = true;
        cashoutBtn.disabled = true;
    }
}

function updateMultiplier() {
    if (gameState === 'IDLE') {
        multiplier = 1.00;
        document.getElementById('currentMultiplier').textContent = '1.00x';
        document.getElementById('potentialWin').textContent = '0 BR';
    } else {
        const currentMultiplier = calculateMultiplier(revealedCells);
        document.getElementById('currentMultiplier').textContent = currentMultiplier.toFixed(2) + 'x';
        document.getElementById('potentialWin').textContent = Math.floor(betAmount * currentMultiplier) + ' ₿';
    }
}

function calculateMultiplier(cellsOpened) {
    if (minesCount >= 1 && minesCount <= 24 && cellsOpened >= 0) {
        const multipliers = MULTIPLIERS[minesCount];
        if (multipliers && cellsOpened < multipliers.length) {
            return multipliers[cellsOpened];
        }
    }
    return 1.00;
}

async function startGame() {
    if (!isDataLoaded) {
        showMessage('Данные еще загружаются', 'lose');
        return;
    }
    
    if (balance < betAmount) {
        showMessage('Недостаточно коинов', 'lose');
        return;
    }
    
    if (minesCount >= TOTAL_CELLS) {
        showMessage('Огромное количество мин', 'lose');
        return;
    }
    
    try {
        balance -= betAmount;
        
        gameState = 'PLAYING';
        revealedCells = 0;
        multiplier = 1.00;
        
        createMines();
        
        updateUI();
        resetBoard();
        
        await saveGameData();
        
    } catch (error) {
        console.error('Start game error:', error);
        showMessage('Ошибка начала игры', 'lose');
    }
}

function createMines() {
    minePositions = [];
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        cell.classList.remove('mine', 'diamond', 'revealed');
        cell.dataset.mine = 'false';
    });
    
    while (minePositions.length < minesCount) {
        const randomPos = Math.floor(Math.random() * TOTAL_CELLS);
        if (!minePositions.includes(randomPos)) {
            minePositions.push(randomPos);
        }
    }
    
    minePositions.forEach(pos => {
        const cell = document.querySelector(`.cell[data-index="${pos}"]`);
        if (cell) {
            cell.dataset.mine = 'true';
        }
    });
}

function resetBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('revealed', 'mine', 'diamond');
    });
}

function revealCell(index) {
    if (gameState !== 'PLAYING') return;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell || cell.classList.contains('revealed')) return;
    
    cell.classList.add('revealed');
    
    if (cell.dataset.mine === 'true') {
        cell.classList.add('mine');
        endGame(false);
    } else {
        cell.classList.add('diamond');
        revealedCells++;
        multiplier = calculateMultiplier(revealedCells);
        
        showMultiplierPopup(multiplier);
        
        updateMultiplier();
        
        const totalRevealed = document.querySelectorAll('.cell.revealed').length;
        if (totalRevealed === TOTAL_CELLS - minesCount) {
            endGame(true);
        }
    }
}

function showMultiplierPopup(mult) {
    const display = document.getElementById('multiplierDisplay');
    display.textContent = mult.toFixed(2) + 'x';
    display.classList.add('show');
    
    setTimeout(() => {
        display.classList.remove('show');
    }, 1000);
}

async function cashout() {
    if (gameState !== 'PLAYING') return;
    
    try {
        const winAmount = Math.floor(betAmount * multiplier);
        balance += winAmount;
        
        endGame(true, true);
        showMessage(`Вы ухватили ${winAmount} BR! X: ${multiplier.toFixed(2)}x`, 'win');
        
        await saveGameData();
        
    } catch (error) {
        console.error('Cashout error:', error);
        showMessage('Ошибка вывода!', 'lose');
    }
}

async function endGame(isWin, isCashedOut = false) {
    try {
        if (isCashedOut) {
            gameState = 'CASHED_OUT';
        } else if (isWin) {
            const winAmount = Math.floor(betAmount * multiplier);
            balance += winAmount;
            gameState = 'WON';
        } else {
            gameState = 'LOST';
            revealAllMines();
        }
        
        addToHistory(isWin ? multiplier : 0, isCashedOut);
        
        await saveGameData();
        
        updateUI();

        setTimeout(() => {
            if (gameState !== 'IDLE') {
                resetGame();
            }
        }, 2000);
        
    } catch (error) {
        console.error('End game error:', error);
        showMessage('Ошибка завершения игры', 'lose');
    }
}

function resetGame() {
    if (balance < betAmount) {
        showMessage('Недостаточно средств для игры', 'lose');
        return;
    }

    gameState = 'IDLE';
    revealedCells = 0;
    multiplier = 1.00;
    
    resetBoard();
    updateUI();
}

function revealAllMines() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (cell.dataset.mine === 'true' && !cell.classList.contains('revealed')) {
            cell.classList.add('revealed', 'mine');
        }
    });
}

function addToHistory(multiplierValue, isCashedOut) {
    const historyItem = {
        multiplier: multiplierValue,
        isCashedOut: isCashedOut,
        timestamp: Date.now()
    };
    
    gameHistory.unshift(historyItem);
    if (gameHistory.length > 10) {
        gameHistory = gameHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyItems = document.getElementById('historyItems');
    historyItems.innerHTML = '';
    
    gameHistory.forEach(item => {
        const historyElement = document.createElement('div');
        historyElement.className = `history-item ${item.multiplier > 0 ? 'win' : ''}`;
        
        if (item.isCashedOut) {
            historyElement.textContent = '✅';
            historyElement.title = `Забрано на ${item.multiplier.toFixed(2)}x`;
        } else if (item.multiplier > 0) {
            historyElement.textContent = item.multiplier.toFixed(2) + 'x';
        } else {
            historyElement.textContent = '❌';
            historyElement.title = 'Проигрыш';
        }
        
        historyItems.appendChild(historyElement);
    });
}

function showMessage(text, type) {
    const messageElement = document.getElementById('resultMessage');
    messageElement.textContent = text;
    messageElement.className = 'result-message';
    if (type) {
        messageElement.classList.add(type);
    }
}

function changeBet(amount) {
    betAmount = Math.max(10, Math.min(10000, betAmount + amount));
    document.getElementById('betAmount').value = betAmount;
    if (gameState === 'IDLE') {
        updateMultiplier();
    }
}

function setQuickBet(amount) {
    betAmount = amount;
    document.getElementById('betAmount').value = betAmount;
    if (gameState === 'IDLE') {
        updateMultiplier();
    }
}

function goBack() {
    window.location.href = 'game.html';
}

window.addEventListener('beforeunload', function() {
    if (isDataLoaded) {
        saveGameData();
    }
});