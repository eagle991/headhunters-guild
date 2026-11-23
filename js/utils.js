// ============================================================
// 🛠️ УТИЛИТЫ
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeForOnclick(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function getIconBorderColor(c) {
    const colors = {
        'Белый': '#94a3b8',
        'Зеленый': 'var(--success)',
        'Синий': 'var(--accent)',
        'Фиолетовый': '#6b4aa8',
        'Желтый': 'var(--gold)',
        'Красный': 'var(--danger)'
    };
    return colors[c] || 'var(--border)';
}

function getColorClass(c) {
    const cls = {
        'Белый': 'color-white',
        'Зеленый': 'color-green',
        'Синий': 'color-blue',
        'Фиолетовый': 'color-purple',
        'Желтый': 'color-yellow',
        'Красный': 'color-red'
    };
    return cls[c] || 'color-white';
}

function getRoleBadge(r) {
    if (r === 'Админ') return ' <span style="color:var(--danger);font-size:9px;font-weight:700;">[АДМИН]</span>';
    if (r === 'Модератор') return ' <span style="color:var(--warning);font-size:9px;font-weight:700;">[МОД]</span>';
    if (r === 'Гость') return ' <span style="color:var(--text-dim);font-size:9px;font-weight:700;">[ГОСТЬ]</span>';
    return '';
}

function getSelectionInfo(selObj, section, fallbackBase) {
    if (!selObj || !selObj[section]) return null;
    const v = selObj[section];
    let id, enh;
    if (typeof v === 'object' && v.id !== undefined) {
        id = Number(v.id);
        enh = Number(v.enh) || 0;
    } else {
        id = Number(v);
        enh = 0;
    }
    if (fallbackBase && enh === 0 && allItems[id]) {
        enh = Number(allItems[id].enhancement) || 0;
    }
    return { id: id, enh: enh };
}

// ============================================================
// 🌓 ТЕМА
// ============================================================

function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('rf_theme', next);
    updateThemeButton(next);
}

function updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const icon = btn.querySelector('.theme-icon');
    const label = btn.querySelector('.theme-label');
    if (theme === 'dark') {
        if (icon) icon.innerText = '☀️';
        if (label) label.innerText = 'Светлая';
    } else {
        if (icon) icon.innerText = '🌙';
        if (label) label.innerText = 'Темная';
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
    const u = new URL(window.location.href);
    u.searchParams.set('_t', Date.now());
    window.location.href = u.toString();
}

// ============================================================
// 🖼️ ФОН САЙТА + ИКОНКИ ПРОФЕССИЙ
// ============================================================

async function loadSiteBackground() {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getSiteBackground' }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success && res.backgroundImage) {
            document.body.style.setProperty('--site-bg-image', 'url(' + res.backgroundImage + ')');
            document.body.classList.add('has-bg-image');
            const p = document.getElementById('bgPreview');
            if (p) {
                p.style.backgroundImage = 'url(' + res.backgroundImage + ')';
                p.style.borderStyle = 'solid';
                p.style.borderColor = 'var(--success)';
                p.innerText = '';
            }
        } else {
            document.body.style.removeProperty('--site-bg-image');
            document.body.classList.remove('has-bg-image');
        }
    } catch (e) { console.error(e); }
}

async function loadAllProfessionIcons() {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAllProfessionIcons' }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) allProfessionIcons = res.icons || {};
    } catch (e) {}
}

function getProfessionIconHtml(profession, size) {
    if (!size) size = 'small';
    const iconData = allProfessionIcons[profession];
    const def = {
        'Демолишер': '🔨', 'Арбитр': '⚖', 'Каратель': '⚔', 'Фантом': '👻',
        'Дредноут': '🛡', 'Сайфер': '🎯', 'Техник': '🔧', 'Инфорсер': '💥'
    };
    const emoji = def[profession] || '⚔';
    if (size === 'large') {
        if (iconData) return '<div class="profession-icon-large"><img src="' + iconData + '" alt="' + escapeHtml(profession) + '"></div>';
        return '<div class="profession-icon-large">' + emoji + '</div>';
    }
    if (iconData) return '<div class="profession-icon" title="' + escapeHtml(profession) + '"><img src="' + iconData + '" alt="' + escapeHtml(profession) + '"></div>';
    return '<div class="profession-icon" title="' + escapeHtml(profession) + '">' + emoji + '</div>';
}

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ — ЕДИНСТВЕННАЯ В ПРОЕКТЕ
async function loadAndDisplayIcon(type, id, containerId, color) {
    try {
        let action = '';
        let payload = {};
        
        if (type === 'skill') {
            action = 'getSkillIcon';
            payload = { action: action, skillName: id };
        } else if (type === 'item') {
            action = 'getItemIcon';
            payload = { action: action, itemId: Number(id) };
        } else if (type === 'event') {
            action = 'getEventIcon';
            payload = { action: action, eventId: id };
        } else {
            return;
        }
        
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
        const res = await r.json();
        const c = document.getElementById(containerId);
        
        if (!c) {
            console.warn('Контейнер не найден:', containerId);
            return;
        }
        
        if (res.success && res.iconData) {
            c.innerHTML = '<img src="' + res.iconData + '" style="width:100%;height:100%;object-fit:cover;border-radius:3px;">';
            c.style.border = '2px solid ' + (color ? getIconBorderColor(color) : 'var(--border)');
        } else {
            c.innerHTML = '<span class="icon-placeholder" style="font-size:7px;">Нет</span>';
            c.style.border = '2px solid ' + (color ? getIconBorderColor(color) : 'var(--border)');
        }
    } catch (e) {
        console.error('Ошибка загрузки иконки:', type, id, e);
    }
}

async function loadAllPlayersBioColors() {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAllPlayersBioColors' }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) allPlayersBioColors = res.colors || {};
    } catch (e) {}
}

function renderPlayerNickWithBioColor(n, r, clickable, showGuild) {
    const bc = allPlayersBioColors[n] || null;
    const border = bc ? getIconBorderColor(bc) : 'var(--border)';
    let html = '<span class="nick-with-color" style="border-color:' + border + ';' + (clickable ? 'cursor:pointer;' : '') + '"' + (clickable ? ' onclick="viewPlayerCabinet(\'' + escapeForOnclick(n) + '\')"' : '') + '>' + escapeHtml(n) + '</span>';
    if (showGuild && window._playerGuilds && window._playerGuilds[n]) {
        const g = window._playerGuilds[n];
        if (g.emblemData) {
            html += '<img src="' + g.emblemData + '" class="guild-emblem-badge" title="' + escapeHtml(g.guildName) + '">';
        } else if (g.guildIcon) {
            html += '<span class="guild-badge" title="' + escapeHtml(g.guildName) + '">' + g.guildIcon + ' ' + escapeHtml(g.guildName) + '</span>';
        }
    }
    if (r) html += getRoleBadge(r);
    return html;
}

// ============================================================
// 📊 ТОПЫ С 6 ТАБАМИ
// ============================================================

function switchTopTab(type, listId, btnElement) {
    const header = btnElement.parentElement;
    const buttons = header.querySelectorAll('.top-tab-btn');
    for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
    btnElement.classList.add('active');
    currentTopType[listId] = type;
    loadTopByType(type, listId);
}

async function loadTopByType(type, listId) {
    const container = document.getElementById(listId);
    if (!container) return;
    container.innerHTML = '<div class="top-tabs-loading"><span class="loader"></span> Загрузка...</div>';
    try {
        let html = '';
        if (type === 'bm' || type === 'level') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayers' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success && res.players && res.players.length > 0) {
                const p = res.players;
                const sorted = type === 'bm'
                    ? p.slice().sort(function(a, b) { return Number(b.bm) - Number(a.bm); }).slice(0, 10)
                    : p.slice().sort(function(a, b) { return Number(b.level) - Number(a.level); }).slice(0, 10);
                html = '<div class="top-list">';
                for (let i = 0; i < sorted.length; i++) {
                    const x = sorted[i];
                    const rk = i + 1;
                    const rc = rk <= 3 ? 'rank-' + rk : '';
                    const value = type === 'bm' ? Number(x.bm).toLocaleString('ru-RU') : 'Ур. ' + x.level;
                    html += '<div class="top-item ' + rc + '"><div class="top-rank ' + rc + '">#' + rk + '</div><div class="top-nick">' + renderPlayerNickWithBioColor(x.nickname, x.role, true, true) + '</div><div class="top-value">' + value + '</div></div>';
                }
                html += '</div>';
            } else html = '<div class="empty-state">Нет данных</div>';
        } else if (type === 'dkp') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllDKP' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success && res.players && res.players.length > 0) {
                const top = res.players.slice(0, 10);
                html = '<div class="top-list">';
                for (let i = 0; i < top.length; i++) {
                    const x = top[i];
                    const rk = i + 1;
                    const rc = rk <= 3 ? 'rank-' + rk : '';
                    html += '<div class="top-item ' + rc + '"><div class="top-rank ' + rc + '">#' + rk + '</div><div class="top-nick">' + renderPlayerNickWithBioColor(x.nickname, null, true, true) + '</div><div class="top-value dkp">' + Number(x.balance).toLocaleString('ru-RU') + ' 💰</div></div>';
                }
                html += '</div>';
            } else html = '<div class="empty-state">Нет данных</div>';
        } else if (type === 'absentees') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getTopAbsentees' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success && res.players && res.players.length > 0) {
                html = '<div class="top-list">';
                for (let i = 0; i < res.players.length; i++) {
                    const p = res.players[i];
                    const rk = i + 1;
                    const rc = rk <= 3 ? 'rank-' + rk : '';
                    let rateColor = 'var(--danger)';
                    if (p.attendanceRate >= 70) rateColor = 'var(--success)';
                    else if (p.attendanceRate >= 40) rateColor = 'var(--warning)';
                    html += '<div class="top-item ' + rc + '"><div class="top-rank ' + rc + '">#' + rk + '</div><div class="top-nick">' + renderPlayerNickWithBioColor(p.nickname, null, true, true) + ' ' + getProfessionIconHtml(p.profession) + '</div><div style="text-align:right;"><div class="top-value" style="color:' + rateColor + ';font-size:12px;">' + p.attendanceRate + '%</div><div style="font-size:8px;color:var(--text-dim);">' + p.attended + '/' + p.total + '</div></div></div>';
                }
                html += '</div>';
            } else html = '<div class="empty-state">Нет данных</div>';
        } else if (type === 'equipTop') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentTop' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success && res.top && res.top.length > 0) {
                html = '<div class="top-list">';
                for (let i = 0; i < res.top.length; i++) {
                    const p = res.top[i];
                    const rk = i + 1;
                    const rc = rk <= 3 ? 'rank-' + rk : '';
                    html += '<div class="top-item ' + rc + '"><div class="top-rank ' + rc + '">#' + rk + '</div><div class="top-nick">' + renderPlayerNickWithBioColor(p.nickname, null, true, true) + '</div><div class="top-value" style="color:var(--dkp);">⚔ ' + p.score + '</div></div>';
                }
                html += '</div>';
            } else html = '<div class="empty-state">Нет данных</div>';
        } else if (type === 'guilds') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getTopGuilds' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success && res.guilds && res.guilds.length > 0) {
                html = '<div class="top-list">';
                for (let i = 0; i < res.guilds.length; i++) {
                    const g = res.guilds[i];
                    const rk = i + 1;
                    const rc = rk <= 3 ? 'rank-' + rk : '';
                    const iconHtml = g.emblemData
                        ? '<img src="' + g.emblemData + '" style="width:24px;height:24px;border-radius:3px;border:1px solid var(--accent);object-fit:cover;margin-right:4px;vertical-align:middle;">'
                        : '<span style="font-size:16px;margin-right:4px;">' + g.icon + '</span>';
                    html += '<div class="top-item ' + rc + '"><div class="top-rank ' + rc + '">#' + rk + '</div><div class="top-nick">' + iconHtml + '<span style="cursor:pointer;" onclick="showGuildInfo(\'' + escapeForOnclick(g.id) + '\')">' + escapeHtml(g.name) + '</span></div><div class="top-value" style="color:var(--dkp);">' + g.totalRating.toLocaleString('ru-RU') + '</div><div style="font-size:9px;color:var(--text-dim);min-width:60px;text-align:right;">👥 ' + g.membersCount + '</div></div>';
                }
                html += '</div>';
            } else html = '<div class="empty-state">Нет гильдий</div>';
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div class="empty-state">❌ Ошибка</div>';
        console.error('Top load error:', e);
    }
}

async function loadPublicTops() {
    if (!currentUser) return;
    const pubContainer = document.getElementById('publicTopContainer');
    if (pubContainer) pubContainer.style.display = 'block';
    const pubPrompt = document.getElementById('publicLoginPrompt');
    if (pubPrompt) pubPrompt.style.display = 'none';
    await loadTopByType(currentTopType['publicTopList'] || 'bm', 'publicTopList');
    await loadTopByType(currentTopType['mainTopList'] || 'bm', 'mainTopList');
}

// ============================================================
// ⚙️ УПРАВЛЕНИЕ ФУНКЦИЯМИ САЙТА
// ============================================================

async function loadSiteFeatures() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSiteFeatures' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            siteFeatures = {};
            for (let i = 0; i < res.features.length; i++) {
                siteFeatures[res.features[i].name] = res.features[i].enabled;
            }
        }
    } catch (e) { console.error(e); }
}

function isFeatureEnabled(name) {
    return siteFeatures[name] === true;
}

async function toggleFeature(name, enabled) {
    if (!confirm((enabled ? 'Включить' : 'Выключить') + ' "' + name + '"?')) {
        loadAdminFeatures();
        return;
    }
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'toggleSiteFeature', featureName: name, enabled: enabled }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) {
            siteFeatures[name] = enabled;
            loadAdminFeatures();
            alert(res.message);
        } else {
            alert('❌ ' + res.message);
            loadAdminFeatures();
        }
    } catch (e) {
        alert('❌ Ошибка');
        loadAdminFeatures();
    }
}

async function loadAdminFeatures() {
    const l = document.getElementById('featuresList');
    if (!l) return;
    await loadSiteFeatures();
    const desc = {
        'achievements': '🏆 Система достижений',
        'levels': '📊 Уровни и опыт',
        'personalStats': '📈 Личная статистика',
        'announcements': '📢 Объявления админа',
        'actionLog': '📝 Лог действий',
        'cosmeticsShop': '🛍️ Магазин косметики',
        'friends': '👥 Система друзей',
        'dailyBonus': '🎁 Ежедневные бонусы',
        'dataExport': '📤 Экспорт данных',
        'twinks': '🔗 Привязка твинков',
        'skillRarity': '🎨 Редкость навыков',
        'missingLists': '📋 Списки "у кого нет"',
        'equipTop': '🏅 Топ по экипировке',
        'auctionRating': '🎯 Рейтинг перед аукционом',
        'auction5min': '⏰ Уведомления за 5 мин',
        'penalties': '⚠️ Штрафы за пропуски'
    };
    let html = '';
    for (const n in desc) {
        const en = isFeatureEnabled(n);
        html += '<div class="feature-toggle"><div style="flex:1;"><div class="feature-name">' + desc[n] + '</div><div class="feature-desc">Код: ' + n + '</div></div><div style="display:flex;align-items:center;gap:6px;"><span class="feature-status ' + (en ? 'on' : 'off') + '">' + (en ? '✅ ВКЛ' : '⚠️ ВЫКЛ') + '</span><button class="btn-edit" style="width:auto;margin-top:0;padding:3px 8px;" onclick="toggleFeature(\'' + escapeForOnclick(n) + '\', ' + (!en) + ')">' + (en ? 'Выключить' : 'Включить') + '</button></div></div>';
    }
    l.innerHTML = html;
}

// ============================================================
// 🔄 ПРОВЕРКА ОБНОВЛЕНИЙ
// ============================================================

let lastKnownVersion = null;

async function checkForUpdates() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getVersion' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.version) {
            if (lastKnownVersion === null) {
                lastKnownVersion = res.version;
            } else if (lastKnownVersion !== res.version) {
                if (currentUser && currentRole) {
                    localStorage.setItem('rf_session', JSON.stringify({
                        user: currentUser,
                        role: currentRole,
                        timestamp: Date.now()
                    }));
                }
                if (confirm('🔄 Доступна новая версия!\n\nOK — обновить.')) forceReload();
                lastKnownVersion = res.version;
            }
        }
    } catch (e) {}
}

// Инициализация
loadSiteBackground();
loadAllProfessionIcons();
loadAllPlayersBioColors();
