// ============================================================
// 👥 АДМИНКА
// ============================================================

async function loadPendingPlayers() {
    const list = document.getElementById('pendingPlayersList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getPendingPlayers');

        if (res.success && res.players && res.players.length > 0) {
            let html = '';
            for (const p of res.players) {
                html += '<div class="player-card">';
                html += '<div class="player-card-header">';
                html += '<div class="player-nick">' + escapeHtml(p.nickname) + '</div>';
                html += '<div class="action-buttons">';
                html += '<button class="btn-approve" onclick="approvePlayer(\'' + escapeForOnclick(p.nickname) + '\')">✓</button>';
                html += '<button class="btn-reject" onclick="rejectPlayer(\'' + escapeForOnclick(p.nickname) + '\')">✕</button>';
                html += '</div></div>';
                html += '<div class="data-grid">';
                html += '<div class="data-item"><div class="data-label">БМ</div><div class="data-value">' + (p.bm || '—') + '</div></div>';
                html += '<div class="data-item"><div class="data-label">Уровень</div><div class="data-value">' + (p.level || '—') + '</div></div>';
                html += '<div class="data-item"><div class="data-label">Профессия</div><div class="data-value">' + escapeHtml(p.profession || '—') + '</div></div>';
                html += '</div></div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет заявок</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function approvePlayer(nickname) {
    if (!confirm('Подтвердить игрока ' + nickname + '?')) return;

    try {
        const res = await api('approvePlayer', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Подтверждено'));
            loadPendingPlayers();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка соединения');
    }
}

async function rejectPlayer(nickname) {
    if (!confirm('Отклонить игрока ' + nickname + '?')) return;

    try {
        const res = await api('rejectPlayer', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Отклонено'));
            loadPendingPlayers();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка соединения');
    }
}

async function loadPendingSkills() {
    const list = document.getElementById('pendingSkillsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getPendingSkills');

        if (res.success && res.players && res.players.length > 0) {
            let html = '';
            for (const p of res.players) {
                html += '<div class="player-card">';
                html += '<div class="player-card-header">';
                html += '<div class="player-nick">' + escapeHtml(p.nickname) + '</div>';
                html += '<div class="action-buttons">';
                html += '<button class="btn-approve" onclick="approveSkills(\'' + escapeForOnclick(p.nickname) + '\')">✓</button>';
                html += '<button class="btn-reject" onclick="rejectSkills(\'' + escapeForOnclick(p.nickname) + '\')">✕</button>';
                html += '</div></div>';
                html += '<div class="approved-skills">';

                if (p.skills && p.skills.length > 0) {
                    for (const skill of p.skills) {
                        html += '<div class="approved-skill-badge">' + escapeHtml(skill) + '</div>';
                    }
                } else {
                    html += '<div style="color:var(--text-dim);">Пусто</div>';
                }

                html += '</div></div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет заявок</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

async function approveSkills(nickname) {
    try {
        const res = await api('approveSkills', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Подтверждено'));
            loadPendingSkills();
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function rejectSkills(nickname) {
    try {
        const res = await api('rejectSkills', { nickname: nickname });
        if (res.success) {
            alert('✅ ' + (res.message || 'Отклонено'));
            loadPendingSkills();
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// РУЧНОЕ DKP
// ============================================================

async function applyManualDkp() {
    const nickname = document.getElementById('manualDkpNick')?.value?.trim();
    const amount = Number(document.getElementById('manualDkpAmount')?.value);
    const reason = document.getElementById('manualDkpReason')?.value?.trim();
    const msg = document.getElementById('manualDkpMessage');

    if (!nickname) {
        showAdminMessage(msg, 'Введите ник', 'error');
        return;
    }

    if (!amount || amount === 0) {
        showAdminMessage(msg, 'Введите сумму', 'error');
        return;
    }

    try {
        showAdminMessage(msg, 'Применение...', '');
        const res = await api('applyManualDkp', {
            nickname: nickname,
            amount: amount,
            reason: reason || 'Ручное изменение'
        });

        if (res.success) {
            showAdminMessage(msg, '✅ ' + (res.message || 'Применено'), 'success');
            document.getElementById('manualDkpNick').value = '';
            document.getElementById('manualDkpAmount').value = '';
            document.getElementById('manualDkpReason').value = '';
        } else {
            showAdminMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showAdminMessage(msg, '❌ Ошибка', 'error');
    }
}

// ============================================================
// МЕРОПРИЯТИЯ
// ============================================================

async function loadEvents() {
    const list = document.getElementById('eventsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getEvents');

        if (res.success && res.events && res.events.length > 0) {
            let html = '';
            for (const e of res.events) {
                html += '<div class="event-card">';
                html += '<div class="event-name">' + escapeHtml(e.name) + '</div>';
                html += '<div class="event-dkp">' + (e.dkp || 0) + ' DKP</div>';
                html += '<div class="event-actions">';
                html += '<button class="btn-edit" onclick="editEvent(\'' + escapeForOnclick(e.id) + '\')">✎</button>';
                html += '<button class="btn-remove" onclick="deleteEvent(\'' + escapeForOnclick(e.id) + '\')">🗑</button>';
                html += '</div></div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет мероприятий</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function createEvent() {
    const name = document.getElementById('newEventName')?.value?.trim();
    const dkp = Number(document.getElementById('newEventDkp')?.value) || 0;
    const msg = document.getElementById('eventMessage');

    if (!name) {
        showAdminMessage(msg, 'Введите название', 'error');
        return;
    }

    try {
        const res = await api('createEvent', { name: name, dkp: dkp });
        if (res.success) {
            showAdminMessage(msg, '✅ Создано', 'success');
            document.getElementById('newEventName').value = '';
            document.getElementById('newEventDkp').value = '';
            loadEvents();
        } else {
            showAdminMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showAdminMessage(msg, '❌ Ошибка', 'error');
    }
}

async function deleteEvent(id) {
    if (!confirm('Удалить мероприятие?')) return;

    try {
        const res = await api('deleteEvent', { id: id });
        if (res.success) loadEvents();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// ЮЗЕРЫ
// ============================================================

async function loadUsers() {
    const list = document.getElementById('usersList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getUsers');

        if (res.success && res.users && res.users.length > 0) {
            let html = '';
            for (const u of res.users) {
                const roleBadge = getRoleBadge(u.role);
                const statusBadge = u.status === 'banned' ? '<span class="status-badge status-banned">Бан</span>' : '<span class="status-badge status-active">Активен</span>';

                html += '<div class="user-card">';
                html += '<div class="user-info">';
                html += '<div class="user-nick">' + escapeHtml(u.nickname) + roleBadge + '</div>';
                html += '<div class="user-status">' + statusBadge + '</div>';
                html += '<div class="user-date">' + (u.registered || '') + '</div>';
                html += '</div>';

                if (currentRole === 'Админ') {
                    html += '<div class="user-actions">';
                    if (u.role !== 'Админ') html += '<button class="btn-edit" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\', \'Админ\')">⬆ Админ</button>';
                    if (u.role !== 'Модератор') html += '<button class="btn-edit" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\', \'Модератор\')">⬆ Мод</button>';
                    if (u.role !== 'Игрок') html += '<button class="btn-edit" onclick="setUserRole(\'' + escapeForOnclick(u.nickname) + '\', \'Игрок\')">⬇ Игрок</button>';
                    if (u.status !== 'banned') html += '<button class="btn-remove" onclick="banUser(\'' + escapeForOnclick(u.nickname) + '\')">🚫</button>';
                    else html += '<button class="btn-approve" onclick="unbanUser(\'' + escapeForOnclick(u.nickname) + '\')">✅</button>';
                    html += '<button class="btn-remove" onclick="deleteUser(\'' + escapeForOnclick(u.nickname) + '\')">🗑</button>';
                    html += '</div>';
                }

                html += '</div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет пользователей</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function setUserRole(nickname, role) {
    if (!confirm('Изменить роль ' + nickname + ' на ' + role + '?')) return;

    try {
        const res = await api('setUserRole', { nickname: nickname, newRole: role });
        if (res.success) {
            alert('✅ Роль изменена');
            loadUsers();
        } else {
            alert('❌ ' + (res.message || 'Ошибка'));
        }
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function banUser(nickname) {
    if (!confirm('Заблокировать ' + nickname + '?')) return;

    try {
        const res = await api('banUser', { nickname: nickname });
        if (res.success) loadUsers();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function unbanUser(nickname) {
    try {
        const res = await api('unbanUser', { nickname: nickname });
        if (res.success) loadUsers();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

async function deleteUser(nickname) {
    if (!confirm('Удалить пользователя ' + nickname + '? Это необратимо!')) return;

    try {
        const res = await api('deleteUser', { nickname: nickname });
        if (res.success) loadUsers();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// ФУНКЦИИ САЙТА
// ============================================================

const SITE_FEATURES = [
    { id: 'achievements', name: 'Достижения' },
    { id: 'levels', name: 'Уровни' },
    { id: 'stats', name: 'Личная статистика' },
    { id: 'announcements', name: 'Объявления' },
    { id: 'actionLog', name: 'Лог действий' },
    { id: 'cosmetics', name: 'Магазин косметики' },
    { id: 'friends', name: 'Друзья' },
    { id: 'dailyBonus', name: 'Ежедневные бонусы' },
    { id: 'export', name: 'Экспорт данных' },
    { id: 'twinks', name: 'Твинки' },
    { id: 'skillRarity', name: 'Редкость навыков' },
    { id: 'missingLists', name: 'Списки "у кого нет"' },
    { id: 'equipmentTop', name: 'Топ экипировки' },
    { id: 'auctionRating', name: 'Рейтинг перед аукционом' },
    { id: 'notifications5min', name: 'Уведомления за 5 мин' },
    { id: 'penalties', name: 'Штрафы' }
];

async function loadSiteFeaturesAdmin() {
    const list = document.getElementById('siteFeaturesList');
    if (!list) return;

    try {
        const res = await api('getSiteFeatures');
        const features = res.features || {};

        let html = '';
        for (const f of SITE_FEATURES) {
            const enabled = features[f.id] !== false;
            html += '<div class="feature-item">';
            html += '<div class="feature-name">' + f.name + '</div>';
            html += '<div class="feature-code">' + f.id + '</div>';
            html += '<span class="feature-status ' + (enabled ? 'on' : 'off') + '">' + (enabled ? '✅ ВКЛ' : '⚠️ ВЫКЛ') + '</span>';
            html += '<button class="btn-edit" onclick="toggleFeature(\'' + f.id + '\', ' + !enabled + ')">' + (enabled ? 'Выключить' : 'Включить') + '</button>';
            html += '</div>';
        }
        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function toggleFeature(featureId, enable) {
    try {
        const res = await api('toggleFeature', { featureId: featureId, enable: enable });
        if (res.success) loadSiteFeaturesAdmin();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// ЛОГ ДЕЙСТВИЙ
// ============================================================

async function loadActionLog() {
    const list = document.getElementById('actionLogList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getActionLog');

        if (res.success && res.log && res.log.length > 0) {
            let html = '';
            for (const entry of res.log) {
                html += '<div class="log-entry">';
                html += '<div class="log-date">' + (entry.date || '') + '</div>';
                html += '<div class="log-action">' + escapeHtml(entry.action || '') + '</div>';
                html += '<div class="log-user">' + escapeHtml(entry.user || '') + '</div>';
                html += '<div class="log-details">' + escapeHtml(entry.details || '') + '</div>';
                html += '</div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Лог пуст</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function clearActionLog() {
    if (!confirm('Очистить весь лог?')) return;

    try {
        const res = await api('clearActionLog');
        if (res.success) loadActionLog();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// СПИСКИ "У КОГО НЕТ"
// ============================================================

async function findMissing() {
    const type = document.getElementById('missingType')?.value;
    const name = document.getElementById('missingName')?.value;
    const result = document.getElementById('missingResult');

    if (!type || !name) {
        alert('Выберите тип и название');
        return;
    }

    if (result) result.innerHTML = '<div style="text-align:center;padding:16px;">Поиск...</div>';

    try {
        const res = await api('findMissing', { type: type, name: name });

        if (res.success && res.players && res.players.length > 0) {
            let html = '<div class="missing-list">';
            html += '<div class="missing-count">Найдено: ' + res.players.length + '</div>';
            for (const p of res.players) {
                html += '<div class="missing-player">' + escapeHtml(p) + '</div>';
            }
            html += '</div>';
            if (result) result.innerHTML = html;
        } else {
            if (result) result.innerHTML = '<div class="empty-state">Все имеют</div>';
        }
    } catch (e) {
        if (result) result.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

// ============================================================
// ЭКСПОРТ
// ============================================================

async function exportData(type) {
    const resultEl = document.getElementById('exportResult');

    try {
        if (resultEl) resultEl.innerHTML = '<div class="message">⏳ Экспорт...</div>';

        const res = await api('exportData', { type: type });

        if (res.success && res.csv) {
            const blob = new Blob(['\uFEFF' + res.csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rf_export_' + type + '_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (resultEl) {
                resultEl.innerHTML = '<div class="message success" style="display:block;">✅ Файл скачан!</div>';
                setTimeout(function() { resultEl.innerHTML = ''; }, 3000);
            }
        } else {
            if (resultEl) resultEl.innerHTML = '<div class="message error" style="display:block;">❌ ' + escapeHtml(res.message || 'Ошибка') + '</div>';
        }
    } catch (e) {
        if (resultEl) resultEl.innerHTML = '<div class="message error" style="display:block;">❌ Ошибка</div>';
    }
}

// ============================================================
// ТВИНКИ (АДМИН)
// ============================================================

async function linkTwink() {
    const main = document.getElementById('twinkMain')?.value?.trim();
    const twink = document.getElementById('twinkSecondary')?.value?.trim();
    const msg = document.getElementById('twinkMessage');

    if (!main || !twink) {
        showAdminMessage(msg, 'Заполните оба поля', 'error');
        return;
    }

    try {
        const res = await api('linkTwink', { mainAccount: main, twinkAccount: twink });
        if (res.success) {
            showAdminMessage(msg, '✅ Привязано', 'success');
            document.getElementById('twinkMain').value = '';
            document.getElementById('twinkSecondary').value = '';
            loadTwinksList();
        } else {
            showAdminMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showAdminMessage(msg, '❌ Ошибка', 'error');
    }
}

async function loadTwinksList() {
    const list = document.getElementById('twinksList');
    if (!list) return;

    try {
        const res = await api('getAllTwinks');

        if (res.success && res.twinks && res.twinks.length > 0) {
            let html = '';
            for (const t of res.twinks) {
                html += '<div class="twink-link">';
                html += '<span>' + escapeHtml(t.main) + '</span>';
                html += '<span>→</span>';
                html += '<span>' + escapeHtml(t.twink) + '</span>';
                html += '<button class="btn-remove" onclick="unlinkTwink(\'' + escapeForOnclick(t.twink) + '\')">✕</button>';
                html += '</div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет привязок</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function unlinkTwink(twink) {
    if (!confirm('Отвязать твинка?')) return;

    try {
        const res = await api('unlinkTwink', { twinkAccount: twink });
        if (res.success) loadTwinksList();
    } catch (e) {
        alert('❌ Ошибка');
    }
}

// ============================================================
// МОДАЛКА ИЗОБРАЖЕНИЙ
// ============================================================

function openImageModal(url) {
    const img = document.getElementById('modalImage');
    if (img) img.src = url;
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.remove('hidden');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.add('hidden');
}

function showAdminMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(function() { el.style.display = 'none'; }, 4000);
    }
}

// Экспорт
window.loadPendingPlayers = loadPendingPlayers;
window.approvePlayer = approvePlayer;
window.rejectPlayer = rejectPlayer;
window.loadPendingSkills = loadPendingSkills;
window.approveSkills = approveSkills;
window.rejectSkills = rejectSkills;
window.applyManualDkp = applyManualDkp;
window.loadEvents = loadEvents;
window.createEvent = createEvent;
window.deleteEvent = deleteEvent;
window.loadUsers = loadUsers;
window.setUserRole = setUserRole;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.deleteUser = deleteUser;
window.loadSiteFeaturesAdmin = loadSiteFeaturesAdmin;
window.toggleFeature = toggleFeature;
window.loadActionLog = loadActionLog;
window.clearActionLog = clearActionLog;
window.findMissing = findMissing;
window.exportData = exportData;
window.linkTwink = linkTwink;
window.loadTwinksList = loadTwinksList;
window.unlinkTwink = unlinkTwink;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
