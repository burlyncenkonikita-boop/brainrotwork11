const firebaseConfig = {
    apiKey: "AIzaSyCiiSuG-XsE73TvTL2lHeIZ1w5PotlUTTY",
    authDomain: "brainrot-88434.firebaseapp.com",
    projectId: "brainrot-88434",
    storageBucket: "brainrot-88434.firebasestorage.app",
    messagingSenderId: "867519121615",
    appId: "1:867519121615:web:1e79d21a24776b13170fba"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const rewardsData = [
    50, 100, 115, 145, 150, 180, 200, 220, 225, 250,
    275, 300, 312, 340, 378, 400, 410, 425, 440, 455,
    460, 475, 480, 484, 488, 492, 496, 497, 499, 500
];

let currentDay = 0;
let lastClaimDate = null;
let balance = 0;
let energy = 1000;
const maxEnergy = 1000;
let lastUpdateTime = Date.now();
let currentUser = null;
let isDataLoaded = false;

const balanceElement = document.getElementById('balance');
const coinElement = document.getElementById('coin');
const energyElement = document.getElementById('energyValue');
const userDisplayName = document.getElementById('userDisplayName');

document.addEventListener('DOMContentLoaded', function() {
    currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    userDisplayName.textContent = currentUser;
    initGame();
    energyRestoreLoop();
});

function initGame() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }
    
    loadGameData();
}

function showMainScreen() {
    document.getElementById('mainScreen').classList.add('active');
    document.getElementById('minigamesScreen').classList.remove('active');
    
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="main"]').classList.add('active');
}

function showMinigames() {
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('minigamesScreen').classList.add('active');
    
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="minigames"]').classList.add('active');
}

function showFarm() {
    alert('Фарм скоро будет добавлен!');
    showMainScreen();
}

function startGame(gameType) {
    const gameUrls = {
        'mines': 'mines.html',
        'plinko': 'https://brainrot-88434.web.app/plinko', 
        'dice': 'https://brainrot-88434.web.app/dice'
    };
    
    if (gameUrls[gameType]) {
        window.location.href = gameUrls[gameType];
    } else {
        alert('Игра временно недоступна!');
    }
}

function startLuckyJet() {
    window.location.href = 'luckyjet.html';
}

function goBackToMinigames() {
    window.location.href = 'game.html';
}

async function loadGameData() {
    try {
        console.log('Loading data for user:', currentUser);
        const doc = await db.collection('users').doc(currentUser).get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('Loaded from Firebase:', data);
            
            balance = data.balance || 0;
            energy = data.energy || 1000;
            lastUpdateTime = data.lastUpdateTime || Date.now();
            
            restoreEnergyFromTime();
        } else {
            await createNewUser();
        }
        
        updateDisplay();
        isDataLoaded = true;
        console.log('Game loaded. Balance:', balance, 'Energy:', energy);
        
    } catch (error) {
        console.error('Load error:', error);
        updateDisplay();
        isDataLoaded = true;
    }
}

async function createNewUser() {
    try {
        await db.collection('users').doc(currentUser).set({
            username: currentUser,
            balance: 0,
            energy: 1000,
            lastUpdateTime: Date.now(),
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('New user created in Firebase');
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

async function saveGameData() {
    if (!isDataLoaded || !currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser).set({
            balance: balance,
            energy: energy,
            lastUpdateTime: lastUpdateTime,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('Progress saved to Firebase. Balance:', balance, 'Energy:', energy);
    } catch (error) {
        console.error('Save error:', error);
    }
}

function restoreEnergyFromTime() {
    const currentTime = Date.now();
    const timePassed = currentTime - lastUpdateTime;
    const energyToRestore = Math.floor(timePassed / 1000);
    
    if (energyToRestore > 0) {
        energy = Math.min(maxEnergy, energy + energyToRestore);
        lastUpdateTime = currentTime;
        saveGameData();
    }
}

function updateDisplay() {
    balanceElement.textContent = `Brainrot: ${balance}`;
    energyElement.textContent = energy;
}

coinElement.addEventListener('click', function(event) {
    if (!isDataLoaded || energy <= 0) return;
    
    balance++;
    energy--;
    updateDisplay();
    saveGameData();
    
    const clickAnimation = document.createElement('div');
    clickAnimation.className = 'click-animation';
    clickAnimation.textContent = '+1';
    clickAnimation.style.left = (event.offsetX - 15) + 'px';
    clickAnimation.style.top = (event.offsetY - 15) + 'px';
    
    coinElement.appendChild(clickAnimation);
    
    setTimeout(() => {
        clickAnimation.remove();
    }, 1000);
});

function energyRestoreLoop() {
    if (!isDataLoaded) {
        requestAnimationFrame(energyRestoreLoop);
        return;
    }
    
    const currentTime = Date.now();
    const timePassed = currentTime - lastUpdateTime;
    const energyToRestore = Math.floor(timePassed / 1000);
    
    if (energyToRestore > 0 && energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyToRestore);
        lastUpdateTime = currentTime;
        updateDisplay();
        saveGameData();
    }
    
    requestAnimationFrame(energyRestoreLoop);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

window.addEventListener('beforeunload', function() {
    if (isDataLoaded) {
        saveGameData();
    }
});

function openRewardsModal() {
    loadRewardsProgress();
    updateRewardsDisplay();
    document.getElementById('rewardsModal').classList.add('active');
}

function closeRewardsModal() {
    document.getElementById('rewardsModal').classList.remove('active');
}

function loadRewardsProgress() {
    const saved = localStorage.getItem('dailyRewards');
    if (saved) {
        const data = JSON.parse(saved);
        currentDay = data.currentDay || 0;
        lastClaimDate = data.lastClaimDate || null;
    }

    if (lastClaimDate) {
        const lastClaim = new Date(lastClaimDate);
        const today = new Date();
        const diffTime = Math.abs(today - lastClaim);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            // Сброс серии, если пропущен день
            currentDay = 0;
        }
    }
}

function saveRewardsProgress() {
    const data = {
        currentDay: currentDay,
        lastClaimDate: new Date().toISOString()
    };
    localStorage.setItem('dailyRewards', JSON.stringify(data));
}

function updateRewardsDisplay() {
    const rewardsList = document.getElementById('rewardsList');
    const claimBtn = document.getElementById('claimBtn');
    const currentDayElement = document.getElementById('currentDay');
    
    currentDayElement.textContent = currentDay;
    rewardsList.innerHTML = '';
    
    const today = new Date().toDateString();
    const canClaimToday = lastClaimDate ? new Date(lastClaimDate).toDateString() !== today : true;

    rewardsData.forEach((amount, index) => {
        const day = index + 1;
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        
        let status = 'locked';
        let statusText = 'Заблокировано';
        
        if (day <= currentDay) {
            rewardItem.classList.add('claimed');
            status = 'claimed';
            statusText = 'Получено';
        } else if (day === currentDay + 1 && canClaimToday) {
            status = 'available';
            statusText = 'Доступно';
        } else if (day === currentDay + 1 && !canClaimToday) {
            status = 'claimed';
            statusText = 'Уже получено';
        }
        
        if (day > currentDay + 1) {
            rewardItem.classList.add('locked');
        }
        
        rewardItem.innerHTML = `
            <div class="reward-day">День ${day}</div>
            <div class="reward-amount">${amount} BR</div>
            <div class="reward-status status-${status}">${statusText}</div>
        `;
        
        rewardsList.appendChild(rewardItem);
    });

    if (currentDay >= rewardsData.length) {
        claimBtn.textContent = 'Все награды получены!';
        claimBtn.disabled = true;
    } else if (!canClaimToday) {
        claimBtn.textContent = 'Уже получено сегодня';
        claimBtn.disabled = true;
    } else {
        claimBtn.textContent = `Забрать ${rewardsData[currentDay]} BR`;
        claimBtn.disabled = false;
    }
}

function claimReward() {
    if (currentDay >= rewardsData.length) return;
    
    const today = new Date().toDateString();
    if (lastClaimDate && new Date(lastClaimDate).toDateString() === today) {
        alert('Вы уже получали награду сегодня!');
        return;
    }
    
    const rewardAmount = rewardsData[currentDay];

    addCoins(rewardAmount);

    currentDay++;

    saveRewardsProgress();

    updateRewardsDisplay();

    showRewardMessage(rewardAmount);
}

function showRewardMessage(amount) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 215, 0, 0.9);
        color: #000;
        padding: 20px 30px;
        border-radius: 15px;
        font-family: 'Arial black';
        font-size: 1.2rem;
        z-index: 1002;
        text-align: center;
        box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
    `;
    message.innerHTML = `
        <div>Молодец</div>
        <div>Вы получили ${amount} BR</div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

function addCoins(amount) {
    console.log(`Added ${amount} coins to balance`);
}

document.getElementById('rewardsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeRewardsModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadRewardsProgress();
});