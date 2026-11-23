async function loadPlayerItems() {
    if (!currentUser) return;

    try {
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
        if (typeof AppState !== 'undefined') AppState.myPlayerItems = playerRes.data;
        playerItemSelections = {};

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
            if (typeof renderMmorpgInventory === 'function') renderMmorpgInventory();
        } else {
            if (status) status.innerHTML = '<span class="status-badge status-pending">На проверке</span>';
            if (form) form.classList.remove('hidden');
            if (approvedMsg) approvedMsg.classList.add('hidden');
            if (inventory) inventory.classList.add('hidden');
            
            // Важно: строим вкладки экипировки
            if (typeof buildEquipmentTabs === 'function') buildEquipmentTabs();
        }

        if (empty) empty.classList.add('hidden');

    } catch (e) {
        console.error('loadPlayerItems error:', e);
    }
}

function buildEquipmentTabs() {
    const tabs = document.getElementById('equipmentTabs');
    if (!tabs) {
        console.warn('equipmentTabs не найден');
        return;
    }

    if (!equipmentSections || equipmentSections.length === 0) {
        tabs.innerHTML = '<div class="empty-state">Нет разделов экипировки</div>';
        return;
    }

    let html = '';
    for (const section of equipmentSections) {
        const active = section === currentEquipmentSection ? ' active' : '';
        html += '<button class="tab-btn' + active + '" onclick="selectEquipmentSection(\'' + escapeForOnclick(section) + '\')">' + escapeHtml(section) + '</button>';
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
    
    document.querySelectorAll('#equipmentTabs .tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.textContent === section);
    });
    
    renderEquipmentItems();
}

function renderEquipmentItems() {
    const container = document.getElementById('equipmentItemsList');
    if (!container) {
        console.warn('equipmentItemsList не найден');
        return;
    }
    
    if (!currentEquipmentSection) {
        container.innerHTML = '<div class="empty-state">Выберите раздел</div>';
        return;
    }

    const items = (allItems || []).filter(function(i) { return i.section === currentEquipmentSection; });
    
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
    const item = (allItems || []).find(function(i) { return i.id === itemId; });
    if (!item) return;

    playerItemSelections[currentEquipmentSection] = { id: itemId, name: item.name };
    renderEquipmentItems();
}

// Экспорт
window.loadPlayerItems = loadPlayerItems;
window.buildEquipmentTabs = buildEquipmentTabs;
window.selectEquipmentSection = selectEquipmentSection;
window.renderEquipmentItems = renderEquipmentItems;
window.selectEquipmentItem = selectEquipmentItem;
