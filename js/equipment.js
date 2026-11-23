// ============================================================
// 🛡️ ЭКИПИРОВКА ИГРОКА
// ============================================================

async function loadPlayerItems() {
    if (!currentUser) return;

    try {
        // Загружаем разделы и предметы параллельно
        const [sectionsRes, itemsRes, playerRes] = await Promise.all([
            api('getEquipmentSections'),
            api('getItems'),
            api('getPlayerItems', { nickname: currentUser })
        ]);

        if (sectionsRes.success) equipmentSections = sectionsRes.sections || [];
        if (itemsRes.success) allItems = itemsRes.items || [];

        const form = document.getElementById('equipmentForm');
        const approvedMsg = document.getElementById('equipmentApprovedMessage');
        const status = document.getElementById('equipmentStatus');
        const empty = document.getElementById('equipmentEmpty');
        const inventory = document.getElementById('mmorpgInventoryView');

        if (!playerRes.success) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        myPlayerItems = playerRes.data;
        AppState.myPlayerItems = playerRes.data;
        playerItemSelections = {};

        // Восстанавливаем выбор
        if (playerRes.data.selections) {
            for (const sec in playerRes.data.selections) {
                const v = playerRes.data.selections[sec];
                if (v == null) continue;
                if (typeof v === 'object' && v.id !== undefined) {
                    playerItemSelections[sec] = v;
                } else {
                    playerItemSelections[sec] = { id: v };
                }
            }
        }

        if (playerRes.data.status === 'approved') {
            if (status) status.innerHTML = '<span class="status-badge status-approved">Подтверждено</span>';
            if (form) form.classList.add('hidden');
            if (approvedMsg) approvedMsg.classList.remove('hidden');
            if (inventory) inventory.classList.remove('hidden');
            renderMmorpgInventory();
        } else {
            if (status) status.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
            if (form) form.classList.remove('hidden');
            if (approvedMsg) approvedMsg.classList.add('hidden');
            buildEquipmentTabs();
        }

        if (empty) empty.classList.add('hidden');

    } catch (e) {
        console.error('loadPlayerItems error:', e);
    }
}

function buildEquipmentTabs() {
    const tabs = document.getElementById('equipmentTabs');
    if (!tabs) return;

    let html = '';
    for (const section of equipmentSections) {
        const active = section === currentEquipmentSection ? ' active' : '';
        html += '<button class="tab-btn' + active + '" onclick="selectEquipmentSection(\'' + escapeForOnclick(section) + '\')">' + escapeHtml(section) + '</button>';
    }
    tabs.innerHTML = html;

    if (equipmentSections.length > 0 && !currentEquipmentSection) {
        selectEquipmentSection(equipmentSections[0]);
    }
}

function selectEquipmentSection(section) {
    currentEquipmentSection = section;
    document.querySelectorAll('#equipmentTabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === section);
    });
    renderEquipmentItems();
}

function renderEquipmentItems() {
    const container = document.getElementById('equipmentItemsList');
    if (!container || !currentEquipmentSection) return;

    const items = allItems.filter(i => i.section === currentEquipmentSection);
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет предметов в этом разделе</div>';
        return;
    }

    let html = '';
    for (const item of items) {
        const selected = playerItemSelections[currentEquipmentSection]?.id === item.id;
        html += '<div class="equipment-item' + (selected ? ' selected' : '') + '" onclick="selectEquipmentItem(\'' + escapeForOnclick(item.id) + '\')">';
        html += '<div class="equipment-item-name">' + escapeHtml(item.name) + '</div>';
        html += '<div class="equipment-item-meta">' + escapeHtml(item.tier || '') + ' • ' + escapeHtml(item.color || '') + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function selectEquipmentItem(itemId) {
    if (!currentEquipmentSection) return;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    playerItemSelections[currentEquipmentSection] = { id: itemId, name: item.name };
    renderEquipmentItems();
}

async function savePlayerItems() {
    const msg = document.getElementById('equipmentMessage');

    try {
        showEquipmentMessage(msg, 'Сохранение...', '');
        const res = await api('savePlayerItems', {
            nickname: currentUser,
            selections: playerItemSelections
        });

        if (res.success) {
            showEquipmentMessage(msg, res.message || 'Сохранено', 'success');
            setTimeout(() => loadPlayerItems(), 800);
        } else {
            showEquipmentMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showEquipmentMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function addEquipmentSection() {
    const name = document.getElementById('newSectionName')?.value?.trim();
    if (!name) {
        alert('Введите название');
        return;
    }

    try {
        const res = await api('addEquipmentSection', { name: name });
        if (res.success) {
            alert('✅ ' + (res.message || 'Раздел добавлен'));
            document.getElementById('newSectionName').value = '';
            loadEquipmentSectionsDynamic();
            loadAuctionSectionsDynamic();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

async function deleteEquipmentSection(name) {
    if (!confirm('Удалить раздел "' + name + '"?')) return;

    try {
        const res = await api('deleteEquipmentSection', { name: name });
        if (res.success) {
            alert('✅ ' + (res.message || 'Удалено'));
            loadEquipmentSectionsDynamic();
            loadAuctionSectionsDynamic();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

function showEquipmentMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
