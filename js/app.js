// ============================================================
// 🚀 RF ONLINE NEXT v17.20 — ТОЧКА ВХОДА
// ============================================================

async function initApp() {
    console.log('%c🚀 Инициализация RF Online Next', 'color: #2563eb; font-weight: bold;');

    const session = loadSession();
    if (session) {
        currentUser = session.user;
        currentRole = session.role;
        showMainScreen();
        await loadInitialData();
    } else {
        if (typeof showAuthScreen === 'function') showAuthScreen();
    }

    startBackgroundTasks();
    if (typeof initDragAndDrop === 'function') initDragAndDrop();

    console.log('%c✅ Приложение готово', 'color: #10b981;');
}

function loadSession() {
    try {
        const raw = localStorage.getItem('rf_session');
        if (!raw) return null;

        const session = JSON.parse(raw);
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        if (Date.now() - session.timestamp > maxAge) {
            localStorage.removeItem('rf_session');
            return null;
        }

        return session;
    } catch (e) {
        localStorage.removeItem('rf_session');
        return null;
    }
}

function showMainScreen() {
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });

    const main = document.getElementById('mainScreen');
    if (main) main.classList.add('active');

    updateHeader();
}

function updateHeader() {
    const nickEl = document.getElementById('headerNick');
    const roleEl = document.getElementById('headerRole');

    if (nickEl) nickEl.innerText = currentUser || '—';
    if (roleEl && typeof getRoleBadge === 'function') roleEl.innerHTML = getRoleBadge(currentRole);

    const isAdmin = currentRole === 'Админ' || currentRole === 'Модератор';

    // Показ всех админских элементов
    const adminElements = document.querySelectorAll('.admin-only, #tabAdmin, #tabGuildAdmin');
    adminElements.forEach(function(el) {
        if (el) el.style.display = isAdmin ? '' : 'none';
    });

    // Показ кнопок создания
    const createButtons = document.querySelectorAll('#tabAuctionCreate, #tabQueueAdd');
    createButtons.forEach(function(el) {
        if (el) el.classList.toggle('hidden', !isAdmin);
    });
}

async function loadInitialData() {
    try {
        const tasks = [];
        if (typeof loadMyDkp === 'function') tasks.push(loadMyDkp());
        if (typeof loadMyGuild === 'function') tasks.push(loadMyGuild());
        if (typeof loadNotifications === 'function') tasks.push(loadNotifications());
        await Promise.all(tasks);
    } catch (e) {
        console.error('Initial data load error:', e);
    }
}

function startBackgroundTasks() {
    if (typeof checkForUpdates === 'function') {
        setInterval(checkForUpdates, 5 * 60 * 1000);
    }

    if (typeof loadNotifications === 'function' && typeof NOTIFICATION_POLL_INTERVAL !== 'undefined') {
        if (notificationPollingInterval) clearInterval(notificationPollingInterval);
        notificationPollingInterval = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL);
    }
}

function forceReload() {
    if (currentUser && currentRole) {
        localStorage.setItem('rf_session', JSON.stringify({
            user: currentUser,
            role: currentRole,
            timestamp: Date.now()
        }));
    }
    location.reload();
}

function logout() {
    if (!confirm('Выйти из аккаунта?')) return;

    localStorage.removeItem('rf_session');
    currentUser = null;
    currentRole = null;

    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }

    if (typeof showAuthScreen === 'function') showAuthScreen();
}

window.forceReload = forceReload;
window.logout = logout;
window.initApp = initApp;
window.updateHeader = updateHeader;

document.addEventListener('DOMContentLoaded', initApp);
