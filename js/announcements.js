// ============================================================
// 📢 ОБЪЯВЛЕНИЯ (КАРУСЕЛЬ)
// ============================================================

async function loadAnnouncements() {
    const b = document.getElementById('announcementsBlock');
    if (!b) return;
    if (!currentUser) { b.style.display = 'none'; b.innerHTML = ''; return; }
    if (!isFeatureEnabled('announcements')) { b.style.display = 'none'; b.innerHTML = ''; return; }
    b.style.display = 'block';
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAnnouncements' }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.announcements && res.announcements.length > 0) {
            let html = '<div class="panel-title">📢 ОБЪЯВЛЕНИЯ</div><div class="announcements-carousel">';
            html += '<button class="carousel-btn prev" onclick="scrollAnnouncements(-1)" title="Назад">‹</button>';
            html += '<div class="announcements-track" id="announcementsTrack">';
            for (let i = 0; i < res.announcements.length; i++) {
                const a = res.announcements[i];
                let tc = 'type-info', ti = '🔵';
                if (a.type === 'important') { tc = 'type-important'; ti = '🔴'; }
                else if (a.type === 'event') { tc = 'type-event'; ti = '🟡'; }
                else if (a.type === 'success') { tc = 'type-success'; ti = '🟢'; }
                html += '<div class="announcement-card-slide ' + tc + '"><div class="announcement-title">' + ti + ' ' + escapeHtml(a.title) + '</div><div class="announcement-message">' + escapeHtml(a.message) + '</div><div class="announcement-meta">📅 ' + escapeHtml(a.date) + ' | 👤 ' + escapeHtml(a.createdBy || 'Администрация') + '</div></div>';
            }
            html += '</div><button class="carousel-btn next" onclick="scrollAnnouncements(1)" title="Вперёд">›</button></div>';
            if (res.announcements.length > 1) {
                html += '<div class="carousel-dots" id="announcementsDots">';
                for (let i = 0; i < res.announcements.length; i++) html += '<div class="carousel-dot ' + (i === 0 ? 'active' : '') + '" onclick="scrollAnnouncementsTo(' + i + ')"></div>';
                html += '</div>';
            }
            b.innerHTML = html;
            setTimeout(updateAnnouncementButtons, 100);
        } else b.innerHTML = '<div style="padding:8px;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text-dim);">📢 Нет активных объявлений</div>';
    } catch (e) { console.error(e); }
}

function scrollAnnouncements(direction) {
    const track = document.getElementById('announcementsTrack');
    if (!track) return;
    track.scrollBy({ left: direction * 300, behavior: 'smooth' });
    setTimeout(updateAnnouncementButtons, 350);
}

function scrollAnnouncementsTo(index) {
    const track = document.getElementById('announcementsTrack');
    if (!track) return;
    const card = track.children[index];
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setTimeout(updateAnnouncementButtons, 350);
}

function updateAnnouncementButtons() {
    const track = document.getElementById('announcementsTrack');
    if (!track) return;
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const dots = document.querySelectorAll('.carousel-dot');
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 5;
    if (nextBtn) nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    if (dots.length > 0) {
        const activeIndex = Math.round(track.scrollLeft / 300);
        dots.forEach(function(dot, i) { dot.classList.toggle('active', i === activeIndex); });
    }
}

async function loadAdminAnnouncements() {
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllAnnouncements' }), redirect: 'follow' });
        const res = await r.json();
        const l = document.getElementById('adminAnnouncementsList');
        if (!l) return;
        if (res.success && res.announcements && res.announcements.length > 0) {
            let html = '';
            for (let i = 0; i < res.announcements.length; i++) {
                const a = res.announcements[i];
                let ti = '🔵', bc = 'var(--accent)';
                if (a.type === 'important') { ti = '🔴'; bc = 'var(--danger)'; }
                else if (a.type === 'event') { ti = '🟡'; bc = 'var(--warning)'; }
                else if (a.type === 'success') { ti = '🟢'; bc = 'var(--success)'; }
                const statusBadge = a.active ? '<span style="color:var(--success);font-size:8px;">✅ Активно</span>' : '<span style="color:var(--text-dim);font-size:8px;">⚠️ Скрыто</span>';
                html += '<div style="background:var(--bg-soft);border:1px solid var(--border);border-left:4px solid ' + bc + ';padding:8px;border-radius:var(--radius-sm);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;"><div style="flex:1;"><div style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:3px;">' + ti + ' ' + escapeHtml(a.title) + ' ' + statusBadge + '</div><div style="font-size:11px;color:var(--text-main);margin-bottom:3px;">' + escapeHtml(a.message) + '</div><div style="font-size:9px;color:var(--text-dim);">📅 ' + escapeHtml(a.date) + ' | 👤 ' + escapeHtml(a.createdBy || 'Администрация') + '</div></div><div style="display:flex;gap:4px;"><button class="btn-edit" style="width:auto;margin-top:0;padding:3px 6px;" onclick="openEditAnnouncementModal(\'' + escapeForOnclick(a.id) + '\', \'' + escapeForOnclick(a.title) + '\', \'' + escapeForOnclick(a.type) + '\', \'' + escapeForOnclick(a.message) + '\')">✎</button><button class="btn-remove" onclick="deleteAnnouncement(\'' + escapeForOnclick(a.id) + '\')">🗑</button></div></div>';
            }
            l.innerHTML = html;
        } else l.innerHTML = '<div class="empty-state">Нет объявлений</div>';
    } catch (e) { console.error(e); }
}

async function createAnnouncement() {
    const t = document.getElementById('newAnnouncementTitle').value.trim();
    const m = document.getElementById('newAnnouncementMessage').value.trim();
    const ty = document.getElementById('newAnnouncementType').value;
    const msg = document.getElementById('announcementsMessage');
    if (!t || !m) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Заполните все поля'; msg.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'createAnnouncement', title: t, message: m, type: ty, createdBy: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; document.getElementById('newAnnouncementTitle').value = ''; document.getElementById('newAnnouncementMessage').value = ''; loadAdminAnnouncements(); loadAnnouncements(); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; } }
    if (msg) { msg.style.display = 'block'; setTimeout(function() { msg.style.display = 'none'; }, 3000); }
}

async function deleteAnnouncement(id) {
    if (!confirm('Удалить объявление?')) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteAnnouncement', id: id }), redirect: 'follow' });
        const res = await r.json();
        if (res.success) { loadAdminAnnouncements(); loadAnnouncements(); }
        else alert('❌ ' + res.message);
    } catch (e) { alert('❌ Ошибка'); }
}

function openEditAnnouncementModal(id, title, type, message) {
    document.getElementById('editAnnouncementId').value = id;
    document.getElementById('editAnnouncementTitle').value = title;
    document.getElementById('editAnnouncementType').value = type;
    document.getElementById('editAnnouncementMessage').value = message;
    const msg = document.getElementById('editAnnouncementMsg');
    if (msg) msg.style.display = 'none';
    document.getElementById('editAnnouncementModal').classList.remove('hidden');
}

function closeEditAnnouncementModal() { document.getElementById('editAnnouncementModal').classList.add('hidden'); }

async function saveEditAnnouncement() {
    const id = document.getElementById('editAnnouncementId').value;
    const title = document.getElementById('editAnnouncementTitle').value.trim();
    const type = document.getElementById('editAnnouncementType').value;
    const message = document.getElementById('editAnnouncementMessage').value.trim();
    const msg = document.getElementById('editAnnouncementMsg');
    if (!title || !message) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Заполните все поля'; msg.style.display = 'block'; } return; }
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'editAnnouncement', id: id, title: title, message: message, type: type }), redirect: 'follow' });
        const res = await r.json();
        if (msg) {
            if (res.success) { msg.className = 'message success'; msg.innerText = '✅ ' + res.message; msg.style.display = 'block'; setTimeout(function() { closeEditAnnouncementModal(); loadAdminAnnouncements(); loadAnnouncements(); }, 1000); }
            else { msg.className = 'message error'; msg.innerText = '❌ ' + res.message; msg.style.display = 'block'; }
        }
    } catch (e) { if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка'; msg.style.display = 'block'; } }
}
