// ============================================================
// 👥 ПОЛЬЗОВАТЕЛИ АДМИН
// ============================================================

async function loadPendingPlayers() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPendingPlayers' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('pendingPlayersList');
        if (!l) return;
        if (res.success && res.players.length > 0) {
            let html = '';
            for (let i = 0; i < res.players.length; i++) {
                const p = res.players[i];
                html += '<div class="player-card"><div class="player-card-header"><div class="player-nick">' + escapeHtml(p.nickname) + '</div><div class="action-buttons"><button class="btn-approve" onclick="approvePlayer(\'' + escapeForOnclick(p.nickname) + '\')">✓</button><button class="btn-reject" onclick="rejectPlayer(\'' + escapeForOnclick(p.nickname) + '\')">✕</button></div></div><div class="data-grid"><div class="data-item"><div class="data-label">БМ</div><div class="data-value">' + p.bm + '</div></div><div class="data-item"><div class="data-label">Уровень</div><div class="data-value">' + p.level + '</div></div><div class="data-item"><div class="data-label">Профессия</div><div class="data-value">' + escapeHtml(p.profession) + '</div></div></div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет</div>';
    } catch (e) { console.error(e); }
}

async function approvePlayer(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approvePlayer', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingPlayers(); }
    } catch (e) {}
}

async function rejectPlayer(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectPlayer', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingPlayers(); }
    } catch (e) {}
}

async function loadAllUsers() {
    if (currentRole !== 'Админ' && currentRole !== 'Модератор') return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllUsers' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('usersList');
        if (!l) return;
        if (res.success && res.users.length > 0) {
            let html = '';
            for (let i = 0; i < res.users.length; i++) {
                const u = res.users[i];
                const rc = u.role === 'Админ' ? 'admin' : (u.role === 'Модератор' ? 'mod' : (u.role === 'Гость' ? 'guest' : 'player'));
                const isSelf = u.nickname === currentUser;
                const isBanned = u.status === 'banned';
                const isGuest = u.role === 'Гость';
                let rb = '';
                if (currentRole === 'Админ' && !isSelf) {
                    if (u.role !== 'Админ') rb += '<button class="btn-role btn-role-admin" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\',\'Админ\')">⬆ Админ</button>';
                    if (u.role !== 'Модератор' && u.role !== 'Гость') rb += '<button class="btn-role btn-role-mod" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\',\'Модератор\')">⬆ Мод</button>';
                    if (u.role !== 'Игрок' && u.role !== 'Гость') rb += '<button class="btn-role btn-role-player" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\',\'Игрок\')">⬇ Игрок</button>';
                    if (isGuest) rb += '<button class="btn-role btn-role-player" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\',\'Игрок\')">⬆ Игрок</button>';
                }
                let db = '';
                if (!isSelf) {
                    if (currentRole === 'Админ') {
                        if (isBanned) db += '<button class="btn-unban" onclick="unbanUser(\'' + escapeForOnclick(u.nickname) + '\')">✅ Разбан</button>';
                        else if (u.role === 'Игрок' || u.role === 'Гость') db += '<button class="btn-ban" onclick="openBanModal(\'' + escapeForOnclick(u.nickname) + '\')">🚫 Бан</button>';
                        db += '<button class="btn-remove" onclick="deleteUser(\'' + escapeForOnclick(u.nickname) + '\')">🗑</button>';
                    } else if (currentRole === 'Модератор' && u.role === 'Игрок') db = '<button class="btn-remove" onclick="requestUserDeletion(\'' + escapeForOnclick(u.nickname) + '\')">🗑 Запрос</button>';
                } else rb = '<span style="color:var(--text-dim);font-size:9px;font-style:italic;">Вы</span>';
                let statusBadge = '';
                if (isBanned) statusBadge = '<span class="user-status-badge banned">🚫 Забанен</span>';
                else if (isGuest) statusBadge = '<span class="user-status-badge guest">👁 Гость</span>';
                else statusBadge = '<span class="user-status-badge active">✅ Активен</span>';
                const cardClass = isBanned ? 'banned' : (isGuest ? 'guest' : '');
                const ei = u.email ? ' | 📧 ' + escapeHtml(u.email) : '';
                html += '<div class="player-card ' + cardClass + '"><div class="player-card-header"><div><span class="player-nick">' + escapeHtml(u.nickname) + '</span><span class="user-role-tag ' + rc + '">' + escapeHtml(u.role) + '</span>' + statusBadge + '</div><div class="action-buttons">' + rb + db + '</div></div><div style="color:var(--text-dim);font-size:9px;">' + escapeHtml(u.date || '—') + ei + '</div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет</div>';
        const ds = document.getElementById('deletionRequestsSection');
        if (ds) { if (currentRole === 'Админ') { ds.style.display = 'block'; loadDeletionRequests(); } else ds.style.display = 'none'; }
    } catch (e) {}
}

async function setUserRole(n, r) {
    if (currentRole !== 'Админ') { alert('Только админ!'); return; }
    if (!confirm('"' + n + '" → "' + r + '"?')) return;
    try {
        const rs = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'setUserRole', nickname: n, newRole: r }), redirect: 'follow' });
        const res = await rs.json();
        if (res.success) { alert('✅ ' + res.message); loadAllUsers(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function deleteUser(n) {
    if (!confirm('Удалить "' + n + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteUser', nickname: n, requestedBy: currentUser, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadAllUsers(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function requestUserDeletion(n) {
    if (!confirm('Запросить удаление "' + n + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteUser', nickname: n, requestedBy: currentUser, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) alert('✅ ' + res.message);
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function loadDeletionRequests() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getDeletionRequests' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('deletionRequestsList');
        if (!l) return;
        if (res.success && res.requests.length > 0) {
            let html = '';
            for (let i = 0; i < res.requests.length; i++) {
                const q = res.requests[i];
                html += '<div class="player-card"><div class="player-card-header"><div><div class="player-nick">🗑️ ' + escapeHtml(q.nickname) + '</div><div style="font-size:9px;color:var(--text-dim);margin-top:1px;">От: ' + escapeHtml(q.requestedBy) + ' | ' + escapeHtml(q.date) + '</div></div><div class="action-buttons"><button class="btn-approve" onclick="approveDeletion(\'' + escapeForOnclick(q.id) + '\')">✓</button><button class="btn-reject" onclick="rejectDeletion(\'' + escapeForOnclick(q.id) + '\')">✕</button></div></div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет заявок</div>';
    } catch (e) {}
}

async function approveDeletion(id) {
    if (!confirm('Подтвердить удаление?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveDeletion', requestId: id, approvedBy: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadDeletionRequests(); loadAllUsers(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function rejectDeletion(id) {
    if (!confirm('Отклонить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectDeletion', requestId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadDeletionRequests(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function loadAuctionDeletionRequests() {
    if (currentRole !== 'Админ') return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionDeletionRequests' }), redirect: 'follow' });
        const res = await r.json();
        const s = document.getElementById('auctionDeletionRequestsSection');
        const l = document.getElementById('auctionDeletionRequestsList');
        if (!s || !l) return;
        if (res.success && res.requests && res.requests.length > 0) {
            s.style.display = 'block';
            let html = '';
            for (let i = 0; i < res.requests.length; i++) {
                const q = res.requests[i];
                const info = q.auctionInfo || {};
                html += '<div class="player-card"><div class="player-card-header"><div><div class="player-nick">🗑️ Аукцион #' + (info.number || '?') + ': ' + escapeHtml(info.name || 'Неизвестно') + '</div><div style="font-size:9px;color:var(--text-dim);margin-top:1px;">Победитель: ' + escapeHtml(info.winner || '—') + ' | От: ' + escapeHtml(q.requestedBy) + '</div></div><div class="action-buttons"><button class="btn-approve" onclick="approveAuctionDeletion(\'' + escapeForOnclick(q.id) + '\')">✓</button><button class="btn-reject" onclick="rejectAuctionDeletion(\'' + escapeForOnclick(q.id) + '\')">✕</button></div></div></div>';
            }
            l.innerHTML = html;
        } else {
            if (currentRole === 'Админ') s.style.display = 'block';
            l.innerHTML = '<div class="empty-state">Нет заявок</div>';
        }
    } catch (e) {}
}

async function approveAuctionDeletion(id) {
    if (!confirm('Подтвердить удаление?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveAuctionDeletion', requestId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadAuctionDeletionRequests(); loadCompletedAuctions(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function rejectAuctionDeletion(id) {
    if (!confirm('Отклонить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectAuctionDeletion', requestId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadAuctionDeletionRequests(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

function openBanModal(nickname) {
    document.getElementById('banNickname').value = nickname;
    document.getElementById('banNicknameDisplay').innerText = nickname;
    document.getElementById('banReason').value = '';
    document.getElementById('banModal').classList.remove('hidden');
}

function closeBanModal() { document.getElementById('banModal').classList.add('hidden'); }

async function confirmBanUser() {
    const nickname = document.getElementById('banNickname').value;
    const reason = document.getElementById('banReason').value.trim();
    if (!confirm('Заблокировать ' + nickname + '?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'banUser', nickname: nickname, reason: reason || 'Не указана', bannedBy: currentUser, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); closeBanModal(); loadAllUsers(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function unbanUser(nickname) {
    if (!confirm('Разблокировать ' + nickname + '?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'unbanUser', nickname: nickname, unbannedBy: currentUser, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadAllUsers(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

// ============================================================
// 🎯 МЕРОПРИЯТИЯ АДМИН
// ============================================================

async function loadAdminEvents() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEvents' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('adminEventsList');
        if (!l) return;
        if (res.success && res.events.length > 0) {
            allEvents = res.events;
            let html = '';
            for (let i = 0; i < res.events.length; i++) {
                const e = res.events[i];
                html += '<div class="event-card"><div style="display:flex;align-items:center;gap:8px;flex:1;"><div id="eventIcon_' + escapeHtml(e.id) + '" class="icon-preview" onclick="openIconModal(\'event\',\'' + escapeForOnclick(e.id) + '\',\'' + escapeForOnclick(e.name) + '\')"><span class="icon-placeholder">...</span></div><div class="event-info"><div class="event-name">' + escapeHtml(e.name) + '</div><div class="event-meta">' + escapeHtml(e.createdBy || '—') + ' | ' + escapeHtml(e.date) + ' | <span style="color:var(--dkp);font-weight:700;">💰 ' + e.dkp + ' DKP</span></div></div></div><div class="event-dkp">+' + e.dkp + '</div><div class="action-buttons"><button class="btn-edit" onclick="openEditEventModal(\'' + escapeForOnclick(e.id) + '\',\'' + escapeForOnclick(e.name) + '\',' + e.dkp + ')" style="width:auto;margin-top:0;">✎ Изм.</button><button class="btn-edit" onclick="openIconModal(\'event\',\'' + escapeForOnclick(e.id) + '\',\'' + escapeForOnclick(e.name) + '\')" style="width:auto;margin-top:0;">🖼</button><button class="btn-remove" onclick="openDeleteEventModal(\'' + escapeForOnclick(e.id) + '\',\'' + escapeForOnclick(e.name) + '\')" style="padding:4px 8px;">🗑</button></div></div>';
            }
            l.innerHTML = html;
            for (let i = 0; i < res.events.length; i++) loadEventIcon(res.events[i].id);
        } else l.innerHTML = '<div class="empty-state">Нет мероприятий</div>';
    } catch (e) { console.error(e); }
}

async function loadEventIcon(id) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEventIcon', eventId: id }), redirect: 'follow' });
        const res = await r.json();
        const c = document.getElementById('eventIcon_' + id);
        if (c && res.success && res.iconData) c.innerHTML = '<img src="' + res.iconData + '" style="width:100%;height:100%;object-fit:cover;">';
        else if (c) c.innerHTML = '<span class="icon-placeholder">Нет</span>';
    } catch (e) {}
}

async function addEvent(e) {
    e.preventDefault();
    const n = document.getElementById('newEventName').value;
    const d = document.getElementById('newEventDkp').value;
    const m = document.getElementById('adminEventsMessage');
    if (!n || !d) { if (m) { m.className = 'message error'; m.innerText = 'Заполните поля'; m.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addEvent', name: n, dkp: Number(d), createdBy: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; document.getElementById('newEventName').value = ''; document.getElementById('newEventDkp').value = ''; setTimeout(function() { loadAdminEvents(); m.style.display = 'none'; }, 800); }
            else { m.className = 'message error'; m.innerText = res.message; m.style.display = 'block'; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; m.style.display = 'block'; } }
}

let currentEditEventId = null;

function openEditEventModal(id, n, d) {
    currentEditEventId = id;
    document.getElementById('editEventId').innerText = id;
    document.getElementById('editEventName').value = n;
    document.getElementById('editEventDkp').value = d;
    const m = document.getElementById('editEventMessage');
    if (m) m.style.display = 'none';
    document.getElementById('editEventModal').classList.remove('hidden');
}

function closeEditEventModal() { document.getElementById('editEventModal').classList.add('hidden'); currentEditEventId = null; }

async function saveEventEdit() {
    if (!currentEditEventId) return;
    const nn = document.getElementById('editEventName').value.trim();
    const nd = document.getElementById('editEventDkp').value;
    const m = document.getElementById('editEventMessage');
    if (!nn) { if (m) { m.className = 'message error'; m.innerText = 'Введите название'; m.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateEvent', eventId: currentEditEventId, newName: nn, newDkp: Number(nd) }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ ' + res.message; m.style.display = 'block'; setTimeout(function() { closeEditEventModal(); loadAdminEvents(); loadEventsForSelect(); }, 1500); }
            else { m.className = 'message error'; m.innerText = '❌ ' + res.message; m.style.display = 'block'; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка'; m.style.display = 'block'; } }
}

let currentDeleteEventId = null, currentDeleteEventName = null;

function openDeleteEventModal(id, n) {
    currentDeleteEventId = id;
    currentDeleteEventName = n;
    document.getElementById('deleteEventId').innerText = id;
    document.getElementById('deleteEventName').innerText = n;
    document.getElementById('deleteEventRelated').checked = true;
    document.getElementById('deleteEventRevertDkp').checked = false;
    const rw = document.getElementById('revertWarning');
    if (rw) rw.style.display = 'none';
    document.getElementById('deleteEventModal').classList.remove('hidden');
}

function closeDeleteEventModal() { document.getElementById('deleteEventModal').classList.add('hidden'); currentDeleteEventId = null; currentDeleteEventName = null; }

async function confirmDeleteEvent() {
    if (!currentDeleteEventId) return;
    const dr = document.getElementById('deleteEventRelated').checked;
    const rd = document.getElementById('deleteEventRevertDkp').checked;
    if (!confirm('Удалить "' + currentDeleteEventName + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteEventWithHistory', eventId: currentDeleteEventId, deleteRelated: dr, revertDkp: rd }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); closeDeleteEventModal(); loadAdminEvents(); loadEventsForSelect(); loadEventStats(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

// ============================================================
// 💰 DKP АДМИНКА
// ============================================================

async function loadPendingDkp() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPendingDKP' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('pendingDkpList');
        if (!l) return;
        if (res.success && res.submissions.length > 0) {
            let html = '';
            for (let i = 0; i < res.submissions.length; i++) {
                const s = res.submissions[i];
                html += '<div class="dkp-submission-card"><div class="submission-header"><div style="display:flex;align-items:center;gap:6px;"><input type="checkbox" class="dkp-submission-checkbox" value="' + escapeForOnclick(s.id) + '" onchange="updateSelectedCount()" style="margin-right:4px;"><div><div class="submission-event">🏆 ' + escapeHtml(s.eventName) + ' (+' + s.eventDkp + ')</div><div class="submission-meta">' + escapeHtml(s.submitter) + ' | ' + escapeHtml(s.date) + '</div></div></div><div class="action-buttons"><button class="btn-approve" onclick="approveDkp(\'' + escapeForOnclick(s.id) + '\')">✓</button><button class="btn-reject" onclick="rejectDkp(\'' + escapeForOnclick(s.id) + '\')">✕</button><button class="btn-edit" onclick="editDkpSubmission(\'' + escapeForOnclick(s.id) + '\')" style="width:auto;margin-top:0;">✎</button><button class="btn-remove" onclick="deleteDkpSubmission(\'' + escapeForOnclick(s.id) + '\')">🗑</button></div></div>';
                if (s.screenshots && s.screenshots.length > 0) {
                    html += '<div class="submission-screenshots">';
                    for (let j = 0; j < s.screenshots.length; j++) html += '<img src="' + s.screenshots[j] + '" onclick="openImageModal(\'' + escapeForOnclick(s.screenshots[j]) + '\')">';
                    html += '</div>';
                }
                html += '<div style="font-size:9px;color:var(--text-dim);margin-top:4px;">Игроки (' + s.nicks.length + '):</div><div class="submission-nicks">';
                for (let j = 0; j < s.nicks.length; j++) html += '<span class="submission-nick-tag">' + escapeHtml(s.nicks[j]) + '</span>';
                html += '</div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет заявок</div>';
    } catch (e) { console.error(e); }
}

function selectAllDkpSubmissions() { const checkboxes = document.querySelectorAll('.dkp-submission-checkbox'); for (let i = 0; i < checkboxes.length; i++) checkboxes[i].checked = true; updateSelectedCount(); }
function deselectAllDkpSubmissions() { const checkboxes = document.querySelectorAll('.dkp-submission-checkbox'); for (let i = 0; i < checkboxes.length; i++) checkboxes[i].checked = false; updateSelectedCount(); }
function updateSelectedCount() { const checkboxes = document.querySelectorAll('.dkp-submission-checkbox:checked'); const el = document.getElementById('selectedCount'); if (el) el.innerText = 'Выбрано: ' + checkboxes.length; }

async function approveSelectedDkp() {
    const checkboxes = document.querySelectorAll('.dkp-submission-checkbox:checked');
    if (checkboxes.length === 0) { alert('Выберите хотя бы одну'); return; }
    if (!confirm('Одобрить ' + checkboxes.length + ' заявок?')) return;
    const ids = [];
    for (let i = 0; i < checkboxes.length; i++) ids.push(checkboxes[i].value);
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveMultipleDKP', submissionIds: ids, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function rejectSelectedDkp() {
    const checkboxes = document.querySelectorAll('.dkp-submission-checkbox:checked');
    if (checkboxes.length === 0) { alert('Выберите хотя бы одну'); return; }
    if (!confirm('Отклонить ' + checkboxes.length + ' заявок?')) return;
    const ids = [];
    for (let i = 0; i < checkboxes.length; i++) ids.push(checkboxes[i].value);
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectMultipleDKP', submissionIds: ids, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function approveDkp(id) {
    if (!confirm('Подтвердить и начислить DKP?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveDKP', submissionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function rejectDkp(id) {
    if (!confirm('Отклонить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectDKP', submissionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function editDkpSubmission(id) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getDkpSubmission', submissionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { alert('Ошибка: ' + res.message); return; }
        const s = res.submission;
        const m = document.createElement('div');
        m.className = 'modal-overlay';
        m.id = 'editDkpModal';
        let html = '<div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto;"><button class="modal-close" onclick="closeEditDkpModal()">✕</button><h3 style="color:var(--accent);font-family:var(--font-display);margin-bottom:10px;font-size:13px;">✎ ' + escapeHtml(s.eventName) + '</h3>';
        html += '<div style="margin-bottom:8px;"><div style="font-size:9px;color:var(--text-dim);">Отправитель:</div><div style="font-size:11px;">' + escapeHtml(s.submitter) + '</div></div>';
        html += '<div style="margin-bottom:8px;"><div style="font-size:9px;color:var(--text-dim);">Базовые DKP:</div><div style="font-size:14px;color:var(--dkp);font-weight:700;">' + s.eventDkp + '</div></div>';
        if (s.screenshots && s.screenshots.length > 0) {
            html += '<div style="margin-bottom:8px;"><div style="font-size:9px;color:var(--text-dim);margin-bottom:3px;">Скриншоты:</div><div style="display:flex;gap:4px;flex-wrap:wrap;">';
            for (let i = 0; i < s.screenshots.length; i++) html += '<img src="' + s.screenshots[i] + '" onclick="openImageModal(\'' + escapeForOnclick(s.screenshots[i]) + '\')" style="width:140px;">';
            html += '</div></div>';
        }
        html += '<div style="margin-bottom:8px;"><div style="font-size:9px;color:var(--text-dim);margin-bottom:3px;">Участники (' + s.nicks.length + '):</div><div id="editDkpNicksList" style="display:flex;flex-direction:column;gap:4px;">';
        for (let i = 0; i < s.nicks.length; i++) html += '<div class="nick-item"><input type="text" value="' + escapeHtml(s.nicks[i]) + '" id="editNick_' + i + '"><button class="remove-nick-btn" onclick="removeEditNick(' + i + ')">✕</button></div>';
        html += '</div><button type="button" class="btn-edit" onclick="addEditNickField()" style="margin-top:6px;width:auto;">+ Добавить</button></div>';
        html += '<button type="button" class="submit-btn dkp-btn" onclick="saveDkpSubmission(\'' + escapeForOnclick(s.id) + '\')">💾 Сохранить</button></div>';
        m.innerHTML = html;
        document.body.appendChild(m);
        window.currentEditDkp = { id: s.id, nicks: s.nicks.slice() };
    } catch (e) { alert('Ошибка: ' + e.message); }
}

function closeEditDkpModal() { const m = document.getElementById('editDkpModal'); if (m) m.remove(); window.currentEditDkp = null; }
function removeEditNick(i) { const inp = document.getElementById('editNick_' + i); if (inp) inp.parentElement.remove(); }
function addEditNickField() { const l = document.getElementById('editDkpNicksList'); const i = l.children.length; const d = document.createElement('div'); d.className = 'nick-item'; d.innerHTML = '<input type="text" value="" id="editNick_' + i + '"><button class="remove-nick-btn" onclick="removeEditNick(' + i + ')">✕</button>'; l.appendChild(d); d.querySelector('input').focus(); }

async function saveDkpSubmission(id) {
    const l = document.getElementById('editDkpNicksList');
    const is = l.querySelectorAll('input');
    const ns = [];
    for (let i = 0; i < is.length; i++) { const v = is[i].value.trim(); if (v) ns.push(v); }
    if (ns.length === 0) { alert('Добавьте участника'); return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateDkpSubmission', submissionId: id, nicks: ns }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('Обновлено!'); closeEditDkpModal(); loadPendingDkp(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function deleteDkpSubmission(id) {
    if (!confirm('Удалить заявку?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteDkpSubmission', submissionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('Удалена'); loadPendingDkp(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function adjustDkp(e) {
    e.preventDefault();
    const n = document.getElementById('adjustDkpNick').value;
    const a = document.getElementById('adjustDkpAmount').value;
    const r = document.getElementById('adjustDkpReason').value;
    const m = document.getElementById('adminDkpAdjustMessage');
    if (!n || !a) { if (m) { m.className = 'message error'; m.innerText = 'Заполните поля'; m.style.display = 'block'; } return; }
    try {
        const rs = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'adjustDKP', nickname: n, amount: Number(a), reason: r || 'Ручная', adjustedBy: currentUser }), redirect: 'follow' });
        const res = await rs.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; document.getElementById('adjustDkpNick').value = ''; document.getElementById('adjustDkpAmount').value = ''; document.getElementById('adjustDkpReason').value = ''; setTimeout(function() { m.style.display = 'none'; }, 2000); }
            else { m.className = 'message error'; m.innerText = res.message; m.style.display = 'block'; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; m.style.display = 'block'; } }
}

// ============================================================
// 🖼️ ИКОНКИ
// ============================================================

function openIconModal(t, id, n) {
    currentIconType = t; currentIconId = id; currentIconName = n;
    const m = document.getElementById('iconModal');
    const ti = document.getElementById('iconModalTitle');
    const sh = document.getElementById('iconSizeHint');
    const p = document.getElementById('iconPreview');
    if (t === 'event') { if (ti) ti.innerHTML = '🎯 ' + escapeHtml(n); if (sh) sh.innerText = '300×150 px'; }
    else if (t === 'skill') { if (ti) ti.innerHTML = '🎯 ' + escapeHtml(n); if (sh) sh.innerText = '56×56 px'; }
    else if (t === 'profession') { if (ti) ti.innerHTML = '🎭 ' + escapeHtml(n); if (sh) sh.innerText = '56×56 px'; }
    else { if (ti) ti.innerHTML = '⚔ ' + escapeHtml(n); if (sh) sh.innerText = '56×56 px'; }
    if (p) p.innerHTML = '<div style="color:var(--text-dim);">Загрузка...</div>';
    if (m) m.classList.remove('hidden');
    loadIconPreview(t, id);
}

function closeIconModal() {
    const m = document.getElementById('iconModal');
    if (m) m.classList.add('hidden');
    currentIconType = null; currentIconId = null; currentIconName = null;
}

async function loadIconPreview(t, id) {
    const p = document.getElementById('iconPreview');
    if (!p) return;
    try {
        let r;
        if (t === 'event') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEventIcon', eventId: id }), redirect: 'follow' });
        else if (t === 'skill') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSkillIcon', skillName: id }), redirect: 'follow' });
        else if (t === 'profession') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getProfessionIcon', profession: id }), redirect: 'follow' });
        else r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItemIcon', itemId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.iconData) {
            const sz = t === 'event' ? '200px' : '70px';
            p.innerHTML = '<img src="' + res.iconData + '" alt="icon" style="max-width:' + sz + ';border-radius:3px;">';
        } else p.innerHTML = '<div style="color:var(--text-dim);">Нет иконки</div>';
    } catch (e) { p.innerHTML = '<div style="color:var(--danger);">Ошибка</div>'; }
}

async function handleIconFileSelect(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Выберите изображение'); return; }
    const rd = new FileReader();
    rd.onload = async function(ev) {
        const b = ev.target.result;
        const sz = currentIconType === 'event' ? { width: 300, height: 150 } : { width: 56, height: 56 };
        const c = await compressIconImage(b, sz);
        try {
            let r;
            if (currentIconType === 'event') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveEventIcon', eventId: currentIconId, iconData: c }), redirect: 'follow' });
            else if (currentIconType === 'skill') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveSkillIcon', skillName: currentIconId, iconData: c }), redirect: 'follow' });
            else if (currentIconType === 'profession') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveProfessionIcon', profession: currentIconId, iconData: c }), redirect: 'follow' });
            else r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveItemIcon', itemId: currentIconId, iconData: c }), redirect: 'follow' });
            const res = await r.json();
            if (res.success) {
                alert('Сохранено!');
                loadIconPreview(currentIconType, currentIconId);
                if (currentIconType === 'event') loadAdminEvents();
                else if (currentIconType === 'skill') loadAdminSkills();
                else if (currentIconType === 'profession') { loadProfessionIconsAdmin(); loadAllProfessionIcons(); }
                else loadAdminItems();
            } else alert('Ошибка: ' + res.message);
        } catch (err) { alert('Ошибка: ' + err.message); }
    };
    rd.readAsDataURL(f);
    e.target.value = '';
}

function compressIconImage(b, sz) {
    return new Promise(function(resolve) {
        const i = new Image();
        i.onload = function() {
            const c = document.createElement('canvas');
            c.width = sz.width; c.height = sz.height;
            c.getContext('2d').drawImage(i, 0, 0, sz.width, sz.height);
            resolve(c.toDataURL('image/jpeg', 0.85));
        };
        i.onerror = function() { resolve(b); };
        i.src = b;
    });
}

async function deleteCurrentIcon() {
    if (!confirm('Удалить иконку?')) return;
    if (!currentIconType || !currentIconId) return;
    try {
        let r;
        if (currentIconType === 'event') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteEventIcon', eventId: currentIconId }), redirect: 'follow' });
        else if (currentIconType === 'skill') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteSkillIcon', skillName: currentIconId }), redirect: 'follow' });
        else if (currentIconType === 'profession') r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteProfessionIcon', profession: currentIconId }), redirect: 'follow' });
        else r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteItemIcon', itemId: currentIconId }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            alert('Удалена!');
            closeIconModal();
            if (currentIconType === 'event') loadAdminEvents();
            else if (currentIconType === 'skill') loadAdminSkills();
            else if (currentIconType === 'profession') { loadProfessionIconsAdmin(); loadAllProfessionIcons(); }
            else loadAdminItems();
        } else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function loadProfessionIconsAdmin() {
    const l = document.getElementById('professionIconsList');
    if (!l) return;
    const ps = ['Демолишер', 'Арбитр', 'Каратель', 'Фантом', 'Дредноут', 'Сайфер', 'Техник', 'Инфорсер'];
    const de = { 'Демолишер': '🔨', 'Арбитр': '⚖', 'Каратель': '⚔', 'Фантом': '👻', 'Дредноут': '🛡', 'Сайфер': '🎯', 'Техник': '🔧', 'Инфорсер': '💥' };
    let html = '';
    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const ic = allProfessionIcons[p];
        html += '<div class="admin-skill-item"><div style="display:flex;align-items:center;gap:8px;flex:1;"><div class="icon-preview-small" id="profIcon_' + p.replace(/\s/g, '_') + '" onclick="openIconModal(\'profession\',\'' + escapeForOnclick(p) + '\',\'' + escapeForOnclick(p) + '\')" style="border:2px solid var(--accent);">';
        if (ic) html += '<img src="' + ic + '" style="width:100%;height:100%;object-fit:cover;">';
        else html += '<span style="font-size:18px;">' + de[p] + '</span>';
        html += '</div><div><span class="admin-skill-name">' + escapeHtml(p) + '</span>';
        if (ic) html += '<span class="admin-skill-tag" style="background:var(--success-soft);color:var(--success);border-color:var(--success);">Есть</span>';
        else html += '<span class="admin-skill-tag">По умолч.</span>';
        html += '</div></div><div class="action-buttons"><button class="btn-edit" onclick="openIconModal(\'profession\',\'' + escapeForOnclick(p) + '\',\'' + escapeForOnclick(p) + '\')" style="width:auto;margin-top:0;">🖼 Изменить</button>';
        if (ic) html += '<button class="btn-remove" onclick="deleteProfessionIcon(\'' + escapeForOnclick(p) + '\')">✕</button>';
        html += '</div></div>';
    }
    l.innerHTML = html;
}

async function deleteProfessionIcon(p) {
    if (!confirm('Удалить иконку "' + p + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteProfessionIcon', profession: p }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ Удалена'); loadProfessionIconsAdmin(); loadAllProfessionIcons(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

// ============================================================
// 🖼️ ФОН САЙТА
// ============================================================

async function loadSiteBackgroundSettings() {
    const p = document.getElementById('bgPreview');
    if (!p) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSiteBackground' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.backgroundImage) {
            p.style.backgroundImage = 'url(' + res.backgroundImage + ')';
            p.style.borderStyle = 'solid';
            p.style.borderColor = 'var(--success)';
            p.innerText = '';
        } else {
            p.style.backgroundImage = 'none';
            p.style.borderStyle = 'dashed';
            p.innerText = 'Нет фона';
        }
    } catch (e) {}
}

async function uploadSiteBackground() {
    const fi = document.getElementById('bgFileInput');
    const m = document.getElementById('bgSettingsMessage');
    if (!fi || !fi.files[0]) { if (m) { m.className = 'message error'; m.innerText = '❌ Выберите файл'; m.style.display = 'block'; } return; }
    const f = fi.files[0];
    if (!f.type.startsWith('image/')) { if (m) { m.className = 'message error'; m.innerText = '❌ Выберите изображение'; m.style.display = 'block'; } return; }
    if (f.size > 5 * 1024 * 1024) { if (m) { m.className = 'message error'; m.innerText = '❌ Файл > 5 МБ'; m.style.display = 'block'; } return; }
    if (m) { m.innerText = '⏳ Загрузка...'; m.className = 'message'; m.style.display = 'block'; }
    const rd = new FileReader();
    rd.onload = async function(e) {
        try {
            const compressed = await compressImage(e.target.result, 1920, 0.85);
            if (!compressed || compressed.length < 100) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка обработки'; m.style.display = 'block'; } return; }
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveSiteBackground', imageData: compressed, role: currentRole }), redirect: 'follow' });
            const res = await r.json();
            if (m) {
                if (res.success) { m.className = 'message success'; m.innerText = '✅ ' + res.message; m.style.display = 'block'; fi.value = ''; loadSiteBackgroundSettings(); loadSiteBackground(); setTimeout(function() { m.style.display = 'none'; }, 2000); }
                else { m.className = 'message error'; m.innerText = '❌ ' + res.message; m.style.display = 'block'; }
            }
        } catch (err) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка: ' + err.message; m.style.display = 'block'; } }
    };
    rd.readAsDataURL(f);
}

async function deleteSiteBackground() {
    if (!confirm('Удалить фон?')) return;
    const m = document.getElementById('bgSettingsMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteSiteBackground', role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) {
                m.className = 'message success'; m.innerText = '✅ ' + res.message; m.style.display = 'block';
                document.body.style.removeProperty('--site-bg-image');
                document.body.classList.remove('has-bg-image');
                loadSiteBackgroundSettings(); loadSiteBackground();
                setTimeout(function() { m.style.display = 'none'; }, 2000);
            } else { m.className = 'message error'; m.innerText = '❌ ' + res.message; m.style.display = 'block'; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка: ' + e.message; m.style.display = 'block'; } }
}

// ============================================================
// 📝 ЛОГ ДЕЙСТВИЙ
// ============================================================

async function loadActionLog() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getActionLog', limit: 200 }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('actionLogList');
        if (!l) return;
        if (res.success && res.logs && res.logs.length > 0) {
            let html = '';
            for (let i = 0; i < res.logs.length; i++) {
                const log = res.logs[i];
                html += '<div class="log-item"><span class="log-date">' + escapeHtml(log.date) + '</span><div><span class="log-action">' + escapeHtml(log.action) + '</span> — <span class="log-user">' + escapeHtml(log.user) + '</span></div>';
                if (log.details) html += '<div class="log-details">' + escapeHtml(log.details) + '</div>';
                html += '</div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Лог пуст</div>';
    } catch (e) { console.error(e); }
}

async function clearActionLog() {
    if (!confirm('Очистить все логи?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'clearActionLog' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadActionLog(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

// ============================================================
// 📋 СПИСКИ "У КОГО НЕТ"
// ============================================================

async function loadMissingItemNames() {
    const ty = document.getElementById('missingItemType').value;
    const ns = document.getElementById('missingItemName');
    if (!ns) return;
    try {
        if (ty === 'skill') {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSkills' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success) {
                let html = '<option value="">— Выберите навык —</option>';
                for (let i = 0; i < res.skills.length; i++) html += '<option value="' + escapeHtml(res.skills[i].name) + '">' + escapeHtml(res.skills[i].name) + '</option>';
                ns.innerHTML = html;
            }
        } else {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
            const res = await r.json();
            if (res.success) {
                let html = '<option value="">— Выберите предмет —</option>';
                for (let i = 0; i < res.items.length; i++) html += '<option value="' + escapeHtml(res.items[i].name) + '">' + escapeHtml(res.items[i].name) + ' (' + escapeHtml(res.items[i].section) + ')</option>';
                ns.innerHTML = html;
            }
        }
    } catch (e) { console.error(e); }
}

async function loadMissingList() {
    if (!isFeatureEnabled('missingLists')) return;
    const ty = document.getElementById('missingItemType').value;
    const nm = document.getElementById('missingItemName').value;
    const r = document.getElementById('missingListResult');
    if (!nm) { if (r) r.innerHTML = '<div class="empty-state">Выберите элемент</div>'; return; }
    if (r) r.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const res = await (await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getMissingItems', itemType: ty, itemName: nm }), redirect: 'follow' })).json();
        if (res.success) {
            if (res.missing.length === 0) { if (r) r.innerHTML = '<div class="empty-state">✅ У всех есть "' + escapeHtml(nm) + '"</div>'; }
            else {
                let html = '<div style="margin-bottom:8px;font-size:11px;color:var(--text-dim);">У ' + res.missing.length + ' из ' + res.total + ' игроков нет "' + escapeHtml(nm) + '":</div>';
                for (let i = 0; i < res.missing.length; i++) html += '<div class="missing-player"><span class="nick">' + renderPlayerNickWithBioColor(res.missing[i], null, true, true) + '</span></div>';
                if (r) r.innerHTML = html;
            }
        } else if (r) r.innerHTML = '<div class="empty-state">❌ ' + escapeHtml(res.message) + '</div>';
    } catch (e) { if (r) r.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

// ============================================================
// 📤 ЭКСПОРТ ДАННЫХ
// ============================================================

async function exportData(ty) {
    if (!isFeatureEnabled('dataExport')) { alert('Функция выключена'); return; }
    const r = document.getElementById('exportResult');
    if (r) r.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Генерация...</div>';
    if (ty === 'guilds') {
        try {
            const res = await (await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuilds' }), redirect: 'follow' })).json();
            if (res.success && res.guilds) {
                let csv = 'ID;Название;Лидер;Описание;Иконка;Создана;Казна DKP;Участников;Общий рейтинг\n';
                for (const g of res.guilds) csv += g.id + ';' + g.name + ';' + g.leader + ';' + (g.description || '').replace(/;/g, ',') + ';' + g.icon + ';' + g.createdAt + ';' + g.dkp + ';' + g.membersCount + ';' + g.totalRating + '\n';
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'rf_export_guilds_' + new Date().toISOString().split('T')[0] + '.csv';
                document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
                if (r) r.innerHTML = '<div class="message success" style="display:block;">✅ Файл скачан!</div>';
                setTimeout(function() { if (r) r.innerHTML = ''; }, 3000);
            } else if (r) r.innerHTML = '<div class="message error" style="display:block;">❌ Нет гильдий</div>';
        } catch (e) { if (r) r.innerHTML = '<div class="message error" style="display:block;">❌ Ошибка</div>'; }
        return;
    }
    try {
        const res = await (await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'exportData', type: ty }), redirect: 'follow' })).json();
        if (res.success && res.csv && r) {
            const blob = new Blob(['\uFEFF' + res.csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rf_export_' + ty + '_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
            r.innerHTML = '<div class="message success" style="display:block;">✅ Файл ' + ty + '.csv скачан!</div>';
            setTimeout(function() { r.innerHTML = ''; }, 3000);
        } else if (r) r.innerHTML = '<div class="message error" style="display:block;">❌ ' + escapeHtml(res.message || 'Ошибка') + '</div>';
    } catch (e) { if (r) r.innerHTML = '<div class="message error" style="display:block;">❌ Ошибка</div>'; }
}

// ============================================================
// 🖼️ МОДАЛЬНОЕ ОКНО ИЗОБРАЖЕНИЙ
// ============================================================

function openImageModal(u) {
    const img = document.getElementById('modalImage');
    if (img) img.src = u;
    const m = document.getElementById('imageModal');
    if (m) m.classList.remove('hidden');
}

function closeImageModal() {
    const m = document.getElementById('imageModal');
    if (m) m.classList.add('hidden');
}
