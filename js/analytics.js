// ============================================================
// 📊 АНАЛИТИКА
// ============================================================

async function loadAnalytics() {
    const adminDashboard = document.getElementById('adminDashboard');
    const playerAnalytics = document.getElementById('playerAnalytics');
    if (currentRole === 'Админ' || currentRole === 'Модератор') {
        if (adminDashboard) adminDashboard.style.display = 'block';
        if (playerAnalytics) playerAnalytics.style.display = 'none';
        await loadAdminDashboard();
    } else {
        if (adminDashboard) adminDashboard.style.display = 'none';
        if (playerAnalytics) playerAnalytics.style.display = 'block';
        await loadPlayerAnalytics();
    }
}

async function loadAdminDashboard() {
    const grid = document.getElementById('dashboardGrid');
    const popularList = document.getElementById('popularItemsList');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAdminDashboard' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const d = res.dashboard;
            grid.innerHTML = '<div class="dashboard-grid"><div class="dashboard-card"><div class="dashboard-icon">👥</div><div class="dashboard-value">' + d.totalPlayers + '</div><div class="dashboard-label">Всего игроков</div></div><div class="dashboard-card"><div class="dashboard-icon">🟢</div><div class="dashboard-value success">' + d.activeToday + '</div><div class="dashboard-label">Активны сегодня</div></div><div class="dashboard-card"><div class="dashboard-icon">💰</div><div class="dashboard-value dkp">' + d.totalDKPDistributed.toLocaleString('ru-RU') + '</div><div class="dashboard-label">Распределено DKP</div></div><div class="dashboard-card"><div class="dashboard-icon">💸</div><div class="dashboard-value">' + d.totalDKPSpent.toLocaleString('ru-RU') + '</div><div class="dashboard-label">Потрачено DKP</div></div><div class="dashboard-card"><div class="dashboard-icon">💼</div><div class="dashboard-value">' + d.totalDKPBalance.toLocaleString('ru-RU') + '</div><div class="dashboard-label">Общий баланс DKP</div></div><div class="dashboard-card"><div class="dashboard-icon">🔨</div><div class="dashboard-value">' + d.completedAuctions + '/' + d.totalAuctions + '</div><div class="dashboard-label">Аукционов</div></div><div class="dashboard-card"><div class="dashboard-icon">🏰</div><div class="dashboard-value">' + d.totalGuilds + '</div><div class="dashboard-label">Гильдий</div></div><div class="dashboard-card"><div class="dashboard-icon">🚫</div><div class="dashboard-value danger">' + d.bannedPlayers + '</div><div class="dashboard-label">Заблокировано</div></div></div>';
            if (popularList) {
                if (d.popularItems && d.popularItems.length > 0) {
                    let html = '';
                    for (let i = 0; i < d.popularItems.length; i++) {
                        const item = d.popularItems[i];
                        const rc = i < 3 ? 'top-' + (i + 1) : '';
                        html += '<div class="popular-item"><div class="popular-item-rank ' + rc + '">#' + (i + 1) + '</div><div class="popular-item-name">' + escapeHtml(item.name) + '</div><div class="popular-item-count">' + item.count + ' раз</div></div>';
                    }
                    popularList.innerHTML = html;
                } else popularList.innerHTML = '<div class="empty-state">Нет данных</div>';
            }
        }
    } catch (e) { grid.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

async function loadPlayerAnalytics() {
    try {
        if (myPlayerData && myPlayerData.bm) {
            const bmEl = document.getElementById('currentBM');
            if (bmEl) bmEl.innerText = Number(myPlayerData.bm).toLocaleString('ru-RU');
        }
        const auctionR = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerAuctionStats', playerName: currentUser }), redirect: 'follow' });
        const auctionRes = await auctionR.json();
        if (auctionRes.success) {
            const s = auctionRes.stats;
            const el1 = document.getElementById('auctionWins'); if (el1) el1.innerText = s.wins;
            const el2 = document.getElementById('auctionLosses'); if (el2) el2.innerText = s.losses;
            const el3 = document.getElementById('totalSpent'); if (el3) el3.innerText = s.totalSpent.toLocaleString('ru-RU');
            const winsList = document.getElementById('myWinsList');
            if (winsList && s.itemsWon && s.itemsWon.length > 0) {
                let html = '';
                for (const item of s.itemsWon) {
                    const bc = getIconBorderColor(item.color);
                    html += '<div class="popular-item"><div style="width:30px;height:30px;border:2px solid ' + bc + ';border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-panel);font-size:14px;">📦</div><div style="flex:1;"><div class="popular-item-name">' + escapeHtml(item.itemName) + '</div><div style="font-size:9px;color:var(--text-dim);">' + escapeHtml(item.tier || 'т0') + ' | ' + escapeHtml(item.color) + ' • ' + item.date + '</div></div><div class="popular-item-count">' + item.bid + ' DKP</div></div>';
                }
                winsList.innerHTML = html;
            } else if (winsList) winsList.innerHTML = '<div class="empty-state">Нет выигрышей</div>';
        }
        const attR = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerAttendanceStats', playerName: currentUser, months: 3 }), redirect: 'follow' });
        const attRes = await attR.json();
        if (attRes.success) {
            const s = attRes.stats;
            const el4 = document.getElementById('attendanceRate'); if (el4) el4.innerText = s.attendanceRate + '%';
            const el5 = document.getElementById('attendedEvents'); if (el5) el5.innerText = s.attended;
            const el6 = document.getElementById('missedEvents'); if (el6) el6.innerText = s.missed;
        }
    } catch (e) { console.error('loadPlayerAnalytics error:', e); }
}

// ============================================================
// 🏅 РЕЙТИНГ ИГРОКОВ
// ============================================================

async function loadAllPlayers() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayers' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('rankingList');
        if (!l) return;
        if (res.success && res.players.length > 0) {
            let html = '<div class="ranking-list">';
            for (let i = 0; i < res.players.length; i++) {
                const p = res.players[i];
                const rk = i + 1;
                let rc = '';
                if (rk === 1) rc = 'top-1';
                else if (rk === 2) rc = 'top-2';
                else if (rk === 3) rc = 'top-3';
                html += '<div class="ranking-item"><div class="ranking-position ' + rc + '">#' + rk + '</div><div class="ranking-info"><div class="ranking-nick">' + renderPlayerNickWithBioColor(p.nickname, p.role, true, true) + ' ' + getProfessionIconHtml(p.profession) + '</div><div class="ranking-stats">Ур. ' + p.level + ' | ' + escapeHtml(p.profession) + '</div></div><div class="ranking-bm">БМ: ' + Number(p.bm).toLocaleString('ru-RU') + '</div><button class="btn-compare" onclick="compareWithPlayer(\'' + escapeForOnclick(p.nickname) + '\')">⚔</button></div>';
            }
            html += '</div>';
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет</div>';
    } catch (e) {}
}

async function compareWithPlayer(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerForCompare', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && myPlayerData && myPlayerData.status === 'approved') {
            document.getElementById('playersList').classList.add('hidden');
            document.getElementById('compareView').classList.remove('hidden');
            document.getElementById('myNick').innerText = currentUser;
            document.getElementById('compareNick').innerText = res.data.nickname;
            const st = [{ l: 'БМ', m: myPlayerData.bm, o: res.data.bm }, { l: 'Уровень', m: myPlayerData.level, o: res.data.level }, { l: 'Атака', m: myPlayerData.attack, o: res.data.attack }, { l: 'Защита', m: myPlayerData.defense, o: res.data.defense }, { l: 'Меткость', m: myPlayerData.accuracy, o: res.data.accuracy }, { l: 'Уклонение', m: myPlayerData.evasion, o: res.data.evasion }];
            let myHtml = '';
            for (let i = 0; i < st.length; i++) {
                const x = st[i];
                let c = 'equal';
                if (Number(x.m) > Number(x.o)) c = 'better';
                else if (Number(x.m) < Number(x.o)) c = 'worse';
                myHtml += '<div class="compare-stat"><span class="compare-label">' + x.l + '</span><span class="compare-value ' + c + '">' + x.m + '</span></div>';
            }
            document.getElementById('myStats').innerHTML = myHtml;
            let compHtml = '';
            for (let i = 0; i < st.length; i++) {
                const x = st[i];
                let c = 'equal';
                if (Number(x.o) > Number(x.m)) c = 'better';
                else if (Number(x.o) < Number(x.m)) c = 'worse';
                compHtml += '<div class="compare-stat"><span class="compare-label">' + x.l + '</span><span class="compare-value ' + c + '">' + x.o + '</span></div>';
            }
            document.getElementById('compareStats').innerHTML = compHtml;
        } else alert('Сравнение недоступно.');
    } catch (e) {}
}

function backToRanking() {
    document.getElementById('playersList').classList.remove('hidden');
    document.getElementById('compareView').classList.add('hidden');
}

// ============================================================
// 📅 КАЛЕНДАРЬ
// ============================================================

async function loadCalendarPlayers() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('calendarPlayerFilter');
        if (res.success && s) {
            const cv = s.value;
            let html = '<option value="">Все</option>';
            for (let i = 0; i < res.nicks.length; i++) html += '<option value="' + escapeHtml(res.nicks[i]) + '">' + escapeHtml(res.nicks[i]) + '</option>';
            s.innerHTML = html;
            s.value = cv;
        }
        const t = new Date();
        const ma = new Date();
        ma.setDate(t.getDate() - 30);
        const si = document.getElementById('calendarStartDate');
        const ei = document.getElementById('calendarEndDate');
        if (si && !si.value) si.value = ma.toISOString().split('T')[0];
        if (ei && !ei.value) ei.value = t.toISOString().split('T')[0];
    } catch (e) {}
}

async function loadCalendar() {
    const s = document.getElementById('calendarStartDate').value;
    const e = document.getElementById('calendarEndDate').value;
    const p = document.getElementById('calendarPlayerFilter').value;
    if (!s || !e) { alert('Выберите даты'); return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAttendance', startDate: s, endDate: e, nickname: p || null }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) renderCalendar(res.records, s, e, p);
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка'); }
}

async function loadMyCalendar() {
    const s = document.getElementById('calendarStartDate').value;
    const e = document.getElementById('calendarEndDate').value;
    if (!s || !e) { alert('Выберите даты'); return; }
    document.getElementById('calendarPlayerFilter').value = currentUser;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAttendance', startDate: s, endDate: e, nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) renderCalendar(res.records, s, e, currentUser);
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка'); }
}

function renderCalendar(recs, sd, ed, pf) {
    const g = document.getElementById('calendarGrid');
    const s = document.getElementById('calendarStats');
    if (!recs || recs.length === 0) {
        if (g) g.innerHTML = '<div class="empty-state">Нет данных</div>';
        if (s) s.innerHTML = '';
        return;
    }
    const gr = {};
    for (let i = 0; i < recs.length; i++) {
        const r = recs[i];
        if (!gr[r.date]) gr[r.date] = {};
        if (!gr[r.date][r.eventName]) gr[r.date][r.eventName] = { attended: [], missed: [], eventDkp: r.eventDkp };
        if (r.status === 'attended') gr[r.date][r.eventName].attended.push({ nickname: r.nickname, dkpEarned: r.dkpEarned });
        else gr[r.date][r.eventName].missed.push(r.nickname);
    }
    let ta = 0, tm = 0, td = 0;
    for (let i = 0; i < recs.length; i++) {
        const r = recs[i];
        if (r.status === 'attended') { ta++; td += r.dkpEarned; }
        else tm++;
    }
    const te = Object.keys(gr).reduce(function(sum, d) { return sum + Object.keys(gr[d]).length; }, 0);
    const ar = ta + tm > 0 ? Math.round((ta / (ta + tm)) * 100) : 0;
    if (s) s.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:4px;margin-bottom:10px;"><div class="data-item"><div class="data-label">Период</div><div class="data-value" style="font-size:9px;">' + sd + ' — ' + ed + '</div></div><div class="data-item"><div class="data-label">Мероприятий</div><div class="data-value">' + te + '</div></div><div class="data-item"><div class="data-label">Посещений</div><div class="data-value" style="color:var(--success);">' + ta + '</div></div><div class="data-item"><div class="data-label">Пропусков</div><div class="data-value" style="color:var(--danger);">' + tm + '</div></div><div class="data-item"><div class="data-label">Посещ.</div><div class="data-value" style="color:var(--dkp);">' + ar + '%</div></div><div class="data-item"><div class="data-label">DKP</div><div class="data-value" style="color:var(--dkp);">' + td.toFixed(1) + '</div></div></div>';
    const ds = Object.keys(gr).sort();
    if (g) {
        let html = '';
        for (let i = 0; i < ds.length; i++) {
            const d = ds[i];
            const evs = gr[d];
            let eh = '';
            for (const n in evs) {
                const da = evs[n];
                eh += '<div class="calendar-event"><div class="calendar-event-title">🏆 ' + escapeHtml(n) + ' (+' + da.eventDkp + ')</div>';
                if (da.attended.length > 0) {
                    eh += '<div style="margin-bottom:3px;"><div class="calendar-label attended">✓ (' + da.attended.length + '):</div><div class="calendar-players">';
                    for (let j = 0; j < da.attended.length; j++) {
                        const p = da.attended[j];
                        eh += '<span class="calendar-nick-attended">' + escapeHtml(p.nickname) + ' (+' + p.dkpEarned + ')</span>';
                    }
                    eh += '</div></div>';
                }
                if (da.missed.length > 0) {
                    eh += '<div><div class="calendar-label missed">✕ (' + da.missed.length + '):</div><div class="calendar-players">';
                    for (let j = 0; j < da.missed.length; j++) eh += '<span class="calendar-nick-missed">' + escapeHtml(da.missed[j]) + '</span>';
                    eh += '</div></div>';
                }
                eh += '</div>';
            }
            html += '<div class="calendar-day"><div class="calendar-date">📅 ' + d + '</div>' + eh + '</div>';
        }
        g.innerHTML = html;
    }
}

// ============================================================
// 📊 АКТИВНОСТЬ
// ============================================================

async function loadTodayActivity() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getTodayActivity' }), redirect: 'follow' });
        const res = await r.json();
        const b = document.getElementById('todayActivityBlock');
        if (!b) return;
        if (res.success && res.events.length > 0) {
            let html = '';
            for (let i = 0; i < res.events.length; i++) {
                const e = res.events[i];
                html += '<div class="player-card" style="margin-bottom:6px;"><div class="player-card-header"><div style="display:flex;align-items:center;gap:8px;flex:1;"><div><div class="player-nick" style="color:var(--dkp);">🏆 ' + escapeHtml(e.name) + '</div><div style="font-size:10px;color:var(--dkp);font-weight:700;">+' + e.eventDkp + ' DKP</div></div></div></div>';
                html += '<div style="margin-bottom:4px;"><div style="font-size:9px;color:var(--success);margin-bottom:2px;font-weight:700;">✓ Были (' + e.attended.length + '):</div><div style="display:flex;flex-wrap:wrap;gap:2px;">';
                for (let j = 0; j < e.attended.length; j++) {
                    const p = e.attended[j];
                    html += '<span class="submission-nick-tag" style="background:var(--success-soft);border-color:var(--success);color:var(--success);">' + renderPlayerNickWithBioColor(p.nickname, null, true, true) + ' (+' + p.dkpEarned + ')</span>';
                }
                html += '</div></div>';
                if (e.missed.length > 0) {
                    html += '<div><div style="font-size:9px;color:var(--danger);margin-bottom:2px;font-weight:700;">✕ Пропустили (' + e.missed.length + '):</div><div style="display:flex;flex-wrap:wrap;gap:2px;">';
                    for (let j = 0; j < e.missed.length; j++) html += '<span class="submission-nick-tag" style="background:var(--danger-soft);border-color:var(--danger);color:var(--danger);">' + renderPlayerNickWithBioColor(e.missed[j], null, true, true) + '</span>';
                    html += '</div></div>';
                }
                html += '</div>';
            }
            b.innerHTML = html;
        } else b.innerHTML = '<div class="empty-state">Сегодня нет мероприятий</div>';
    } catch (e) { const b = document.getElementById('todayActivityBlock'); if (b) b.innerHTML = '<div class="empty-state">Ошибка</div>'; }
}

async function loadWeeklyActivity() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getWeeklyActivity' }), redirect: 'follow' });
        const res = await r.json();
        const b = document.getElementById('weeklyActivityBlock');
        if (!b) return;
        if (res.success && res.days.length > 0) {
            let html = '';
            for (let i = 0; i < res.days.length; i++) {
                const d = res.days[i];
                let eh = '';
                for (const n in d.events) {
                    const e = d.events[n];
                    eh += '<div style="margin-bottom:4px;padding:6px;background:var(--bg-soft);border-radius:var(--radius-sm);border-left:2px solid var(--dkp);"><div style="font-size:10px;color:var(--dkp);font-weight:700;">🏆 ' + escapeHtml(e.name) + ' (+' + e.eventDkp + ')</div><div style="font-size:9px;color:var(--success);">✓ ' + e.attended.length + ' | ✕ ' + e.missed.length + '</div></div>';
                }
                html += '<div style="margin-bottom:10px;"><div style="font-size:11px;color:var(--accent);font-family:var(--font-display);margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid var(--border);font-weight:700;">📅 ' + d.date + '</div>' + eh + '</div>';
            }
            b.innerHTML = html;
        } else b.innerHTML = '<div class="empty-state">На неделе нет мероприятий</div>';
    } catch (e) { const b = document.getElementById('weeklyActivityBlock'); if (b) b.innerHTML = '<div class="empty-state">Ошибка</div>'; }
}

async function loadEventStats() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEventStats' }), redirect: 'follow' });
        const res = await r.json();
        const b = document.getElementById('eventStatsBlock');
        if (!b) return;
        if (res.success && res.stats.length > 0) {
            let html = '<div class="event-stats-grid">';
            for (let i = 0; i < res.stats.length; i++) {
                const s = res.stats[i];
                const mb = Math.max(s.month, s.week, 1);
                const mp = (s.month / mb) * 100;
                const wp = (s.week / mb) * 100;
                html += '<div class="event-stat-card"><div class="event-stat-header"><div style="flex:1;"><div class="event-stat-name">' + escapeHtml(s.name) + '</div><div class="event-stat-total">Всего: ' + s.total + '</div></div></div><div class="progress-row"><div class="progress-label"><span>Месяц</span><span style="color:var(--accent);">' + s.month + '</span></div><div class="progress-track"><div class="progress-fill month" style="width:' + mp + '%;"></div></div></div><div class="progress-row"><div class="progress-label"><span>Неделя</span><span style="color:var(--success);">' + s.week + '</span></div><div class="progress-track"><div class="progress-fill week" style="width:' + wp + '%;"></div></div></div><div class="event-stat-footer"><span class="attended">✓ ' + s.attended + '</span><span class="missed">✕ ' + s.missed + '</span></div></div>';
            }
            html += '</div>';
            b.innerHTML = html;
        } else b.innerHTML = '<div class="empty-state">Статистика недоступна</div>';
    } catch (e) { const b = document.getElementById('eventStatsBlock'); if (b) b.innerHTML = '<div class="empty-state">Ошибка</div>'; }
}
