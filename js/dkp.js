// ============================================================
// 💰 DKP ГЛОБАЛЬНЫЕ
// ============================================================

async function loadMyDkp() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerDKP', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            myDkpData = res.data;
            const bal = document.getElementById('myDkpBalance');
            if (bal) bal.innerText = Number(res.data.balance).toLocaleString('ru-RU');
            const badge = document.getElementById('userDkpBadge');
            if (badge) badge.innerText = '💰 ' + Number(res.data.balance).toLocaleString('ru-RU') + ' DKP';
            renderDkpHistory(res.data.history || []);
            loadFrozenDkpInfo();
        }
    } catch (e) { console.error(e); }
}

function renderDkpHistory(h) {
    const l = document.getElementById('myDkpHistory');
    if (!l) return;
    if (!h || h.length === 0) { l.innerHTML = '<div class="empty-state">История пуста</div>'; return; }
    const sorted = h.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    const iam = currentRole === 'Админ' || currentRole === 'Модератор';
    let html = '';
    for (let i = 0; i < sorted.length; i++) {
        const x = sorted[i];
        const d = new Date(x.date).toLocaleString('ru-RU');
        const pos = x.amount > 0;
        let tl = '', ic = x.type;
        if (x.type === 'earn') tl = '🏆 ' + (x.event || 'Мероприятие');
        else if (x.type === 'manual_add') tl = '💵 ' + (x.reason || 'Начисление');
        else if (x.type === 'manual_sub') tl = '💸 ' + (x.reason || 'Списание');
        else if (x.type === 'auction_win') tl = '🔨 ' + (x.reason || 'Победа на аукционе');
        else if (x.type === 'penalty') tl = '⚠️ ' + (x.reason || 'Штраф');
        else if (x.type === 'guild_donation') tl = '🏰 ' + (x.reason || 'Пожертвование');
        else if (x.type === 'guild_disband_refund' || x.type === 'guild_delete_refund') tl = '💰 ' + (x.reason || 'Возврат DKP');
        else if (x.type === 'guild_event_earn') tl = '🎯 ' + (x.event || 'Мероприятие гильдии');
        else if (x.type === 'guild_manual_add') tl = '💵 ' + (x.reason || 'Начисление в гильдии');
        else if (x.type === 'guild_manual_sub') tl = '💸 ' + (x.reason || 'Списание в гильдии');
        else tl = x.reason || x.event || 'Операция';
        let ah = '';
        if (iam) ah = '<div class="history-actions"><button class="history-action-btn" onclick="event.stopPropagation(); openDkpDetailsModal(' + i + ')" title="Детали">📋</button><button class="history-action-btn" onclick="event.stopPropagation(); openEditDkpEntryModal(' + i + ')" title="Ред.">✎</button><button class="history-action-btn danger" onclick="event.stopPropagation(); deleteDkpHistoryEntry(' + i + ')" title="Удалить">🗑</button></div>';
        else ah = '<div class="history-actions"><button class="history-action-btn" onclick="event.stopPropagation(); openDkpDetailsModal(' + i + ')" title="Детали">📋</button></div>';
        html += '<div class="dkp-history-item ' + ic + '" onclick="openDkpDetailsModal(' + i + ')"><div class="history-info"><div class="history-event">' + tl + '</div><div class="history-date">' + d + '</div></div><div class="history-amount ' + (pos ? 'positive' : 'negative') + '">' + (pos ? '+' : '') + x.amount + '</div>' + ah + '</div>';
    }
    l.innerHTML = html;
    window._currentDkpHistory = sorted;
}

async function openDkpDetailsModal(i) {
    const h = window._currentDkpHistory;
    if (!h || !h[i]) return;
    const en = h[i];
    const m = document.getElementById('dkpDetailsModal');
    const c = document.getElementById('dkpDetailsContent');
    if (c) c.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    if (m) m.classList.remove('hidden');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getDkpHistoryDetails', nickname: currentUser, entryDate: en.date, entryType: en.type }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && c) {
            const e = res.entry;
            const p = res.participants;
            let html = '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);">Тип:</div><div style="font-size:13px;color:var(--accent);font-weight:700;">' + escapeHtml(e.type) + '</div></div>';
            html += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);">Сумма:</div><div style="font-size:15px;color:' + (e.amount > 0 ? 'var(--success)' : 'var(--danger)') + ';font-weight:700;">' + (e.amount > 0 ? '+' : '') + e.amount + ' DKP</div></div>';
            html += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);">Дата:</div><div style="font-size:11px;">' + new Date(e.date).toLocaleString('ru-RU') + '</div></div>';
            if (e.event) html += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);">Мероприятие:</div><div style="font-size:12px;color:var(--dkp);font-weight:700;">' + escapeHtml(e.event) + '</div></div>';
            if (e.reason) html += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);">Причина:</div><div style="font-size:11px;">' + escapeHtml(e.reason) + '</div></div>';
            if (p && (p.attended.length > 0 || p.missed.length > 0)) {
                html += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:8px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;font-weight:700;">Участники:</div>';
                if (p.attended.length > 0) {
                    html += '<div style="margin-bottom:4px;"><div style="font-size:9px;color:var(--success);font-weight:700;margin-bottom:2px;">✓ Были (' + p.attended.length + '):</div><div style="display:flex;flex-wrap:wrap;gap:2px;">';
                    for (let j = 0; j < p.attended.length; j++) {
                        const a = p.attended[j];
                        html += '<span class="submission-nick-tag" style="background:var(--success-soft);border-color:var(--success);color:var(--success);">' + escapeHtml(a.nickname) + ' (+' + a.dkpEarned + ')</span>';
                    }
                    html += '</div></div>';
                }
                if (p.missed.length > 0) {
                    html += '<div><div style="font-size:9px;color:var(--danger);font-weight:700;margin-bottom:2px;">✕ Пропустили (' + p.missed.length + '):</div><div style="display:flex;flex-wrap:wrap;gap:2px;">';
                    for (let j = 0; j < p.missed.length; j++) html += '<span class="submission-nick-tag" style="background:var(--danger-soft);border-color:var(--danger);color:var(--danger);">' + escapeHtml(p.missed[j]) + '</span>';
                    html += '</div></div>';
                }
                html += '</div>';
            }
            c.innerHTML = html;
        } else if (c) c.innerHTML = '<div class="empty-state">❌ ' + escapeHtml(res.message) + '</div>';
    } catch (e) { if (c) c.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function closeDkpDetailsModal() { const m = document.getElementById('dkpDetailsModal'); if (m) m.classList.add('hidden'); }

function openEditDkpEntryModal(i) {
    const h = window._currentDkpHistory;
    if (!h || !h[i]) return;
    currentEditDkpEntry = { idx: i, entry: h[i] };
    const reason = document.getElementById('editDkpEntryReason');
    if (reason) reason.value = h[i].reason || '';
    const msg = document.getElementById('editDkpEntryMessage');
    if (msg) msg.style.display = 'none';
    const m = document.getElementById('editDkpEntryModal');
    if (m) m.classList.remove('hidden');
}

function closeEditDkpEntryModal() { const m = document.getElementById('editDkpEntryModal'); if (m) m.classList.add('hidden'); currentEditDkpEntry = null; }

async function saveDkpHistoryEntryEdit() {
    if (!currentEditDkpEntry) return;
    const en = currentEditDkpEntry.entry;
    const nr = document.getElementById('editDkpEntryReason').value;
    const m = document.getElementById('editDkpEntryMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'editDkpHistoryEntry', nickname: currentUser, entryDate: en.date, entryType: en.type, entryAmount: en.amount, newReason: nr, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ ' + res.message; m.style.display = 'block'; setTimeout(function() { closeEditDkpEntryModal(); loadMyDkp(); }, 1500); }
            else { m.className = 'message error'; m.innerText = '❌ ' + res.message; m.style.display = 'block'; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка'; m.style.display = 'block'; } }
}

async function deleteDkpHistoryEntry(i) {
    const h = window._currentDkpHistory;
    if (!h || !h[i]) return;
    const en = h[i];
    if (!confirm('Удалить запись:\n' + en.type + ' — ' + en.amount + ' DKP\nот ' + new Date(en.date).toLocaleString('ru-RU') + '?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteDkpHistoryEntry', nickname: currentUser, entryDate: en.date, entryType: en.type, entryAmount: en.amount, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadMyDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function loadFrozenDkpInfo() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerDkpInfo', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.data) {
            const total = res.data.total;
            const frozen = res.data.frozen;
            const available = res.data.available;
            const activeBids = res.data.activeBids;
            const db = document.getElementById('userDkpBadge');
            if (db) {
                if (frozen > 0) db.innerHTML = '💰 ' + total.toLocaleString('ru-RU') + ' <span style="font-size:8px;color:var(--warning);">(🔒' + frozen + ')</span>';
                else db.innerHTML = '💰 ' + total.toLocaleString('ru-RU') + ' DKP';
            }
            const fb = document.getElementById('frozenDkpBlock');
            if (fb && activeBids && activeBids.length > 0) {
                let html = '<div style="margin-bottom:8px;padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);border:1px solid var(--warning);"><div style="font-size:11px;color:var(--warning);font-weight:700;margin-bottom:4px;">🔒 ЗАМОРОЖЕНО: ' + frozen + ' DKP</div>';
                html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:4px;"><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:var(--text-dim);">Всего</div><div style="font-size:12px;color:var(--accent);font-weight:700;">' + total + '</div></div><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:var(--warning);">Замор.</div><div style="font-size:12px;color:var(--warning);font-weight:700;">' + frozen + '</div></div><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:var(--success);">Своб.</div><div style="font-size:12px;color:var(--success);font-weight:700;">' + available + '</div></div></div>';
                for (let i = 0; i < activeBids.length; i++) {
                    const b = activeBids[i];
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);margin-bottom:2px;font-size:10px;border-left:2px solid ' + (b.isLeader ? 'var(--success)' : 'var(--warning)') + ';"><div><div style="font-weight:700;">' + (b.isLeader ? '👑 ' : '') + escapeHtml(b.itemName) + '</div><div style="font-size:8px;color:var(--text-dim);">' + escapeHtml(b.itemSection) + '</div></div><div style="color:var(--dkp);font-weight:700;">' + b.bidAmount + ' DKP</div></div>';
                }
                html += '</div>';
                fb.innerHTML = html;
            } else if (fb) fb.innerHTML = '';
        }
    } catch (e) { console.error(e); }
}

async function loadEventsForSelect() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEvents' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            allEvents = res.events;
            const s = document.getElementById('dkpEventSelect');
            if (s) {
                let html = '<option value="">— Выберите —</option>';
                for (let i = 0; i < allEvents.length; i++) {
                    const e = allEvents[i];
                    html += '<option value="' + escapeHtml(e.id) + '" data-dkp="' + e.dkp + '" data-name="' + escapeHtml(e.name) + '">' + escapeHtml(e.name) + ' (+' + e.dkp + ')</option>';
                }
                s.innerHTML = html;
            }
        }
    } catch (e) {}
}

async function loadDkpRating() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllDKP' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('dkpRatingList');
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
                html += '<div class="ranking-item"><div class="ranking-position ' + rc + '">#' + rk + '</div><div class="ranking-info"><div class="ranking-nick">' + renderPlayerNickWithBioColor(p.nickname, null, true, true) + '</div></div><div class="ranking-bm" style="color:var(--dkp);">' + Number(p.balance).toLocaleString('ru-RU') + ' 💰</div></div>';
            }
            html += '</div>';
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет данных</div>';
    } catch (e) {}
}

// ============================================================
// 💰 ГИЛЬДЕЙСКОЕ DKP
// ============================================================

async function loadGuildDkp() {
    if (!window._myGuild) {
        const noGuild = document.getElementById('guildDkpNoGuild');
        const panel = document.getElementById('guildDkpPanel');
        if (noGuild) noGuild.style.display = 'block';
        if (panel) panel.style.display = 'none';
        return;
    }
    const noGuild = document.getElementById('guildDkpNoGuild');
    const panel = document.getElementById('guildDkpPanel');
    if (noGuild) noGuild.style.display = 'none';
    if (panel) panel.style.display = 'block';
    const nameEl = document.getElementById('guildDkpGuildName');
    if (nameEl) nameEl.innerText = window._myGuild.name;
    const adminPanel = document.getElementById('guildDkpAdminPanel');
    if (adminPanel) adminPanel.style.display = (window._myGuild.role === 'leader' || window._myGuild.role === 'officer') ? 'block' : 'none';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildDKP', nickname: currentUser, guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const bal = document.getElementById('guildDkpBalance');
            if (bal) bal.innerText = Number(res.data.balance).toLocaleString('ru-RU');
        }
    } catch (e) {}
    loadGuildDkpRanking();
}

async function loadGuildDkpRanking() {
    const list = document.getElementById('guildDkpMembersList');
    if (!list || !window._myGuild) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildDKPHistory', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { list.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        const members = res.members;
        let html = '';
        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const rk = i + 1;
            const rc = rk <= 3 ? 'top-' + rk : '';
            html += '<div class="guild-dkp-member"><div class="rank ' + rc + '">#' + rk + '</div><div class="nick" style="cursor:pointer;" onclick="viewPlayerCabinet(\'' + escapeForOnclick(m.nickname) + '\')">' + escapeHtml(m.nickname) + '</div><div class="balance">' + m.balance.toLocaleString('ru-RU') + '</div></div>';
        }
        list.innerHTML = html || '<div class="empty-state">Нет данных</div>';
    } catch (e) { list.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function showAdjustGuildDkpModal() {
    if (!window._myGuild) return;
    const msg = document.getElementById('adjustGuildDkpMessage');
    if (msg) msg.style.display = 'none';
    document.getElementById('adjustGuildDkpPlayer').value = '';
    document.getElementById('adjustGuildDkpAmount').value = '';
    document.getElementById('adjustGuildDkpReason').value = '';
    document.getElementById('adjustGuildDkpModal').classList.remove('hidden');
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildMembersList', guildId: window._myGuild.id }), redirect: 'follow' })
        .then(r => r.json())
        .then(res => {
            const sel = document.getElementById('adjustGuildDkpPlayer');
            if (res.success && sel) {
                let html = '<option value="">— Выберите —</option>';
                for (const m of res.members) html += '<option value="' + escapeHtml(m.name) + '">' + escapeHtml(m.name) + ' (' + m.role + ')</option>';
                sel.innerHTML = html;
            }
        });
}

function closeAdjustGuildDkpModal() { document.getElementById('adjustGuildDkpModal').classList.add('hidden'); }

async function executeAdjustGuildDkp() {
    const player = document.getElementById('adjustGuildDkpPlayer').value;
    const amount = document.getElementById('adjustGuildDkpAmount').value;
    const reason = document.getElementById('adjustGuildDkpReason').value;
    const msg = document.getElementById('adjustGuildDkpMessage');
    if (!player || !amount) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Заполните поля'; msg.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'adjustGuildDKP', guildId: window._myGuild.id, requester: currentUser, targetPlayer: player, amount: Number(amount), reason: reason }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; setTimeout(function() { closeAdjustGuildDkpModal(); loadGuildDkp(); }, 1200); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

function showGuildDkpHistoryModal() {
    if (!window._myGuild) return;
    document.getElementById('guildDkpHistoryModal').classList.remove('hidden');
    loadGuildDkpHistory();
}

function closeGuildDkpHistoryModal() { document.getElementById('guildDkpHistoryModal').classList.add('hidden'); }

async function loadGuildDkpHistory() {
    const list = document.getElementById('guildDkpHistoryList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildDKP', nickname: currentUser, guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { list.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        const history = res.data.history || [];
        if (history.length === 0) { list.innerHTML = '<div class="empty-state">История пуста</div>'; return; }
        const sorted = history.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        let html = '';
        for (const h of sorted) {
            const d = new Date(h.date).toLocaleString('ru-RU');
            const pos = h.amount > 0;
            let tl = h.reason || h.event || 'Операция';
            if (h.type === 'guild_event_earn') tl = '🎯 ' + (h.event || 'Мероприятие');
            else if (h.type === 'guild_manual_add') tl = '💵 ' + (h.reason || 'Начисление');
            else if (h.type === 'guild_manual_sub') tl = '💸 ' + (h.reason || 'Списание');
            html += '<div class="dkp-history-item ' + h.type + '"><div class="history-info"><div class="history-event">' + escapeHtml(tl) + '</div><div class="history-date">' + d + '</div></div><div class="history-amount ' + (pos ? 'positive' : 'negative') + '">' + (pos ? '+' : '') + h.amount + '</div></div>';
        }
        list.innerHTML = html;
    } catch (e) { list.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function showGuildSubmitDkpModal() {
    if (!window._myGuild) return;
    document.getElementById('guildSubmitDkpModal').classList.remove('hidden');
    guildUploadedScreenshots = [];
    guildRecognizedNicks = [];
    const preview = document.getElementById('guildScreenshotsPreview');
    if (preview) preview.innerHTML = '';
    const nb = document.getElementById('guildRecognizedNicksBlock');
    if (nb) nb.classList.add('hidden');
    loadGuildEventsForSubmit();
}

function closeGuildSubmitDkpModal() { document.getElementById('guildSubmitDkpModal').classList.add('hidden'); }

async function loadGuildEventsForSubmit() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildEvents', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        const sel = document.getElementById('guildDkpEventSelect');
        if (res.success && sel) {
            let html = '<option value="">— Выберите —</option>';
            for (const e of res.events) html += '<option value="' + escapeHtml(e.id) + '" data-dkp="' + e.dkp + '" data-name="' + escapeHtml(e.name) + '">' + escapeHtml(e.name) + ' (+' + e.dkp + ')</option>';
            sel.innerHTML = html;
        }
    } catch (e) {}
}

function handleGuildScreenshotSelect(e) {
    const files = Array.from(e.target.files);
    for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        if (f.size > 2 * 1024 * 1024) { alert('Файл "' + f.name + '" > 2 МБ'); continue; }
        const reader = new FileReader();
        reader.onload = async function(ev) {
            const id = 'gss_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const so = { id: id, file: f, base64: ev.target.result, screenshotId: null, status: 'uploading' };
            guildUploadedScreenshots.push(so);
            renderGuildScreenshotsPreview();
            try {
                const compressed = await compressImage(ev.target.result, 1200, 0.8);
                const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveScreenshot', imageData: compressed, filename: f.name }), redirect: 'follow' });
                const res = await r.json();
                if (res.success) { so.screenshotId = res.screenshotId; so.status = 'done'; }
                else so.status = 'error';
            } catch (err) { so.status = 'error'; }
            renderGuildScreenshotsPreview();
            if (guildUploadedScreenshots.every(s => s.status !== 'uploading')) runGuildOcr();
        };
        reader.readAsDataURL(f);
    }
    e.target.value = '';
}

function renderGuildScreenshotsPreview() {
    const el = document.getElementById('guildScreenshotsPreview');
    if (!el) return;
    let html = '';
    for (const s of guildUploadedScreenshots) {
        let sh = '';
        if (s.status === 'uploading') sh = '<div class="upload-progress">...</div>';
        else if (s.status === 'error') sh = '<div class="upload-progress" style="color:var(--danger);">✕</div>';
        else if (s.status === 'done') sh = '<div class="upload-progress" style="color:var(--success);">✓</div>';
        html += '<div class="screenshot-thumb"><img src="' + s.base64 + '" onclick="openImageModal(\'' + escapeForOnclick(s.base64) + '\')" style="cursor:pointer;"><button class="remove-btn" onclick="removeGuildScreenshot(\'' + escapeForOnclick(s.id) + '\')">✕</button>' + sh + '</div>';
    }
    el.innerHTML = html;
}

function removeGuildScreenshot(id) {
    guildUploadedScreenshots = guildUploadedScreenshots.filter(s => s.id !== id);
    renderGuildScreenshotsPreview();
}

async function runGuildOcr() {
    const pb = document.getElementById('guildOcrProgressBlock');
    const pt = document.getElementById('guildOcrProgressText');
    const pbr = document.getElementById('guildOcrProgressBar');
    const nb = document.getElementById('guildRecognizedNicksBlock');
    const mi = document.getElementById('guildOcrMatchInfo');
    if (!pb || !pt || !pbr || !nb) return;
    pb.classList.remove('hidden');
    pbr.style.width = '0%';
    guildRecognizedNicks = [];
    if (typeof Tesseract === 'undefined') { pt.innerText = '⚠️ Tesseract не загружен'; nb.classList.remove('hidden'); return; }
    pt.innerText = 'Загрузка OCR...';
    pbr.style.width = '10%';
    let worker;
    try {
        worker = await Tesseract.createWorker('rus+eng', 1, {
            logger: function(m) {
                if (m.status === 'recognizing text' && m.progress) {
                    pbr.style.width = (10 + Math.round(m.progress * 80)) + '%';
                    pt.innerText = Math.round(m.progress * 100) + '%';
                }
            }
        });
    } catch (e) { pt.innerText = '❌ OCR ошибка'; return; }
    let guildMembersList = [];
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildMembersList', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) guildMembersList = res.members.map(m => m.name);
    } catch (e) {}
    const allText = [];
    for (let i = 0; i < guildUploadedScreenshots.length; i++) {
        const s = guildUploadedScreenshots[i];
        if (s.status !== 'done') continue;
        pt.innerText = 'Скрин ' + (i + 1) + '/' + guildUploadedScreenshots.length;
        try {
            const processed = await preprocessImage(s.base64);
            const result = await worker.recognize(processed);
            if (result && result.data && result.data.text) allText.push(result.data.text);
        } catch (e) {}
    }
    try { await worker.terminate(); } catch (e) {}
    const fullText = allText.join('\n');
    const recognizedWords = extractNicksFromText(fullText);
    const matched = [];
    for (const word of recognizedWords) {
        const wl = word.toLowerCase();
        for (const member of guildMembersList) {
            if (member.toLowerCase() === wl) { matched.push(member); break; }
        }
    }
    guildRecognizedNicks = [...new Set(matched)];
    pbr.style.width = '100%';
    pt.innerText = '✅ Готово: ' + guildRecognizedNicks.length + ' участников гильдии';
    if (mi) mi.innerHTML = '<div style="font-size:9px;color:var(--success);">🏰 Найдено участников гильдии: <b>' + guildRecognizedNicks.length + '</b></div>';
    renderGuildRecognizedNicks();
    nb.classList.remove('hidden');
}

function renderGuildRecognizedNicks() {
    const l = document.getElementById('guildRecognizedNicksList');
    if (!l) return;
    let html = '';
    for (let i = 0; i < guildRecognizedNicks.length; i++) {
        const n = guildRecognizedNicks[i];
        html += '<div class="nick-item" style="border-color:var(--success);background:var(--success-soft);padding:4px 8px;"><input type="text" value="' + escapeHtml(n) + '" onchange="updateGuildNick(' + i + ', this.value)" style="background:transparent;border:none;flex:1;"><span style="color:var(--success);font-size:10px;margin-left:4px;font-weight:700;">✓</span><button class="remove-nick-btn" onclick="removeGuildNick(' + i + ')">✕</button></div>';
    }
    l.innerHTML = html;
}

function updateGuildNick(i, v) { guildRecognizedNicks[i] = v.trim(); }
function removeGuildNick(i) { guildRecognizedNicks.splice(i, 1); renderGuildRecognizedNicks(); }

async function submitGuildDkpSubmission() {
    const s = document.getElementById('guildDkpEventSelect');
    const so = s.options[s.selectedIndex];
    const eid = s.value;
    const en = so ? so.dataset.name : '';
    const ed = so ? so.dataset.dkp : 0;
    const msg = document.getElementById('guildSubmitDkpMessage');
    if (!eid) { if (msg) { msg.className = 'message error'; msg.innerText = 'Выберите мероприятие'; msg.style.display = 'block'; } return; }
    if (guildRecognizedNicks.length === 0) { if (msg) { msg.className = 'message error'; msg.innerText = 'Добавьте участника'; msg.style.display = 'block'; } return; }
    const sids = guildUploadedScreenshots.filter(s => s.status === 'done' && s.screenshotId).map(s => s.screenshotId);
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'submitGuildDKP', guildId: window._myGuild.id, submitter: currentUser, eventId: eid, eventName: en, eventDkp: Number(ed), screenshotIds: sids, recognizedNicks: guildRecognizedNicks }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ ' + res.message;
                setTimeout(function() { closeGuildSubmitDkpModal(); guildUploadedScreenshots = []; guildRecognizedNicks = []; }, 1500);
            } else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

function onGuildSelectChange() {
    const select = document.getElementById('currentGuildSelect');
    const guildId = select ? select.value : '';
    if (!guildId) {
        const info = document.getElementById('currentGuildInfo');
        const pin = document.getElementById('guildPinBtn');
        if (info) info.classList.add('hidden');
        if (pin) pin.classList.remove('pinned');
        return;
    }
    const info = document.getElementById('currentGuildInfo');
    if (info) info.classList.remove('hidden');
}

function toggleGuildPin() {
    const btn = document.getElementById('guildPinBtn');
    if (btn) btn.classList.toggle('pinned');
}

// ============================================================
// 💰 КОЭФФИЦИЕНТЫ И ШТРАФЫ
// ============================================================

async function loadEventCoefficientSettings() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEventCoefficientSettings' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.settings) {
            const s = res.settings;
            const el1 = document.getElementById('eventCoefEnabled'); if (el1) el1.checked = s.enabled;
            const el2 = document.getElementById('eventCoefMode'); if (el2) el2.value = s.mode;
            const el3 = document.getElementById('eventCoefValue'); if (el3) el3.value = s.value;
            const el4 = document.getElementById('eventCoefList'); if (el4) el4.value = (s.selectiveList || []).join(', ');
            const el5 = document.getElementById('eventCoefListRow'); if (el5) el5.style.display = s.mode === 'selective' ? 'flex' : 'none';
        }
    } catch (e) {}
}

async function saveEventCoefficientSettings() {
    const m = document.getElementById('eventCoefSettingsMessage');
    const ls = document.getElementById('eventCoefList').value;
    const sl = ls ? ls.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveEventCoefficientSettings', enabled: document.getElementById('eventCoefEnabled').checked, mode: document.getElementById('eventCoefMode').value, value: Number(document.getElementById('eventCoefValue').value), selectiveList: sl }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Сохранено'; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

async function loadPlayersForEventCoefSelect() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('playerEventCoefSelect');
        if (res.success && s) {
            let html = '<option value="">— Выберите игрока —</option>';
            for (let i = 0; i < res.nicks.length; i++) html += '<option value="' + escapeHtml(res.nicks[i]) + '">' + escapeHtml(res.nicks[i]) + '</option>';
            s.innerHTML = html;
        }
    } catch (e) {}
}

async function loadPlayerEventCoefSettings() {
    const n = document.getElementById('playerEventCoefSelect').value;
    const f = document.getElementById('playerEventCoefForm');
    if (!n) { if (f) f.style.display = 'none'; return; }
    if (f) f.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerEventCoefSettings', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.settings) {
            const s = res.settings;
            const el1 = document.getElementById('playerEventCoefEnabled'); if (el1) el1.checked = s.enabled;
            const el2 = document.getElementById('playerEventCoefMode'); if (el2) el2.value = s.mode;
            const el3 = document.getElementById('playerEventCoefValue'); if (el3) el3.value = s.value;
        } else {
            const el1 = document.getElementById('playerEventCoefEnabled'); if (el1) el1.checked = false;
            const el2 = document.getElementById('playerEventCoefMode'); if (el2) el2.value = 'disabled';
            const el3 = document.getElementById('playerEventCoefValue'); if (el3) el3.value = 1;
        }
    } catch (e) {}
}

async function savePlayerEventCoefSettings() {
    const n = document.getElementById('playerEventCoefSelect').value;
    if (!n) { alert('Выберите игрока'); return; }
    const m = document.getElementById('playerEventCoefMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePlayerEventCoefSettings', nickname: n, enabled: document.getElementById('playerEventCoefEnabled').checked, mode: document.getElementById('playerEventCoefMode').value, value: Number(document.getElementById('playerEventCoefValue').value) }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Сохранено для ' + n; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

async function loadPenaltySettings() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPenaltySettings' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.settings) {
            const s = res.settings;
            const el1 = document.getElementById('penaltyEnabled'); if (el1) el1.checked = s.enabled;
            const el2 = document.getElementById('penaltyPercent'); if (el2) el2.value = s.penaltyPercent;
            const el3 = document.getElementById('penaltyPeriodType'); if (el3) el3.value = s.periodType;
            const el4 = document.getElementById('penaltyCustomDays'); if (el4) el4.value = s.customDays;
            const el5 = document.getElementById('penaltyMissPercent'); if (el5) el5.value = s.missPercent;
            const el6 = document.getElementById('penaltyCustomDaysRow'); if (el6) el6.style.display = s.periodType === 'custom_days' ? 'flex' : 'none';
            const el7 = document.getElementById('penaltyMissPercentRow'); if (el7) el7.style.display = s.periodType === 'miss_percent' ? 'flex' : 'none';
        }
    } catch (e) {}
}

async function savePenaltySettings() {
    const m = document.getElementById('penaltySettingsMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePenaltySettings', enabled: document.getElementById('penaltyEnabled').checked, penaltyPercent: Number(document.getElementById('penaltyPercent').value), periodType: document.getElementById('penaltyPeriodType').value, customDays: Number(document.getElementById('penaltyCustomDays').value), missPercent: Number(document.getElementById('penaltyMissPercent').value) }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Сохранено'; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

async function applyPenalties() {
    if (!confirm('⚠️ Применить штрафы ко всем?')) return;
    const m = document.getElementById('penaltySettingsMessage');
    if (m) { m.innerText = 'Применение...'; m.className = 'message'; m.style.display = 'block'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'applyPenalties', appliedBy: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка'; } }
}

async function loadPlayersForPenaltySelect() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('playerPenaltySelect');
        if (res.success && s) {
            let html = '<option value="">— Выберите игрока —</option>';
            for (let i = 0; i < res.nicks.length; i++) html += '<option value="' + escapeHtml(res.nicks[i]) + '">' + escapeHtml(res.nicks[i]) + '</option>';
            s.innerHTML = html;
        }
    } catch (e) {}
}

async function loadPlayerPenaltySettings() {
    const n = document.getElementById('playerPenaltySelect').value;
    const f = document.getElementById('playerPenaltyForm');
    if (!n) { if (f) f.style.display = 'none'; return; }
    if (f) f.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerPenaltySettings', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.settings) {
            const s = res.settings;
            const el1 = document.getElementById('playerPenaltyEnabled'); if (el1) el1.checked = s.enabled;
            const el2 = document.getElementById('playerPenaltyPercent'); if (el2) el2.value = s.penaltyPercent;
            const el3 = document.getElementById('playerPenaltyPeriodType'); if (el3) el3.value = s.periodType;
            const el4 = document.getElementById('playerPenaltyCustomDays'); if (el4) el4.value = s.customDays;
            const el5 = document.getElementById('playerPenaltyMissPercent'); if (el5) el5.value = s.missPercent;
            const el6 = document.getElementById('playerCustomDaysRow'); if (el6) el6.style.display = s.periodType === 'custom_days' ? 'flex' : 'none';
            const el7 = document.getElementById('playerMissPercentRow'); if (el7) el7.style.display = s.periodType === 'miss_percent' ? 'flex' : 'none';
        } else {
            const el1 = document.getElementById('playerPenaltyEnabled'); if (el1) el1.checked = false;
            const el2 = document.getElementById('playerPenaltyPercent'); if (el2) el2.value = 10;
            const el3 = document.getElementById('playerPenaltyPeriodType'); if (el3) el3.value = 'week';
            const el4 = document.getElementById('playerPenaltyCustomDays'); if (el4) el4.value = 7;
            const el5 = document.getElementById('playerPenaltyMissPercent'); if (el5) el5.value = 50;
            const el6 = document.getElementById('playerCustomDaysRow'); if (el6) el6.style.display = 'none';
            const el7 = document.getElementById('playerMissPercentRow'); if (el7) el7.style.display = 'none';
        }
    } catch (e) {}
}

async function savePlayerPenaltySettings() {
    const n = document.getElementById('playerPenaltySelect').value;
    if (!n) { alert('Выберите игрока'); return; }
    const m = document.getElementById('playerPenaltyMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePlayerPenaltySettings', nickname: n, enabled: document.getElementById('playerPenaltyEnabled').checked, penaltyPercent: Number(document.getElementById('playerPenaltyPercent').value), periodType: document.getElementById('playerPenaltyPeriodType').value, customDays: Number(document.getElementById('playerPenaltyCustomDays').value), missPercent: Number(document.getElementById('playerPenaltyMissPercent').value) }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Сохранено для ' + n; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

async function loadAllSettings() {
    loadAuctionSettings();
    loadPenaltySettings();
    loadPlayersForPenaltySelect();
    loadEventCoefficientSettings();
    loadPlayersForEventCoefSelect();
}

// ============================================================
// 💾 АРХИВ DKP
// ============================================================

async function archiveDKP() {
    if (!confirm('Создать резервную копию DKP?')) return;
    const msg = document.getElementById('archiveMessage');
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Создание...'; msg.style.display = 'block'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'archiveDKP' }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = res.message; }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка: ' + e.message; } }
    if (msg) setTimeout(function() { msg.style.display = 'none'; }, 6000);
}
