// ============================================================
// 🔐 АВТОРИЗАЦИЯ
// ============================================================

function showAuthScreen() {
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });
    const a = document.getElementById('authScreen');
    if (a) a.classList.add('active');
}

function switchAuthTab(t, e) {
    document.querySelectorAll('#authScreen .tab-btn').forEach(function(b) {
        b.classList.remove('active');
    });
    if (e && e.target) e.target.classList.add('active');

    const m = document.getElementById('authMessage');
    if (m) {
        m.className = 'message';
        m.style.display = 'none';
    }

    const lf = document.getElementById('loginForm');
    const rf = document.getElementById('registerForm');
    const gf = document.getElementById('guestForm');

    if (lf) lf.classList.add('hidden');
    if (rf) rf.classList.add('hidden');
    if (gf) gf.classList.add('hidden');

    if (t === 'login' && lf) lf.classList.remove('hidden');
    else if (t === 'register' && rf) rf.classList.remove('hidden');
    else if (t === 'guest' && gf) gf.classList.remove('hidden');
}

async function handleAuth(e, action) {
    e.preventDefault();
    const msg = document.getElementById('authMessage');
    let btn, payload = { action: action };

    if (action === 'login') {
        btn = document.getElementById('loginBtn');
        payload.nickname = document.getElementById('loginNick')?.value?.trim() || '';
        payload.password = document.getElementById('loginPass')?.value || '';
    } else if (action === 'register') {
        btn = document.getElementById('registerBtn');
        payload.nickname = document.getElementById('regNick')?.value?.trim() || '';
        payload.password = document.getElementById('regPass')?.value || '';
        payload.passwordConfirm = document.getElementById('regPassConfirm')?.value || '';
    } else if (action === 'guest') {
        btn = document.getElementById('guestBtn');
        payload.nickname = document.getElementById('guestNick')?.value?.trim() || '';
    }

    if (!payload.nickname) {
        showAuthMessage('Введите никнейм', 'error');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Загрузка...';
    }

    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
        const res = await r.json();

        if (res.success) {
            currentUser = res.nickname || payload.nickname;
            currentRole = res.role || 'Игрок';

            if (typeof AppState !== 'undefined') {
                AppState.currentUser = currentUser;
                AppState.currentRole = currentRole;
            }

            localStorage.setItem('rf_session', JSON.stringify({
                user: currentUser,
                role: currentRole,
                timestamp: Date.now()
            }));

            showAuthMessage(res.message || 'Успешно', 'success');

            setTimeout(function() {
                if (typeof forceReload === 'function') {
                    forceReload();
                } else {
                    location.reload();
                }
            }, 800);
        } else {
            showAuthMessage(res.message || 'Ошибка авторизации', 'error');
        }
    } catch (err) {
        console.error('Auth error:', err);
        showAuthMessage('Ошибка соединения', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            if (action === 'login') btn.innerText = 'Войти';
            else if (action === 'register') btn.innerText = 'Регистрация';
            else btn.innerText = 'Войти как гость';
        }
    }
}

function showAuthMessage(text, type) {
    const msg = document.getElementById('authMessage');
    if (!msg) return;
    msg.className = 'message ' + type;
    msg.innerText = text;
    msg.style.display = 'block';
}

function showUpgradeToPlayerModal() {
    const nick = document.getElementById('upgradeNick');
    if (nick) nick.innerText = currentUser;
    const modal = document.getElementById('upgradeModal');
    if (modal) modal.classList.remove('hidden');
}

function closeUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) modal.classList.add('hidden');
}

async function upgradeToPlayer() {
    const key = document.getElementById('upgradeKey')?.value?.trim() || '';
    const msg = document.getElementById('upgradeMessage');

    if (!key) {
        if (msg) {
            msg.className = 'message error';
            msg.innerText = 'Введите ключ';
            msg.style.display = 'block';
        }
        return;
    }

    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'upgradeRole',
                nickname: currentUser,
                key: key
            }),
            redirect: 'follow'
        });
        const res = await r.json();

        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ ' + (res.message || 'Роль обновлена');
                currentRole = res.newRole || currentRole;

                if (typeof AppState !== 'undefined') {
                    AppState.currentRole = currentRole;
                }

                setTimeout(function() {
                    closeUpgradeModal();
                    if (typeof forceReload === 'function') {
                        forceReload();
                    } else {
                        location.reload();
                    }
                }, 1500);
            } else {
                msg.className = 'message error';
                msg.innerText = '❌ ' + (res.message || 'Неверный ключ');
                msg.style.display = 'block';
            }
        }
    } catch (e) {
        if (msg) {
            msg.className = 'message error';
            msg.innerText = '❌ Ошибка соединения';
            msg.style.display = 'block';
        }
    }
}

// Экспорт глобально
window.showAuthScreen = showAuthScreen;
window.switchAuthTab = switchAuthTab;
window.handleAuth = handleAuth;
window.showUpgradeToPlayerModal = showUpgradeToPlayerModal;
window.closeUpgradeModal = closeUpgradeModal;
window.upgradeToPlayer = upgradeToPlayer;
