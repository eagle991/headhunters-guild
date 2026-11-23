// ============================================================
// 👤 КАБИНЕТ ИГРОКА
// ============================================================

async function loadPlayerData() {
    if (!currentUser) return;

    try {
        const res = await api('getPlayerData', { nickname: currentUser });

        const form = document.getElementById('playerDataForm');
        const approvedMsg = document.getElementById('approvedMessage');
        const empty = document.getElementById('cabinetEmpty');
        const approvedGrid = document.getElementById('approvedDataGrid');
        const inventory = document.getElementById('mmorpgInventoryView');
        const status = document.getElementById('playerStatus');
        const screenshots = document.getElementById('characterScreenshotsBlock');

        if (!res.success) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        const d = res.data;
        myPlayerData = d;
        AppState.myPlayerData = d;

        // Заполняем поля формы
        setValue('bm', d.bm);
        setValue('level', d.level);
        setValue('attack', d.attack);
        setValue('defense', d.defense);
        setValue('accuracy', d.accuracy);
        setValue('evasion', d.evasion);
        setValue('profession', d.profession);

        if (d.status === 'approved') {
            if (status) status.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
            if (form) form.classList.add('hidden');
            if (approvedMsg) approvedMsg.classList.remove('hidden');
            if (approvedGrid) approvedGrid.classList.remove('hidden');
            renderApprovedPlayerData(d);
        } else {
            if (status) status.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
            if (form) form.classList.remove('hidden');
            if (approvedMsg) approvedMsg.classList.add('hidden');
        }

        if (screenshots) screenshots.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');

    } catch (e) {
        console.error('loadPlayerData error:', e);
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function renderApprovedPlayerData(data) {
    const grid = document.getElementById('approvedDataGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="data-item"><div class="data-label">БМ</div><div class="data-value">${data.bm || '—'}</div></div>
        <div class="data-item"><div class="data-label">Уровень</div><div class="data-value">${data.level || '—'}</div></div>
        <div class="data-item"><div class="data-label">Атака</div><div class="data-value">${data.attack || '—'}</div></div>
        <div class="data-item"><div class="data-label">Защита</div><div class="data-value">${data.defense || '—'}</div></div>
        <div class="data-item"><div class="data-label">Меткость</div><div class="data-value">${data.accuracy || '—'}</div></div>
        <div class="data-item"><div class="data-label">Уклонение</div><div class="data-value">${data.evasion || '—'}</div></div>
        <div class="data-item"><div class="data-label">Профессия</div><div class="data-value">${escapeHtml(data.profession || '—')}</div></div>
    `;
}

async function savePlayerData() {
    const msg = document.getElementById('playerDataMessage');

    const payload = {
        nickname: currentUser,
        bm: document.getElementById('bm')?.value || '',
        level: document.getElementById('level')?.value || '',
        attack: document.getElementById('attack')?.value || '',
        defense: document.getElementById('defense')?.value || '',
        accuracy: document.getElementById('accuracy')?.value || '',
        evasion: document.getElementById('evasion')?.value || '',
        profession: document.getElementById('profession')?.value || ''
    };

    try {
        showPlayerMessage(msg, 'Сохранение...', '');
        const res = await api('savePlayerData', payload);

        if (res.success) {
            showPlayerMessage(msg, res.message || 'Сохранено', 'success');
            setTimeout(() => loadPlayerData(), 800);
        } else {
            showPlayerMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showPlayerMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function viewPlayerCabinet(nickname) {
    const modal = document.getElementById('viewPlayerModal');
    const content = document.getElementById('viewPlayerContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:20px;">Загрузка...</div>';
    modal.classList.remove('hidden');

    try {
        const [playerRes, skillsRes] = await Promise.all([
            api('getPlayerData', { nickname: nickname }),
            api('getPlayerSkills', { nickname: nickname })
        ]);

        if (!playerRes.success) {
            content.innerHTML = '<div class="empty-state">Игрок не найден</div>';
            return;
        }

        const d = playerRes.data;
        let html = '<div class="view-player-header">';
        html += '<div class="view-player-nick">' + escapeHtml(nickname) + '</div>';
        html += '</div>';

        html += '<div class="data-grid">';
        html += '<div class="data-item"><div class="data-label">БМ</div><div class="data-value">' + (d.bm || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Уровень</div><div class="data-value">' + (d.level || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Атака</div><div class="data-value">' + (d.attack || '—') + '</div></div>';
        html += '<div class="data-item"><div class="data-label">Защита</div><div class="data-value">' + (d.defense || '—') + '</div></div>';
        html += '</div>';

        if (skillsRes.success && skillsRes.data?.skills?.length) {
            html += '<div style="margin-top:12px;"><div class="panel-title" style="font-size:11px;">🎯 Навыки</div><div class="approved-skills">';
            for (const skill of skillsRes.data.skills) {
                html += '<div class="approved-skill-badge">✓ ' + escapeHtml(skill) + '</div>';
            }
            html += '</div></div>';
        }

        content.innerHTML = html;
    } catch (e) {
        content.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

function closeViewPlayerModal() {
    const modal = document.getElementById('viewPlayerModal');
    if (modal) modal.classList.add('hidden');
}

function showPlayerMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
