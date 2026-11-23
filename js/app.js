// ============================================================
// 🚀 RF ONLINE NEXT v17.20 — ТОЧКА ВХОДА
// ============================================================

async function initApp() {
    const session = localStorage.getItem('rf_session');
    if (session) {
        try {
            const s = JSON.parse(session);
            if (Date.now() - s.timestamp < 24 * 60 * 60 * 1000) {
                currentUser = s.user;
                currentRole = s.role;
                showMainScreen();
                return;
            }
        } catch (e) {}
    }
    showAuthScreen();
}

function showMainScreen() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    const main = document.getElementById('mainScreen');
    if (main) main.classList.add('active');
    updateHeader();
}

function updateHeader() {
    const nickEl = document.getElementById('headerNick');
    if (nickEl) nickEl.innerText = currentUser || '—';
    
    const isAdmin = currentRole === 'Админ' || currentRole === 'Модератор';
    document.querySelectorAll('.admin-only').forEach(function(el) {
        el.style.display = isAdmin ? '' : 'none';
    });
}

function forceReload() {
    if (currentUser && currentRole) {
        localStorage.setItem('rf_session', JSON.stringify({ user: currentUser, role: currentRole, timestamp: Date.now() }));
    }
    location.reload();
}

function logout() {
    localStorage.removeItem('rf_session');
    currentUser = null;
    currentRole = null;
    showAuthScreen();
}

document.addEventListener('DOMContentLoaded', initApp);
