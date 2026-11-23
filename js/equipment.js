// ============================================================
// 🛡️ ЭКИПИРОВКА ИГРОКА
// ============================================================

async function loadPlayerItems() {
    if (!currentUser) return;

    try {
        // Загружаем разделы
        const sr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentSections' }), redirect: 'follow' });
        const sres = await sr.json();
        if (sres.success) equipmentSections = sres.sections || [];

        // Загружаем предметы
        const ir = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
        const ires = await ir.json();
        if (ires.success) allItems = ires.items || [];

        // Загружаем выбор игрока
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

            if (res.data.selections) {
                for (const sec in res.data.selections) {
                    const v = res.data.selections[sec];
                    if (v === null || v === undefined) continue;
                    if (typeof v === 'object' && v.id !== undefined) {
                        playerItemSelections[sec] = v;
                    } else {
                        playerItemSelections[sec] = { id: v };
                    }
                }
            }

            if (res.data.status === 'approved') {
                if (ss) ss.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
                if (f) f.classList.add('hidden');
                if (am) am.classList.remove('hidden');
                if (inv) inv.classList.remove('hidden');
                if (typeof renderMmorpgInventory === 'function') renderMmorpgInventory();
            } else {
                if (ss) ss.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
                if (f) f.classList.remove('hidden');
                if (am) am.classList.add('hidden');
                if (inv) inv.classList.add('hidden');
                buildEquipmentTabs();
            }

            if (es) es.classList.add('hidden');
        } else {
            if (es) es.classList.remove('hidden');
        }
    } catch (e) {
        console.error('loadPlayerItems error:', e);
    }
}

function buildEquipmentTabs() {
    const tabs = document.getElementById('equipmentTabs');
    if (!tabs) return;

    if (!equipmentSections || equipmentSections.length === 0) {
        tabs.innerHTML = '<div style="color:var(--text-dim);padding:8px;">Нет разделов</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < equipmentSections.length; i++) {
        const sec = equipmentSections[i];
        const active = sec === currentEquipmentSection ? ' active' : '';
        html += '<button class="tab-btn' + active + '" onclick="selectEquipmentSection(\'' + escapeForOnclick(sec) + '\')">' + escapeHtml(sec) + '</button>';
    }
    tabs.innerHTML = html;

    if (equipmentSections.length > 0 && !currentEquipmentSection) {
        selectEquipmentSection(equipmentSections[0]);
    } else if (currentEquipmentSection) {
        renderEquipmentItems();
    }
}

function selectEquipmentSection(section) {
    currentEquipmentSection = section;

    const tabs = document.querySelectorAll('#equipmentTabs .tab-btn');
    for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent === section) tabs[i].classList.add('active');
        else tabs[i].classList.remove('active');
    }

    renderEquipmentItems();
}

function renderEquipmentItems() {
    const container = document.getElementById('equipmentItemsList');
    if (!container || !currentEquipmentSection) return;

    const items = [];
    for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].section === currentEquipmentSection) items.push(allItems[i]);
    }

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет предметов</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const selected = playerItemSelections[currentEquipmentSection] && playerItemSelections[currentEquipmentSection].id === item.id;
        html += '<div class="equipment-item' + (selected ? ' selected' : '') + '" onclick="selectEquipmentItem(\'' + escapeForOnclick(item.id) + '\')">';
        html += '<div class="equipment-item-name">' + escapeHtml(item.name) + '</div>';
        html += '<div class="equipment-item-meta">' + escapeHtml(item.tier || '') + ' | ' + escapeHtml(item.color || '') + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function selectEquipmentItem(itemId) {
    if (!currentEquipmentSection) return;

    let item = null;
    for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].id === itemId) { item = allItems[i]; break; }
    }
    if (!item) return;

    playerItemSelections[currentEquipmentSection] = { id: itemId, name: item.name };
    renderEquipmentItems();
}

async function savePlayerItems() {
    const msg = document.getElementById('equipmentMessage');

    try {
        if (msg) { msg.className = 'message'; msg.innerText = 'Сохранение...'; msg.style.display = 'block'; }

        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'savePlayerItems', nickname: currentUser, selections: playerItemSelections }),
            redirect: 'follow'
        });
        const res = await r.json();

        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = res.message || 'Сохранено';
                setTimeout(function() { loadPlayerItems(); }, 800);
            } else {
                msg.className = 'message error';
                msg.innerText = res.message || 'Ошибка';
            }
        }
    } catch (e) {
        if (msg) { msg.className = 'message error'; msg.innerText = 'Ошибка соединения'; msg.style.display = 'block'; }
    }
}

function showEquipmentEditForm() {
    const inv = document.getElementById('mmorpgInventoryView');
    if (inv) inv.classList.add('hidden');

    const am = document.getElementById('equipmentApprovedMessage');
    if (am) am.classList.add('hidden');

    const f = document.getElementById('equipmentForm');
    if (f) f.classList.remove('hidden');

    buildEquipmentTabs();

    if (equipmentSections.length > 0 && !currentEquipmentSection) {
        selectEquipmentSection(equipmentSections[0]);
    } else {
        renderEquipmentItems();
    }
}

function backToInventory() {
    const f = document.getElementById('equipmentForm');
    if (f) f.classList.add('hidden');

    const inv = document.getElementById('mmorpgInventoryView');
    if (inv) {
        inv.classList.remove('hidden');
        if (typeof renderMmorpgInventory === 'function') renderMmorpgInventory();
    }

    const am = document.getElementById('equipmentApprovedMessage');
    if (am && myPlayerItems && myPlayerItems.status === 'approved') am.classList.remove('hidden');
}

async function loadEquipmentSectionsDynamic() {
    const sel = document.getElementById('adminEquipmentSection');
    if (!sel) return;

    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getEquipmentSections' }), redirect: 'follow' });
        const res = await r.json();

        if (res.success) {
            const currentValue = sel.value;
            let html = '<option value="">— Выберите раздел —</option>';
            for (let i = 0; i < res.sections.length; i++) {
                html += '<option value="' + escapeHtml(res.sections[i]) + '"' + (res.sections[i] === currentValue ? ' selected' : '') + '>' + escapeHtml(res.sections[i]) + '</option>';
            }
            sel.innerHTML = html;
        }
    } catch (e) {
        console.error('Ошибка:', e);
    }
}

async function addEquipmentSection() {
    const name = document.getElementById('newSectionName')?.value?.trim();
    if (!name) { alert('Введите название'); return; }

    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'addEquipmentSection', name: name }), redirect: 'follow' });
        const res = await r.json();

        if (res.success) {
            alert('✅ ' + res.message);
            document.getElementById('newSectionName').value = '';
            loadEquipmentSectionsDynamic();
            if (typeof loadAuctionSectionsDynamic === 'function') loadAuctionSectionsDynamic();
        } else {
            alert('❌ ' + res.message);
        }
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

async function deleteEquipmentSection(name) {
    if (!confirm('Удалить раздел "' + name + '"?')) return;

    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteEquipmentSection', name: name }), redirect: 'follow' });
        const res = await r.json();

        if (res.success) {
            alert('✅ ' + res.message);
            loadEquipmentSectionsDynamic();
            if (typeof loadAuctionSectionsDynamic === 'function') loadAuctionSectionsDynamic();
        } else {
            alert('❌ ' + res.message);
        }
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

// Экспорт
window.loadPlayerItems = loadPlayerItems;
window.buildEquipmentTabs = buildEquipmentTabs;
window.selectEquipmentSection = selectEquipmentSection;
window.renderEquipmentItems = renderEquipmentItems;
window.selectEquipmentItem = selectEquipmentItem;
window.savePlayerItems = savePlayerItems;
window.showEquipmentEditForm = showEquipmentEditForm;
window.backToInventory = backToInventory;
window.loadEquipmentSectionsDynamic = loadEquipmentSectionsDynamic;
window.addEquipmentSection = addEquipmentSection;
window.deleteEquipmentSection = deleteEquipmentSection;
