// ============================================================
// 📸 OCR СКРИНШОТОВ ПЕРСОНАЖА (12 вариантов)
// ============================================================

async function loadCharacterScreenshots() {
    if (!currentUser) return;

    try {
        const res = await api('getCharacterScreenshots', { nickname: currentUser });

        if (res.success && res.screenshots && res.screenshots.length > 0) {
            for (const s of res.screenshots) {
                const type = s.screenshotType === 'stats1' ? 1 : 2;
                characterScreenshots[type] = s.imageData;

                const block = document.getElementById('screenshotBlock' + type);
                const preview = document.getElementById('screenshotPreview' + type);

                if (block && preview) {
                    preview.innerHTML = `
                        <img src="${s.imageData}" 
                             onclick="event.stopPropagation(); openScreenshotZoom('${escapeForOnclick(s.imageData)}')" 
                             style="max-width:100%;max-height:140px;cursor:zoom-in;border-radius:4px;">
                        <button class="remove-screenshot" onclick="event.stopPropagation(); removeCharacterScreenshot(${type})">✕</button>`;
                    block.classList.add('has-image');
                }

                if (s.parsedData && Object.keys(s.parsedData).length > 0) {
                    parsedCharacterStats[type] = s.parsedData;
                }
            }
        }
    } catch (e) {
        console.error('loadCharacterScreenshots error:', e);
    }
}

async function recognizeCharacterStats(base64, type) {
    if (!base64) return null;

    const statusEl = document.getElementById('ocrStatus' + type);
    const progressEl = document.getElementById('ocrProgress' + type);
    if (statusEl) statusEl.innerText = 'Подготовка...';

    try {
        const variants = await generateVariants(base64, function(progress) {
            if (progressEl) progressEl.style.width = progress + '%';
            if (statusEl) statusEl.innerText = 'Обработка: ' + progress + '%';
        });

        let bestResult = null;
        let bestScore = 0;

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            if (statusEl) statusEl.innerText = 'OCR: ' + variant.name;

            try {
                const text = await runTesseract(variant.image);
                const score = calculateRecognitionScore(text);

                if (score > bestScore) {
                    bestScore = score;
                    bestResult = text;
                }
            } catch (e) {
                console.warn('OCR variant failed:', variant.name, e);
            }
        }

        if (bestResult && bestScore > 0.2) {
            const parsed = parseCharacterStats(bestResult, type);
            parsedCharacterStats[type] = parsed;

            if (statusEl) statusEl.innerText = 'Готово (' + Math.round(bestScore * 100) + '%)';
            displayParsedStats(type, parsed);
            return parsed;
        } else {
            if (statusEl) statusEl.innerText = 'Не удалось распознать';
            return null;
        }
    } catch (e) {
        console.error('recognizeCharacterStats error:', e);
        if (statusEl) statusEl.innerText = 'Ошибка';
        return null;
    }
}

async function generateVariants(base64, onProgress) {
    const variants = [];
    const steps = 12;
    let step = 0;

    function updateProgress() {
        step++;
        if (onProgress) onProgress(Math.round((step / steps) * 100));
    }

    variants.push({ name: 'original', image: base64 });
    updateProgress();

    variants.push({ name: 'grayscale_3x', image: await convertToGrayscale(base64, 3) });
    updateProgress();

    variants.push({ name: 'grayscale_5x', image: await convertToGrayscale(base64, 5) });
    updateProgress();

    variants.push({ name: 'inverted_3x', image: await invertImage(base64, 3) });
    updateProgress();

    variants.push({ name: 'inverted_5x', image: await invertImage(base64, 5) });
    updateProgress();

    variants.push({ name: 'contrast_100', image: await adjustContrast(base64, 100) });
    updateProgress();

    variants.push({ name: 'contrast_128', image: await adjustContrast(base64, 128) });
    updateProgress();

    variants.push({ name: 'contrast_160', image: await adjustContrast(base64, 160) });
    updateProgress();

    variants.push({ name: 'contrast_200', image: await adjustContrast(base64, 200) });
    updateProgress();

    variants.push({ name: 'sharpened_4x', image: await sharpenImage(base64, 4) });
    updateProgress();

    variants.push({ name: 'gamma_05', image: await adjustGamma(base64, 0.5) });
    updateProgress();

    variants.push({ name: 'gamma_15', image: await adjustGamma(base64, 1.5) });
    updateProgress();

    return variants;
}

function convertToGrayscale(base64, scale) {
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = data[i + 1] = data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

function invertImage(base64, scale) {
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
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

function adjustContrast(base64, contrast) {
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

function sharpenImage(base64, scale) {
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() { resolve(base64); };
        img.src = base64;
    });
}

function adjustGamma(base64, gamma) {
    return new Promise(function(resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            const ctx = canvas.getContext('2d');
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

async function runTesseract(imageData) {
    if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract не загружен');
    }

    const worker = await Tesseract.createWorker('rus+eng');
    const result = await worker.recognize(imageData);
    await worker.terminate();
    return result.data.text;
}

function parseCharacterStats(text, type) {
    const stats = {};
    const lines = text.split('\n');

    for (const line of lines) {
        const clean = line.trim().toLowerCase();
        if (!clean) continue;

        const numbers = line.match(/\d+/g);
        if (!numbers || numbers.length === 0) continue;

        if (type === 1) {
            if (/атака|attack|атк/i.test(clean)) stats.attack = numbers[0];
            if (/защита|defense|защ/i.test(clean)) stats.defense = numbers[0];
            if (/меткость|accuracy|метк/i.test(clean)) stats.accuracy = numbers[0];
            if (/уклонение|evasion|уклон/i.test(clean)) stats.evasion = numbers[0];
        } else {
            if (/мощь|бм|bm|power/i.test(clean)) stats.bm = numbers[0];
            if (/уровень|level|ур\.?/i.test(clean)) stats.level = numbers[0];
        }
    }

    return stats;
}

function calculateRecognitionScore(text) {
    if (!text) return 0;

    const keywords = ['атака', 'защита', 'меткость', 'уклонение', 'мощь', 'уровень', 'attack', 'defense'];
    let score = 0;
    const lower = text.toLowerCase();

    for (const kw of keywords) {
        if (lower.includes(kw)) score += 0.12;
    }

    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 2) score += 0.2;
    if (numbers && numbers.length >= 4) score += 0.1;

    return Math.min(score, 1);
}

function displayParsedStats(type, stats) {
    const container = document.getElementById('parsedStats' + type);
    if (!container) return;

    let html = '<div class="parsed-stats">';
    for (const key in stats) {
        html += '<div class="parsed-stat"><span>' + key + ':</span> <b>' + stats[key] + '</b></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

function applyParsedStats() {
    const stats = Object.assign({}, parsedCharacterStats[1], parsedCharacterStats[2]);

    if (stats.bm) setInputValue('bm', stats.bm);
    if (stats.level) setInputValue('level', stats.level);
    if (stats.attack) setInputValue('attack', stats.attack);
    if (stats.defense) setInputValue('defense', stats.defense);
    if (stats.accuracy) setInputValue('accuracy', stats.accuracy);
    if (stats.evasion) setInputValue('evasion', stats.evasion);

    alert('✅ Значения применены к форме');
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function removeCharacterScreenshot(type) {
    characterScreenshots[type] = null;
    parsedCharacterStats[type] = null;

    const block = document.getElementById('screenshotBlock' + type);
    const preview = document.getElementById('screenshotPreview' + type);

    if (preview) preview.innerHTML = '';
    if (block) block.classList.remove('has-image');
}

async function submitCharacterStats() {
    const msg = document.getElementById('ocrSubmitMessage');
    const stats = Object.assign({}, parsedCharacterStats[1], parsedCharacterStats[2]);

    if (Object.keys(stats).length === 0) {
        showOcrMessage(msg, 'Нет распознанных данных', 'error');
        return;
    }

    try {
        showOcrMessage(msg, 'Отправка...', '');
        const res = await api('submitCharacterStats', {
            nickname: currentUser,
            stats: stats,
            screenshots: characterScreenshots
        });

        if (res.success) {
            showOcrMessage(msg, res.message || 'Отправлено на проверку', 'success');
        } else {
            showOcrMessage(msg, res.message || 'Ошибка', 'error');
        }
    } catch (e) {
        showOcrMessage(msg, 'Ошибка соединения', 'error');
    }
}

function showOcrMessage(el, text, type) {
    if (!el) return;
    el.className = 'message' + (type ? ' ' + type : '');
    el.innerText = text;
    el.style.display = 'block';
    if (type) {
        setTimeout(function() { el.style.display = 'none'; }, 4000);
    }
}

function openScreenshotZoom(imageData) {
    const modal = document.getElementById('screenshotZoomModal');
    const img = document.getElementById('zoomImage');
    if (modal && img) {
        img.src = imageData;
        modal.classList.remove('hidden');
    }
}

function closeScreenshotZoom() {
    const modal = document.getElementById('screenshotZoomModal');
    if (modal) modal.classList.add('hidden');
}

// Экспорт
window.loadCharacterScreenshots = loadCharacterScreenshots;
window.recognizeCharacterStats = recognizeCharacterStats;
window.applyParsedStats = applyParsedStats;
window.removeCharacterScreenshot = removeCharacterScreenshot;
window.submitCharacterStats = submitCharacterStats;
window.openScreenshotZoom = openScreenshotZoom;
window.closeScreenshotZoom = closeScreenshotZoom;
