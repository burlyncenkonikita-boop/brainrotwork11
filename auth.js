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

// Переключение между вкладками
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        // Скрываем все формы
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        // Активируем текущую кнопку и форму
        this.classList.add('active');
        const tabName = this.getAttribute('data-tab');
        document.getElementById(tabName + 'Form').classList.add('active');
    });
});

// Регистрация
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Валидация
    if (username.length < 3) {
        showMessage('Логин должен быть не менее 3 символов', 'error');
        return;
    }
    
    if (password.length < 4) {
        showMessage('Пароль должен быть не менее 4 символов', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    try {
        // Проверяем, существует ли пользователь
        const userDoc = await db.collection('users').doc(username).get();
        
        if (userDoc.exists) {
            showMessage('Пользователь с таким логином уже существует', 'error');
            return;
        }
        
        // Сохраняем пользователя
        await db.collection('users').doc(username).set({
            username: username,
            password: password, // В реальном приложении пароль нужно хэшировать!
            balance: 0,
            energy: 1000,
            lastUpdateTime: Date.now(),
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('Регистрация успешна!', 'success');
        
        // Автоматически входим после регистрации
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
        showMessage('Вход успешен!', 'success');
        
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