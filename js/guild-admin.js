// ============================================================
// 🏰 АДМИНКА ГИЛЬДИИ
// ============================================================

async function loadGuildAdmin() {
    if (!window._myGuild) {
        document.getElementById('guildAdminContent').innerHTML = '<div class="info-hint warning">⚠️ Вы не состоите в гильдии</div>';
        return;
    }
    document.getElementById('guildAdminName').innerText = window._myGuild.name;
    document.getElementById('guildAdminRole').innerText = window._myGuild.role === 'leader' ? '👑 Лидер' : (window._myGuild.role === 'officer' ? '⭐ Офицер' : '👤 Участник');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildInfo', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) document.getElementById('guildAdminMembersCount').innerText = res.members.length;
    } catch (e) {}
    switchGuildAdminTab('members', null);
}

async function loadGuildAdminMembers() {
    const list = document.getElementById('guildAdminMembersList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildInfo', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { list.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        const members = res.members;
        const myRole = window._myGuild.role;
        const isLeader = myRole === 'leader';
        const isOfficer = myRole === 'officer';
        const officersCount = members.filter(m => m.role === 'officer').length;
        let html = '';
        for (const m of members) {
            const roleLabel = m.role === 'leader' ? '👑 Лидер' : m.role === 'officer' ? '⭐ Офицер' : '👤 Участник';
            const roleClass = m.role;
            html += '<div class="guild-member-item"><span class="guild-member-role ' + roleClass + '">' + roleLabel + '</span><span style="flex:1;font-weight:600;font-family:var(--font-display);font-size:11px;cursor:pointer;color:var(--text-main);" onclick="viewPlayerCabinet(\'' + escapeForOnclick(m.name) + '\')">' + escapeHtml(m.name) + '</span><span style="font-size:10px;color:var(--text-dim);">Ур. ' + m.level + '</span><span style="font-size:10px;color:var(--accent);font-weight:700;">' + m.bm.toLocaleString('ru-RU') + ' БМ</span>';
            if (m.name !== currentUser) {
                html += '<div class="member-actions">';
                if (isLeader) {
                    if (m.role === 'member' && officersCount < 4) html += '<button class="member-action-btn" onclick="promoteToOfficer(\'' + escapeForOnclick(window._myGuild.id) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Назначить офицером">⭐</button>';
                    if (m.role === 'officer') html += '<button class="member-action-btn danger" onclick="demoteFromOfficer(\'' + escapeForOnclick(window._myGuild.id) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Снять офицера">📉</button>';
                    html += '<button class="member-action-btn" onclick="transferLeadership(\'' + escapeForOnclick(window._myGuild.id) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Передать лидерство">👑</button>';
                }
                if ((isLeader || (isOfficer && m.role === 'member')) && m.role !== 'leader') html += '<button class="member-action-btn danger" onclick="kickFromGuild(\'' + escapeForOnclick(window._myGuild.id) + '\', \'' + escapeForOnclick(m.name) + '\')" title="Исключить">🚫</button>';
                html += '</div>';
            }
            html += '</div>';
        }
        list.innerHTML = html || '<div class="empty-state">Нет участников</div>';
    } catch (e) { list.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

async function loadGuildAdminSettings() {
    const panel = document.getElementById('guildAdminSettingsPanel');
    if (!panel) return;
    panel.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getGuildSettings', guildId: window._myGuild.id }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { panel.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>'; return; }
        const s = res.settings;
        let html = '<div class="guild-settings-grid">';
        html += '<div class="guild-setting-item"><div class="guild-setting-label">💰 DKP за мероприятие</div><div class="guild-setting-value"><input type="number" id="guildSettingDkpPerEvent" value="' + s.dkp_per_event + '" min="0"></div></div>';
        html += '<div class="guild-setting-item"><div class="guild-setting-label">📉 Отрицательный баланс</div><div class="guild-setting-value"><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="guildSettingAllowNegative"' + (s.allow_negative_balance ? ' checked' : '') + '><span style="font-size:11px;">Разрешить</span></label></div></div>';
        html += '<div class="guild-setting-item"><div class="guild-setting-label">🔨 Аукционы гильдии</div><div class="guild-setting-value"><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="guildSettingAuctionEnabled"' + (s.guild_auction_enabled ? ' checked' : '') + '><span style="font-size:11px;">Включить</span></label></div></div>';
        html += '<div class="guild-setting-item"><div class="guild-setting-label">📸 Требовать скриншоты</div><div class="guild-setting-value"><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="guildSettingRequireScreenshots"' + (s.require_screenshots ? ' checked' : '') + '><span style="font-size:11px;">Требовать</span></label></div></div>';
        html += '</div>';
        html += '<button class="submit-btn" style="margin-top:12px;" onclick="saveGuildAdminSettings()">💾 Сохранить</button>';
        html += '<div id="guildAdminSettingsMessage" class="message"></div>';
        panel.innerHTML = html;
    } catch (e) { panel.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

async function saveGuildAdminSettings() {
    const msg = document.getElementById('guildAdminSettingsMessage');
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Сохранение...'; msg.style.display = 'block'; }
    const settings = {
        dkp_per_event: Number(document.getElementById('guildSettingDkpPerEvent').value) || 100,
        allow_negative_balance: document.getElementById('guildSettingAllowNegative').checked,
        guild_auction_enabled: document.getElementById('guildSettingAuctionEnabled').checked,
        require_screenshots: document.getElementById('guildSettingRequireScreenshots').checked
    };
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveGuildSettings', guildId: window._myGuild.id, requester: currentUser, settings: settings }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
            setTimeout(() => { msg.style.display = 'none'; }, 2000);
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}
