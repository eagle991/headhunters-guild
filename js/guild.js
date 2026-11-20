// ============================================================
// 🏰 ГИЛЬДИИ
// ============================================================

async function loadMyGuild() {
    const block = document.getElementById('myGuildBlock');
    if (!block) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getMyGuild', playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.inGuild) {
            window._myGuild = { id: res.guildId, name: res.guildName, icon: res.guildIcon, role: res.role, emblemData: res.emblemData };
            const roleLabel = res.role === 'leader' ? '👑 Лидер' : res.role === 'officer' ? '⭐ Офицер' : '👤 Участник';
            const iconHtml = res.emblemData
                ? '<img src="' + res.emblemData + '" style="width:50px;height:50px;border-radius:var(--radius-sm);border:2px solid var(--accent);object-fit:cover;">'
                : '<div style="font-size:28px;width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:var(--bg-soft);border:2px solid var(--accent);border-radius:var(--radius-sm);">' + res.guildIcon + '</div>';
            block.innerHTML = '<div class="guild-card" style="cursor:pointer;" onclick="showGuildInfo(\'' + escapeForOnclick(res.guildId) + '\')"><div class="guild-header">' + iconHtml + '<div class="guild-info"><div class="guild-name">' + escapeHtml(res.guildName) + '</div><div class="guild-leader">Ваша роль: <span class="guild-member-role ' + res.role + '" style="font-size:8px;padding:1px 4px;">' + roleLabel + '</span></div></div><button class="btn-edit" style="width:auto;margin-top:0;">👁 Открыть</button></div></div>';
            
            const headerIndicator = document.getElementById('headerGuildIndicator');
            const headerIcon = document.getElementById('headerGuildIcon');
            const headerName = document.getElementById('headerGuildName');
            if (headerIndicator) {
                headerIndicator.classList.remove('hidden');
                if (headerIcon) headerIcon.innerHTML = res.emblemData ? '<img src="' + res.emblemData + '" style="width:14px;height:14px;object-fit:cover;border-radius:2px;">' : (res.guildIcon || '🏰');
                if (headerName) headerName.innerText = res.guildName;
            }
            
            const quickActions = document.getElementById('guildQuickActions');
            if (quickActions) quickActions.style.display = (res.role === 'leader' || res.role === 'officer') ? 'block' : 'none';
            
            const tabGuildAdmin = document.getElementById('tabGuildAdmin');
            if (tabGuildAdmin) tabGuildAdmin.classList.toggle('hidden', !(res.role === 'leader' || res.role === 'officer'));
        } else {
            window._myGuild = null;
            block.innerHTML = '<div style="padding:10px;background:var(--bg-soft);border:1px dashed var(--border);border-radius:var(--radius-sm);text-align:center;"><div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">Вы не состоите в гильдии</div><button class="submit-btn" style="max-width:200px;margin:0 auto;" onclick="showCreateGuildModal()">🏰 Создать гильдию (бесплатно)</button></div>';
            const headerIndicator = document.getElementById('headerGuildIndicator');
            if (headerIndicator) headerIndicator.classList.add('hidden');
            const quickActions = document.getElementById('guildQuickActions');
            if (quickActions) quickActions.style.display = 'none';
            const tabGuildAdmin = document.getElementById('tabGuildAdmin');
            if (tabGuildAdmin) tabGuildAdmin.classList.add('hidden');
        }
    } catch (e) { console.error('loadMyGuild error:', e); block.innerHTML = '<div class="empty-state">Ошибка загрузки</div>'; }
}

async function loadGuilds() {
    const container = document.getElementById('guildsList');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuilds' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.guilds && res.guilds.length > 0) {
            let html = '';
            for (const guild of res.guilds) {
                const isMyGuild = window._myGuild && window._myGuild.id === guild.id;
                const iconHtml = guild.emblemData
                    ? '<img src="' + guild.emblemData + '" class="guild-emblem" alt="' + escapeHtml(guild.name) + '">'
                    : '<div class="guild-icon">' + guild.icon + '</div>';
                html += '<div class="guild-card" style="' + (isMyGuild ? 'border-color:var(--success);' : '') + '"><div class="guild-header">' + iconHtml + '<div class="guild-info"><div class="guild-name">' + escapeHtml(guild.name) + ' ' + (isMyGuild ? '<span style="color:var(--success);font-size:9px;">← Ваша</span>' : '') + '</div><div class="guild-leader">👑 Лидер: ' + escapeHtml(guild.leader) + '</div></div><button class="submit-btn" style="width:auto;padding:5px 10px;" onclick="showGuildInfo(\'' + escapeForOnclick(guild.id) + '\')">👁 Подробнее</button></div><div style="font-size:10px;color:var(--text-dim);margin-bottom:8px;font-style:italic;">' + escapeHtml(guild.description || 'Нет описания') + '</div><div class="guild-stats"><div class="guild-stat"><div class="guild-stat-label">Участников</div><div class="guild-stat-value">' + guild.membersCount + '/50</div></div><div class="guild-stat"><div class="guild-stat-label">Казна</div><div class="guild-stat-value" style="color:var(--dkp);">' + guild.dkp + '</div></div><div class="guild-stat"><div class="guild-stat-label">Рейтинг</div><div class="guild-stat-value">' + guild.totalRating.toLocaleString('ru-RU') + '</div></div><div class="guild-stat"><div class="guild-stat-label">Создана</div><div class="guild-stat-value" style="font-size:9px;">' + guild.createdAt + '</div></div></div></div>';
            }
            container.innerHTML = html;
        } else container.innerHTML = '<div class="empty-state">Нет гильдий. Создайте первую!</div>';
    } catch (e) { container.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

async function loadGuildsRating() {
    const container = document.getElementById('guildsRatingList');
    if (!container) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildsRating' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.guilds && res.guilds.length > 0) {
            const maxRating = res.guilds[0].totalRating || 1;
            let html = '';
            for (let i = 0; i < res.guilds.length; i++) {
                const g = res.guilds[i];
                const rk = i + 1;
                const rc = rk <= 3 ? 'top-' + rk : '';
                const percent = maxRating > 0 ? Math.round((g.totalRating / maxRating) * 100) : 0;
                const iconHtml = g.emblemData
                    ? '<img src="' + g.emblemData + '" style="width:32px;height:32px;border-radius:3px;border:1px solid var(--accent);object-fit:cover;">'
                    : '<div style="font-size:20px;">' + g.icon + '</div>';
                html += '<div class="popular-item" style="cursor:pointer;" onclick="showGuildInfo(\'' + escapeForOnclick(g.id) + '\')"><div class="popular-item-rank ' + rc + '">#' + rk + '</div>' + iconHtml + '<div style="flex:1;min-width:0;"><div class="popular-item-name">' + escapeHtml(g.name) + '</div><div style="font-size:9px;color:var(--text-dim);">👑 ' + escapeHtml(g.leader) + ' | 👥 ' + g.membersCount + '</div><div class="guild-rating-bar"><div class="guild-rating-fill" style="width:' + percent + '%;"></div></div></div><div class="popular-item-count">' + g.totalRating.toLocaleString('ru-RU') + '</div></div>';
            }
            container.innerHTML = html;
        } else container.innerHTML = '<div class="empty-state">Нет гильдий</div>';
    } catch (e) { container.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function showCreateGuildModal() {
    const m = document.getElementById('createGuildMessage');
    if (m) m.style.display = 'none';
    document.getElementById('newGuildName').value = '';
    document.getElementById('newGuildDescription').value = '';
    document.getElementById('newGuildIcon').value = '🏰';
    guildEmblemBase64 = null;
    document.getElementById('guildEmblemData').value = '';
    document.getElementById('createGuildModal').classList.remove('hidden');
}

function closeCreateGuildModal() { document.getElementById('createGuildModal').classList.add('hidden'); }

async function createGuild_v17_12() {
    const name = document.getElementById('newGuildName').value.trim();
    const description = document.getElementById('newGuildDescription').value.trim();
    const icon = document.getElementById('newGuildIcon').value;
    const emblemData = document.getElementById('guildEmblemData').value;
    const msg = document.getElementById('createGuildMessage');
    if (!name) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Введите название'; msg.style.display = 'block'; } return; }
    if (!confirm('Создать гильдию "' + name + '"?\n\n✅ Создание БЕСПЛАТНО\nВы станете лидером гильдии.')) return;
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Создание...'; msg.style.display = 'block'; }
    try {
        const payload = { action: 'createGuild', guildName: name, leader: currentUser, description: description, icon: icon || '🏰', cost: 0 };
        if (emblemData) payload.emblemData = emblemData;
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ ' + res.message;
                setTimeout(function() { closeCreateGuildModal(); guildEmblemBase64 = null; loadMyGuild(); loadGuilds(); loadGuildsRating(); loadMyDkp(); }, 1500);
            } else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

async function showGuildInfo(guildId) {
    const modal = document.getElementById('guildInfoModal');
    const content = document.getElementById('guildInfoContent');
    modal.classList.remove('hidden');
    content.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildInfo', guildId: guildId }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { content.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        const guild = res.guild;
        const members = res.members;
        const isMyGuild = window._myGuild && window._myGuild.id === guildId;
        const myRole = isMyGuild ? window._myGuild.role : null;
        const isLeader = myRole === 'leader';
        const isOfficer = myRole === 'officer';
        const canManage = isLeader || currentRole === 'Админ';
        const canInvite = isLeader || isOfficer;
        const officersCount = members.filter(m => m.role === 'officer').length;
        const iconHtml = guild.emblemData
            ? '<img src="' + guild.emblemData + '" class="guild-emblem large" alt="' + escapeHtml(guild.name) + '">'
            : '<div class="guild-icon" style="font-size:40px;width:70px;height:70px;">' + guild.icon + '</div>';
        let html = '<div class="guild-header" style="margin-bottom:16px;">' + iconHtml;
        html += '<div class="guild-info"><div class="guild-name" style="font-size:18px;">' + escapeHtml(guild.name) + '</div>';
        html += '<div class="guild-leader" style="font-size:11px;">👑 Лидер: ' + escapeHtml(guild.leader) + '</div>';
        html += '<div style="font-size:10px;color:var(--text-dim);margin-top:2px;">Создана: ' + guild.createdAt + '</div></div></div>';
        html += '<div style="background:var(--bg-soft);padding:10px;border-radius:var(--radius-sm);margin-bottom:12px;border:1px solid var(--border);"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;font-weight:700;">📜 ОПИСАНИЕ:</div><div style="font-size:12px;line-height:1.4;">' + escapeHtml(guild.description || 'Нет описания') + '</div></div>';
        html += '<div class="guild-stats" style="margin-bottom:12px;"><div class="guild-stat"><div class="guild-stat-label">Рейтинг</div><div class="guild-stat-value">' + res.totalRating.toLocaleString('ru-RU') + '</div></div><div class="guild-stat"><div class="guild-stat-label">Казна</div><div class="guild-stat-value" style="color:var(--dkp);">' + guild.dkp + ' DKP</div></div><div class="guild-stat"><div class="guild-stat-label">Участников</div><div class="guild-stat-value">' + members.length + '/50</div></div><div class="guild-stat"><div class="guild-stat-label">Офицеров</div><div class="guild-stat-value">' + officersCount + '/4</div></div></div>';
        if (isMyGuild && canManage) {
            html += '<div class="guild-management-section"><div class="guild-management-title">⚙️ Управление</div><div class="guild-action-buttons">';
            html += '<button class="guild-action-btn" onclick="showEditGuildModal(\'' + escapeForOnclick(guildId) + '\', \'' + escapeForOnclick(guild.name) + '\', \'' + escapeForOnclick(guild.description) + '\', \'' + escapeForOnclick(guild.icon) + '\')">✏️ Редактировать</button>';
            html += '<button class="guild-action-btn" onclick="showTransferLeadershipModal(\'' + escapeForOnclick(guildId) + '\')">👑 Передать лидерство</button>';
            html += '<button class="guild-action-btn" onclick="showInviteToGuildModal(\'' + escapeForOnclick(guildId) + '\')">📨 Пригласить</button>';
            html += '</div></div>';
        } else if (isMyGuild && canInvite) {
            html += '<div class="guild-management-section"><div class="guild-management-title">⚙️ Действия офицера</div><div class="guild-action-buttons"><button class="guild-action-btn" onclick="showInviteToGuildModal(\'' + escapeForOnclick(guildId) + '\')">📨 Пригласить</button></div></div>';
        }
        html += '<div class="panel-title" style="font-size:11px;">👥 Участники (' + members.length + ')</div>';
        html += '<div style="max-height:300px;overflow-y:auto;">';
        for (const m of members) {
            const roleLabel = m.role === 'leader' ? '👑 Лидер' : m.role === 'officer' ? '⭐ Офицер' : '👤 Участник';
            const roleClass = m.role;
            html += '<div class="guild-member-item"><span class="guild-member-role ' + roleClass + '">' + roleLabel + '</span><span style="flex:1;font-weight:600;font-family:var(--font-display);font-size:11px;cursor:pointer;" onclick="viewPlayerCabinet(\'' + escapeForOnclick(m.name) + '\')">' + escapeHtml(m.name) + '</span><span style="font-size:10px;color:var(--text-dim);">Ур. ' + m.level + '</span><span style="font-size:10px;color:var(--accent);font-weight:700;">' + m.bm.toLocaleString('ru-RU') + ' БМ</span>';
            if (isMyGuild && m.name !== currentUser) {
                html += '<div class="member-actions">';
                if (isLeader) {
                    if (m.role === 'member' && officersCount < 4) html += '<button class="member-action-btn" onclick="promoteToOfficer(\'' + escapeForOnclick(guildId) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Назначить офицером">⭐</button>';
                    if (m.role === 'officer') html += '<button class="member-action-btn danger" onclick="demoteFromOfficer(\'' + escapeForOnclick(guildId) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Снять офицера">📉</button>';
                    html += '<button class="member-action-btn" onclick="transferLeadership(\'' + escapeForOnclick(guildId) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Передать лидерство">👑</button>';
                }
                if ((isLeader || (isOfficer && m.role === 'member')) && m.role !== 'leader') html += '<button class="member-action-btn danger" onclick="kickFromGuild(\'' + escapeForOnclick(guildId) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Исключить">🚫</button>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        html += '<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;">';
        if (!isMyGuild && !window._myGuild) {
            html += '<button class="submit-btn" style="flex:1;" onclick="joinGuild(\'' + escapeForOnclick(guildId) + '\')">🚪 Вступить</button>';
        } else if (isMyGuild) {
            if (myRole !== 'leader') html += '<button class="submit-btn" style="flex:1;background:var(--danger);border-color:var(--danger);" onclick="leaveGuild(\'' + escapeForOnclick(guildId) + '\')">🚪 Выйти</button>';
            html += '<button class="submit-btn" style="flex:1;" onclick="showDonateModal(\'' + escapeForOnclick(guildId) + '\')">💰 Пополнить казну</button>';
            html += '<button class="btn-edit" style="flex:1;margin-top:0;" onclick="showGuildTransactions(\'' + escapeForOnclick(guildId) + '\')">📜 История</button>';
            if (canManage) html += '<button class="btn-edit" style="flex:1;margin-top:0;" onclick="showChangeEmblemModal(\'' + escapeForOnclick(guildId) + '\')">🖼️ Эмблема</button>';
        }
        html += '</div>';
        content.innerHTML = html;
    } catch (e) { content.innerHTML = '<div class="empty-state">❌ Ошибка: ' + escapeHtml(e.message) + '</div>'; }
}

function closeGuildInfoModal() { document.getElementById('guildInfoModal').classList.add('hidden'); }

async function joinGuild(guildId) {
    if (!confirm('Вступить в гильдию?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'joinGuild', guildId: guildId, playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); closeGuildInfoModal(); loadMyGuild(); loadGuilds(); loadGuildsRating(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function leaveGuild(guildId) {
    if (!confirm('Выйти из гильдии?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'leaveGuild', playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); closeGuildInfoModal(); window._myGuild = null; loadMyGuild(); loadGuilds(); loadGuildsRating(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

function showDonateModal(guildId) {
    const amount = prompt('Введите сумму DKP для пожертвования:');
    if (!amount) return;
    const n = parseInt(amount);
    if (isNaN(n) || n <= 0) { alert('Неверная сумма'); return; }
    donateToGuild(guildId, n);
}

async function donateToGuild(guildId, amount) {
    if (!confirm('Пожертвовать ' + amount + ' DKP в казну?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'donateToGuild', guildId: guildId, playerName: currentUser, amount: amount }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); showGuildInfo(guildId); loadMyDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function showGuildTransactions(guildId) {
    const modal = document.getElementById('guildInfoModal');
    const content = document.getElementById('guildInfoContent');
    modal.classList.remove('hidden');
    content.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildTransactions', guildId: guildId }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { content.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        let html = '<h3 style="color:var(--accent);font-family:var(--font-display);margin-bottom:12px;font-size:14px;">📜 История транзакций</h3><button class="btn-back" onclick="showGuildInfo(\'' + escapeForOnclick(guildId) + '\')" style="margin-bottom:8px;">← Назад</button>';
        if (res.transactions && res.transactions.length > 0) {
            html += '<div class="guild-transactions-list">';
            for (const t of res.transactions) {
                const isDonation = t.type === 'donation';
                html += '<div class="guild-transaction-item ' + (isDonation ? 'donation' : 'withdrawal') + '"><div style="flex:1;"><div style="font-weight:700;font-size:11px;">' + escapeHtml(t.playerName) + '</div><div style="font-size:9px;color:var(--text-dim);">' + escapeHtml(t.reason) + ' • ' + t.date + '</div></div><div class="guild-transaction-amount ' + (isDonation ? 'positive' : 'negative') + '">' + (isDonation ? '+' : '-') + t.amount + ' DKP</div></div>';
            }
            html += '</div>';
        } else html += '<div class="empty-state">История пуста</div>';
        content.innerHTML = html;
    } catch (e) { content.innerHTML = '<div class="empty-state">❌ Ошибка: ' + escapeHtml(e.message) + '</div>'; }
}

async function transferLeadership(guildId, newLeader) {
    if (!confirm('Передать лидерство "' + newLeader + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'transferGuildLeadership', guildId: guildId, currentLeader: currentUser, newLeader: newLeader }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); window._myGuild.role = 'member'; showGuildInfo(guildId); loadMyGuild(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

function showTransferLeadershipModal(guildId) {
    const newLeader = prompt('Введите ник нового лидера:');
    if (!newLeader) return;
    transferLeadership(guildId, newLeader.trim());
}

async function promoteToOfficer(guildId, targetPlayer) {
    if (!confirm('Назначить "' + targetPlayer + '" офицером?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'promoteToOfficer', guildId: guildId, requester: currentUser, targetPlayer: targetPlayer }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); showGuildInfo(guildId); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function demoteFromOfficer(guildId, targetPlayer) {
    if (!confirm('Снять "' + targetPlayer + '" с офицера?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'demoteFromOfficer', guildId: guildId, requester: currentUser, targetPlayer: targetPlayer }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); showGuildInfo(guildId); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function kickFromGuild(guildId, targetPlayer) {
    if (!confirm('Исключить "' + targetPlayer + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'kickFromGuild', guildId: guildId, requester: currentUser, targetPlayer: targetPlayer }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); showGuildInfo(guildId); loadMyGuild(); loadGuilds(); loadGuildsRating(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

function showEditGuildModal(guildId, currentName, currentDescription, currentIcon) {
    document.getElementById('editGuildId').value = guildId;
    document.getElementById('editGuildName').value = currentName || '';
    document.getElementById('editGuildDescription').value = currentDescription || '';
    document.getElementById('editGuildIcon').value = currentIcon || '🏰';
    const msg = document.getElementById('editGuildMessage');
    if (msg) { msg.style.display = 'none'; msg.className = 'message'; }
    document.getElementById('editGuildModal').classList.remove('hidden');
}

function closeEditGuildModal() { document.getElementById('editGuildModal').classList.add('hidden'); }

async function saveGuildEdit() {
    const guildId = document.getElementById('editGuildId').value;
    const newName = document.getElementById('editGuildName').value.trim();
    const newDescription = document.getElementById('editGuildDescription').value.trim();
    const newIcon = document.getElementById('editGuildIcon').value;
    const msg = document.getElementById('editGuildMessage');
    if (!newName || newName.length < 3) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Название: минимум 3 символа'; msg.style.display = 'block'; } return; }
    if (!confirm('Сохранить изменения?')) return;
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Сохранение...'; msg.style.display = 'block'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateGuild', guildId: guildId, requester: currentUser, newName: newName, newDescription: newDescription, newIcon: newIcon }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; setTimeout(function() { closeEditGuildModal(); showGuildInfo(guildId); loadGuilds(); loadGuildsRating(); loadAllGuildsForBadges(); loadPublicTops(); }, 1200); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

async function deleteCurrentGuild() {
    const guildId = document.getElementById('editGuildId').value;
    if (!confirm('⚠️ УДАЛИТЬ ГИЛЬДИЮ НАВСЕГДА?\n\nЭто действие необратимо!')) return;
    const confirmText = prompt('Для подтверждения введите "УДАЛИТЬ" заглавными буквами:');
    if (confirmText !== 'УДАЛИТЬ') { alert('❌ Удаление отменено'); return; }
    const msg = document.getElementById('editGuildMessage');
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Удаление...'; msg.style.display = 'block'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteGuild', guildId: guildId, requester: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            closeEditGuildModal();
            closeGuildInfoModal();
            window._myGuild = null;
            alert('✅ ' + res.message);
            loadMyGuild(); loadGuilds(); loadGuildsRating(); loadAllGuildsForBadges(); loadPublicTops(); loadMyDkp();
        } else if (msg) { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; msg.style.display = 'block'; }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

function showInviteToGuildModal(guildId) {
    document.getElementById('inviteGuildId').value = guildId;
    document.getElementById('invitePlayerName').value = '';
    const msg = document.getElementById('inviteToGuildMessage');
    if (msg) msg.style.display = 'none';
    document.getElementById('inviteToGuildModal').classList.remove('hidden');
    loadPlayersForInvite();
}

function closeInviteToGuildModal() { document.getElementById('inviteToGuildModal').classList.add('hidden'); }

async function loadPlayersForInvite() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const datalist = document.getElementById('guildInvitePlayersList');
        if (res.success && datalist) {
            let html = '';
            for (const nick of res.nicks) if (nick !== currentUser) html += '<option value="' + escapeHtml(nick) + '">';
            datalist.innerHTML = html;
        }
    } catch (e) {}
}

async function sendGuildInvitation() {
    const guildId = document.getElementById('inviteGuildId').value;
    const invitee = document.getElementById('invitePlayerName').value.trim();
    const msg = document.getElementById('inviteToGuildMessage');
    if (!invitee) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Введите ник'; msg.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'inviteToGuild', guildId: guildId, inviter: currentUser, invitee: invitee }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; setTimeout(closeInviteToGuildModal, 1500); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

function showMyInvitationsModal() {
    document.getElementById('myInvitationsModal').classList.remove('hidden');
    loadMyInvitations();
}

function closeMyInvitationsModal() { document.getElementById('myInvitationsModal').classList.add('hidden'); }

async function loadMyInvitations() {
    const list = document.getElementById('myInvitationsList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getMyInvitations', playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { list.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        if (res.invitations.length === 0) { list.innerHTML = '<div class="empty-state">📭 У вас нет активных приглашений</div>'; return; }
        let html = '';
        for (const inv of res.invitations) {
            html += '<div class="invitation-card"><div class="invitation-header"><div class="invitation-guild-icon">' + inv.guildIcon + '</div><div class="invitation-info"><div class="invitation-guild-name">' + escapeHtml(inv.guildName) + '</div><div class="invitation-meta">📨 От: ' + escapeHtml(inv.inviter) + ' • 👑 Лидер: ' + escapeHtml(inv.guildLeader) + '</div></div></div>';
            if (inv.guildDescription) html += '<div class="invitation-description">"' + escapeHtml(inv.guildDescription) + '"</div>';
            html += '<div class="invitation-timer">⏰ Действует до: ' + inv.expiresAt + '</div>';
            html += '<div class="invitation-actions" style="margin-top:8px;"><button class="submit-btn" style="flex:1;background:var(--success);border-color:var(--success);" onclick="acceptInvitation(\'' + escapeForOnclick(inv.id) + '\')">✅ Принять</button><button class="submit-btn" style="flex:1;background:var(--danger);border-color:var(--danger);" onclick="rejectInvitation(\'' + escapeForOnclick(inv.id) + '\')">❌ Отклонить</button></div></div>';
        }
        list.innerHTML = html;
    } catch (e) { list.innerHTML = '<div class="empty-state">❌ Ошибка: ' + escapeHtml(e.message) + '</div>'; }
}

async function acceptInvitation(invitationId) {
    if (!confirm('Принять приглашение?\n\n⚠️ Если вы уже в гильдии — выйдете из неё.')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'acceptInvitation', invitationId: invitationId, playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); closeMyInvitationsModal(); window._myGuild = null; loadMyGuild(); loadGuilds(); loadGuildsRating(); loadAllGuildsForBadges(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function rejectInvitation(invitationId) {
    if (!confirm('Отклонить приглашение?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectInvitation', invitationId: invitationId, playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ Приглашение отклонено'); loadMyInvitations(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function cancelInvitation(invitationId, guildId) {
    if (!confirm('Отменить приглашение?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'cancelInvitation', invitationId: invitationId, requester: currentUser, guildId: guildId }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadGuildPendingInvitations(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function loadGuildPendingInvitations() {
    const list = document.getElementById('guildAdminInvitesList');
    if (!list || !window._myGuild) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPendingGuildInvitations', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { list.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        let html = '';
        for (const inv of res.invitations) {
            html += '<div class="pending-invitation-item"><div class="nick">' + escapeHtml(inv.invitee) + '</div><div class="inviter">от ' + escapeHtml(inv.inviter) + ' • ' + inv.createdAt + '</div><button class="member-action-btn danger" onclick="cancelInvitation(\'' + escapeForOnclick(inv.id) + '\', \'' + escapeForOnclick(window._myGuild.id) + '\')" title="Отменить">✕</button></div>';
        }
        list.innerHTML = html || '<div class="empty-state">Нет ожидающих приглашений</div>';
    } catch (e) { list.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function handleGuildEmblemSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Выберите изображение'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Файл > 2 МБ'); return; }
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const compressed = await compressEmblemImage(e.target.result, 64, 0.9);
            guildEmblemBase64 = compressed;
            document.getElementById('guildEmblemData').value = compressed;
            const area = document.getElementById('emblemUploadArea');
            const container = document.getElementById('emblemPreviewContainer');
            area.classList.add('has-image');
            container.innerHTML = '<img src="' + compressed + '" class="emblem-preview" alt="Emblem"><button type="button" class="emblem-remove-btn" onclick="event.stopPropagation(); removeGuildEmblem()">✕</button><div class="emblem-hint">✅ Эмблема загружена (64×64)</div>';
        } catch (err) { alert('Ошибка: ' + err.message); }
    };
    reader.readAsDataURL(file);
}

function removeGuildEmblem() {
    guildEmblemBase64 = null;
    document.getElementById('guildEmblemData').value = '';
    const area = document.getElementById('emblemUploadArea');
    const container = document.getElementById('emblemPreviewContainer');
    const input = document.getElementById('guildEmblemInput');
    area.classList.remove('has-image');
    container.innerHTML = '<div style="font-size:32px;margin-bottom:4px;">🖼️</div><div style="color:var(--text-main);font-size:11px;font-weight:600;">Нажмите или перетащите</div><div class="emblem-hint">PNG, JPG • Макс. 500 КБ • 64×64 px</div>';
    if (input) input.value = '';
}

function compressEmblemImage(base64, size, quality) {
    return new Promise(function(resolve, reject) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, size, size);
            const result = canvas.toDataURL('image/jpeg', quality);
            const sizeKB = Math.round((result.length * 3) / 4 / 1024);
            if (sizeKB > 500) resolve(canvas.toDataURL('image/jpeg', 0.6));
            else resolve(result);
        };
        img.onerror = function() { reject(new Error('Ошибка загрузки')); };
        img.src = base64;
    });
}

function showChangeEmblemModal(guildId) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Файл > 2 МБ'); return; }
        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const compressed = await compressEmblemImage(ev.target.result, 64, 0.9);
                if (!confirm('Загрузить новую эмблему?')) return;
                const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'uploadGuildEmblem', guildId: guildId, emblemData: compressed, role: currentRole, playerName: currentUser }), redirect: 'follow' });
                const res = await r.json();
                if (res.success) { alert('✅ ' + res.message); showGuildInfo(guildId); loadGuilds(); loadGuildsRating(); loadAllGuildsForBadges(); }
                else alert('❌ ' + res.message);
            } catch (err) { alert('❌ Ошибка: ' + err.message); }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

async function loadAllGuildsForBadges() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuilds' }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success || !res.guilds) return;
        window._playerGuilds = {};
        for (const guild of res.guilds) {
            try {
                const infoR = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildInfo', guildId: guild.id }), redirect: 'follow' });
                const infoRes = await infoR.json();
                if (infoRes.success && infoRes.members) {
                    for (const m of infoRes.members) {
                        window._playerGuilds[m.name] = { guildId: guild.id, guildName: guild.name, guildIcon: guild.icon, emblemData: guild.emblemData || null };
                    }
                }
            } catch (e) {}
        }
    } catch (e) { console.error('loadAllGuildsForBadges error:', e); }
}

setTimeout(loadAllGuildsForBadges, 2000);

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

async function loadInactiveGuilds() {
    const panel = document.getElementById('inactiveGuildsPanel');
    if (!panel) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getInactiveGuilds' }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success || !res.inactiveGuilds || res.inactiveGuilds.length === 0) {
            panel.style.display = 'none';
            panel.innerHTML = '';
            return;
        }
        panel.style.display = 'block';
        let html = '<div class="inactive-guilds-panel"><div class="inactive-guilds-title">⚠️ НЕАКТИВНЫЕ ГИЛЬДИИ (' + res.inactiveGuilds.length + ')</div>';
        html += '<div class="inactive-guilds-description">Гильдии, ни один участник которых не заходил более <b>' + res.threshold + ' дней</b>.</div>';
        for (const g of res.inactiveGuilds) {
            const daysText = g.daysSinceLastActivity === -1 ? 'никогда' : g.daysSinceLastActivity + ' дн. назад';
            const criticalClass = g.daysSinceLastActivity > 60 ? 'critical' : '';
            html += '<div class="inactive-guild-item"><div class="inactive-guild-icon">' + (g.icon || '🏰') + '</div><div class="inactive-guild-info"><div class="inactive-guild-name">' + escapeHtml(g.name) + ' <span class="inactive-badge ' + criticalClass + '">Неактивна</span></div><div class="inactive-guild-meta"><span>👑 ' + escapeHtml(g.leader) + '</span><span>👥 ' + g.membersCount + '</span><span>💰 ' + g.dkp + ' DKP</span><span>📅 ' + daysText + '</span></div></div><div style="display:flex;flex-direction:column;gap:4px;"><button class="btn-remove" style="padding:3px 6px;" onclick="confirmDisbandGuild(\'' + escapeForOnclick(g.id) + '\', \'' + escapeForOnclick(g.name) + '\', ' + g.membersCount + ', ' + g.dkp + ')">🗑 Расформировать</button></div></div>';
        }
        html += '</div>';
        panel.innerHTML = html;
    } catch (e) { panel.style.display = 'none'; }
}

async function confirmDisbandGuild(guildId, guildName, membersCount, dkp) {
    if (!confirm('⚠️ РАСФОРМИРОВАТЬ ГИЛЬДИЮ "' + guildName + '"?\n\nЭто действие необратимо!\n\n• Участников: ' + membersCount + '\n• DKP из казны: ' + dkp + '\n\nПродолжить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'disbandGuild', guildId: guildId, adminName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            alert('✅ ' + res.message);
            loadInactiveGuilds(); loadGuilds(); loadGuildsRating(); loadMyGuild();
        } else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}
