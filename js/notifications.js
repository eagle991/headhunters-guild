// ============================================================
// 🔔 УМНЫЕ УВЕДОМЛЕНИЯ
// ============================================================

async function loadNotifications() {
    if (!currentUser) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getNotifications', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (!res.success) return;
        const ns = res.notifications || [];
        const uc = res.unreadCount || 0;
        const b = document.getElementById('notificationBadge');
        const bl = document.getElementById('notificationBell');
        if (b) {
            if (uc > 0) { b.innerText = uc > 99 ? '99+' : uc; b.classList.remove('hidden'); }
            else b.classList.add('hidden');
        }
        const guildInvitesUnread = ns.filter(function(n) { return n.type === 'guild_invite' && !n.isRead; }).length;
        const guildBadge = document.getElementById('guildInviteBadge');
        const guildBtn = document.getElementById('guildInvitationsBtn');
        if (guildBadge) {
            if (guildInvitesUnread > 0) {
                guildBadge.innerText = guildInvitesUnread > 9 ? '9+' : guildInvitesUnread;
                guildBadge.classList.remove('hidden');
                if (guildBtn) guildBtn.classList.add('has-new');
            } else {
                guildBadge.classList.add('hidden');
                if (guildBtn) guildBtn.classList.remove('has-new');
            }
        }
        if (lastNotificationCount > 0 && uc > lastNotificationCount) {
            const nn = ns.filter(function(n) { return !knownNotificationIds.has(n.id) && !n.isRead; });
            if (nn.length > 0) {
                const lt = nn[0];
                showBrowserNotification(lt);
                showToast(lt);
                if (bl) {
                    bl.style.animation = 'bellShake 0.5s ease-in-out';
                    setTimeout(function() { bl.style.animation = ''; }, 500);
                }
                playNotificationSound(lt.type);
            }
        }
        for (let i = 0; i < ns.length; i++) knownNotificationIds.add(ns[i].id);
        lastNotificationCount = uc;
        const m = document.getElementById('notificationsModal');
        if (m && !m.classList.contains('hidden')) renderNotificationsList(ns);
    } catch (e) {}
}

function startNotificationPolling() {
    if (notificationPollingInterval) clearInterval(notificationPollingInterval);
    loadNotifications();
    notificationPollingInterval = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL);
}

function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

function openNotificationsModal() {
    document.getElementById('notificationsModal').classList.remove('hidden');
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getNotifications', nickname: currentUser }), redirect: 'follow' })
        .then(function(r) { return r.json(); })
        .then(function(res) { if (res.success) renderNotificationsList(res.notifications || []); })
        .catch(function(e) { console.error(e); });
}

function closeNotificationsModal() { document.getElementById('notificationsModal').classList.add('hidden'); }

function renderNotificationsList(ns) {
    const l = document.getElementById('notificationsList');
    if (!l) return;
    if (ns.length === 0) { l.innerHTML = '<div class="empty-state">Нет уведомлений</div>'; return; }
    const tl = {
        'bid_outbid': { icon: '💔', label: 'Ставка перебита', badge: 'auction', target: '🔨 Аукцион' },
        'auction_ending': { icon: '⏰', label: 'Аукцион заканчивается', badge: 'auction', target: '🔨 Аукцион' },
        'new_auction': { icon: '🔨', label: 'Новый аукцион', badge: 'auction', target: '🔨 Аукцион' },
        'auction_won': { icon: '🏆', label: 'Победа', badge: 'auction', target: '🔨 Аукцион' },
        'auction_completed': { icon: '✅', label: 'Аукцион завершён', badge: 'auction', target: '🔨 Аукцион' },
        'auction_bid_changed': { icon: '🔔', label: 'Новая ставка', badge: 'auction', target: '🔨 Аукцион' },
        'auction_bid_outbid_personal': { icon: '💔', label: 'Ваша ставка перебита', badge: 'auction', target: '🔨 Аукцион' },
        'auction_extended': { icon: '⏰', label: 'Аукцион продлён', badge: 'auction', target: '🔨 Аукцион' },
        'achievement': { icon: '🏆', label: 'Достижение', badge: 'personal', target: '👤 Кабинет' },
        'level_up': { icon: '📊', label: 'Новый уровень', badge: 'personal', target: '👤 Кабинет' },
        'purchase': { icon: '🛍️', label: 'Покупка', badge: 'personal', target: '💰 DKP' },
        'daily_bonus': { icon: '🎁', label: 'Ежедневный бонус', badge: 'personal', target: '💰 DKP' },
        'guild_invite': { icon: '📨', label: 'Приглашение в гильдию', badge: 'guild', target: '🏰 Гильдии' },
        'guild_leadership': { icon: '👑', label: 'Передача лидерства', badge: 'guild', target: '🏰 Гильдии' },
        'guild_promotion': { icon: '⭐', label: 'Повышение', badge: 'guild', target: '🏰 Гильдии' },
        'guild_demotion': { icon: '📉', label: 'Снятие', badge: 'guild', target: '🏰 Гильдии' },
        'guild_kick': { icon: '🚫', label: 'Исключение', badge: 'guild', target: '🏰 Гильдии' },
        'guild_invite_accepted': { icon: '✅', label: 'Приглашение принято', badge: 'guild', target: '🏰 Гильдии' },
        'guild_invite_rejected': { icon: '❌', label: 'Приглашение отклонено', badge: 'guild', target: '🏰 Гильдии' },
        'guild_inactive_warning': { icon: '⚠️', label: 'Неактивные гильдии', badge: 'admin', target: '🏰 Гильдии' },
        'guild_disbanded': { icon: '🏰', label: 'Гильдия расформирована', badge: 'guild', target: '🏰 Гильдии' },
        'guild_disband_complete': { icon: '✅', label: 'Гильдия расформирована', badge: 'admin', target: '🏰 Гильдии' },
        'guild_disband_refund': { icon: '💰', label: 'Возврат DKP', badge: 'personal', target: '💰 DKP' },
        'guild_updated': { icon: '📝', label: 'Гильдия обновлена', badge: 'guild', target: '🏰 Гильдии' },
        'guild_deleted': { icon: '🗑️', label: 'Гильдия удалена', badge: 'guild', target: '🏰 Гильдии' },
        'guild_dkp_change': { icon: '💰', label: 'Изменение DKP', badge: 'guild', target: '🏰 Гильдии' },
        'admin_player_pending': { icon: '👤', label: 'Новая заявка игрока', badge: 'admin', target: '⚙ Админ' },
        'admin_dkp_pending': { icon: '💰', label: 'Новая заявка DKP', badge: 'admin', target: '⚙ Админ' },
        'admin_equipment_pending': { icon: '🛡️', label: 'Новая заявка экипировки', badge: 'admin', target: '⚙ Админ' },
        'admin_skills_pending': { icon: '🎯', label: 'Новая заявка навыков', badge: 'admin', target: '⚙ Админ' },
        'admin_deletion_request': { icon: '🗑️', label: 'Заявка на удаление', badge: 'admin', target: '⚙ Админ' },
        'admin_auction_deletion_request': { icon: '🗑️', label: 'Заявка на удаление аукциона', badge: 'admin', target: '⚙ Админ' },
        'admin_guild_join_request': { icon: '📨', label: 'Заявка на вступление', badge: 'admin', target: '🏰 Админка гильдии' }
    };
    let html = '';
    for (let i = 0; i < ns.length; i++) {
        const n = ns[i];
        const t = tl[n.type] || { icon: '📢', label: 'Уведомление', badge: '', target: '' };
        const hasTarget = t.target && n.relatedId;
        const rb = n.isRead
            ? '<button class="notif-action-btn read" title="Прочитано" disabled>✓</button>'
            : '<button class="notif-action-btn" onclick="event.stopPropagation(); markNotificationRead(\'' + escapeForOnclick(n.id) + '\')" title="Пометить">✓</button>';
        const badgeHtml = t.badge ? '<span class="notification-target-badge ' + t.badge + '">' + t.target + '</span>' : '';
        const targetClass = hasTarget ? 'has-target' : '';
        html += '<div class="notification-item type-' + n.type + ' ' + (n.isRead ? '' : 'unread') + ' ' + targetClass + '" onclick="handleNotificationClick(\'' + escapeForOnclick(n.id) + '\',\'' + escapeForOnclick(n.relatedId || '') + '\',\'' + escapeForOnclick(n.type) + '\')">';
        html += '<div style="flex:1;"><div class="notification-header"><span class="notification-type ' + n.type + '">' + t.icon + ' ' + t.label + badgeHtml + '</span><span class="notification-date">' + escapeHtml(n.date) + '</span></div><div class="notification-message">' + escapeHtml(n.message) + '</div></div>';
        html += '<div style="display:flex;flex-direction:column;gap:2px;margin-left:6px;">' + rb + '<button class="notif-action-btn delete" onclick="event.stopPropagation(); deleteNotification(\'' + escapeForOnclick(n.id) + '\')" title="Удалить">✕</button></div>';
        html += '</div>';
    }
    l.innerHTML = html;
}

async function markNotificationRead(id) {
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'markNotificationRead', notificationId: id, nickname: currentUser }), redirect: 'follow' });
        loadNotifications();
    } catch (e) {}
}

async function deleteNotification(id) {
    if (!confirm('Удалить уведомление?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteNotification', notificationId: id, nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) loadNotifications();
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function handleNotificationClick(id, rid, t) {
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'markNotificationRead', notificationId: id, nickname: currentUser }), redirect: 'follow' });
    } catch (e) {}
    let targetTab = 'home';
    let targetAction = null;
    let targetParam = null;
    if (t === 'bid_outbid' || t === 'auction_ending' || t === 'auction_won' || t === 'auction_bid_changed' || t === 'auction_bid_outbid_personal' || t === 'auction_completed' || t === 'auction_extended' || t === 'new_auction') {
        targetTab = 'auction'; targetAction = 'openBidModal'; targetParam = rid;
    } else if (t === 'guild_invite' || t === 'guild_invite_accepted' || t === 'guild_invite_rejected') {
        targetTab = 'guilds'; targetAction = 'openMyInvitations';
    } else if (t.indexOf('guild_') === 0) {
        targetTab = 'guilds'; targetAction = 'openGuildInfo'; targetParam = rid;
    } else if (t === 'achievement' || t === 'level_up') {
        targetTab = 'cabinet'; targetAction = 'scrollToAchievements';
    } else if (t === 'purchase' || t === 'daily_bonus' || t === 'guild_dkp_change' || t === 'guild_disband_refund') {
        targetTab = 'dkp'; targetAction = 'showBalance';
    } else if (t === 'admin_player_pending') { targetTab = 'admin'; targetAction = 'switchAdminTab'; targetParam = 'players'; }
    else if (t === 'admin_dkp_pending') { targetTab = 'admin'; targetAction = 'switchAdminTab'; targetParam = 'dkpPending'; }
    else if (t === 'admin_equipment_pending') { targetTab = 'admin'; targetAction = 'switchAdminTab'; targetParam = 'equipmentPending'; }
    else if (t === 'admin_skills_pending') { targetTab = 'admin'; targetAction = 'switchAdminTab'; targetParam = 'skillsPending'; }
    else if (t === 'admin_deletion_request' || t === 'admin_auction_deletion_request') { targetTab = 'admin'; targetAction = 'switchAdminTab'; targetParam = 'users'; }
    else if (t === 'admin_guild_join_request') { targetTab = 'guildAdmin'; targetAction = 'openInvites'; targetParam = rid; }
    closeNotificationsModal();
    const tabBtn = document.querySelector('#mainTabs .tab-btn[data-tab="' + targetTab + '"]');
    if (tabBtn) switchMainTab(targetTab, { target: tabBtn });
    setTimeout(function() {
        try {
            if (targetAction === 'openBidModal' && targetParam) openBidModal(targetParam);
            else if (targetAction === 'openMyInvitations') showMyInvitationsModal();
            else if (targetAction === 'openGuildInfo' && targetParam) showGuildInfo(targetParam);
            else if (targetAction === 'scrollToAchievements') {
                const ach = document.getElementById('achievementsSection');
                if (ach) ach.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            else if (targetAction === 'showBalance') {
                const bal = document.getElementById('myDkpBalance');
                if (bal) bal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            else if (targetAction === 'switchAdminTab' && targetParam) {
                const adminTabBtn = document.getElementById('tabAdmin' + targetParam.charAt(0).toUpperCase() + targetParam.slice(1));
                if (adminTabBtn) switchAdminTab(targetParam, { target: adminTabBtn });
            }
            else if (targetAction === 'openInvites') switchGuildAdminTab('invites', null);
        } catch(e) { console.error('Notification action error:', e); }
    }, 350);
    loadNotifications();
}

async function markAllNotificationsRead() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'clearAllNotifications', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) loadNotifications();
    } catch (e) {}
}

function showBrowserNotification(n) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if ('Notification' in window && Notification.permission === 'granted') {
        const tl = {
            'bid_outbid': '💔 Ставка перебита',
            'auction_ending': '⏰ Аукцион заканчивается',
            'new_auction': '🔨 Новый аукцион',
            'auction_won': '🏆 Победа!',
            'achievement': '🏆 Достижение',
            'level_up': '📊 Новый уровень',
            'purchase': '🛍️ Покупка',
            'daily_bonus': '🎁 Ежедневный бонус',
            'guild_invite': '📨 Приглашение в гильдию'
        };
        const nt = new Notification(tl[n.type] || '🔔 Уведомление', { body: n.message, tag: n.id, requireInteraction: false });
        nt.onclick = function() { window.focus(); nt.close(); handleNotificationClick(n.id, n.relatedId || '', n.type); };
        setTimeout(function() { nt.close(); }, 8000);
    }
}

let toastTimeout = null;

function showToast(n) {
    const t = document.getElementById('toastNotification');
    if (!t) return;
    const tl = {
        'bid_outbid': '💔 Ставка перебита',
        'auction_ending': '⏰ Аукцион заканчивается',
        'new_auction': '🔨 Новый аукцион',
        'auction_won': '🏆 Победа!',
        'achievement': '🏆 Достижение',
        'level_up': '📊 Новый уровень',
        'purchase': '🛍️ Покупка',
        'daily_bonus': '🎁 Ежедневный бонус',
        'guild_invite': '📨 Приглашение в гильдию'
    };
    const tt = document.getElementById('toastTitle');
    const tm = document.getElementById('toastMessage');
    if (tt) tt.innerText = tl[n.type] || 'Уведомление';
    if (tm) tm.innerText = n.message;
    t.className = 'toast-notification type-' + n.type;
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(function() { t.classList.add('hidden'); }, 6000);
}

function hideToast() {
    const t = document.getElementById('toastNotification');
    if (t) t.classList.add('hidden');
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
}

function playNotificationSound(t) {
    if (!t) t = 'default';
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const sc = {
            'bid_outbid': { freq: 400, duration: 0.3, type: 'sawtooth' },
            'auction_ending': { freq: 600, duration: 0.4, type: 'triangle' },
            'new_auction': { freq: 800, duration: 0.2, type: 'sine' },
            'auction_won': { freq: 1000, duration: 0.5, type: 'sine' },
            'auction_completed': { freq: 700, duration: 0.3, type: 'sine' },
            'auction_bid_changed': { freq: 650, duration: 0.2, type: 'triangle' },
            'auction_bid_outbid_personal': { freq: 350, duration: 0.4, type: 'sawtooth' },
            'auction_extended': { freq: 750, duration: 0.25, type: 'sine' },
            'achievement': { freq: 1200, duration: 0.3, type: 'sine' },
            'level_up': { freq: 900, duration: 0.4, type: 'triangle' },
            'purchase': { freq: 700, duration: 0.2, type: 'sine' },
            'daily_bonus': { freq: 850, duration: 0.3, type: 'sine' },
            'guild_invite': { freq: 700, duration: 0.3, type: 'sine' },
            'guild_leadership': { freq: 1100, duration: 0.4, type: 'sine' },
            'guild_promotion': { freq: 900, duration: 0.3, type: 'triangle' },
            'guild_demotion': { freq: 500, duration: 0.3, type: 'sawtooth' },
            'guild_kick': { freq: 300, duration: 0.4, type: 'sawtooth' },
            'guild_invite_accepted': { freq: 800, duration: 0.2, type: 'sine' },
            'guild_invite_rejected': { freq: 400, duration: 0.3, type: 'triangle' },
            'guild_inactive_warning': { freq: 350, duration: 0.5, type: 'sawtooth' },
            'guild_disbanded': { freq: 250, duration: 0.6, type: 'sawtooth' },
            'guild_disband_complete': { freq: 600, duration: 0.3, type: 'triangle' },
            'guild_disband_refund': { freq: 800, duration: 0.2, type: 'sine' },
            'guild_updated': { freq: 750, duration: 0.2, type: 'sine' },
            'guild_deleted': { freq: 200, duration: 0.5, type: 'sawtooth' },
            'guild_dkp_change': { freq: 850, duration: 0.25, type: 'sine' },
            'admin_player_pending': { freq: 950, duration: 0.3, type: 'triangle' },
            'admin_dkp_pending': { freq: 850, duration: 0.3, type: 'triangle' },
            'admin_equipment_pending': { freq: 800, duration: 0.3, type: 'triangle' },
            'admin_skills_pending': { freq: 750, duration: 0.3, type: 'triangle' },
            'admin_deletion_request': { freq: 500, duration: 0.4, type: 'sawtooth' },
            'admin_auction_deletion_request': { freq: 500, duration: 0.4, type: 'sawtooth' },
            'admin_guild_join_request': { freq: 700, duration: 0.3, type: 'sine' },
            'default': { freq: 800, duration: 0.3, type: 'sine' }
        };
        const c = sc[t] || sc['default'];
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.value = c.freq; o.type = c.type;
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + c.duration);
        o.start(ac.currentTime);
        o.stop(ac.currentTime + c.duration);
    } catch (e) {}
}
