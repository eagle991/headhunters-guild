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
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getInfoContent' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) {
            display.innerHTML = renderMarkdown(res.content);
            if (updatedBy) updatedBy.innerText = '👤 ' + res.updatedBy;
            if (updatedAt) updatedAt.innerText = '📅 ' + res.updatedAt;
        } else display.innerHTML = '<div class="empty-state">❌ ' + res.message + '</div>';
    } catch (e) { display.innerHTML = '<div class="empty-state">❌ Ошибка</div>'; }
}

function renderMarkdown(text) {
    if (!text) return '';
    let html = text;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) { return '<ul>' + match + '</ul>'; });
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    return html;
}

function showEditInfoModal() {
    if (currentRole !== 'Админ') { alert('⛔ Только администратор'); return; }
    const textarea = document.getElementById('editInfoContent');
    const msg = document.getElementById('editInfoMessage');
    if (msg) { msg.style.display = 'none'; msg.className = 'message'; }
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getInfoContent' }), redirect: 'follow' })
        .then(r => r.json())
        .then(res => { if (res.success) textarea.value = res.content; })
        .catch(e => console.error(e));
    document.getElementById('editInfoModal').classList.remove('hidden');
}

function closeEditInfoModal() { document.getElementById('editInfoModal').classList.add('hidden'); }

async function saveInfoContent() {
    const content = document.getElementById('editInfoContent').value;
    const msg = document.getElementById('editInfoMessage');
    if (!content || content.trim().length === 0) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Пустое содержимое'; msg.style.display = 'block'; } return; }
    if (!confirm('Сохранить изменения?')) return;
    if (msg) { msg.className = 'message'; msg.innerText = '⏳ Сохранение...'; msg.style.display = 'block'; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'updateInfoContent', content: content, adminName: currentUser, role: currentRole }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; setTimeout(function() { closeEditInfoModal(); loadInfoContent(); }, 1200); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}

function resetInfoToDefault() {
    if (!confirm('⚠️ Сбросить содержимое к стандартному?')) return;
    document.getElementById('editInfoContent').value = '# 🌌 RF ONLINE NEXT — Полное руководство\n\nДобро пожаловать!\n\n---\n\n## 🏠 ГЛАВНАЯ\nЕдиный рейтинг с 6 вкладками.\n\n## 👤 КАБИНЕТ\nПерсональные данные, инвентарь, навыки, достижения.\n\n## 💰 DKP\nОчки лута с OCR-распознаванием.\n\n## 🔨 АУКЦИОН\n4 типа аукционов с подписками.\n\n## 🏰 ГИЛЬДИИ\nСоздание, управление, казна DKP.\n\n## 📊 АНАЛИТИКА\nДашборд администратора.\n\n*Версия: 17.20*';
    alert('✅ Стандартное содержимое загружено. Нажмите "💾 Сохранить".');
}
