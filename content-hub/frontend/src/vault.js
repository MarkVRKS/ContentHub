// Дефолтные секреты (если база пустая)
const DEFAULT_VAULT = [
    { 
        id: 'v_1', 
        service: 'GOOGLE WORKSPACE (BOSS)', 
        login: 'boss@contentmafia.ru', 
        password: 'SuperSecretPassword123!', 
        tags: 'ПОЧТА, АККАУНТ',
        has2fa: true,
        secret2fa: 'jnal 3ynd b546 d2nh ayts bsqb nely ix3w'
    },
    { 
        id: 'v_2', 
        service: 'INSTAGRAM (СЕМЬЯ)', 
        login: 'content_mafia_main', 
        password: 'BloodAndGold99', 
        tags: 'СОЦСЕТИ, МАРКЕТИНГ',
        has2fa: false,
        secret2fa: ''
    }
];

let currentTagFilter = 'ВСЕ'; // Состояние текущего фильтра

export function initVault() {
    if (!localStorage.getItem('mafia_vault')) {
        localStorage.setItem('mafia_vault', JSON.stringify(DEFAULT_VAULT));
    }
    renderVaultList();
}

export function getVaultData() {
    return JSON.parse(localStorage.getItem('mafia_vault') || '[]');
}

export function saveVaultData(data) {
    localStorage.setItem('mafia_vault', JSON.stringify(data));
}

// Новая функция для переключения фильтра
export function setVaultFilter(tag) {
    currentTagFilter = tag;
    renderVaultList();
}

export function renderVaultList() {
    const container = document.getElementById('vaultListContainer');
    if (!container) return;

    const vault = getVaultData();
    
    // 1. ИЗВЛЕКАЕМ УНИКАЛЬНЫЕ ТЕГИ
    const allTags = new Set();
    vault.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(t => {
                const cleanTag = t.trim().toUpperCase();
                if (cleanTag) allTags.add(cleanTag);
            });
        }
    });
    const uniqueTags = Array.from(allTags).sort();

    // 2. СТРОИМ ПАНЕЛЬ ФИЛЬТРОВ
    let filterHtml = `<div class="vault-filters">`;
    filterHtml += `<button class="filter-btn ${currentTagFilter === 'ВСЕ' ? 'active' : ''}" onclick="window.setVaultFilter('ВСЕ')">ВСЕ СЕКРЕТЫ</button>`;
    uniqueTags.forEach(tag => {
        filterHtml += `<button class="filter-btn ${currentTagFilter === tag ? 'active' : ''}" onclick="window.setVaultFilter('${tag}')">${tag}</button>`;
    });
    filterHtml += `</div>`;

    // 3. ФИЛЬТРУЕМ ДАННЫЕ
    let filteredVault = vault;
    if (currentTagFilter !== 'ВСЕ') {
        filteredVault = vault.filter(item => {
            if (!item.tags) return false;
            const itemTags = item.tags.split(',').map(t => t.trim().toUpperCase());
            return itemTags.includes(currentTagFilter);
        });
    }

    if (vault.length === 0) {
        container.innerHTML = filterHtml + '<div style="text-align: center; color: #666; padding: 30px; font-family: var(--font-mono);">Сейф пуст. Добавьте первый секрет.</div>';
        return;
    } else if (filteredVault.length === 0) {
        container.innerHTML = filterHtml + '<div style="text-align: center; color: #666; padding: 30px; font-family: var(--font-mono);">По фильтру «' + currentTagFilter + '» ничего не найдено.</div>';
        return;
    }

    // 4. РЕНДЕРИМ КАРТОЧКИ
    const cardsHtml = filteredVault.map(item => {
        const mask = "•".repeat(8);
        const tagsHtml = item.tags ? item.tags.split(',').map(t => `<span class="vault-tag">${t.trim()}</span>`).join('') : '';
        
        const tfaHtml = item.has2fa ? `
            <div class="vault-2fa-row">
                <span class="fa-badge">2FA ACTIVE</span>
                <button class="copy-btn" onclick="window.copyToClipboard('${item.secret2fa}', this)">КОПИРОВАТЬ КЛЮЧ 📋</button>
                <button class="btn-goto" onclick="window.openLink('https://www.2-fa.com/ru')">ГЕНЕРАТОР КОДОВ ↗</button>
            </div>
        ` : '';

        return `
            <div class="vault-item">
                <div class="vault-info">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h4>${item.service}</h4>
                        <button class="partner-edit-btn" onclick="window.openVaultModal('${item.id}')">[ ⚙ ]</button>
                    </div>
                    <div class="vault-tags-container">${tagsHtml}</div>
                    
                    <div class="vault-credentials">
                        <div class="cred-row">
                            <span class="cred-label">LOGIN:</span>
                            <span class="cred-value">${item.login}</span>
                            <button class="copy-btn" onclick="window.copyToClipboard('${item.login}', this)">📋</button>
                        </div>
                        <div class="cred-row">
                            <span class="cred-label">PASS:</span>
                            <div class="vault-secret">
                                <span class="secret-text" id="secret-${item.id}">${mask}</span>
                                <button class="decrypt-btn" id="decrypt-btn-${item.id}" onclick="window.requestDecryption('${item.id}', '${item.password}')">DECRYPT 🔓</button>
                                <button class="copy-btn copy-pass-btn" id="copy-pass-${item.id}" style="display:none;" onclick="window.copyToClipboard('${item.password}', this)">📋 КОПИРОВАТЬ</button>
                            </div>
                        </div>
                    </div>
                    ${tfaHtml}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = filterHtml + '<div class="vault-cards-wrapper">' + cardsHtml + '</div>';
}

export function openVaultModal(id = null) {
    const modal = document.getElementById('vault-modal');
    const title = document.getElementById('vm-title');
    const deleteBtn = document.getElementById('vm-delete');
    
    const inpId = document.getElementById('vm-id');
    const inpService = document.getElementById('vm-service');
    const inpLogin = document.getElementById('vm-login');
    const inpPass = document.getElementById('vm-password');
    const inpTags = document.getElementById('vm-tags');
    const chk2fa = document.getElementById('vm-has2fa');
    const inpSecret = document.getElementById('vm-2fa-secret');

    inpService.classList.remove('error');
    inpLogin.classList.remove('error');
    inpPass.classList.remove('error');

    if (id) {
        const item = getVaultData().find(v => v.id === id);
        if (item) {
            title.innerText = 'КОНФИГУРАЦИЯ СЕКРЕТА';
            inpId.value = item.id;
            inpService.value = item.service;
            inpLogin.value = item.login;
            inpPass.value = item.password;
            inpTags.value = item.tags || '';
            chk2fa.checked = item.has2fa;
            inpSecret.value = item.secret2fa || '';
            deleteBtn.style.display = 'block';
        }
    } else {
        title.innerText = 'НОВЫЙ СЕКРЕТ';
        inpId.value = '';
        inpService.value = '';
        inpLogin.value = '';
        inpPass.value = '';
        inpTags.value = '';
        chk2fa.checked = false;
        inpSecret.value = '';
        deleteBtn.style.display = 'none';
    }

    toggle2FAInput();
    modal.classList.add('active');
}

export function closeVaultModal() {
    document.getElementById('vault-modal').classList.remove('active');
}

export function toggle2FAInput() {
    const chk = document.getElementById('vm-has2fa').checked;
    const secretInput = document.getElementById('vm-2fa-secret');
    secretInput.style.display = chk ? 'block' : 'none';
}

export function saveVaultItem() {
    const inpId = document.getElementById('vm-id').value;
    const inpService = document.getElementById('vm-service');
    const inpLogin = document.getElementById('vm-login');
    const inpPass = document.getElementById('vm-password');
    const inpTags = document.getElementById('vm-tags').value;
    const chk2fa = document.getElementById('vm-has2fa').checked;
    const inpSecret = document.getElementById('vm-2fa-secret').value;

    let isValid = true;
    if (!inpService.value.trim()) { inpService.classList.add('error'); isValid = false; } else { inpService.classList.remove('error'); }
    if (!inpLogin.value.trim()) { inpLogin.classList.add('error'); isValid = false; } else { inpLogin.classList.remove('error'); }
    if (!inpPass.value.trim()) { inpPass.classList.add('error'); isValid = false; } else { inpPass.classList.remove('error'); }

    if (!isValid) return;

    let vault = getVaultData();

    if (inpId) {
        const index = vault.findIndex(v => v.id === inpId);
        if (index !== -1) {
            vault[index] = { 
                id: inpId, 
                service: inpService.value.toUpperCase(), 
                login: inpLogin.value, 
                password: inpPass.value,
                tags: inpTags.toUpperCase(),
                has2fa: chk2fa,
                secret2fa: chk2fa ? inpSecret : ''
            };
        }
    } else {
        vault.unshift({
            id: 'v_' + Date.now().toString(36),
            service: inpService.value.toUpperCase(),
            login: inpLogin.value,
            password: inpPass.value,
            tags: inpTags.toUpperCase(),
            has2fa: chk2fa,
            secret2fa: chk2fa ? inpSecret : ''
        });
    }

    saveVaultData(vault);
    renderVaultList();
    closeVaultModal();
}

export function deleteVaultItem() {
    const id = document.getElementById('vm-id').value;
    if (!id) return;

    if (confirm('Уничтожить секрет? Восстановление невозможно.')) {
        let vault = getVaultData();
        vault = vault.filter(v => v.id !== id);
        
        // Сброс фильтра, если мы удалили последний элемент с этим тегом
        currentTagFilter = 'ВСЕ';
        
        saveVaultData(vault);
        renderVaultList();
        closeVaultModal();
    }
}

export function copyToClipboard(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '✔ COPIED';
        btnElement.classList.add('copied');
        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.classList.remove('copied');
        }, 1500);
    });
}