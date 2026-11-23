// ============================================================
// 🚀 RF ONLINE NEXT v17.20 — ТОЧКА ВХОДА
// ============================================================

async function initApp() {
    console.log('%c🚀 Инициализация RF Online Next', 'color: #2563eb; font-weight: bold;');

    const session = loadSession();
    if (session) {
        currentUser = session.user;
        currentRole = session.role;
        if (typeof AppState !== 'undefined') {
            AppState.currentUser = currentUser;
            AppState.currentRole = currentRole;
        }
        showMainScreen();
        await loadInitialData();
    } else {
        showAuthScreen();
    }

    startBackgroundTasks();
    initDragAndDrop();

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
    if (typeof updateThemeButton === 'function') updateThemeButton();
}

function updateHeader() {
    const nickEl = document.getElementById('headerNick');
    const roleEl = document.getElementById('headerRole');

    if (nickEl) nickEl.innerText = currentUser || '—';
    if (roleEl && typeof getRoleBadge === 'function') roleEl.innerHTML = getRoleBadge(currentRole);

    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(function(el) {
        el.style.display = (currentRole === 'Админ' || currentRole === 'Модератор') ? '' : 'none';
    });
}

async function loadInitialData() {
    try {
        const tasks = [];
        if (typeof loadSiteFeatures === 'function') tasks.push(loadSiteFeatures());
        if (typeof loadMyDkp === 'function') tasks.push(loadMyDkp());
        if (typeof loadMyGuild === 'function') tasks.push(loadMyGuild());
        if (typeof loadNotifications === 'function') tasks.push(loadNotifications());
        await Promise.all(tasks);
    } catch (e) {
        console.error('Initial data load error:', e);
    }
}

async function loadSiteFeatures() {
    try {
        if (typeof api !== 'function') return;
        const res = await api('getSiteFeatures');
        if (res.success) {
            siteFeatures = res.features || {};
            if (typeof AppState !== 'undefined') AppState.siteFeatures = siteFeatures;
        }
    } catch (e) {
        console.error('loadSiteFeatures error:', e);
    }
}

function startBackgroundTasks() {
    if (typeof checkForUpdates === 'function') {
        setInterval(checkForUpdates, 5 * 60 * 1000);
    }

    if (typeof notificationPollingInterval !== 'undefined' && notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
    }

    if (typeof loadNotifications === 'function' && typeof NOTIFICATION_POLL_INTERVAL !== 'undefined') {
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

function updateThemeButton() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.body.classList.contains('dark-theme');
    btn.innerText = isDark ? '☀️' : '🌙';
}

function logout() {
    if (!confirm('Выйти из аккаунта?')) return;

    localStorage.removeItem('rf_session');
    currentUser = null;
    currentRole = null;

    if (typeof AppState !== 'undefined') {
        AppState.currentUser = null;
        AppState.currentRole = null;
    }

    if (typeof notificationPollingInterval !== 'undefined' && notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }

    if (typeof showAuthScreen === 'function') showAuthScreen();
}

function initDragAndDrop() {
    const uploadArea = document.getElementById('screenshotUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = Array.from(e.dataTransfer.files).filter(function(f) {
                return f.type.startsWith('image/');
            });

            if (files.length > 0 && typeof addScreenshots === 'function') {
                addScreenshots(files);
            }
        });
    }

    for (let i = 1; i <= 2; i++) {
        const block = document.getElementById('screenshotBlock' + i);
        if (!block) continue;

        block.addEventListener('dragover', function(e) {
            e.preventDefault();
            block.style.borderColor = 'var(--accent)';
            block.style.background = 'var(--accent-soft)';
        });

        block.addEventListener('dragleave', function() {
            block.style.borderColor = '';
            block.style.background = '';
        });

        block.addEventListener('drop', function(e) {
            e.preventDefault();
            block.style.borderColor = '';
            block.style.background = '';

            const files = Array.from(e.dataTransfer.files).filter(function(f) {
                return f.type.startsWith('image/');
            });

            if (files.length > 0 && typeof handleCharacterScreenshotDrop === 'function') {
                handleCharacterScreenshotDrop(files[0], i);
            }
        });
    }
}

// Экспорт глобально
window.forceReload = forceReload;
window.updateThemeButton = updateThemeButton;
window.logout = logout;
window.initApp = initApp;

document.addEventListener('DOMContentLoaded', initApp);
