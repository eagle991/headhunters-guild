// ============================================================
// 👤 КАБИНЕТ ИГРОКА
// ============================================================

async function loadPlayerData() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerData', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        const f = document.getElementById('playerDataForm');
        const am = document.getElementById('approvedMessage');
        const ce = document.getElementById('cabinetEmpty');
        const ag = document.getElementById('approvedDataGrid');
        const inv = document.getElementById('mmorpgInventoryView');
        const ss = document.getElementById('playerStatus');
        const csb = document.getElementById('characterScreenshotsBlock');
        if (res.success) {
            const d = res.data;
            myPlayerData = d;
            const bm = document.getElementById('bm'); if (bm) bm.value = d.bm || '';
            const lv = document.getElementById('level'); if (lv) lv.value = d.level || '';
            const at = document.getElementById('attack'); if (at) at.value = d.attack || '';
            const df = document.getElementById('defense'); if (df) df.value = d.defense || '';
            const ac = document.getElementById('accuracy'); if (ac) ac.value = d.accuracy || '';
            const ev = document.getElementById('evasion'); if (ev) ev.value = d.evasion || '';
            const co = document.getElementById('collections'); if (co) co.value = d.collections || '';
            const pr = document.getElementById('profession'); if (pr) pr.value = d.profession || '';
            if (d.status === 'approved') {
                if (ss) ss.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
                if (ag) ag.classList.add('hidden');
                if (inv) { inv.classList.remove('hidden'); renderMmorpgInventory(); }
                if (f) f.classList.add('hidden');
                if (am) am.classList.remove('hidden');
                if (ce) ce.classList.add('hidden');
                if (csb) csb.classList.add('hidden');
            } else if (d.status === 'pending') {
                if (ss) ss.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
                if (ce) ce.classList.remove('hidden');
                if (ag) ag.classList.add('hidden');
                if (inv) inv.classList.add('hidden');
                if (am) am.classList.add('hidden');
                if (f) f.classList.remove('hidden');
                if (csb) csb.classList.remove('hidden');
            } else {
                if (ss) ss.innerHTML = '<span class="status-badge status-rejected">Отклонено</span>';
                if (ce) ce.classList.remove('hidden');
                if (ag) ag.classList.add('hidden');
                if (inv) inv.classList.add('hidden');
                if (am) am.classList.add('hidden');
                if (f) f.classList.remove('hidden');
                if (csb) csb.classList.remove('hidden');
            }
        } else {
            if (ce) ce.classList.remove('hidden');
            if (ag) ag.classList.add('hidden');
            if (inv) inv.classList.add('hidden');
            if (am) am.classList.add('hidden');
            if (f) f.classList.remove('hidden');
            if (csb) csb.classList.remove('hidden');
        }
    } catch (e) { console.error(e); }
}

async function savePlayerData(e) {
    e.preventDefault();
    const b = document.getElementById('saveDataBtn');
    const m = document.getElementById('playerMessage');
    if (b) { b.disabled = true; b.innerHTML = '<span class="loader"></span> ...'; }
    await saveCharacterScreenshots();
    try {
        const payload = {
            action: 'savePlayerData',
            nickname: currentUser,
            bm: document.getElementById('bm').value,
            level: document.getElementById('level').value,
            attack: document.getElementById('attack').value,
            defense: document.getElementById('defense').value,
            accuracy: document.getElementById('accuracy').value,
            evasion: document.getElementById('evasion').value,
            collections: document.getElementById('collections').value,
            profession: document.getElementById('profession').value
        };
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; setTimeout(loadPlayerData, 1000); }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; } }
    finally { if (b) { b.disabled = false; b.innerText = 'Отправить'; } if (m) m.style.display = 'block'; }
}

async function loadUserEmail() {
    if (!currentUser) return;
    const i = document.getElementById('userEmail');
    if (!i) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getUserEmail', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) i.value = res.email || '';
    } catch (e) {}
}

async function saveUserEmail() {
    const i = document.getElementById('userEmail');
    const m = document.getElementById('emailMessage');
    if (!i) return;
    const em = i.value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        if (m) { m.className = 'message error'; m.innerText = '❌ Некорректный email'; m.style.display = 'block'; }
        return;
    }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveUserEmail', nickname: currentUser, email: em }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Email сохранён'; }
            else { m.className = 'message error'; m.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

// ============================================================
// 👥 ДРУЗЬЯ
// ============================================================

async function loadFriends() {
    if (!isFeatureEnabled('friends')) { const s = document.getElementById('friendsSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('friendsSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getFriends', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const fr = res.friends || [];
            const c = document.getElementById('friendsCounter');
            if (c) c.innerText = '(' + fr.length + '/50)';
            const l = document.getElementById('friendsList');
            if (l) {
                if (fr.length === 0) l.innerHTML = '<div class="empty-state">У вас пока нет друзей</div>';
                else {
                    let html = '';
                    for (let i = 0; i < fr.length; i++) {
                        const f = fr[i];
                        html += '<div class="friend-card"><div class="friend-nick">' + renderPlayerNickWithBioColor(f.nickname, null, true, true) + '</div><div class="friend-date">📅 ' + escapeHtml(f.addedDate) + '</div><button class="btn-remove" onclick="removeFriend(\'' + escapeForOnclick(f.nickname) + '\')">✕</button></div>';
                    }
                    l.innerHTML = html;
                }
            }
        }
    } catch (e) { console.error(e); }
}

async function addFriend() {
    const i = document.getElementById('addFriendInput');
    const f = i.value.trim();
    if (!f) { alert('Введите ник друга'); return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addFriend', nickname: currentUser, friend: f }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); i.value = ''; loadFriends(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function removeFriend(f) {
    if (!confirm('Удалить ' + f + ' из друзей?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'removeFriend', nickname: currentUser, friend: f }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ Удалён'); loadFriends(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

// ============================================================
// 🛍️ КОСМЕТИКА
// ============================================================

async function loadCosmeticsShop() {
    if (!isFeatureEnabled('cosmeticsShop')) { const s = document.getElementById('cosmeticsSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('cosmeticsSection');
    if (s) s.style.display = 'block';
    try {
        const sr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getCosmeticsShop' }), redirect: 'follow' });
        const sres = await sr.json();
        const pr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerCosmetics', nickname: currentUser }), redirect: 'follow' });
        const pres = await pr.json();
        if (sres.success && pres.success) {
            const ownedIds = (pres.owned || []).map(function(o) { return o.id; });
            const equipped = pres.equipped || {};
            const l = document.getElementById('cosmeticsShopList');
            if (l) {
                let html = '';
                for (let i = 0; i < sres.items.length; i++) {
                    const it = sres.items[i];
                    const owned = ownedIds.indexOf(it.id) !== -1;
                    const equipped2 = Object.values(equipped).indexOf(it.id) !== -1;
                    html += '<div class="cosmetic-item ' + (owned ? 'owned' : '') + '"><div class="cosmetic-icon">' + it.icon + '</div><div class="cosmetic-info"><div class="cosmetic-name">' + escapeHtml(it.name) + '</div><div class="cosmetic-type">' + escapeHtml(it.type) + '</div></div>';
                    if (owned) {
                        if (equipped2) html += '<button class="btn-reject" onclick="unequipCosmetic(\'' + escapeForOnclick(it.type) + '\')">Снять</button>';
                        else html += '<button class="btn-approve" onclick="equipCosmetic(\'' + escapeForOnclick(it.type) + '\', \'' + escapeForOnclick(it.id) + '\')">Надеть</button>';
                    } else {
                        html += '<button class="btn-edit" style="width:auto;margin-top:0;" onclick="buyCosmetic(\'' + escapeForOnclick(it.id) + '\', ' + it.price + ')">💰 ' + it.price + '</button>';
                    }
                    html += '</div>';
                }
                l.innerHTML = html;
            }
        }
    } catch (e) { console.error(e); }
}

async function buyCosmetic(id, price) {
    if (!confirm('Купить за ' + price + ' DKP?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'buyCosmetic', nickname: currentUser, itemId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadCosmeticsShop(); loadMyDkp(); loadAchievements(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function equipCosmetic(slot, id) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'equipCosmetic', nickname: currentUser, slot: slot, itemId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ Экипировано'); loadCosmeticsShop(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function unequipCosmetic(slot) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'equipCosmetic', nickname: currentUser, slot: slot, itemId: '' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ Снято'); loadCosmeticsShop(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

// ============================================================
// 🔗 ТВИНКИ
// ============================================================

async function loadTwinksInfo() {
    if (!isFeatureEnabled('twinks')) { const s = document.getElementById('twinksSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('twinksSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getMainAccount', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const i = document.getElementById('twinksInfo');
            if (i) {
                if (res.isTwink) i.innerHTML = '<div class="twink-card"><div>🔗 Привязан к: <b style="color:var(--accent);">' + escapeHtml(res.main) + '</b></div></div>';
                else if (res.twinks && res.twinks.length > 0) {
                    let html = '<div style="margin-bottom:6px;font-size:10px;color:var(--text-dim);">Ваши твинки:</div>';
                    for (let j = 0; j < res.twinks.length; j++) html += '<div class="twink-card"><div class="twink-main">' + escapeHtml(currentUser) + '</div><div class="twink-arrow">→</div><div class="twink-name">' + escapeHtml(res.twinks[j]) + '</div></div>';
                    i.innerHTML = html;
                } else i.innerHTML = '<div class="empty-state">Нет привязанных твинков</div>';
            }
        }
    } catch (e) { console.error(e); }
}

async function linkTwinkAdmin() {
    const m = document.getElementById('twinkMainNick').value.trim();
    const t = document.getElementById('twinkTwinkNick').value.trim();
    const msg = document.getElementById('twinksMessage');
    if (!m || !t) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Заполните поля'; msg.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'linkTwink', mainNick: m, twinkNick: t }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; document.getElementById('twinkMainNick').value = ''; document.getElementById('twinkTwinkNick').value = ''; }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; } }
    if (msg) { msg.style.display = 'block'; setTimeout(function() { msg.style.display = 'none'; }, 3000); }
}

async function loadAdminTwinksList() {
    const l = document.getElementById('adminTwinksList');
    if (!l) return;
    l.innerHTML = '<div class="empty-state">Используйте форму выше для привязки твинков</div>';
}

// ============================================================
// 🏆 ДОСТИЖЕНИЯ, УРОВНИ, БОНУСЫ
// ============================================================

async function loadAchievements() {
    if (!isFeatureEnabled('achievements')) { const s = document.getElementById('achievementsSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('achievementsSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAchievements', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const unlockedIds = (res.unlocked || []).map(function(a) { return a.id; });
            const c = document.getElementById('achievementsCounter');
            if (c) c.innerText = '(' + unlockedIds.length + '/' + res.total + ')';
            const l = document.getElementById('achievementsList');
            if (l) {
                let html = '';
                for (let i = 0; i < res.achievements.length; i++) {
                    const a = res.achievements[i];
                    const u = unlockedIds.indexOf(a.id) !== -1;
                    html += '<div class="achievement-card ' + (u ? 'unlocked' : 'locked') + '"><div class="achievement-icon">' + a.icon + '</div><div class="achievement-info"><div class="achievement-name">' + escapeHtml(a.name) + ' ' + (u ? '✅' : '🔒') + '</div><div class="achievement-desc">' + escapeHtml(a.desc) + '</div></div><div class="achievement-reward">💰 ' + a.reward + '</div></div>';
                }
                l.innerHTML = html;
            }
        }
    } catch (e) { console.error(e); }
}

async function loadPlayerLevel() {
    if (!isFeatureEnabled('levels')) { const s = document.getElementById('levelSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('levelSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerLevel', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const d = document.getElementById('levelDisplay');
            if (d) d.innerHTML = '<div class="level-display"><div class="level-title">' + escapeHtml(res.title) + '</div><div class="level-number">Ур. ' + res.level + '</div><div class="xp-bar"><div class="xp-bar-fill" style="width:' + res.progress + '%;"></div></div><div class="xp-text">Опыт: ' + res.xp + ' / ' + res.xpForNext + ' XP (' + res.progress.toFixed(1) + '%)</div></div>';
        }
    } catch (e) { console.error(e); }
}

async function loadDailyBonus() {
    if (!isFeatureEnabled('dailyBonus')) { const s = document.getElementById('dailyBonusSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('dailyBonusSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getDailyBonusStatus', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const rewards = [50, 75, 100, 150, 200, 300, 500];
            const streak = res.streak || 0;
            const today = streak + (res.claimed ? 0 : 1);
            const d = document.getElementById('dailyBonusDisplay');
            if (d) {
                let daysHtml = '';
                for (let i = 0; i < rewards.length; i++) {
                    const rw = rewards[i];
                    const dn = i + 1;
                    let cls = '';
                    if (dn <= streak) cls = 'claimed';
                    else if (dn === today && !res.claimed) cls = 'today';
                    daysHtml += '<div class="daily-reward-day ' + cls + '"><div class="day-num">День ' + dn + '</div><div class="day-reward">' + rw + '</div></div>';
                }
                const btnText = res.claimed ? '✅ Получено сегодня' : '🎁 Забрать бонус';
                const btnDisabled = res.claimed ? 'disabled style="opacity:0.5;"' : '';
                d.innerHTML = '<div class="daily-bonus-card"><div class="daily-bonus-title">🎁 Ежедневный бонус</div><div class="streak-info">🔥 Серия: ' + streak + ' ' + (streak === 1 ? 'день' : (streak >= 2 && streak <= 4 ? 'дня' : 'дней')) + '</div><div class="daily-rewards">' + daysHtml + '</div><button class="submit-btn dkp-btn" onclick="claimDailyBonus()" ' + btnDisabled + '>' + btnText + '</button></div>';
            }
        }
    } catch (e) { console.error(e); }
}

async function claimDailyBonus() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> ...';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'claimDailyBonus', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('🎁 ' + res.message + '\n\nСледующий бонус: ' + res.nextReward + ' DKP'); loadDailyBonus(); loadMyDkp(); loadPlayerLevel(); }
        else { alert('❌ ' + res.message); btn.disabled = false; btn.innerHTML = '🎁 Забрать бонус'; }
    } catch (e) { alert('❌ Ошибка'); btn.disabled = false; btn.innerHTML = '🎁 Забрать бонус'; }
}

async function loadPersonalStats() {
    if (!isFeatureEnabled('personalStats')) { const s = document.getElementById('personalStatsSection'); if (s) s.style.display = 'none'; return; }
    const s = document.getElementById('personalStatsSection');
    if (s) s.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPersonalStats', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.stats) {
            const st = res.stats;
            const d = document.getElementById('personalStatsDisplay');
            if (d) d.innerHTML = '<div class="personal-stats-grid"><div class="personal-stat-card"><div class="personal-stat-label">🏆 Побед</div><div class="personal-stat-value">' + (st.auctionWins || 0) + '</div></div><div class="personal-stat-card"><div class="personal-stat-label">💰 Баланс</div><div class="personal-stat-value dkp">' + Number(st.balance || 0).toLocaleString('ru-RU') + '</div></div><div class="personal-stat-card"><div class="personal-stat-label">💸 Потрачено</div><div class="personal-stat-value">' + Number(st.totalSpent || 0).toLocaleString('ru-RU') + '</div></div><div class="personal-stat-card"><div class="personal-stat-label">💵 Заработано</div><div class="personal-stat-value success">' + Number(st.totalEarned || 0).toLocaleString('ru-RU') + '</div></div><div class="personal-stat-card"><div class="personal-stat-label">📊 Посещ.</div><div class="personal-stat-value">' + (st.attendanceRate || 0) + '%</div></div><div class="personal-stat-card"><div class="personal-stat-label">🎯 Мероприятий</div><div class="personal-stat-value">' + ((st.eventsAttended || 0) + (st.eventsMissed || 0)) + '</div></div><div class="personal-stat-card"><div class="personal-stat-label">🏅 Рейтинг</div><div class="personal-stat-value">#' + (st.rank || '-') + ' / ' + (st.totalPlayers || 0) + '</div></div></div>';
        }
    } catch (e) { console.error(e); }
}

// ============================================================
// 👤 ПРОСМОТР КАБИНЕТА ДРУГОГО ИГРОКА
// ============================================================

async function viewPlayerCabinet(nickname) {
    const modal = document.getElementById('viewPlayerModal');
    const content = document.getElementById('viewPlayerContent');
    const nickSpan = document.getElementById('viewPlayerNick');
    if (!modal || !content || !nickSpan) return;
    nickSpan.innerText = nickname;
    content.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    modal.classList.remove('hidden');
    try {
        const [dataRes, skillsRes] = await Promise.all([
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerData', nickname: nickname }), redirect: 'follow' }).then(r => r.json()),
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerSkills', nickname: nickname }), redirect: 'follow' }).then(r => r.json())
        ]);
        let html = '';
        const colorMap = { 'Белый': '#94a3b8', 'Зеленый': 'var(--success)', 'Синий': 'var(--accent)', 'Фиолетовый': '#6b4aa8', 'Желтый': 'var(--gold)', 'Красный': 'var(--danger)' };
        if (dataRes.success && dataRes.data) {
            const d = dataRes.data;
            const statusBadge = d.status === 'approved' ? '<span class="status-badge status-approved">✓ Подтверждено</span>' : d.status === 'pending' ? '<span class="status-badge status-pending">⏳ На проверке</span>' : '<span class="status-badge status-rejected">✕ Отклонено</span>';
            html += '<div style="margin-bottom:10px;">' + statusBadge + '</div>';
            html += '<div class="data-grid"><div class="data-item"><div class="data-label">БМ</div><div class="data-value">' + (d.bm ? Number(d.bm).toLocaleString('ru-RU') : '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Уровень</div><div class="data-value">' + (d.level || '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Атака</div><div class="data-value">' + (d.attack || '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Защита</div><div class="data-value">' + (d.defense || '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Меткость</div><div class="data-value">' + (d.accuracy || '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Уклонение</div><div class="data-value">' + (d.evasion || '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Профессия</div><div class="data-value" style="font-size:12px;">' + (d.profession ? escapeHtml(d.profession) + ' ' + getProfessionIconHtml(d.profession) : '—') + '</div></div>';
            html += '<div class="data-item"><div class="data-label">Коллекции</div><div class="data-value" style="font-size:10px;">' + (d.collections ? escapeHtml(d.collections) : '—') + '</div></div></div>';
        } else html += '<div class="empty-state">Данные не найдены</div>';
        if (window._playerGuilds && window._playerGuilds[nickname]) {
            const g = window._playerGuilds[nickname];
            html += '<div style="margin-top:10px;padding:8px;background:var(--warning-soft);border:1px solid var(--warning);border-radius:var(--radius-sm);font-size:11px;"><b>🏰 Гильдия:</b> ' + (g.emblemData ? '<img src="' + g.emblemData + '" class="guild-emblem-badge">' : g.guildIcon) + ' ' + escapeHtml(g.guildName) + '</div>';
        }
        if (skillsRes.success && skillsRes.data && skillsRes.data.skills && skillsRes.data.skills.length > 0) {
            html += '<div style="margin-top:12px;"><div class="panel-title" style="font-size:11px;">🎯 Навыки (' + skillsRes.data.skills.length + ')</div><div class="approved-skills">';
            for (let i = 0; i < skillsRes.data.skills.length; i++) {
                const skillName = skillsRes.data.skills[i];
                const skillObj = allSkills.find(function(s) { return s.name === skillName; });
                const s = skillObj || { name: skillName, color: 'Белый' };
                const color = s.color || 'Белый';
                const borderColor = colorMap[color] || 'var(--border)';
                html += '<div class="approved-skill-badge" style="border-color:' + borderColor + ';">✓ ' + escapeHtml(s.name) + '<span class="skill-color-badge skill-color-' + color + '">' + color + '</span></div>';
            }
            html += '</div></div>';
        }
        content.innerHTML = html;
    } catch (e) { content.innerHTML = '<div class="empty-state">❌ Ошибка: ' + escapeHtml(e.message) + '</div>'; }
}

function closeViewPlayerModal() {
    const modal = document.getElementById('viewPlayerModal');
    if (modal) modal.classList.add('hidden');
}
