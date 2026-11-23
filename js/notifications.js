// ============================================================
// 🔔 УМНЫЕ УВЕДОМЛЕНИЯ
// ============================================================

async function loadNotifications() {
    if (!currentUser) return;

    try {
        const res = await api('getNotifications', { nickname: currentUser });
        if (!res.success) return;

        const notifications = res.notifications || [];
        const unreadCount = res.unreadCount || 0;

        updateNotificationBadge(unreadCount);
        updateGuildInviteBadge(notifications);
        renderNotificationsList(notifications);

        // Воспроизведение звука для новых уведомлений
        checkNewNotifications(notifications);

    } catch (e) {
        console.error('loadNotifications error:', e);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    const bell = document.getElementById('notificationBell');

    if (badge) {
        if (count > 0) {
            badge.innerText = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function updateGuildInviteBadge(notifications) {
    const guildInvitesUnread = notifications.filter(n => n.type === 'guild_invite' && !n.isRead).length;
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
}

function renderNotificationsList(notifications) {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет уведомлений</div>';
        return;
    }

    let html = '';
    for (const n of notifications) {
        const readClass = n.isRead ? 'read' : 'unread';
        html += '<div class="notification-item ' + readClass + '" onclick="handleNotificationClick(\'' + escapeForOnclick(n.id) + '\', \'' + escapeForOnclick(n.relatedId || '') + '\', \'' + escapeForOnclick(n.type) + '\')">';
        html += '<div class="notification-icon">' + getNotificationIcon(n.type) + '</div>';
        html += '<div class="notification-content">';
        html += '<div class="notification-title">' + escapeHtml(n.title || 'Уведомление') + '</div>';
        html += '<div class="notification-message">' + escapeHtml(n.message || '') + '</div>';
        html += '<div class="notification-time">' + formatNotificationTime(n.createdAt) + '</div>';
        html += '</div>';
        if (!n.isRead) html += '<div class="notification-dot"></div>';
        html += '</div>';
    }

    list.innerHTML = html;
}

async function handleNotificationClick(id, relatedId, type) {
    // Помечаем как прочитанное
    await api('markNotificationRead', { id: id, nickname: currentUser });

    // Определяем куда перейти
    let targetTab = null;

    if (type === 'bid_outbid' || type === 'auction_won' || type === 'auction_ended') {
        targetTab = 'auction';
    } else if (type === 'guild_invite' || type === 'guild_join_request') {
        targetTab = 'guilds';
    } else if (type === 'dkp_approved' || type === 'dkp_rejected') {
        targetTab = 'dkp';
    } else if (type.startsWith('admin_')) {
        targetTab = 'admin';
    }

    if (targetTab) {
        switchMainTab(targetTab);
    }

    loadNotifications();
}

function getNotificationIcon(type) {
    const icons = {
        'bid_outbid': '🔨',
        'auction_won': '🏆',
        'auction_ended': '⏱️',
        'guild_invite': '🏰',
        'guild_join_request': '📨',
        'dkp_approved': '💰',
        'dkp_rejected': '❌',
        'admin_player_pending': '👤',
        'admin_dkp_pending': '💰',
        'default': '🔔'
    };
    return icons[type] || icons['default'];
}

function formatNotificationTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'только что';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' мин. назад';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ч. назад';
    return date.toLocaleDateString('ru-RU');
}

function checkNewNotifications(notifications) {
    const newOnes = notifications.filter(n => !n.isRead && !knownNotificationIds.has(n.id));

    for (const n of newOnes) {
        knownNotificationIds.add(n.id);
        playNotificationSound(n.type);
        showBrowserNotification(n.title, n.message);
    }
}

function playNotificationSound(type) {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const sounds = {
            'bid_outbid': { freq: 700, duration: 0.2, type: 'sine' },
            'auction_won': { freq: 900, duration: 0.4, type: 'sine' },
            'guild_invite': { freq: 600, duration: 0.3, type: 'triangle' },
            'dkp_approved': { freq: 850, duration: 0.25, type: 'sine' },
            'default': { freq: 800, duration: 0.3, type: 'sine' }
        };

        const c = sounds[type] || sounds['default'];
        const o = ac.createOscillator();
        const g = ac.createGain();

        o.connect(g);
        g.connect(ac.destination);
        o.frequency.value = c.freq;
        o.type = c.type;
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + c.duration);
        o.start(ac.currentTime);
        o.stop(ac.currentTime + c.duration);
    } catch (e) {}
}

function showBrowserNotification(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification(title || 'RF Online Next', { body: body || '' });
    }
}
