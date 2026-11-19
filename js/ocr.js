// ============================================================
// 📸 OCR СКРИНШОТОВ ПЕРСОНАЖА
// ============================================================

async function loadCharacterScreenshots() {
    if (!currentUser) return;
    try {
        const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getCharacterScreenshots', nickname: currentUser }), redirect: 'follow' });
        const res = await r.json();
        if (res.success && res.screenshots && res.screenshots.length > 0) {
            for (let i = 0; i < res.screenshots.length; i++) {
                const s = res.screenshots[i];
                const type = s.screenshotType === 'stats1' ? 1 : 2;
                characterScreenshots[type] = s.imageData;
                const block = document.getElementById('screenshotBlock' + type);
                const preview = document.getElementById('screenshotPreview' + type);
                if (block && preview) {
                    preview.innerHTML = '<img src="' + s.imageData + '" onclick="event.stopPropagation(); openScreenshotZoom(\'' + escapeForOnclick(s.imageData) + '\')" style="max-width:100%;max-height:140px;cursor:zoom-in;border-radius:4px;"><button class="remove-screenshot" onclick="event.stopPropagation(); removeCharacterScreenshot(' + type + ')">✕</button>';
                    block.classList.add('has-image');
                }
                if (s.parsedData && Object.keys(s.parsedData).length > 0) {
                    for (const key in s.parsedData) parsedCharacterStats[key] = s.parsedData[key];
                }
            }
            if (Object.keys(parsedCharacterStats).length > 0) showParsedStats();
        }
    } catch (e) { console.error('Ошибка:', e); }
}

async function handleCharacterScreenshot(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Файл > 5 МБ'); return; }
    const block = document.getElementById('screenshotBlock' + type);
    const preview = document.getElementById('screenshotPreview' + type);
    const msg = document.getElementById('charScreenshotMessage');
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        characterScreenshots[type] = base64;
        if (preview) preview.innerHTML = '<img src="' + base64 + '" onclick="event.stopPropagation(); openScreenshotZoom(\'' + escapeForOnclick(base64) + '\')" style="max-width:100%;max-height:140px;cursor:zoom-in;border-radius:4px;"><button class="remove-screenshot" onclick="event.stopPropagation(); removeCharacterScreenshot(' + type + ')">✕</button>';
        if (block) block.classList.add('has-image');
        if (msg) { msg.innerText = '🔍 Распознавание...'; msg.className = 'message'; msg.style.display = 'block'; }
        try {
            const result = await recognizeCharacterStats(base64, type);
            if (result.success && Object.keys(result.stats).length > 0) {
                for (const key in result.stats) parsedCharacterStats[key] = result.stats[key];
                showParsedStats();
                if (msg) {
                    msg.className = 'message success';
                    const labels = { attack: 'Атака', defense: 'Защита', accuracy: 'Меткость', evasion: 'Уклонение', bm: 'БМ', level: 'Уровень' };
                    const recognized = [];
                    for (const key in result.stats) recognized.push((labels[key] || key) + ': ' + result.stats[key]);
                    msg.innerText = '✅ Распознано: ' + recognized.join(', ');
                }
            } else {
                if (msg) { msg.className = 'message error'; msg.innerText = '❌ Не удалось распознать'; }
            }
        } catch (err) {
            if (msg) { msg.className = 'message error'; msg.innerText = '❌ Ошибка: ' + err.message; }
        }
        if (msg) setTimeout(function() { msg.style.display = 'none'; }, 6000);
    };
    reader.readAsDataURL(file);
}

async function recognizeCharacterStats(base64, type) {
    const progress = document.getElementById('charScreenshotOcrProgress');
    const progressText = document.getElementById('charOcrProgressText');
    const progressBar = document.getElementById('charOcrProgressBar');
    if (progress) progress.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '5%';
    if (progressText) progressText.innerText = 'Инициализация Tesseract...';
    if (typeof Tesseract === 'undefined') {
        if (progress) progress.classList.add('hidden');
        return { success: false, message: 'Tesseract не загружен' };
    }
    try {
        const worker = await Tesseract.createWorker('eng', 1, {
            logger: function(m) {
                if (m.status === 'recognizing text' && m.progress) {
                    const percent = Math.round(m.progress * 100);
                    if (progressBar) progressBar.style.width = (5 + percent * 0.7) + '%';
                    if (progressText) progressText.innerText = percent + '%';
                }
            }
        });
        if (progressBar) progressBar.style.width = '15%';
        if (progressText) progressText.innerText = 'Подготовка вариантов...';
        const variants = [
            { name: 'original', image: base64 },
            { name: 'grayscale_3x', image: await convertToGrayscale(base64, 3) },
            { name: 'grayscale_5x', image: await convertToGrayscale(base64, 5) },
            { name: 'inverted_3x', image: await invertImage(base64, 3) },
            { name: 'inverted_5x', image: await invertImage(base64, 5) },
            { name: 'contrast_100', image: await highContrastImage(base64, 100, 3) },
            { name: 'contrast_128', image: await highContrastImage(base64, 128, 3) },
            { name: 'contrast_160', image: await highContrastImage(base64, 160, 3) },
            { name: 'contrast_200', image: await highContrastImage(base64, 200, 3) },
            { name: 'sharpened_4x', image: await sharpenImage(base64, 4) },
            { name: 'gamma_0.5_3x', image: await applyGamma(base64, 0.5, 3) },
            { name: 'gamma_1.5_3x', image: await applyGamma(base64, 1.5, 3) }
        ];
        let bestText = '', bestScore = 0, bestName = '';
        for (let i = 0; i < variants.length; i++) {
            if (progressText) progressText.innerText = 'Вариант ' + (i + 1) + '/' + variants.length;
            if (progressBar) progressBar.style.width = (15 + (i / variants.length) * 70) + '%';
            try {
                const result = await worker.recognize(variants[i].image);
                const text = result.data.text || '';
                const digitCount = (text.match(/\d/g) || []).length;
                const conf = result.data.confidence || 0;
                const kw = /(?:мощь|атака|защита|метк|уклонение|опыт|уровень|level|lv|боев)/i.test(text);
                const score = digitCount * 10 + (conf > 30 ? conf : 0) + (kw ? 100 : 0);
                if (score > bestScore) { bestScore = score; bestText = text; bestName = variants[i].name; }
            } catch (e) {}
        }
        await worker.terminate();
        if (progressBar) progressBar.style.width = '90%';
        if (progressText) progressText.innerText = 'Анализ...';
        lastRecognizedText[type] = bestText;
        const stats = {};
        const lines = bestText.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
        if (type === 1) {
            const grabNum = function(str) { const m = str.match(/(\d[\d\s.,]*)/); return m ? parseNumber(m[1]) : 0; };
            for (let i = 0; i < lines.length; i++) {
                const ln = lines[i];
                const low = ln.toLowerCase();
                if (/скорост|attack speed|skill speed|move/i.test(low)) continue;
                if (!stats.attack && /атак|attack|atk/i.test(low)) { let v = grabNum(ln); if (!v && lines[i+1]) v = grabNum(lines[i+1]); if (v > 50 && v < 100000) stats.attack = v; }
                if (!stats.defense && /защит|defense|def/i.test(low)) { let v = grabNum(ln); if (!v && lines[i+1]) v = grabNum(lines[i+1]); if (v > 50 && v < 100000) stats.defense = v; }
                if (!stats.accuracy && /метк|accuracy|acc/i.test(low)) { let v = grabNum(ln); if (!v && lines[i+1]) v = grabNum(lines[i+1]); if (v > 50 && v < 100000) stats.accuracy = v; }
                if (!stats.evasion && /уклон|evasion|eva/i.test(low)) { let v = grabNum(ln); if (!v && lines[i+1]) v = grabNum(lines[i+1]); if (v > 50 && v < 100000) stats.evasion = v; }
            }
        } else if (type === 2) {
            for (let i = 0; i < lines.length; i++) {
                const low = lines[i].toLowerCase();
                if (/мощь|боев|combat|bm/i.test(low)) {
                    const m = lines[i].match(/(?:мощь|bm|power|боев\w*)[\s:.]*([\d\s.,]+)/i);
                    if (m) { const v = parseNumber(m[1]); if (v > 1000 && v < 100000000) { stats.bm = v; break; } }
                    const nums = (lines[i].match(/\d[\d\s.,]*/g) || []).map(parseNumber).filter(function(n) { return n > 1000 && n < 100000000; });
                    if (nums.length) { stats.bm = Math.max.apply(null, nums); break; }
                }
            }
            if (!stats.bm) { const all = extractAllNumbers(bestText).filter(function(n) { return n > 10000 && n < 100000000; }); if (all.length) stats.bm = Math.max.apply(null, all); }
            let expIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (/опыт|experience|exp|уровень|level|lv/i.test(lines[i].toLowerCase())) { expIdx = i; break; }
            }
            if (expIdx > 0) {
                for (let i = expIdx - 1; i >= Math.max(0, expIdx - 3); i--) {
                    const t = lines[i].trim();
                    if (/^\d{1,3}$/.test(t) && t.indexOf('/') === -1) {
                        const v = parseInt(t);
                        if (v >= 1 && v <= 200) { stats.level = v; break; }
                    }
                }
            }
            if (!stats.level) {
                for (let i = 0; i < lines.length; i++) {
                    const t = lines[i].trim();
                    if (/^\d{1,3}$/.test(t) && t.indexOf('/') === -1) {
                        const v = parseInt(t);
                        if (v >= 1 && v <= 200 && v !== stats.bm) { stats.level = v; break; }
                    }
                }
            }
        }
        if (progress) progress.classList.add('hidden');
        return { success: Object.keys(stats).length > 0, stats: stats };
    } catch (e) {
        if (progress) progress.classList.add('hidden');
        return { success: false, message: e.message };
    }
}

function parseNumber(str) { if (!str) return 0; const cleaned = String(str).replace(/[\s.,]/g, ''); const num = parseInt(cleaned); return isNaN(num) ? 0 : num; }
function extractAllNumbers(text) { if (!text) return []; const matches = text.match(/\d[\d\s.,]{0,10}\d|\d/g) || []; return matches.map(parseNumber).filter(function(n) { return n > 0; }); }

async function convertToGrayscale(base64, scale) {
    if (!scale) scale = 2;
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

async function invertImage(base64, scale) {
    if (!scale) scale = 3;
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

async function highContrastImage(base64, threshold, scale) {
    if (!threshold) threshold = 140;
    if (!scale) scale = 3;
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const val = avg > threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

async function sharpenImage(base64, scale) {
    if (!scale) scale = 3;
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;
            const copy = new Uint8ClampedArray(data);
            const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                                sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                            }
                        }
                        const idx = (y * width + x) * 4 + c;
                        data[idx] = Math.min(255, Math.max(0, sum));
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

async function applyGamma(base64, gamma, scale) {
    if (!gamma) gamma = 1.0;
    if (!scale) scale = 3;
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const gammaCorrection = 1 / gamma;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 * Math.pow(data[i] / 255, gammaCorrection);
                data[i + 1] = 255 * Math.pow(data[i + 1] / 255, gammaCorrection);
                data[i + 2] = 255 * Math.pow(data[i + 2] / 255, gammaCorrection);
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

function showParsedStats() {
    const block = document.getElementById('parsedStatsBlock');
    const grid = document.getElementById('parsedStatsGrid');
    if (!block || !grid) return;
    const labels = { attack: '⚔️ Атака', defense: '🛡️ Защита', accuracy: '🎯 Меткость', evasion: '💨 Уклонение', bm: '🏋️ БМ', level: '⭐ Уровень' };
    const order = ['attack','defense','accuracy','evasion','bm','level'];
    let html = '';
    for (let i = 0; i < order.length; i++) {
        const key = order[i];
        if (parsedCharacterStats[key] !== undefined) html += '<div class="parsed-stat-item"><label>' + labels[key] + '</label><input type="number" id="parsed_' + key + '" value="' + parsedCharacterStats[key] + '" min="0"></div>';
    }
    grid.innerHTML = html;
    block.style.display = 'block';
}

function applyParsedStats() {
    for (const key in parsedCharacterStats) {
        const input = document.getElementById('parsed_' + key);
        if (input) {
            const value = input.value;
            const formInput = document.getElementById(key);
            if (formInput) formInput.value = value;
        }
    }
    const block = document.getElementById('parsedStatsBlock');
    if (block) block.style.display = 'none';
    const msg = document.getElementById('charScreenshotMessage');
    if (msg) { msg.className = 'message success'; msg.innerText = '✅ Значения применены'; msg.style.display = 'block'; setTimeout(function() { msg.style.display = 'none'; }, 3000); }
}

function removeCharacterScreenshot(type) {
    characterScreenshots[type] = null;
    lastRecognizedText[type] = '';
    const block = document.getElementById('screenshotBlock' + type);
    const preview = document.getElementById('screenshotPreview' + type);
    const input = document.getElementById('charScreenshot' + type);
    if (block) block.classList.remove('has-image');
    if (preview) preview.innerHTML = 'Нажмите или перетащите';
    if (input) input.value = '';
    if (type === 1) {
        delete parsedCharacterStats.attack;
        delete parsedCharacterStats.defense;
        delete parsedCharacterStats.accuracy;
        delete parsedCharacterStats.evasion;
    } else {
        delete parsedCharacterStats.bm;
        delete parsedCharacterStats.level;
    }
    if (Object.keys(parsedCharacterStats).length === 0) {
        const block = document.getElementById('parsedStatsBlock');
        if (block) block.style.display = 'none';
    } else showParsedStats();
}

async function saveCharacterScreenshots() {
    if (!currentUser) return;
    for (const type in characterScreenshots) {
        const imageData = characterScreenshots[type];
        if (imageData) {
            const screenshotType = type === '1' ? 'stats1' : 'stats2';
            const parsed = {};
            if (type === '1') {
                const attack = document.getElementById('parsed_attack');
                const defense = document.getElementById('parsed_defense');
                const accuracy = document.getElementById('parsed_accuracy');
                const evasion = document.getElementById('parsed_evasion');
                if (attack) parsed.attack = parseInt(attack.value) || 0;
                if (defense) parsed.defense = parseInt(defense.value) || 0;
                if (accuracy) parsed.accuracy = parseInt(accuracy.value) || 0;
                if (evasion) parsed.evasion = parseInt(evasion.value) || 0;
            } else {
                const bm = document.getElementById('parsed_bm');
                const level = document.getElementById('parsed_level');
                if (bm) parsed.bm = parseInt(bm.value) || 0;
                if (level) parsed.level = parseInt(level.value) || 0;
            }
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'saveCharacterScreenshot', nickname: currentUser, screenshotType: screenshotType, imageData: imageData, parsedData: parsed }),
                    redirect: 'follow'
                });
            } catch (e) { console.error('Ошибка:', e); }
        }
    }
}

// ============================================================
// 🔍 ЗУМ СКРИНШОТОВ
// ============================================================

function openScreenshotZoom(base64) {
    const modal = document.getElementById('screenshotZoomModal');
    const img = document.getElementById('zoomedImage');
    if (!modal || !img) return;
    img.src = base64;
    currentZoomLevel = 1;
    img.style.transform = 'scale(' + currentZoomLevel + ')';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeScreenshotZoom() {
    const modal = document.getElementById('screenshotZoomModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
}

function zoomImage(delta) {
    const img = document.getElementById('zoomedImage');
    if (!img) return;
    if (delta === 0) currentZoomLevel = 1;
    else currentZoomLevel = Math.max(0.3, Math.min(8, currentZoomLevel + delta));
    img.style.transform = 'scale(' + currentZoomLevel + ')';
    img.style.transition = 'transform 0.2s ease';
}

// ============================================================
// 📸 OCR СКРИНШОТОВ DKP
// ============================================================

function handleScreenshotSelect(e) {
    addScreenshots(Array.from(e.target.files));
    e.target.value = '';
}

function addScreenshots(files) {
    const rem = 5 - uploadedScreenshots.length;
    if (rem <= 0) { showDkpSubmitMessage('Макс. 5', 'error'); return; }
    const MF = 2 * 1024 * 1024;
    const MT = 8 * 1024 * 1024;
    let es = uploadedScreenshots.reduce(function(s, x) { return s + (x.file ? x.file.size : 0); }, 0);
    const ta = []; let tn = 0;
    for (let i = 0; i < Math.min(files.length, rem); i++) {
        const f = files[i];
        if (!f.type.startsWith('image/')) continue;
        if (f.size > MF) { showDkpSubmitMessage('"' + f.name + '" > 2 МБ', 'error'); continue; }
        if (es + tn + f.size > MT) { showDkpSubmitMessage('Общий > 8 МБ', 'error'); continue; }
        ta.push(f); tn += f.size;
    }
    if (ta.length === 0) return;
    for (let i = 0; i < ta.length; i++) {
        (function(f) {
            const id = 'ss_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const rd = new FileReader();
            const so = { id: id, file: f, base64: null, screenshotId: null, status: 'uploading', error: null };
            uploadedScreenshots.push(so);
            renderScreenshotsPreview();
            rd.onload = async function(e) {
                try {
                    so.base64 = e.target.result;
                    const c = await compressImage(e.target.result, 1200, 0.8);
                    so.base64 = c;
                    const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveScreenshot', imageData: c, filename: f.name }), redirect: 'follow' });
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    const res = await r.json();
                    if (res.success) { so.screenshotId = res.screenshotId; so.status = 'done'; }
                    else { so.status = 'error'; so.error = res.message; }
                } catch (e) { so.status = 'error'; so.error = e.message; }
                renderScreenshotsPreview();
                if (uploadedScreenshots.every(function(s) { return s.status !== 'uploading'; })) runOcrOnScreenshots();
            };
            rd.onerror = function() { so.status = 'error'; so.error = 'Ошибка чтения'; renderScreenshotsPreview(); };
            rd.readAsDataURL(f);
        })(ta[i]);
    }
}

function renderScreenshotsPreview() {
    const el = document.getElementById('screenshotsPreview');
    if (!el) return;
    let html = '';
    for (let i = 0; i < uploadedScreenshots.length; i++) {
        const s = uploadedScreenshots[i];
        const si = s.file ? ' <span style="font-size:8px;color:var(--text-dim);">(' + (s.file.size / 1024).toFixed(0) + ' КБ)</span>' : '';
        let sh = '';
        if (s.status === 'uploading') sh = '<div class="upload-progress">...</div>';
        else if (s.status === 'error') sh = '<div class="upload-progress" style="color:var(--danger);">✕</div>';
        else if (s.status === 'done') sh = '<div class="upload-progress" style="color:var(--success);">✓' + si + '</div>';
        html += '<div class="screenshot-thumb">';
        if (s.base64) html += '<img src="' + s.base64 + '" alt="screenshot" onclick="openImageModal(\'' + escapeForOnclick(s.base64) + '\')" style="cursor:pointer;">';
        html += '<button class="remove-btn" onclick="removeScreenshot(\'' + escapeForOnclick(s.id) + '\')">✕</button>' + sh + '</div>';
    }
    el.innerHTML = html;
}

function removeScreenshot(id) {
    uploadedScreenshots = uploadedScreenshots.filter(function(s) { return s.id !== id; });
    renderScreenshotsPreview();
}

async function runOcrOnScreenshots() {
    try {
        const ds = uploadedScreenshots.filter(function(s) { return s.status === 'done' && s.base64; });
        if (ds.length === 0) return;
        const pb = document.getElementById('ocrProgressBlock');
        const pt = document.getElementById('ocrProgressText');
        const pbr = document.getElementById('ocrProgressBar');
        const nb = document.getElementById('recognizedNicksBlock');
        const mi = document.getElementById('ocrMatchInfo');
        if (!pb || !pt || !pbr || !nb) return;
        pb.classList.remove('hidden');
        pbr.style.width = '0%';
        recognizedNicks = [];
        matchedNicksMap = {};
        if (typeof Tesseract === 'undefined') {
            if (pt) pt.innerText = '⚠️ Tesseract не загружен';
            nb.classList.remove('hidden');
            renderRecognizedNicks();
            return;
        }
        if (pt) pt.innerText = 'Загрузка OCR...';
        if (pbr) pbr.style.width = '10%';
        let w;
        try {
            w = await Tesseract.createWorker('rus+eng', 1, {
                logger: function(m) {
                    if (m.status === 'recognizing text' && m.progress) {
                        if (pbr) pbr.style.width = (10 + Math.round(m.progress * 100) * 0.85) + '%';
                        if (pt) pt.innerText = Math.round(m.progress * 100) + '%';
                    }
                }
            });
        } catch (e) {
            if (pt) pt.innerText = '❌ OCR ошибка';
            nb.classList.remove('hidden');
            renderRecognizedNicks();
            return;
        }
        const an = new Set();
        for (let i = 0; i < ds.length; i++) {
            try {
                if (pt) pt.innerText = 'Скрин ' + (i + 1) + '/' + ds.length;
                const pi = await preprocessImage(ds[i].base64);
                const r = await w.recognize(pi);
                const t = r && r.data && r.data.text ? r.data.text : '';
                extractNicksFromText(t).forEach(function(n) { an.add(n); });
                if (pbr) pbr.style.width = (10 + ((i + 1) / ds.length) * 85) + '%';
            } catch (e) {}
        }
        try { await w.terminate(); } catch (e) {}
        const rn = Array.from(an).filter(function(n) { return n && n.length >= 2 && n.length <= 16; });
        if (pt) pt.innerText = '🔍 Сверка с базой (' + rn.length + ')...';
        if (pbr) pbr.style.width = '97%';
        try {
            const vr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
            const vres = await vr.json();
            if (vres.success) allRegisteredNicks = vres.nicks.map(function(n) { return String(n); });
        } catch (e) {}
        const cn = [];
        const ms = { exact: 0, similar: 0, unknown: 0 };
        for (let i = 0; i < rn.length; i++) {
            const n = rn[i];
            const mr = findBestMatch(n, allRegisteredNicks);
            if (mr.type === 'exact') { cn.push(mr.nickname); ms.exact++; }
            else if (mr.type === 'similar') { cn.push(mr.nickname); matchedNicksMap[n] = mr.nickname; ms.similar++; }
            else { cn.push(n); ms.unknown++; }
        }
        recognizedNicks = cn;
        if (pbr) pbr.style.width = '100%';
        if (mi) mi.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;font-family:var(--font-display);"><span style="color:var(--success);">✓ Точных: <b>' + ms.exact + '</b></span><span style="color:var(--warning);">≈ Исправлено: <b>' + ms.similar + '</b></span><span style="color:var(--text-dim);">? Не распознано: <b>' + ms.unknown + '</b></span></div>';
        if (pt) pt.innerText = '✅ Готово: ' + cn.length + ' ников';
        renderRecognizedNicks();
        renderUnrecognizedNicks();
        nb.classList.remove('hidden');
    } catch (e) { console.error('OCR:', e); }
}

function findBestMatch(rn, ns) {
    if (!ns || ns.length === 0) return { type: 'unknown', nickname: rn };
    const rl = rn.toLowerCase().trim();
    for (let i = 0; i < ns.length; i++) {
        if (ns[i].toLowerCase() === rl) return { type: 'exact', nickname: ns[i] };
    }
    let bm = null, bd = Infinity, bs = 0;
    for (let i = 0; i < ns.length; i++) {
        const nl = ns[i].toLowerCase();
        const d = levenshteinDistance(rl, nl);
        const ml = Math.max(rl.length, nl.length);
        const s = 1 - d / ml;
        if (s >= 0.7 && d < bd) { bd = d; bm = ns[i]; bs = s; }
    }
    if (bm) return { type: 'similar', nickname: bm, original: rn, similarity: Math.round(bs * 100) };
    return { type: 'unknown', nickname: rn };
}

function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) m[i][j] = m[i - 1][j - 1];
            else m[i][j] = Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
        }
    }
    return m[b.length][a.length];
}

function renderRecognizedNicks() {
    const l = document.getElementById('recognizedNicksList');
    if (!l) return;
    let html = '';
    for (let i = 0; i < recognizedNicks.length; i++) {
        const n = recognizedNicks[i];
        const sn = escapeHtml(n);
        let mb = '';
        let isExact = false;
        let correctedFrom = null;
        let similarity = 0;
        for (let j = 0; j < allRegisteredNicks.length; j++) {
            if (allRegisteredNicks[j].toLowerCase() === n.toLowerCase()) { isExact = true; break; }
        }
        for (const o in matchedNicksMap) {
            const c = matchedNicksMap[o];
            if (c === n && o !== n) { correctedFrom = o; const s = findBestMatch(o, allRegisteredNicks).similarity || 0; similarity = s; break; }
        }
        if (correctedFrom) {
            let bc = 'low';
            if (similarity >= 90) bc = 'high';
            else if (similarity >= 75) bc = 'medium';
            mb = '<span class="match-badge ' + bc + '" title="Распознано как: ' + escapeHtml(correctedFrom) + '">≈ ' + similarity + '%</span><span class="original-nick" title="' + escapeHtml(correctedFrom) + '">' + escapeHtml(correctedFrom) + '</span>';
        }
        let borderColor, bgColor, statusIcon;
        if (isExact) { borderColor = 'var(--success)'; bgColor = 'var(--success-soft)'; statusIcon = '<span style="color:var(--success);font-size:10px;margin-left:4px;font-weight:700;" title="Точно совпадает">✓</span>'; }
        else if (correctedFrom) { borderColor = 'var(--warning)'; bgColor = 'var(--warning-soft)'; statusIcon = '<span style="color:var(--warning);font-size:10px;margin-left:4px;font-weight:700;" title="Исправлено">≈</span>'; }
        else { borderColor = 'var(--border)'; bgColor = 'var(--bg-soft)'; statusIcon = '<span style="color:var(--text-dim);font-size:10px;margin-left:4px;font-weight:700;" title="Не найдено">?</span>'; }
        html += '<div class="nick-item" style="border-color:' + borderColor + ';background:' + bgColor + ';padding:4px 8px;">';
        html += '<input type="text" value="' + sn + '" onchange="updateNick(' + i + ', this.value)" style="background:transparent;border:none;flex:1;">';
        html += statusIcon + mb;
        html += '<button class="remove-nick-btn" onclick="removeNick(' + i + ')">✕</button>';
        html += '</div>';
    }
    l.innerHTML = html;
}

function renderUnrecognizedNicks() {
    const l = document.getElementById('unrecognizedNicksList');
    const b = document.getElementById('unrecognizedNicksBlock');
    if (!l || !b) return;
    const rs = new Set(recognizedNicks.map(function(n) { return n.toLowerCase().trim(); }));
    const un = allRegisteredNicks.filter(function(n) { return !rs.has(n.toLowerCase().trim()); });
    if (un.length === 0) { b.style.display = 'none'; return; }
    b.style.display = 'block';
    let html = '<div style="font-size:9px;color:var(--text-dim);margin-bottom:4px;">📋 Ещё есть в базе, но не распознаны:</div>';
    for (let i = 0; i < un.length; i++) {
        html += '<button type="button" class="unrecognized-nick-btn" onclick="addNickFromList(this, \'' + escapeForOnclick(un[i]) + '\')">' + escapeHtml(un[i]) + '</button>';
    }
    l.innerHTML = html;
}

function addNickFromList(btn, n) {
    if (recognizedNicks.some(function(x) { return x.toLowerCase() === n.toLowerCase(); })) {
        btn.classList.add('added');
        btn.innerText = '✓ ' + n;
        return;
    }
    recognizedNicks.push(n);
    renderRecognizedNicks();
    renderUnrecognizedNicks();
    setTimeout(function() {
        const l = document.getElementById('recognizedNicksList');
        if (l && l.lastElementChild) l.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function extractNicksFromText(t) {
    try {
        if (!t || typeof t !== 'string') return [];
        const sw = new Set(['headhunters','неа','управление','группой','рейдовая','группа','проверить','готовность','пригласить','набор','настройки','команда','команда1','команда2','команда3','команда4','команда5','команда6','команда7','команда8','команда9','команда10','guild','clan','alliance','raid','party','team','squad','group','management','control','hh','rf','online','next','head','hunters','headhunter','1','2','3','4','5','6','7','8','9','10','иии','ллл','ннн','ааа','ооо','еее']);
        const ls = t.split(/\n|\r/);
        const aw = [];
        const wf = {};
        for (let i = 0; i < ls.length; i++) {
            const cl = ls[i].trim();
            if (!cl) continue;
            const tokens = cl.split(/[\s\t\|\/\\:\+\=\[\]\(\)]+/);
            for (let j = 0; j < tokens.length; j++) {
                let c = tokens[j].trim().replace(/^["'`\[\(\{]+|["'`\]\)\}]+$/g, '').replace(/[^\w\u0400-\u04FF\-_]/g, '');
                if (c.length >= 2 && c.length <= 16) {
                    aw.push(c);
                    const lo = c.toLowerCase();
                    wf[lo] = (wf[lo] || 0) + 1;
                }
            }
        }
        const ns = [];
        const sn = new Set();
        for (let i = 0; i < aw.length; i++) {
            const w = aw[i];
            const lw = w.toLowerCase();
            if (sn.has(lw) || sw.has(lw) || wf[lw] > 3 || /^\d+$/.test(w) || !/[A-Za-z\u0410-\u044F\u0400-\u04FF]/.test(w) || /^(.)\1{2,}$/.test(w) || (w.length === 2 && !/[A-Z\u0410-\u042F]/.test(w))) continue;
            sn.add(lw);
            ns.push(w);
        }
        return ns;
    } catch (e) { return []; }
}

function updateNick(i, v) { recognizedNicks[i] = v.trim(); renderUnrecognizedNicks(); }
function removeNick(i) { recognizedNicks.splice(i, 1); renderRecognizedNicks(); renderUnrecognizedNicks(); }
function addEmptyNickField() { recognizedNicks.push(''); renderRecognizedNicks(); renderUnrecognizedNicks(); setTimeout(function() { const is = document.querySelectorAll('#recognizedNicksList input'); if (is.length > 0) is[is.length - 1].focus(); }, 100); }

async function submitDkpSubmission() {
    if (currentRole === 'Гость') { showDkpSubmitMessage('👁 Гости не могут', 'error'); return; }
    const s = document.getElementById('dkpEventSelect');
    const so = s.options[s.selectedIndex];
    const eid = s.value;
    const en = so ? so.dataset.name : '';
    const ed = so ? so.dataset.dkp : 0;
    if (!eid) { showDkpSubmitMessage('Выберите мероприятие', 'error'); return; }
    const vn = recognizedNicks.filter(function(n) { return n && n.trim().length > 0; });
    if (vn.length === 0) { showDkpSubmitMessage('Добавьте игрока', 'error'); return; }
    const b = document.getElementById('submitDkpBtn');
    if (b) { b.disabled = true; b.innerHTML = '<span class="loader"></span> Проверка...'; }
    try {
        const vr = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'getAllPlayersForValidation' }), redirect: 'follow' });
        const vres = await vr.json();
        if (!vres.success) throw new Error('Ошибка списка');
        const asn = vres.nicks.map(function(n) { return String(n).toLowerCase(); });
        const inv = [];
        const vnl = [];
        for (let i = 0; i < vn.length; i++) {
            const nl = vn[i].toLowerCase().trim();
            if (asn.indexOf(nl) !== -1) vnl.push(vn[i]);
            else inv.push(vn[i]);
        }
        if (inv.length > 0) {
            showDkpSubmitMessage('Не найдены:\n\n' + inv.join('\n'), 'error');
            if (b) { b.disabled = false; b.innerHTML = '📤 Отправить'; }
            return;
        }
        if (b) b.innerHTML = '<span class="loader"></span> Отправка...';
        const sids = uploadedScreenshots.filter(function(s) { return s.status === 'done' && s.screenshotId; }).map(function(s) { return s.screenshotId; });
        const r = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'submitDKP',
                nickname: currentUser,
                eventId: eid,
                eventName: en,
                eventDkp: Number(ed),
                screenshotIds: sids,
                recognizedNicks: vnl
            }),
            redirect: 'follow'
        });
        const res = await r.json();
        if (res.success) {
            showDkpSubmitMessage(res.message + ' (' + vnl.length + ')', 'success');
            uploadedScreenshots = [];
            recognizedNicks = [];
            matchedNicksMap = {};
            renderScreenshotsPreview();
            const rb = document.getElementById('recognizedNicksBlock');
            if (rb) rb.classList.add('hidden');
            const pb = document.getElementById('ocrProgressBlock');
            if (pb) pb.classList.add('hidden');
            s.value = '';
        } else showDkpSubmitMessage(res.message, 'error');
    } catch (e) {
        showDkpSubmitMessage('Ошибка: ' + e.message, 'error');
    } finally {
        if (b) { b.disabled = false; b.innerHTML = '📤 Отправить'; }
    }
}

function showDkpSubmitMessage(t, ty) {
    const m = document.getElementById('dkpSubmitMessage');
    if (!m) return;
    m.className = 'message ' + ty;
    m.innerText = t;
    m.style.display = 'block';
    setTimeout(function() { m.style.display = 'none'; }, 8000);
}

function compressImage(b, ms, q) {
    return new Promise(function(resolve) {
        const i = new Image();
        i.onload = function() {
            let w = i.width, h = i.height;
            const tm = Math.min(ms, 1920);
            const tq = Math.min(q, 0.85);
            if (w > h && w > tm) { h = Math.round((h * tm) / w); w = tm; }
            else if (h > tm) { w = Math.round((w * tm) / h); h = tm; }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(i, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', tq));
        };
        i.onerror = function() { resolve(b); };
        i.src = b;
    });
}

function preprocessImage(b) {
    return new Promise(function(resolve) {
        const i = new Image();
        i.onload = function() {
            const c = document.createElement('canvas');
            const sc = 3;
            c.width = i.width * sc;
            c.height = i.height * sc;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(i, 0, 0, c.width, c.height);
            const id = ctx.getImageData(0, 0, c.width, c.height);
            const d = id.data;
            for (let j = 0; j < d.length; j += 4) {
                let R = 255 - d[j];
                let G = 255 - d[j + 1];
                let B = 255 - d[j + 2];
                R = Math.min(255, R + 20);
                G = Math.min(255, G + 20);
                B = Math.min(255, B + 20);
                R = Math.min(255, Math.max(0, (R - 128) * 1.5 + 128));
                G = Math.min(255, Math.max(0, (G - 128) * 1.5 + 128));
                B = Math.min(255, Math.max(0, (B - 128) * 1.5 + 128));
                d[j] = R; d[j + 1] = G; d[j + 2] = B; d[j + 3] = 255;
            }
            ctx.putImageData(new ImageData(new Uint8ClampedArray(d), c.width, c.height), 0, 0);
            resolve(c.toDataURL('image/png'));
        };
        i.onerror = function() { resolve(b); };
        i.src = b;
    });
}
