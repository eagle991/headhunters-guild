// ============================================================
// 🗂️ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================

function switchMainTab(tab, event) {
    document.querySelectorAll('#mainTabs .tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    const tabs = ['home', 'cabinet', 'dkp', 'auction', 'queue', 'calendar', 'players', 'guilds', 'analytics', 'info', 'guildAdmin', 'admin'];

    for (const t of tabs) {
        const content = document.getElementById(t + 'Content');
        if (content) {
            if (t === tab) content.classList.remove('hidden');
            else content.classList.add('hidden');
        }
    }

    const isAdmin = currentRole === 'Админ' || currentRole === 'Модератор';

    const tabAuctionCreate = document.getElementById('tabAuctionCreate');
    if (tabAuctionCreate) {
        tabAuctionCreate.classList.toggle('hidden', !isAdmin);
    }

    const tabQueueAdd = document.getElementById('tabQueueAdd');
    if (tabQueueAdd) {
        tabQueueAdd.classList.toggle('hidden', !isAdmin);
    }

    const tabAdmin = document.getElementById('tabAdmin');
    if (tabAdmin) {
        tabAdmin.style.display = isAdmin ? '' : 'none';
    }

    const tabGuildAdmin = document.getElementById('tabGuildAdmin');
    if (tabGuildAdmin) {
        tabGuildAdmin.style.display = isAdmin ? '' : 'none';
    }

    loadTabData(tab);
}

function loadTabData(tab) {
    switch (tab) {
        case 'home':
            if (typeof loadPublicTops === 'function') loadPublicTops();
            if (typeof loadAnnouncements === 'function') loadAnnouncements();
            if (typeof loadTodayActivity === 'function') loadTodayActivity();
            if (typeof loadWeeklyActivity === 'function') loadWeeklyActivity();
            if (typeof loadEventStats === 'function') loadEventStats();
            if (typeof loadRecentWinners === 'function') loadRecentWinners();
            break;

        case 'cabinet':
            if (typeof loadPlayerData === 'function') loadPlayerData();
            if (typeof loadPlayerItems === 'function') loadPlayerItems();
            if (typeof loadPlayerSkills === 'function') loadPlayerSkills();
            if (typeof loadCharacterScreenshots === 'function') loadCharacterScreenshots();
            break;

        case 'dkp':
            if (typeof loadMyDkp === 'function') loadMyDkp();
            if (typeof loadPlayerLootHistory === 'function') loadPlayerLootHistory();
            break;

        case 'auction':
            if (typeof loadAuctions === 'function') loadAuctions();
            break;

        case 'queue':
            if (typeof loadQueueItems === 'function') loadQueueItems();
            break;

        case 'calendar':
            if (typeof loadCalendarPlayers === 'function') loadCalendarPlayers();
            if (typeof loadCalendar === 'function') loadCalendar();
            break;

        case 'players':
            if (typeof loadAllPlayers === 'function') loadAllPlayers();
            break;

        case 'guilds':
            if (typeof loadMyGuild === 'function') loadMyGuild();
            if (typeof loadGuilds === 'function') loadGuilds();
            if (typeof loadGuildsRating === 'function') loadGuildsRating();
            break;

        case 'analytics':
            if (typeof loadAnalytics === 'function') loadAnalytics();
            break;

        case 'info':
            if (typeof loadInfoContent === 'function') loadInfoContent();
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

    if (tab === 'auctionList' && typeof loadAuctions === 'function') loadAuctions();
    if (tab === 'auctionHistory' && typeof loadAuctionHistory === 'function') loadAuctionHistory();
    if (tab === 'auctionSettings' && typeof loadAuctionSettings === 'function') loadAuctionSettings();
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

    if (tab === 'dkpBalance' && typeof loadMyDkp === 'function') loadMyDkp();
    if (tab === 'dkpHistory' && typeof loadPlayerLootHistory === 'function') loadPlayerLootHistory();
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
    if (equipmentSections && equipmentSections.length > 0 && !currentEquipmentSection) {
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

window.switchMainTab = switchMainTab;
window.switchAuctionTab = switchAuctionTab;
window.switchDkpTab = switchDkpTab;
window.showSkillsEditForm = showSkillsEditForm;
window.showEquipmentEditForm = showEquipmentEditForm;
window.backToInventory = backToInventory;
