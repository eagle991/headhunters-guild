// ============================================================
// 🎯 НАВЫКИ ИГРОКА
// ============================================================

async function loadPlayerSkills() {
    if (!currentUser) return;

    try {
        const [skillsRes, playerSkillsRes] = await Promise.all([
            api('getSkills'),
            api('getPlayerSkills', { nickname: currentUser })
        ]);

        if (skillsRes.success) allSkills = skillsRes.skills || [];

        const form = document.getElementById('skillsForm');
        const approvedMsg = document.getElementById('skillsApprovedMessage');
        const status = document.getElementById('skillsStatus');
        const approvedList = document.getElementById('approvedSkillsList');
        const empty = document.getElementById('skillsEmpty');

        if (!playerSkillsRes.success) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        myPlayerSkills = playerSkillsRes.data;
        AppState.myPlayerSkills = playerSkillsRes.data;

        if (playerSkillsRes.data.status === 'approved') {
            if (status) status.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
            if (form) form.classList.add('hidden');
            if (approvedMsg) approvedMsg.classList.remove('hidden');
            renderApprovedSkills(playerSkillsRes.data.skills || []);
        } else {
            if (status) status.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
            if (form) form.classList.remove('hidden');
            if (approvedMsg) approvedMsg.classList.add('hidden');
            renderSkillsSelection(playerSkillsRes.data.skills || []);
        }

        if (empty) empty.classList.add('hidden');

    } catch (e) {
        console.error('loadPlayerSkills error:', e);
    }
}

function renderApprovedSkills(skills) {
    const container = document.getElementById('approvedSkillsList');
    if (!container) return;

    if (!skills || skills.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет навыков</div>';
        return;
    }

    const colorMap = {
        'Белый': '#94a3b8',
        'Зеленый': 'var(--success)',
        'Синий': 'var(--accent)',
        'Фиолетовый': '#6b4aa8',
        'Желтый': 'var(--gold)',
        'Красный': 'var(--danger)'
    };

    let html = '';
    for (const skillName of skills) {
        const skillObj = allSkills.find(s => s.name === skillName);
        const color = skillObj?.color || 'Белый';
        const borderColor = colorMap[color] || 'var(--border)';

        html += '<div class="approved-skill-badge" style="border-color:' + borderColor + ';">';
        html += '✓ ' + escapeHtml(skillName);
        html += '<span class="skill-color-badge skill-color-' + color + '">' + color + '</span>';
        html += '</div>';
    }

    container.innerHTML = html;
}

function renderSkillsSelection(selectedSkills) {
    const container = document.getElementById('skillsSelectionList');
    if (!container) return;

    let html = '';
    for (const skill of allSkills) {
        const isSelected = selectedSkills.includes(skill.name);
        html += '<label class="skill-checkbox' + (isSelected ? ' selected' : '') + '">';
        html += '<input type="checkbox" value="' + escapeHtml(skill.name) + '"' + (isSelected ? ' checked' : '') + '>';
        html += '<span>' + escapeHtml(skill.name) + '</span>';
        html += '<span class="skill-color-badge skill-color-' + (skill.color || 'Белый') + '">' + (skill.color || 'Белый') + '</span>';
        html += '</label>';
    }

    container.innerHTML = html || '<div class="empty-state">Нет доступных навыков</div>';
}

async function savePlayerSkills() {
    const msg = document.getElementById('skillsMessage');
    const checkboxes = document.querySelectorAll('#skillsSelectionList input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    try {
        showSkillsMessage(msg, 'Сохранение...', '');
        const res = await api('savePlayerSkills', {
            nickname: currentUser,
            skills: selected
        });

        if (res.success) {
            showSkillsMessage(msg, res.message || 'Сохранено', 'success');
            setTimeout(() => loadPlayerSkills(), 800);
        } else {
            showSkillsMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showSkillsMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function loadPendingSkills() {
    const list = document.getElementById('pendingSkillsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getPendingSkills');

        if (res.success && res.players && res.players.length > 0) {
            let html = '';
            for (const p of res.players) {
                html += '<div class="player-card">';
                html += '<div class="player-card-header">';
                html += '<div class="player-nick">' + escapeHtml(p.nickname) + '</div>';
                html += '<div class="action-buttons">';
                html += '<button class="btn-approve" onclick="approveSkills(\'' + escapeForOnclick(p.nickname) + '\')">✓</button>';
                html += '<button class="btn-reject" onclick="rejectSkills(\'' + escapeForOnclick(p.nickname) + '\')">✕</button>';
                html += '</div></div>';
                html += '<div class="approved-skills">';

                if (p.skills && p.skills.length > 0) {
                    for (const skill of p.skills) {
                        html += '<div class="approved-skill-badge">' + escapeHtml(skill) + '</div>';
                    }
                } else {
                    html += '<div style="color:var(--text-dim);">Пусто</div>';
                }

                html += '</div></div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет заявок</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function approveSkills(nickname) {
    try {
        const res = await api('approveSkills', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Подтверждено'));
            loadPendingSkills();
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function rejectSkills(nickname) {
    try {
        const res = await api('rejectSkills', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Отклонено'));
            loadPendingSkills();
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

function showSkillsMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
