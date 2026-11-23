// ============================================================
// 🗂️ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================

function switchMainTab(tab, event) {
    // Снимаем активность со всех кнопок
    document.querySelectorAll('#mainTabs .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Список всех вкладок
    const tabs = ['home', 'cabinet', 'dkp', 'auction', 'queue', 'calendar', 'players', 'guilds', 'analytics', 'info', 'guildAdmin', 'admin'];

    for (const t of tabs) {
        const content = document.getElementById(t + 'Content');
        if (content) {
            if (t === tab) content.classList.remove('hidden');
            else content.classList.add('hidden');
        }
    }

    // Показ/скрытие админских кнопок
    const tabAuctionCreate = document.getElementById('tabAuctionCreate');
    if (tabAuctionCreate) {
        tabAuctionCreate.classList.toggle('hidden', !(currentRole === 'Админ' || currentRole === 'Модератор'));
    }

    const tabQueueAdd = document.getElementById('tabQueueAdd');
    if (tabQueueAdd) {
        tabQueueAdd.classList.toggle('hidden', !(currentRole === 'Админ' || currentRole === 'Модератор'));
    }

    // Загрузка данных при переключении
    loadTabData(tab);
}

function loadTabData(tab) {
    switch (tab) {
        case 'home':
            loadPublicTops();
            loadAnnouncements();
            loadTodayActivity();
            loadWeeklyActivity();
            loadEventStats();
            loadRecentWinners();
            break;

        case 'cabinet':
            loadPlayerData();
            loadPlayerItems();
            loadPlayerSkills();
            loadCharacterScreenshots();
            break;

        case 'dkp':
            loadMyDkp();
            loadPlayerLootHistory();
            break;

        case 'auction':
            loadAuctions();
            break;

        case 'queue':
            loadQueueItems();
            break;

        case 'calendar':
            loadCalendarPlayers();
            loadCalendar();
            break;

        case 'players':
            loadAllPlayers();
            break;

        case 'guilds':
            loadMyGuild();
            loadGuilds();
            loadGuildsRating();
            break;

        case 'analytics':
            loadAnalytics();
            break;

        case 'info':
            loadInfoContent();
            break;

        case 'guildAdmin':
            if (typeof loadGuildAdmin === 'function') loadGuildAdmin();
            break;

        case 'admin':
            if (typeof loadPendingPlayers === 'function') loadPendingPlayers();
            if (typeof loadPendingSkills === 'function') loadPendingSkills();
            if (typeof loadAdminAnnouncements === 'function') loadAdminAnnouncements();
            break;
    }
}

function switchAuctionTab(tab, event) {
    document.querySelectorAll('#auctionTabs .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    const contents = ['auctionList', 'auctionCreate', 'auctionHistory', 'auctionSettings'];
    for (const c of contents) {
        const el = document.getElementById(c + 'Content');
        if (el) {
            el.classList.toggle('hidden', c !== tab);
        }
    }

    if (tab === 'auctionList') loadAuctions();
    if (tab === 'auctionHistory') loadAuctionHistory();
    if (tab === 'auctionSettings') loadAuctionSettings();
}

function switchDkpTab(tab, event) {
    document.querySelectorAll('#dkpTabs .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    const contents = ['dkpBalance', 'dkpSubmit', 'dkpHistory', 'dkpSettings'];
    for (const c of contents) {
        const el = document.getElementById(c + 'Content');
        if (el) {
            el.classList.toggle('hidden', c !== tab);
        }
    }

    if (tab === 'dkpBalance') loadMyDkp();
    if (tab === 'dkpHistory') loadPlayerLootHistory();
}

function showSkillsEditForm() {
    document.getElementById('skillsApprovedMessage')?.classList.add('hidden');
    document.getElementById('approvedSkillsList')?.classList.add('hidden');
    document.getElementById('skillsForm')?.classList.remove('hidden');
}

function showEquipmentEditForm() {
    document.getElementById('mmorpgInventoryView')?.classList.add('hidden');
    document.getElementById('equipmentApprovedMessage')?.classList.add('hidden');
    document.getElementById('equipmentForm')?.classList.remove('hidden');

    if (typeof buildEquipmentTabs === 'function') buildEquipmentTabs();
    if (equipmentSections.length > 0 && !currentEquipmentSection) {
        selectEquipmentSection(equipmentSections[0]);
    } else if (typeof renderEquipmentItems === 'function') {
        renderEquipmentItems();
    }
}

function backToInventory() {
    document.getElementById('equipmentForm')?.classList.add('hidden');
    const inv = document.getElementById('mmorpgInventoryView');
    if (inv) {
        inv.classList.remove('hidden');
        if (typeof renderMmorpgInventory === 'function') renderMmorpgInventory();
    }

    const approvedMsg = document.getElementById('equipmentApprovedMessage');
    if (approvedMsg && myPlayerItems && myPlayerItems.status === 'approved') {
        approvedMsg.classList.remove('hidden');
    }
}
