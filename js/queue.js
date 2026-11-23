// ============================================================
// 📦 ОЧЕРЕДЬ ВЫДАЧИ
// ============================================================

async function loadQueueItems() {
    const list = document.getElementById('queueItemsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getQueueItems');

        if (res.success && res.items && res.items.length > 0) {
            let html = '';
            for (const it of res.items) {
                const statusClass = it.status === 'given' ? 'given' : 'pending';
                const statusBadge = it.status === 'given'
                    ? '<span class="given-badge given">✅ Выдан</span>'
                    : '<span class="given-badge not-given">⚠️ Ожидает</span>';

                html += '<div class="queue-item-card ' + statusClass + '">';
                html += '<div class="queue-item-info">';
                html += '<div class="queue-item-name">' + escapeHtml(it.itemName) + '</div>';
                html += '<div class="queue-item-meta">' + escapeHtml(it.itemSection || '') + ' | ' + escapeHtml(it.itemTier || '') + ' | ' + escapeHtml(it.itemColor || '');
                if (it.itemEnhancement > 0) html += ' +' + it.itemEnhancement;
                html += '</div>';
                html += '<div class="queue-item-meta">Получатель: <span class="queue-item-recipient" onclick="viewPlayerCabinet(\'' + escapeForOnclick(it.recipient) + '\')">' + escapeHtml(it.recipient) + '</span></div>';
                html += '</div>';
                html += statusBadge;

                if (currentRole === 'Админ' || currentRole === 'Модератор') {
                    if (it.status !== 'given') {
                        html += '<button class="btn-approve" onclick="markQueueItemGiven(\'' + escapeForOnclick(it.id) + '\')">Выдать</button>';
                    }
                    html += '<button class="btn-remove" onclick="deleteQueueItem(\'' + escapeForOnclick(it.id) + '\')">✕</button>';
                }
                html += '</div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Очередь пуста</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function addQueueItem() {
    const itemName = document.getElementById('queueItemName')?.value?.trim();
    const recipient = document.getElementById('queueRecipient')?.value?.trim();
    const msg = document.getElementById('addQueueMessage');

    if (!itemName || !recipient) {
        showQueueMessage(msg, 'Заполните все поля', 'error');
        return;
    }

    const payload = {
        itemName: itemName,
        itemSection: document.getElementById('queueItemSection')?.value || '',
        itemTier: document.getElementById('queueItemTier')?.value || '',
        itemColor: document.getElementById('queueItemColor')?.value || '',
        itemEnhancement: Number(document.getElementById('queueItemEnhancement')?.value) || 0,
        recipient: recipient
    };

    try {
        showQueueMessage(msg, 'Добавление...', '');
        const res = await api('addQueueItem', payload);

        if (res.success) {
            showQueueMessage(msg, res.message || 'Добавлено', 'success');
            document.getElementById('queueItemName').value = '';
            document.getElementById('queueRecipient').value = '';
            setTimeout(() => loadQueueItems(), 800);
        } else {
            showQueueMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showQueueMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function markQueueItemGiven(id) {
    if (!confirm('Отметить как выданный?')) return;

    try {
        const res = await api('markQueueItemGiven', { id: id });
        if (res.success) {
            loadQueueItems();
        } else {
            alert(res.message || 'Ошибка');
        }
    } catch (e) {
        alert('Ошибка соединения');
    }
}

async function deleteQueueItem(id) {
    if (!confirm('Удалить из очереди?')) return;

    try {
        const res = await api('deleteQueueItem', { id: id });
        if (res.success) {
            loadQueueItems();
        } else {
            alert(res.message || 'Ошибка');
        }
    } catch (e) {
        alert('Ошибка соединения');
    }
}

async function loadPlayerLootHistory() {
    const block = document.getElementById('playerLootHistory');
    if (!block || !currentUser) return;

    try {
        const res = await api('getPlayerUnifiedLootHistory', { nickname: currentUser });

        if (!res.success || !res.history || res.history.length === 0) {
            block.innerHTML = '<div class="empty-state">История пуста</div>';
            return;
        }

        let html = '';
        for (const h of res.history) {
            const sourceBadge = h.type === 'auction'
                ? '<span class="source-badge auction">🔨 Аукцион</span>'
                : '<span class="source-badge queue">📦 Очередь</span>';

            html += '<div class="loot-item ' + (h.itemGiven ? 'given' : 'not-given') + '">';
            html += '<div class="loot-info">';
            html += '<div class="loot-name">' + escapeHtml(h.itemName) + '</div>';
            html += '<div class="loot-date">' + escapeHtml(h.itemSection || '') + ' | ' + escapeHtml(h.itemTier || '') + ' | ' + escapeHtml(h.itemColor || '');
            if (h.itemEnhancement > 0) html += ' +' + h.itemEnhancement;
            html += ' | ' + escapeHtml(h.date || '') + '</div>';
            html += '<div style="margin-top:2px;">' + sourceBadge + '</div>';
            html += '</div>';

            if (h.type === 'auction') {
                html += '<div class="loot-amount">' + (h.amount || 0) + ' DKP</div>';
            } else {
                html += '<div class="loot-amount" style="color:var(--success);">Бесплатно</div>';
            }
            html += '</div>';
        }

        block.innerHTML = html;
    } catch (e) {
        block.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function showQueueMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
