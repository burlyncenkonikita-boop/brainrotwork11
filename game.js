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

function openAdmin() {
    window.location.href = 'admin.html';
}

// Загрузка данных из Firebase
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
            
            // Восстановление энергии
            restoreEnergyFromTime();
        } else {
            // Если пользователь не найден (не должен случиться)
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

// Создание нового пользователя (на всякий случай)
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

// Сохранение данных в Firebase
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

// Восстановление энергии
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

// Обновление интерфейса
function updateDisplay() {
    balanceElement.textContent = `Brainrot: ${balance}`;
    energyElement.textContent = energy;
}

// Клик по монете
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

// Восстановление энергии в реальном времени
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
