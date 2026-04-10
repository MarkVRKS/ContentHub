import './style.css';
import './app.css';

document.body.insertAdjacentHTML('beforeend', '<div id="cursor-glow"></div>');

document.querySelector('#app').innerHTML = `
    <div class="top-bar">
        <div class="brand">
            <span class="brand-icon">♠</span>
            Content Mafia <span class="version">FAMIGLIA.v1.0</span>
        </div>
        <div class="top-controls">
            <button class="sys-info-btn" onclick="toggleNetwork()">[ 🕸 ] СИНДИКАТ</button>
            <button class="sys-info-btn" onclick="toggleAbout()">[ 👁 ] ДОСЬЕ</button>
            <div class="status-indicator">
                <span class="pulse"></span> SECURE
            </div>
        </div>
    </div>
    <div class="result" id="result">Ожидание приказов...</div>
    <div id="card-container" class="cards-grid"></div>

    <div id="about-overlay" class="about-overlay" onclick="toggleAbout()">
        <div class="about-paper" id="about-paper" onclick="event.stopPropagation()">
            <div class="paper-content">
                <button class="close-btn" onclick="toggleAbout()">[ ЗАКРЫТЬ ]</button>
                <h2>СТАТУС: LA COSA NOSTRA</h2>
                <div class="about-grid">
                    <div class="about-stat"><span>АРХИТЕКТОР:</span><span class="highlight">MarkVRKS</span></div>
                    <div class="about-stat"><span>УРОВЕНЬ ДОСТУПА:</span><span class="highlight">CAPO DEI CAPI</span></div>
                    <div class="about-stat"><span>ОРГАНИЗАЦИЯ:</span><span class="highlight">CONTENT MAFIA</span></div>
                </div>
                <p class="about-desc">
                    Закрытый хаб управления цифровыми активами семьи. 
                    Оркестрация микросервисов, абсолютный контроль процессов и защита данных на высшем уровне.
                </p>
            </div>
        </div>
    </div>

    <div id="network-overlay" class="about-overlay" onclick="toggleNetwork()">
        <div class="about-paper" id="network-paper" onclick="event.stopPropagation()">
            <div class="paper-content" style="text-align: center;">
                <button class="close-btn" onclick="toggleNetwork()">[ ЗАКРЫТЬ ]</button>
                <h2>УЗЕЛ СВЯЗИ</h2>
                <p class="about-desc" style="margin: 20px auto; border:none; text-align:center;">
                    ПЕРЕХВАТ ЛОКАЛЬНОГО АДРЕСА СИСТЕМЫ...
                </p>
                <div id="ip-container">000.000.000.000</div>
            </div>
        </div>
    </div>
`;

function toggleAbout() {
    const overlay = document.getElementById('about-overlay');
    const paper = document.getElementById('about-paper');
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'dossierClose 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        setTimeout(() => { overlay.classList.remove('active'); paper.style.animation = ''; }, 400); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'dossierOpen 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards';
    }
}
window.toggleAbout = toggleAbout; 

// === АНИМАЦИЯ ДЕШИФРОВКИ IP ===
let isDecrypting = false;
function decryptIP(targetIP) {
    if (isDecrypting) return;
    isDecrypting = true;
    
    const container = document.getElementById('ip-container');
    const parts = targetIP.split('.');
    container.innerHTML = '';
    
    // Создаем спаны для каждой цифры
    const spans = [];
    parts.forEach((part, index) => {
        for(let i=0; i<part.length; i++) {
            const span = document.createElement('span');
            span.className = 'ip-digit';
            span.dataset.target = part[i];
            span.innerText = Math.floor(Math.random() * 10);
            container.appendChild(span);
            spans.push(span);
        }
        if (index < 3) {
            const dot = document.createElement('span');
            dot.className = 'ip-dot';
            dot.innerText = '.';
            container.appendChild(dot);
        }
    });

    // Постепенно останавливаем случайные числа
    let iterations = 0;
    const maxIterations = 20; // Длительность взлома
    
    const interval = setInterval(() => {
        spans.forEach((span, index) => {
            if (iterations > index * 2) {
                span.innerText = span.dataset.target;
                span.classList.add('decrypted');
            } else {
                span.innerText = Math.floor(Math.random() * 10);
            }
        });
        
        if (iterations >= maxIterations + spans.length * 2) {
            clearInterval(interval);
            isDecrypting = false;
        }
        iterations++;
    }, 50);
}

function toggleNetwork() {
    const overlay = document.getElementById('network-overlay');
    const paper = document.getElementById('network-paper');
    
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'dossierClose 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        setTimeout(() => { overlay.classList.remove('active'); paper.style.animation = ''; }, 400); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'dossierOpen 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        
        // Запрашиваем реальный IP у Go, если нет - ставим красивый фейк
        if (window.go && window.go.main && window.go.main.App.GetLocalIP) {
            window.go.main.App.GetLocalIP().then(ip => decryptIP(ip));
        } else {
            decryptIP("192.168.1.77"); 
        }
    }
}
window.toggleNetwork = toggleNetwork;

function startProject(buttonElement, id, name, description, path, command) {
    const isRunning = buttonElement.classList.contains('active');
    if (isRunning) {
        buttonElement.classList.remove('active');
        buttonElement.innerText = 'ЗАПУСТИТЬ';
        if (window.go.main.App.StopService) {
            window.go.main.App.StopService(id).catch(err => console.error("Ошибка:", err));
        }
        return; 
    }

    const service = {id, name, description, path, command};
    buttonElement.classList.add('active');
    buttonElement.innerText = 'В РАБОТЕ';

    window.go.main.App.RunService(service).catch((err) => {
        buttonElement.classList.remove('active');
        buttonElement.innerText = 'ЗАПУСТИТЬ';
        console.error("Ошибка при вызове RunService:", err);
    });
} 
window.startProject = startProject;

window.go.main.App.GetServices().then((services) => {
    if (services) {
        renderCards(services);
        document.getElementById("result").innerText = "Все узлы готовы к интеграции.";
    } else {
        document.getElementById("result").innerText = "Сбой: Архивы недоступны.";
    }
});

window.openLink = function(url) {
    if (!url) return;
    if (window.runtime && window.runtime.BrowserOpenURL) {
        window.runtime.BrowserOpenURL(url);
    } else {
        window.open(url, '_blank'); 
    }
};

function renderCards(services) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-content">
                <div>
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-start" onclick="startProject(this, '${service.id}', '${service.name}', '${service.description}', '${service.path}', '${service.command}')">
                        ЗАПУСТИТЬ
                    </button>
                    ${service.url ? `
                        <button class="btn-goto" onclick="openLink('${service.url}')">
                            [ ↗ ] ПЕРЕЙТИ
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // === ЭФФЕКТ ЗАСТЫВАНИЯ 3D (FROZEN PARALLAX) ===
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Угол наклона
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -8;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
            
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.borderColor = 'rgba(212, 175, 55, 0.8)';
            card.style.boxShadow = `0 30px 60px rgba(0,0,0,0.95), inset 0 0 20px rgba(212, 175, 55, 0.15)`;
            card.style.zIndex = '50';
        });
        
        card.addEventListener('mouseleave', () => {
            // МЫ БОЛЬШЕ НЕ СБРАСЫВАЕМ transform! Карточка застывает под углом.
            // Только возвращаем стили свечения в спокойное состояние:
            card.style.borderColor = 'rgba(212, 175, 55, 0.25)';
            card.style.boxShadow = `0 25px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.8)`;
            card.style.zIndex = '1';
        });

        container.appendChild(card);
    });
}

// ==========================================================================
// [ MAFIA ENGINE ] Золотой пепел
// ==========================================================================
function initMafiaEngine() {
    const canvas = document.createElement('canvas');
    canvas.id = 'nexus-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        const glow = document.getElementById('cursor-glow');
        if(glow) { glow.style.left = mouse.x + 'px'; glow.style.top = mouse.y + 'px'; }
    });

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    class Ash {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5; 
            this.vy = Math.random() * -1 - 0.2; 
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.y < 0) { this.y = height; this.x = Math.random() * width; }
            if (this.x < 0 || this.x > width) this.vx *= -1;

            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    this.vx -= (dx / distance) * force * 0.5; this.vy -= (dy / distance) * force * 0.5;
                }
            }
            this.vx *= 0.99;
            if (this.vy < -1.5) this.vy *= 0.95; 
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`; ctx.fill();
        }
    }

    for (let i = 0; i < 120; i++) particles.push(new Ash());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(); particles[i].draw();
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x; let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 80) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(212, 175, 55, ${0.15 - distance/500})`; ctx.lineWidth = 0.5; ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

initMafiaEngine();