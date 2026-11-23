// ============================================================
// 📅 КАЛЕНДАРЬ
// ============================================================

async function loadCalendarPlayers() {
    try {
        const res = await api('getAllPlayersForValidation');
        const select = document.getElementById('calendarPlayerFilter');

        if (res.success && select) {
            const currentValue = select.value;
            let html = '<option value="">Все</option>';

            for (const nick of (res.nicks || [])) {
                html += '<option value="' + escapeHtml(nick) + '">' + escapeHtml(nick) + '</option>';
            }

            select.innerHTML = html;
            select.value = currentValue;
        }

        // Установка дат по умолчанию
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setDate(today.getDate() - 30);

        const startInput = document.getElementById('calendarStartDate');
        const endInput = document.getElementById('calendarEndDate');

        if (startInput && !startInput.value) startInput.value = monthAgo.toISOString().split('T')[0];
        if (endInput && !endInput.value) endInput.value = today.toISOString().split('T')[0];

    } catch (e) {
        console.error('loadCalendarPlayers error:', e);
    }
}

async function loadCalendar() {
    const start = document.getElementById('calendarStartDate')?.value;
    const end = document.getElementById('calendarEndDate')?.value;
    const player = document.getElementById('calendarPlayerFilter')?.value || '';
    const container = document.getElementById('calendarContent');

    if (!start || !end) {
        alert('Выберите даты');
        return;
    }

    if (container) container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getCalendar', {
            startDate: start,
            endDate: end,
            player: player
        });

        if (res.success) {
            renderCalendar(res.events || []);
        } else {
            if (container) container.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
        }
    } catch (e) {
        if (container) container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

function renderCalendar(events) {
    const container = document.getElementById('calendarContent');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет событий за выбранный период</div>';
        return;
    }

    // Группировка по датам
    const grouped = {};
    for (const event of events) {
        const date = event.date || 'Без даты';
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(event);
    }

    let html = '';
    const dates = Object.keys(grouped).sort().reverse();

    for (const date of dates) {
        html += '<div class="calendar-day">';
        html += '<div class="calendar-date">' + escapeHtml(date) + '</div>';

        for (const event of grouped[date]) {
            html += '<div class="calendar-event">';
            html += '<div class="calendar-event-title">' + escapeHtml(event.title || 'Событие') + '</div>';
            if (event.player) {
                html += '<div class="calendar-event-player">' + escapeHtml(event.player) + '</div>';
            }
            if (event.description) {
                html += '<div class="calendar-event-desc">' + escapeHtml(event.description) + '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
    }

    container.innerHTML = html;
}

async function loadTodayActivity() {
    const container = document.getElementById('todayActivity');
    if (!container) return;

    try {
        const res = await api('getTodayActivity');

        if (res.success && res.activity && res.activity.length > 0) {
            let html = '<div class="activity-list">';
            for (const a of res.activity) {
                html += '<div class="activity-item">';
                html += '<span class="activity-player">' + escapeHtml(a.player) + '</span>';
                html += '<span class="activity-action">' + escapeHtml(a.action) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state">Нет активности сегодня</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function loadWeeklyActivity() {
    const container = document.getElementById('weeklyActivity');
    if (!container) return;

    try {
        const res = await api('getWeeklyActivity');

        if (res.success && res.activity && res.activity.length > 0) {
            let html = '<div class="activity-list">';
            for (const a of res.activity) {
                html += '<div class="activity-item">';
                html += '<span class="activity-player">' + escapeHtml(a.player) + '</span>';
                html += '<span class="activity-count">' + (a.count || 0) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state">Нет данных</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function loadEventStats() {
    const container = document.getElementById('eventStats');
    if (!container) return;

    try {
        const res = await api('getEventStats');

        if (res.success && res.stats) {
            const s = res.stats;
            container.innerHTML = `
                <div class="data-grid">
                    <div class="data-item"><div class="data-label">Событий</div><div class="data-value">${s.totalEvents || 0}</div></div>
                    <div class="data-item"><div class="data-label">Участников</div><div class="data-value">${s.totalParticipants || 0}</div></div>
                    <div class="data-item"><div class="data-label">Средняя посещаемость</div><div class="data-value">${s.avgAttendance || 0}%</div></div>
                </div>`;
        } else {
            container.innerHTML = '<div class="empty-state">Нет данных</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function loadRecentWinners() {
    const container = document.getElementById('recentWinners');
    if (!container) return;

    try {
        const res = await api('getRecentWinners');

        if (res.success && res.winners && res.winners.length > 0) {
            let html = '';
            for (const w of res.winners) {
                html += '<div class="winner-item">';
                html += '<div class="winner-nick">' + escapeHtml(w.nickname) + '</div>';
                html += '<div class="winner-item-name">' + escapeHtml(w.itemName) + '</div>';
                html += '<div class="winner-date">' + escapeHtml(w.date || '') + '</div>';
                html += '</div>';
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state">Нет победителей</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}
