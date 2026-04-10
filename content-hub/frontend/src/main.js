import './style.css';
import './app.css';

document.body.insertAdjacentHTML('beforeend', '<div id="cursor-glow"></div>');

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
                    <div class="about-stat"><span>РАЗРАБОТЧИК:</span><span class="highlight">MarkVRKS</span></div>
                    <div class="about-stat"><span>УРОВЕНЬ ДОСТУПА:</span><span class="highlight">GOD_MODE</span></div>
                    <div class="about-stat"><span>ВЫПОЛНЕНО ДЛЯ:</span><span class="highlight">КОНТЕНТ-МАФИИ</span></div>
                </div>
                <p class="about-desc">
                    Централизованный хаб управления контентом и оркестрации микросервисов.
                    Система поддерживает мгновенный запуск процессов, мониторинг состояния и изолированную среду выполнения.
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
                <p class="about-desc" style="margin-top: 20px;">СИСТЕМА ИЗОЛИРОВАНА. ПРОВЕДИТЕ ДЛЯ ДЕШИФРОВКИ IP-АДРЕСА</p>
                
                <ul class="ip-code">
                    <li tabindex="0" class="digit"><span>1</span></li><li tabindex="0" class="digit"><span>9</span></li><li tabindex="0" class="digit"><span>2</span></li><li tabindex="0" class="digit dot"><span>.</span></li><li tabindex="0" class="digit"><span>1</span></li><li tabindex="0" class="digit"><span>6</span></li><li tabindex="0" class="digit"><span>8</span></li><li tabindex="0" class="digit dot"><span>.</span></li><li tabindex="0" class="digit"><span>0</span></li><li tabindex="0" class="digit dot"><span>.</span></li><li tabindex="0" class="digit"><span>1</span></li>
                </ul>
                <div class="barcode" style="margin-top: 40px;">|| ||| ||||| || ||| ||||</div>
            </div>
        </div>
    </div>
`;

function toggleAbout() {
    const overlay = document.getElementById('about-overlay');
    const paper = document.getElementById('about-paper');
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'hologramClose 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => { overlay.classList.remove('active'); paper.style.animation = ''; }, 350); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'hologramOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
}
window.toggleAbout = toggleAbout; 

function toggleNetwork() {
    const overlay = document.getElementById('network-overlay');
    const paper = document.getElementById('network-paper');
    if (overlay.classList.contains('active')) {
        paper.style.animation = 'hologramClose 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => { overlay.classList.remove('active'); paper.style.animation = ''; }, 350); 
    } else {
        overlay.classList.add('active');
        paper.style.animation = 'hologramOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
}
window.toggleNetwork = toggleNetwork;

function startProject(buttonElement, id, name, description, path, command) {
    const isRunning = buttonElement.classList.contains('active');
    if (isRunning) {
        buttonElement.classList.remove('active');
        buttonElement.innerText = 'ЗАПУСТИТЬ';
        if (window.go.main.App.StopService) {
            window.go.main.App.StopService(id).catch(err => console.error("Ошибка остановки: ", err));
        } else {
            console.log(`[СИМУЛЯЦИЯ] Сервис ${name} остановлен`);
        }
        return; 
    }

    const service = {id, name, description, path, command};
    buttonElement.classList.add('active');
    buttonElement.innerText = 'В РАБОТЕ';

    window.go.main.App.RunService(service).then((result) => {
        console.log(`Успешно: ${result}`); 
    }).catch((err) => {
        buttonElement.classList.remove('active');
        buttonElement.innerText = 'ЗАПУСТИТЬ';
        console.error("Ошибка при вызове RunService:", err);
    });
} 
window.startProject = startProject;

window.go.main.App.GetServices().then((services) => {
    if (services) {
        renderCards(services);
        document.getElementById("result").innerText = "Все системы готовы к запуску 👇";
    } else {
        document.getElementById("result").innerText = "Ошибка: не удалось загрузить список сервисов.";
    }
});

window.openLink = function(url) {
    if (!url) return;
    if (window.runtime && window.runtime.BrowserOpenURL) {
        window.runtime.BrowserOpenURL(url);
        console.log(`[SYS] Перехват ссылки: ${url}`);
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
        
        // Рисуем внутренности карточки с двумя кнопками
        card.innerHTML = `
            <div class="card-content" style="display: flex; flex-direction: column; height: 100%;">
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
        
        // 3D TILT EFFECT
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.borderColor = 'rgba(0, 240, 255, 0.5)';
            card.style.boxShadow = `0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0, 240, 255, 0.2)`;
            card.style.zIndex = '50';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.borderColor = 'var(--glass-border)';
            card.style.boxShadow = `0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
            card.style.zIndex = '1';
        });

        container.appendChild(card);
    });
}

function initCyberNexus() {
    const canvas = document.createElement('canvas');
    canvas.id = 'nexus-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const mouse = { x: null, y: null, radius: 200 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        
        const glow = document.getElementById('cursor-glow');
        if(glow) {
            glow.style.left = mouse.x + 'px';
            glow.style.top = mouse.y + 'px';
        }
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.radius = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
            ctx.fill();
        }
    }

    for (let i = 0; i < 150; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            if (mouse.x != null && mouse.y != null) {
                let dxMouse = mouse.x - particles[i].x;
                let dyMouse = mouse.y - particles[i].y;
                let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                if (distMouse < 250) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(0, 255, 102, ${1 - distMouse/250})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 - distance/200})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

initCyberNexus();