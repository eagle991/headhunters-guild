// ============================================================
// 🔨 АУКЦИОНЫ
// ============================================================

function toggleAuctionTypeFields() {
    const type = document.getElementById('auctionType')?.value;
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
    const list = document.getElementById('craftItemsList');
    if (!list) return;

    try {
        const res = await api('getItems');
        if (!res.success || !res.items) {
            list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        const grouped = {};
        for (const item of res.items) {
            if (!grouped[item.section]) grouped[item.section] = [];
            grouped[item.section].push(item);
        }

        let html = '';
        const sections = Object.keys(grouped).sort();
        for (const section of sections) {
            html += '<div class="craft-section"><div class="craft-section-title">' + escapeHtml(section) + '</div>';
            for (const item of grouped[section]) {
                html += '<label class="craft-item"><input type="checkbox" value="' + escapeHtml(item.id) + '"> ' + escapeHtml(item.name) + '</label>';
            }
            html += '</div>';
        }
        list.innerHTML = html || '<div class="empty-state">Нет предметов</div>';
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function createAuction() {
    const type = document.getElementById('auctionType')?.value;
    const msg = document.getElementById('createAuctionMessage');

    if (!type) {
        showMessage(msg, 'Выберите тип аукциона', 'error');
        return;
    }

    const payload = {
        type: type,
        title: document.getElementById('auctionTitle')?.value?.trim() || '',
        startPrice: Number(document.getElementById('auctionStartPrice')?.value) || 0,
        step: Number(document.getElementById('auctionStep')?.value) || 1,
        duration: Number(document.getElementById('auctionDuration')?.value) || 24,
        description: document.getElementById('auctionDescription')?.value?.trim() || ''
    };

    // Дополнительные поля в зависимости от типа
    if (type === 'equipment' || type === 'standard') {
        payload.section = document.getElementById('auctionSection')?.value || '';
        payload.itemName = document.getElementById('auctionItemName')?.value?.trim() || '';
        payload.itemTier = document.getElementById('auctionItemTier')?.value || '';
        payload.itemColor = document.getElementById('auctionItemColor')?.value || '';
        payload.itemEnhancement = Number(document.getElementById('auctionItemEnhancement')?.value) || 0;
    }

    if (!payload.title) {
        showMessage(msg, 'Введите название', 'error');
        return;
    }

    try {
        showMessage(msg, 'Создание...', '');
        const res = await api('createAuction', payload);

        if (res.success) {
            showMessage(msg, res.message || 'Аукцион создан', 'success');
            setTimeout(() => {
                document.getElementById('createAuctionForm')?.reset();
                loadAuctions();
            }, 1200);
        } else {
            showMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function loadAuctions() {
    const list = document.getElementById('auctionsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getAuctions');
        if (!res.success) {
            list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
            return;
        }

        currentAuctionItems = res.auctions || [];
        renderAuctionsList(currentAuctionItems);
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function renderAuctionsList(auctions) {
    const list = document.getElementById('auctionsList');
    if (!list) return;

    if (!auctions || auctions.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет активных аукционов</div>';
        return;
    }

    let html = '';
    for (const a of auctions) {
        const endTime = new Date(a.endTime);
        const now = new Date();
        const isEnded = endTime <= now;

        html += '<div class="auction-card' + (isEnded ? ' ended' : '') + '">';
        html += '<div class="auction-header">';
        html += '<div class="auction-title">' + escapeHtml(a.title) + '</div>';
        html += '<div class="auction-type">' + getAuctionTypeLabel(a.type) + '</div>';
        html += '</div>';
        html += '<div class="auction-body">';
        html += '<div class="auction-price">Текущая ставка: <b>' + (a.currentBid || a.startPrice) + ' DKP</b></div>';
        if (a.currentBidder) {
            html += '<div class="auction-bidder">Лидер: ' + escapeHtml(a.currentBidder) + '</div>';
        }
        html += '<div class="auction-timer" data-end="' + a.endTime + '">' + formatTimeLeft(endTime) + '</div>';
        html += '</div>';

        if (!isEnded && currentRole !== 'Гость') {
            html += '<div class="auction-actions">';
            html += '<input type="number" class="bid-input" placeholder="Ставка" min="' + ((a.currentBid || a.startPrice) + a.step) + '">';
            html += '<button class="btn-bid" onclick="placeBid(\'' + escapeForOnclick(a.id) + '\', this)">Ставка</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    list.innerHTML = html;
    startAuctionTimers();
}

async function placeBid(auctionId, btn) {
    const card = btn.closest('.auction-card');
    const input = card?.querySelector('.bid-input');
    const amount = Number(input?.value);

    if (!amount || amount <= 0) {
        alert('Введите корректную ставку');
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '...';

    try {
        const res = await api('placeBid', {
            auctionId: auctionId,
            amount: amount,
            nickname: currentUser
        });

        if (res.success) {
            loadAuctions();
            loadMyDkp();
        } else {
            alert(res.message || 'Ошибка ставки');
        }
    } catch (e) {
        alert('Ошибка соединения');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// Вспомогательные функции
function getAuctionTypeLabel(type) {
    const labels = {
        'standard': 'Обычный',
        'equipment': 'Экипировка',
        'craft': 'Крафт',
        'skill': 'Навык'
    };
    return labels[type] || type;
}

function formatTimeLeft(endDate) {
    const diff = endDate - new Date();
    if (diff <= 0) return 'Завершён';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h + 'ч ' + m + 'м';
}

function showMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
