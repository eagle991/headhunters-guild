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

    if (grid) grid.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getAdminDashboard');

        if (res.success) {
            const d = res.dashboard || {};

            if (grid) {
                grid.innerHTML = `
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <div class="dashboard-icon">👥</div>
                            <div class="dashboard-value">${d.totalPlayers || 0}</div>
                            <div class="dashboard-label">Игроков</div>
                        </div>
                        <div class="dashboard-card">
                            <div class="dashboard-icon">💰</div>
                            <div class="dashboard-value">${(d.totalDkp || 0).toLocaleString('ru-RU')}</div>
                            <div class="dashboard-label">Всего DKP</div>
                        </div>
                        <div class="dashboard-card">
                            <div class="dashboard-icon">🔨</div>
                            <div class="dashboard-value">${d.activeAuctions || 0}</div>
                            <div class="dashboard-label">Аукционов</div>
                        </div>
                        <div class="dashboard-card">
                            <div class="dashboard-icon">📦</div>
                            <div class="dashboard-value">${d.pendingQueue || 0}</div>
                            <div class="dashboard-label">В очереди</div>
                        </div>
                    </div>`;
            }

            if (popularList && d.popularItems) {
                renderPopularItems(popularList, d.popularItems);
            }
        } else {
            if (grid) grid.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
        }
    } catch (e) {
        if (grid) grid.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function renderPopularItems(container, items) {
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет данных</div>';
        return;
    }

    let html = '';
    for (const item of items) {
        html += '<div class="popular-item">';
        html += '<div class="popular-item-name">' + escapeHtml(item.name) + '</div>';
        html += '<div class="popular-item-count">' + (item.count || 0) + ' раз</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

async function loadPlayerAnalytics() {
    const container = document.getElementById('playerAnalyticsContent');
    if (!container || !currentUser) return;

    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getPlayerAnalytics', { nickname: currentUser });

        if (res.success) {
            const d = res.data || {};
            container.innerHTML = `
                <div class="analytics-card">
                    <div class="analytics-title">Моя статистика</div>
                    <div class="data-grid">
                        <div class="data-item"><div class="data-label">Аукционов выиграно</div><div class="data-value">${d.auctionsWon || 0}</div></div>
                        <div class="data-item"><div class="data-label">Потрачено DKP</div><div class="data-value">${(d.dkpSpent || 0).toLocaleString('ru-RU')}</div></div>
                        <div class="data-item"><div class="data-label">Получено предметов</div><div class="data-value">${d.itemsReceived || 0}</div></div>
                    </div>
                </div>`;
        } else {
            container.innerHTML = '<div class="empty-state">Нет данных</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function comparePlayers() {
    const targetNick = document.getElementById('compareNick')?.value?.trim();
    if (!targetNick) {
        alert('Введите никнейм для сравнения');
        return;
    }

    try {
        const res = await api('comparePlayers', {
            myNick: currentUser,
            targetNick: targetNick
        });

        if (res.success) {
            document.getElementById('playersList')?.classList.add('hidden');
            document.getElementById('compareView')?.classList.remove('hidden');
            renderComparison(res.data);
        } else {
            alert('Сравнение недоступно');
        }
    } catch (e) {
        alert('Ошибка');
    }
}

function renderComparison(data) {
    const myStats = document.getElementById('myStats');
    const compareStats = document.getElementById('compareStats');

    if (!myStats || !compareStats) return;

    const stats = [
        { l: 'БМ', m: myPlayerData?.bm, o: data.bm },
        { l: 'Уровень', m: myPlayerData?.level, o: data.level },
        { l: 'Атака', m: myPlayerData?.attack, o: data.attack },
        { l: 'Защита', m: myPlayerData?.defense, o: data.defense },
        { l: 'Меткость', m: myPlayerData?.accuracy, o: data.accuracy },
        { l: 'Уклонение', m: myPlayerData?.evasion, o: data.evasion }
    ];

    let myHtml = '';
    let compHtml = '';

    for (const x of stats) {
        let myClass = 'equal';
        if (Number(x.m) > Number(x.o)) myClass = 'better';
        else if (Number(x.m) < Number(x.o)) myClass = 'worse';

        let compClass = 'equal';
        if (Number(x.o) > Number(x.m)) compClass = 'better';
        else if (Number(x.o) < Number(x.m)) compClass = 'worse';

        myHtml += '<div class="compare-stat"><span class="compare-label">' + x.l + '</span><span class="compare-value ' + myClass + '">' + (x.m || '—') + '</span></div>';
        compHtml += '<div class="compare-stat"><span class="compare-label">' + x.l + '</span><span class="compare-value ' + compClass + '">' + (x.o || '—') + '</span></div>';
    }

    myStats.innerHTML = myHtml;
    compareStats.innerHTML = compHtml;
}

function backToRanking() {
    document.getElementById('playersList')?.classList.remove('hidden');
    document.getElementById('compareView')?.classList.add('hidden');
}
