// ============================================================
// 📦 ОЧЕРЕДЬ ВЫДАЧИ
// ============================================================

async function loadQueueItems() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getQueueItems' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('queueItemsList');
        if (!l) return;
        if (res.success && res.items.length > 0) {
            let html = '';
            for (let i = 0; i < res.items.length; i++) {
                const it = res.items[i];
                const sc = it.status === 'given' ? 'given' : 'pending';
                const sb = it.status === 'given' ? '<span class="given-badge given">✅ Выдан</span>' : '<span class="given-badge not-given">⚠️ Ожидает</span>';
                html += '<div class="queue-item-card ' + sc + '"><div class="queue-item-info"><div class="queue-item-name">' + escapeHtml(it.itemName) + '</div><div class="queue-item-meta">' + escapeHtml(it.itemSection) + ' | ' + escapeHtml(it.itemTier) + ' | ' + escapeHtml(it.itemColor);
                if (it.itemEnhancement > 0) html += ' +' + it.itemEnhancement;
                html += '</div><div class="queue-item-meta">Получатель: <span class="queue-item-recipient" onclick="viewPlayerCabinet(\'' + escapeForOnclick(it.recipient) + '\')">' + renderPlayerNickWithBioColor(it.recipient, null, true, true) + '</span>';
                if (it.notes) html += ' | 📝 ' + escapeHtml(it.notes);
                html += '</div></div><div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' + sb;
                if (currentRole === 'Админ' || currentRole === 'Модератор') {
                    html += '<button class="btn-edit" style="width:auto;margin-top:0;font-size:9px;padding:3px 6px;" onclick="markQueueItemGiven(\'' + escapeForOnclick(it.id) + '\',' + (it.status !== 'given') + ')">' + (it.status === 'given' ? '↩ Отменить' : '✓ Выдать') + '</button>';
                    html += '<button class="btn-remove" onclick="deleteQueueItem(\'' + escapeForOnclick(it.id) + '\')">🗑</button>';
                }
                html += '</div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Очередь пуста</div>';
    } catch (e) {}
}

async function loadAllItemsForQueueSelect() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItemsWithIcons' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('queueItemSelect');
        if (!s) return;
        if (res.success && res.items && res.items.length > 0) {
            const bs = {};
            for (let i = 0; i < res.items.length; i++) {
                const it = res.items[i];
                if (!bs[it.section]) bs[it.section] = [];
                bs[it.section].push(it);
            }
            let html = '<option value="">— Выберите предмет —</option>';
            const colorEmojis = { 'Белый': '⚪', 'Зеленый': '🟢', 'Синий': '🔵', 'Фиолетовый': '🟣', 'Желтый': '🟡', 'Красный': '🔴' };
            const keys = Object.keys(bs).sort();
            for (let i = 0; i < keys.length; i++) {
                const sec = keys[i];
                html += '<optgroup label="' + escapeHtml(sec) + '">';
                for (let j = 0; j < bs[sec].length; j++) {
                    const it = bs[sec][j];
                    const cEmoji = colorEmojis[it.color] || '⚪';
                    html += '<option value="' + it.id + '">' + cEmoji + ' ' + escapeHtml(it.name) + ' (' + escapeHtml(it.tier || 'т0') + ', ' + escapeHtml(it.color) + ')</option>';
                }
                html += '</optgroup>';
            }
            s.innerHTML = html;
            window._allQueueItems = res.items;
        } else s.innerHTML = '<option value="">— Нет предметов —</option>';
    } catch (e) {}
}

function fillQueueItemDetails() {
    const s = document.getElementById('queueItemSelect');
    const id = s ? s.value : '';
    if (!id || !window._allQueueItems) return;
    const it = window._allQueueItems.find(function(i) { return i.id === parseInt(id); });
    if (!it) return;
    const el1 = document.getElementById('queueItemName'); if (el1) el1.value = it.name;
    const el2 = document.getElementById('queueItemSection'); if (el2) el2.value = it.section;
    const el3 = document.getElementById('queueItemTier'); if (el3) el3.value = it.tier || '';
    const el4 = document.getElementById('queueItemColor'); if (el4) el4.value = it.color || 'Белый';
    const el5 = document.getElementById('queueItemEnhancement'); if (el5) el5.value = it.enhancement || 0;
    const el6 = document.getElementById('queueItemPrime'); if (el6) el6.checked = it.isPrime || false;
    const el7 = document.getElementById('queueItemBoss'); if (el7) el7.checked = it.isBoss || false;
}

async function loadPlayersForQueue() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('queueRecipient');
        if (res.success && s) {
            let html = '<option value="">— Выберите игрока —</option>';
            for (let i = 0; i < res.nicks.length; i++) html += '<option value="' + escapeHtml(res.nicks[i]) + '">' + escapeHtml(res.nicks[i]) + '</option>';
            s.innerHTML = html;
        }
    } catch (e) {}
}

async function createQueueItem() {
    if (currentRole === 'Гость') { alert('👁 Гости не могут'); return; }
    const iname = document.getElementById('queueItemName').value.trim();
    const rec = document.getElementById('queueRecipient').value;
    const isec = document.getElementById('queueItemSection').value;
    const itier = document.getElementById('queueItemTier').value;
    const icol = document.getElementById('queueItemColor').value;
    const ienh = document.getElementById('queueItemEnhancement').value;
    const ip = document.getElementById('queueItemPrime').checked;
    const ib = document.getElementById('queueItemBoss').checked;
    const n = document.getElementById('queueItemNotes').value.trim();
    if (!iname || !rec) { alert('Заполните название и получателя'); return; }
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'createQueueItem',
                itemName: iname, recipient: rec, itemSection: isec, itemTier: itier,
                itemColor: icol, itemEnhancement: Number(ienh), isPrime: ip, isBoss: ib,
                notes: n, createdBy: currentUser
            }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) {
            alert('✅ ' + res.message);
            document.getElementById('queueItemName').value = '';
            document.getElementById('queueItemNotes').value = '';
            switchQueueTab('list', { target: document.getElementById('tabQueueList') });
        } else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function markQueueItemGiven(id, g) {
    if (!confirm((g ? 'Выдать' : 'Отменить') + '?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'markQueueItemGiven', queueId: id, given: g, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert(res.message); loadQueueItems(); loadMyUnifiedLootHistory(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function deleteQueueItem(id) {
    if (!confirm('Удалить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteQueueItem', queueId: id, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert(res.message); loadQueueItems(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function loadMyUnifiedLootStats() {
    if (!currentUser) return;
    const b = document.getElementById('myUnifiedLootStats');
    if (!b) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getUnifiedLootStats', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success || !res.stats || res.stats.length === 0) {
            b.innerHTML = '<div class="empty-state">Вы ещё ничего не получали</div>';
            return;
        }
        let html = '';
        for (let i = 0; i < res.stats.length; i++) {
            const s = res.stats[i];
            let sh = '';
            for (let j = 0; j < s.sources.length; j++) {
                const x = s.sources[j];
                const bc = x.type === 'auction' ? 'auction' : 'queue';
                const bt = x.type === 'auction' ? '🔨' : '📦';
                sh += '<span class="source-badge ' + bc + '">' + bt + ' ' + escapeHtml(x.source) + '</span>';
            }
            html += '<div class="unified-loot-stat"><div class="unified-loot-header"><div class="unified-loot-name">' + escapeHtml(s.itemName) + '</div><div class="unified-loot-count">×' + s.count + '</div></div><div class="unified-loot-sources">' + sh + '</div></div>';
        }
        b.innerHTML = html;
    } catch (e) { b.innerHTML = '<div class="empty-state">Ошибка</div>'; }
}

async function loadMyUnifiedLootHistory() {
    if (!currentUser) return;
    const b = document.getElementById('myUnifiedLootHistory');
    if (!b) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerUnifiedLootHistory', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success || !res.history || res.history.length === 0) {
            b.innerHTML = '<div class="empty-state">История пуста</div>';
            return;
        }
        let html = '';
        for (let i = 0; i < res.history.length; i++) {
            const h = res.history[i];
            const sb = h.type === 'auction' ? '<span class="source-badge auction">🔨 Аукцион</span>' : '<span class="source-badge queue">📦 Очередь</span>';
            html += '<div class="loot-item ' + (h.itemGiven ? 'given' : 'not-given') + '"><div class="loot-info"><div class="loot-name">' + escapeHtml(h.itemName) + '</div><div class="loot-date">' + escapeHtml(h.itemSection) + ' | ' + escapeHtml(h.itemTier) + ' | ' + escapeHtml(h.itemColor);
            if (h.itemEnhancement > 0) html += ' +' + h.itemEnhancement;
            html += ' | ' + escapeHtml(h.date) + '</div><div style="margin-top:2px;">' + sb + '</div></div>';
            if (h.type === 'auction') html += '<div class="loot-amount">' + h.amount + ' DKP</div>';
            else html += '<div class="loot-amount" style="color:var(--success);">Бесплатно</div>';
            html += '</div>';
        }
        b.innerHTML = html;
    } catch (e) { b.innerHTML = '<div class="empty-state">Ошибка</div>'; }
}
