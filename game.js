const firebaseConfig = {
    apiKey: "AIzaSyCg_IWmGKw-guZTqCEDb_D7foE6lYClVfw",
    authDomain: "zhsnsjsj-1d4b9.firebaseapp.com",
    projectId: "zhsnsjsj-1d4b9",
    storageBucket: "zhsnsjsj-1d4b9.firebasestorage.app",
    messagingSenderId: "658552522687",
    appId: "1:658552522687:web:59718f3ae5e72f2323c30a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

// Проверка авторизации
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

async function loadGameData() {
    try {
        const doc = await db.collection('users').doc(currentUser).get();
        
        if (doc.exists) {
            const data = doc.data();
            balance = data.balance || 0;
            energy = data.energy || 1000;
            lastUpdateTime = data.lastUpdateTime || Date.now();
            
            restoreEnergyFromTime();
        }
        
        updateDisplay();
        isDataLoaded = true;
        
    } catch (error) {
        console.error('Load error:', error);
        updateDisplay();
        isDataLoaded = true;
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

// Меню
const menuButtons = document.querySelectorAll('.menu-btn');
menuButtons.forEach(button => {
    button.addEventListener('click', function() {
        menuButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
});

// Выход
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Анимация тряски
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Сохранение при закрытии
window.addEventListener('beforeunload', function() {
    if (isDataLoaded) {
        saveGameData();
    }
});