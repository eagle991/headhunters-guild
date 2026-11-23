// ============================================================
// ⏰ ТАЙМЕРЫ МЕРОПРИЯТИЙ
// ============================================================

const DAYS_OF_WEEK = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const DAYS_OF_WEEK_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

let eventTimersData = [];
let eventTimersInterval = null;

// ============================================================
// 📥 ЗАГРУЗКА ТАЙМЕРОВ
// ============================================================

async function loadEventTimers() {
    const container = document.getElementById('eventTimersContainer');
    if (!container) return;
    
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getEventTimers' }),
            redirect: 'follow'
        });
        const res = await r.json();
        
        if (res.success && res.timers && res.timers.length > 0) {
            eventTimersData = res.timers.filter(function(t) { return t.active !== false; });
            renderEventTimers();
            startEventTimersUpdate();
        } else {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim);grid-column:1/-1;">Нет активных таймеров</div>';
        }
    } catch (e) {
        console.error('Ошибка загрузки таймеров:', e);
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);grid-column:1/-1;">❌ Ошибка загрузки</div>';
    }
}

function startEventTimersUpdate() {
    if (eventTimersInterval) clearInterval(eventTimersInterval);
    eventTimersInterval = setInterval(renderEventTimers, 1000);
}

function stopEventTimersUpdate() {
    if (eventTimersInterval) {
        clearInterval(eventTimersInterval);
        eventTimersInterval = null;
    }
}

// ============================================================
// 🧮 РАСЧЁТ СЛЕДУЮЩЕГО СОБЫТИЯ
// ============================================================

function calculateNextEvent(timer) {
    const now = new Date();
    const timeParts = timer.time.split(':');
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    const targetDay = timer.dayOfWeek;
    
    if (timer.isBiweekly && timer.baseDate) {
        // 🔁 ДВУХНЕДЕЛЬНЫЕ ТАЙМЕРЫ
        const baseDate = new Date(timer.baseDate + 'T00:00:00');
        
        // Находим первое событие (базовая дата + время)
        let firstEvent = new Date(baseDate);
        firstEvent.setHours(hours, minutes, 0, 0);
        
        // Если базовая дата не совпадает с нужным днём недели — корректируем
        let safety = 0;
        while (firstEvent.getDay() !== targetDay && safety < 8) {
            firstEvent.setDate(firstEvent.getDate() + 1);
            safety++;
        }
        
        // Если первое событие уже прошло — ищем следующее
        if (firstEvent <= now) {
            const msPerTwoWeeks = 14 * 24 * 60 * 60 * 1000;
            const periodsPassed = Math.floor((now - firstEvent) / msPerTwoWeeks);
            let nextEvent = new Date(firstEvent);
            nextEvent.setDate(nextEvent.getDate() + (periodsPassed + 1) * 14);
            nextEvent.setHours(hours, minutes, 0, 0);
            
            // Страховка: если всё ещё в прошлом
            if (nextEvent <= now) {
                nextEvent.setDate(nextEvent.getDate() + 14);
            }
            
            return nextEvent;
        }
        
        return firstEvent;
    } else {
        // 📅 ЕЖЕНЕДЕЛЬНЫЕ ТАЙМЕРЫ
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let daysUntil = targetDay - today.getDay();
        
        if (daysUntil < 0) daysUntil += 7;
        
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + daysUntil);
        nextDate.setHours(hours, minutes, 0, 0);
        
        if (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 7);
        }
        
        return nextDate;
    }
}

// ============================================================
// 🎯 ОПРЕДЕЛЕНИЕ СТАТУСА ТАЙМЕРА
// ============================================================

function getTimerStatus(timer, now) {
    const nextEvent = calculateNextEvent(timer);
    const eventDurationMs = (timerSettings.eventDurationMinutes || 120) * 60 * 1000;
    
    // 🟢 ПРОВЕРКА: ИДЁТ ЛИ СОБЫТИЕ СЕЙЧАС?
    if (now >= nextEvent && now < new Date(nextEvent.getTime() + eventDurationMs)) {
        return {
            status: 'active',
            nextEvent: nextEvent,
            endsAt: new Date(nextEvent.getTime() + eventDurationMs)
        };
    }
    
    // 🔴 ПРОВЕРКА: БЫЛО ЛИ СОБЫТИЕ СЕГОДНЯ И УЖЕ ПРОШЛО?
    const timeParts = timer.time.split(':');
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEvent = new Date(today);
    todayEvent.setHours(hours, minutes, 0, 0);
    const todayEventEnd = new Date(todayEvent.getTime() + eventDurationMs);
    
    if (todayEvent.getDay() === timer.dayOfWeek && 
        now >= todayEventEnd && 
        now < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        return {
            status: 'passed',
            nextEvent: nextEvent
        };
    }
    
    // 🔵 ИНАЧЕ: ОЖИДАНИЕ
    return {
        status: 'upcoming',
        nextEvent: nextEvent
    };
}

// ============================================================
// 🎨 РЕНДЕРИНГ ТАЙМЕРОВ
// ============================================================

function renderEventTimers() {
    const container = document.getElementById('eventTimersContainer');
    if (!container || eventTimersData.length === 0) return;
    
    const now = new Date();
    let html = '';
    
    // Сортируем: активные сначала, потом по времени следующего события
    const timersWithStatus = eventTimersData.map(function(t) {
        const statusInfo = getTimerStatus(t, now);
        return Object.assign({}, t, statusInfo);
    });
    
    timersWithStatus.sort(function(a, b) {
        const statusOrder = { active: 0, upcoming: 1, passed: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.nextEvent - b.nextEvent;
    });
    
    for (let idx = 0; idx < timersWithStatus.length; idx++) {
        const timer = timersWithStatus[idx];
        const statusClass = 'status-' + timer.status;
        const statusLabel = timer.status === 'active' ? '🟢 ИДЁТ' : (timer.status === 'passed' ? '🔴 ПРОШЛО' : '🔵 ОЖИДАНИЕ');
        const statusBadgeClass = timer.status;
        
        const countdown = timer.status === 'active'
            ? getTimeUntil(timer.endsAt, now)
            : getTimeUntil(timer.nextEvent, now);
        
        const countdownLabel = timer.status === 'active' ? 'До окончания:' : 'До начала:';
        
        const nextDateStr = timer.nextEvent.toLocaleDateString('ru-RU', {
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        });
        
        html += '<div class="event-timer-card ' + statusClass + '">';
        html += '<div class="event-timer-header">';
        html += '<div class="event-timer-name">' + escapeHtml(timer.name) + '</div>';
        html += '<div class="event-timer-status-badge ' + statusBadgeClass + '">' + statusLabel + '</div>';
        html += '</div>';
        
        html += '<div class="event-timer-schedule">';
        html += '<span class="schedule-icon">📅</span>';
        html += '<span class="schedule-day">' + DAYS_OF_WEEK[timer.dayOfWeek] + '</span>';
        html += '<span class="schedule-time">' + escapeHtml(timer.time) + '</span>';
        if (timer.isBiweekly) {
            html += '<span class="schedule-biweekly">2 нед.</span>';
        }
        html += '</div>';
        
        html += '<div class="event-timer-countdown">';
        html += '<div class="countdown-label">' + countdownLabel + '</div>';
        html += '<div class="countdown-value">' + countdown + '</div>';
        html += '<div class="countdown-next">📆 ' + nextDateStr + '</div>';
        html += '</div>';
        
        html += '<div class="event-timer-footer">';
        html += '<span>🔁 ' + (timer.isBiweekly ? 'Каждые 2 недели' : 'Еженедельно') + '</span>';
        html += '</div>';
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function getTimeUntil(targetDate, now) {
    const diff = targetDate - now;
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainHours = hours % 24;
        return days + 'д ' + String(remainHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }
    
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

// ============================================================
// ⚙️ АДМИНКА ТАЙМЕРОВ
// ============================================================

// ============================================================
// ⚙️ ГЛОБАЛЬНЫЕ НАСТРОЙКИ ТАЙМЕРОВ
// ============================================================

let timerSettings = {
    eventDurationMinutes: 120,
    showPassedTimers: true,
    sortActiveFirst: true,
    pulseAnimation: true,
    statusColorActive: '#10b981',
    statusColorPassed: '#ef4444',
    statusColorUpcoming: '#2563eb',
    enableNotifications: true
};

async function loadTimerSettings() {
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getTimerSettings' }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success && res.settings) {
            timerSettings = res.settings;
            applyTimerSettingsToForm();
            applyTimerSettingsToStyles();
        }
    } catch (e) {
        console.error('Ошибка загрузки настроек таймеров:', e);
    }
}

function applyTimerSettingsToForm() {
    const duration = document.getElementById('timerEventDuration');
    const showPassed = document.getElementById('timerShowPassed');
    const sortActive = document.getElementById('timerSortActiveFirst');
    const pulse = document.getElementById('timerPulseAnimation');
    const enableNotif = document.getElementById('timerEnableNotifications');
    const colorActive = document.getElementById('timerColorActive');
    const colorPassed = document.getElementById('timerColorPassed');
    const colorUpcoming = document.getElementById('timerColorUpcoming');
    
    if (duration) duration.value = timerSettings.eventDurationMinutes;
    if (showPassed) showPassed.checked = timerSettings.showPassedTimers;
    if (sortActive) sortActive.checked = timerSettings.sortActiveFirst;
    if (pulse) pulse.checked = timerSettings.pulseAnimation;
    if (enableNotif) enableNotif.checked = timerSettings.enableNotifications;
    if (colorActive) colorActive.value = timerSettings.statusColorActive;
    if (colorPassed) colorPassed.value = timerSettings.statusColorPassed;
    if (colorUpcoming) colorUpcoming.value = timerSettings.statusColorUpcoming;
}

function applyTimerSettingsToStyles() {
    const root = document.documentElement;
    root.style.setProperty('--timer-color-active', timerSettings.statusColorActive);
    root.style.setProperty('--timer-color-passed', timerSettings.statusColorPassed);
    root.style.setProperty('--timer-color-upcoming', timerSettings.statusColorUpcoming);
    
    if (!timerSettings.pulseAnimation) {
        root.style.setProperty('--timer-pulse', 'none');
    } else {
        root.style.setProperty('--timer-pulse', '');
    }
}

async function saveTimerSettings() {
    const msg = document.getElementById('timerSettingsMessage');
    
    const settings = {
        eventDurationMinutes: Number(document.getElementById('timerEventDuration').value) || 120,
        showPassedTimers: document.getElementById('timerShowPassed').checked,
        sortActiveFirst: document.getElementById('timerSortActiveFirst').checked,
        pulseAnimation: document.getElementById('timerPulseAnimation').checked,
        enableNotifications: document.getElementById('timerEnableNotifications').checked,
        statusColorActive: document.getElementById('timerColorActive').value,
        statusColorPassed: document.getElementById('timerColorPassed').value,
        statusColorUpcoming: document.getElementById('timerColorUpcoming').value
    };
    
    try {
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveTimerSettings',
                role: currentRole,
                savedBy: currentUser,
                ...settings
            }),
            redirect: 'follow'
        });
        const res = await r.json();
        
        if (msg) {
            if (res.success) {
                msg.className = 'message success';
                msg.innerText = '✅ ' + res.message;
                timerSettings = settings;
                applyTimerSettingsToStyles();
                renderEventTimers();
            } else {
                msg.className = 'message error';
                msg.innerText = '❌ ' + res.message;
            }
        }
    } catch (e) {
        if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; }
    }
    
    if (msg) { msg.style.display = 'block'; setTimeout(function() { msg.style.display = 'none'; }, 3000); }
}

// ============================================================
// 🖱️ ОБРАБОТЧИКИ ФОРМЫ СОЗДАНИЯ
// ============================================================

(function initTimerFormHandlers() {
    function attachHandler() {
        const typeSelect = document.getElementById('newTimerType');
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                const group = document.getElementById('newTimerBaseDateGroup');
                if (group) group.style.display = this.value === 'biweekly' ? 'block' : 'none';
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHandler);
    } else {
        attachHandler();
    }
})();
