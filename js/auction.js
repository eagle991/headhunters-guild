// ============================================================
// 🔨 АУКЦИОНЫ
// ============================================================

function toggleAuctionTypeFields() {
    const type = document.getElementById('auctionType').value;
    const equipmentFields = document.getElementById('equipmentFields');
    const craftFields = document.getElementById('craftFields');
    const skillFields = document.getElementById('skillFields');
    if (equipmentFields) equipmentFields.style.display = (type === 'equipment' || type === 'standard') ? 'block' : 'none';
    if (craftFields) craftFields.style.display = (type === 'craft') ? 'block' : 'none';
    if (skillFields) skillFields.style.display = (type === 'skill') ? 'block' : 'none';
    if (type === 'craft') loadCraftItemsList();
    if (type === 'skill') loadSkillsForAuction();
    if (type === 'equipment' || type === 'standard') loadAuctionSectionsDynamic();
}

async function loadCraftItemsList() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItems' }), redirect: 'follow' });
        const res = await r.json();
        const list = document.getElementById('craftItemsList');
        if (!list) return;
        const grouped = {};
        for (const item of res.items) {
            if (!grouped[item.section]) grouped[item.section] = [];
            grouped[item.section].push(item);
        }
        let html = '';
        const sections = Object.keys(grouped).sort();
        for (const sec of sections) {
            html += '<div style="font-weight:700;color:var(--accent);font-size:10px;margin:6px 0 3px 0;font-family:var(--font-display);text-transform:uppercase;">' + escapeHtml(sec) + '</div>';
            for (const item of grouped[sec]) {
                const colorEmojis = { 'Белый': '⚪', 'Зеленый': '🟢', 'Синий': '🔵', 'Фиолетовый': '🟣', 'Желтый': '🟡', 'Красный': '🔴' };
                const emoji = colorEmojis[item.color] || '⚪';
                html += '<div class="checkbox-group"><input type="checkbox" id="craft_' + item.id + '" value="' + item.id + '"><label for="craft_' + item.id + '">' + emoji + ' ' + escapeHtml(item.name) + ' (' + escapeHtml(item.tier || 'т0') + ')</label></div>';
            }
        }
        list.innerHTML = html || '<div class="empty-state">Нет предметов</div>';
    } catch (e) { console.error('Ошибка:', e); }
}

async function loadSkillsForAuction() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getSkills' }), redirect: 'follow' });
        const res = await r.json();
        const select = document.getElementById('auctionTargetSkill');
        if (!select) return;
        let html = '<option value="">— Выберите навык —</option>';
        const rarityLabels = { 'common': 'Обычный', 'uncommon': 'Необычный', 'rare': 'Редкий', 'epic': 'Эпический', 'legendary': 'Легендарный' };
        const colorMap = { 'Белый': '⚪', 'Зеленый': '🟢', 'Синий': '🔵', 'Фиолетовый': '🟣', 'Желтый': '🟡', 'Красный': '🔴' };
        for (const skill of res.skills) {
            const rarity = rarityLabels[skill.rarity] || 'Обычный';
            const color = colorMap[skill.color] || '⚪';
            html += '<option value="' + escapeHtml(skill.name) + '">' + color + ' ' + escapeHtml(skill.name) + ' [' + rarity + ']</option>';
        }
        select.innerHTML = html;
    } catch (e) { console.error('Ошибка:', e); }
}

async function loadAuctionItems() {
    const s = document.getElementById('auctionItemSection').value;
    const sel = document.getElementById('auctionItemSelect');
    if (sel) sel.innerHTML = '<option value="">— Сначала выберите раздел —</option>';
    currentAuctionItems = [];
    if (!s) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getItemsWithIcons', section: s }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.items && res.items.length > 0) {
            currentAuctionItems = res.items;
            const colorEmojis = { 'Белый': '⚪', 'Зеленый': '🟢', 'Синий': '🔵', 'Фиолетовый': '🟣', 'Желтый': '🟡', 'Красный': '🔴' };
            let html = '<option value="">— Выберите предмет —</option>';
            for (let i = 0; i < res.items.length; i++) {
                const it = res.items[i];
                const cEmoji = colorEmojis[it.color] || '⚪';
                html += '<option value="' + i + '">' + cEmoji + ' ' + escapeHtml(it.name) + ' (' + escapeHtml(it.tier || 'т0') + ', ' + escapeHtml(it.color) + ')</option>';
            }
            if (sel) sel.innerHTML = html;
        } else if (sel) sel.innerHTML = '<option value="">— Пусто —</option>';
    } catch (e) { if (sel) sel.innerHTML = '<option value="">— Ошибка —</option>'; }
}

function fillAuctionItemDetails() {
    const sel = document.getElementById('auctionItemSelect');
    const i = sel ? sel.value : '';
    const ti = document.getElementById('auctionItemTier');
    const ci = document.getElementById('auctionItemColor');
    const ei = document.getElementById('auctionItemEnhancement');
    const pc = document.getElementById('auctionIsPrime');
    const bc = document.getElementById('auctionIsBoss');
    const ni = document.getElementById('auctionItemName');
    if (i === '' || !currentAuctionItems[i]) {
        if (ti) ti.value = '';
        if (ci) ci.value = '';
        if (ei) ei.value = '';
        if (pc) pc.checked = false;
        if (bc) bc.checked = false;
        if (ni) ni.value = '';
        return;
    }
    const it = currentAuctionItems[i];
    if (ni) ni.value = it.name;
    if (ti) ti.value = it.tier || 'т0';
    if (ci) ci.value = it.color || 'Белый';
    if (ei) ei.value = it.enhancement || 0;
    if (pc) pc.checked = it.isPrime || false;
    if (bc) bc.checked = it.isBoss || false;
}

async function loadPlayersForAuction() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForAuction' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('auctionPlayersList');
        if (!l) return;
        if (res.success && res.players.length > 0) {
            let html = '';
            for (let i = 0; i < res.players.length; i++) {
                const p = res.players[i];
                html += '<div class="checkbox-group"><input type="checkbox" id="player_' + i + '" value="' + escapeHtml(p.nickname) + '"><label for="player_' + i + '">' + renderPlayerNickWithBioColor(p.nickname, p.role, true, true) + ' <span style="color:var(--text-dim);font-size:9px;">(' + escapeHtml(p.role) + ')</span></label></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div style="color:var(--text-dim);">Нет</div>';
    } catch (e) {}
}

async function createAuction() {
    if (currentRole === 'Гость') { alert('👁 Гости не могут создавать аукционы'); return; }
    const auctionType = document.getElementById('auctionType').value;
    const sp = document.getElementById('auctionStartPrice').value;
    const dh = document.getElementById('auctionDuration').value;
    const ma = document.getElementById('auctionMinAttendance').value;
    const po = document.getElementById('auctionPriorityOnly').checked;
    let iname = '', isec = '', itier = '', icol = 'Белый', ienh = 0, ip = false, ib = false, ik = '';
    let craftItems = [], targetSkill = '';
    if (auctionType === 'equipment' || auctionType === 'standard') {
        iname = document.getElementById('auctionItemName').value;
        isec = document.getElementById('auctionItemSection').value;
        itier = document.getElementById('auctionItemTier').value;
        icol = document.getElementById('auctionItemColor').value;
        ienh = document.getElementById('auctionItemEnhancement').value;
        ip = document.getElementById('auctionIsPrime').checked;
        ib = document.getElementById('auctionIsBoss').checked;
        if (!iname || !isec) { alert('Выберите предмет'); return; }
        ik = iname;
    } else if (auctionType === 'craft') {
        const checkboxes = document.querySelectorAll('#craftItemsList input[type="checkbox"]:checked');
        for (let i = 0; i < checkboxes.length; i++) craftItems.push(parseInt(checkboxes[i].value));
        if (craftItems.length === 0) { alert('❌ Выберите хотя бы один предмет'); return; }
        iname = document.getElementById('craftResourceName').value.trim();
        itier = document.getElementById('craftResourceTier').value;
        icol = document.getElementById('craftResourceColor').value;
        isec = 'Крафт-ресурс';
        if (!iname) { alert('❌ Укажите название'); return; }
        ik = iname;
    } else if (auctionType === 'skill') {
        targetSkill = document.getElementById('auctionTargetSkill').value;
        if (!targetSkill) { alert('❌ Выберите навык'); return; }
        iname = targetSkill; isec = 'Навык'; itier = 'Навык'; icol = 'Фиолетовый'; ik = targetSkill;
    }
    if (!sp || !dh) { alert('Укажите цену и длительность'); return; }
    const cbs = document.querySelectorAll('#auctionPlayersList input[type="checkbox"]:checked');
    const ap = [];
    for (let i = 0; i < cbs.length; i++) ap.push(cbs[i].value);
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'createAuction',
                itemName: iname, itemSection: isec, itemTier: itier, itemColor: icol,
                itemEnhancement: Number(ienh), isPrime: ip, isBoss: ib,
                startPrice: Number(sp), durationHours: Number(dh),
                allowedPlayers: ap, minAttendance: Number(ma), priorityOnly: po,
                createdBy: currentUser, itemKey: ik,
                auctionType: auctionType, craftItems: craftItems, targetSkill: targetSkill
            }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); switchAuctionTab('active', { target: document.getElementById('tabAuctionActive') }); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

async function loadAuctionRating() {
    if (!isFeatureEnabled('auctionRating')) {
        const p = document.getElementById('auctionRatingPreview');
        if (p) p.innerHTML = '';
        return;
    }
    const iname = document.getElementById('auctionItemName').value;
    if (!iname) { alert('Сначала выберите предмет'); return; }
    const b = document.getElementById('auctionRatingPreview');
    if (b) b.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionRating', itemKey: iname }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.rating && res.rating.length > 0 && b) {
            let html = '<div class="panel-title" style="font-size:11px;">🎯 Рейтинг участников (топ-20)</div>';
            for (let i = 0; i < res.rating.length; i++) {
                const rt = res.rating[i];
                html += '<div class="auction-rating-item"><div class="auction-rating-pos">#' + (i + 1) + '</div><div><div class="auction-rating-nick">' + renderPlayerNickWithBioColor(rt.nickname, null, true, true) + '</div><div class="auction-rating-info">БМ: ' + Number(rt.bm).toLocaleString('ru-RU') + ' | Посещ.: ' + rt.attendanceRate + '% | DKP: ' + Number(rt.balance).toLocaleString('ru-RU') + '</div></div><div class="auction-rating-score">' + rt.totalScore + '</div></div>';
            }
            b.innerHTML = html;
        } else if (b) b.innerHTML = '<div class="empty-state">Нет данных</div>';
    } catch (e) { if (b) b.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

async function loadActiveAuctions() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getActiveAuctions' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('activeAuctionsList');
        if (!l) return;
        if (res.success && res.auctions.length > 0) {
            const active = res.auctions.filter(function(a) { return !a.isExpired; });
            const expired = res.auctions.filter(function(a) { return a.isExpired; });
            let html = '';
            if (expired.length > 0) {
                html += '<div style="margin-bottom:12px;padding:10px;background:var(--danger-soft);border:1px solid var(--danger);border-radius:var(--radius-md);"><div style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--danger);margin-bottom:6px;">⚠️ ТРЕБУЮТ ЗАВЕРШЕНИЯ (' + expired.length + ')</div></div>';
                for (let i = 0; i < expired.length; i++) html += renderAuctionCard(expired[i], true);
            }
            if (active.length > 0) {
                for (let i = 0; i < active.length; i++) html += renderAuctionCard(active[i], false);
            }
            l.innerHTML = html;
            startCountdowns();
            for (let i = 0; i < res.auctions.length; i++) {
                const a = res.auctions[i];
                loadAuctionItemIcon(a.id, a.itemName, a.itemSection, a.itemColor, 'auctionItemIcon_' + a.id);
            }
        } else l.innerHTML = '<div class="empty-state">Нет активных аукционов</div>';
    } catch (e) { console.error(e); }
}

function renderAuctionCard(a, isExpired) {
    const tl = isExpired ? '<span style="color:var(--danger);font-weight:700;">⏰ ВРЕМЯ ИСТЕКЛО</span>' : getTimeLeft(a.endTime);
    const cc = getColorClass(a.itemColor);
    const ia = a.allowedPlayers.length === 0 || a.allowedPlayers.indexOf(currentUser) !== -1;
    const isGuest = currentRole === 'Гость';
    const cb = ia && a.currentBidder !== currentUser && !isExpired && !isGuest;
    const gb = a.itemGiven ? '<span class="given-badge given">✅ ВЫДАН</span>' : '<span class="given-badge not-given">⚠️ НЕ ВЫДАН</span>';
    const ei = a.extensionsCount > 0 ? '<div style="font-size:9px;color:var(--warning);margin-top:2px;">⏰ Продлений: ' + a.extensionsCount + '/5</div>' : '';
    const es = isExpired ? 'border-color:var(--danger);opacity:0.85;' : '';
    const typeLabels = { 'equipment': '🗡️ Экипировка', 'craft': '🔨 Крафт', 'skill': '✨ Навык', 'standard': '⚖️ Стандарт' };
    const typeBadge = '<span class="auction-type-badge ' + (a.auctionType || 'standard') + '">' + (typeLabels[a.auctionType] || '⚖️ Стандарт') + '</span>';
    let html = '<div class="auction-card" style="' + es + '"><div class="auction-header"><div style="display:flex;gap:8px;align-items:flex-start;"><div class="auction-item-icon" id="auctionItemIcon_' + a.id + '" style="border-color:' + getIconBorderColor(a.itemColor) + ';"><span class="icon-placeholder" style="font-size:6px;">...</span></div><div><div class="auction-title">';
    if (isExpired) html += '<span style="color:var(--danger);font-size:10px;">⚠️ </span>';
    html += '<span class="auction-number-badge">#' + (a.auctionNumber || '?') + '</span>🔨 ' + escapeHtml(a.itemName) + ' ' + typeBadge;
    html += '</div><div style="font-size:9px;color:var(--text-dim);margin-top:2px;">' + escapeHtml(a.itemSection) + ' | ' + escapeHtml(a.itemTier) + ' | <span class="item-badge ' + cc + '">' + escapeHtml(a.itemColor) + '</span>';
    if (a.itemEnhancement > 0) html += ' +' + a.itemEnhancement;
    html += '</div>' + ei + '</div></div><div class="timer-display" id="timer_' + a.id + '" data-end="' + a.endTime + '" style="' + (isExpired ? 'background:var(--danger-soft);border-color:var(--danger);color:var(--danger);animation:none;' : '') + '">' + tl + '</div></div>';
    html += '<div class="auction-info"><div class="auction-info-item"><div class="auction-info-label">Текущая</div><div class="auction-info-value" style="color:var(--dkp);">' + a.currentBid + ' DKP</div>';
    if (a.currentBidder) html += '<div style="font-size:9px;color:var(--accent);">👑 ' + escapeHtml(a.currentBidder) + '</div>';
    else html += '<div style="font-size:9px;color:var(--text-dim);">Ставок нет</div>';
    html += '</div><div class="auction-info-item"><div class="auction-info-label">Мин. ставка</div><div class="auction-info-value" style="color:var(--success);">' + (a.currentBid + 1) + ' DKP</div></div></div>';
    html += '<div style="margin-bottom:6px;">' + gb + '</div>';
    if (isGuest && !isExpired) html += '<div class="guest-only-notice">👁 Гости не могут делать ставки. <a href="#" onclick="showUpgradeToPlayerModal();return false;" style="color:var(--accent);">Стать игроком →</a></div>';
    html += '<div class="action-buttons">';
    if (!isExpired) html += '<button class="btn-compare" onclick="openBidModal(\'' + escapeForOnclick(a.id) + '\')" ' + (!cb ? 'disabled style="opacity:0.5;"' : '') + '>💰 Ставка</button>';
    if (currentRole === 'Админ' || currentRole === 'Модератор') {
        html += '<button class="btn-remove" onclick="cancelAuction(\'' + escapeForOnclick(a.id) + '\')">✕ Отмена</button>';
        html += '<button class="btn-approve" onclick="completeAuction(\'' + escapeForOnclick(a.id) + '\')">✓ Завершить</button>';
        html += '<button class="btn-edit" style="width:auto;margin-top:0;" onclick="markItemGiven(\'' + escapeForOnclick(a.id) + '\',' + (!a.itemGiven) + ')">' + (a.itemGiven ? '↩ Отменить' : '✓ Выдать') + '</button>';
    }
    html += '</div></div>';
    return html;
}

async function loadCompletedAuctions() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getCompletedAuctions' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('completedAuctionsList');
        if (!l) return;
        if (res.success && res.auctions.length > 0) {
            let html = '';
            for (let i = 0; i < res.auctions.length; i++) {
                const a = res.auctions[i];
                const cc = getColorClass(a.itemColor);
                const st = a.status === 'completed' ? '✅ Завершён' : '❌ Отменён';
                const sc = a.status === 'completed' ? 'var(--success)' : 'var(--danger)';
                const gb = a.itemGiven ? '<span class="given-badge given">✅ Выдан</span>' : '<span class="given-badge not-given">⚠️ Не выдан</span>';
                const typeLabels = { 'equipment': '🗡️', 'craft': '🔨', 'skill': '✨', 'standard': '⚖️' };
                const typeBadge = '<span class="auction-type-badge ' + (a.auctionType || 'standard') + '">' + (typeLabels[a.auctionType] || '⚖️') + '</span>';
                html += '<div class="player-card"><div class="player-card-header"><div style="display:flex;gap:8px;align-items:flex-start;"><div class="auction-item-icon" id="completedItemIcon_' + a.id + '_' + i + '" style="border-color:' + getIconBorderColor(a.itemColor) + ';"><span class="icon-placeholder" style="font-size:6px;">...</span></div><div><div class="player-nick" style="color:var(--dkp);font-size:12px;"><span class="auction-number-badge">#' + (a.auctionNumber || '?') + '</span>🔨 ' + escapeHtml(a.itemName) + ' ' + typeBadge + '</div><div style="font-size:9px;color:var(--text-dim);margin-top:2px;">' + escapeHtml(a.itemSection) + ' | ' + escapeHtml(a.itemTier) + ' | <span class="item-badge ' + cc + '">' + escapeHtml(a.itemColor) + '</span></div></div></div><div style="text-align:right;"><div style="font-size:9px;color:var(--text-dim);">Победитель:</div><div style="font-size:12px;color:var(--accent);font-weight:700;">🏆 ' + escapeHtml(a.currentBidder || 'Нет') + '</div><div style="font-size:11px;color:var(--dkp);font-weight:700;">' + a.currentBid + ' DKP</div></div></div>';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);flex-wrap:wrap;gap:4px;"><div style="font-size:9px;color:' + sc + ';font-weight:700;">' + st + ' | ' + escapeHtml(a.endTime) + '</div><div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">' + gb;
                if ((currentRole === 'Админ' || currentRole === 'Модератор') && a.status === 'completed') {
                    html += '<button class="btn-edit" style="width:auto;margin-top:0;font-size:9px;padding:3px 6px;" onclick="markItemGiven(\'' + escapeForOnclick(a.id) + '\',' + (!a.itemGiven) + ')">' + (a.itemGiven ? '↩ Отменить' : '✓ Выдать') + '</button>';
                    html += '<button class="btn-edit" style="width:auto;margin-top:0;font-size:9px;padding:3px 6px;" onclick="openEditCompletedAuctionModal(\'' + escapeForOnclick(a.id) + '\')">✎ Ред.</button>';
                    html += '<button class="btn-remove" style="padding:3px 6px;" onclick="deleteCompletedAuction(\'' + escapeForOnclick(a.id) + '\')">🗑</button>';
                }
                html += '</div></div></div>';
            }
            l.innerHTML = html;
            for (let i = 0; i < res.auctions.length; i++) {
                const a = res.auctions[i];
                loadAuctionItemIcon('completed_' + a.id + '_' + i, a.itemName, a.itemSection, a.itemColor, 'completedItemIcon_' + a.id + '_' + i);
            }
        } else l.innerHTML = '<div class="empty-state">Нет завершённых аукционов</div>';
    } catch (e) { console.error(e); }
}

async function deleteCompletedAuction(id) {
    if (!confirm('Удалить завершённый аукцион?\n\n⚠️ DKP будут возвращены!')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteCompletedAuction', auctionId: id, role: currentRole, requestedBy: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert('✅ ' + res.message); loadCompletedAuctions(); loadRecentWinners(); loadMyDkp(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function openEditCompletedAuctionModal(id) {
    currentEditAuctionId = id;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const res = await r.json();
        const sel = document.getElementById('editAuctionWinner');
        if (res.success && sel) {
            let html = '<option value="">— Выберите —</option>';
            for (let i = 0; i < res.nicks.length; i++) html += '<option value="' + escapeHtml(res.nicks[i]) + '">' + escapeHtml(res.nicks[i]) + '</option>';
            sel.innerHTML = html;
        }
    } catch (e) {}
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionDetails', auctionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const a = res.auction;
            const info = document.getElementById('editAuctionInfo');
            if (info) info.innerHTML = '<div style="font-weight:700;">#' + a.auctionNumber + ' — ' + escapeHtml(a.itemName) + '</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px;">Победитель: <b style="color:var(--accent);">' + escapeHtml(a.currentBidder || 'Нет') + '</b> | Сумма: <b style="color:var(--dkp);">' + a.currentBid + ' DKP</b></div>';
            const winner = document.getElementById('editAuctionWinner');
            if (winner) winner.value = a.currentBidder || '';
            const amount = document.getElementById('editAuctionAmount');
            if (amount) amount.value = a.currentBid;
        }
    } catch (e) {}
    document.getElementById('editAuctionModal').classList.remove('hidden');
}

function closeEditAuctionModal() {
    document.getElementById('editAuctionModal').classList.add('hidden');
    currentEditAuctionId = null;
}

async function saveCompletedAuctionEdit() {
    if (!currentEditAuctionId) return;
    const nw = document.getElementById('editAuctionWinner').value;
    const na = document.getElementById('editAuctionAmount').value;
    const m = document.getElementById('editAuctionMessage');
    if (!nw) { if (m) { m.className = 'message error'; m.innerText = 'Выберите победителя'; m.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'editCompletedAuction', auctionId: currentEditAuctionId, newWinner: nw, newAmount: Number(na), role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ ' + res.message; m.style.display = 'block'; setTimeout(function() { closeEditAuctionModal(); loadCompletedAuctions(); loadRecentWinners(); loadMyDkp(); }, 1500); }
            else { m.className = 'message error'; m.innerText = '❌ ' + res.message; m.style.display = 'block'; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = '❌ Ошибка'; m.style.display = 'block'; } }
}

async function loadAuctionItemIcon(hid, iname, isec, icol, cid) {
    try {
        const it = allItems.find(function(i) { return i.name === iname && i.section === isec; });
        if (it) await loadAndDisplayIcon('item', it.id, cid, icol);
        else { const c = document.getElementById(cid); if (c) c.innerHTML = '📦'; }
    } catch (e) {}
}

async function openBidModal(id) {
    if (currentRole === 'Гость') { alert('👁 Гости не могут делать ставки'); return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionDetails', auctionId: id, bidder: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) { alert('Ошибка: ' + res.message); return; }
        const a = res.auction;
        const mb = a.currentBid + 1;
        const cc = getColorClass(a.itemColor);
        const bi = a.playerBalance || { total: 0, frozen: 0, available: 0 };
        const ca = bi.available >= mb;
        if (bidCooldownInterval) { clearInterval(bidCooldownInterval); bidCooldownInterval = null; }
        if (auctionEndInterval) { clearInterval(auctionEndInterval); auctionEndInterval = null; }
        const now = Date.now();
        const nextBidAt = a.nextBidAvailableAt || 0;
        const inCooldown = nextBidAt > now;
        const endTimeMs = new Date(a.endTime).getTime();
        const timeToEndMs = endTimeMs - now;
        let priorityWarning = '';
        let canBid = ca && !inCooldown;
        if (a.eligibility && !a.eligibility.eligible) {
            priorityWarning = '<div class="last-bid-warning"><div class="warning-icon">⛔</div><div class="warning-title">Вы не можете участвовать</div><div class="warning-text">' + escapeHtml(a.eligibility.reason) + '</div></div>';
            canBid = false;
        }
        let cooldownHtml = '';
        if (inCooldown) cooldownHtml = '<div class="cooldown-block" id="cooldownBlock"><div class="cooldown-title">⏳ Кулдаун</div><div class="cooldown-timer" id="cooldownTimer">--:--</div></div>';
        let endTimerHtml = '<div class="auction-end-timer' + (timeToEndMs < 5 * 60 * 1000 ? ' urgent' : '') + '" id="auctionEndTimer"><div style="color:var(--text-dim);font-size:9px;">До окончания:</div><div class="time-left" id="auctionEndTimeLeft">--:--:--</div></div>';
        let subscribeHtml = '<div class="auction-subscribe-bar" id="auctionSubscribeBar"><div class="subscribe-hint">🔔 <b>Подписка на аукцион</b> — получайте уведомления</div><button class="subscribe-btn" id="auctionSubscribeBtn" onclick="toggleAuctionSubscription(\'' + escapeForOnclick(a.id) + '\')">Загрузка...</button><div class="subscribers-count">👥 <span class="count-value" id="auctionSubscribersCount">—</span></div></div>';
        let content = '<h3 style="color:var(--dkp);font-family:var(--font-display);margin-bottom:10px;font-size:14px;"><span class="auction-number-badge">#' + (a.auctionNumber || '?') + '</span> 🔨 ' + escapeHtml(a.itemName) + '</h3>';
        content += subscribeHtml;
        content += endTimerHtml;
        content += priorityWarning;
        content += cooldownHtml;
        content += '<div style="margin-bottom:10px;"><div style="font-size:9px;color:var(--text-dim);margin-bottom:2px;">Характеристики:</div><div style="font-size:11px;">' + escapeHtml(a.itemSection) + ' | ' + escapeHtml(a.itemTier) + ' | <span class="item-badge ' + cc + '">' + escapeHtml(a.itemColor) + '</span>';
        if (a.itemEnhancement > 0) content += ' +' + a.itemEnhancement;
        if (a.isPrime) content += '<span class="item-badge prime">Прайм</span>';
        if (a.isBoss) content += '<span class="item-badge boss">Босс</span>';
        content += '</div></div>';
        content += '<div style="margin-bottom:8px;"><div style="font-size:9px;color:var(--text-dim);">Текущая ставка:</div><div style="font-size:18px;color:var(--dkp);font-weight:700;">' + a.currentBid + ' DKP</div>';
        if (a.currentBidder) content += '<div style="font-size:9px;color:var(--accent);">👑 ' + escapeHtml(a.currentBidder) + '</div>';
        content += '</div>';
        content += '<div style="margin-bottom:10px;"><div style="font-size:9px;color:var(--text-dim);">Мин. ставка:</div><div style="font-size:14px;color:var(--success);font-weight:700;">' + mb + ' DKP</div></div>';
        content += '<div style="margin-bottom:10px;padding:8px;background:var(--bg-soft);border-radius:var(--radius-sm);border:1px solid var(--border);"><div style="font-size:9px;color:var(--text-dim);margin-bottom:4px;font-weight:700;">💰 ВАШ БАЛАНС</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;"><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:var(--text-dim);">Всего</div><div style="font-size:12px;color:var(--accent);font-weight:700;">' + bi.total + '</div></div><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:var(--warning);">Замор.</div><div style="font-size:12px;color:var(--warning);font-weight:700;">' + bi.frozen + '</div></div><div style="text-align:center;padding:4px;background:var(--bg-panel);border-radius:var(--radius-sm);"><div style="font-size:8px;color:' + (ca ? 'var(--success)' : 'var(--danger)') + ';">Своб.</div><div style="font-size:12px;color:' + (ca ? 'var(--success)' : 'var(--danger)') + ';font-weight:700;">' + bi.available + '</div></div></div>';
        if (!ca) content += '<div style="font-size:9px;color:var(--danger);text-align:center;padding:4px;background:var(--danger-soft);border-radius:var(--radius-sm);margin-top:4px;">⚠️ Недостаточно DKP</div>';
        content += '</div>';
        content += '<div class="form-group"><label>Ваша ставка (мин. ' + mb + ')</label><input type="number" id="bidAmount" min="' + mb + '" max="' + bi.available + '" placeholder="' + mb + '" required ' + (!canBid ? 'disabled' : '') + '>';
        if (!ca) content += '<div style="font-size:9px;color:var(--danger);margin-top:2px;">Недостаточно DKP</div>';
        if (inCooldown) content += '<div style="font-size:9px;color:var(--warning);margin-top:2px;">⏳ Дождитесь окончания кулдауна</div>';
        content += '</div>';
        const btnDisabled = !canBid ? 'disabled style="opacity:0.5;"' : '';
        content += '<button type="button" class="submit-btn dkp-btn" id="placeBidBtn" onclick="placeBid(\'' + escapeForOnclick(a.id) + '\',' + mb + ')" ' + btnDisabled + '>💰 Сделать ставку</button>';
        const modalContent = document.getElementById('bidModalContent');
        if (modalContent) modalContent.innerHTML = content;
        document.getElementById('bidModal').classList.remove('hidden');
        if (inCooldown) startBidCooldownTimer(nextBidAt);
        startAuctionEndTimer(endTimeMs);
        loadAuctionSubscriptionStatus(id);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

function closeBidModal() {
    document.getElementById('bidModal').classList.add('hidden');
    if (bidCooldownInterval) { clearInterval(bidCooldownInterval); bidCooldownInterval = null; }
    if (auctionEndInterval) { clearInterval(auctionEndInterval); auctionEndInterval = null; }
}

async function placeBid(id, mb) {
    if (currentRole === 'Гость') { alert('👁 Гости не могут делать ставки'); return; }
    const a = document.getElementById('bidAmount').value;
    if (!a || Number(a) < mb) { alert('Мин. ' + mb + ' DKP'); return; }
    if (!confirm('Ставка ' + a + ' DKP?\n\n⏳ После этой ставки — кулдаун 5 минут.')) return;
    const btn = document.getElementById('placeBidBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loader"></span> Обработка...'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'placeBid', auctionId: id, bidder: currentUser, amount: Number(a) }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            alert('✅ ' + res.message);
            closeBidModal();
            loadActiveAuctions();
            loadMyDkp();
        } else {
            if (res.cooldownSeconds) {
                const min = Math.floor(res.cooldownSeconds / 60);
                const sec = res.cooldownSeconds % 60;
                alert('⏳ ' + res.message + '\n\nПодождите ' + min + ' мин ' + sec + ' сек.');
                if (res.nextBidAvailableAt) startBidCooldownTimer(res.nextBidAvailableAt);
            } else alert('❌ ' + res.message);
            if (btn) { btn.disabled = false; btn.innerHTML = '💰 Сделать ставку'; }
        }
    } catch (e) { alert('❌ Ошибка: ' + e.message); if (btn) { btn.disabled = false; btn.innerHTML = '💰 Сделать ставку'; } }
}

function startBidCooldownTimer(nextBidAt) {
    function updateCooldown() {
        const now = Date.now();
        const remaining = nextBidAt - now;
        const timerEl = document.getElementById('cooldownTimer');
        const btn = document.getElementById('placeBidBtn');
        const input = document.getElementById('bidAmount');
        if (!timerEl) { clearInterval(bidCooldownInterval); bidCooldownInterval = null; return; }
        if (remaining <= 0) {
            clearInterval(bidCooldownInterval);
            bidCooldownInterval = null;
            timerEl.innerText = '✅ Готово';
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            if (input) input.disabled = false;
            return;
        }
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        timerEl.innerText = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }
    updateCooldown();
    bidCooldownInterval = setInterval(updateCooldown, 1000);
}

function startAuctionEndTimer(endTimeMs) {
    function updateEndTimer() {
        const now = Date.now();
        const remaining = endTimeMs - now;
        const el = document.getElementById('auctionEndTimeLeft');
        const container = document.getElementById('auctionEndTimer');
        if (!el) { clearInterval(auctionEndInterval); auctionEndInterval = null; return; }
        if (remaining <= 0) {
            el.innerText = '⏰ ВРЕМЯ ИСТЕКЛО';
            el.style.color = 'var(--danger)';
            clearInterval(auctionEndInterval);
            auctionEndInterval = null;
            return;
        }
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        el.innerText = (h > 0 ? h + 'ч ' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        if (container && remaining < 5 * 60 * 1000) container.classList.add('urgent');
    }
    updateEndTimer();
    auctionEndInterval = setInterval(updateEndTimer, 1000);
}

async function loadAuctionSubscriptionStatus(auctionId) {
    const bar = document.getElementById('auctionSubscribeBar');
    if (!bar) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionSubscriptionStatus', auctionId: auctionId, playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            const btn = document.getElementById('auctionSubscribeBtn');
            const count = document.getElementById('auctionSubscribersCount');
            if (btn) {
                if (res.subscribed) { btn.classList.add('subscribed'); btn.innerText = 'Отписаться'; btn.title = 'Вы подписаны'; }
                else { btn.classList.remove('subscribed'); btn.innerText = 'Подписаться'; btn.title = 'Получать уведомления'; }
            }
            if (count) count.innerText = res.subscribersCount;
        }
    } catch (e) { console.error(e); }
}

async function toggleAuctionSubscription(auctionId) {
    const btn = document.getElementById('auctionSubscribeBtn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    const isSubscribed = btn && btn.classList.contains('subscribed');
    const action = isSubscribed ? 'unsubscribeFromAuction' : 'subscribeToAuction';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: action, auctionId: auctionId, playerName: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) await loadAuctionSubscriptionStatus(auctionId);
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
    finally { if (btn) { btn.disabled = false; btn.style.opacity = '1'; } }
}

async function cancelAuction(id) {
    if (!confirm('Отменить?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'cancelAuction', auctionId: id, cancelledBy: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert(res.message); loadActiveAuctions(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function completeAuction(id) {
    if (!confirm('Завершить аукцион вручную?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'completeAuction', auctionId: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert(res.message); loadActiveAuctions(); loadCompletedAuctions(); loadRecentWinners(); loadMyLootHistory(); loadMyDkp(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function markItemGiven(id, g) {
    if (!confirm((g ? 'Выдать' : 'Отменить выдачу') + '?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'markItemGiven', auctionId: id, given: g, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { alert(res.message); loadActiveAuctions(); loadCompletedAuctions(); loadRecentWinners(); loadMyLootHistory(); }
        else alert('Ошибка: ' + res.message);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

function getTimeLeft(et) {
    const e = new Date(et);
    const n = new Date();
    const d = e - n;
    if (d <= 0) return '<span style="color:var(--danger);font-weight:700;">⏰ ВРЕМЯ ИСТЕКЛО</span>';
    const h = Math.floor(d / (1000 * 60 * 60));
    const m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((d % (1000 * 60)) / 1000);
    return h + 'ч ' + m + 'м ' + s + 'с';
}

function startCountdowns() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function() {
        const timers = document.querySelectorAll('[data-end]');
        for (let i = 0; i < timers.length; i++) {
            const el = timers[i];
            const et = el.getAttribute('data-end');
            if (et) {
                const nc = getTimeLeft(et);
                if (el.innerHTML.indexOf('ВРЕМЯ ИСТЕКЛО') === -1 || nc.indexOf('ВРЕМЯ ИСТЕКЛО') === -1) el.innerHTML = nc;
            }
        }
    }, 1000);
}

async function loadRecentWinners() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionHistory', limit: 10 }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) return;
        recentAuctionHistory = res.history || [];
        const hb = document.getElementById('recentWinnersBlock');
        if (hb) {
            if (recentAuctionHistory.length > 0) {
                let html = '';
                for (let i = 0; i < recentAuctionHistory.length; i++) {
                    const h = recentAuctionHistory[i];
                    const bc = getIconBorderColor(h.itemColor);
                    const gb = h.itemGiven ? '<span class="given-badge given" style="font-size:8px;">✅</span>' : '<span class="given-badge not-given" style="font-size:8px;">⚠️</span>';
                    html += '<div class="history-winner-card"><div class="winner-icon" style="border-color:' + bc + ';" id="winnerIcon_' + h.id + '"><span class="icon-placeholder" style="font-size:6px;">...</span></div><div class="winner-info"><div class="winner-nick"><span class="nick-with-color" style="cursor:pointer;" onclick="viewPlayerCabinet(\'' + escapeForOnclick(h.winner) + '\')">' + escapeHtml(h.winner) + '</span><span style="font-size:9px;color:var(--text-dim);margin-left:4px;">— аукцион #' + h.auctionNumber + '</span></div><div class="winner-item">' + escapeHtml(h.itemName) + ' (' + escapeHtml(h.itemSection) + ', ' + escapeHtml(h.itemTier) + ', ' + escapeHtml(h.itemColor) + ')</div><div style="font-size:9px;color:var(--text-dim);margin-top:1px;">' + escapeHtml(h.winDate) + '</div></div><div class="winner-amount">' + h.winAmount + ' DKP</div>' + gb + '</div>';
                }
                hb.innerHTML = html;
                for (let i = 0; i < recentAuctionHistory.length; i++) {
                    const h = recentAuctionHistory[i];
                    loadAuctionItemIcon(h.id, h.itemName, h.itemSection, h.itemColor, 'winnerIcon_' + h.id);
                }
            } else hb.innerHTML = '<div class="empty-state">Пока нет победителей</div>';
        }
        const ab = document.getElementById('auctionRecentWins');
        if (ab) ab.innerHTML = hb ? hb.innerHTML : '';
    } catch (e) {}
}

// ============================================================
// ⚙️ НАСТРОЙКИ АУКЦИОНА
// ============================================================

async function loadAuctionSettings() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAuctionSettings' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.settings) {
            const s = res.settings;
            const el1 = document.getElementById('auctionRepeatBanEnabled'); if (el1) el1.checked = s.repeatBanEnabled;
            const el2 = document.getElementById('auctionRepeatBanPeriod'); if (el2) el2.value = s.repeatBanPeriod;
            const el3 = document.getElementById('auctionRepeatBanDays'); if (el3) el3.value = s.repeatBanDays;
            const el4 = document.getElementById('auctionCoefficientEnabled'); if (el4) el4.checked = s.coefficientEnabled;
            const el5 = document.getElementById('auctionCoefficientMode'); if (el5) el5.value = s.coefficientMode;
            const el6 = document.getElementById('auctionCoefficientList'); if (el6) el6.value = (s.coefficientSelectiveList || []).join(', ');
            const cdr = document.getElementById('customDaysRow'); if (cdr) cdr.style.display = s.repeatBanPeriod === 'custom_days' ? 'flex' : 'none';
            const slr = document.getElementById('selectiveListRow'); if (slr) slr.style.display = s.coefficientMode === 'selective' ? 'flex' : 'none';
            const ae = document.getElementById('auctionAutoExtendEnabled'); if (ae) ae.checked = s.autoExtendEnabled || false;
            const rp = document.getElementById('auctionRepeatPurchaseCoefEnabled'); if (rp) rp.checked = s.repeatPurchaseCoefEnabled || false;
            const bc = document.getElementById('auctionRepeatPurchaseBaseCoef'); if (bc) bc.value = s.repeatPurchaseBaseCoef || 1.5;
            const mc = document.getElementById('auctionRepeatPurchaseMaxCount'); if (mc) mc.value = s.repeatPurchaseMaxCount || 5;
            const arsp = document.getElementById('allowRepeatSkillPurchase'); if (arsp) arsp.checked = s.allowRepeatSkillPurchase || false;
            updateRepeatPurchasePreview();
        }
    } catch (e) {}
}

async function saveAuctionSettings() {
    const m = document.getElementById('auctionSettingsMessage');
    const ls = document.getElementById('auctionCoefficientList').value;
    const sl = ls ? ls.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
    const ae = document.getElementById('auctionAutoExtendEnabled');
    const rp = document.getElementById('auctionRepeatPurchaseCoefEnabled');
    const bc = document.getElementById('auctionRepeatPurchaseBaseCoef');
    const mc = document.getElementById('auctionRepeatPurchaseMaxCount');
    const arsp = document.getElementById('allowRepeatSkillPurchase');
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveAuctionSettings',
                repeatBanEnabled: document.getElementById('auctionRepeatBanEnabled').checked,
                repeatBanPeriod: document.getElementById('auctionRepeatBanPeriod').value,
                repeatBanDays: Number(document.getElementById('auctionRepeatBanDays').value),
                coefficientEnabled: document.getElementById('auctionCoefficientEnabled').checked,
                coefficientMode: document.getElementById('auctionCoefficientMode').value,
                coefficientSelectiveList: sl,
                autoExtendEnabled: ae ? ae.checked : false,
                repeatPurchaseCoefEnabled: rp ? rp.checked : false,
                repeatPurchaseBaseCoef: bc ? Number(bc.value) : 1.5,
                repeatPurchaseMaxCount: mc ? Number(mc.value) : 5,
                allowRepeatSkillPurchase: arsp ? arsp.checked : false
            }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (m) {
            if (res.success) { m.className = 'message success'; m.innerText = '✅ Настройки сохранены'; }
            else { m.className = 'message error'; m.innerText = res.message; }
        }
    } catch (e) { if (m) { m.className = 'message error'; m.innerText = 'Ошибка связи'; } }
    if (m) { m.style.display = 'block'; setTimeout(function() { m.style.display = 'none'; }, 3000); }
}

function updateRepeatPurchasePreview() {
    const bc = document.getElementById('auctionRepeatPurchaseBaseCoef');
    if (!bc) return;
    const v = parseFloat(bc.value) || 1.5;
    const pb = document.getElementById('previewBaseCoef');
    if (pb) pb.innerText = v.toFixed(1);
    const p3 = document.getElementById('previewCoef3');
    if (p3) p3.innerText = (v * 2).toFixed(1);
    const p4 = document.getElementById('previewCoef4');
    if (p4) p4.innerText = (v * 3).toFixed(1);
    const p5 = document.getElementById('previewCoef5');
    if (p5) p5.innerText = (v * 4).toFixed(1);
}
