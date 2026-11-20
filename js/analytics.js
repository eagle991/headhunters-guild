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
                    let html = '<div class="popular-items-list">';
                    for (let i = 0; i < d.popularItems.length; i++) {
                        const item = d.popularItems[i];
                        const rc = i < 3 ? 'top-' + (i + 1) : '';
                        html += '<div class="popular-item"><div class="popular-item-rank ' + rc + '">#' + (i + 1) + '</div><div class="popular-item-name">' + escapeHtml(item.name) + '</div><div class="popular-item-count">' + item.count + ' раз</div></div>';
                    }
                    html += '</div>';
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
                let html = '<div class="popular-items-list">';
                for (const item of s.itemsWon) {
                    const bc = getIconBorderColor(item.color);
                    html += '<div class="popular-item"><div style="width:30px;height:30px;border:2px solid ' + bc + ';border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-panel);font-size:14px;">📦</div><div style="flex:1;"><div class="popular-item-name">' + escapeHtml(item.itemName) + '</div><div style="font-size:9px;color:var(--text-dim);">' + escapeHtml(item.tier || 'т0') + ' | ' + escapeHtml(item.color) + ' • ' + item.date + '</div></div><div class="popular-item-count">' + item.bid + ' DKP</div></div>';
                }
                html += '</div>';
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
