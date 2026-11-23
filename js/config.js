// ============================================================
// ⚙️ КОНФИГУРАЦИЯ RF ONLINE NEXT v17.20
// ============================================================

const APP_VERSION = '17.20';
const SCRIPT_URL_BASE = 'https://script.google.com/macros/s/AKfycbxvElzCTJmhLu7knDxr-zmsusce-Kde_dWkUhgGPP0fQfuCX2EuGferIPgGBGqrJ9IP/exec';
const SCRIPT_URL = SCRIPT_URL_BASE + '?v=' + APP_VERSION + '&_t=' + Date.now();
const ADMIN_KEY = 'ADMIN_SECRET_2026';
const MOD_KEY = 'MOD_SECRET_2026';
const NOTIFICATION_POLL_INTERVAL = 20000;

// ============================================================
// 🌍 ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ============================================================

let currentUser = null;
let currentRole = null;

let myPlayerData = null;
let myPlayerSkills = null;
let myPlayerItems = null;
let myDkpData = null;

let allSkills = [];
let allItems = [];
let equipmentSections = [];
let allEvents = [];

let currentEquipmentSection = null;
let playerItemSelections = {};
let currentAdminItemSection = null;

let uploadedScreenshots = [];
let recognizedNicks = [];
let allRegisteredNicks = [];
let matchedNicksMap = {};
let characterScreenshots = { 1: null, 2: null };
let parsedCharacterStats = {};
let lastRecognizedText = { 1: '', 2: '' };

let countdownInterval = null;
let currentAuctionItems = [];
let recentAuctionHistory = [];
let bidCooldownInterval = null;
let auctionEndInterval = null;

let currentIconType = null;
let currentIconId = null;
let currentIconName = null;
let allProfessionIcons = {};
let allPlayersBioColors = {};

let lastNotificationCount = 0;
let notificationPollingInterval = null;
let knownNotificationIds = new Set();

let currentEditDkpEntry = null;
let currentEditAuctionId = null;

let siteFeatures = {};

let currentTopType = { 'publicTopList': 'bm', 'mainTopList': 'bm' };

if (typeof window !== 'undefined') {
    window._playerGuilds = {};
    window._myGuild = null;
    window._allQueueItems = [];
    window._currentDkpHistory = [];
    window.currentEditDkp = null;
    window.toastTimeout = null;
}

let guildEmblemBase64 = null;
let currentDkpMode = 'global';
let guildUploadedScreenshots = [];
let guildRecognizedNicks = [];

let currentZoomLevel = 1;

console.log('%c🌌 RF ONLINE NEXT v' + APP_VERSION, 'color: #2563eb; font-size: 16px; font-weight: bold;');
console.log('%c✅ Конфигурация загружена', 'color: #10b981; font-size: 12px;');
