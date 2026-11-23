// ============================================================
// 🎯 НАВЫКИ ИГРОКА
// ============================================================

async function loadPlayerSkills() {
    try {
        const sr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSkills' }), redirect: 'follow' });
        const sres = await sr.json();
        if (sres.success) allSkills = sres.skills;
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerSkills', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        const f = document.getElementById('skillsForm');
        const am = document.getElementById('skillsApprovedMessage');
        const ss = document.getElementById('skillsStatus');
        const al = document.getElementById('approvedSkillsList');
        const se = document.getElementById('skillsEmpty');
        if (res.success) {
            myPlayerSkills = res.data;
            if (res.data.status === 'approved') {
                if (ss) ss.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
                if (f) f.classList.add('hidden');
                if (am) am.classList.remove('hidden');
                if (res.data.skills && res.data.skills.length > 0) {
                    let html = '';
                    const colorMap = { 'Белый': '#94a3b8', 'Зеленый': 'var(--success)', 'Синий': 'var(--accent)', 'Фиолетовый': '#6b4aa8', 'Желтый': 'var(--gold)', 'Красный': 'var(--danger)' };
                    for (let i = 0; i < res.data.skills.length; i++) {
                        const skillName = res.data.skills[i];
                        const skillObj = allSkills.find(function(s) { return s.name === skillName; });
                        const s = skillObj || { name: skillName, color: 'Белый', rarity: 'common' };
                        const color = s.color || 'Белый';
                        const borderColor = colorMap[color] || 'var(--border)';
                        html += '<div class="approved-skill-badge" style="border-color:' + borderColor + ';">';
                        html += '<div id="approvedSkillIcon_' + i + '" class="icon-preview-cabinet" style="width:32px;height:32px;border:2px solid ' + borderColor + ';"><span class="icon-placeholder" style="font-size:8px;">...</span></div>';
                        html += '✓ ' + escapeHtml(s.name) + '<span class="skill-color-badge skill-color-' + color + '">' + color + '</span></div>';
                    }
                    if (al) { al.innerHTML = html; al.classList.remove('hidden'); }
                    if (se) se.classList.add('hidden');
                    for (let i = 0; i < res.data.skills.length; i++) {
                        const skillName = res.data.skills[i];
                        const skillObj = allSkills.find(function(s) { return s.name === skillName; });
                        const s = skillObj || { name: skillName, color: 'Белый' };
                        const color = s.color || 'Белый';
                        const borderColor = colorMap[color] || 'var(--border)';
                        loadApprovedSkillIconWithColor(s.name, 'approvedSkillIcon_' + i, borderColor);
                    }
                } else {
                    if (al) { al.innerHTML = '<div class="empty-state">Навыки не выбраны</div>'; al.classList.remove('hidden'); }
                    if (se) se.classList.add('hidden');
                }
            } else if (res.data.status === 'pending') {
                if (ss) ss.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
                if (f) f.classList.remove('hidden');
                if (am) am.classList.add('hidden');
                if (al) al.classList.add('hidden');
                if (se) se.classList.remove('hidden');
            } else {
                if (ss) ss.innerHTML = '<span class="status-badge status-rejected">Отклонено</span>';
                if (f) f.classList.remove('hidden');
                if (am) am.classList.add('hidden');
                if (al) al.classList.add('hidden');
                if (se) se.classList.remove('hidden');
            }
        } else {
            if (ss) ss.innerHTML = '';
            if (f) f.classList.remove('hidden');
            if (am) am.classList.add('hidden');
            if (al) al.classList.add('hidden');
            if (se) se.classList.remove('hidden');
            myPlayerSkills = { skills: [], status: '' };
        }
        buildSkillsForm();
    } catch (e) { console.error(e); }
}

function buildSkillsForm() {
    const l = document.getElementById('skillsList');
    if (!l) return;
    const ps = (myPlayerSkills && myPlayerSkills.skills) ? myPlayerSkills.skills : [];
    const useRarity = isFeatureEnabled('skillRarity');
    const rl = { 'common': 'Обычный', 'uncommon': 'Необычный', 'rare': 'Редкий', 'epic': 'Эпический', 'legendary': 'Легендарный' };
    const colorMap = { 'Белый': '#94a3b8', 'Зеленый': 'var(--success)', 'Синий': 'var(--accent)', 'Фиолетовый': '#6b4aa8', 'Желтый': 'var(--gold)', 'Красный': 'var(--danger)' };
    let html = '';
    for (let i = 0; i < allSkills.length; i++) {
        const s = allSkills[i];
        const ic = ps.indexOf(s.name) !== -1;
        const rarity = s.rarity || 'common';
        const color = s.color || 'Белый';
        const borderColor = colorMap[color] || 'var(--border)';
        const rc = useRarity ? 'rarity-' + rarity : '';
        const rb = useRarity ? '<span class="rarity-badge ' + rc + '">' + rl[rarity] + '</span>' : '';
        const cb = '<span class="skill-color-badge skill-color-' + color + '" style="border-color:' + borderColor + ';">' + color + '</span>';
        html += '<div class="skill-item ' + (ic ? 'checked' : '') + '" onclick="toggleSkill(this, \'' + escapeForOnclick(s.name) + '\')">';
        html += '<input type="checkbox" class="skill-checkbox" ' + (ic ? 'checked' : '') + ' onclick="event.stopPropagation(); toggleSkill(this.parentElement, \'' + escapeForOnclick(s.name) + '\');">';
        html += '<div class="skill-name">' + escapeHtml(s.name) + rb + cb + '</div></div>';
    }
    l.innerHTML = html;
}

async function loadApprovedSkillIconWithColor(n, containerId, borderColor) {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getSkillIcon', skillName: n }),
            redirect: 'follow'
        });
        const res = await r.json();
        const c = document.getElementById(containerId);
        
        if (!c) {
            console.warn('Контейнер навыка не найден:', containerId);
            return;
        }
        
        if (res.success && res.iconData) {
            c.innerHTML = '<img src="' + res.iconData + '" style="width:100%;height:100%;object-fit:cover;">';
            c.style.border = '2px solid ' + borderColor;
        } else {
            c.innerHTML = '<span class="icon-placeholder" style="font-size:8px;">Нет</span>';
            c.style.border = '2px solid ' + borderColor;
        }
    } catch (e) {
        console.error('Ошибка загрузки иконки навыка:', n, e);
    }
}

function toggleSkill(el, n) {
    const cb = el.querySelector('.skill-checkbox');
    if (cb) { cb.checked = !cb.checked; el.classList.toggle('checked', cb.checked); }
}

async function savePlayerSkills(e) {
    e.preventDefault();
    const b = document.getElementById('saveSkillsBtn');
    const m = document.getElementById('skillsMessage');
    if (b) { b.disabled = true; b.innerHTML = '<span class="loader"></span> ...'; }
    const cbs = document.querySelectorAll('#skillsList .skill-checkbox');
    const sel = [];
    for (let i = 0; i < cbs.length; i++) { if (cbs[i].checked) sel.push(allSkills[i].name); }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePlayerSkills', nickname: currentUser, skills: sel }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; setTimeout(loadPlayerSkills, 1000); }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; } }
    finally { if (b) { b.disabled = false; b.innerText = 'Отправить'; } if (m) m.style.display = 'block'; }
}

// ============================================================
// 🎯 НАВЫКИ АДМИН
// ============================================================

async function loadAdminSkills() {
    try {
        const an = isFeatureEnabled('skillRarity') ? 'getSkillsWithRarity' : 'getSkills';
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: an }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('adminSkillsList');
        if (!l) return;
        const rl = { 'common': 'Обычный', 'uncommon': 'Необычный', 'rare': 'Редкий', 'epic': 'Эпический', 'legendary': 'Легендарный' };
        const colors = ['Белый', 'Зеленый', 'Синий', 'Фиолетовый', 'Желтый', 'Красный'];
        const colorMap = { 'Белый': '#94a3b8', 'Зеленый': 'var(--success)', 'Синий': 'var(--accent)', 'Фиолетовый': '#6b4aa8', 'Желтый': 'var(--gold)', 'Красный': 'var(--danger)' };
        if (res.success && res.skills.length > 0) {
            let html = '';
            for (let i = 0; i < res.skills.length; i++) {
                const s = res.skills[i];
                const sn = s.name.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_');
                const rarity = s.rarity || 'common';
                const color = s.color || 'Белый';
                const borderColor = colorMap[color] || 'var(--border)';
                html += '<div class="admin-skill-item"><div style="display:flex;align-items:center;gap:6px;flex:1;"><div id="skillIcon_' + sn + '" class="icon-preview-small" style="border:2px solid ' + borderColor + ';" onclick="openIconModal(\'skill\',\'' + escapeForOnclick(s.name) + '\',\'' + escapeForOnclick(s.name) + '\')"><span class="icon-placeholder">...</span></div><div><span class="admin-skill-name">' + escapeHtml(s.name) + '</span>';
                if (s.isAdminCreated) html += '<span class="admin-skill-tag">Админ</span>';
                else html += '<span class="admin-skill-tag" style="background:var(--accent-soft);color:var(--accent);border-color:var(--accent);">Станд.</span>';
                if (isFeatureEnabled('skillRarity')) html += '<span class="rarity-badge rarity-' + rarity + '">' + rl[rarity] + '</span>';
                html += '<span class="skill-color-badge skill-color-' + color + '">' + color + '</span></div></div><div class="action-buttons"><button class="btn-edit" onclick="openIconModal(\'skill\',\'' + escapeForOnclick(s.name) + '\',\'' + escapeForOnclick(s.name) + '\')" style="width:auto;margin-top:0;">🖼</button>';
                html += '<select class="skill-color-select" onchange="setSkillColor(\'' + escapeForOnclick(s.name) + '\', this.value)">';
                for (let j = 0; j < colors.length; j++) html += '<option value="' + colors[j] + '"' + (color === colors[j] ? ' selected' : '') + '>' + colors[j] + '</option>';
                html += '</select>';
                if (s.isAdminCreated) html += '<button class="btn-remove" onclick="removeSkill(\'' + escapeForOnclick(s.name) + '\')">✕</button>';
                html += '</div></div>';
            }
            l.innerHTML = html;
            for (let i = 0; i < res.skills.length; i++) {
                const s = res.skills[i];
                const color = s.color || 'Белый';
                const borderColor = colorMap[color] || 'var(--border)';
                loadSkillIconWithColor(s.name, borderColor);
            }
        } else l.innerHTML = '<div class="empty-state">Пусто</div>';
    } catch (e) { console.error(e); }
}

async function loadSkillIconWithColor(n, borderColor) {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getSkillIcon', skillName: n }),
            redirect: 'follow'
        });
        const res = await r.json();
        const sn = n.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_');
        const c = document.getElementById('skillIcon_' + sn);
        
        if (!c) {
            console.warn('Контейнер иконки навыка не найден:', 'skillIcon_' + sn);
            return;
        }
        
        if (res.success && res.iconData) {
            c.innerHTML = '<img src="' + res.iconData + '" style="width:100%;height:100%;object-fit:cover;">';
            c.style.border = '2px solid ' + borderColor;
        } else {
            c.innerHTML = '<span class="icon-placeholder">Нет</span>';
            c.style.border = '2px solid ' + borderColor;
        }
    } catch (e) {
        console.error('Ошибка загрузки иконки навыка:', n, e);
    }
}

async function setSkillColor(n, c) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'setSkillColor', skillName: n, color: c, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) loadAdminSkills();
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function addSkill(e) {
    e.preventDefault();
    const i = document.getElementById('newSkillName');
    const m = document.getElementById('adminSkillsMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addSkill', skillName: i.value }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; i.value = ''; setTimeout(function() { loadAdminSkills(); m.style.display = 'none'; }, 800); }
            else { m.className = 'message error'; m.innerText = res.message; m.style.display = 'block'; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; m.style.display = 'block'; } }
}

async function removeSkill(n) {
    if (!confirm('Удалить "' + n + '"?')) return;
    const m = document.getElementById('adminSkillsMessage');
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'removeSkill', skillName: n }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; setTimeout(function() { loadAdminSkills(); m.style.display = 'none'; }, 800); }
            else { m.className = 'message error'; m.innerText = res.message; m.style.display = 'block'; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; m.style.display = 'block'; } }
}

async function loadPendingSkills() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPendingSkills' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('pendingSkillsList');
        if (!l) return;
        if (res.success && res.players.length > 0) {
            let html = '';
            for (let i = 0; i < res.players.length; i++) {
                const p = res.players[i];
                html += '<div class="player-card"><div class="player-card-header"><div class="player-nick">' + escapeHtml(p.nickname) + '</div><div class="action-buttons"><button class="btn-approve" onclick="approveSkills(\'' + escapeForOnclick(p.nickname) + '\')">✓</button><button class="btn-reject" onclick="rejectSkills(\'' + escapeForOnclick(p.nickname) + '\')">✕</button></div></div><div class="approved-skills">';
                if (p.skills.length > 0) {
                    for (let j = 0; j < p.skills.length; j++) html += '<div class="approved-skill-badge">' + escapeHtml(p.skills[j]) + '</div>';
                } else html += '<div style="color:var(--text-dim);">Пусто</div>';
                html += '</div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет</div>';
    } catch (e) { console.error(e); }
}

async function approveSkills(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveSkills', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingSkills(); }
    } catch (e) {}
}

async function rejectSkills(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectSkills', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingSkills(); }
    } catch (e) {}
}
