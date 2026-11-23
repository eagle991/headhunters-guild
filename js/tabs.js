// ============================================================
// 🗂️ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================

function switchMainTab(t, e) {
    document.querySelectorAll('#mainTabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    
    const tabs = ['home', 'cabinet', 'dkp', 'auction', 'queue', 'calendar', 'players', 'guilds', 'analytics', 'info', 'guildAdmin', 'admin'];
    for (let i = 0; i < tabs.length; i++) {
        const c = document.getElementById(tabs[i] + 'Content');
        if (c) {
            if (tabs[i] === t) c.classList.remove('hidden');
            else c.classList.add('hidden');
        }
    }
    
    const tabCreate = document.getElementById('tabAuctionCreate');
    if (tabCreate) {
        if (currentRole === 'Админ' || currentRole === 'Модератор') tabCreate.classList.remove('hidden');
        else tabCreate.classList.add('hidden');
    }
    const tabQueueAdd = document.getElementById('tabQueueAdd');
    if (tabQueueAdd) {
        if (currentRole === 'Админ' || currentRole === 'Модератор') tabQueueAdd.classList.remove('hidden');
        else tabQueueAdd.classList.add('hidden');
    }
    
    if (t === 'home') { loadPublicTops(); loadEventTimers(); loadTodayActivity(); loadWeeklyActivity(); loadEventStats(); loadRecentWinners(); }
    if (t === 'players') loadAllPlayers();
    if (t === 'dkp') {
        loadMyDkp();
        loadEventsForSelect();
        if (currentDkpMode === 'guild') loadGuildDkp();
        if (currentRole === 'Гость') {
            const submitTab = document.getElementById('tabDkpSubmit');
            if (submitTab) submitTab.classList.add('hidden');
        }
    }
    if (t === 'auction') { loadActiveAuctions(); loadRecentWinners(); loadAuctionSectionsDynamic(); }
    if (t === 'queue') { loadQueueItems(); loadPlayersForQueue(); loadAllItemsForQueueSelect(); }
    if (t === 'calendar') loadCalendarPlayers();
    if (t === 'cabinet') {
        loadMyLootHistory();
        renderMmorpgInventory();
        loadUserEmail();
        loadPlayerLevel();
        loadDailyBonus();
        loadAchievements();
        loadPersonalStats();
        loadFriends();
        loadCosmeticsShop();
        loadTwinksInfo();
        loadCharacterScreenshots();
    }
    if (t === 'guilds') {
        loadMyGuild();
        loadGuilds();
        loadGuildsRating();
        if (currentRole === 'Админ') loadInactiveGuilds();
    }
    if (t === 'analytics') loadAnalytics();
    if (t === 'info') loadInfoContent();
    if (t === 'guildAdmin') {
        if (window._myGuild && (window._myGuild.role === 'leader' || window._myGuild.role === 'officer')) {
            loadGuildAdmin();
        } else {
            alert('⛔ Доступ только для лидеров и офицеров');
            const homeBtn = document.querySelector('#mainTabs .tab-btn[data-tab="home"]');
            switchMainTab('home', { target: homeBtn });
        }
    }
    if (t === 'admin') {
        loadPendingPlayers();
        if (currentRole === 'Админ' || currentRole === 'Модератор') loadAllUsers();
    }
}

function switchDkpTab(t, e) {
    document.querySelectorAll('#dkpGlobalContent > .tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    const my = document.getElementById('dkpMyContent');
    if (my) my.classList.toggle('hidden', t !== 'my');
    const submit = document.getElementById('dkpSubmitContent');
    if (submit) submit.classList.toggle('hidden', t !== 'submit');
    const rating = document.getElementById('dkpRatingContent');
    if (rating) rating.classList.toggle('hidden', t !== 'rating');
    if (t === 'my') loadMyDkp();
    if (t === 'submit') loadEventsForSelect();
    if (t === 'rating') loadDkpRating();
}

function switchDkpMode(mode) {
    currentDkpMode = mode;
    const globalTab = document.getElementById('dkpModeGlobal');
    const guildTab = document.getElementById('dkpModeGuild');
    const globalContent = document.getElementById('dkpGlobalContent');
    const guildContent = document.getElementById('dkpGuildContent');
    
    if (globalTab) globalTab.classList.toggle('active', mode === 'global');
    if (guildTab) guildTab.classList.toggle('active', mode === 'guild');
    if (globalContent) globalContent.classList.toggle('hidden', mode !== 'global');
    if (guildContent) guildContent.classList.toggle('hidden', mode !== 'guild');
    
    if (mode === 'guild') loadGuildDkp();
    else loadMyDkp();
}

function switchAuctionTab(t, e) {
    document.querySelectorAll('#auctionContent > .tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    const active = document.getElementById('auctionActiveContent');
    if (active) active.classList.toggle('hidden', t !== 'active');
    const completed = document.getElementById('auctionCompletedContent');
    if (completed) completed.classList.toggle('hidden', t !== 'completed');
    const create = document.getElementById('auctionCreateContent');
    if (create) create.classList.toggle('hidden', t !== 'create');
    if (t === 'active') loadActiveAuctions();
    if (t === 'completed') loadCompletedAuctions();
    if (t === 'create') { loadPlayersForAuction(); loadAuctionSectionsDynamic(); toggleAuctionTypeFields(); }
}

function switchQueueTab(t, e) {
    document.querySelectorAll('#queueContent > .tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    const list = document.getElementById('queueListContent');
    if (list) list.classList.toggle('hidden', t !== 'list');
    const add = document.getElementById('queueAddContent');
    if (add) add.classList.toggle('hidden', t !== 'add');
    const loot = document.getElementById('queueMyLootContent');
    if (loot) loot.classList.toggle('hidden', t !== 'myloot');
    if (t === 'list') loadQueueItems();
    if (t === 'add') { loadPlayersForQueue(); loadAllItemsForQueueSelect(); }
    if (t === 'myloot') { loadMyUnifiedLootStats(); loadMyUnifiedLootHistory(); }
}

function switchAdminTab(t, e) {
    document.querySelectorAll('#adminContent > .tabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    
    const tabs = ['players','skillsPending','equipmentPending','dkpPending','events','dkpAdjust','skills','items','users','settings','features','timers','log','missing','export','twinks'];
    for (let i = 0; i < tabs.length; i++) {
        const c = document.getElementById('admin' + tabs[i].charAt(0).toUpperCase() + tabs[i].slice(1) + 'Content');
        if (c) c.classList.toggle('hidden', tabs[i] !== t);
    }
    
    if (t === 'skills') loadAdminSkills();
    if (t === 'skillsPending') loadPendingSkills();
    if (t === 'equipmentPending') loadPendingEquipment();
    if (t === 'dkpPending') loadPendingDkp();
    if (t === 'events') loadAdminEvents();
    if (t === 'items') { loadEquipmentSectionsDynamic(); loadAdminItems(); }
    if (t === 'users') { loadAllUsers(); loadAuctionDeletionRequests(); }
    if (t === 'settings') { loadAllSettings(); loadSiteBackgroundSettings(); loadProfessionIconsAdmin(); }
    if (t === 'features') loadAdminFeatures();
    if (t === 'timers') loadAdminTimers();
    if (t === 'log') loadActionLog();
    if (t === 'missing') loadMissingItemNames();
    if (t === 'twinks') loadAdminTwinksList();
}

function switchGuildAdminTab(tab, event) {
    const tabs = ['members', 'dkp', 'events', 'pending', 'settings', 'invites'];
    for (const t of tabs) {
        const btn = document.getElementById('tabGuildAdmin' + t.charAt(0).toUpperCase() + t.slice(1));
        const content = document.getElementById('guildAdmin' + t.charAt(0).toUpperCase() + t.slice(1) + 'Content');
        if (btn) btn.classList.toggle('active', t === tab);
        if (content) content.classList.toggle('hidden', t !== tab);
    }
    if (tab === 'members') loadGuildAdminMembers();
    else if (tab === 'dkp') loadGuildDkpRanking();
    else if (tab === 'events') loadGuildEvents();
    else if (tab === 'pending') loadGuildPendingDkp();
    else if (tab === 'settings') loadGuildAdminSettings();
    else if (tab === 'invites') loadGuildPendingInvitations();
}

// ============================================================
// 🛡️ ФОРМЫ КАБИНЕТА
// ============================================================

function showEditForm() {
    const am = document.getElementById('approvedMessage'); if (am) am.classList.add('hidden');
    const ag = document.getElementById('approvedDataGrid'); if (ag) ag.classList.add('hidden');
    const inv = document.getElementById('mmorpgInventoryView'); if (inv) inv.classList.add('hidden');
    const f = document.getElementById('playerDataForm'); if (f) f.classList.remove('hidden');
    const csb = document.getElementById('characterScreenshotsBlock'); if (csb) csb.classList.remove('hidden');
}

function showSkillsEditForm() {
    const am = document.getElementById('skillsApprovedMessage'); if (am) am.classList.add('hidden');
    const al = document.getElementById('approvedSkillsList'); if (al) al.classList.add('hidden');
    const f = document.getElementById('skillsForm'); if (f) f.classList.remove('hidden');
}

function showEquipmentEditForm() {
    const inv = document.getElementById('mmorpgInventoryView'); if (inv) inv.classList.add('hidden');
    const am = document.getElementById('equipmentApprovedMessage'); if (am) am.classList.add('hidden');
    const f = document.getElementById('equipmentForm'); if (f) f.classList.remove('hidden');
    buildEquipmentTabs();
    if (equipmentSections.length > 0 && !currentEquipmentSection) selectEquipmentSection(equipmentSections[0]);
    else renderEquipmentItems();
}

function backToInventory() {
    const f = document.getElementById('equipmentForm'); if (f) f.classList.add('hidden');
    const inv = document.getElementById('mmorpgInventoryView');
    if (inv) { inv.classList.remove('hidden'); renderMmorpgInventory(); }
    const am = document.getElementById('equipmentApprovedMessage');
    if (am && myPlayerItems && myPlayerItems.status === 'approved') am.classList.remove('hidden');
}
