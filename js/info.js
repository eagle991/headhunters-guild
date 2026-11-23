// ============================================================
// ℹ️ СТРАНИЦА ИНФО
// ============================================================

async function loadInfoContent() {
    const display = document.getElementById('infoContentDisplay');
    const editBtn = document.getElementById('infoEditBtn');
    const updatedBy = document.getElementById('infoUpdatedBy');
    const updatedAt = document.getElementById('infoUpdatedAt');

    if (!display) return;

    if (editBtn) editBtn.style.display = (currentRole === 'Админ') ? 'inline-block' : 'none';

    display.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getInfoContent');

        if (res.success) {
            display.innerHTML = renderMarkdown(res.content || '');
            if (updatedBy) updatedBy.innerText = '👤 ' + (res.updatedBy || '—');
            if (updatedAt) updatedAt.innerText = '📅 ' + (res.updatedAt || '—');
        } else {
            display.innerHTML = '<div class="empty-state">❌ ' + escapeHtml(res.message || 'Ошибка') + '</div>';
        }
    } catch (e) {
        display.innerHTML = '<div class="empty-state">❌ Ошибка загрузки</div>';
    }
}

function renderMarkdown(text) {
    if (!text) return '';

    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Заголовки
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Жирный и курсив
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Списки
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Горизонтальная линия
    html = html.replace(/^---$/gm, '<hr>');

    // Переносы строк
    html = html.replace(/\n/g, '<br>');

    return html;
}

function openEditInfoModal() {
    const modal = document.getElementById('editInfoModal');
    const textarea = document.getElementById('editInfoContent');

    if (modal) modal.classList.remove('hidden');

    // Загружаем текущее содержимое
    api('getInfoContent').then(res => {
        if (res.success && textarea) {
            textarea.value = res.content || '';
        }
    });
}

function closeEditInfoModal() {
    document.getElementById('editInfoModal')?.classList.add('hidden');
}

async function saveInfoContent() {
    const content = document.getElementById('editInfoContent')?.value?.trim();
    const msg = document.getElementById('editInfoMessage');

    if (!content) {
        showInfoMessage(msg, 'Введите содержимое', 'error');
        return;
    }

    if (!confirm('Сохранить изменения?')) return;

    try {
        showInfoMessage(msg, '⏳ Сохранение...', '');
        const res = await api('updateInfoContent', {
            content: content,
            adminName: currentUser,
            role: currentRole
        });

        if (res.success) {
            showInfoMessage(msg, '✅ ' + (res.message || 'Сохранено'), 'success');
            setTimeout(() => {
                closeEditInfoModal();
                loadInfoContent();
            }, 1200);
        } else {
            showInfoMessage(msg, '❌ ' + (res.message || 'Ошибка'), 'error');
        }
    } catch (e) {
        showInfoMessage(msg, '❌ Ошибка соединения', 'error');
    }
}

function resetInfoToDefault() {
    if (!confirm('⚠️ Сбросить содержимое к стандартному?')) return;

    const textarea = document.getElementById('editInfoContent');
    if (textarea) {
        textarea.value = `# 🌌 RF ONLINE NEXT — Полное руководство

Добро пожаловать!

---

## 🏠 ГЛАВНАЯ
Единый рейтинг с 6 вкладками.

## 👤 КАБИНЕТ
Персональные данные, инвентарь, навыки, достижения.

## 💰 DKP
Очки лута с OCR-распознаванием.

## 🔨 АУКЦИОН
4 типа аукционов с подписками.

## 🏰 ГИЛЬДИИ
Создание, управление, казна DKP.

## 📊 АНАЛИТИКА
Дашборд администратора.

*Версия: 17.20*`;
    }
    alert('✅ Стандартное содержимое загружено. Нажмите "💾 Сохранить".');
}

function showInfoMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
}
