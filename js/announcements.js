// ============================================================
// 📢 ОБЪЯВЛЕНИЯ (КАРУСЕЛЬ)
// ============================================================

async function loadAnnouncements() {
    const block = document.getElementById('announcementsBlock');
    if (!block) return;

    if (!currentUser || !isFeatureEnabled('announcements')) {
        block.style.display = 'none';
        block.innerHTML = '';
        return;
    }

    block.style.display = 'block';

    try {
        const res = await api('getAnnouncements');

        if (res.success && res.announcements && res.announcements.length > 0) {
            let html = '<div class="panel-title">📢 ОБЪЯВЛЕНИЯ</div>';
            html += '<div class="announcements-carousel">';
            html += '<button class="carousel-btn prev" onclick="scrollAnnouncements(-1)" title="Назад">‹</button>';
            html += '<div class="announcements-track" id="announcementsTrack">';

            for (const a of res.announcements) {
                let typeClass = 'type-info';
                let typeIcon = '🔵';

                if (a.type === 'important') { typeClass = 'type-important'; typeIcon = '🔴'; }
                else if (a.type === 'event') { typeClass = 'type-event'; typeIcon = '🟡'; }
                else if (a.type === 'success') { typeClass = 'type-success'; typeIcon = '🟢'; }

                html += '<div class="announcement ' + typeClass + '">';
                html += '<div class="announcement-icon">' + typeIcon + '</div>';
                html += '<div class="announcement-content">';
                html += '<div class="announcement-title">' + escapeHtml(a.title) + '</div>';
                html += '<div class="announcement-message">' + escapeHtml(a.message) + '</div>';
                html += '</div>';
                html += '</div>';
            }

            html += '</div>';
            html += '<button class="carousel-btn next" onclick="scrollAnnouncements(1)" title="Вперёд">›</button>';
            html += '</div>';

            block.innerHTML = html;
        } else {
            block.innerHTML = '';
            block.style.display = 'none';
        }
    } catch (e) {
        block.style.display = 'none';
    }
}

function scrollAnnouncements(direction) {
    const track = document.getElementById('announcementsTrack');
    if (!track) return;

    const scrollAmount = 280;
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

async function loadAdminAnnouncements() {
    const list = document.getElementById('adminAnnouncementsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--accent);">Загрузка...</div>';

    try {
        const res = await api('getAnnouncements');

        if (res.success && res.announcements && res.announcements.length > 0) {
            let html = '';
            for (const a of res.announcements) {
                html += '<div class="admin-announcement">';
                html += '<div class="admin-announcement-title">' + escapeHtml(a.title) + '</div>';
                html += '<div class="admin-announcement-message">' + escapeHtml(a.message) + '</div>';
                html += '<div class="admin-announcement-actions">';
                html += '<button class="btn-edit" onclick="openEditAnnouncement(\'' + escapeForOnclick(a.id) + '\')">✎</button>';
                html += '<button class="btn-remove" onclick="deleteAnnouncement(\'' + escapeForOnclick(a.id) + '\')">✕</button>';
                html += '</div>';
                html += '</div>';
            }
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="empty-state">Нет объявлений</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="empty-state">Ошибка</div>';
    }
}

async function createAnnouncement() {
    const title = document.getElementById('newAnnouncementTitle')?.value?.trim();
    const message = document.getElementById('newAnnouncementMessage')?.value?.trim();
    const type = document.getElementById('newAnnouncementType')?.value || 'info';
    const msg = document.getElementById('createAnnouncementMessage');

    if (!title || !message) {
        showAnnouncementMessage(msg, 'Заполните все поля', 'error');
        return;
    }

    try {
        showAnnouncementMessage(msg, 'Создание...', '');
        const res = await api('createAnnouncement', { title, message, type });

        if (res.success) {
            showAnnouncementMessage(msg, res.message || 'Создано', 'success');
            document.getElementById('newAnnouncementTitle').value = '';
            document.getElementById('newAnnouncementMessage').value = '';
            setTimeout(() => {
                loadAdminAnnouncements();
                loadAnnouncements();
            }, 800);
        } else {
            showAnnouncementMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showAnnouncementMessage(msg, 'Ошибка соединения', 'error');
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Удалить объявление?')) return;

    try {
        const res = await api('deleteAnnouncement', { id: id });
        if (res.success) {
            loadAdminAnnouncements();
            loadAnnouncements();
        } else {
            alert(res.message || 'Ошибка');
        }
    } catch (e) {
        alert('Ошибка');
    }
}

function openEditAnnouncement(id) {
    // Заполняется из текущих данных или дополнительным запросом
    document.getElementById('editAnnouncementId').value = id;
    document.getElementById('editAnnouncementModal')?.classList.remove('hidden');
}

function closeEditAnnouncementModal() {
    document.getElementById('editAnnouncementModal')?.classList.add('hidden');
}

async function saveEditAnnouncement() {
    const id = document.getElementById('editAnnouncementId')?.value;
    const title = document.getElementById('editAnnouncementTitle')?.value?.trim();
    const type = document.getElementById('editAnnouncementType')?.value;
    const message = document.getElementById('editAnnouncementMessage')?.value?.trim();
    const msg = document.getElementById('editAnnouncementMsg');

    if (!title || !message) {
        showAnnouncementMessage(msg, 'Заполните все поля', 'error');
        return;
    }

    try {
        const res = await api('editAnnouncement', { id, title, message, type });

        if (res.success) {
            showAnnouncementMessage(msg, res.message || 'Сохранено', 'success');
            setTimeout(() => {
                closeEditAnnouncementModal();
                loadAdminAnnouncements();
                loadAnnouncements();
            }, 1000);
        } else {
            showAnnouncementMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showAnnouncementMessage(msg, 'Ошибка', 'error');
    }
}

function showAnnouncementMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
