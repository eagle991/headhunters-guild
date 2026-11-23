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
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('rf_saved_login', payload.nickname);
            localStorage.setItem('rf_saved_password', payload.password);
        } else {
            localStorage.removeItem('rf_saved_login');
            localStorage.removeItem('rf_saved_password');
        }
    } else if (action === 'register') {
        btn = document.getElementById('regBtn');
        payload.nickname = document.getElementById('regNick').value;
        payload.password = document.getElementById('regPass').value;
        payload.roleKey = document.getElementById('regKey').value;
    } else if (action === 'guest') {
        btn = document.getElementById('guestBtn');
        payload.action = 'registerGuest';
        payload.nickname = document.getElementById('guestNick').value;
        payload.password = document.getElementById('guestPass').value;
    }
    
    if (btn) {
        btn.disabled = true;
        const ot = btn.innerText;
        btn.innerHTML = '<span class="loader"></span> ...';
        if (msg) { msg.className = 'message'; msg.style.display = 'none'; }
        try {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
            const res = await r.json();
            if (res.success) {
                if (msg) { msg.className = 'message success'; msg.innerText = res.message; }
                if (action === 'login' || action === 'registerGuest' || action === 'register') {
                    currentUser = payload.nickname;
                    currentRole = res.role;
                    setTimeout(showMainScreen, 500);
                }
            } else {
                if (msg) { msg.className = 'message error'; msg.innerText = res.message; }
            }
        } catch (err) {
            if (msg) { msg.className = 'message error'; msg.innerText = 'Ошибка связи.'; }
        } finally {
            btn.disabled = false;
            btn.innerText = ot;
            if (msg) msg.style.display = 'block';
        }
    }
}

function showMainScreen() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    const main = document.getElementById('mainScreen');
    if (main) main.classList.add('active');
    
    const pn = document.getElementById('playerNick');
    if (pn) pn.innerText = currentUser;
    
    const rb = document.getElementById('roleBadge');
    if (rb) {
        if (currentRole === 'Гость') {
            rb.innerText = '👁 Гость';
            rb.className = 'role-badge role-guest';
        } else {
            rb.innerText = currentRole;
            rb.className = 'role-badge';
            if (currentRole === 'Админ') rb.classList.add('role-admin');
            else if (currentRole === 'Модератор') rb.classList.add('role-mod');
            else rb.classList.add('role-player');
        }
    }
    
    const tabAdmin = document.getElementById('tabAdmin');
    if (tabAdmin) tabAdmin.classList.toggle('hidden', !(currentRole === 'Админ' || currentRole === 'Модератор'));
    const tabAdminUsers = document.getElementById('tabAdminUsers');
    if (tabAdminUsers) tabAdminUsers.classList.toggle('hidden', currentRole !== 'Админ');
    
    const isGuest = currentRole === 'Гость';
    const guestBanner = document.getElementById('guestBanner');
    if (guestBanner) guestBanner.classList.toggle('hidden', !isGuest);
    
    localStorage.setItem('rf_session', JSON.stringify({
        user: currentUser,
        role: currentRole,
        timestamp: Date.now()
    }));
    
    loadSiteFeatures();
    loadPlayerData();
    loadPlayerSkills();
    loadPlayerItems();
    loadMyDkp();
    loadPublicTops();
    loadTodayActivity();
    loadWeeklyActivity();
    loadEventStats();
    loadRecentWinners();
    loadMyLootHistory();
    loadUserEmail();
    loadMyGuild();
    startNotificationPolling();
    
    const homeBtn = document.querySelector('#mainTabs .tab-btn[data-tab="home"]');
    switchMainTab('home', { target: homeBtn });
    setTimeout(loadEventTimers, 1000);
}

function logout() {
    stopNotificationPolling();
    stopEventTimersUpdate();
    lastNotificationCount = 0;
    knownNotificationIds.clear();
    localStorage.removeItem('rf_session');
    currentUser = null;
    currentRole = null;
    myPlayerData = null;
    myPlayerSkills = null;
    myPlayerItems = null;
    myDkpData = null;
    playerItemSelections = {};
    currentEquipmentSection = null;
    uploadedScreenshots = [];
    recognizedNicks = [];
    if (countdownInterval) clearInterval(countdownInterval);
    if (bidCooldownInterval) { clearInterval(bidCooldownInterval); bidCooldownInterval = null; }
    if (auctionEndInterval) { clearInterval(auctionEndInterval); auctionEndInterval = null; }
    localStorage.removeItem('rf_saved_login');
    localStorage.removeItem('rf_saved_password');
    
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    const ps = document.getElementById('publicScreen');
    if (ps) ps.classList.add('active');
    const am = document.getElementById('authMessage');
    if (am) am.style.display = 'none';
    const plp = document.getElementById('publicLoginPrompt');
    if (plp) plp.style.display = 'block';
    const gb = document.getElementById('guestBanner');
    if (gb) gb.classList.add('hidden');
    
    loadPublicTops();
    loadTodayActivity();
    loadWeeklyActivity();
    loadEventStats();
    loadRecentWinners();
}

function clearSavedCredentials() {
    if (confirm('Очистить сохранённые данные?')) {
        localStorage.removeItem('rf_saved_login');
        localStorage.removeItem('rf_saved_password');
        const ln = document.getElementById('loginNick'); if (ln) ln.value = '';
        const lp = document.getElementById('loginPass'); if (lp) lp.value = '';
        const rm = document.getElementById('rememberMe'); if (rm) rm.checked = false;
        const i = document.getElementById('savedIndicator'); if (i) i.style.display = 'none';
        alert('✅ Очищено!');
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
