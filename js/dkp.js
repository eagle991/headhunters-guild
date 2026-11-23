// ============================================================
// 💰 DKP ГЛОБАЛЬНЫЕ
// ============================================================

async function loadMyDkp() {
    if (!currentUser) return;

    try {
        const res = await api('getPlayerDKP', { nickname: currentUser });

        if (res.success) {
            myDkpData = res.data;
            AppState.myDkpData = res.data;

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

        html += '<div class="dkp-history-item">';
        html += '<div class="dkp-history-info">';
        html += '<div class="dkp-history-reason">' + escapeHtml(entry.reason || 'Без причины') + '</div>';
        html += '<div class="dkp-history-date">' + date + '</div>';
        html += '</div>';
        html += '<div class="dkp-history-amount" style="color:' + color + ';">' + sign + entry.amount + '</div>';

        if (isAdmin) {
            html += '<button class="btn-edit" onclick="editDkpEntry(\'' + escapeForOnclick(entry.id) + '\')">✎</button>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
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

async function loadAllSettings() {
    await Promise.all([
        loadAuctionSettings(),
        loadPenaltySettings(),
        loadPlayersForPenaltySelect(),
        loadEventCoefficientSettings(),
        loadPlayersForEventCoefSelect()
    ]);
}

function showDkpMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
