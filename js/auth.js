// ============================================================
// 🔐 АВТОРИЗАЦИЯ
// ============================================================

function showAuthScreen() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    const a = document.getElementById('authScreen');
    if (a) a.classList.add('active');
}

function switchAuthTab(t, e) {
    document.querySelectorAll('#authScreen .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    const m = document.getElementById('authMessage');
    if (m) { m.className = 'message'; m.style.display = 'none'; }
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
        payload.nickname = document.getElementById('loginNick').value;
        payload.password = document.getElementById('loginPass').value;
    } else if (action === 'register') {
        btn = document.getElementById('registerBtn');
        payload.nickname = document.getElementById('regNick').value;
        payload.password = document.getElementById('regPass').value;
    } else if (action === 'guest') {
        btn = document.getElementById('guestBtn');
        payload.nickname = document.getElementById('guestNick').value;
    }
    
    if (btn) { btn.disabled = true; btn.innerText = '...'; }
    
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
        const res = await r.json();
        
        if (res.success) {
            currentUser = res.nickname || payload.nickname;
            currentRole = res.role || 'Игрок';
            localStorage.setItem('rf_session', JSON.stringify({ user: currentUser, role: currentRole, timestamp: Date.now() }));
            if (msg) { msg.className = 'message success'; msg.innerText = res.message || 'Успешно'; msg.style.display = 'block'; }
            setTimeout(function() { forceReload(); }, 800);
        } else {
            if (msg) { msg.className = 'message error'; msg.innerText = res.message || 'Ошибка'; msg.style.display = 'block'; }
        }
    } catch (err) {
        if (msg) { msg.className = 'message error'; msg.innerText = 'Ошибка соединения'; msg.style.display = 'block'; }
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = action === 'login' ? 'Войти' : 'Регистрация'; }
    }
}

function showUpgradeToPlayerModal() {
    const nick = document.getElementById('upgradeNick');
    if (nick) nick.innerText = currentUser;
    document.getElementById('upgradeModal').classList.remove('hidden');
}

function closeUpgradeModal() {
    document.getElementById('upgradeModal').classList.add('hidden');
}

async function upgradeToPlayer() {
    const key = document.getElementById('upgradeKey').value;
    const msg = document.getElementById('upgradeMessage');
    try {
        const newRole = key === ADMIN_KEY ? 'Админ' : (key === MOD_KEY ? 'Модератор' : 'Игрок');
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'setUserRole', nickname: currentUser, newRole: newRole }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ Вы теперь ' + newRole + '!';
                currentRole = newRole;
                setTimeout(function() { closeUpgradeModal(); forceReload(); }, 1500);
            } else {
                msg.className = 'message error';
                msg.innerText = '❌ ' + res.message;
            }
        }
    } catch (e) {
        if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; }
    }
}
