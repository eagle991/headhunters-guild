// ============================================================
// 🚀 RF ONLINE NEXT v17.20 — ТОЧКА ВХОДА
// ============================================================

// ============================================================
// 🖱️ DRAG & DROP ДЛЯ СКРИНШОТОВ
// ============================================================

function initDragAndDrop() {
    const ua = document.getElementById('screenshotUploadArea');
    if (ua) {
        ua.addEventListener('dragover', function(e) { e.preventDefault(); ua.classList.add('dragover'); });
        ua.addEventListener('dragleave', function() { ua.classList.remove('dragover'); });
        ua.addEventListener('drop', function(e) {
            e.preventDefault();
            ua.classList.remove('dragover');
            const f = Array.from(e.dataTransfer.files).filter(function(x) { return x.type.startsWith('image/'); });
            if (f.length > 0) addScreenshots(f);
        });
    }
    
    const block1 = document.getElementById('screenshotBlock1');
    if (block1) {
        block1.addEventListener('dragover', function(e) { e.preventDefault(); block1.style.borderColor = 'var(--accent)'; block1.style.background = 'var(--accent-soft)'; });
        block1.addEventListener('dragleave', function() { block1.style.borderColor = ''; block1.style.background = ''; });
        block1.addEventListener('drop', function(e) {
            e.preventDefault();
            block1.style.borderColor = '';
            block1.style.background = '';
            const files = Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); });
            if (files.length > 0) {
                const input = document.getElementById('charScreenshot1');
                if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    handleCharacterScreenshot({ target: input }, 1);
                }
            }
        });
    }
    
    const block2 = document.getElementById('screenshotBlock2');
    if (block2) {
        block2.addEventListener('dragover', function(e) { e.preventDefault(); block2.style.borderColor = 'var(--accent)'; block2.style.background = 'var(--accent-soft)'; });
        block2.addEventListener('dragleave', function() { block2.style.borderColor = ''; block2.style.background = ''; });
        block2.addEventListener('drop', function(e) {
            e.preventDefault();
            block2.style.borderColor = '';
            block2.style.background = '';
            const files = Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); });
            if (files.length > 0) {
                const input = document.getElementById('charScreenshot2');
                if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    handleCharacterScreenshot({ target: input }, 2);
                }
            }
        });
    }
    
    const area = document.getElementById('emblemUploadArea');
    if (area) {
        area.addEventListener('dragover', function(e) { e.preventDefault(); area.style.borderColor = 'var(--accent)'; area.style.background = 'var(--accent-soft)'; });
        area.addEventListener('dragleave', function() { area.style.borderColor = ''; area.style.background = ''; });
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            area.style.borderColor = '';
            area.style.background = '';
            const files = Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); });
            if (files.length > 0) {
                const input = document.getElementById('guildEmblemInput');
                if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    handleGuildEmblemSelect({ target: input });
                }
            }
        });
    }
}

// ============================================================
// ⌨️ ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
// ============================================================

function initGlobalHandlers() {
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('screenshotZoomModal');
        if (!modal || modal.classList.contains('hidden')) return;
        if (e.target === modal) closeScreenshotZoom();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            const zoomModal = document.getElementById('screenshotZoomModal');
            if (zoomModal && !zoomModal.classList.contains('hidden')) {
                closeScreenshotZoom();
                return;
            }
            const otherModals = [
                'imageModal', 'bidModal', 'iconModal',
                'editEventModal', 'deleteEventModal',
                'dkpDetailsModal', 'editDkpEntryModal',
                'editAuctionModal', 'notificationsModal',
                'editAnnouncementModal', 'upgradeModal',
                'banModal', 'viewPlayerModal', 'createGuildModal',
                'guildInfoModal', 'inviteToGuildModal',
                'myInvitationsModal', 'editGuildModal',
                'editInfoModal', 'adjustGuildDkpModal',
                'guildEventModal', 'guildSettingsModal',
                'guildPendingDkpModal', 'guildDkpHistoryModal',
                'guildSubmitDkpModal'
            ];
            for (let i = 0; i < otherModals.length; i++) {
                const m = document.getElementById(otherModals[i]);
                if (m && !m.classList.contains('hidden')) {
                    m.classList.add('hidden');
                    return;
                }
            }
        }
    });
    
    const zoomModal = document.getElementById('screenshotZoomModal');
    if (zoomModal) {
        zoomModal.addEventListener('wheel', function(e) {
            if (zoomModal.classList.contains('hidden')) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            zoomImage(delta);
        }, { passive: false });
    }
}

// ============================================================
// 🚀 АВТОЗАГРУЗКА ПРИ СТАРТЕ
// ============================================================

window.addEventListener('DOMContentLoaded', function() {
    console.log('%c🌌 RF ONLINE NEXT v' + APP_VERSION, 'color: #2563eb; font-size: 16px; font-weight: bold;');
    console.log('%c✅ Загрузка модулей...', 'color: #10b981; font-size: 12px;');
    
    const savedTheme = localStorage.getItem('rf_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    initDragAndDrop();
    initGlobalHandlers();
    
    const savedSession = localStorage.getItem('rf_session');
    if (savedSession) {
        try {
            const s = JSON.parse(savedSession);
            if (s.user && s.role && (Date.now() - s.timestamp < 24 * 60 * 60 * 1000)) {
                currentUser = s.user;
                currentRole = s.role;
                showMainScreen();
                console.log('%c✅ Сессия восстановлена: ' + s.user, 'color: #10b981;');
                startPeriodicTasks();
                return;
            }
        } catch (e) {
            console.warn('⚠️ Ошибка восстановления сессии:', e);
        }
    }
    
    const sl = localStorage.getItem('rf_saved_login');
    const sp = localStorage.getItem('rf_saved_password');
    if (sl && sp) {
        const ln = document.getElementById('loginNick');
        const lp = document.getElementById('loginPass');
        const rm = document.getElementById('rememberMe');
        const si = document.getElementById('savedIndicator');
        if (ln) ln.value = sl;
        if (lp) lp.value = sp;
        if (rm) rm.checked = true;
        if (si) si.style.display = 'inline-block';
    }
    
    loadPublicTops();
    startPeriodicTasks();
    
    console.log('%c✅ Сайт загружен успешно', 'color: #10b981; font-size: 12px;');
});

function startPeriodicTasks() {
    setTimeout(checkForUpdates, 3000);
    setInterval(checkForUpdates, 5 * 60 * 1000);
    
    setInterval(function() {
        if (currentUser) loadNotifications();
    }, NOTIFICATION_POLL_INTERVAL);
    
    setTimeout(loadAllGuildsForBadges, 2000);
}

// ============================================================
// 📊 СТАТИСТИКА МОДУЛЕЙ
// ============================================================

function getModuleStats() {
    const modules = [
        { name: 'config.js', functions: 0, variables: 30 },
        { name: 'utils.js', functions: 15, variables: 0 },
        { name: 'auth.js', functions: 8, variables: 0 },
        { name: 'tabs.js', functions: 10, variables: 0 },
        { name: 'player.js', functions: 20, variables: 0 },
        { name: 'skills.js', functions: 11, variables: 0 },
        { name: 'equipment.js', functions: 18, variables: 0 },
        { name: 'dkp.js', functions: 35, variables: 0 },
        { name: 'auction.js', functions: 27, variables: 0 },
        { name: 'queue.js', functions: 10, variables: 0 },
        { name: 'calendar.js', functions: 9, variables: 0 },
        { name: 'guild.js', functions: 35, variables: 0 },
        { name: 'guild-admin.js', functions: 4, variables: 0 },
        { name: 'notifications.js', functions: 13, variables: 0 },
        { name: 'announcements.js', functions: 9, variables: 0 },
        { name: 'ocr.js', functions: 30, variables: 0 },
        { name: 'admin.js', functions: 30, variables: 0 },
        { name: 'analytics.js', functions: 7, variables: 0 },
        { name: 'info.js', functions: 5, variables: 0 },
        { name: 'app.js', functions: 5, variables: 0 }
    ];
    
    let totalFunctions = 0;
    let totalVariables = 0;
    
    console.log('%c📊 СТАТИСТИКА МОДУЛЕЙ RF ONLINE NEXT v' + APP_VERSION, 'color: #2563eb; font-size: 14px; font-weight: bold;');
    console.log('='.repeat(60));
    
    modules.forEach(function(m) {
        totalFunctions += m.functions;
        totalVariables += m.variables;
        console.log('%c' + m.name.padEnd(20) + '%c' + m.functions + ' функций, ' + m.variables + ' переменных', 'color: #f59e0b; font-weight: bold;', 'color: #64748b;');
    });
    
    console.log('='.repeat(60));
    console.log('%cИТОГО: ' + totalFunctions + ' функций, ' + totalVariables + ' переменных, ' + modules.length + ' модулей', 'color: #10b981; font-weight: bold; font-size: 12px;');
    
    return { functions: totalFunctions, variables: totalVariables, modules: modules.length };
}

window.getModuleStats = getModuleStats;

console.log('%c💡 Совет: вызовите getModuleStats() в консоли для просмотра статистики', 'color: #64748b; font-style: italic;');
