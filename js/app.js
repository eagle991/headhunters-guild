// ============================================================
// 🚀 RF ONLINE NEXT v17.20 — ТОЧКА ВХОДА
// ============================================================

async function initApp() {
    console.log('%c🚀 Инициализация RF Online Next', 'color: #2563eb; font-weight: bold;');

    // Проверяем сохранённую сессию
    const session = loadSession();
    if (session) {
        currentUser = session.user;
        currentRole = session.role;
        AppState.currentUser = currentUser;
        AppState.currentRole = currentRole;

        showMainScreen();
        await loadInitialData();
    } else {
        showAuthScreen();
    }

    // Запускаем фоновые процессы
    startBackgroundTasks();

    // Инициализируем drag & drop
    initDragAndDrop();

    console.log('%c✅ Приложение готово', 'color: #10b981;');
}

function loadSession() {
    try {
        const raw = localStorage.getItem('rf_session');
        if (!raw) return null;

        const session = JSON.parse(raw);

        // Сессия действительна 7 дней
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
    const dkpEl = document.getElementById('userDkpBadge');

    if (nickEl) nickEl.innerText = currentUser || '—';
    if (roleEl) roleEl.innerHTML = getRoleBadge(currentRole);

    // Показ/скрытие админских элементов
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(function(el) {
        el.style.display = (currentRole === 'Админ' || currentRole === 'Модератор') ? '' : 'none';
    });
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadSiteFeatures(),
            loadMyDkp(),
            loadMyGuild(),
            loadNotifications()
        ]);
    } catch (e) {
        console.error('Initial data load error:', e);
    }
}

async function loadSiteFeatures() {
    try {
        const res = await api('getSiteFeatures');
        if (res.success) {
            siteFeatures = res.features || {};
            AppState.siteFeatures = siteFeatures;
        }
    } catch (e) {
        console.error('loadSiteFeatures error:', e);
    }
}

function startBackgroundTasks() {
    // Проверка обновлений каждые 5 минут
    setInterval(checkForUpdates, 5 * 60 * 1000);

    // Опрос уведомлений
    if (notificationPollingInterval) clearInterval(notificationPollingInterval);
    notificationPollingInterval = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL);
}

function forceReload() {
    // Сохраняем сессию перед перезагрузкой
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
    AppState.currentUser = null;
    AppState.currentRole = null;

    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }

    showAuthScreen();
}

// ============================================================
// 🖱️ DRAG & DROP ДЛЯ СКРИНШОТОВ
// ============================================================

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

    // Блоки скриншотов персонажа
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

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);
