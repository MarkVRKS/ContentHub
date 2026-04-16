// Данные работников
const workers = [
    { id: 'mark', name: 'Марк', role: 'Айтишник', avatar: 'М' },
    { id: 'sasha', name: 'Саша', role: 'СММ-специалист', avatar: 'С' }
];

const days = [
    { id: 'mon', label: 'ПН', fullName: 'Понедельник' },
    { id: 'tue', label: 'ВТ', fullName: 'Вторник' },
    { id: 'wed', label: 'СР', fullName: 'Среда' },
    { id: 'thu', label: 'ЧТ', fullName: 'Четверг' },
    { id: 'fri', label: 'ПТ', fullName: 'Пятница' },
    { id: 'sat', label: 'СБ', fullName: 'Суббота', dayOff: true },
    { id: 'sun', label: 'ВС', fullName: 'Воскресенье', dayOff: true }
];

// Состояние
let isEditing = false;
let originalData = {};
let notifications = [];

// DOM
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const notification = document.getElementById('notification');
const notificationClose = document.getElementById('notificationClose');
const notificationList = document.getElementById('notificationList');
const scheduleContainer = document.getElementById('scheduleContainer');
const themeBtns = document.querySelectorAll('.theme-btn');

// Генерация карточки работника
function generateWorkerCard(worker) {
    const scheduleRows = days.map(day => {
        const startTime = worker.id === 'sasha' && !day.dayOff ? '10:00' : '09:00';
        const endTime = worker.id === 'sasha' && !day.dayOff ? '19:00' : '18:00';
        const disabled = day.dayOff ? 'disabled' : '';
        const dayOffClass = day.dayOff ? 'day-off' : '';
        const dayOffActive = day.dayOff ? 'active' : '';

        return `
            <div class="day-row ${dayOffClass}" data-day="${day.id}">
                <span class="day-label">${day.label}</span>
                <div class="time-range">
                    <input type="time" class="time-start" value="${startTime}"
                           data-worker="${worker.id}" data-day="${day.id}" data-type="start" ${disabled}>
                    <span class="time-separator">—</span>
                    <input type="time" class="time-end" value="${endTime}"
                           data-worker="${worker.id}" data-day="${day.id}" data-type="end" ${disabled}>
                </div>
                <button class="day-off-btn ${dayOffActive}" data-worker="${worker.id}" data-day="${day.id}">
                    Выходной
                </button>
                <button class="note-btn" data-worker="${worker.id}" data-day="${day.id}">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                        <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"/>
                        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <div class="note-panel" data-worker="${worker.id}" data-day="${day.id}">
                    <textarea class="note-input" placeholder="Добавить заметку к этому дню..."
                              data-worker="${worker.id}" data-day="${day.id}"></textarea>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="worker-card" data-worker="${worker.id}">
            <div class="worker-header">
                <div class="worker-avatar">
                    <span>${worker.avatar}</span>
                    <div class="worker-status"></div>
                </div>
                <div class="worker-info">
                    <h2 class="worker-name">${worker.name}</h2>
                    <p class="worker-role">${worker.role}</p>
                </div>
                <div class="worker-badge">Активен</div>
            </div>
            <div class="schedule-days">
                ${scheduleRows}
            </div>
        </div>
    `;
}

// Инициализация
function initCards() {
    scheduleContainer.innerHTML = workers.map(generateWorkerCard).join('');
    attachEventListeners();
}

// Подключение обработчиков
function attachEventListeners() {
    document.querySelectorAll('.day-off-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isEditing) return;
            const row = btn.closest('.day-row');
            toggleDayOff(row, btn);
        });
    });

    document.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const worker = btn.dataset.worker;
            const day = btn.dataset.day;
            const panel = document.querySelector(`.note-panel[data-worker="${worker}"][data-day="${day}"]`);
            btn.classList.toggle('active');
            panel.classList.toggle('open');
        });
    });

    document.querySelectorAll('input[type="time"]').forEach(input => {
        input.addEventListener('change', () => {
            const row = input.closest('.day-row');
            const startInput = row.querySelector('.time-start');
            const endInput = row.querySelector('.time-end');

            if (startInput.value && endInput.value) {
                const start = startInput.value.split(':').map(Number);
                const end = endInput.value.split(':').map(Number);
                const startMin = start[0] * 60 + start[1];
                const endMin = end[0] * 60 + end[1];

                if (endMin <= startMin) {
                    alert('⚠️ Время окончания должно быть позже времени начала!');
                    input.value = input.dataset.type === 'start' ? '09:00' : '18:00';
                }
            }
        });
    });
}

// Переключение выходного
function toggleDayOff(row, btn, force = null) {
    const isActive = force !== null ? force : !btn.classList.contains('active');
    const startInput = row.querySelector('.time-start');
    const endInput = row.querySelector('.time-end');

    if (isActive) {
        btn.classList.add('active');
        row.classList.add('day-off');
        startInput.disabled = true;
        endInput.disabled = true;
    } else {
        btn.classList.remove('active');
        row.classList.remove('day-off');
        startInput.disabled = false;
        endInput.disabled = false;
    }
}

// Загрузка расписания
function loadSchedule() {
    const saved = localStorage.getItem('schedule');
    if (saved) {
        const data = JSON.parse(saved);
        document.querySelectorAll('.day-row').forEach(row => {
            const startInput = row.querySelector('.time-start');
            const endInput = row.querySelector('.time-end');
            const dayOffBtn = row.querySelector('.day-off-btn');
            const noteInput = row.querySelector('.note-input');
            const worker = startInput.dataset.worker;
            const day = startInput.dataset.day;

            if (data[worker] && data[worker][day]) {
                const schedule = data[worker][day];
                if (schedule.dayOff) {
                    toggleDayOff(row, dayOffBtn, true);
                } else {
                    startInput.value = schedule.start || startInput.value;
                    endInput.value = schedule.end || endInput.value;
                    toggleDayOff(row, dayOffBtn, false);
                }
                if (schedule.note) {
                    noteInput.value = schedule.note;
                }
            }
        });
    }
}

// Сохранение расписания
function saveSchedule() {
    const data = {};
    const changes = [];

    document.querySelectorAll('.day-row').forEach(row => {
        const startInput = row.querySelector('.time-start');
        const endInput = row.querySelector('.time-end');
        const dayOffBtn = row.querySelector('.day-off-btn');
        const noteInput = row.querySelector('.note-input');
        const worker = startInput.dataset.worker;
        const day = startInput.dataset.day;

        if (!data[worker]) data[worker] = {};

        const newSchedule = {
            start: startInput.value,
            end: endInput.value,
            dayOff: dayOffBtn.classList.contains('active'),
            note: noteInput.value
        };

        data[worker][day] = newSchedule;

        // Проверка изменений
        if (originalData[worker] && originalData[worker][day]) {
            const old = originalData[worker][day];
            const workerName = workers.find(w => w.id === worker).name;
            const dayName = days.find(d => d.id === day).fullName;

            if (old.start !== newSchedule.start || old.end !== newSchedule.end) {
                changes.push({
                    worker: workerName,
                    day: dayName,
                    type: 'time',
                    old: `${old.start} - ${old.end}`,
                    new: `${newSchedule.start} - ${newSchedule.end}`
                });
            }

            if (old.dayOff !== newSchedule.dayOff) {
                changes.push({
                    worker: workerName,
                    day: dayName,
                    type: 'dayoff',
                    new: newSchedule.dayOff ? 'Выходной' : 'Рабочий день'
                });
            }

            if (old.note !== newSchedule.note && newSchedule.note) {
                changes.push({
                    worker: workerName,
                    day: dayName,
                    type: 'note',
                    new: 'Добавлена заметка'
                });
            }
        }
    });

    localStorage.setItem('schedule', JSON.stringify(data));

    // Сохранение уведомлений
    if (changes.length > 0) {
        const savedNotifications = localStorage.getItem('notifications');
        notifications = savedNotifications ? JSON.parse(savedNotifications) : [];

        changes.forEach(change => {
            notifications.unshift({
                ...change,
                timestamp: new Date().toISOString()
            });
        });

        // Оставляем только последние 20 уведомлений
        notifications = notifications.slice(0, 20);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationDisplay();
    }
}

// Обновление отображения уведомлений
function updateNotificationDisplay() {
    const savedNotifications = localStorage.getItem('notifications');
    notifications = savedNotifications ? JSON.parse(savedNotifications) : [];

    if (notifications.length > 0) {
        notification.classList.add('active');
        
        notificationList.innerHTML = notifications.map(notif => {
            const date = new Date(notif.timestamp);
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

            let text = '';
            if (notif.type === 'time') {
                text = `Время изменено: ${notif.old} → ${notif.new}`;
            } else if (notif.type === 'dayoff') {
                text = `Статус: ${notif.new}`;
            } else if (notif.type === 'note') {
                text = notif.new;
            }

            return `
                <div class="notification-item">
                    <div class="notification-item-header">
                        <span class="notification-item-name">${notif.worker}</span>
                        <span class="notification-item-time">${timeStr}, ${dateStr}</span>
                    </div>
                    <div class="notification-item-text">${notif.day}: ${text}</div>
                </div>
            `;
        }).join('');
    } else {
        notification.classList.remove('active');
        notificationList.innerHTML = '<p class="notification-empty">Нет новых изменений</p>';
    }
}

// Сохранение оригинальных данных
function saveOriginalData() {
    originalData = {};
    document.querySelectorAll('.day-row').forEach(row => {
        const startInput = row.querySelector('.time-start');
        const endInput = row.querySelector('.time-end');
        const dayOffBtn = row.querySelector('.day-off-btn');
        const noteInput = row.querySelector('.note-input');
        const worker = startInput.dataset.worker;
        const day = startInput.dataset.day;

        if (!originalData[worker]) originalData[worker] = {};
        originalData[worker][day] = {
            start: startInput.value,
            end: endInput.value,
            dayOff: dayOffBtn.classList.contains('active'),
            note: noteInput.value
        };
    });
}

// Восстановление оригинальных данных
function restoreOriginalData() {
    document.querySelectorAll('.day-row').forEach(row => {
        const startInput = row.querySelector('.time-start');
        const endInput = row.querySelector('.time-end');
        const dayOffBtn = row.querySelector('.day-off-btn');
        const noteInput = row.querySelector('.note-input');
        const worker = startInput.dataset.worker;
        const day = startInput.dataset.day;

        if (originalData[worker] && originalData[worker][day]) {
            const original = originalData[worker][day];
            startInput.value = original.start;
            endInput.value = original.end;
            noteInput.value = original.note;
            toggleDayOff(row, dayOffBtn, original.dayOff);
        }
    });
}

// Режим редактирования
function enterEditMode() {
    isEditing = true;
    document.body.classList.add('edit-mode');
    saveOriginalData();
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';
    cancelBtn.style.display = 'flex';
}

// Выход из режима редактирования
function exitEditMode() {
    isEditing = false;
    document.body.classList.remove('edit-mode');
    editBtn.style.display = 'flex';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

// Переключение темы
function switchTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Обработчики событий
editBtn.addEventListener('click', enterEditMode);

saveBtn.addEventListener('click', () => {
    saveSchedule();
    exitEditMode();
});

cancelBtn.addEventListener('click', () => {
    restoreOriginalData();
    exitEditMode();
});

notification.addEventListener('click', (e) => {
    if (e.target.closest('.notification-close')) {
        return;
    }
    notification.classList.toggle('active');
});

notificationClose.addEventListener('click', (e) => {
    e.stopPropagation();
    notification.classList.remove('active');
});

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTheme(btn.dataset.theme));
});

// Инициализация
window.addEventListener('load', () => {
    initCards();
    const savedTheme = localStorage.getItem('theme') || 'dark';
    switchTheme(savedTheme);
    loadSchedule();
    updateNotificationDisplay();
});
