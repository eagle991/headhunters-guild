// ============================================================
// 🛡️ ЭКИПИРОВКА ИГРОКА
// ============================================================

async function loadPlayerItems() {
    try {
        const sr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentSections' }), redirect: 'follow' });
        const sres = await sr.json();
        if (sres.success) equipmentSections = sres.sections;
        const ir = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
        const ires = await ir.json();
        if (ires.success) allItems = ires.items;
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPlayerItems', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        const f = document.getElementById('equipmentForm');
        const am = document.getElementById('equipmentApprovedMessage');
        const ss = document.getElementById('equipmentStatus');
        const es = document.getElementById('equipmentEmpty');
        const inv = document.getElementById('mmorpgInventoryView');
        if (res.success) {
            myPlayerItems = res.data;
            playerItemSelections = {};
            for (const sec in res.data.selections) {
                const v = res.data.selections[sec];
                if (v === null || v === undefined) continue;
                if (typeof v === 'object' && v.id !== undefined) playerItemSelections[sec] = { id: Number(v.id), enh: Number(v.enh) || 0 };
                else playerItemSelections[sec] = { id: Number(v), enh: 0 };
            }
            if (res.data.status === 'approved') {
                if (ss) ss.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
                if (f) f.classList.add('hidden');
                if (am) am.classList.remove('hidden');
                if (es) es.classList.add('hidden');
                if (inv) { inv.classList.remove('hidden'); renderMmorpgInventory(); }
            } else if (res.data.status === 'pending') {
                if (ss) ss.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
                if (f) f.classList.add('hidden');
                if (am) am.classList.add('hidden');
                if (es) es.classList.remove('hidden');
                if (inv) inv.classList.add('hidden');
            } else {
                if (ss) ss.innerHTML = '<span class="status-badge status-rejected">Отклонено</span>';
                if (f) f.classList.remove('hidden');
                if (am) am.classList.add('hidden');
                if (es) es.classList.remove('hidden');
                if (inv) inv.classList.add('hidden');
            }
        } else {
            if (ss) ss.innerHTML = '';
            if (f) f.classList.remove('hidden');
            if (am) am.classList.add('hidden');
            if (es) es.classList.remove('hidden');
            if (inv) inv.classList.add('hidden');
            myPlayerItems = { selections: {}, status: '' };
            playerItemSelections = {};
        }
        buildEquipmentTabs();
        if (equipmentSections.length > 0 && !currentEquipmentSection) selectEquipmentSection(equipmentSections[0]);
    } catch (e) { console.error(e); }
}

function buildEquipmentTabs() {
    const el = document.getElementById('equipmentSectionTabs');
    if (!el) return;
    let html = '';
    for (let i = 0; i < equipmentSections.length; i++) {
        const s = equipmentSections[i];
        html += '<button type="button" class="eq-tab ' + (s === currentEquipmentSection ? 'active' : '') + '" onclick="selectEquipmentSection(\'' + escapeForOnclick(s) + '\')">' + escapeHtml(s) + '</button>';
    }
    el.innerHTML = html;
}

function selectEquipmentSection(s) {
    currentEquipmentSection = s;
    buildEquipmentTabs();
    renderEquipmentItems();
}

function renderEquipmentItems() {
    const l = document.getElementById('equipmentItemsList');
    if (!l) return;
    const its = allItems.filter(function(i) { return i.section === currentEquipmentSection; });
    if (its.length === 0) { l.innerHTML = '<div class="empty-state">Нет предметов</div>'; return; }
    const current = playerItemSelections[currentEquipmentSection];
    let html = '';
    for (let i = 0; i < its.length; i++) {
        const it = its[i];
        const isSelected = current && current.id === it.id;
        const selEnh = isSelected ? current.enh : 0;
        const bc = getIconBorderColor(it.color);
        html += '<div class="item-card ' + (isSelected ? 'selected' : '') + '" onclick="selectItem(' + it.id + ', \'' + escapeForOnclick(currentEquipmentSection) + '\')">';
        html += '<div class="item-header">';
        html += '<div id="itemIconForm_' + it.id + '" class="icon-preview-cabinet" style="border-color:' + bc + ';cursor:default;" onclick="event.stopPropagation();"><span class="icon-placeholder" style="font-size:7px;">...</span></div>';
        html += '<div style="flex:1;">';
        html += '<div class="item-name">' + escapeHtml(it.name);
        if (isSelected) {
            html += '<span class="item-enh-box editable" onclick="event.stopPropagation()"> 🔧 +';
            html += '<input type="number" class="item-enh-input" min="0" max="15" value="' + selEnh + '" onchange="updateItemEnh(\'' + escapeForOnclick(currentEquipmentSection) + '\', ' + it.id + ', this.value)" onclick="event.stopPropagation()">';
            html += '<button class="item-enh-btn" onclick="event.stopPropagation(); stepEnh(\'' + escapeForOnclick(currentEquipmentSection) + '\', ' + it.id + ', -1)">−</button>';
            html += '<button class="item-enh-btn" onclick="event.stopPropagation(); stepEnh(\'' + escapeForOnclick(currentEquipmentSection) + '\', ' + it.id + ', 1)">+</button>';
            html += '</span>';
        } else {
            if (it.enhancement > 0) html += '<span style="color:var(--accent);font-family:var(--font-display);font-size:10px;font-weight:900;margin-left:4px;opacity:0.5;" title="Базовая заточка">🔧 +' + it.enhancement + '</span>';
        }
        html += '</div>';
        html += '<div class="item-badges">';
        if (it.isPrime) html += '<span class="item-badge prime">Прайм</span>';
        if (!isSelected && it.enhancement > 0) html += '<span class="item-badge enhance">+' + it.enhancement + '</span>';
        if (it.isBoss) html += '<span class="item-badge boss">Босс</span>';
        if (it.tier) html += '<span class="item-badge ' + getColorClass(it.color) + '">' + escapeHtml(it.tier) + '</span>';
        html += '<span class="item-badge ' + getColorClass(it.color) + '">' + escapeHtml(it.color) + '</span>';
        html += '</div></div></div></div>';
    }
    l.innerHTML = html;
    for (let i = 0; i < its.length; i++) {
        const it = its[i];
        loadAndDisplayIcon('item', it.id, 'itemIconForm_' + it.id, it.color);
    }
}

function selectItem(id, section) {
    const it = allItems.find(function(x) { return x.id === id; });
    const current = playerItemSelections[section];
    if (current && current.id === id) {
        delete playerItemSelections[section];
    } else {
        playerItemSelections[section] = { id: id, enh: it ? (Number(it.enhancement) || 0) : 0 };
    }
    renderEquipmentItems();
}

function updateItemEnh(section, id, val) {
    if (!playerItemSelections[section] || playerItemSelections[section].id !== id) return;
    const n = Math.max(0, Math.min(15, parseInt(val) || 0));
    playerItemSelections[section].enh = n;
    renderEquipmentItems();
}

function stepEnh(section, id, delta) {
    if (!playerItemSelections[section] || playerItemSelections[section].id !== id) return;
    const cur = playerItemSelections[section].enh || 0;
    playerItemSelections[section].enh = Math.max(0, Math.min(15, cur + delta));
    renderEquipmentItems();
}

async function savePlayerItems(e) {
    e.preventDefault();
    const b = document.getElementById('saveEquipmentBtn');
    const m = document.getElementById('equipmentMessage');
    if (b) { b.disabled = true; b.innerHTML = '<span class="loader"></span> ...'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePlayerItems', nickname: currentUser, selections: playerItemSelections }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; setTimeout(function() { loadPlayerItems(); m.style.display = 'none'; }, 1000); }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; } }
    finally { if (b) { b.disabled = false; b.innerText = 'Отправить на проверку'; } if (m) m.style.display = 'block'; }
}

// ============================================================
// 🎒 MMORPG ИНВЕНТАРЬ
// ============================================================

function renderMmorpgInventory() {
    if (!myPlayerData || myPlayerData.status !== 'approved') return;
    const inv = document.getElementById('mmorpgInventoryView');
    if (!inv) return;
    inv.classList.remove('hidden');
    const ag = document.getElementById('approvedDataGrid');
    if (ag) ag.classList.add('hidden');
    const cn = document.getElementById('characterNameDisplay');
    if (cn) cn.innerText = currentUser;
    const silhouette = document.getElementById('characterSilhouette');
    if (silhouette && myPlayerData.bioSuitIcon) {
        silhouette.innerHTML = '<img src="' + myPlayerData.bioSuitIcon + '" alt="' + escapeHtml(myPlayerData.bioSuitName || 'Биокостюм') + '">';
        silhouette.classList.add('has-biosuit');
        silhouette.style.borderColor = getIconBorderColor(myPlayerData.bioSuitColor || 'Белый');
    } else if (silhouette) {
        silhouette.innerHTML = '<span id="characterSilhouetteContent">👤</span>';
        silhouette.classList.remove('has-biosuit');
    }
    const pi = document.getElementById('characterProfIcon');
    if (pi) {
        const iconHtml = getProfessionIconHtml(myPlayerData.profession, 'large');
        const tmp = document.createElement('div');
        tmp.innerHTML = iconHtml;
        if (tmp.firstChild) {
            pi.innerHTML = tmp.firstChild.innerHTML;
            pi.className = 'profession-icon-large';
        }
    }
    const pn = document.getElementById('characterProfName');
    if (pn) pn.innerText = myPlayerData.profession || '—';
    const statsMini = document.getElementById('characterStatsMini');
    if (statsMini) {
        statsMini.innerHTML = '<div class="stat-mini"><span class="stat-mini-label">БМ</span><span class="stat-mini-value">' + Number(myPlayerData.bm).toLocaleString('ru-RU') + '</span></div><div class="stat-mini"><span class="stat-mini-label">Ур.</span><span class="stat-mini-value">' + myPlayerData.level + '</span></div><div class="stat-mini"><span class="stat-mini-label">Ат.</span><span class="stat-mini-value">' + myPlayerData.attack + '</span></div><div class="stat-mini"><span class="stat-mini-label">Защ.</span><span class="stat-mini-value">' + myPlayerData.defense + '</span></div><div class="stat-mini"><span class="stat-mini-label">Мет.</span><span class="stat-mini-value">' + myPlayerData.accuracy + '</span></div><div class="stat-mini"><span class="stat-mini-label">Укл.</span><span class="stat-mini-value">' + myPlayerData.evasion + '</span></div>';
    }
    const sg = document.getElementById('equipmentSlotsGrid');
    const sel = playerItemSelections || {};
    if (sg) {
        let html = '';
        for (let i = 0; i < equipmentSections.length; i++) {
            const sec = equipmentSections[i];
            const info = getSelectionInfo(sel, sec, true);
            const it = info ? allItems.find(function(x) { return x.id === info.id; }) : null;
            const enh = info ? info.enh : 0;
            const bc = it ? getIconBorderColor(it.color) : 'var(--border)';
            if (it) {
                html += '<div class="equipment-slot equipped" style="border-color:' + bc + ';" onclick="showEquipmentEditForm()"><div class="slot-label">' + escapeHtml(sec) + '</div><div class="slot-icon" id="slotIcon_' + it.id + '" style="border-color:' + bc + ';"><span class="icon-placeholder" style="font-size:7px;">...</span></div><div class="slot-item-name">' + escapeHtml(it.name) + '</div><div class="slot-badges">';
                if (it.isPrime) html += '<span class="slot-badge" style="background:var(--warning-soft);color:var(--gold);border:1px solid var(--gold);">П</span>';
                if (enh > 0) html += '<span class="slot-badge" style="background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent);">+' + enh + '</span>';
                if (it.isBoss) html += '<span class="slot-badge" style="background:var(--danger-soft);color:var(--danger);border:1px solid var(--danger);">Б</span>';
                if (it.tier) html += '<span class="slot-badge item-badge ' + getColorClass(it.color) + '">' + escapeHtml(it.tier) + '</span>';
                html += '</div></div>';
            } else {
                html += '<div class="equipment-slot empty" onclick="showEquipmentEditForm()"><div class="slot-label">' + escapeHtml(sec) + '</div><div class="slot-icon">—</div><div class="slot-item-name" style="color:var(--text-dim);">Пусто</div></div>';
            }
        }
        sg.innerHTML = html;
        for (const sec in sel) {
            const info = getSelectionInfo(sel, sec, false);
            if (info) {
                const it = allItems.find(function(x) { return x.id === info.id; });
                if (it) loadAndDisplayIcon('item', info.id, 'slotIcon_' + info.id, it.color);
            }
        }
    }
}

// ============================================================
// 🛡️ ЭКИПИРОВКА АДМИН
// ============================================================

async function loadAdminItems() {
    try {
        if (equipmentSections.length === 0) await loadEquipmentSectionsDynamic();
        const ir = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
        const ires = await ir.json();
        if (ires.success) allItems = ires.items;
        const ns = document.getElementById('newItemSection');
        if (ns) { let html = ''; for (let i = 0; i < equipmentSections.length; i++) html += '<option value="' + escapeHtml(equipmentSections[i]) + '">' + escapeHtml(equipmentSections[i]) + '</option>'; ns.innerHTML = html; }
        const tabs = document.getElementById('adminItemSectionTabs');
        if (tabs) { let html = ''; for (let i = 0; i < equipmentSections.length; i++) { const s = equipmentSections[i]; html += '<button type="button" class="eq-tab ' + (s === currentAdminItemSection ? 'active' : '') + '" onclick="selectAdminItemSection(\'' + escapeForOnclick(s) + '\')">' + escapeHtml(s) + '</button>'; } tabs.innerHTML = html; }
        if (!currentAdminItemSection && equipmentSections.length > 0) currentAdminItemSection = equipmentSections[0];
        renderAdminItems();
    } catch (e) { console.error(e); }
}

function selectAdminItemSection(s) {
    currentAdminItemSection = s;
    const tabs = document.querySelectorAll('#adminItemSectionTabs .eq-tab');
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].innerText === s);
    renderAdminItems();
}

function renderAdminItems() {
    const l = document.getElementById('adminItemsList');
    if (!l) return;
    const its = allItems.filter(function(i) { return i.section === currentAdminItemSection; });
    if (its.length === 0) { l.innerHTML = '<div class="empty-state">Нет</div>'; return; }
    let html = '';
    for (let i = 0; i < its.length; i++) {
        const it = its[i];
        const bc = getIconBorderColor(it.color);
        html += '<div class="admin-item-card"><div style="display:flex;align-items:center;gap:6px;flex:1;"><div id="itemIcon_' + it.id + '" class="icon-preview-small" style="border:2px solid ' + bc + ';" onclick="openIconModal(\'item\',' + it.id + ',\'' + escapeForOnclick(it.name) + '\')"><span class="icon-placeholder">...</span></div><div class="admin-item-info"><div class="admin-item-name">' + escapeHtml(it.name) + '</div><div class="admin-item-meta">';
        if (it.isPrime) html += '<span class="item-badge prime">Прайм</span>';
        if (it.enhancement > 0) html += '<span class="item-badge enhance">+' + it.enhancement + '</span>';
        if (it.isBoss) html += '<span class="item-badge boss">Босс</span>';
        if (it.tier) html += '<span class="item-badge ' + getColorClass(it.color) + '">' + escapeHtml(it.tier) + '</span>';
        html += '<span class="item-badge ' + getColorClass(it.color) + '">' + escapeHtml(it.color) + '</span>';
        html += '</div></div></div><div class="action-buttons"><button class="btn-edit" onclick="openIconModal(\'item\',' + it.id + ',\'' + escapeForOnclick(it.name) + '\')" style="width:auto;margin-top:0;">🖼</button>';
        if (it.isAdminCreated) html += '<button class="btn-remove" onclick="removeItem(' + it.id + ')">✕</button>';
        html += '</div></div>';
    }
    l.innerHTML = html;
    for (let i = 0; i < its.length; i++) loadItemIcon(its[i].id);
}

async function loadItemIcon(id) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItemIcon', itemId: id }), redirect: 'follow' });
        const res = await r.json();
        const c = document.getElementById('itemIcon_' + id);
        if (c && res.success && res.iconData) {
            const it = allItems.find(function(x) { return x.id === id; });
            const bc = it ? getIconBorderColor(it.color) : 'var(--border)';
            c.innerHTML = '<img src="' + res.iconData + '" style="width:100%;height:100%;object-fit:cover;border-radius:3px;">';
            c.style.border = '2px solid ' + bc;
        } else if (c) c.innerHTML = '<span class="icon-placeholder">Нет</span>';
    } catch (e) {}
}

async function addItem(e) {
    e.preventDefault();
    const m = document.getElementById('adminItemsMessage');
    const p = {
        action: 'addItem',
        name: document.getElementById('newItemName').value,
        section: document.getElementById('newItemSection').value,
        isPrime: document.getElementById('newItemPrime').checked,
        enhancement: parseInt(document.getElementById('newItemEnhancement').value) || 0,
        isBoss: document.getElementById('newItemBoss').checked,
        tier: document.getElementById('newItemTier').value,
        color: document.getElementById('newItemColor').value
    };
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(p), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = res.message; document.getElementById('newItemName').value = ''; setTimeout(function() { loadAdminItems(); m.style.display = 'none'; }, 800); }
            else { m.className = 'message error'; m.innerText = res.message; m.style.display = 'block'; }
        }
    } catch (err) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка.'; m.style.display = 'block'; } }
}

async function removeItem(id) {
    if (!confirm('Удалить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'removeItem', itemId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadAdminItems(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function loadPendingEquipment() {
    try {
        const ir = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
        const ires = await ir.json();
        if (ires.success) allItems = ires.items;
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getPendingItems' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('pendingEquipmentList');
        if (!l) return;
        if (res.success && res.players.length > 0) {
            let html = '';
            for (let i = 0; i < res.players.length; i++) {
                const p = res.players[i];
                html += '<div class="player-card"><div class="player-card-header"><div class="player-nick">' + escapeHtml(p.nickname) + '</div><div class="action-buttons"><button class="btn-approve" onclick="approveEquipment(\'' + escapeForOnclick(p.nickname) + '\')">✓</button><button class="btn-reject" onclick="rejectEquipment(\'' + escapeForOnclick(p.nickname) + '\')">✕</button></div></div><div class="approved-equipment">';
                let sh = '';
                for (const sec in p.selections) {
                    const entry = p.selections[sec];
                    if (!entry) continue;
                    const itemId = (typeof entry === 'object') ? entry.id : entry;
                    const enh = (typeof entry === 'object' && entry.enh !== undefined) ? Number(entry.enh) : 0;
                    const it = allItems.find(function(x) { return x.id === itemId; });
                    if (!it) continue;
                    sh += '<div class="approved-eq-item"><div class="approved-eq-section">' + escapeHtml(sec) + ':</div><div class="approved-eq-name">' + escapeHtml(it.name);
                    if (enh > 0) sh += ' 🔧 +' + enh;
                    sh += '</div></div>';
                }
                if (sh === '') sh = '<div style="color:var(--text-dim);">Пусто</div>';
                html += sh + '</div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет</div>';
    } catch (e) { console.error(e); }
}

async function approveEquipment(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'approveItems', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingEquipment(); }
    } catch (e) {}
}

async function rejectEquipment(n) {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'rejectItems', nickname: n }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadPendingEquipment(); }
    } catch (e) {}
}

// ============================================================
// 📁 РАЗДЕЛЫ ЭКИПИРОВКИ
// ============================================================

async function loadEquipmentSectionsDynamic() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentSectionsList' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.sections && res.sections.length > 0) equipmentSections = res.sections;
        else equipmentSections = ['Оружие','Шея','Грудь','Штаны','Колени','Венец','Серьга','Ожерелье','Браслет','Кольцо','Привод','Звездочет','Руки','Биокостюм','Ровер','Материал'];
        const ns = document.getElementById('newItemSection');
        if (ns) { let html = ''; for (let i = 0; i < equipmentSections.length; i++) html += '<option value="' + escapeHtml(equipmentSections[i]) + '">' + escapeHtml(equipmentSections[i]) + '</option>'; ns.innerHTML = html; }
        const sl = document.getElementById('sectionsList');
        if (sl) { let html = ''; for (let i = 0; i < equipmentSections.length; i++) { html += '<div style="background:var(--bg-panel);padding:3px 6px;border-radius:var(--radius-sm);border:1px solid var(--border);font-size:10px;display:flex;align-items:center;gap:4px;">' + escapeHtml(equipmentSections[i]) + '<button onclick="deleteEquipmentSection(\'' + escapeForOnclick(equipmentSections[i]) + '\')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;line-height:1;">&times;</button></div>'; } sl.innerHTML = html; }
    } catch (e) { console.error('Ошибка:', e); }
}

async function loadAuctionSectionsDynamic() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentSectionsList' }), redirect: 'follow' });
        const res = await r.json();
        const sel = document.getElementById('auctionItemSection');
        if (sel && res.success && res.sections && res.sections.length > 0) {
            const currentValue = sel.value;
            let html = '<option value="">— Выберите раздел —</option>';
            for (let i = 0; i < res.sections.length; i++) html += '<option value="' + escapeHtml(res.sections[i]) + '"' + (res.sections[i] === currentValue ? ' selected' : '') + '>' + escapeHtml(res.sections[i]) + '</option>';
            sel.innerHTML = html;
        }
    } catch (e) { console.error('Ошибка:', e); }
}

async function addEquipmentSection() {
    const name = document.getElementById('newSectionName').value.trim();
    if (!name) { alert('Введите название'); return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addEquipmentSection', name: name }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); document.getElementById('newSectionName').value = ''; loadEquipmentSectionsDynamic(); loadAuctionSectionsDynamic(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function deleteEquipmentSection(name) {
    if (!confirm('Удалить раздел "' + name + '"?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteEquipmentSection', name: name }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadEquipmentSectionsDynamic(); loadAuctionSectionsDynamic(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}
