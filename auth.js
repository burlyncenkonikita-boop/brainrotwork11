const firebaseConfig = {
  apiKey: "AIzaSyCg_IWmGKw-guZTqCEDb_D7foE6lYClVfw",
  authDomain: "zhsnsjsj-1d4b9.firebaseapp.com",
  projectId: "zhsnsjsj-1d4b9",
  storageBucket: "zhsnsjsj-1d4b9.firebasestorage.app",
  messagingSenderId: "658552522687",
  appId: "1:658552522687:web:59718f3ae5e72f2323c30a",
  measurementId: "G-S071516PH0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        this.classList.add('active');
        const tabName = this.getAttribute('data-tab');
        document.getElementById(tabName + 'Form').classList.add('active');
    });
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (username.length < 1) {
        showMessage('Логин должен иметь от 1 символа', 'error');
        return;
    }
    
    if (password.length < 1) {
        showMessage('Пароль должен иметь от 1 символа', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showMessage('Пароль неподходит', 'error');
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(username).get();
        
        if (userDoc.exists) {
            showMessage('Человек с таким логином уже есть', 'error');
            return;
        }
        
        await db.collection('users').doc(username).set({
            username: username,
            password: password,
            balance: 0,
            energy: 1000,
            lastUpdateTime: Date.now(),
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('Регистрация успешна', 'success');
        
        setTimeout(() => {
            localStorage.setItem('currentUser', username);
            window.location.href = 'game.html';
        }, 1000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Ошибка регистрации', 'error');
    }
});

// Вход
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const userDoc = await db.collection('users').doc(username).get();
        
        if (!userDoc.exists) {
            showMessage('Пользователь не найден', 'error');
            return;
        }
        
        const userData = userDoc.data();
        
        if (userData.password !== password) {
            showMessage('Неверный пароль', 'error');
            return;
        }
        
        // Сохраняем в localStorage и переходим в игру
        localStorage.setItem('currentUser', username);
        showMessage('Вход успешен', 'success');
        
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Ошибка входа', 'error');
    }
});

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'game.html';
    }
});

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}