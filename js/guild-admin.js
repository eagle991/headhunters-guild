// ============================================================
// 🏰 АДМИНКА ГИЛЬДИИ
// ============================================================

async function loadGuildAdmin() {
    if (!window._myGuild) {
        const content = document.getElementById('guildAdminContent');
        if (content) content.innerHTML = '<div class="info-hint warning">⚠️ Вы не состоите в гильдии</div>';
        return;
    }

    const nameEl = document.getElementById('guildAdminName');
    const roleEl = document.getElementById('guildAdminRole');

    if (nameEl) nameEl.innerText = window._myGuild.name || '—';
    if (roleEl) {
        roleEl.innerText = window._myGuild.role === 'leader' ? '👑 Лидер'
                         : window._myGuild.role === 'officer' ? '⭐ Офицер'
                         : '👤 Участник';
    }

    try {
        const res = await api('getGuildInfo', { guildId: window._myGuild.id });
        const countEl = document.getElementById('guildAdminMembersCount');
        if (res.success && countEl) {
            countEl.innerText = (res.members || []).length;
        }
    } catch (e) {
        console.error('loadGuildAdmin error:', e);
    }

    switchGuildAdminTab('members', null);
}

function switchGuildAdminTab(tab, event) {
    document.querySelectorAll('#guildAdminTabs .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    const contents = ['members', 'settings', 'dkp', 'invites'];
    for (const c of contents) {
        const el = document.getElementById('guildAdmin' + capitalize(c) + 'Content');
        if (el) {
            el.classList.toggle('hidden', c !== tab);
        }
    }

    if (tab === 'members') loadGuildAdminMembers();
    if (tab === 'settings') loadGuildAdminSettings();
    if (tab === 'dkp') loadGuildAdminDkp();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function loadGuildAdminMembers() {
    const list = document.getElementById('guildAdminMembersList');
    if (!list || !window._myGuild) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getGuildInfo', { guildId: window._myGuild.id });

        if (!res.success) {
            list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        const members = res.members || [];
        if (members.length === 0) {
            list.innerHTML = '<div class="empty-state">Нет участников</div>';
            return;
        }

        let html = '';
        for (const m of members) {
            const roleIcon = m.role === 'leader' ? '👑' : m.role === 'officer' ? '⭐' : '👤';
            const isLeader = window._myGuild.role === 'leader';

            html += '<div class="guild-member-card">';
            html += '<div class="guild-member-info">';
            html += '<span class="guild-member-role">' + roleIcon + '</span>';
            html += '<span class="guild-member-nick">' + escapeHtml(m.nickname) + '</span>';
            html += '</div>';

            if (isLeader && m.role !== 'leader') {
                html += '<div class="guild-member-actions">';
                if (m.role !== 'officer') {
                    html += '<button class="btn-edit" onclick="promoteMember(\'' + escapeForOnclick(m.nickname) + '\')">⭐</button>';
                }
                html += '<button class="btn-remove" onclick="kickMember(\'' + escapeForOnclick(m.nickname) + '\')">✕</button>';
                html += '</div>';
            }

            html += '</div>';
        }

        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = '<div class="empty-state">❌ Ошибка</div>';
    }
}

async function promoteMember(nickname) {
    if (!confirm('Повысить ' + nickname + ' до офицера?')) return;

    try {
        const res = await api('promoteGuildMember', {
            guildId: window._myGuild.id,
            nickname: nickname,
            requester: currentUser
        });

        if (res.success) {
            alert('✅ ' + (res.message || 'Повышен'));
            loadGuildAdminMembers();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function kickMember(nickname) {
    if (!confirm('Исключить ' + nickname + ' из гильдии?')) return;

    try {
        const res = await api('kickGuildMember', {
            guildId: window._myGuild.id,
            nickname: nickname,
            requester: currentUser
        });

        if (res.success) {
            alert('✅ ' + (res.message || 'Исключён'));
            loadGuildAdminMembers();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function loadGuildAdminSettings() {
    const panel = document.getElementById('guildAdminSettingsContent');
    if (!panel || !window._myGuild) return;

    panel.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getGuildSettings', { guildId: window._myGuild.id });
        const settings = res.settings || {};

        let html = '<div class="settings-form">';
        html += '<div class="form-group"><label>DKP за событие</label>';
        html += '<input type="number" id="guildSettingDkpPerEvent" value="' + (settings.dkp_per_event || 100) + '"></div>';

        html += '<div class="form-group"><label><input type="checkbox" id="guildSettingAllowNegative"' + (settings.allow_negative_balance ? ' checked' : '') + '> Разрешить отрицательный баланс</label></div>';

        html += '<div class="form-group"><label><input type="checkbox" id="guildSettingAuctionEnabled"' + (settings.guild_auction_enabled ? ' checked' : '') + '> Гильдейские аукционы</label></div>';

        html += '<div class="form-group"><label><input type="checkbox" id="guildSettingRequireScreenshots"' + (settings.require_screenshots ? ' checked' : '') + '> Требовать скриншоты</label></div>';

        html += '<button class="btn-primary" onclick="saveGuildAdminSettings()">💾 Сохранить</button>';
        html += '<div id="guildAdminSettingsMessage" class="message"></div>';
        html += '</div>';

        panel.innerHTML = html;
    } catch (e) {
        panel.innerHTML = '<div class="empty-state">❌ Ошибка</div>';
    }
}

async function saveGuildAdminSettings() {
    const msg = document.getElementById('guildAdminSettingsMessage');

    if (msg) {
        msg.className = 'message';
        msg.innerText = '⏳ Сохранение...';
        msg.style.display = 'block';
    }

    const settings = {
        dkp_per_event: Number(document.getElementById('guildSettingDkpPerEvent')?.value) || 100,
        allow_negative_balance: document.getElementById('guildSettingAllowNegative')?.checked || false,
        guild_auction_enabled: document.getElementById('guildSettingAuctionEnabled')?.checked || false,
        require_screenshots: document.getElementById('guildSettingRequireScreenshots')?.checked || false
    };

    try {
        const res = await api('saveGuildSettings', {
            guildId: window._myGuild.id,
            requester: currentUser,
            settings: settings
        });

        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ ' + (res.message || 'Сохранено');
            } else {
                msg.className = 'message error';
                msg.innerText = '❌ ' + (res.message || 'Ошибка');
            }
            setTimeout(() => { msg.style.display = 'none'; }, 2000);
        }
    } catch (e) {
        if (msg) {
            msg.className = 'message error';
            msg.innerText = '❌ Ошибка';
            msg.style.display = 'block';
        }
    }
}
