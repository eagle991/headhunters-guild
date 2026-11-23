// ============================================================
// 👤 КАБИНЕТ ИГРОКА
// ============================================================

async function loadPlayerData() {
    if (!currentUser) return;

    try {
        const res = await api('getPlayerData', { nickname: currentUser });

        const form = document.getElementById('playerDataForm');
        const approvedMsg = document.getElementById('approvedMessage');
        const empty = document.getElementById('cabinetEmpty');
        const approvedGrid = document.getElementById('approvedDataGrid');
        const status = document.getElementById('playerStatus');
        const screenshots = document.getElementById('characterScreenshotsBlock');

        if (!res.success) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        const d = res.data;
        myPlayerData = d;
        if (typeof AppState !== 'undefined') AppState.myPlayerData = d;

        setValue('bm', d.bm);
        setValue('level', d.level);
        setValue('attack', d.attack);
        setValue('defense', d.defense);
        setValue('accuracy', d.accuracy);
        setValue('evasion', d.evasion);
        setValue('profession', d.profession);

        if (d.status === 'approved') {
            if (status) status.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
            if (form) form.classList.add('hidden');
            if (approvedMsg) approvedMsg.classList.remove('hidden');
            if (approvedGrid) approvedGrid.classList.remove('hidden');
            renderApprovedPlayerData(d);
        } else {
            if (status) status.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
            if (form) form.classList.remove('hidden');
            if (approvedMsg) approvedMsg.classList.add('hidden');
        }

        if (screenshots) screenshots.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');

        // Загружаем дополнительные блоки
        loadPlayerLevel();
        loadDailyBonus();
        loadAchievements();
        loadFriends();
        loadCosmetics();
        loadTwinks();
        loadPlayerEmail();

    } catch (e) {
        console.error('loadPlayerData error:', e);
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function renderApprovedPlayerData(data) {
    const grid = document.getElementById('approvedDataGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="data-item"><div class="data-label">БМ</div><div class="data-value">${data.bm || '—'}</div></div>
        <div class="data-item"><div class="data-label">Уровень</div><div class="data-value">${data.level || '—'}</div></div>
        <div class="data-item"><div class="data-label">Атака</div><div class="data-value">${data.attack || '—'}</div></div>
        <div class="data-item"><div class="data-label">Защита</div><div class="data-value">${data.defense || '—'}</div></div>
        <div class="data-item"><div class="data-label">Меткость</div><div class="data-value">${data.accuracy || '—'}</div></div>
        <div class="data-item"><div class="data-label">Уклонение</div><div class="data-value">${data.evasion || '—'}</div></div>
        <div class="data-item"><div class="data-label">Профессия</div><div class="data-value">${escapeHtml(data.profession || '—')}</div></div>
    `;
}

async function savePlayerData() {
    const msg = document.getElementById('playerDataMessage');

    const payload = {
        nickname: currentUser,
        bm: document.getElementById('bm')?.value || '',
        level: document.getElementById('level')?.value || '',
        attack: document.getElementById('attack')?.value || '',
        defense: document.getElementById('defense')?.value || '',
        accuracy: document.getElementById('accuracy')?.value || '',
        evasion: document.getElementById('evasion')?.value || '',
        profession: document.getElementById('profession')?.value || ''
    };

    try {
        showPlayerMessage(msg, 'Сохранение...', '');
        const res = await api('savePlayerData', payload);

        if (res.success) {
            showPlayerMessage(msg, res.message || 'Сохранено', 'success');
            setTimeout(() => loadPlayerData(), 800);
        } else {
            showPlayerMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showPlayerMessage(msg, 'Ошибка соединения', 'error');
    }
}

// ============================================================
// УРОВЕНЬ И XP
// ============================================================

async function loadPlayerLevel() {
    const container = document.getElementById('playerLevelBlock');
    if (!container) return;

    try {
        const res = await api('getPlayerLevel', { nickname: currentUser });
        if (!res.success) return;

        const level = res.level || 1;
        const xp = res.xp || 0;
        const xpNeeded = res.xpNeeded || 100;
        const percent = Math.min(100, Math.floor((xp / xpNeeded) * 100));

        let title = 'Новичок';
        if (level >= 31) title = 'Легенда';
        else if (level >= 21) title = 'Мастер';
        else if (level >= 11) title = 'Ветеран';
        else if (level >= 6) title = 'Боец';

        container.innerHTML = `
            <div class="panel-title">⭐ Уровень и опыт</div>
            <div class="level-display">
                <div class="level-number">${level}</div>
                <div class="level-title">${title}</div>
            </div>
            <div class="xp-bar">
                <div class="xp-fill" style="width:${percent}%"></div>
            </div>
            <div class="xp-text">Опыт: ${xp} / ${xpNeeded} XP (${percent}%)</div>
        `;
    } catch (e) {
        console.error('loadPlayerLevel error:', e);
    }
}

// ============================================================
// ЕЖЕДНЕВНЫЙ БОНУС
// ============================================================

async function loadDailyBonus() {
    const container = document.getElementById('dailyBonusBlock');
    if (!container) return;

    try {
        const res = await api('getDailyBonus', { nickname: currentUser });
        if (!res.success) return;

        const streak = res.streak || 0;
        const claimed = res.claimed || false;
        const rewards = [50, 75, 100, 150, 200, 300, 500];

        let html = '<div class="panel-title">🎁 Ежедневный бонус</div>';
        html += '<div class="bonus-days">';

        for (let i = 0; i < 7; i++) {
            const day = i + 1;
            let cls = 'future';
            if (day <= streak) cls = 'claimed';
            else if (day === streak + 1 && !claimed) cls = 'today';

            html += `<div class="bonus-day ${cls}">
                <div class="bonus-day-num">${day}</div>
                <div class="bonus-day-reward">${rewards[i]}</div>
            </div>`;
        }

        html += '</div>';

        if (claimed) {
            html += '<button class="btn-primary" disabled>✅ Получено сегодня</button>';
        } else {
            html += '<button class="btn-primary" onclick="claimDailyBonus()">🎁 Забрать бонус</button>';
        }

        container.innerHTML = html;
    } catch (e) {
        console.error('loadDailyBonus error:', e);
    }
}

async function claimDailyBonus() {
    try {
        const res = await api('claimDailyBonus', { nickname: currentUser });
        if (res.success) {
            alert('✅ ' + (res.message || 'Бонус получен!'));
            loadDailyBonus();
            loadMyDkp();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка соединения');
    }
}

// ============================================================
// ДОСТИЖЕНИЯ
// ============================================================

const ACHIEVEMENTS = [
    { id: 'first_blood', icon: '🩸', name: 'Первая кровь', desc: 'Выиграть 1 аукцион', reward: 100 },
    { id: 'collector', icon: '📦', name: 'Коллекционер', desc: '10 разных предметов', reward: 500 },
    { id: 'veteran', icon: '🎖️', name: 'Ветеран', desc: '30 дней в игре', reward: 1000 },
    { id: 'rich', icon: '💰', name: 'Богач', desc: '10000 DKP', reward: 500 },
    { id: 'gear_master', icon: '🛡️', name: 'Мастер экипировки', desc: 'Заполнить все слоты', reward: 2000 },
    { id: 'win_streak', icon: '🔥', name: 'Серия побед', desc: '5 аукционов подряд', reward: 1500 },
    { id: 'social', icon: '👥', name: 'Душа компании', desc: '10 друзей', reward: 300 },
    { id: 'week_streak', icon: '📅', name: 'Недельная серия', desc: '7 дней подряд', reward: 700 },
    { id: 'month_streak', icon: '📆', name: 'Месячная серия', desc: '30 дней подряд', reward: 3000 },
    { id: 'top10', icon: '🔟', name: 'В десятке', desc: 'Топ-10 по БМ', reward: 1000 },
    { id: 'top3', icon: '🥉', name: 'Призёр', desc: 'Топ-3 по БМ', reward: 2000 },
    { id: 'champion', icon: '🏆', name: 'Чемпион', desc: '№1 по БМ', reward: 5000 },
    { id: 'activist', icon: '⚡', name: 'Активист', desc: '10 мероприятий', reward: 500 },
    { id: 'regular', icon: '🎯', name: 'Завсегдатай', desc: '50 мероприятий', reward: 2000 },
    { id: 'shopaholic', icon: '🛒', name: 'Шопоголик', desc: '5 покупок', reward: 800 },
    { id: 'founder', icon: '🏰', name: 'Основатель', desc: 'Создать гильдию', reward: 2000 },
    { id: 'brotherhood', icon: '🤝', name: 'Братство', desc: 'Вступить в гильдию', reward: 500 }
];

async function loadAchievements() {
    const container = document.getElementById('achievementsBlock');
    if (!container) return;

    try {
        const res = await api('getAchievements', { nickname: currentUser });
        const unlocked = res.unlocked || [];

        let html = '<div class="panel-title">🏆 Достижения</div>';
        html += '<div class="achievements-grid">';

        for (const a of ACHIEVEMENTS) {
            const isUnlocked = unlocked.includes(a.id);
            html += `<div class="achievement ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                    <div class="achievement-reward">${a.reward} DKP</div>
                </div>
                <div class="achievement-status">${isUnlocked ? '✅' : '🔒'}</div>
            </div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('loadAchievements error:', e);
    }
}

// ============================================================
// ДРУЗЬЯ
// ============================================================

async function loadFriends() {
    const container = document.getElementById('friendsBlock');
    if (!container) return;

    try {
        const res = await api('getFriends', { nickname: currentUser });
        const friends = res.friends || [];

        let html = '<div class="panel-title">👥 Друзья</div>';
        html += '<div class="friends-add">';
        html += '<input type="text" id="friendNick" placeholder="Ник друга">';
        html += '<button class="btn-primary" onclick="addFriend()">➕</button>';
        html += '</div>';
        html += '<div class="friends-list">';

        if (friends.length === 0) {
            html += '<div class="empty-state">Нет друзей</div>';
        } else {
            for (const f of friends) {
                html += `<div class="friend-item">
                    <span class="friend-nick">${escapeHtml(f.nickname)}</span>
                    <span class="friend-date">${f.addedAt || ''}</span>
                    <button class="btn-remove" onclick="removeFriend('${escapeForOnclick(f.nickname)}')">✕</button>
                </div>`;
            }
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('loadFriends error:', e);
    }
}

async function addFriend() {
    const nick = document.getElementById('friendNick')?.value?.trim();
    if (!nick) { alert('Введите ник'); return; }

    try {
        const res = await api('addFriend', { nickname: currentUser, friendNick: nick });
        if (res.success) {
            alert('✅ ' + (res.message || 'Добавлен'));
            loadFriends();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function removeFriend(nick) {
    if (!confirm('Удалить из друзей?')) return;

    try {
        const res = await api('removeFriend', { nickname: currentUser, friendNick: nick });
        if (res.success) loadFriends();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// КОСМЕТИКА
// ============================================================

const COSMETICS = [
    { id: 'frame_fire', icon: '🔥', name: 'Рамка "Огонь"', price: 500, type: 'frame' },
    { id: 'frame_ice', icon: '❄️', name: 'Рамка "Лёд"', price: 500, type: 'frame' },
    { id: 'frame_gold', icon: '✨', name: 'Рамка "Золото"', price: 1500, type: 'frame' },
    { id: 'frame_rainbow', icon: '🌈', name: 'Рамка "Радуга"', price: 3000, type: 'frame' },
    { id: 'effect_glow', icon: '💫', name: 'Сияние ника', price: 2000, type: 'effect' },
    { id: 'title_conqueror', icon: '⚔️', name: 'Титул "Покоритель"', price: 3000, type: 'title' },
    { id: 'title_legend', icon: '👑', name: 'Титул "Легенда"', price: 10000, type: 'title' },
    { id: 'title_rich', icon: '💎', name: 'Титул "Богач"', price: 5000, type: 'title' },
    { id: 'avatar_custom', icon: '🖼️', name: 'Свой аватар', price: 1000, type: 'avatar' }
];

async function loadCosmetics() {
    const container = document.getElementById('cosmeticsBlock');
    if (!container) return;

    try {
        const res = await api('getCosmetics', { nickname: currentUser });
        const owned = res.owned || [];
        const equipped = res.equipped || [];

        let html = '<div class="panel-title">🎨 Магазин косметики</div>';
        html += '<div class="cosmetics-grid">';

        for (const c of COSMETICS) {
            const isOwned = owned.includes(c.id);
            const isEquipped = equipped.includes(c.id);

            html += `<div class="cosmetic-item ${isOwned ? 'owned' : ''}">
                <div class="cosmetic-icon">${c.icon}</div>
                <div class="cosmetic-name">${c.name}</div>
                <div class="cosmetic-price">${c.price} DKP</div>`;

            if (isEquipped) {
                html += `<button class="btn-remove" onclick="unequipCosmetic('${c.id}')">Снять</button>`;
            } else if (isOwned) {
                html += `<button class="btn-primary" onclick="equipCosmetic('${c.id}')">Надеть</button>`;
            } else {
                html += `<button class="btn-primary" onclick="buyCosmetic('${c.id}', ${c.price})">${c.price} DKP</button>`;
            }

            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('loadCosmetics error:', e);
    }
}

async function buyCosmetic(id, price) {
    if (!confirm('Купить за ' + price + ' DKP?')) return;

    try {
        const res = await api('buyCosmetic', { nickname: currentUser, cosmeticId: id, price: price });
        if (res.success) {
            alert('✅ ' + (res.message || 'Куплено'));
            loadCosmetics();
            loadMyDkp();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function equipCosmetic(id) {
    try {
        const res = await api('equipCosmetic', { nickname: currentUser, cosmeticId: id });
        if (res.success) loadCosmetics();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function unequipCosmetic(id) {
    try {
        const res = await api('unequipCosmetic', { nickname: currentUser, cosmeticId: id });
        if (res.success) loadCosmetics();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// ТВИНКИ
// ============================================================

async function loadTwinks() {
    const container = document.getElementById('twinksBlock');
    if (!container) return;

    try {
        const res = await api('getTwinks', { nickname: currentUser });

        let html = '<div class="panel-title">🔗 Твинки</div>';

        if (res.isTwink) {
            html += `<div class="twink-info">Привязан к: <b>${escapeHtml(res.mainAccount)}</b></div>`;
        } else if (res.twinks && res.twinks.length > 0) {
            html += '<div class="twinks-list">';
            for (const t of res.twinks) {
                html += `<div class="twink-item">→ ${escapeHtml(t)}</div>`;
            }
            html += '</div>';
        } else {
            html += '<div class="empty-state">Нет привязанных твинков</div>';
        }

        container.innerHTML = html;
    } catch (e) {
        console.error('loadTwinks error:', e);
    }
}

// ============================================================
// EMAIL
// ============================================================

async function loadPlayerEmail() {
    const container = document.getElementById('emailBlock');
    if (!container) return;

    try {
        const res = await api('getPlayerEmail', { nickname: currentUser });
        const email = res.email || '';

        container.innerHTML = `
            <div class="panel-title">📧 Моя почта</div>
            <div class="email-form">
                <input type="email" id="playerEmail" value="${escapeHtml(email)}" placeholder="email@example.com">
                <button class="btn-primary" onclick="savePlayerEmail()">💾 Сохранить</button>
            </div>
            <div id="emailMessage" class="message"></div>
        `;
    } catch (e) {
        console.error('loadPlayerEmail error:', e);
    }
}

async function savePlayerEmail() {
    const email = document.getElementById('playerEmail')?.value?.trim();
    const msg = document.getElementById('emailMessage');

    if (!email || !email.includes('@')) {
        showPlayerMessage(msg, 'Введите корректный email', 'error');
        return;
    }

    try {
        const res = await api('savePlayerEmail', { nickname: currentUser, email: email });
        if (res.success) {
            showPlayerMessage(msg, '✅ Сохранено', 'success');
        } else {
            showPlayerMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showPlayerMessage(msg, '❌ Ошибка', 'error');
    }
}

// ============================================================
// ПРОСМОТР КАБИНЕТА ИГРОКА
// ============================================================

async function viewPlayerCabinet(nickname) {
    const modal = document.getElementById('viewPlayerModal');
    const content = document.getElementById('viewPlayerContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:20px;">Загрузка...</div>';
    modal.classList.remove('hidden');

    try {
        const [playerRes, skillsRes] = await Promise.all([
            api('getPlayerData', { nickname: nickname }),
            api('getPlayerSkills', { nickname: nickname })
        ]);

        if (!playerRes.success) {
            content.innerHTML = '<div class="empty-state">Игрок не найден</div>';
            return;
        }

        const d = playerRes.data;
        let html = '<div class="view-player-header">';
        html += '<div class="view-player-nick">' + escapeHtml(nickname) + '</div>';
        html += '</div>';

        html += '<div class="data-grid">';
        html += '<div class="data-item"><div class="data-label">БМ</div><div class="data-value">' + (d.bm || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Уровень</div><div class="data-value">' + (d.level || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Атака</div><div class="data-value">' + (d.attack || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Защита</div><div class="data-value">' + (d.defense || '—') + '</div></div>';
        html += '</div>';

        if (skillsRes.success && skillsRes.data?.skills?.length) {
            html += '<div style="margin-top:12px;"><div class="panel-title" style="font-size:11px;">🎯 Навыки</div><div class="approved-skills">';
            for (const skill of skillsRes.data.skills) {
                html += '<div class="approved-skill-badge">✓ ' + escapeHtml(skill) + '</div>';
            }
            html += '</div></div>';
        }

        content.innerHTML = html;
    } catch (e) {
        content.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

function closeViewPlayerModal() {
    const modal = document.getElementById('viewPlayerModal');
    if (modal) modal.classList.add('hidden');
}

function showPlayerMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}

// Экспорт
window.loadPlayerData = loadPlayerData;
window.savePlayerData = savePlayerData;
window.loadPlayerLevel = loadPlayerLevel;
window.loadDailyBonus = loadDailyBonus;
window.claimDailyBonus = claimDailyBonus;
window.loadAchievements = loadAchievements;
window.loadFriends = loadFriends;
window.addFriend = addFriend;
window.removeFriend = removeFriend;
window.loadCosmetics = loadCosmetics;
window.buyCosmetic = buyCosmetic;
window.equipCosmetic = equipCosmetic;
window.unequipCosmetic = unequipCosmetic;
window.loadTwinks = loadTwinks;
window.loadPlayerEmail = loadPlayerEmail;
window.savePlayerEmail = savePlayerEmail;
window.viewPlayerCabinet = viewPlayerCabinet;
window.closeViewPlayerModal = closeViewPlayerModal;
