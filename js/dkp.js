// ============================================================
// 💰 DKP ГЛОБАЛЬНЫЕ
// ============================================================

async function loadMyDkp() {
    if (!currentUser) return;

    try {
        const res = await api('getPlayerDKP', { nickname: currentUser });

        if (res.success) {
            myDkpData = res.data;
            if (typeof AppState !== 'undefined') AppState.myDkpData = res.data;

            const bal = document.getElementById('myDkpBalance');
            if (bal) bal.innerText = Number(res.data.balance || 0).toLocaleString('ru-RU');

            const badge = document.getElementById('userDkpBadge');
            if (badge) badge.innerText = '💰 ' + Number(res.data.balance || 0).toLocaleString('ru-RU') + ' DKP';

            renderDkpHistory(res.data.history || []);
            loadFrozenDkpInfo();
        }
    } catch (e) {
        console.error('loadMyDkp error:', e);
    }
}

async function loadFrozenDkpInfo() {
    const container = document.getElementById('frozenDkpInfo');
    if (!container) return;

    try {
        const res = await api('getFrozenDkp', { nickname: currentUser });
        if (!res.success) return;

        const frozen = res.frozen || 0;
        const balance = myDkpData?.balance || 0;
        const available = balance - frozen;

        container.innerHTML = `
            <div class="dkp-info-grid">
                <div class="dkp-info-item">
                    <div class="dkp-info-label">Баланс</div>
                    <div class="dkp-info-value">${balance.toLocaleString('ru-RU')}</div>
                </div>
                <div class="dkp-info-item">
                    <div class="dkp-info-label">Заморожено</div>
                    <div class="dkp-info-value frozen">${frozen.toLocaleString('ru-RU')}</div>
                </div>
                <div class="dkp-info-item">
                    <div class="dkp-info-label">Доступно</div>
                    <div class="dkp-info-value available">${available.toLocaleString('ru-RU')}</div>
                </div>
            </div>
        `;

        if (res.activeBids && res.activeBids.length > 0) {
            let bidsHtml = '<div class="active-bids"><div class="panel-title">Активные ставки</div>';
            for (const bid of res.activeBids) {
                const isLeader = bid.isLeader ? ' <span class="leader-badge">Лидер</span>' : '';
                bidsHtml += `<div class="active-bid">
                    <span class="bid-item">${escapeHtml(bid.itemName)}</span>
                    <span class="bid-amount">${bid.amount} DKP</span>${isLeader}
                </div>`;
            }
            bidsHtml += '</div>';
            container.innerHTML += bidsHtml;
        }
    } catch (e) {
        console.error('loadFrozenDkpInfo error:', e);
    }
}

function renderDkpHistory(history) {
    const container = document.getElementById('myDkpHistory');
    if (!container) return;

    if (!history || history.length === 0) {
        container.innerHTML = '<div class="empty-state">История пуста</div>';
        return;
    }

    const sorted = history.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    const isAdmin = currentRole === 'Админ' || currentRole === 'Модератор';
    let html = '';

    for (const entry of sorted) {
        const date = new Date(entry.date).toLocaleString('ru-RU');
        const isPositive = entry.amount > 0;
        const sign = isPositive ? '+' : '';
        const color = isPositive ? 'var(--success)' : 'var(--danger)';
        const typeLabel = getDkpTypeLabel(entry.type || entry.reason);

        html += '<div class="dkp-history-item">';
        html += '<div class="dkp-history-info">';
        html += '<div class="dkp-history-type">' + typeLabel + '</div>';
        html += '<div class="dkp-history-reason">' + escapeHtml(entry.reason || '') + '</div>';
        html += '<div class="dkp-history-date">' + date + '</div>';
        html += '</div>';
        html += '<div class="dkp-history-amount" style="color:' + color + ';">' + sign + entry.amount + '</div>';

        if (isAdmin) {
            html += '<div class="dkp-history-actions">';
            html += '<button class="btn-edit" onclick="editDkpEntry(' + entry.id + ')">✎</button>';
            html += '<button class="btn-remove" onclick="deleteDkpEntry(' + entry.id + ')">🗑</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

function getDkpTypeLabel(type) {
    const labels = {
        'earn': '🎯 Заработано',
        'manual_add': '➕ Начисление',
        'manual_sub': '➖ Списание',
        'penalty': '⚠️ Штраф',
        'auction_win': '🔨 Аукцион',
        'daily_bonus': '🎁 Бонус',
        'achievement': '🏆 Достижение',
        'guild_donation': '🏰 Пожертвование',
        'cosmetic': '🎨 Косметика'
    };
    return labels[type] || '💰 Операция';
}

async function submitDkpSubmission() {
    const amount = Number(document.getElementById('dkpAmount')?.value);
    const reason = document.getElementById('dkpReason')?.value?.trim();
    const msg = document.getElementById('dkpSubmitMessage');

    if (!amount || amount === 0) {
        showDkpMessage(msg, 'Введите сумму', 'error');
        return;
    }

    if (!reason) {
        showDkpMessage(msg, 'Укажите причину', 'error');
        return;
    }

    try {
        showDkpMessage(msg, 'Отправка...', '');
        const res = await api('submitDkp', {
            nickname: currentUser,
            amount: amount,
            reason: reason
        });

        if (res.success) {
            showDkpMessage(msg, res.message || 'Заявка отправлена', 'success');
            document.getElementById('dkpAmount').value = '';
            document.getElementById('dkpReason').value = '';
            loadMyDkp();
        } else {
            showDkpMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showDkpMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function archiveDKP() {
    if (!confirm('Создать резервную копию DKP?')) return;

    const msg = document.getElementById('archiveMessage');
    if (msg) {
        msg.className = 'message';
        msg.innerText = '⏳ Создание...';
        msg.style.display = 'block';
    }

    try {
        const res = await api('archiveDKP');
        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = res.message || 'Архив создан';
            } else {
                msg.className = 'message error';
                msg.innerText = '❌ ' + (res.message || 'Ошибка');
            }
        }
    } catch (e) {
        if (msg) {
            msg.className = 'message error';
            msg.innerText = '❌ Ошибка: ' + e.message;
        }
    }

    if (msg) setTimeout(function() { msg.style.display = 'none'; }, 6000);
}

async function editDkpEntry(id) {
    const newAmount = prompt('Новая сумма:');
    if (newAmount === null) return;

    const newReason = prompt('Новая причина:');
    if (newReason === null) return;

    try {
        const res = await api('editDkpEntry', {
            id: id,
            amount: Number(newAmount),
            reason: newReason
        });

        if (res.success) {
            alert('✅ Сохранено');
            loadMyDkp();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function deleteDkpEntry(id) {
    if (!confirm('Удалить запись?')) return;

    try {
        const res = await api('deleteDkpEntry', { id: id });
        if (res.success) {
            loadMyDkp();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// ШТРАФЫ
// ============================================================

async function loadPenaltySettings() {
    const container = document.getElementById('penaltySettingsContent');
    if (!container) return;

    try {
        const res = await api('getPenaltySettings');
        const s = res.settings || {};

        container.innerHTML = `
            <div class="settings-section">
                <div class="panel-title">Глобальные штрафы</div>
                <div class="form-group">
                    <label><input type="checkbox" id="penaltyEnabled" ${s.enabled ? 'checked' : ''}> Включить штрафы</label>
                </div>
                <div class="form-group">
                    <label>Процент штрафа (%)</label>
                    <input type="number" id="penaltyPercent" value="${s.percent || 10}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Порог пропусков (%)</label>
                    <input type="number" id="penaltyThreshold" value="${s.threshold || 30}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Период</label>
                    <select id="penaltyPeriod">
                        <option value="week" ${s.period === 'week' ? 'selected' : ''}>Неделя</option>
                        <option value="month" ${s.period === 'month' ? 'selected' : ''}>Месяц</option>
                        <option value="custom" ${s.period === 'custom' ? 'selected' : ''}>Свои дни</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Количество дней</label>
                    <input type="number" id="penaltyDays" value="${s.days || 30}">
                </div>
                <button class="btn-primary" onclick="savePenaltySettings()">💾 Сохранить</button>
                <button class="btn-primary" onclick="applyPenalties()">⚡ Применить</button>
                <div id="penaltySettingsMessage" class="message"></div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function savePenaltySettings() {
    const msg = document.getElementById('penaltySettingsMessage');

    const settings = {
        enabled: document.getElementById('penaltyEnabled')?.checked || false,
        percent: Number(document.getElementById('penaltyPercent')?.value) || 10,
        threshold: Number(document.getElementById('penaltyThreshold')?.value) || 30,
        period: document.getElementById('penaltyPeriod')?.value || 'month',
        days: Number(document.getElementById('penaltyDays')?.value) || 30
    };

    try {
        showDkpMessage(msg, 'Сохранение...', '');
        const res = await api('savePenaltySettings', { settings: settings });

        if (res.success) {
            showDkpMessage(msg, '✅ Сохранено', 'success');
        } else {
            showDkpMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showDkpMessage(msg, '❌ Ошибка', 'error');
    }
}

async function applyPenalties() {
    if (!confirm('Применить штрафы ко всем игрокам?')) return;

    const msg = document.getElementById('penaltySettingsMessage');

    try {
        showDkpMessage(msg, 'Применение...', '');
        const res = await api('applyPenalties');

        if (res.success) {
            showDkpMessage(msg, '✅ ' + (res.message || 'Штрафы применены'), 'success');
        } else {
            showDkpMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showDkpMessage(msg, '❌ Ошибка', 'error');
    }
}

async function loadPlayersForPenaltySelect() {
    const select = document.getElementById('penaltyPlayerSelect');
    if (!select) return;

    try {
        const res = await api('getAllPlayersForValidation');
        if (!res.success) return;

        let html = '<option value="">Выберите игрока</option>';
        for (const nick of (res.nicks || [])) {
            html += '<option value="' + escapeHtml(nick) + '">' + escapeHtml(nick) + '</option>';
        }
        select.innerHTML = html;
    } catch (e) {
        console.error('loadPlayersForPenaltySelect error:', e);
    }
}

function showDkpMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(function() { el.style.display = 'none'; }, 4000);
    }
}

// Экспорт
window.loadMyDkp = loadMyDkp;
window.loadFrozenDkpInfo = loadFrozenDkpInfo;
window.submitDkpSubmission = submitDkpSubmission;
window.archiveDKP = archiveDKP;
window.editDkpEntry = editDkpEntry;
window.deleteDkpEntry = deleteDkpEntry;
window.loadPenaltySettings = loadPenaltySettings;
window.savePenaltySettings = savePenaltySettings;
window.applyPenalties = applyPenalties;
window.loadPlayersForPenaltySelect = loadPlayersForPenaltySelect;
