// ============================================================
// 📸 OCR СКРИНШОТОВ ПЕРСОНАЖА
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
    if (statusEl) statusEl.innerText = 'Распознавание...';

    try {
        const variants = [
            { name: 'original', image: base64 },
            { name: 'grayscale_3x', image: await convertToGrayscale(base64, 3) },
            { name: 'invert', image: await preprocessImage(base64) }
        ];

        let bestResult = null;
        let bestScore = 0;

        for (const variant of variants) {
            try {
                const result = await runTesseract(variant.image);
                const score = calculateRecognitionScore(result);

                if (score > bestScore) {
                    bestScore = score;
                    bestResult = result;
                }
            } catch (e) {
                console.warn('OCR variant failed:', variant.name, e);
            }
        }

        if (bestResult && bestScore > 0.3) {
            const parsed = parseCharacterStats(bestResult);
            parsedCharacterStats[type] = parsed;

            if (statusEl) statusEl.innerText = 'Готово';
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

async function runTesseract(imageData) {
    // Предполагается, что Tesseract уже подключён
    if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract не загружен');
    }

    const worker = await Tesseract.createWorker('rus+eng');
    const { data } = await worker.recognize(imageData);
    await worker.terminate();
    return data.text;
}

function parseCharacterStats(text) {
    const stats = {};
    const lines = text.split('\n');

    for (const line of lines) {
        const clean = line.trim();
        if (!clean) continue;

        // Простой парсинг ключевых полей
        if (/бм|bm|боевая/i.test(clean)) {
            const match = clean.match(/(\d+)/);
            if (match) stats.bm = match[1];
        }
        if (/уровень|level|ур/i.test(clean)) {
            const match = clean.match(/(\d+)/);
            if (match) stats.level = match[1];
        }
        if (/атака|attack|атк/i.test(clean)) {
            const match = clean.match(/(\d+)/);
            if (match) stats.attack = match[1];
        }
        if (/защита|defense|защ/i.test(clean)) {
            const match = clean.match(/(\d+)/);
            if (match) stats.defense = match[1];
        }
    }

    return stats;
}

function calculateRecognitionScore(text) {
    if (!text) return 0;
    const keywords = ['бм', 'уровень', 'атака', 'защита', 'меткость', 'уклонение'];
    let score = 0;
    const lower = text.toLowerCase();

    for (const kw of keywords) {
        if (lower.includes(kw)) score += 0.15;
    }

    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 3) score += 0.2;

    return Math.min(score, 1);
}

async function submitCharacterStats() {
    const msg = document.getElementById('ocrSubmitMessage');

    const stats = {
        ...parsedCharacterStats[1],
        ...parsedCharacterStats[2]
    };

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
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
