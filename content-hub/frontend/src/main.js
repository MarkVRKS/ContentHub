import './style.css';
import './app.css';

document.querySelector('#app').innerHTML = `
    <div class="top-bar">
        <div class="brand">
            <span class="brand-icon">⚡</span>
            ContentHub <span class="version">SYS.OP.v1.0</span>
        </div>
        <div class="top-controls">
            <button class="sys-info-btn" onclick="toggleNetwork()">[ 🌐 ] СЕТЬ</button>
            <button class="sys-info-btn" onclick="toggleAbout()">[ ? ] SYS_INFO</button>
            <div class="status-indicator">
                <span class="pulse"></span> ONLINE
            </div>
        </div>
    </div>
    <div class="result" id="result">Ожидание инициализации систем...</div>
    <div id="card-container" class="cards-grid"></div>

    <div id="about-overlay" class="about-overlay" onclick="toggleAbout()">
        <div class="about-paper" id="about-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="toggleAbout()">[ ✕ ] ЗАКРЫТЬ</button>
                <h2>СТАТУС: CONTENT_HUB</h2>
                <div class="about-grid">
                    <div class="about-stat">
                        <span>РАЗРАБОТЧИК:</span>
                        <span class="highlight">MarkVRKS</span>
                    </div>
                    <div class="about-stat">
                        <span>УРОВЕНЬ ДОСТУПА:</span>
                        <span class="highlight">GOD_MODE</span>
                    </div>
                    <div class="about-stat">
                        <span>ВЫПОЛНЕНО ДЛЯ:</span>
                        <span class="highlight">КОНТЕНТ-МАФИИ</span>
                    </div>
                </div>
                <p class="about-desc">
                    Централизованный хаб управления контентом и оркестрации микросервисов.
                    Система поддерживает мгновенный запуск процессов, мониторинг состояния и 
                    изолированную среду выполнения.
                </p>
                <div class="barcode">|||| ||||| || ||| ||||| |||</div>
            </div>
        </div>
    </div>

    <div id="network-overlay" class="about-overlay" onclick="toggleNetwork()">
        <div class="about-paper" id="network-paper" onclick="event.stopPropagation()">
            <div class="paper-content" style="text-align: center;">
                <button class="close-btn" onclick="toggleNetwork()">[ ✕ ] ЗАКРЫТЬ</button>
                <h2>ЛОКАЛЬНЫЙ УЗЕЛ</h2>
                <p class="about-desc" style="margin-top: 20px;">
                    СИСТЕМА ИЗОЛИРОВАНА. ПРОВЕДИТЕ ДЛЯ ДЕШИФРОВКИ IP-АДРЕСА
                </p>
                
                <ul class="ip-code">
                    <li tabindex="0" class="digit"><span>1</span></li>
                    <li tabindex="0" class="digit"><span>9</span></li>
                    <li tabindex="0" class="digit"><span>2</span></li>
                    <li tabindex="0" class="digit dot"><span>.</span></li>
                    <li tabindex="0" class="digit"><span>1</span></li>
                    <li tabindex="0" class="digit"><span>6</span></li>
                    <li tabindex="0" class="digit"><span>8</span></li>
                    <li tabindex="0" class="digit dot"><span>.</span></li>
                    <li tabindex="0" class="digit"><span>0</span></li>
                    <li tabindex="0" class="digit dot"><span>.</span></li>
                    <li tabindex="0" class="digit"><span>1</span></li>
                </ul>
                
                <div class="barcode" style="margin-top: 40px;">|| ||| ||||| || ||| ||||</div>
            </div>
        </div>
    </div>
`;

// ЛОГИКА ОКНА "О ПРОЕКТЕ"
function toggleAbout() {
    const overlay = document.getElementById('about-overlay');
    const paper = document.getElementById('about-paper');
    
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'crumple 0.6s cubic-bezier(0.8, -0.5, 0.2, 1.4) forwards';
        setTimeout(() => {
            overlay.classList.remove('active');
            paper.style.animation = ''; 
        }, 600); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'unfold 0.8s cubic-bezier(0.2, 1.2, 0.3, 1) forwards';
    }
}
window.toggleAbout = toggleAbout; 

// НОВАЯ ЛОГИКА ОКНА СЕТИ
function toggleNetwork() {
    const overlay = document.getElementById('network-overlay');
    const paper = document.getElementById('network-paper');
    
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'crumple 0.6s cubic-bezier(0.8, -0.5, 0.2, 1.4) forwards';
        setTimeout(() => {
            overlay.classList.remove('active');
            paper.style.animation = ''; 
        }, 600); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'unfold 0.8s cubic-bezier(0.2, 1.2, 0.3, 1) forwards';
    }
}
window.toggleNetwork = toggleNetwork;

// ЛОГИКА ЗАПУСКА ПРОЕКТОВ
function startProject(id, name, description, path, command) {
    const service = {id, name, description, path, command};
    
    // Вызов Go-кода
    window.go.main.App.RunService(service).then((result) => {
        alert(result);
    }).catch((err) => {
        console.error("Ошибка при вызове RunService:", err);
    });
} 
window.startProject = startProject;

// Читаем services.json и отрисовываем
window.go.main.App.GetServices().then((services) => {
    if (services) {
        renderCards(services);
        document.getElementById("result").innerText = "Все системы готовы к запуску 👇";
    } else {
        document.getElementById("result").innerText = "Ошибка: не удалось загрузить список сервисов.";
    }
});

function renderCards(services) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-content">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <button class="btn-start" onclick="startProject('${service.id}', '${service.name}', '${service.description}', '${service.path}', '${service.command}')">
                    ЗАПУСТИТЬ
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}