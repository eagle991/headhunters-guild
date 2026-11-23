// ============================================================
// 🏰 ГИЛЬДИИ
// ============================================================

async function loadMyGuild() {
    const block = document.getElementById('myGuildBlock');
    if (!block || !currentUser) return;

    try {
        const res = await api('getMyGuild', { playerName: currentUser });

        if (res.success && res.inGuild) {
            window._myGuild = {
                id: res.guildId,
                name: res.guildName,
                icon: res.guildIcon,
                role: res.role,
                emblemData: res.emblemData
            };

            const roleLabel = res.role === 'leader' ? '👑 Лидер' 
                            : res.role === 'officer' ? '⭐ Офицер' 
                            : '👤 Участник';

            const iconHtml = res.emblemData
                ? '<img src="' + res.emblemData + '" style="width:50px;height:50px;border-radius:var(--radius-sm);border:2px solid var(--accent);object-fit:cover;">'
                : '<div style="font-size:28px;width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:var(--bg-soft);border:2px solid var(--accent);border-radius:var(--radius-sm);">' + (res.guildIcon || '🏰') + '</div>';

            block.innerHTML = `
                <div class="guild-card" style="cursor:pointer;" onclick="showGuildInfo('${escapeForOnclick(res.guildId)}')">
                    <div class="guild-header">
                        ${iconHtml}
                        <div class="guild-info">
                            <div class="guild-name">${escapeHtml(res.guildName)}</div>
                            <div class="guild-role">${roleLabel}</div>
                        </div>
                    </div>
                </div>`;
        } else {
            window._myGuild = null;
            block.innerHTML = '<div class="empty-state">Вы не состоите в гильдии</div>';
        }
    } catch (e) {
        console.error('loadMyGuild error:', e);
        block.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function createGuild() {
    const name = document.getElementById('newGuildName')?.value?.trim();
    const icon = document.getElementById('newGuildIcon')?.value?.trim() || '🏰';
    const msg = document.getElementById('createGuildMessage');

    if (!name) {
        showGuildMessage(msg, 'Введите название гильдии', 'error');
        return;
    }

    try {
        showGuildMessage(msg, 'Создание...', '');
        const res = await api('createGuild', {
            name: name,
            icon: icon,
            leader: currentUser
        });

        if (res.success) {
            showGuildMessage(msg, res.message || 'Гильдия создана', 'success');
            document.getElementById('newGuildName').value = '';
            setTimeout(() => {
                loadMyGuild();
                loadGuilds();
            }, 1000);
        } else {
            showGuildMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showGuildMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function showGuildInfo(guildId) {
    const modal = document.getElementById('guildInfoModal');
    const content = document.getElementById('guildInfoContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:20px;">Загрузка...</div>';
    modal.classList.remove('hidden');

    try {
        const res = await api('getGuildInfo', { guildId: guildId });

        if (!res.success) {
            content.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        const g = res.guild;
        const members = res.members || [];

        let html = '<div class="guild-info-header">';
        html += '<div class="guild-info-name">' + escapeHtml(g.name) + '</div>';
        html += '<div class="guild-info-meta">👑 ' + escapeHtml(g.leader) + ' • 👥 ' + members.length + '</div>';
        html += '</div>';

        html += '<div class="guild-members-list">';
        for (const m of members) {
            const role = m.role === 'leader' ? '👑' : m.role === 'officer' ? '⭐' : '👤';
            html += '<div class="guild-member">' + role + ' ' + escapeHtml(m.nickname) + '</div>';
        }
        html += '</div>';

        content.innerHTML = html;
    } catch (e) {
        content.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function confirmDisbandGuild(guildId, guildName, membersCount, dkp) {
    if (!confirm('⚠️ РАСФОРМИРОВАТЬ ГИЛЬДИЮ "' + guildName + '"?\n\nЭто действие необратимо!\n\n• Участников: ' + membersCount + '\n• DKP из казны: ' + dkp + '\n\nПродолжить?')) return;

    try {
        const res = await api('disbandGuild', {
            guildId: guildId,
            adminName: currentUser
        });

        if (res.success) {
            alert('✅ ' + (res.message || 'Гильдия расформирована'));
            loadInactiveGuilds();
            loadGuilds();
            loadGuildsRating();
            loadMyGuild();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

function showGuildMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
