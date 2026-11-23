// ============================================================
// 👥 ПОЛЬЗОВАТЕЛИ АДМИН
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
                html += `
                    <div class="player-card">
                        <div class="player-card-header">
                            <div class="player-nick">${escapeHtml(p.nickname)}</div>
                            <div class="action-buttons">
                                <button class="btn-approve" onclick="approvePlayer('${escapeForOnclick(p.nickname)}')">✓</button>
                                <button class="btn-reject" onclick="rejectPlayer('${escapeForOnclick(p.nickname)}')">✕</button>
                            </div>
                        </div>
                        <div class="data-grid">
                            <div class="data-item"><div class="data-label">БМ</div><div class="data-value">${p.bm || '—'}</div></div>
                            <div class="data-item"><div class="data-label">Уровень</div><div class="data-value">${p.level || '—'}</div></div>
                            <div class="data-item"><div class="data-label">Профессия</div><div class="data-value">${escapeHtml(p.profession || '—')}</div></div>
                        </div>
                    </div>`;
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
                resultEl.innerHTML = '<div class="message success" style="display:block;">✅ Файл ' + type + '.csv скачан!</div>';
                setTimeout(() => { resultEl.innerHTML = ''; }, 3000);
            }
        } else {
            if (resultEl) resultEl.innerHTML = '<div class="message error" style="display:block;">❌ ' + escapeHtml(res.message || 'Ошибка') + '</div>';
        }
    } catch (e) {
        if (resultEl) resultEl.innerHTML = '<div class="message error" style="display:block;">❌ Ошибка</div>';
    }
}

// ============================================================
// 🖼️ МОДАЛЬНОЕ ОКНО ИЗОБРАЖЕНИЙ
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
