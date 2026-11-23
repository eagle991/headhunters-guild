// ============================================================
// 🛠️ УТИЛИТЫ
// ============================================================

/**
 * Единая функция для запросов к бэкенду
 * @param {string} action - Название действия
 * @param {Object} data - Дополнительные данные
 * @returns {Promise<Object>}
 */
async function api(action, data = {}) {
    const payload = Object.assign({ action: action }, data);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error [' + action + ']:', error);
        return {
            success: false,
            message: 'Ошибка соединения с сервером',
            error: error.message
        };
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeForOnclick(str) {
    if (str == null) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function getIconBorderColor(c) {
    const colors = {
        'Белый': '#94a3b8',
        'Зеленый': 'var(--success)',
        'Синий': 'var(--accent)',
        'Фиолетовый': '#6b4aa8',
        'Желтый': 'var(--gold)',
        'Красный': 'var(--danger)'
    };
    return colors[c] || 'var(--border)';
}

function getColorClass(c) {
    const cls = {
        'Белый': 'color-white',
        'Зеленый': 'color-green',
        'Синий': 'color-blue',
        'Фиолетовый': 'color-purple',
        'Желтый': 'color-yellow',
        'Красный': 'color-red'
    };
    return cls[c] || 'color-white';
}

function getRoleBadge(r) {
    if (r === 'Админ') return ' <span style="color:var(--danger);font-size:9px;font-weight:700;">[АДМИН]</span>';
    if (r === 'Модератор') return ' <span style="color:var(--warning);font-size:9px;font-weight:700;">[МОД]</span>';
    if (r === 'Гость') return ' <span style="color:var(--text-dim);font-size:9px;font-weight:700;">[ГОСТЬ]</span>';
    return '';
}

function isFeatureEnabled(name) {
    if (!siteFeatures || typeof siteFeatures !== 'object') return true;
    if (siteFeatures[name] === undefined) return true;
    return !!siteFeatures[name];
}

// ============================================================
// 🔄 ПРОВЕРКА ОБНОВЛЕНИЙ
// ============================================================

let lastKnownVersion = null;

async function checkForUpdates() {
    try {
        const res = await api('getVersion');
        if (res.success && res.version) {
            if (lastKnownVersion === null) {
                lastKnownVersion = res.version;
            } else if (lastKnownVersion !== res.version) {
                if (currentUser && currentRole) {
                    localStorage.setItem('rf_session', JSON.stringify({
                        user: currentUser,
                        role: currentRole,
                        timestamp: Date.now()
                    }));
                }
                if (confirm('🔄 Доступна новая версия!\n\nOK — обновить.')) {
                    forceReload();
                }
                lastKnownVersion = res.version;
            }
        }
    } catch (e) {
        console.error('Version check failed:', e);
    }
}

// Инициализация (вызывается из app.js)
function initUtils() {
    loadSiteBackground();
    loadAllProfessionIcons();
    loadAllPlayersBioColors();
}
