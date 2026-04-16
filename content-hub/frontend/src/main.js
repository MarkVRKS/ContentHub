import './style.css';
import './app.css';
import { initPartners, renderPartners, openPartnerModal, closePartnerModal, savePartner, deletePartner } from './partners.js';
import { initVault, renderVaultList, openVaultModal, closeVaultModal, saveVaultItem, deleteVaultItem, toggle2FAInput, copyToClipboard, setVaultFilter } from './vault.js';

const MASTER_PIN = '1932'; 

// Экспорт для Партнеров
window.openPartnerModal = openPartnerModal;
window.closePartnerModal = closePartnerModal;
window.savePartner = savePartner;
window.deletePartner = deletePartner;

// Экспорт для Базы Данных (Vault)
window.openVaultModal = openVaultModal;
window.closeVaultModal = closeVaultModal;
window.saveVaultItem = saveVaultItem;
window.deleteVaultItem = deleteVaultItem;
window.toggle2FAInput = toggle2FAInput;
window.copyToClipboard = copyToClipboard;
window.setVaultFilter = setVaultFilter; // ПРОБРОС ФИЛЬТРА

document.body.insertAdjacentHTML('beforeend', '<div id="cursor-glow"></div>');

document.querySelector('#app').innerHTML = `
    <div class="global-alert-container" id="alertBox">
        <button class="global-alert-btn" id="alertBellBtn" onclick="toggleAlerts()">
            <span class="alert-icon">🔔</span> ИЗМЕНЕНИЯ
        </button>
        <div class="alert-dropdown" id="alertDropdown">
            <div class="alert-header">
                <h4>СВОДКА ИЗМЕНЕНИЙ</h4>
                <button onclick="clearAlerts()">ОЧИСТИТЬ ✖</button>
            </div>
            <div id="alertList" class="alert-list"></div>
        </div>
    </div>

    <div class="top-bar">
        <div class="brand">
            <span class="brand-icon">♠</span>
            Content Mafia <span class="version">FAMIGLIA.v1.0</span>
        </div>
        <div class="top-controls">
            <button class="nav-btn" onclick="toggleSchedule()">
                <div class="nav-icon">📅</div>
                <span class="nav-text">РАСПИСАНИЕ</span>
            </button>
            <button class="nav-btn" onclick="togglePartners()">
                <div class="nav-icon">🤝</div>
                <span class="nav-text">АЛЬЯНСЫ</span>
            </button>
            <button class="nav-btn" onclick="toggleNetwork()">
                <div class="nav-icon">🕸</div>
                <span class="nav-text">УЗЕЛ</span>
            </button>
            <button class="nav-btn" onclick="toggleAbout()">
                <div class="nav-icon">👁</div>
                <span class="nav-text">ДОСЬЕ</span>
            </button>

            <div class="status-indicator">
                <span class="pulse"></span> SECURE
            </div>
        </div>
    </div>
    
    <div class="result" id="result">Ожидание приказов...</div>
    <div id="card-container" class="cards-grid"></div>

    <button class="vault-fab" onclick="toggleVault()" title="База Данных">🗝</button>

    <div id="about-overlay" class="about-overlay" onclick="toggleAbout()">
        <div class="about-paper" id="about-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="toggleAbout()">ЗАКРЫТЬ ✖</button>
                <h2>СТАТУС: LA COSA NOSTRA</h2>
                <div class="about-grid">
                    <div class="about-stat"><span>АРХИТЕКТОР:</span><span class="highlight">MarkVRKS</span></div>
                    <div class="about-stat"><span>УРОВЕНЬ ДОСТУПА:</span><span class="highlight">CAPO DEI CAPI</span></div>
                    <div class="about-stat"><span>ОРГАНИЗАЦИЯ:</span><span class="highlight">CONTENT MAFIA</span></div>
                </div>
                <p class="about-desc">Закрытый хаб управления цифровыми активами семьи. Оркестрация микросервисов, абсолютный контроль процессов и защита данных на высшем уровне.</p>
            </div>
        </div>
    </div>

    <div id="network-overlay" class="about-overlay" onclick="toggleNetwork()">
        <div class="about-paper" id="network-paper" onclick="event.stopPropagation()">
            <div class="paper-content" style="text-align: center;">
                <button class="close-btn" onclick="toggleNetwork()">ЗАКРЫТЬ ✖</button>
                <h2>УЗЕЛ СВЯЗИ</h2>
                <p class="about-desc" style="margin: 20px auto; border:none; text-align:center;">ПЕРЕХВАТ ЛОКАЛЬНОГО АДРЕСА СИСТЕМЫ...</p>
                <div id="ip-container">000.000.000.000</div>
            </div>
        </div>
    </div>

    <div id="partners-overlay" class="about-overlay" onclick="togglePartners()">
        <div class="about-paper schedule-paper-wide" id="partners-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="togglePartners()">ЗАКРЫТЬ ✖</button>
                <div class="schedule-header">
                    <div class="sh-titles">
                        <h2>ВНЕШНИЕ СВЯЗИ</h2>
                        <p class="about-desc">Авторизованные шлюзы к инфраструктуре партнеров.</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-action edit" onclick="window.openPartnerModal()">+ ДОБАВИТЬ УЗЕЛ</button>
                    </div>
                </div>
                <div class="partners-list" id="partnersListContainer"></div>
            </div>
        </div>
    </div>

    <div id="partner-modal" class="modal-overlay" onclick="window.closePartnerModal()">
        <div class="modal-box" onclick="event.stopPropagation()">
            <h3 id="pm-title">НОВЫЙ АЛЬЯНС</h3>
            <input type="hidden" id="pm-id">
            <input type="text" id="pm-name" class="mafia-input" placeholder="Название сервиса (например, MAILOPOST)" autocomplete="off">
            <input type="text" id="pm-desc" class="mafia-input" placeholder="Краткое описание" autocomplete="off">
            <input type="url" id="pm-url" class="mafia-input" placeholder="URL-адрес (https://...)" autocomplete="off">
            <div class="modal-actions" style="margin-top: 25px;">
                <button class="btn-action cancel" onclick="window.closePartnerModal()">ОТМЕНА</button>
                <button class="btn-action cancel" id="pm-delete" style="color:var(--mafia-red); border-color:var(--mafia-red); display:none;" onclick="window.deletePartner()">УДАЛИТЬ</button>
                <button class="btn-action save" onclick="window.savePartner()">СОХРАНИТЬ</button>
            </div>
        </div>
    </div>

    <div id="schedule-overlay" class="about-overlay" onclick="toggleSchedule()">
        <div class="about-paper schedule-paper-wide" id="schedule-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="toggleSchedule()">ЗАКРЫТЬ ✖</button>
                <div class="schedule-header">
                    <div class="sh-titles">
                        <h2>РАСПИСАНИЕ</h2>
                        <p class="about-desc">Управление рабочим временем команды.</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-action edit" id="editScheduleBtn" onclick="window.enterEditMode()">⚙ ИЗМЕНИТЬ</button>
                        <button class="btn-action save" id="saveScheduleBtn" style="display: none;" onclick="window.saveSchedule()">✔ УТВЕРДИТЬ</button>
                        <button class="btn-action cancel" id="cancelScheduleBtn" style="display: none;" onclick="window.cancelEditMode()">✖ ОТМЕНА</button>
                    </div>
                </div>
                <div id="scheduleContainer" class="schedule-accordion-list"></div>
            </div>
        </div>
    </div>

    <div id="vault-overlay" class="about-overlay" onclick="toggleVault()">
        <div class="about-paper schedule-paper-wide" id="vault-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="toggleVault()">ЗАКРЫТЬ ✖</button>
                <div class="schedule-header">
                    <div class="sh-titles">
                        <h2>БАЗА ДАННЫХ</h2>
                        <p class="about-desc">Зашифрованные учетные данные и 2FA ключи.</p>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-action edit" onclick="window.openVaultModal()">+ ДОБАВИТЬ СЕКРЕТ</button>
                    </div>
                </div>
                <div id="vaultListContainer" class="partners-list"></div>
            </div>
        </div>
    </div>

    <div id="vault-modal" class="modal-overlay" onclick="window.closeVaultModal()">
        <div class="modal-box" onclick="event.stopPropagation()">
            <h3 id="vm-title">НОВЫЙ СЕКРЕТ</h3>
            <input type="hidden" id="vm-id">
            <input type="text" id="vm-service" class="mafia-input" placeholder="Название сервиса (например, GITHUB)" autocomplete="off">
            <input type="text" id="vm-login" class="mafia-input" placeholder="Логин / Email" autocomplete="off">
            <input type="text" id="vm-password" class="mafia-input" placeholder="Пароль" autocomplete="off">
            <input type="text" id="vm-tags" class="mafia-input" placeholder="Теги через запятую (например: ПОЧТА, АККАУНТ)" autocomplete="off">
            
            <label class="checkbox-container">
                <input type="checkbox" id="vm-has2fa" onchange="window.toggle2FAInput()">
                <span class="checkmark"></span>
                Включить 2FA (Двухфакторную аутентификацию)
            </label>
            
            <input type="text" id="vm-2fa-secret" class="mafia-input" placeholder="Секретный ключ 2FA (jnal 3ynd...)" style="display:none; margin-top: 10px;" autocomplete="off">

            <div class="modal-actions" style="margin-top: 25px;">
                <button class="btn-action cancel" onclick="window.closeVaultModal()">ОТМЕНА</button>
                <button class="btn-action cancel" id="vm-delete" style="color:var(--mafia-red); border-color:var(--mafia-red); display:none;" onclick="window.deleteVaultItem()">УДАЛИТЬ</button>
                <button class="btn-action save" onclick="window.saveVaultItem()">СОХРАНИТЬ</button>
            </div>
        </div>
    </div>

    <div id="pin-modal">
        <div class="pin-box">
            <h3>SECURITY CHECK</h3>
            <input type="password" id="pin-input" class="pin-input" maxlength="4" placeholder="••••" autocomplete="off">
            <div class="pin-actions">
                <button class="pin-btn" onclick="window.closePinModal()">ОТМЕНА</button>
                <button class="pin-btn confirm" onclick="window.verifyPin()">ПРИНЯТЬ</button>
            </div>
        </div>
    </div>
`;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initPartners();
    initVault();
    checkAlerts();
});

// === ЛОГИКА ОВЕРЛЕЕВ ===
function toggleOverlay(overlayId, paperId) {
    const overlay = document.getElementById(overlayId);
    const paper = document.getElementById(paperId);
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'dossierClose 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        setTimeout(() => { overlay.classList.remove('active'); paper.style.animation = ''; }, 400); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'dossierOpen 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        return true; 
    }
    return false;
}

window.toggleAbout = () => toggleOverlay('about-overlay', 'about-paper');
window.togglePartners = () => toggleOverlay('partners-overlay', 'partners-paper');
window.toggleVault = () => {
    if (toggleOverlay('vault-overlay', 'vault-paper')) {
        renderVaultList();
    }
};

window.toggleNetwork = () => {
    if (toggleOverlay('network-overlay', 'network-paper')) {
        if (window.go && window.go.main && window.go.main.App.GetLocalIP) {
            window.go.main.App.GetLocalIP().then(ip => decryptIP(ip));
        } else { decryptIP("192.168.1.77"); }
    }
};

window.toggleSchedule = () => {
    if (toggleOverlay('schedule-overlay', 'schedule-paper')) {
        renderScheduleUI();
    } else {
        window.cancelEditMode(); 
    }
};

// === ЛОГИКА СЕЙФА (PIN & DECRYPT) ===
let currentTargetSecretId = null;
let currentTargetPassword = null;

window.requestDecryption = (id, password) => {
    currentTargetSecretId = id;
    currentTargetPassword = password;
    document.getElementById('pin-modal').style.display = 'flex';
    const input = document.getElementById('pin-input');
    input.value = '';
    input.classList.remove('error');
    input.focus();
};

window.closePinModal = () => {
    document.getElementById('pin-modal').style.display = 'none';
    currentTargetSecretId = null;
    currentTargetPassword = null;
};

window.verifyPin = () => {
    const input = document.getElementById('pin-input');
    if (input.value === MASTER_PIN) {
        document.getElementById('pin-modal').style.display = 'none';
        animatePasswordDecryption(currentTargetSecretId, currentTargetPassword);
    } else {
        input.classList.add('error');
        input.value = '';
        setTimeout(() => input.classList.remove('error'), 400);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pin-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') window.verifyPin();
    });
});

function animatePasswordDecryption(elementId, realPassword) {
    const el = document.getElementById(`secret-${elementId}`);
    if (!el) return;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let iterations = 0;
    const maxIterations = 15;
    
    const interval = setInterval(() => {
        let text = '';
        for(let i=0; i<realPassword.length; i++) {
            if(iterations >= maxIterations) {
                text += realPassword[i];
            } else {
                text += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        el.innerText = text;
        
        if (iterations >= maxIterations) {
            clearInterval(interval);
            el.classList.add('decrypted');
            document.getElementById(`decrypt-btn-${elementId}`).style.display = 'none';
            document.getElementById(`copy-pass-${elementId}`).style.display = 'inline-block';
        }
        iterations++;
    }, 40);
}

// === ЛОГИКА АЛЕРТОВ ===
function checkAlerts() {
    const alerts = JSON.parse(localStorage.getItem('mafia_alerts') || '[]');
    const isUnseen = localStorage.getItem('mafia_alerts_unseen') === 'true';
    const bellBtn = document.getElementById('alertBellBtn');
    
    if (alerts.length > 0) {
        document.getElementById('alertBox').style.display = 'block';
        if (isUnseen) {
            bellBtn.classList.add('blinking');
        } else {
            bellBtn.classList.remove('blinking');
        }
    } else {
        document.getElementById('alertBox').style.display = 'none';
        bellBtn.classList.remove('blinking');
    }
}

window.toggleAlerts = () => {
    const dropdown = document.getElementById('alertDropdown');
    dropdown.classList.toggle('active');
    
    if (dropdown.classList.contains('active')) {
        localStorage.setItem('mafia_alerts_unseen', 'false');
        document.getElementById('alertBellBtn').classList.remove('blinking');
        renderAlertList();
    }
};

window.clearAlerts = () => {
    localStorage.removeItem('mafia_alerts');
    localStorage.setItem('mafia_alerts_unseen', 'false');
    document.getElementById('alertDropdown').classList.remove('active');
    checkAlerts();
};

function renderAlertList() {
    const alerts = JSON.parse(localStorage.getItem('mafia_alerts') || '[]');
    const list = document.getElementById('alertList');
    if (alerts.length === 0) {
        list.innerHTML = '<div style="padding: 15px; text-align:center; color:#666;">Чисто.</div>';
        return;
    }
    list.innerHTML = alerts.map(a => `
        <div class="alert-item">
            <span class="alert-who">${a.who}</span> изменил график 
            <span class="alert-day">[${a.day}]</span>:<br>
            <span class="alert-what">${a.change}</span>
        </div>
    `).join('');
}

// === РАСПИСАНИЕ (ПРЕМИУМ ЛОГИКА) ===
const workers = [
    { id: 'mark', name: 'Марк', role: 'Айтишник' },
    { id: 'sasha', name: 'Саша', role: 'СММ-специалист' }
];
const days = [
    { id: 'mon', label: 'Понедельник' }, { id: 'tue', label: 'Вторник' }, { id: 'wed', label: 'Среда' },
    { id: 'thu', label: 'Четверг' }, { id: 'fri', label: 'Пятница' }, 
    { id: 'sat', label: 'Суббота', dayOff: true }, { id: 'sun', label: 'Воскресенье', dayOff: true }
];

let isEditingSchedule = false;
let originalScheduleData = {};

function renderScheduleUI() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = workers.map((worker, index) => {
        const scheduleRows = days.map(day => {
            const defaultStart = worker.id === 'sasha' && !day.dayOff ? '10:00' : '09:00';
            const defaultEnd = worker.id === 'sasha' && !day.dayOff ? '19:00' : '18:00';
            const isDayOffClass = day.dayOff ? 'is-off' : '';
            return `
                <div class="premium-day-row ${isDayOffClass}" data-worker="${worker.id}" data-day="${day.id}">
                    <div class="day-name">${day.label}</div>
                    <div class="time-block">
                        <input type="time" class="time-inp start-time" value="${defaultStart}" disabled>
                        <span class="time-sep">—</span>
                        <input type="time" class="time-inp end-time" value="${defaultEnd}" disabled>
                    </div>
                    <button class="status-pill ${day.dayOff ? 'off' : 'on'}" onclick="window.togglePremiumOffBtn(this)">
                        ${day.dayOff ? 'ВЫХОДНОЙ' : 'РАБОЧИЙ'}
                    </button>
                </div>
            `;
        }).join('');

        const activeClass = index === 0 ? 'active' : '';
        return `
            <div class="accordion-item ${activeClass}">
                <div class="accordion-header" onclick="window.toggleAccordion(this)">
                    <div class="acc-title">
                        <h3>${worker.name}</h3>
                        <span class="acc-role">${worker.role}</span>
                    </div>
                    <span class="acc-icon">▼</span>
                </div>
                <div class="accordion-body" style="${index === 0 ? 'max-height: 1000px;' : ''}">
                    <div class="accordion-content">
                        ${scheduleRows}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    loadScheduleData();
}

window.toggleAccordion = (headerElem) => {
    const item = headerElem.parentElement;
    const body = item.querySelector('.accordion-body');
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.accordion-body').style.maxHeight = null;
    });
    if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + "px";
    }
};

window.togglePremiumOffBtn = (btn) => {
    if (!isEditingSchedule) return;
    const row = btn.closest('.premium-day-row');
    const inputs = row.querySelectorAll('.time-inp');
    if (btn.classList.contains('on')) {
        btn.classList.replace('on', 'off');
        btn.innerText = 'ВЫХОДНОЙ';
        row.classList.add('is-off');
        inputs.forEach(inp => inp.disabled = true);
    } else {
        btn.classList.replace('off', 'on');
        btn.innerText = 'РАБОЧИЙ';
        row.classList.remove('is-off');
        inputs.forEach(inp => inp.disabled = false);
    }
};

window.enterEditMode = () => {
    isEditingSchedule = true;
    document.getElementById('scheduleContainer').classList.add('editing');
    document.getElementById('editScheduleBtn').style.display = 'none';
    document.getElementById('saveScheduleBtn').style.display = 'block';
    document.getElementById('cancelScheduleBtn').style.display = 'block';
    originalScheduleData = extractScheduleData();
    document.querySelectorAll('.premium-day-row').forEach(row => {
        if (!row.classList.contains('is-off')) {
            row.querySelectorAll('.time-inp').forEach(inp => inp.disabled = false);
        }
    });
    document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.add('active');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + "px";
    });
};

window.saveSchedule = () => {
    const newData = extractScheduleData();
    const changes = compareSchedules(originalScheduleData, newData);
    localStorage.setItem('mafia_schedule', JSON.stringify(newData));
    if (changes.length > 0) {
        let alerts = JSON.parse(localStorage.getItem('mafia_alerts') || '[]');
        alerts = [...changes, ...alerts].slice(0, 10);
        localStorage.setItem('mafia_alerts', JSON.stringify(alerts));
        localStorage.setItem('mafia_alerts_unseen', 'true');
        checkAlerts();
    }
    originalScheduleData = newData; 
    window.cancelEditMode(); 
};

window.cancelEditMode = () => {
    isEditingSchedule = false;
    document.getElementById('scheduleContainer').classList.remove('editing');
    document.getElementById('editScheduleBtn').style.display = 'block';
    document.getElementById('saveScheduleBtn').style.display = 'none';
    document.getElementById('cancelScheduleBtn').style.display = 'none';
    document.querySelectorAll('.time-inp').forEach(inp => inp.disabled = true);
    if (Object.keys(originalScheduleData).length > 0) {
        applyScheduleData(originalScheduleData);
    } else {
        loadScheduleData();
    }
};

function extractScheduleData() {
    const data = {};
    document.querySelectorAll('.premium-day-row').forEach(row => {
        const worker = row.dataset.worker;
        const day = row.dataset.day;
        if (!data[worker]) data[worker] = {};
        data[worker][day] = { start: row.querySelector('.start-time').value, end: row.querySelector('.end-time').value, isOff: row.classList.contains('is-off') };
    });
    return data;
}

function loadScheduleData() {
    const saved = localStorage.getItem('mafia_schedule');
    if (saved) applyScheduleData(JSON.parse(saved));
}

function applyScheduleData(data) {
    document.querySelectorAll('.premium-day-row').forEach(row => {
        const worker = row.dataset.worker;
        const day = row.dataset.day;
        if (data[worker] && data[worker][day]) {
            const sd = data[worker][day];
            row.querySelector('.start-time').value = sd.start;
            row.querySelector('.end-time').value = sd.end;
            const offBtn = row.querySelector('.status-pill');
            if (sd.isOff) {
                row.classList.add('is-off');
                offBtn.classList.replace('on', 'off');
                offBtn.innerText = 'ВЫХОДНОЙ';
            } else {
                row.classList.remove('is-off');
                offBtn.classList.replace('off', 'on');
                offBtn.innerText = 'РАБОЧИЙ';
            }
        }
    });
}

function compareSchedules(oldData, newData) {
    const diff = [];
    workers.forEach(w => {
        days.forEach(d => {
            const oldDay = oldData[w.id]?.[d.id];
            const newDay = newData[w.id]?.[d.id];
            if (oldDay && newDay) {
                if (oldDay.isOff !== newDay.isOff) {
                    diff.push({ who: w.name, day: d.label, change: newDay.isOff ? 'Назначен ВЫХОДНОЙ' : 'Назначен РАБОЧИЙ ДЕНЬ' });
                } else if (!newDay.isOff && (oldDay.start !== newDay.start || oldDay.end !== newDay.end)) {
                    diff.push({ who: w.name, day: d.label, change: `${oldDay.start}-${oldDay.end} ➔ ${newDay.start}-${newDay.end}` });
                }
            }
        });
    });
    return diff;
}

// === АНИМАЦИЯ ДЕШИФРОВКИ IP ===
let isDecrypting = false;
function decryptIP(targetIP) {
    if (isDecrypting) return;
    isDecrypting = true;
    const container = document.getElementById('ip-container');
    const parts = targetIP.split('.');
    container.innerHTML = '';
    const spans = [];
    parts.forEach((part, index) => {
        for(let i=0; i<part.length; i++) {
            const span = document.createElement('span'); span.className = 'ip-digit'; span.dataset.target = part[i]; span.innerText = Math.floor(Math.random() * 10);
            container.appendChild(span); spans.push(span);
        }
        if (index < 3) { const dot = document.createElement('span'); dot.className = 'ip-dot'; dot.innerText = '.'; container.appendChild(dot); }
    });
    let iterations = 0;
    const maxIterations = 20; 
    const interval = setInterval(() => {
        spans.forEach((span, index) => {
            if (iterations > index * 2) { span.innerText = span.dataset.target; span.classList.add('decrypted'); } 
            else { span.innerText = Math.floor(Math.random() * 10); }
        });
        if (iterations >= maxIterations + spans.length * 2) { clearInterval(interval); isDecrypting = false; }
        iterations++;
    }, 50);
}

// === ЛОГИКА ЗАПУСКА УЗЛОВ ===
function startProject(buttonElement, id, name, description, path, command) {
    const isRunning = buttonElement.classList.contains('active');
    if (isRunning) {
        buttonElement.classList.remove('active'); buttonElement.innerText = 'ЗАПУСТИТЬ';
        if (window.go.main.App.StopService) window.go.main.App.StopService(id).catch(err => console.error("Ошибка:", err));
        return; 
    }
    const service = {id, name, description, path, command};
    buttonElement.classList.add('active'); buttonElement.innerText = 'В РАБОТЕ';
    window.go.main.App.RunService(service).catch((err) => {
        buttonElement.classList.remove('active'); buttonElement.innerText = 'ЗАПУСТИТЬ'; console.error(err);
    });
} 
window.startProject = startProject;

if (window.go && window.go.main) {
    window.go.main.App.GetServices().then((services) => {
        if (services) { renderCards(services); document.getElementById("result").innerText = "Все узлы готовы к интеграции."; } 
        else { document.getElementById("result").innerText = "Сбой: Архивы недоступны."; }
    });
}

window.openLink = function(url) {
    if (!url) return;
    if (window.runtime && window.runtime.BrowserOpenURL) { window.runtime.BrowserOpenURL(url); } 
    else { window.open(url, '_blank'); }
};

function renderCards(services) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';
    services.forEach(service => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `
            <div class="card-content">
                <div><h3>${service.name}</h3><p>${service.description}</p></div>
                <div class="card-actions">
                    <button class="btn-start" onclick="startProject(this, '${service.id}', '${service.name}', '${service.description}', '${service.path}', '${service.command}')">ЗАПУСТИТЬ</button>
                    ${service.url ? `<button class="btn-goto" onclick="openLink('${service.url}')">ПЕРЕЙТИ ↗</button>` : ''}
                </div>
            </div>
        `;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -8; const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.borderColor = 'rgba(212, 175, 55, 0.8)'; card.style.boxShadow = `0 30px 60px rgba(0,0,0,0.95), inset 0 0 20px rgba(212, 175, 55, 0.15)`; card.style.zIndex = '50';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'rgba(212, 175, 55, 0.25)'; card.style.boxShadow = `0 25px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.8)`; card.style.zIndex = '1';
        });
        container.appendChild(card);
    });
}

// === MAFIA ENGINE ===
function initMafiaEngine() {
    const canvas = document.createElement('canvas'); canvas.id = 'nexus-canvas'; document.body.prepend(canvas); const ctx = canvas.getContext('2d');
    let width, height; let particles = []; const mouse = { x: null, y: null, radius: 150 };
    window.addEventListener('mousemove', (event) => { mouse.x = event.clientX; mouse.y = event.clientY; const glow = document.getElementById('cursor-glow'); if(glow) { glow.style.left = mouse.x + 'px'; glow.style.top = mouse.y + 'px'; } });
    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    class Ash {
        constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5) * 0.5; this.vy = Math.random() * -1 - 0.2; this.radius = Math.random() * 1.5 + 0.5; this.opacity = Math.random() * 0.5 + 0.2; }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.y < 0) { this.y = height; this.x = Math.random() * width; }
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (mouse.x != null && mouse.y != null) { let dx = mouse.x - this.x; let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy); if (distance < mouse.radius) { const force = (mouse.radius - distance) / mouse.radius; this.vx -= (dx / distance) * force * 0.5; this.vy -= (dy / distance) * force * 0.5; } }
            this.vx *= 0.99; if (this.vy < -1.5) this.vy *= 0.95; 
        }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`; ctx.fill(); }
    }
    for (let i = 0; i < 120; i++) particles.push(new Ash());
    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(); particles[i].draw();
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x; let dy = particles[i].y - particles[j].y; let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 80) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(212, 175, 55, ${0.15 - distance/500})`; ctx.lineWidth = 0.5; ctx.stroke(); }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}
initMafiaEngine();