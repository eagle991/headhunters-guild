// ============================================================
// 🔨 АУКЦИОНЫ
// ============================================================

let bidCooldowns = {};
let auctionSubscriptions = {};

function toggleAuctionTypeFields() {
    const type = document.getElementById('auctionType')?.value;
    const equipmentFields = document.getElementById('equipmentFields');
    const craftFields = document.getElementById('craftFields');
    const skillFields = document.getElementById('skillFields');

    if (equipmentFields) equipmentFields.style.display = (type === 'equipment' || type === 'standard') ? 'block' : 'none';
    if (craftFields) craftFields.style.display = (type === 'craft') ? 'block' : 'none';
    if (skillFields) skillFields.style.display = (type === 'skill') ? 'block' : 'none';

    if (type === 'craft' && typeof loadCraftItemsList === 'function') loadCraftItemsList();
    if (type === 'skill' && typeof loadSkillsForAuction === 'function') loadSkillsForAuction();
    if ((type === 'equipment' || type === 'standard') && typeof loadAuctionSectionsDynamic === 'function') loadAuctionSectionsDynamic();
}

async function loadAuctions() {
    const list = document.getElementById('auctionsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getAuctions');
        if (!res.success) {
            list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        currentAuctionItems = res.auctions || [];
        renderAuctionsList(currentAuctionItems);
        startAuctionTimers();
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function renderAuctionsList(auctions) {
    const list = document.getElementById('auctionsList');
    if (!list) return;

    if (!auctions || auctions.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет активных аукционов</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < auctions.length; i++) {
        const a = auctions[i];
        const endTime = new Date(a.endTime);
        const now = new Date();
        const isEnded = endTime <= now;
        const timeLeft = isEnded ? 'Завершён' : formatTimeLeft(endTime);

        html += '<div class="auction-card' + (isEnded ? ' ended' : '') + '" data-id="' + escapeHtml(a.id) + '">';
        html += '<div class="auction-header">';
        html += '<div class="auction-number">#' + (i + 1) + '</div>';
        html += '<div class="auction-title">' + escapeHtml(a.title) + '</div>';
        html += '<div class="auction-type">' + getAuctionTypeLabel(a.type) + '</div>';
        html += '</div>';

        html += '<div class="auction-body">';
        if (a.itemSection) html += '<div class="auction-meta">' + escapeHtml(a.itemSection) + ' | ' + escapeHtml(a.itemTier || '') + ' | ' + escapeHtml(a.itemColor || '') + '</div>';
        html += '<div class="auction-price">Текущая ставка: <b>' + (a.currentBid || a.startPrice) + ' DKP</b></div>';
        if (a.currentBidder) html += '<div class="auction-bidder">Лидер: ' + escapeHtml(a.currentBidder) + '</div>';
        html += '<div class="auction-timer" data-end="' + a.endTime + '">' + timeLeft + '</div>';
        if (a.extensions) html += '<div class="auction-extensions">Продления: ' + a.extensions + '/5</div>';
        html += '</div>';

        if (!isEnded && currentRole !== 'Гость') {
            const cooldown = getBidCooldown(a.id);
            html += '<div class="auction-actions">';
            html += '<input type="number" class="bid-input" placeholder="Ставка" min="' + ((a.currentBid || a.startPrice) + (a.step || 1)) + '">';
            
            if (cooldown > 0) {
                html += '<button class="btn-bid" disabled>⏳ ' + Math.ceil(cooldown / 1000) + 'с</button>';
            } else {
                html += '<button class="btn-bid" onclick="placeBid(\'' + escapeForOnclick(a.id) + '\', this)">Ставка</button>';
            }
            
            const isSubscribed = auctionSubscriptions[a.id];
            html += '<button class="btn-subscribe" onclick="toggleSubscription(\'' + escapeForOnclick(a.id) + '\')">' + (isSubscribed ? '🔔' : '🔕') + '</button>';
            html += '</div>';
        }

        if (currentRole === 'Админ' || currentRole === 'Модератор') {
            html += '<div class="auction-admin-actions">';
            html += '<button class="btn-remove" onclick="cancelAuction(\'' + escapeForOnclick(a.id) + '\')">✕ Отмена</button>';
            html += '</div>';
        }

        html += '</div>';
    }

    list.innerHTML = html;
}

function getAuctionTypeLabel(type) {
    const labels = {
        'standard': '📋 Стандарт',
        'equipment': '🛡️ Экипировка',
        'craft': '🔨 Крафт',
        'skill': '🎯 Навык'
    };
    return labels[type] || type;
}

function formatTimeLeft(endDate) {
    const diff = endDate - new Date();
    if (diff <= 0) return 'Завершён';

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    if (h > 0) return h + 'ч ' + m + 'м';
    if (m > 0) return m + 'м ' + s + 'с';
    return s + 'с';
}

function startAuctionTimers() {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(function() {
        const timers = document.querySelectorAll('.auction-timer');
        timers.forEach(function(timer) {
            const endTime = new Date(timer.dataset.end);
            timer.innerText = formatTimeLeft(endTime);

            if (endTime <= new Date()) {
                timer.classList.add('ended');
            }
        });

        updateCooldownButtons();
    }, 1000);
}

function getBidCooldown(auctionId) {
    const lastBid = bidCooldowns[auctionId];
    if (!lastBid) return 0;

    const cooldownTime = 5 * 60 * 1000;
    const elapsed = Date.now() - lastBid;
    return Math.max(0, cooldownTime - elapsed);
}

function updateCooldownButtons() {
    const buttons = document.querySelectorAll('.btn-bid[disabled]');
    buttons.forEach(function(btn) {
        const card = btn.closest('.auction-card');
        if (!card) return;

        const auctionId = card.dataset.id;
        const cooldown = getBidCooldown(auctionId);

        if (cooldown <= 0) {
            btn.disabled = false;
            btn.innerText = 'Ставка';
        } else {
            btn.innerText = '⏳ ' + Math.ceil(cooldown / 1000) + 'с';
        }
    });
}

async function placeBid(auctionId, btn) {
    const cooldown = getBidCooldown(auctionId);
    if (cooldown > 0) {
        alert('Кулдаун: подождите ' + Math.ceil(cooldown / 1000) + ' сек');
        return;
    }

    const card = btn.closest('.auction-card');
    const input = card?.querySelector('.bid-input');
    const amount = Number(input?.value);

    if (!amount || amount <= 0) {
        alert('Введите корректную ставку');
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '...';

    try {
        const res = await api('placeBid', {
            auctionId: auctionId,
            amount: amount,
            nickname: currentUser
        });

        if (res.success) {
            bidCooldowns[auctionId] = Date.now();
            localStorage.setItem('bidCooldowns', JSON.stringify(bidCooldowns));

            if (res.extended) {
                alert('⏰ Аукцион продлён на 3 минуты!');
            }

            loadAuctions();
            if (typeof loadMyDkp === 'function') loadMyDkp();
        } else {
            alert(res.message || 'Ошибка ставки');
        }
    } catch (e) {
        alert('Ошибка соединения');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function toggleSubscription(auctionId) {
    try {
        const res = await api('toggleAuctionSubscription', {
            auctionId: auctionId,
            nickname: currentUser
        });

        if (res.success) {
            auctionSubscriptions[auctionId] = res.subscribed;
            loadAuctions();
        }
    } catch (e) {
        console.error('toggleSubscription error:', e);
    }
}

async function cancelAuction(auctionId) {
    if (!confirm('Отменить аукцион?')) return;

    try {
        const res = await api('cancelAuction', { auctionId: auctionId });
        if (res.success) {
            alert('✅ ' + (res.message || 'Отменён'));
            loadAuctions();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function createAuction() {
    const type = document.getElementById('auctionType')?.value;
    const msg = document.getElementById('createAuctionMessage');

    if (!type) {
        showAuctionMessage(msg, 'Выберите тип аукциона', 'error');
        return;
    }

    const payload = {
        type: type,
        title: document.getElementById('auctionTitle')?.value?.trim() || '',
        startPrice: Number(document.getElementById('auctionStartPrice')?.value) || 0,
        step: Number(document.getElementById('auctionStep')?.value) || 1,
        duration: Number(document.getElementById('auctionDuration')?.value) || 24,
        minAttendance: Number(document.getElementById('auctionMinAttendance')?.value) || 0,
        priorityOnly: document.getElementById('auctionPriorityOnly')?.checked || false
    };

    if (type === 'equipment' || type === 'standard') {
        payload.section = document.getElementById('auctionSection')?.value || '';
        payload.itemName = document.getElementById('auctionItemName')?.value?.trim() || '';
        payload.itemTier = document.getElementById('auctionItemTier')?.value || '';
        payload.itemColor = document.getElementById('auctionItemColor')?.value || '';
        payload.itemEnhancement = Number(document.getElementById('auctionItemEnhancement')?.value) || 0;
    }

    if (type === 'craft') {
        payload.craftResource = document.getElementById('craftResourceName')?.value?.trim() || '';
        payload.craftTier = document.getElementById('craftTier')?.value || '';
        payload.craftColor = document.getElementById('craftColor')?.value || '';
    }

    if (type === 'skill') {
        payload.skillName = document.getElementById('auctionSkill')?.value || '';
    }

    if (!payload.title) {
        showAuctionMessage(msg, 'Введите название', 'error');
        return;
    }

    try {
        showAuctionMessage(msg, 'Создание...', '');
        const res = await api('createAuction', payload);

        if (res.success) {
            showAuctionMessage(msg, res.message || 'Аукцион создан', 'success');
            setTimeout(function() {
                document.getElementById('createAuctionForm')?.reset();
                loadAuctions();
            }, 1200);
        } else {
            showAuctionMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showAuctionMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function loadAuctionHistory() {
    const list = document.getElementById('auctionHistoryList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getAuctionHistory');
        if (!res.success || !res.auctions || res.auctions.length === 0) {
            list.innerHTML = '<div class="empty-state">Нет завершённых аукционов</div>';
            return;
        }

        let html = '';
        for (const a of res.auctions) {
            html += '<div class="auction-history-item">';
            html += '<div class="auction-history-title">' + escapeHtml(a.title) + '</div>';
            html += '<div class="auction-history-winner">Победитель: ' + escapeHtml(a.winner || '—') + '</div>';
            html += '<div class="auction-history-amount">' + (a.finalAmount || 0) + ' DKP</div>';
            html += '<div class="auction-history-status">' + (a.status === 'completed' ? '✅ Завершён' : '❌ Отменён') + '</div>';

            if (currentRole === 'Админ' || currentRole === 'Модератор') {
                html += '<div class="auction-history-actions">';
                html += '<button class="btn-edit" onclick="editCompletedAuction(\'' + escapeForOnclick(a.id) + '\')">✎</button>';
                html += '<button class="btn-remove" onclick="deleteAuction(\'' + escapeForOnclick(a.id) + '\')">🗑</button>';
                html += '</div>';
            }

            html += '</div>';
        }

        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function loadAuctionSettings() {
    const container = document.getElementById('auctionSettingsContent');
    if (!container) return;

    try {
        const res = await api('getAuctionSettings');
        const s = res.settings || {};

        container.innerHTML = `
            <div class="settings-form">
                <div class="form-group">
                    <label><input type="checkbox" id="settingRepeatWinBan" ${s.repeatWinBan ? 'checked' : ''}> Запрет повторных побед</label>
                </div>
                <div class="form-group">
                    <label>Период запрета</label>
                    <select id="settingRepeatWinPeriod">
                        <option value="week" ${s.repeatWinPeriod === 'week' ? 'selected' : ''}>Неделя</option>
                        <option value="month" ${s.repeatWinPeriod === 'month' ? 'selected' : ''}>Месяц</option>
                        <option value="custom" ${s.repeatWinPeriod === 'custom' ? 'selected' : ''}>Свои дни</option>
                        <option value="forever" ${s.repeatWinPeriod === 'forever' ? 'selected' : ''}>Навсегда</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Количество дней</label>
                    <input type="number" id="settingRepeatWinDays" value="${s.repeatWinDays || 7}">
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="settingBmCoefficient" ${s.bmCoefficient ? 'checked' : ''}> БМ-коэффициент</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="settingAutoExtend" ${s.autoExtend ? 'checked' : ''}> Автопродление</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="settingRepeatPurchaseCoef" ${s.repeatPurchaseCoef ? 'checked' : ''}> Коэффициент повторной покупки</label>
                </div>
                <div class="form-group">
                    <label>Базовый коэффициент</label>
                    <input type="number" id="settingBaseCoef" value="${s.baseCoef || 1.5}" step="0.1">
                </div>
                <div class="form-group">
                    <label>Максимум покупок до сброса</label>
                    <input type="number" id="settingMaxPurchases" value="${s.maxPurchases || 5}">
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="settingAllowRepeatSkill" ${s.allowRepeatSkill ? 'checked' : ''}> Повторная покупка навыков</label>
                </div>
                <button class="btn-primary" onclick="saveAuctionSettings()">💾 Сохранить</button>
                <div id="auctionSettingsMessage" class="message"></div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function saveAuctionSettings() {
    const msg = document.getElementById('auctionSettingsMessage');

    const settings = {
        repeatWinBan: document.getElementById('settingRepeatWinBan')?.checked || false,
        repeatWinPeriod: document.getElementById('settingRepeatWinPeriod')?.value || 'week',
        repeatWinDays: Number(document.getElementById('settingRepeatWinDays')?.value) || 7,
        bmCoefficient: document.getElementById('settingBmCoefficient')?.checked || false,
        autoExtend: document.getElementById('settingAutoExtend')?.checked || false,
        repeatPurchaseCoef: document.getElementById('settingRepeatPurchaseCoef')?.checked || false,
        baseCoef: Number(document.getElementById('settingBaseCoef')?.value) || 1.5,
        maxPurchases: Number(document.getElementById('settingMaxPurchases')?.value) || 5,
        allowRepeatSkill: document.getElementById('settingAllowRepeatSkill')?.checked || false
    };

    try {
        showAuctionMessage(msg, 'Сохранение...', '');
        const res = await api('saveAuctionSettings', { settings: settings });

        if (res.success) {
            showAuctionMessage(msg, '✅ Сохранено', 'success');
        } else {
            showAuctionMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showAuctionMessage(msg, '❌ Ошибка', 'error');
    }
}

async function loadCraftItemsList() {
    const list = document.getElementById('craftItemsList');
    if (!list) return;

    try {
        const res = await api('getItems');
        if (!res.success || !res.items) {
            list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        const grouped = {};
        for (const item of res.items) {
            if (!grouped[item.section]) grouped[item.section] = [];
            grouped[item.section].push(item);
        }

        let html = '';
        const sections = Object.keys(grouped).sort();
        for (const section of sections) {
            html += '<div class="craft-section"><div class="craft-section-title">' + escapeHtml(section) + '</div>';
            for (const item of grouped[section]) {
                html += '<label class="craft-item"><input type="checkbox" value="' + escapeHtml(item.id) + '"> ' + escapeHtml(item.name) + '</label>';
            }
            html += '</div>';
        }
        list.innerHTML = html || '<div class="empty-state">Нет предметов</div>';
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function showAuctionMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(function() { el.style.display = 'none'; }, 4000);
    }
}

function loadSavedCooldowns() {
    try {
        const saved = localStorage.getItem('bidCooldowns');
        if (saved) bidCooldowns = JSON.parse(saved);
    } catch (e) {}
}

// Экспорт
window.toggleAuctionTypeFields = toggleAuctionTypeFields;
window.loadAuctions = loadAuctions;
window.placeBid = placeBid;
window.toggleSubscription = toggleSubscription;
window.cancelAuction = cancelAuction;
window.createAuction = createAuction;
window.loadAuctionHistory = loadAuctionHistory;
window.loadAuctionSettings = loadAuctionSettings;
window.saveAuctionSettings = saveAuctionSettings;
window.loadCraftItemsList = loadCraftItemsList;

// Инициализация
loadSavedCooldowns();
